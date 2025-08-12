const { EmbedBuilder, Colors } = require('discord.js');

class LogManager {
  constructor(dataManager, client) {
    this.dataManager = dataManager;
    this.client = client;
  }

  async getGuildConfig(guildId) {
    const all = await this.dataManager.getData('logs_config');
    if (!all[guildId]) {
      all[guildId] = this.getDefaultGuildConfig(guildId);
      await this.dataManager.saveData('logs_config', all);
    }
    return all[guildId];
  }

  getDefaultGuildConfig(guildId) {
    return {
      guildId,
      enabled: true,
      categories: {
        messages: { enabled: true, channelId: null, logEdits: true, logDeletes: true, includeContent: true },
        moderation: { enabled: true, channelId: null, logWarns: true, logMutes: true, logKicks: true, logBans: true, logUnbans: true, logPurges: true },
        members: { enabled: true, channelId: null, logJoins: true, logLeaves: true },
        nicknames: { enabled: true, channelId: null }
      }
    };
  }

  async setGuildConfig(guildId, updates) {
    const all = await this.dataManager.getData('logs_config');
    const current = all[guildId] || this.getDefaultGuildConfig(guildId);
    all[guildId] = { ...current, ...updates };
    await this.dataManager.saveData('logs_config', all);
    return all[guildId];
  }

  async setCategoryConfig(guildId, category, updates) {
    const cfg = await this.getGuildConfig(guildId);
    cfg.categories[category] = { ...(cfg.categories[category] || {}), ...updates };
    const all = await this.dataManager.getData('logs_config');
    all[guildId] = cfg;
    await this.dataManager.saveData('logs_config', all);
    return cfg.categories[category];
  }

  async sendToCategory(guild, category, embed) {
    try {
      if (!guild) return;
      const cfg = await this.getGuildConfig(guild.id);
      if (!cfg.enabled) return;
      const cat = cfg.categories[category];
      if (!cat || !cat.enabled || !cat.channelId) return;
      const channel = guild.channels.cache.get(cat.channelId) || await guild.channels.fetch(cat.channelId).catch(() => null);
      if (!channel) return;
      await channel.send({ embeds: [embed] }).catch(() => {});
    } catch {}
  }

  // Message logs
  async logMessageEdit(oldMessage, newMessage) {
    try {
      if (!newMessage?.guild || newMessage.author?.bot) return;
      const cfg = await this.getGuildConfig(newMessage.guild.id);
      const cat = cfg.categories.messages;
      if (!cat?.enabled || !cat.logEdits) return;

      const embed = new EmbedBuilder()
        .setColor(Colors.Orange)
        .setTitle('✏️ Message modifié')
        .addFields(
          { name: 'Auteur', value: `${newMessage.author.tag} (<@${newMessage.author.id}>)`, inline: true },
          { name: 'Salon', value: `<#${newMessage.channelId}>`, inline: true }
        )
        .setTimestamp(new Date());

      if (cat.includeContent) {
        const before = (oldMessage?.content || '—').slice(0, 1024);
        const after = (newMessage?.content || '—').slice(0, 1024);
        embed.addFields(
          { name: 'Avant', value: before.length > 0 ? before : '—' },
          { name: 'Après', value: after.length > 0 ? after : '—' }
        );
      }

      await this.sendToCategory(newMessage.guild, 'messages', embed);
    } catch {}
  }

  async logMessageDelete(message) {
    try {
      if (!message?.guild || message.author?.bot) return;
      const cfg = await this.getGuildConfig(message.guild.id);
      const cat = cfg.categories.messages;
      if (!cat?.enabled || !cat.logDeletes) return;

      const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('🗑️ Message supprimé')
        .addFields(
          { name: 'Auteur', value: `${message.author?.tag || 'Inconnu'} (<@${message.author?.id || '??'}>)`, inline: true },
          { name: 'Salon', value: `<#${message.channelId}>`, inline: true }
        )
        .setTimestamp(new Date());

      if (cat.includeContent && message.content) {
        embed.addFields({ name: 'Contenu', value: message.content.slice(0, 1024) });
      }

      await this.sendToCategory(message.guild, 'messages', embed);
    } catch {}
  }

  // Member logs
  async logMemberJoin(member) {
    try {
      const cfg = await this.getGuildConfig(member.guild.id);
      const cat = cfg.categories.members;
      if (!cat?.enabled || !cat.logJoins) return;

      const embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('✅ Membre arrivé')
        .addFields(
          { name: 'Membre', value: `${member.user.tag} (<@${member.id}>)` },
          { name: 'Créé le', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>` }
        )
        .setTimestamp(new Date());

      await this.sendToCategory(member.guild, 'members', embed);
    } catch {}
  }

  async logMemberLeave(member) {
    try {
      const cfg = await this.getGuildConfig(member.guild.id);
      const cat = cfg.categories.members;
      if (!cat?.enabled || !cat.logLeaves) return;

      const embed = new EmbedBuilder()
        .setColor(0x7f8c8d)
        .setTitle('🚪 Membre parti')
        .addFields({ name: 'Membre', value: `${member.user?.tag || 'Inconnu'} (<@${member.id}>)` })
        .setTimestamp(new Date());

      await this.sendToCategory(member.guild, 'members', embed);
    } catch {}
  }

  // Nicknames
  async logNicknameChange(oldMember, newMember) {
    try {
      const oldNick = oldMember.nickname || oldMember.user.username;
      const newNick = newMember.nickname || newMember.user.username;
      if (oldNick === newNick) return;
      const cfg = await this.getGuildConfig(newMember.guild.id);
      const cat = cfg.categories.nicknames;
      if (!cat?.enabled) return;

      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setTitle('🏷️ Pseudo modifié')
        .addFields(
          { name: 'Membre', value: `${newMember.user.tag} (<@${newMember.id}>)` },
          { name: 'Avant', value: oldNick || '—', inline: true },
          { name: 'Après', value: newNick || '—', inline: true }
        )
        .setTimestamp(new Date());

      await this.sendToCategory(newMember.guild, 'nicknames', embed);
    } catch {}
  }

  // Moderation
  async logWarn(guild, targetUser, moderatorUser, reason) {
    try {
      const cfg = await this.getGuildConfig(guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logWarns) return;
      const embed = new EmbedBuilder()
        .setColor(Colors.Yellow)
        .setTitle('⚠️ Avertissement')
        .addFields(
          { name: 'Utilisateur', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
          { name: 'Modérateur', value: `${moderatorUser?.tag || '—'}`, inline: true },
          { name: 'Raison', value: reason || 'Aucune' }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(guild, 'moderation', embed);
    } catch {}
  }

  async logMute(member, moderatorUser, durationMs, reason) {
    try {
      const cfg = await this.getGuildConfig(member.guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logMutes) return;
      const embed = new EmbedBuilder()
        .setColor(Colors.DarkGold)
        .setTitle('🔇 Mute')
        .addFields(
          { name: 'Utilisateur', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
          { name: 'Durée', value: durationMs ? `${Math.round(durationMs / 60000)} min` : '—', inline: true },
          { name: 'Raison', value: reason || 'Aucune' }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(member.guild, 'moderation', embed);
    } catch {}
  }

  async logUnmute(member, moderatorUser, reason) {
    try {
      const cfg = await this.getGuildConfig(member.guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logMutes) return;
      const embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('🔈 Unmute')
        .addFields(
          { name: 'Utilisateur', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
          { name: 'Raison', value: reason || 'Aucune' }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(member.guild, 'moderation', embed);
    } catch {}
  }

  async logKick(member, moderatorUser, reason) {
    try {
      const cfg = await this.getGuildConfig(member.guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logKicks) return;
      const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('👢 Expulsion')
        .addFields(
          { name: 'Utilisateur', value: `${member.user?.tag || '—'} (<@${member.id}>)`, inline: true },
          { name: 'Raison', value: reason || 'Aucune' }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(member.guild, 'moderation', embed);
    } catch {}
  }

  async logBan(guild, user, reason) {
    try {
      const cfg = await this.getGuildConfig(guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logBans) return;
      const embed = new EmbedBuilder()
        .setColor(Colors.DarkRed)
        .setTitle('🔨 Ban')
        .addFields(
          { name: 'Utilisateur', value: `${user.tag || '—'} (<@${user.id}>)`, inline: true },
          { name: 'Raison', value: reason || 'Aucune' }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(guild, 'moderation', embed);
    } catch {}
  }

  async logUnban(guild, user) {
    try {
      const cfg = await this.getGuildConfig(guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logUnbans) return;
      const embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('♻️ Unban')
        .addFields({ name: 'Utilisateur', value: `${user.tag || '—'} (<@${user.id}>)` })
        .setTimestamp(new Date());
      await this.sendToCategory(guild, 'moderation', embed);
    } catch {}
  }

  async logPurge(channel, moderatorUser, count) {
    try {
      const cfg = await this.getGuildConfig(channel.guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logPurges) return;
      const embed = new EmbedBuilder()
        .setColor(0x95a5a6)
        .setTitle('🧹 Purge de messages')
        .addFields(
          { name: 'Salon', value: `<#${channel.id}>`, inline: true },
          { name: 'Modérateur', value: `${moderatorUser?.tag || '—'}`, inline: true },
          { name: 'Nombre', value: `${count || '—'}`, inline: true }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(channel.guild, 'moderation', embed);
    } catch {}
  }
}

module.exports = LogManager;