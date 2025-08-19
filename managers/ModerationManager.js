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

  /**
   * Récupérer l'historique de modération d'un utilisateur via Discord Audit Log
   * @param {Guild} guild - Le serveur Discord
   * @param {string} userId - ID de l'utilisateur
   * @returns {Object} Historique de modération du serveur
   */
  async getDiscordAuditHistory(guild, userId) {
    try {
      const history = {
        bans: [],
        kicks: [],
        mutes: [],
        warnings: [] // Note: Discord ne track pas les warnings dans l'audit log
      };

      // Vérifier les permissions
      if (!guild.members.me?.permissions.has('ViewAuditLog')) {
        console.warn('❌ Permission ViewAuditLog manquante pour récupérer l\'audit log');
        return history;
      }

      // Récupérer les bans (90 derniers jours maximum)
      try {
        const banLogs = await guild.fetchAuditLogs({
          type: 22, // MEMBER_BAN_ADD
          limit: 100
        });

        for (const entry of banLogs.entries.values()) {
          if (entry.target?.id === userId) {
            history.bans.push({
              action: 'ban',
              reason: entry.reason || 'Aucune raison fournie',
              executor: entry.executor?.tag || 'Inconnu',
              executorId: entry.executor?.id || null,
              timestamp: entry.createdTimestamp,
              source: 'Discord Audit Log'
            });
          }
        }
      } catch (error) {
        console.error('Erreur récupération bans audit log:', error);
      }

      // Récupérer les kicks
      try {
        const kickLogs = await guild.fetchAuditLogs({
          type: 20, // MEMBER_KICK
          limit: 100
        });

        for (const entry of kickLogs.entries.values()) {
          if (entry.target?.id === userId) {
            history.kicks.push({
              action: 'kick',
              reason: entry.reason || 'Aucune raison fournie',
              executor: entry.executor?.tag || 'Inconnu',
              executorId: entry.executor?.id || null,
              timestamp: entry.createdTimestamp,
              source: 'Discord Audit Log'
            });
          }
        }
      } catch (error) {
        console.error('Erreur récupération kicks audit log:', error);
      }

      // Récupérer les timeouts/mutes
      try {
        const timeoutLogs = await guild.fetchAuditLogs({
          type: 24, // MEMBER_UPDATE (pour les timeouts)
          limit: 100
        });

        for (const entry of timeoutLogs.entries.values()) {
          if (entry.target?.id === userId && entry.changes) {
            // Vérifier si c'est un timeout
            const timeoutChange = entry.changes.find(change => 
              change.key === 'communication_disabled_until'
            );
            
            if (timeoutChange && timeoutChange.new) {
              history.mutes.push({
                action: 'mute',
                reason: entry.reason || 'Aucune raison fournie',
                executor: entry.executor?.tag || 'Inconnu',
                executorId: entry.executor?.id || null,
                timestamp: entry.createdTimestamp,
                source: 'Discord Audit Log',
                duration: timeoutChange.new
              });
            }
          }
        }
      } catch (error) {
        console.error('Erreur récupération mutes audit log:', error);
      }

      return history;
    } catch (error) {
      console.error('Erreur générale audit log:', error);
      return { bans: [], kicks: [], mutes: [], warnings: [] };
    }
  }

  // ========== SYSTÈME DE SÉCURITÉ ET DÉTECTION DE RISQUES ==========

  /**
   * Analyser le niveau de risque d'un membre
   * @param {Guild} guild - Le serveur Discord
   * @param {User} user - L'utilisateur à analyser
   * @returns {Object} Analyse de sécurité complète
   */
  async analyzeUserSecurity(guild, user) {
    try {
      const analysis = {
        userId: user.id,
        username: user.tag,
        riskLevel: 'LOW', // LOW, MEDIUM, HIGH, CRITICAL
        riskScore: 0, // 0-100
        flags: [],
        details: {},
        recommendations: []
      };

      // 1. Analyse du compte Discord
      const accountAge = Date.now() - user.createdTimestamp;
      const accountAgeDays = Math.floor(accountAge / (1000 * 60 * 60 * 24));
      
      analysis.details.accountAge = {
        days: accountAgeDays,
        created: new Date(user.createdTimestamp).toLocaleDateString('fr-FR')
      };

      // Compte très récent = risque
      if (accountAgeDays < 7) {
        analysis.riskScore += 30;
        analysis.flags.push('🚨 Compte très récent (< 7 jours)');
      } else if (accountAgeDays < 30) {
        analysis.riskScore += 15;
        analysis.flags.push('⚠️ Compte récent (< 30 jours)');
      }

      // 2. Analyse du profil
      if (!user.avatar) {
        analysis.riskScore += 10;
        analysis.flags.push('👤 Pas d\'avatar personnalisé');
      }

      // Nom d'utilisateur suspect
      const suspiciousPatterns = [
        /discord/i, /admin/i, /mod/i, /bot/i, /official/i,
        /\d{4,}/, // Beaucoup de chiffres
        /(.)\1{3,}/, // Caractères répétés
        /[^\w\s-]/g // Caractères spéciaux excessifs
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(user.username)) {
          analysis.riskScore += 5;
          analysis.flags.push('📝 Nom d\'utilisateur suspect');
          break;
        }
      }

      // 3. Historique de modération global (notre bot)
      const globalHistory = await this.getGlobalModerationHistory(user.id);
      analysis.details.globalHistory = globalHistory;

      if (globalHistory.length > 0) {
        const bans = globalHistory.filter(h => h.type === 'ban').length;
        const kicks = globalHistory.filter(h => h.type === 'kick').length;
        const warns = globalHistory.filter(h => h.type === 'warn').length;
        const mutes = globalHistory.filter(h => h.type === 'mute').length;

        analysis.details.moderationStats = { bans, kicks, warns, mutes };

        // Calcul du score basé sur l'historique
        analysis.riskScore += bans * 25; // Ban = très grave
        analysis.riskScore += kicks * 15; // Kick = grave
        analysis.riskScore += warns * 5;  // Warn = modéré
        analysis.riskScore += mutes * 8;  // Mute = modéré-grave

        if (bans > 0) {
          analysis.flags.push(`🔨 ${bans} ban(s) sur d'autres serveurs`);
        }
        if (kicks > 2) {
          analysis.flags.push(`👢 ${kicks} kick(s) répétés`);
        }
        if (warns > 5) {
          analysis.flags.push(`⚠️ ${warns} avertissement(s) accumulés`);
        }
      }

      // 4. Historique Discord Audit Log (serveur actuel)
      const auditHistory = await this.getDiscordAuditHistory(guild, user.id);
      analysis.details.auditHistory = auditHistory;

      const totalAuditActions = auditHistory.bans.length + auditHistory.kicks.length + auditHistory.mutes.length;
      if (totalAuditActions > 0) {
        analysis.riskScore += auditHistory.bans.length * 20;
        analysis.riskScore += auditHistory.kicks.length * 12;
        analysis.riskScore += auditHistory.mutes.length * 6;

        if (auditHistory.bans.length > 0) {
          analysis.flags.push(`🔨 ${auditHistory.bans.length} ban(s) sur ce serveur`);
        }
        if (auditHistory.kicks.length > 1) {
          analysis.flags.push(`👢 ${auditHistory.kicks.length} kick(s) sur ce serveur`);
        }
      }

      // 5. Analyse du comportement sur le serveur
      const member = await guild.members.fetch(user.id).catch(() => null);
      if (member) {
        const joinAge = Date.now() - member.joinedTimestamp;
        const joinAgeDays = Math.floor(joinAge / (1000 * 60 * 60 * 24));
        
        analysis.details.serverJoin = {
          days: joinAgeDays,
          joined: new Date(member.joinedTimestamp).toLocaleDateString('fr-FR')
        };

        // Membre qui rejoint/quitte souvent
        if (joinAgeDays < 1) {
          analysis.riskScore += 5;
          analysis.flags.push('🆕 Nouveau membre (< 24h)');
        }

        // Vérifier les rôles suspects ou manque de rôles
        if (member.roles.cache.size <= 1) { // Seulement @everyone
          analysis.riskScore += 3;
          analysis.flags.push('🎭 Aucun rôle attribué');
        }
      }

      // 6. Déterminer le niveau de risque final
      if (analysis.riskScore >= 70) {
        analysis.riskLevel = 'CRITICAL';
        analysis.recommendations.push('🚨 Surveillance immédiate recommandée');
        analysis.recommendations.push('🔒 Considérer un ban préventif');
      } else if (analysis.riskScore >= 45) {
        analysis.riskLevel = 'HIGH';
        analysis.recommendations.push('⚠️ Surveillance renforcée');
        analysis.recommendations.push('🎭 Limiter les permissions');
      } else if (analysis.riskScore >= 20) {
        analysis.riskLevel = 'MEDIUM';
        analysis.recommendations.push('👀 Surveillance normale');
        analysis.recommendations.push('📋 Vérifier régulièrement');
      } else {
        analysis.riskLevel = 'LOW';
        analysis.recommendations.push('✅ Membre semble fiable');
      }

      return analysis;
    } catch (error) {
      console.error('Erreur analyse sécurité:', error);
      return {
        userId: user.id,
        username: user.tag,
        riskLevel: 'UNKNOWN',
        riskScore: 0,
        flags: ['❌ Erreur lors de l\'analyse'],
        details: {},
        recommendations: ['🔧 Réessayer l\'analyse']
      };
    }
  }

  /**
   * Vérifier si un membre présente des signes de raid/spam
   * @param {Guild} guild - Le serveur Discord
   * @param {User} user - L'utilisateur à vérifier
   * @returns {Object} Analyse anti-raid
   */
  async checkRaidIndicators(guild, user) {
    const indicators = {
      isRaidSuspect: false,
      confidence: 0,
      reasons: []
    };

    try {
      // 1. Compte très récent
      const accountAge = Date.now() - user.createdTimestamp;
      const accountAgeMinutes = Math.floor(accountAge / (1000 * 60));
      
      if (accountAgeMinutes < 60) {
        indicators.confidence += 40;
        indicators.reasons.push('Compte créé il y a moins d\'1 heure');
      } else if (accountAgeMinutes < 1440) { // 24h
        indicators.confidence += 20;
        indicators.reasons.push('Compte créé il y a moins de 24h');
      }

      // 2. Nom générique ou pattern de bot
      const genericPatterns = [
        /^[a-z]+\d{3,}$/i, // lettres + chiffres
        /^user\d+$/i,
        /^member\d+$/i,
        /^test\d+$/i,
        /^discord/i
      ];

      for (const pattern of genericPatterns) {
        if (pattern.test(user.username)) {
          indicators.confidence += 25;
          indicators.reasons.push('Nom d\'utilisateur générique/suspect');
          break;
        }
      }

      // 3. Pas d'avatar = souvent des comptes jetables
      if (!user.avatar) {
        indicators.confidence += 15;
        indicators.reasons.push('Aucun avatar personnalisé');
      }

      // 4. Vérifier les jointures récentes similaires
      const recentJoins = await this.getRecentJoins(guild, 60); // 1 heure
      const similarAccounts = recentJoins.filter(member => {
        const otherAge = Date.now() - member.user.createdTimestamp;
        const otherAgeMinutes = Math.floor(otherAge / (1000 * 60));
        return otherAgeMinutes < 1440 && member.user.id !== user.id; // Comptes < 24h
      });

      if (similarAccounts.length >= 3) {
        indicators.confidence += 30;
        indicators.reasons.push(`${similarAccounts.length} autres comptes récents ont rejoint récemment`);
      }

      indicators.isRaidSuspect = indicators.confidence >= 50;

      return indicators;
    } catch (error) {
      console.error('Erreur vérification raid:', error);
      return indicators;
    }
  }

  /**
   * Récupérer les membres qui ont rejoint récemment
   * @param {Guild} guild - Le serveur Discord
   * @param {number} minutesAgo - Minutes en arrière
   * @returns {Array} Liste des membres récents
   */
  async getRecentJoins(guild, minutesAgo = 60) {
    try {
      const cutoff = Date.now() - (minutesAgo * 60 * 1000);
      const members = await guild.members.fetch();
      
      return members.filter(member => 
        member.joinedTimestamp && member.joinedTimestamp > cutoff
      ).map(member => ({
        user: member.user,
        joinedAt: member.joinedTimestamp
      }));
    } catch (error) {
      console.error('Erreur récupération membres récents:', error);
      return [];
    }
  }

  /**
   * Détecter les potentiels multi-comptes d'un utilisateur
   * @param {Guild} guild - Le serveur Discord
   * @param {User} user - L'utilisateur à analyser
   * @returns {Object} Analyse des multi-comptes
   */
  async detectMultiAccounts(guild, user) {
    try {
      const analysis = {
        suspiciousAccounts: [],
        confidence: 0,
        indicators: [],
        totalSuspects: 0
      };

      const members = await guild.members.fetch();
      const targetMember = members.get(user.id);
      if (!targetMember) return analysis;

      // 1. Recherche par similarité de noms
      const username = user.username.toLowerCase();
      const displayName = user.displayName?.toLowerCase() || username;
      
      for (const [memberId, member] of members) {
        if (memberId === user.id) continue; // Ignorer l'utilisateur lui-même
        
        const otherUsername = member.user.username.toLowerCase();
        const otherDisplayName = member.user.displayName?.toLowerCase() || otherUsername;
        
        let similarity = 0;
        let reasons = [];

        // Noms très similaires
        if (this.calculateStringSimilarity(username, otherUsername) > 0.7) {
          similarity += 30;
          reasons.push('Nom d\'utilisateur très similaire');
        }

        // Noms avec patterns (user1, user2, etc.)
        const numberPattern = /\d+$/;
        const baseUsername = username.replace(numberPattern, '');
        const otherBaseUsername = otherUsername.replace(numberPattern, '');
        
        if (baseUsername.length > 3 && baseUsername === otherBaseUsername) {
          similarity += 25;
          reasons.push('Pattern de nom identique avec numéros différents');
        }

        // 2. Comptes créés à des moments proches
        const timeDiff = Math.abs(user.createdTimestamp - member.user.createdTimestamp);
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        
        if (daysDiff < 1) {
          similarity += 20;
          reasons.push('Comptes créés à moins de 24h d\'intervalle');
        } else if (daysDiff < 7) {
          similarity += 10;
          reasons.push('Comptes créés dans la même semaine');
        }

        // 3. Jointure sur le serveur à des moments proches
        if (targetMember.joinedTimestamp && member.joinedTimestamp) {
          const joinDiff = Math.abs(targetMember.joinedTimestamp - member.joinedTimestamp);
          const joinMinutes = joinDiff / (1000 * 60);
          
          if (joinMinutes < 30) {
            similarity += 15;
            reasons.push('Ont rejoint le serveur à moins de 30min d\'intervalle');
          }
        }

        // 4. Avatars par défaut identiques
        if (!user.avatar && !member.user.avatar) {
          similarity += 5;
          reasons.push('Aucun avatar personnalisé (les deux)');
        }

        // 5. Même discriminateur (ancien système)
        if (user.discriminator && member.user.discriminator && 
            user.discriminator === member.user.discriminator && 
            user.discriminator !== '0') {
          similarity += 10;
          reasons.push('Même discriminateur Discord');
        }

        // Ajouter à la liste si suffisamment suspect
        if (similarity >= 25) {
          analysis.suspiciousAccounts.push({
            user: member.user,
            similarity,
            reasons,
            accountAge: Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24)),
            joinedAt: member.joinedTimestamp
          });
        }
      }

      // Trier par niveau de suspicion
      analysis.suspiciousAccounts.sort((a, b) => b.similarity - a.similarity);
      analysis.totalSuspects = analysis.suspiciousAccounts.length;

      // Calculer la confiance globale
      if (analysis.totalSuspects > 0) {
        const maxSimilarity = Math.max(...analysis.suspiciousAccounts.map(a => a.similarity));
        analysis.confidence = Math.min(maxSimilarity, 100);
        
        if (analysis.totalSuspects >= 3) {
          analysis.confidence += 20;
          analysis.indicators.push(`${analysis.totalSuspects} comptes suspects détectés`);
        } else if (analysis.totalSuspects >= 2) {
          analysis.confidence += 10;
          analysis.indicators.push(`${analysis.totalSuspects} comptes suspects détectés`);
        }
      }

      return analysis;
    } catch (error) {
      console.error('Erreur détection multi-comptes:', error);
      return {
        suspiciousAccounts: [],
        confidence: 0,
        indicators: ['❌ Erreur lors de l\'analyse'],
        totalSuspects: 0
      };
    }
  }

  /**
   * Calculer la similarité entre deux chaînes de caractères
   * @param {string} str1 - Première chaîne
   * @param {string} str2 - Deuxième chaîne
   * @returns {number} Similarité entre 0 et 1
   */
  calculateStringSimilarity(str1, str2) {
    if (str1 === str2) return 1;
    if (str1.length < 2 || str2.length < 2) return 0;

    const bigrams1 = this.getBigrams(str1);
    const bigrams2 = this.getBigrams(str2);
    
    const intersection = bigrams1.filter(bigram => bigrams2.includes(bigram));
    const union = [...new Set([...bigrams1, ...bigrams2])];
    
    return intersection.length / union.length;
  }

  /**
   * Obtenir les bigrammes d'une chaîne
   * @param {string} str - Chaîne à analyser
   * @returns {Array} Liste des bigrammes
   */
  getBigrams(str) {
    const bigrams = [];
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.push(str.substring(i, i + 2));
    }
    return bigrams;
  }

  /**
   * Analyser les informations de profil Discord pour détecter le genre
   * @param {User} user - L'utilisateur à analyser
   * @returns {Object} Informations sur le genre détecté
   */
  async analyzeGenderInfo(user) {
    try {
      const genderInfo = {
        detected: 'UNKNOWN',
        confidence: 0,
        sources: [],
        pronouns: null,
        indicators: []
      };

      // 1. Tenter de récupérer le profil complet (si disponible)
      try {
        // Note: Discord ne fournit pas directement les pronoms via l'API bot
        // Mais on peut analyser d'autres éléments du profil
        
        // Analyser le nom d'utilisateur pour des indices
        const username = user.username.toLowerCase();
        const displayName = user.displayName?.toLowerCase() || username;
        
        // Patterns masculins
        const malePatterns = [
          /\b(mr|monsieur|homme|mec|gars|boy|man|male|he|him|il)\b/i,
          /\b(papa|père|dad|father|bro|brother|frère)\b/i
        ];
        
        // Patterns féminins
        const femalePatterns = [
          /\b(mme|madame|mlle|mademoiselle|femme|fille|girl|woman|female|she|her|elle)\b/i,
          /\b(maman|mère|mom|mother|sis|sister|sœur)\b/i
        ];

        // Patterns non-binaires
        const nonBinaryPatterns = [
          /\b(they|them|iel|non.?binary|nb|enby)\b/i
        ];

        // Vérifier les patterns dans le nom
        for (const pattern of malePatterns) {
          if (pattern.test(username) || pattern.test(displayName)) {
            genderInfo.detected = 'MALE';
            genderInfo.confidence += 30;
            genderInfo.indicators.push('Indicateur masculin dans le nom');
            genderInfo.sources.push('Nom d\'utilisateur');
            break;
          }
        }

        for (const pattern of femalePatterns) {
          if (pattern.test(username) || pattern.test(displayName)) {
            genderInfo.detected = 'FEMALE';
            genderInfo.confidence += 30;
            genderInfo.indicators.push('Indicateur féminin dans le nom');
            genderInfo.sources.push('Nom d\'utilisateur');
            break;
          }
        }

        for (const pattern of nonBinaryPatterns) {
          if (pattern.test(username) || pattern.test(displayName)) {
            genderInfo.detected = 'NON_BINARY';
            genderInfo.confidence += 30;
            genderInfo.indicators.push('Indicateur non-binaire dans le nom');
            genderInfo.sources.push('Nom d\'utilisateur');
            break;
          }
        }

      } catch (error) {
        console.error('Erreur analyse genre:', error);
      }

      // 2. Analyser l'avatar pour des indices visuels (basique)
      if (user.avatar) {
        genderInfo.indicators.push('Avatar personnalisé présent');
        genderInfo.sources.push('Avatar');
        // Note: L'analyse d'image nécessiterait une IA spécialisée
      }

      return genderInfo;
    } catch (error) {
      console.error('Erreur analyse informations genre:', error);
      return {
        detected: 'UNKNOWN',
        confidence: 0,
        sources: [],
        pronouns: null,
        indicators: ['❌ Erreur lors de l\'analyse']
      };
    }
  }
}

module.exports = ModerationManager;
