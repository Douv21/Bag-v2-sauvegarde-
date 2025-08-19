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
        requiredRoleId: null, // compat ancien
        requiredRoleName: null, // nouveau
        gracePeriodMs: 7 * 24 * 60 * 60 * 1000 // 7 jours
      },
      // Auto-kick for inactivity
      inactivity: {
        enabled: false,
        thresholdMs: 30 * 24 * 60 * 60 * 1000, // 30 jours
        exemptRoleIds: [], // compat ancien
        exemptRoleNames: [], // nouveau
        autoExemptRoleId: null,
        autoExemptRoleName: null
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

    // Ajouter à l'historique global cross-serveur
    await this.addToGlobalHistory(userId, guildId, 'warn', reason, moderatorId);

    try {
      const guild = this.client.guilds.cache.get(guildId);
      const targetUser = await this.client.users.fetch(userId).catch(() => null);
      const moderatorUser = moderatorId ? await this.client.users.fetch(moderatorId).catch(() => null) : null;
      if (guild && targetUser && this.client.logManager) {
        await this.client.logManager.logWarn(guild, targetUser, moderatorUser, reason);
      }
    } catch {}

    return warnings[guildId][userId];
  }

    async removeLastWarning(guildId, userId) {
    const warnings = await this.dataManager.getData('warnings');
    if (!warnings[guildId] || !warnings[guildId][userId] || warnings[guildId][userId].length === 0) {
      return null;
    }
    const removed = warnings[guildId][userId].pop();
    await this.dataManager.saveData('warnings', warnings);
    // Optionnel: log remove warn (non requis)
    return removed;
  }

  async getWarnings(guildId, userId) {
    const warnings = await this.dataManager.getData('warnings');
    return warnings[guildId]?.[userId] || [];
  }

    async muteMember(member, durationMs, reason, moderatorUser = null) {
    const ms = Math.min(Math.max(durationMs || 0, 0), 28 * 24 * 60 * 60 * 1000); // Max 28 jours
    await member.timeout(ms > 0 ? ms : 60 * 1000, reason || 'Muted');
    
    // Ajouter à l'historique global
    try {
      await this.addMuteToHistory(member.user.id, member.guild.id, reason, moderatorUser?.id, ms);
    } catch {}
    
    try { if (this.client.logManager) await this.client.logManager.logMute(member, moderatorUser, ms, reason); } catch {}
  }

    async unmuteMember(member, reason, moderatorUser = null) {
    await member.timeout(null, reason || 'Unmuted');
    try { if (this.client.logManager) await this.client.logManager.logUnmute(member, moderatorUser, reason); } catch {}
  }

    async purgeChannel(channel, options = { resetFeatures: true }, moderatorUser = null) {
    // Bulk delete messages in batches (cannot delete >14 days old)
    let totalDeleted = 0;
    try {
      let fetched;
      do {
        fetched = await channel.messages.fetch({ limit: 100 }).catch(() => new Collection());
        const deletable = fetched.filter(m => (Date.now() - m.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);
        if (deletable.size > 0) {
          await channel.bulkDelete(deletable, true).catch(() => {});
          totalDeleted += deletable.size;
        }
      } while (fetched && fetched.size >= 2);
    } catch (e) {
      // ignore errors for older messages
    }

    try { if (this.client.logManager) await this.client.logManager.logPurge(channel, moderatorUser || channel.guild?.members.me?.user || null, totalDeleted); } catch {}

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

    // Retirer automatiquement le rôle d'exemption d'inactivité si configuré
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) return;
      const cfg = await this.getGuildConfig(guildId);
      let autoRoleId = cfg.inactivity?.autoExemptRoleId || null;
      if (!autoRoleId && cfg.inactivity?.autoExemptRoleName) {
        autoRoleId = this.resolveRoleByName(guild, cfg.inactivity.autoExemptRoleName)?.id || null;
      }
      if (!autoRoleId) return;
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) return;
      if (member.roles.cache.has(autoRoleId)) {
        await member.roles.remove(autoRoleId, 'Retrait automatique: activité détectée').catch(() => {});
      }
    } catch {}
  }

  resolveRoleByName(guild, roleName) {
    if (!guild || !roleName) return null;
    const exact = guild.roles.cache.find(r => r.name === roleName);
    if (exact) return exact;
    const ci = guild.roles.cache.find(r => r.name.toLowerCase() === String(roleName).toLowerCase());
    return ci || null;
  }

  async checkAllGuilds() {
    for (const guild of this.client.guilds.cache.values()) {
      await this.checkGuild(guild).catch(err => console.error('Moderation check error:', err));
    }
  }

  async checkGuild(guild) {
    const cfg = await this.getGuildConfig(guild.id);
    const now = Date.now();

    // Préparer rôles requis/exemptés (IDs à partir du nom si nécessaire)
    let requiredRoleId = cfg.roleEnforcement?.requiredRoleId || null;
    if (!requiredRoleId && cfg.roleEnforcement?.requiredRoleName) {
      requiredRoleId = this.resolveRoleByName(guild, cfg.roleEnforcement.requiredRoleName)?.id || null;
    }

    const exemptRoleIdList = Array.isArray(cfg.inactivity?.exemptRoleIds) ? [...cfg.inactivity.exemptRoleIds] : [];
    if (Array.isArray(cfg.inactivity?.exemptRoleNames) && cfg.inactivity.exemptRoleNames.length > 0) {
      for (const name of cfg.inactivity.exemptRoleNames) {
        const r = this.resolveRoleByName(guild, name);
        if (r && !exemptRoleIdList.includes(r.id)) exemptRoleIdList.push(r.id);
      }
    }
    // Inclure le rôle d'exemption automatique s'il est configuré
    let autoExemptRoleId = cfg.inactivity?.autoExemptRoleId || null;
    if (!autoExemptRoleId && cfg.inactivity?.autoExemptRoleName) {
      autoExemptRoleId = this.resolveRoleByName(guild, cfg.inactivity.autoExemptRoleName)?.id || null;
    }
    if (autoExemptRoleId && !exemptRoleIdList.includes(autoExemptRoleId)) {
      exemptRoleIdList.push(autoExemptRoleId);
    }

    // Role enforcement
    if (cfg.roleEnforcement?.enabled && requiredRoleId && cfg.roleEnforcement.gracePeriodMs > 0) {
      const state = await this.dataManager.getData('moderation_state');
      const gState = state[guild.id] || {};
      const members = await guild.members.fetch();
      for (const member of members.values()) {
        if (member.user.bot) continue;
        if (member.permissions.has(PermissionsBitField.Flags.Administrator)) continue;
        const hasRole = member.roles.cache.has(requiredRoleId);
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
        if (exemptRoleIdList.some(rid => member.roles.cache.has(rid))) continue;
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
      
      // Ajouter à l'historique global
      try {
        await this.addKickToHistory(member.user.id, member.guild.id, reason, null);
      } catch {}
      
      try { if (this.client.logManager) await this.client.logManager.logKick(member, null, reason); } catch {}
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

  // ========== MÉTHODES POUR L'HISTORIQUE CROSS-SERVEUR ==========

  /**
   * Ajouter une action de modération à l'historique global
   * @param {string} userId - ID de l'utilisateur
   * @param {string} guildId - ID du serveur
   * @param {string} type - Type d'action ('warn', 'ban', 'kick', 'mute')
   * @param {string} reason - Raison de l'action
   * @param {string} moderatorId - ID du modérateur
   */
  async addToGlobalHistory(userId, guildId, type, reason, moderatorId) {
    try {
      const history = await this.dataManager.getData('global_moderation_history');
      if (!history[userId]) history[userId] = [];
      
      const guild = this.client.guilds.cache.get(guildId);
      const guildName = guild ? guild.name : `Serveur inconnu (${guildId})`;
      
      history[userId].push({
        type,
        reason: reason || 'Aucun motif fourni',
        moderatorId,
        guildId,
        guildName,
        timestamp: Date.now()
      });

      await this.dataManager.saveData('global_moderation_history', history);
    } catch (error) {
      console.error('Erreur lors de l\'ajout à l\'historique global:', error);
    }
  }

  /**
   * Récupérer l'historique de modération global d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Array} Historique de modération
   */
  async getGlobalModerationHistory(userId) {
    try {
      const history = await this.dataManager.getData('global_moderation_history');
      return history[userId] || [];
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique global:', error);
      return [];
    }
  }

  /**
   * Ajouter un ban à l'historique global
   * @param {string} userId - ID de l'utilisateur banni
   * @param {string} guildId - ID du serveur
   * @param {string} reason - Raison du ban
   * @param {string} moderatorId - ID du modérateur
   */
  async addBanToHistory(userId, guildId, reason, moderatorId) {
    await this.addToGlobalHistory(userId, guildId, 'ban', reason, moderatorId);
  }

  /**
   * Ajouter un kick à l'historique global
   * @param {string} userId - ID de l'utilisateur kické
   * @param {string} guildId - ID du serveur
   * @param {string} reason - Raison du kick
   * @param {string} moderatorId - ID du modérateur
   */
  async addKickToHistory(userId, guildId, reason, moderatorId) {
    await this.addToGlobalHistory(userId, guildId, 'kick', reason, moderatorId);
  }

  /**
   * Ajouter un mute à l'historique global
   * @param {string} userId - ID de l'utilisateur muté
   * @param {string} guildId - ID du serveur
   * @param {string} reason - Raison du mute
   * @param {string} moderatorId - ID du modérateur
   * @param {number} duration - Durée en millisecondes
   */
  async addMuteToHistory(userId, guildId, reason, moderatorId, duration) {
    await this.addToGlobalHistory(userId, guildId, 'mute', `${reason} (Durée: ${this.formatDuration(duration)})`, moderatorId);
  }

  /**
   * Formater une durée en millisecondes en texte lisible
   * @param {number} ms - Durée en millisecondes
   * @returns {string} Durée formatée
   */
  formatDuration(ms) {
    if (!ms || ms <= 0) return 'Permanent';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}j ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

module.exports = ModerationManager;