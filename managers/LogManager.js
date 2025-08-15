const { EmbedBuilder, Colors } = require('discord.js');

class LogManager {
  constructor(dataManager, client) {
    this.dataManager = dataManager;
    this.client = client;
  }

  async getGuildConfig(guildId) {
    const all = await this.dataManager.getData('logs_config');
    const current = all[guildId] || this.getDefaultGuildConfig(guildId);
    // Merge in any new categories/fields introduced after initial creation
    const def = this.getDefaultGuildConfig(guildId);
    const merged = { ...current };
    merged.categories = { ...def.categories, ...(current.categories || {}) };
    for (const key of Object.keys(def.categories)) {
      merged.categories[key] = { ...def.categories[key], ...(merged.categories[key] || {}) };
    }
    all[guildId] = merged;
    await this.dataManager.saveData('logs_config', all);
    return merged;
  }

  getDefaultGuildConfig(guildId) {
    return {
      guildId,
      enabled: true,
      categories: {
        messages: { enabled: true, channelId: null, logEdits: true, logDeletes: true, includeContent: true },
        moderation: { enabled: true, channelId: null, logWarns: true, logMutes: true, logKicks: true, logBans: true, logUnbans: true, logPurges: true },
        members: { enabled: true, channelId: null, logJoins: true, logLeaves: true },
        nicknames: { enabled: true, channelId: null },
        economy: { enabled: true, channelId: null, logDaily: true, logTransfers: true, logRewards: true, logAdminChanges: true },
        // New categories
        voice: { enabled: true, channelId: null, logJoins: true, logLeaves: true, logMoves: true, logMutes: true, logDeafens: true, logStreams: true, logCameras: true },
        roles: { enabled: true, channelId: null, logMemberChanges: true, logRoleCreate: true, logRoleDelete: true, logRoleUpdate: true }
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

  async sendToCategory(guild, category, embed, options = {}) {
    try {
      if (!guild) return;
      const cfg = await this.getGuildConfig(guild.id);
      if (!cfg.enabled) return;
      const cat = cfg.categories[category];
      if (!cat || !cat.enabled) return;
      // Fallback to another configured channel if this category has no channel set yet
      let channelId = cat.channelId;
      if (!channelId) {
        const fallbackOrder = ['moderation', 'members', 'messages', 'economy', 'nicknames'];
        for (const key of fallbackOrder) {
          const c = cfg.categories[key];
          if (c && c.enabled && c.channelId) { channelId = c.channelId; break; }
        }
      }
      if (!channelId) return;
      const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
      if (!channel) return;
      const payload = { embeds: [embed], ...options };
      await channel.send(payload).catch(() => {});
    } catch {}
  }

  // === Utilities for role snapshots ===
  async updateMemberRolesSnapshot(member) {
    try {
      const all = await this.dataManager.getData('member_roles');
      if (!all[member.guild.id]) all[member.guild.id] = {};
      const roleIds = member.roles.cache.filter(r => r.editable || true).map(r => r.id).filter(id => id !== member.guild.id);
      all[member.guild.id][member.id] = { roleIds, updatedAt: Date.now() };
      await this.dataManager.saveData('member_roles', all);
    } catch {}
  }

  async getMemberRolesSnapshot(guildId, userId) {
    try {
      const all = await this.dataManager.getData('member_roles');
      return all[guildId]?.[userId]?.roleIds || [];
    } catch {
      return [];
    }
  }

  // Message logs
  async logMessageEdit(oldMessage, newMessage) {
    try {
      const guild = newMessage?.guild || (newMessage?.guildId ? this.client.guilds.cache.get(newMessage.guildId) : null);
      if (!guild || newMessage.author?.bot) return;
      const cfg = await this.getGuildConfig(guild.id);
      const cat = cfg.categories.messages;
      if (!cat?.enabled || !cat.logEdits) return;

      const embed = new EmbedBuilder()
        .setColor(Colors.Orange)
        .setTitle('✏️ Message modifié')
        .addFields(
          { name: 'Auteur', value: `${newMessage.author?.tag || 'Inconnu'} (<@${newMessage.author?.id || '??'}>)`, inline: true },
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

      await this.sendToCategory(guild, 'messages', embed);
    } catch {}
  }

  async logMessageDelete(message) {
    try {
      const guild = message?.guild || (message?.guildId ? this.client.guilds.cache.get(message.guildId) : null);
      if (!guild || message.author?.bot) return;
      const cfg = await this.getGuildConfig(guild.id);
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

      // Attachments (images in particular)
      try {
        const atts = Array.from((message.attachments || new Map()).values());
        if (atts.length > 0) {
          const imageAtts = atts.filter(a => {
            const ct = (a.contentType || '').toLowerCase();
            const name = (a.name || '').toLowerCase();
            return ct.startsWith('image/') || name.match(/\.(png|jpe?g|gif|webp)$/);
          });
          if (imageAtts.length > 0) {
            // Show first image as preview and list others as links
            embed.setImage(imageAtts[0].proxyURL || imageAtts[0].url);
            const links = imageAtts.map((a, idx) => `[image_${idx + 1}](${a.url})`).join(' • ');
            embed.addFields({ name: 'Images', value: links.slice(0, 1024) });
          }
          const other = atts.filter(a => !imageAtts.includes(a));
          if (other.length > 0) {
            const filesList = other.map(a => `[${a.name}](${a.url})`).join(' • ');
            embed.addFields({ name: 'Fichiers', value: filesList.slice(0, 1024) });
          }
        }
      } catch {}

      await this.sendToCategory(guild, 'messages', embed);
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

      // Include roles held
      try {
        const roles = member.roles?.cache?.filter(r => r.id !== member.guild.id) || null;
        const rolesStr = roles && roles.size > 0 ? roles.map(r => `<@&${r.id}>`).join(' ') : null;
        if (rolesStr) embed.addFields({ name: 'Rôles', value: rolesStr.slice(0, 1024) });
      } catch {}

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

  // Roles (member role changes)
  async logMemberRoleChanges(oldMember, newMember) {
    try {
      const cfg = await this.getGuildConfig(newMember.guild.id);
      const cat = cfg.categories.roles;
      if (!cat?.enabled || !cat.logMemberChanges) return;

      const before = new Set(oldMember.roles.cache.keys());
      const after = new Set(newMember.roles.cache.keys());
      before.delete(newMember.guild.id); // remove @everyone
      after.delete(newMember.guild.id);

      const added = [...after].filter(id => !before.has(id));
      const removed = [...before].filter(id => !after.has(id));
      if (added.length === 0 && removed.length === 0) return;

      const addedStr = added.map(id => `<@&${id}>`).join(' ');
      const removedStr = removed.map(id => `<@&${id}>`).join(' ');

      const embed = new EmbedBuilder()
        .setColor(added.length > 0 ? Colors.Green : Colors.Red)
        .setTitle('🧩 Rôles modifiés')
        .addFields(
          { name: 'Membre', value: `${newMember.user.tag} (<@${newMember.id}>)` }
        )
        .setTimestamp(new Date());

      if (added.length > 0) embed.addFields({ name: 'Ajoutés', value: addedStr.slice(0, 1024) });
      if (removed.length > 0) embed.addFields({ name: 'Retirés', value: removedStr.slice(0, 1024) });

      await this.updateMemberRolesSnapshot(newMember);
      await this.sendToCategory(newMember.guild, 'roles', embed);
    } catch {}
  }

  async logRoleCreate(role) {
    try {
      const cfg = await this.getGuildConfig(role.guild.id);
      const cat = cfg.categories.roles;
      if (!cat?.enabled || !cat.logRoleCreate) return;
      const embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('➕ Rôle créé')
        .addFields(
          { name: 'Rôle', value: `<@&${role.id}> (${role.name})`, inline: true },
          { name: 'Couleur', value: role.hexColor || '—', inline: true }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(role.guild, 'roles', embed);
    } catch {}
  }

  async logRoleDelete(role) {
    try {
      const cfg = await this.getGuildConfig(role.guild.id);
      const cat = cfg.categories.roles;
      if (!cat?.enabled || !cat.logRoleDelete) return;
      const embed = new EmbedBuilder()
        .setColor(Colors.DarkRed)
        .setTitle('🗑️ Rôle supprimé')
        .addFields(
          { name: 'Rôle', value: `${role.name} (${role.id})` }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(role.guild, 'roles', embed);
    } catch {}
  }

  async logRoleUpdate(oldRole, newRole) {
    try {
      const cfg = await this.getGuildConfig(newRole.guild.id);
      const cat = cfg.categories.roles;
      if (!cat?.enabled || !cat.logRoleUpdate) return;
      const changes = [];
      if (oldRole.name !== newRole.name) changes.push({ name: 'Nom', value: `${oldRole.name} → ${newRole.name}` });
      if (oldRole.hexColor !== newRole.hexColor) changes.push({ name: 'Couleur', value: `${oldRole.hexColor} → ${newRole.hexColor}` });
      if (changes.length === 0) return;
      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setTitle('✏️ Rôle modifié')
        .addFields(
          { name: 'Rôle', value: `<@&${newRole.id}> (${newRole.name})` },
          ...changes.slice(0, 24)
        )
        .setTimestamp(new Date());
      await this.sendToCategory(newRole.guild, 'roles', embed);
    } catch {}
  }

  // Voice
  async logVoiceState(oldState, newState) {
    try {
      const member = newState.member || oldState.member;
      const guild = (member && member.guild) || newState.guild || oldState.guild;
      if (!guild || !member || member.user?.bot) return;
      const cfg = await this.getGuildConfig(guild.id);
      const cat = cfg.categories.voice;
      if (!cat?.enabled) return;

      const oldChannel = oldState.channel;
      const newChannel = newState.channel;

      // Join / Leave / Move
      if (!oldChannel && newChannel && cat.logJoins) {
        const embed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('🔊 Rejoint un vocal')
          .addFields(
            { name: 'Membre', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
            { name: 'Salon', value: `<#${newChannel.id}>`, inline: true }
          )
          .setTimestamp(new Date());
        await this.sendToCategory(guild, 'voice', embed);
      } else if (oldChannel && !newChannel && cat.logLeaves) {
        const embed = new EmbedBuilder()
          .setColor(0x7f8c8d)
          .setTitle('🚪 Quitté un vocal')
          .addFields(
            { name: 'Membre', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
            { name: 'Salon', value: `<#${oldChannel.id}>`, inline: true }
          )
          .setTimestamp(new Date());
        await this.sendToCategory(guild, 'voice', embed);
      } else if (oldChannel && newChannel && oldChannel.id !== newChannel.id && cat.logMoves) {
        const embed = new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle('➡️ Déplacement vocal')
          .addFields(
            { name: 'Membre', value: `${member.user.tag} (<@${member.id}>)` },
            { name: 'De', value: `<#${oldChannel.id}>`, inline: true },
            { name: 'Vers', value: `<#${newChannel.id}>`, inline: true }
          )
          .setTimestamp(new Date());
        await this.sendToCategory(guild, 'voice', embed);
      }

      // Toggles
      const toggles = [];
      if (cat.logMutes && oldState.serverMute !== newState.serverMute) toggles.push({ t: newState.serverMute ? '🔇 Mute serveur' : '🔈 Unmute serveur' });
      if (cat.logDeafens && oldState.serverDeaf !== newState.serverDeaf) toggles.push({ t: newState.serverDeaf ? '🔕 Deaf serveur' : '🔔 Undeaf serveur' });
      if (cat.logMutes && oldState.selfMute !== newState.selfMute) toggles.push({ t: newState.selfMute ? '🤫 Auto-mute' : '🗣️ Auto-unmute' });
      if (cat.logDeafens && oldState.selfDeaf !== newState.selfDeaf) toggles.push({ t: newState.selfDeaf ? '🙉 Auto-deaf' : '👂 Auto-undeaf' });
      if (cat.logStreams && oldState.streaming !== newState.streaming) toggles.push({ t: newState.streaming ? '📢 Stream ON' : '📵 Stream OFF' });
      if (cat.logCameras && oldState.selfVideo !== newState.selfVideo) toggles.push({ t: newState.selfVideo ? '🎥 Caméra ON' : '📷 Caméra OFF' });

      for (const change of toggles) {
        const embed = new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle(change.t)
          .addFields(
            { name: 'Membre', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
            { name: 'Salon', value: `${(newChannel || oldChannel) ? `<#${(newChannel || oldChannel).id}>` : '—'}`, inline: true }
          )
          .setTimestamp(new Date());
        await this.sendToCategory(guild, 'voice', embed);
      }
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
          { name: 'Modérateur', value: `${moderatorUser?.tag || 'AutoMod'}`, inline: true },
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
          { name: 'Modérateur', value: `${moderatorUser?.tag || 'AutoMod'}`, inline: true },
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
          { name: 'Modérateur', value: `${moderatorUser?.tag || 'AutoMod'}`, inline: true },
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
          { name: 'Modérateur', value: `${moderatorUser?.tag || 'AutoMod'}`, inline: true },
          { name: 'Raison', value: reason || 'Aucune' }
        )
        .setTimestamp(new Date());
      // Add roles held at time of kick
      try {
        const roles = member.roles?.cache?.filter(r => r.id !== member.guild.id) || null;
        const rolesStr = roles && roles.size > 0 ? roles.map(r => `<@&${r.id}>`).join(' ') : null;
        if (rolesStr) embed.addFields({ name: 'Rôles', value: rolesStr.slice(0, 1024) });
      } catch {}
      await this.sendToCategory(member.guild, 'moderation', embed);
    } catch {}
  }

  async logBan(guild, user, reason, moderatorUser = null) {
    try {
      const cfg = await this.getGuildConfig(guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logBans) return;
      const embed = new EmbedBuilder()
        .setColor(Colors.DarkRed)
        .setTitle('🔨 Ban')
        .addFields(
          { name: 'Utilisateur', value: `${user.tag || '—'} (<@${user.id}>)`, inline: true },
          { name: 'Modérateur', value: `${moderatorUser?.tag || 'AutoMod'}`, inline: true },
          { name: 'Raison', value: reason || 'Aucune' }
        )
        .setTimestamp(new Date());
      // Try include roles snapshot at time of ban
      try {
        const roleIds = await this.getMemberRolesSnapshot(guild.id, user.id);
        if (Array.isArray(roleIds) && roleIds.length > 0) {
          const rolesStr = roleIds.map(id => `<@&${id}>`).join(' ');
          embed.addFields({ name: 'Rôles (au ban)', value: rolesStr.slice(0, 1024) });
        }
      } catch {}
      await this.sendToCategory(guild, 'moderation', embed);
    } catch {}
  }

  async logUnban(guild, user, moderatorUser = null) {
    try {
      const cfg = await this.getGuildConfig(guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logUnbans) return;
      const embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('♻️ Unban')
        .addFields(
          { name: 'Utilisateur', value: `${user.tag || '—'} (<@${user.id}>)`, inline: true },
          { name: 'Modérateur', value: `${moderatorUser?.tag || 'AutoMod'}`, inline: true }
        )
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
          { name: 'Modérateur', value: `${moderatorUser?.tag || 'AutoMod'}`, inline: true },
          { name: 'Nombre', value: `${count || '—'}`, inline: true }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(channel.guild, 'moderation', embed);
    } catch {}
  }

  // Economy
  async logDaily(guild, user, totalReward, parts) {
    try {
      const cfg = await this.getGuildConfig(guild.id);
      const cat = cfg.categories.economy;
      if (!cat?.enabled || !cat.logDaily) return;
      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle('🎁 Daily')
        .addFields(
          { name: 'Utilisateur', value: `${user.tag} (<@${user.id}>)`, inline: true },
          { name: 'Total', value: `${totalReward}💋`, inline: true },
          { name: 'Détail', value: parts || '—' }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(guild, 'economy', embed);
    } catch {}
  }

  async logTransfer(guild, fromUser, toUser, amount) {
    try {
      const cfg = await this.getGuildConfig(guild.id);
      const cat = cfg.categories.economy;
      if (!cat?.enabled || !cat.logTransfers) return;
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('💸 Transfert')
        .addFields(
          { name: 'De', value: `${fromUser.tag} (<@${fromUser.id}>)`, inline: true },
          { name: 'À', value: `${toUser.tag} (<@${toUser.id}>)`, inline: true },
          { name: 'Montant', value: `${amount}💋`, inline: true }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(guild, 'economy', embed);
    } catch {}
  }

  async logAdminMoneyAdd(guild, targetUser, amount, moderatorUser) {
    try {
      const cfg = await this.getGuildConfig(guild.id);
      const cat = cfg.categories.economy;
      if (!cat?.enabled || !cat.logAdminChanges) return;
      const embed = new EmbedBuilder()
        .setColor(0xe91e63)
        .setTitle('➕ Ajout d’argent (Admin)')
        .addFields(
          { name: 'Utilisateur', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
          { name: 'Montant', value: `+${amount}💋`, inline: true },
          { name: 'Modérateur', value: `${moderatorUser?.tag || '—'}`, inline: true }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(guild, 'economy', embed);
    } catch {}
  }

  async logAdminMoneyRemove(guild, targetUser, amount, moderatorUser) {
    try {
      const cfg = await this.getGuildConfig(guild.id);
      const cat = cfg.categories.economy;
      if (!cat?.enabled || !cat.logAdminChanges) return;
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('➖ Retrait d’argent (Admin)')
        .addFields(
          { name: 'Utilisateur', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
          { name: 'Montant', value: `-${amount}💋`, inline: true },
          { name: 'Modérateur', value: `${moderatorUser?.tag || '—'}`, inline: true }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(guild, 'economy', embed);
    } catch {}
  }

  async logMessageReward(message, amount) {
    try {
      const cfg = await this.getGuildConfig(message.guild.id);
      const cat = cfg.categories.economy;
      if (!cat?.enabled || !cat.logRewards) return;
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('💬 Récompense Message')
        .addFields(
          { name: 'Utilisateur', value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
          { name: 'Montant', value: `+${amount}💋`, inline: true },
          { name: 'Salon', value: `<#${message.channel.id}>`, inline: true }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(message.guild, 'economy', embed);
    } catch {}
  }
}

module.exports = LogManager;