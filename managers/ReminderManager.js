const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ReminderManager {
  constructor(dataManager, client) {
    this.dataManager = dataManager;
    this.client = client;
    this.timers = new Map(); // guildId -> timeoutId
  }

  async initialize() {
    if (!this.dataManager.db) {
      console.log('⚠️ MongoDB non connecté - les rappels de bump ne seront pas persistés');
      return;
    }
    try {
      const coll = this.dataManager.db.collection('bumpReminders');
      await coll.createIndex({ guildId: 1 }, { unique: true });

      const all = await coll.find({ enabled: true }).toArray();
      for (const cfg of all) {
        this.scheduleGuild(cfg.guildId, cfg);
      }
      console.log(`🔔 Rappels de bump initialisés pour ${all.length} serveur(s)`);
    } catch (e) {
      console.error('❌ ReminderManager initialize error:', e);
    }
  }

  getDefaultConfig(guildId) {
    return {
      guildId,
      enabled: false,
      channelId: null,
      roleId: null,
      message: 'Il est temps de bumper le serveur avec DISBOARD: utilisez /bump dans ce canal.',
      intervalMs: 2 * 60 * 60 * 1000, // 2h par défaut (Disboard)
      lastBumpAt: null,
      updatedAt: new Date()
    };
  }

  async getConfig(guildId) {
    try {
      if (!this.dataManager.db) return this.getDefaultConfig(guildId);
      const cfg = await this.dataManager.db.collection('bumpReminders').findOne({ guildId });
      return cfg || this.getDefaultConfig(guildId);
    } catch (e) {
      console.error('❌ ReminderManager getConfig error:', e);
      return this.getDefaultConfig(guildId);
    }
  }

  async updateConfig(guildId, updates) {
    try {
      if (!this.dataManager.db) return false;
      const coll = this.dataManager.db.collection('bumpReminders');
      await coll.updateOne(
        { guildId },
        { $set: { ...updates, guildId, updatedAt: new Date() } },
        { upsert: true }
      );

      const cfg = await coll.findOne({ guildId });
      // rescheduler si nécessaire
      this.scheduleGuild(guildId, cfg);
      return true;
    } catch (e) {
      console.error('❌ ReminderManager updateConfig error:', e);
      return false;
    }
  }

  clearGuildTimer(guildId) {
    const t = this.timers.get(guildId);
    if (t) {
      clearTimeout(t);
      this.timers.delete(guildId);
    }
  }

  scheduleGuild(guildId, cfg) {
    this.clearGuildTimer(guildId);
    if (!cfg || !cfg.enabled || !cfg.channelId || !cfg.intervalMs) return;

    const timeoutId = setTimeout(() => this.tickGuild(guildId).catch(() => {}), cfg.intervalMs);
    this.timers.set(guildId, timeoutId);
  }

  scheduleIn(guildId, ms) {
    this.clearGuildTimer(guildId);
    const timeoutId = setTimeout(() => this.tickGuild(guildId).catch(() => {}), ms);
    this.timers.set(guildId, timeoutId);
  }

  async restartCooldown(guildId) {
    const cfg = await this.getConfig(guildId);
    const coll = this.dataManager.db?.collection('bumpReminders');
    const now = new Date();
    if (coll) {
      await coll.updateOne({ guildId }, { $set: { lastBumpAt: now, updatedAt: now } }, { upsert: true }).catch(() => {});
    }
    this.scheduleIn(guildId, cfg.intervalMs || 2 * 60 * 60 * 1000);
  }

  async tickGuild(guildId) {
    try {
      const cfg = await this.getConfig(guildId);
      if (!cfg.enabled || !cfg.channelId) return;

      const channel = await this.client.channels.fetch(cfg.channelId).catch(() => null);
      if (!channel) return;

      const mention = cfg.roleId ? `<@&${cfg.roleId}> ` : '';
      const content = `${mention}${cfg.message}`;

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`bump_reminder_done_${guildId}`)
          .setLabel("J'ai bumpé")
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`bump_reminder_info_${guildId}`)
          .setLabel('Instructions')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📢')
      );

      await channel.send({ content, components: [buttons] });

      // replanifier
      this.scheduleGuild(guildId, cfg);
    } catch (e) {
      console.error('❌ Reminder tick error:', e);
    }
  }
}

module.exports = ReminderManager;