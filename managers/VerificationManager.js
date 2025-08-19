const { EmbedBuilder, Colors, PermissionFlagsBits } = require('discord.js');

class VerificationManager {
  constructor(dataManager, client, logManager = null) {
    this.dataManager = dataManager;
    this.client = client;
    this.logManager = logManager;
  }

  setLogManager(logManager) {
    this.logManager = logManager;
  }

  getDefaultGuildConfig(guildId) {
    return {
      guildId,
      enabled: true,
      minimumAccountAgeDays: 7,
      checkCrossGuildBans: true,
      allowBots: true,
      autoAction: 'log', // 'none' | 'log' | 'restrict' | 'kick' | 'ban'
      restrictedRoleName: 'Unverified',
      thresholds: {
        medium: 30,
        high: 60,
        critical: 85
      },
      weights: {
        veryNewAccount: 40, // < 2 days
        newAccount: 25, // < minimumAccountAgeDays
        defaultAvatar: 10,
        noRoles: 10,
        hasWarnings: 10, // per warn
        bannedElsewhere: 30, // per ban found (capped)
        suspiciousUsername: 20,
        botAccount: 15,
        globallyFlagged: 50
      },
      usernameKeywords: [
        'sell', 'vende', 'vendeuse', 'escort', 'onlyfans', 'only fans', 'whatsapp', 'telegram', 't.me', 'snap',
        'bitcoin', 'crypto', 'nude', 'porn', 'xxx', 'nsfw', 'promo', 'discount'
      ]
    };
  }

  async getGuildConfig(guildId) {
    const all = await this.dataManager.getData('verification_config');
    if (!all[guildId]) {
      all[guildId] = this.getDefaultGuildConfig(guildId);
      await this.dataManager.saveData('verification_config', all);
    }
    // ensure new fields merged
    const def = this.getDefaultGuildConfig(guildId);
    const merged = { ...def, ...(all[guildId] || {}) };
    merged.thresholds = { ...def.thresholds, ...(merged.thresholds || {}) };
    merged.weights = { ...def.weights, ...(merged.weights || {}) };
    merged.usernameKeywords = Array.isArray(merged.usernameKeywords) ? merged.usernameKeywords : def.usernameKeywords;
    all[guildId] = merged;
    await this.dataManager.saveData('verification_config', all);
    return merged;
  }

  async setGuildConfig(guildId, updates) {
    const all = await this.dataManager.getData('verification_config');
    const cur = all[guildId] || this.getDefaultGuildConfig(guildId);
    const next = { ...cur, ...(updates || {}) };
    if (updates?.thresholds) next.thresholds = { ...cur.thresholds, ...updates.thresholds };
    if (updates?.weights) next.weights = { ...cur.weights, ...updates.weights };
    all[guildId] = next;
    await this.dataManager.saveData('verification_config', all);
    return next;
  }

  async getRestrictedRole(guild, roleName) {
    if (!guild) return null;
    const exact = guild.roles.cache.find(r => r.name === roleName) || guild.roles.cache.find(r => r.name.toLowerCase() === String(roleName).toLowerCase());
    return exact || null;
  }

  scoreUsernameSuspicion(username, keywords) {
    if (!username) return 0;
    const lower = username.toLowerCase();
    for (const word of keywords) {
      if (lower.includes(String(word).toLowerCase())) return 1;
    }
    return 0;
  }

  async checkCrossGuildBans(userId) {
    try {
      let count = 0;
      for (const guild of this.client.guilds.cache.values()) {
        try {
          const ban = await guild.bans.fetch(userId).catch(() => null);
          if (ban && ban.user && ban.user.id === userId) count++;
        } catch {}
        if (count >= 5) break; // cap to avoid heavy loops
      }
      return count;
    } catch {
      return 0;
    }
  }

  async verifyMember(member) {
    const guild = member.guild;
    const user = member.user;
    const cfg = await this.getGuildConfig(guild.id);

    let riskScore = 0;
    const reasons = [];
    const tags = [];

    // Account age
    const createdTs = user.createdTimestamp || 0;
    const ageDays = createdTs > 0 ? Math.floor((Date.now() - createdTs) / (24 * 60 * 60 * 1000)) : 0;
    if (ageDays < 2) { riskScore += cfg.weights.veryNewAccount; reasons.push(`Compte très récent (< 2j): ${ageDays}j`); tags.push('very_new'); }
    else if (ageDays < cfg.minimumAccountAgeDays) { riskScore += cfg.weights.newAccount; reasons.push(`Compte récent (< ${cfg.minimumAccountAgeDays}j): ${ageDays}j`); tags.push('new'); }

    // Default avatar
    const hasAvatar = Boolean(user.avatar);
    if (!hasAvatar) { riskScore += cfg.weights.defaultAvatar; reasons.push('Avatar par défaut'); tags.push('default_avatar'); }

    // No roles (besides @everyone)
    const roleCount = member.roles.cache.filter(r => r.id !== guild.id).size;
    if (roleCount === 0) { riskScore += cfg.weights.noRoles; reasons.push('Aucun rôle attribué'); }

    // Warnings on this guild
    try {
      const warnings = await this.dataManager.getData('warnings');
      const warnsCount = (warnings[guild.id]?.[user.id] || []).length;
      if (warnsCount > 0) {
        const add = Math.min(5, warnsCount) * cfg.weights.hasWarnings;
        riskScore += add;
        reasons.push(`${warnsCount} avertissement(s) ici`);
        tags.push('warns');
      }
    } catch {}

    // Globally flagged by admins (shared list)
    try {
      const flags = await this.dataManager.getData('global_flags');
      if (flags[user.id]) {
        riskScore += cfg.weights.globallyFlagged;
        reasons.push(`Signalement global: ${flags[user.id]?.reason || 'sans raison'}`);
        tags.push('flagged');
      }
    } catch {}

    // Cross-guild bans
    let bansElsewhere = 0;
    if (cfg.checkCrossGuildBans) {
      bansElsewhere = await this.checkCrossGuildBans(user.id);
      if (bansElsewhere > 0) {
        const add = Math.min(3, bansElsewhere) * cfg.weights.bannedElsewhere;
        riskScore += add;
        reasons.push(`${bansElsewhere} ban(s) sur d'autres serveurs du bot`);
        tags.push('banned_elsewhere');
      }
    }

    // Username keywords
    try {
      const suspicious = this.scoreUsernameSuspicion(user.username || user.globalName, cfg.usernameKeywords);
      if (suspicious) {
        riskScore += cfg.weights.suspiciousUsername;
        reasons.push('Pseudo suspect (mots-clés)');
        tags.push('vendeuse|spam');
      }
    } catch {}

    // Bot account
    if (user.bot && !cfg.allowBots) {
      riskScore += cfg.weights.botAccount;
      reasons.push('Compte bot non autorisé');
      tags.push('bot');
    }

    // Determine level
    let level = 'low';
    if (riskScore >= cfg.thresholds.critical) level = 'critical';
    else if (riskScore >= cfg.thresholds.high) level = 'high';
    else if (riskScore >= cfg.thresholds.medium) level = 'medium';

    const result = { riskScore, level, reasons, tags, ageDays, bansElsewhere, hasAvatar, roleCount };

    // Persist state
    try {
      const state = await this.dataManager.getData('verification_state');
      if (!state[guild.id]) state[guild.id] = {};
      state[guild.id][user.id] = {
        lastVerifiedAt: Date.now(),
        ...result
      };
      await this.dataManager.saveData('verification_state', state);
    } catch {}

    return result;
  }

  formatVerificationEmbed(member, result) {
    const user = member.user;
    const colorMap = { low: Colors.Green, medium: 0xf1c40f, high: Colors.Orange, critical: Colors.DarkRed };
    const embed = new EmbedBuilder()
      .setColor(colorMap[result.level] || Colors.Blurple)
      .setTitle('🔎 Vérification de membre')
      .setThumbnail(user.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: 'Utilisateur', value: `${user.tag} (<@${user.id}>)`, inline: true },
        { name: 'Score', value: `${result.riskScore} (${result.level})`, inline: true },
        { name: 'Âge du compte', value: `${result.ageDays} jour(s)`, inline: true }
      )
      .setTimestamp(new Date());
    if (result.bansElsewhere > 0) embed.addFields({ name: 'Bans ailleurs', value: `${result.bansElsewhere}`, inline: true });
    if (Array.isArray(result.reasons) && result.reasons.length > 0) {
      embed.addFields({ name: 'Motifs', value: result.reasons.join('\n').slice(0, 1024) });
    }
    return embed;
  }

  async autoVerifyOnJoin(member) {
    const cfg = await this.getGuildConfig(member.guild.id);
    if (!cfg.enabled) return;
    const result = await this.verifyMember(member);

    // Logging to moderation
    try {
      const embed = this.formatVerificationEmbed(member, result);
      embed.setTitle('🛂 Vérification automatique (arrivée)');
      if (this.logManager) await this.logManager.sendToCategory(member.guild, 'moderation', embed, { __decor: { targetUser: member.user } });
    } catch {}

    // Auto actions
    try {
      if (cfg.autoAction === 'restrict' && (result.level === 'high' || result.level === 'critical')) {
        const role = await this.getRestrictedRole(member.guild, cfg.restrictedRoleName);
        if (role && !member.roles.cache.has(role.id)) {
          await member.roles.add(role, 'Vérification: restriction automatique');
        }
      } else if (cfg.autoAction === 'kick' && result.level === 'critical') {
        await member.kick('Vérification: risque critique');
      } else if (cfg.autoAction === 'ban' && result.level === 'critical') {
        await member.ban({ reason: 'Vérification: risque critique' });
      }
    } catch {}
  }

  async flagUser(userId, reason, moderatorId = null) {
    const flags = await this.dataManager.getData('global_flags');
    flags[userId] = {
      reason: reason || 'Signalement',
      moderatorId: moderatorId || null,
      timestamp: Date.now()
    };
    await this.dataManager.saveData('global_flags', flags);
    return flags[userId];
  }

  async unflagUser(userId) {
    const flags = await this.dataManager.getData('global_flags');
    if (flags[userId]) {
      delete flags[userId];
      await this.dataManager.saveData('global_flags', flags);
      return true;
    }
    return false;
  }

  // Buttons handler
  async handleButtonInteraction(interaction) {
    const customId = interaction.customId || '';
    if (!customId.startsWith('verify_')) return false;
    const [_, action, userId] = customId.split(':');
    if (!action || !userId) return false;

    const guild = interaction.guild;
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) {
      await interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
      return true;
    }

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: '❌ Réservé aux administrateurs.', ephemeral: true });
      return true;
    }

    if (action === 'ban') {
      await member.ban({ reason: 'Vérification: action modérateur' }).catch(() => {});
      await interaction.reply({ content: `🔨 ${member.user.tag} banni.`, ephemeral: true });
      return true;
    }
    if (action === 'kick') {
      await member.kick('Vérification: action modérateur').catch(() => {});
      await interaction.reply({ content: `👢 ${member.user.tag} expulsé.`, ephemeral: true });
      return true;
    }
    if (action === 'warn') {
      try {
        const warnings = await this.dataManager.getData('warnings');
        if (!warnings[guild.id]) warnings[guild.id] = {};
        if (!warnings[guild.id][userId]) warnings[guild.id][userId] = [];
        warnings[guild.id][userId].push({ reason: 'Avertissement via vérification', moderatorId: interaction.user.id, timestamp: Date.now() });
        await this.dataManager.saveData('warnings', warnings);
      } catch {}
      await interaction.reply({ content: `⚠️ Warn ajouté à ${member.user.tag}.`, ephemeral: true });
      return true;
    }
    if (action === 'flag') {
      await this.flagUser(userId, 'Signalé via vérification', interaction.user.id);
      await interaction.reply({ content: `🚩 ${member.user.tag} signalé globalement.`, ephemeral: true });
      return true;
    }
    if (action === 'trust') {
      const state = await this.dataManager.getData('verification_state');
      if (!state[guild.id]) state[guild.id] = {};
      state[guild.id][userId] = { ...(state[guild.id][userId] || {}), trusted: true, lastVerifiedAt: Date.now() };
      await this.dataManager.saveData('verification_state', state);
      await interaction.reply({ content: `✅ ${member.user.tag} marqué comme fiable.`, ephemeral: true });
      return true;
    }
    if (action === 'restrict') {
      const cfg = await this.getGuildConfig(guild.id);
      const role = await this.getRestrictedRole(guild, cfg.restrictedRoleName);
      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role, 'Vérification: restriction manuelle').catch(() => {});
        await interaction.reply({ content: `🔒 ${member.user.tag} restreint (${role.name}).`, ephemeral: true });
      } else {
        await interaction.reply({ content: 'ℹ️ Aucun rôle de restriction trouvé/configuré.', ephemeral: true });
      }
      return true;
    }

    return false;
  }
}

module.exports = VerificationManager;

