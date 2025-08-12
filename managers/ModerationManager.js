const { PermissionsBitField, ChannelType, Collection } = require('discord.js');
const path = require('path');

class ModerationManager {
  constructor(dataManager, client) {
    this.dataManager = dataManager;
    this.client = client;
    this.scheduler = null;
  }

  getDefaultGuildConfig(guildId) {
    return {
      guildId,
      logsChannelId: null,
      // Enforce required role after grace period
      roleEnforcement: {
        enabled: false,
        requiredRoleId: null,
        gracePeriodMs: 7 * 24 * 60 * 60 * 1000 // 7 jours
      },
      // Auto-kick for inactivity
      inactivity: {
        enabled: false,
        thresholdMs: 30 * 24 * 60 * 60 * 1000, // 30 jours
        exemptRoleIds: []
      },
      // Mute defaults
      mute: {
        defaultDurationMs: 60 * 60 * 1000 // 1h
      }
    };
  }

  async getGuildConfig(guildId) {
    const config = await this.dataManager.getData('moderation_config');
    return config[guildId] || this.getDefaultGuildConfig(guildId);
  }

  async setGuildConfig(guildId, updates) {
    const config = await this.dataManager.getData('moderation_config');
    config[guildId] = { ...(config[guildId] || this.getDefaultGuildConfig(guildId)), ...updates };
    await this.dataManager.saveData('moderation_config', config);
    return config[guildId];
  }

  async addWarning(guildId, userId, moderatorId, reason) {
    const warnings = await this.dataManager.getData('warnings');
    if (!warnings[guildId]) warnings[guildId] = {};
    if (!warnings[guildId][userId]) warnings[guildId][userId] = [];
    warnings[guildId][userId].push({
      reason: reason || 'Aucun motif fourni',
      moderatorId,
      timestamp: Date.now()
    });
    await this.dataManager.saveData('warnings', warnings);
    return warnings[guildId][userId];
  }

  async removeLastWarning(guildId, userId) {
    const warnings = await this.dataManager.getData('warnings');
    if (!warnings[guildId] || !warnings[guildId][userId] || warnings[guildId][userId].length === 0) {
      return null;
    }
    const removed = warnings[guildId][userId].pop();
    await this.dataManager.saveData('warnings', warnings);
    return removed;
  }

  async getWarnings(guildId, userId) {
    const warnings = await this.dataManager.getData('warnings');
    return warnings[guildId]?.[userId] || [];
  }

  async muteMember(member, durationMs, reason) {
    const ms = Math.min(Math.max(durationMs || 0, 0), 28 * 24 * 60 * 60 * 1000); // Max 28 jours
    await member.timeout(ms > 0 ? ms : 60 * 1000, reason || 'Muted');
  }

  async unmuteMember(member, reason) {
    await member.timeout(null, reason || 'Unmuted');
  }

  async purgeChannel(channel, options = { resetFeatures: true }) {
    // Bulk delete messages in batches (cannot delete >14 days old)
    try {
      let fetched;
      do {
        fetched = await channel.messages.fetch({ limit: 100 }).catch(() => new Collection());
        const deletable = fetched.filter(m => (Date.now() - m.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);
        if (deletable.size > 0) {
          await channel.bulkDelete(deletable, true).catch(() => {});
        }
      } while (fetched && fetched.size >= 2);
    } catch (e) {
      // ignore errors for older messages
    }

    if (options.resetFeatures) {
      await this.restoreChannelFeatures(channel.guild.id, channel.id);
    }
  }

  async restoreChannelFeatures(guildId, channelId) {
    // Reset counting state for this channel
    try {
      const counting = await this.dataManager.getData('counting');
      const guildCfg = counting[guildId];
      if (guildCfg && Array.isArray(guildCfg.channels)) {
        const idx = guildCfg.channels.findIndex(c => c.channelId === channelId);
        if (idx !== -1) {
          guildCfg.channels[idx] = {
            ...guildCfg.channels[idx],
            current: 0,
            record: guildCfg.channels[idx].record || 0,
            lastUser: null,
            lastNumber: 0,
            currentNumber: 0,
            lastUserId: null,
            lastMessageId: null,
            lastTimestamp: new Date().toISOString()
          };
          await this.dataManager.saveData('counting', counting);
        }
      }
    } catch {}

    // Ensure confession config remains unchanged (nothing to reset besides keeping channels)
    try {
      const config = await this.dataManager.getData('config');
      const confessionCfg = config.confessions?.[guildId];
      if (confessionCfg) {
        // keep as-is; nothing else to do for now
        await this.dataManager.saveData('config', config);
      }
    } catch {}

    // AutoThread config is stored under config.autoThread and utils/autothread.json
    try {
      const config = await this.dataManager.getData('config');
      const autoThreadGuild = config.autoThread?.[guildId];
      if (autoThreadGuild) {
        // Ensure channel remains in list if it was already there
        if (!Array.isArray(autoThreadGuild.channels)) autoThreadGuild.channels = [];
        if (!autoThreadGuild.channels.includes(channelId)) {
          autoThreadGuild.channels.push(channelId);
        }
        await this.dataManager.saveData('config', config);
      }
    } catch {}

    try {
      const autoThreadFile = await this.dataManager.loadData('autothread.json', {});
      if (!autoThreadFile[guildId]) return;
      // nothing specific to reset, keep stats as-is
      await this.dataManager.saveRawFile('autothread.json', autoThreadFile);
    } catch {}
  }

  async recordJoin(guildId, userId) {
    const state = await this.dataManager.getData('moderation_state');
    if (!state[guildId]) state[guildId] = {};
    if (!state[guildId][userId]) state[guildId][userId] = {};
    state[guildId][userId].joinedAt = Date.now();
    await this.dataManager.saveData('moderation_state', state);
  }

  async markActive(guildId, userId) {
    const stats = await this.dataManager.getData('user_stats');
    if (!stats[guildId]) stats[guildId] = {};
    if (!stats[guildId][userId]) stats[guildId][userId] = { messageCount: 0, lastMessage: 0 };
    stats[guildId][userId].lastMessage = Date.now();
    await this.dataManager.saveData('user_stats', stats);
  }

  async checkAllGuilds() {
    for (const guild of this.client.guilds.cache.values()) {
      await this.checkGuild(guild).catch(err => console.error('Moderation check error:', err));
    }
  }

  async checkGuild(guild) {
    const cfg = await this.getGuildConfig(guild.id);
    const now = Date.now();

    // Role enforcement
    if (cfg.roleEnforcement?.enabled && cfg.roleEnforcement.requiredRoleId && cfg.roleEnforcement.gracePeriodMs > 0) {
      const state = await this.dataManager.getData('moderation_state');
      const gState = state[guild.id] || {};
      const members = await guild.members.fetch();
      for (const member of members.values()) {
        if (member.user.bot) continue;
        if (member.permissions.has(PermissionsBitField.Flags.Administrator)) continue;
        const hasRole = member.roles.cache.has(cfg.roleEnforcement.requiredRoleId);
        if (hasRole) continue;
        const joinInfo = gState[member.id];
        const joinedAtTs = joinInfo?.joinedAt || member.joinedTimestamp || now;
        if (now - joinedAtTs >= cfg.roleEnforcement.gracePeriodMs) {
          await this.safeKick(member, `[Auto] Rôle requis manquant après délai`);
        }
      }
    }

    // Inactivity check
    if (cfg.inactivity?.enabled && cfg.inactivity.thresholdMs > 0) {
      const threshold = now - cfg.inactivity.thresholdMs;
      const stats = await this.dataManager.getData('user_stats');
      const gStats = stats[guild.id] || {};
      const members = await guild.members.fetch();
      for (const member of members.values()) {
        if (member.user.bot) continue;
        if (member.permissions.has(PermissionsBitField.Flags.Administrator)) continue;
        if (cfg.inactivity.exemptRoleIds?.some(r => member.roles.cache.has(r))) continue;
        const last = gStats[member.id]?.lastMessage || member.joinedTimestamp || 0;
        if (last > 0 && last < threshold) {
          await this.safeKick(member, `[Auto] Inactivité prolongée`);
        }
      }
    }
  }

  async safeKick(member, reason) {
    try {
      await member.send(`Vous avez été exclu de ${member.guild.name} : ${reason}`).catch(() => {});
      await member.kick(reason).catch(() => {});
    } catch {}
  }

  startScheduler(intervalMs = 60 * 60 * 1000) {
    if (this.scheduler) clearInterval(this.scheduler);
    this.scheduler = setInterval(() => this.checkAllGuilds().catch(() => {}), intervalMs);
  }

  stopScheduler() {
    if (this.scheduler) clearInterval(this.scheduler);
    this.scheduler = null;
  }
}

module.exports = ModerationManager;