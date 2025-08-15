const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

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
        // Ne planifier que s'il y a eu un bump récent
        if (cfg.lastBumpAt) {
          this.scheduleGuild(cfg.guildId, cfg);
        }
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
      message: 'Il est temps de bump le serveur',
      intervalMs: TWO_HOURS_MS, // 2h fixes
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
    if (!cfg || !cfg.enabled || !cfg.channelId) return;

    // Ne programmer qu'en fonction du dernier bump détecté
    const last = cfg.lastBumpAt ? new Date(cfg.lastBumpAt).getTime() : null;
    if (!last) return;
    const elapsed = Date.now() - last;
    const msLeft = Math.max(0, TWO_HOURS_MS - elapsed);

    const timeoutId = setTimeout(() => this.tickGuild(guildId).catch(() => {}), msLeft);
    this.timers.set(guildId, timeoutId);
  }

  scheduleIn(guildId, ms) {
    this.clearGuildTimer(guildId);
    const timeoutId = setTimeout(() => this.tickGuild(guildId).catch(() => {}), ms);
    this.timers.set(guildId, timeoutId);
  }

  async restartCooldown(guildId, channelId) {
    const cfg = await this.getConfig(guildId);
    const coll = this.dataManager.db?.collection('bumpReminders');
    const now = new Date();

    if (coll) {
      const update = {
        enabled: true,
        intervalMs: TWO_HOURS_MS,
        lastBumpAt: now,
        updatedAt: now
      };
      if (channelId) update.channelId = channelId;
      await coll.updateOne({ guildId }, { $set: update }, { upsert: true }).catch(() => {});
    }

    // Reprogrammer pour 2h après le bump
    this.scheduleIn(guildId, TWO_HOURS_MS);
  }

  formatReminderMessage(guild, cfg) {
    const serverName = guild?.name || 'ce serveur';
    const base = cfg?.message && cfg.message.trim().length > 0
      ? cfg.message
      : 'Il est temps de bump le serveur';

    const variants = [
      `🔞 ${serverName} — ${base} ! Faisons chauffer Disboard 😈`,
      `😈 ${serverName} — ${base}… Montre-nous ta plus belle montée sur Disboard 🔥`,
      `🔥 ${serverName} — ${base} maintenant pour rester au top sur Disboard !`,
      `💋 ${serverName} — ${base} et fais briller ${serverName} sur Disboard ✨`,
      `🌶️ ${serverName} — ${base} ! Un petit coup de chaud sur Disboard ?`
    ];

    // Variante déterministe par serveur pour une "unicité" stable
    const gid = String(guild?.id || '0');
    const idx = gid.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % variants.length;
    return variants[idx];
  }

  async tickGuild(guildId) {
    try {
      const cfg = await this.getConfig(guildId);
      if (!cfg.enabled || !cfg.channelId) return;

      const channel = await this.client.channels.fetch(cfg.channelId).catch(() => null);
      if (!channel) return;

      const guild = this.client.guilds.cache.get(guildId) || channel.guild || null;
      const mention = cfg.roleId ? `<@&${cfg.roleId}> ` : '';
      const content = `${mention}${this.formatReminderMessage(guild, cfg)}`;

      await channel.send({ content });

      // IMPORTANT: ne pas replanifier en boucle; un seul rappel par bump.
      // Réinitialiser l'ancre du dernier bump pour éviter la reprogrammation au redémarrage
      if (this.dataManager.db) {
        try {
          await this.dataManager.db.collection('bumpReminders').updateOne(
            { guildId },
            { $set: { lastBumpAt: null, updatedAt: new Date() } },
            { upsert: true }
          );
        } catch {}
      }

      this.clearGuildTimer(guildId);
    } catch (e) {
      console.error('❌ Reminder tick error:', e);
    }
  }
}

module.exports = ReminderManager;