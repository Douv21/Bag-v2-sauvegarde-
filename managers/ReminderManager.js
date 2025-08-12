const { Collection } = require('discord.js');

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

  async tickGuild(guildId) {
    try {
      const cfg = await this.getConfig(guildId);
      if (!cfg.enabled || !cfg.channelId) return;

      const channel = await this.client.channels.fetch(cfg.channelId).catch(() => null);
      if (!channel) return;

      const mention = cfg.roleId ? `<@&${cfg.roleId}> ` : '';
      const content = `${mention}${cfg.message}`;
      await channel.send({ content });

      // replanifier
      this.scheduleGuild(guildId, cfg);
    } catch (e) {
      console.error('❌ Reminder tick error:', e);
    }
  }
}

module.exports = ReminderManager;