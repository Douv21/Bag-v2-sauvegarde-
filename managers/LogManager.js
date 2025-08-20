const { EmbedBuilder, Colors } = require('discord.js');

class LogManager {
  constructor(dataManager, client) {
    this.dataManager = dataManager;
    this.client = client;
  }

  getDefaultTheme() {
    return {
      nsfwTone: true,
      footer: 'Boys & Girls 🔥 Logs',
      includeAvatars: true,
      includeJumpLinks: true
    };
  }

  humanizeDuration(ms) {
    try {
      if (!ms || ms <= 0) return '—';
      const totalSeconds = Math.floor(ms / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const parts = [];
      if (days) parts.push(`${days}j`);
      if (hours) parts.push(`${hours}h`);
      if (minutes) parts.push(`${minutes}m`);
      if (seconds && parts.length === 0) parts.push(`${seconds}s`);
      return parts.join(' ');
    } catch {
      return '—';
    }
  }

  getTagline(category) {
    const lines = {
      moderation: '😈 Discipline avec douceur…',
      messages: '💋 Les mots laissent des traces.',
      members: '🔥 Le boudoir s’agrandit… ou se vide.',
      voice: '🎙️ Murmures en cabine.',
      roles: '🧩 Nouveaux rôles, nouveaux jeux.',
      nicknames: '🏷️ Un nouveau petit nom…',
      economy: '💰 Plaisirs et récompenses.',
      channels: '🛠️ Travaux en salon.',
      threads: '🧵 Fils qui s’entremêlent.',
      emojis: '😜 Grimaces et symboles.',
      stickers: '🏷️ Autocollants sexy.',
      invites: '✉️ Invitations au boudoir.',
      webhooks: '🪝 Crochets malicieux.',
      server: '🏰 Le royaume évolue.',
      boosts: '💎 Boost de plaisir.',
      events: '📅 Rendez-vous programmés.'
    };
    return lines[category] || null;
  }

  async nextCaseId(guildId) {
    try {
      const all = await this.dataManager.getData('logs_config');
      const current = all[guildId] || this.getDefaultGuildConfig(guildId);
      const next = (current.caseCounter || 0) + 1;
      current.caseCounter = next;
      all[guildId] = current;
      await this.dataManager.saveData('logs_config', all);
      return next;
    } catch {
      return null;
    }
  }

  decorateEmbed(embed, guild, cfg, category, options = {}) {
    try {
      const theme = { ...(cfg?.theme || this.getDefaultTheme()) };
      const footerParts = [theme.footer || 'Logs', guild?.name || ''];
      if (options.caseId) footerParts.push(`Case #${options.caseId}`);
      const iconURL = guild?.iconURL?.({ size: 64 });
      embed.setFooter({ text: footerParts.filter(Boolean).join(' • '), iconURL: iconURL || null });

      if (theme.includeAvatars) {
        if (options.actorUser?.displayAvatarURL) {
          const name = options.actorUser.tag || options.actorUser.username || 'Utilisateur';
          embed.setAuthor({ name, iconURL: options.actorUser.displayAvatarURL({ size: 64 }) });
        } else if (options.targetUser?.displayAvatarURL) {
          embed.setThumbnail(options.targetUser.displayAvatarURL({ size: 128 }));
        }
      }

      if (theme.nsfwTone) {
        const tagline = this.getTagline(category);
        if (tagline) {
          const existing = embed.data?.description || null;
          const desc = existing ? `${existing}\n\n${tagline}` : tagline;
          embed.setDescription(desc);
        }
      }
    } catch {}
    return embed;
  }

  async setThemeConfig(guildId, partialTheme) {
    const all = await this.dataManager.getData('logs_config');
    const cur = all[guildId] || this.getDefaultGuildConfig(guildId);
    cur.theme = { ...(cur.theme || this.getDefaultTheme()), ...(partialTheme || {}) };
    all[guildId] = cur;
    await this.dataManager.saveData('logs_config', all);
    return cur.theme;
  }

  makeJumpLink(guildId, channelId, messageId) {
    if (!guildId || !channelId || !messageId) return null;
    return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
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
    merged.theme = { ...this.getDefaultTheme(), ...(current.theme || {}) };
    merged.caseCounter = typeof current.caseCounter === 'number' ? current.caseCounter : 0;
    all[guildId] = merged;
    await this.dataManager.saveData('logs_config', all);
    return merged;
  }

  getDefaultGuildConfig(guildId) {
    return {
      guildId,
      enabled: true,
      theme: this.getDefaultTheme(),
      caseCounter: 0,
      categories: {
        messages: { enabled: true, channelId: null, logEdits: true, logDeletes: true, includeContent: true },
        moderation: { enabled: true, channelId: null, logWarns: true, logMutes: true, logKicks: true, logBans: true, logUnbans: true, logPurges: true },
        members: { enabled: true, channelId: null, logJoins: true, logLeaves: true },
        nicknames: { enabled: true, channelId: null },
        economy: { enabled: true, channelId: null, logDaily: true, logTransfers: true, logRewards: true, logAdminChanges: true },
        // New categories
        voice: { enabled: true, channelId: null, logJoins: true, logLeaves: true, logMoves: true, logMutes: true, logDeafens: true, logStreams: true, logCameras: true },
        roles: { enabled: true, channelId: null, logMemberChanges: true, logRoleCreate: true, logRoleDelete: true, logRoleUpdate: true },
        channels: { enabled: true, channelId: null, logCreates: true, logDeletes: true, logUpdates: true },
        threads: { enabled: true, channelId: null, logCreates: true, logDeletes: true, logUpdates: true, logArchived: true, logUnarchived: true, logLocked: true, logUnlocked: true },
        emojis: { enabled: true, channelId: null, logCreates: true, logDeletes: true, logUpdates: true },
        stickers: { enabled: true, channelId: null, logCreates: true, logDeletes: true, logUpdates: true },
        invites: { enabled: true, channelId: null, logCreates: true, logDeletes: true },
        webhooks: { enabled: true, channelId: null, logUpdates: true },
        server: { enabled: true, channelId: null, logUpdates: true },
        boosts: { enabled: true, channelId: null, logStart: true, logEnd: true },
        events: { enabled: true, channelId: null, logCreates: true, logUpdates: true, logDeletes: true }
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

      // Décoration de thème centralisée
      const decor = options.__decor || {};
      this.decorateEmbed(embed, guild, cfg, category, decor);

      const payload = { embeds: [embed], ...(options.__decor ? {} : options) };
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

      // Lien direct
      try {
        if (cfg.theme?.includeJumpLinks) {
          const link = this.makeJumpLink(guild.id, newMessage.channelId, newMessage.id);
          if (link) embed.addFields({ name: 'Lien', value: `[Voir le message](${link})` });
        }
      } catch {}

      await this.sendToCategory(guild, 'messages', embed, { __decor: { actorUser: newMessage.author } });
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

      // Lien direct
      try {
        if (cfg.theme?.includeJumpLinks && message.id) {
          const link = this.makeJumpLink(guild.id, message.channelId, message.id);
          if (link) embed.addFields({ name: 'Lien', value: `[Voir le message](${link})` });
        }
      } catch {}

      await this.sendToCategory(guild, 'messages', embed, { __decor: { actorUser: message.author } });
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

      await this.sendToCategory(member.guild, 'members', embed, { __decor: { targetUser: member.user } });
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

      await this.sendToCategory(member.guild, 'members', embed, { __decor: { targetUser: member.user } });
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

      await this.sendToCategory(newMember.guild, 'nicknames', embed, { __decor: { targetUser: newMember.user } });
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
      await this.sendToCategory(newMember.guild, 'roles', embed, { __decor: { targetUser: newMember.user } });
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
        await this.sendToCategory(guild, 'voice', embed, { __decor: { actorUser: member.user } });
      } else if (oldChannel && !newChannel && cat.logLeaves) {
        const embed = new EmbedBuilder()
          .setColor(0x7f8c8d)
          .setTitle('🚪 Quitté un vocal')
          .addFields(
            { name: 'Membre', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
            { name: 'Salon', value: `<#${oldChannel.id}>`, inline: true }
          )
          .setTimestamp(new Date());
        await this.sendToCategory(guild, 'voice', embed, { __decor: { actorUser: member.user } });
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
        await this.sendToCategory(guild, 'voice', embed, { __decor: { actorUser: member.user } });
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
        await this.sendToCategory(guild, 'voice', embed, { __decor: { actorUser: member.user } });
      }
    } catch {}
  }

  // Moderation
  async logWarn(guild, targetUser, moderatorUser, reason) {
    try {
      const cfg = await this.getGuildConfig(guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logWarns) return;
      const caseId = await this.nextCaseId(guild.id);
      const embed = new EmbedBuilder()
        .setColor(Colors.Yellow)
        .setTitle('⚠️ Avertissement')
        .addFields(
          { name: 'Utilisateur', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
          { name: 'Modérateur', value: `${moderatorUser?.tag || 'AutoMod'}`, inline: true },
          { name: 'Raison', value: reason || 'Aucune' }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(guild, 'moderation', embed, { __decor: { actorUser: moderatorUser, targetUser, caseId } });
    } catch {}
  }

  async logMute(member, moderatorUser, durationMs, reason) {
    try {
      const cfg = await this.getGuildConfig(member.guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logMutes) return;
      const caseId = await this.nextCaseId(member.guild.id);
      const embed = new EmbedBuilder()
        .setColor(Colors.DarkGold)
        .setTitle('🔇 Mute')
        .addFields(
          { name: 'Utilisateur', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
          { name: 'Modérateur', value: `${moderatorUser?.tag || 'AutoMod'}`, inline: true },
          { name: 'Durée', value: durationMs ? this.humanizeDuration(durationMs) : '—', inline: true },
          { name: 'Raison', value: reason || 'Aucune' }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(member.guild, 'moderation', embed, { __decor: { actorUser: moderatorUser, targetUser: member.user, caseId } });
    } catch {}
  }

  async logUnmute(member, moderatorUser, reason) {
    try {
      const cfg = await this.getGuildConfig(member.guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logMutes) return;
      const caseId = await this.nextCaseId(member.guild.id);
      const embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('🔈 Unmute')
        .addFields(
          { name: 'Utilisateur', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
          { name: 'Modérateur', value: `${moderatorUser?.tag || 'AutoMod'}`, inline: true },
          { name: 'Raison', value: reason || 'Aucune' }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(member.guild, 'moderation', embed, { __decor: { actorUser: moderatorUser, targetUser: member.user, caseId } });
    } catch {}
  }

  async logKick(member, moderatorUser, reason) {
    try {
      const cfg = await this.getGuildConfig(member.guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logKicks) return;
      const caseId = await this.nextCaseId(member.guild.id);
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
      await this.sendToCategory(member.guild, 'moderation', embed, { __decor: { actorUser: moderatorUser, targetUser: member.user, caseId } });
    } catch {}
  }

  async logBan(guild, user, reason, moderatorUser = null) {
    try {
      const cfg = await this.getGuildConfig(guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logBans) return;
      const caseId = await this.nextCaseId(guild.id);
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
      await this.sendToCategory(guild, 'moderation', embed, { __decor: { actorUser: moderatorUser, targetUser: user, caseId } });
    } catch {}
  }

  async logUnban(guild, user, moderatorUser = null) {
    try {
      const cfg = await this.getGuildConfig(guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logUnbans) return;
      const caseId = await this.nextCaseId(guild.id);
      const embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('♻️ Unban')
        .addFields(
          { name: 'Utilisateur', value: `${user.tag || '—'} (<@${user.id}>)`, inline: true },
          { name: 'Modérateur', value: `${moderatorUser?.tag || 'AutoMod'}`, inline: true }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(guild, 'moderation', embed, { __decor: { actorUser: moderatorUser, targetUser: user, caseId } });
    } catch {}
  }

  async logPurge(channel, moderatorUser, count) {
    try {
      const cfg = await this.getGuildConfig(channel.guild.id);
      const cat = cfg.categories.moderation;
      if (!cat?.enabled || !cat.logPurges) return;
      const caseId = await this.nextCaseId(channel.guild.id);
      const embed = new EmbedBuilder()
        .setColor(0x95a5a6)
        .setTitle('🧹 Purge de messages')
        .addFields(
          { name: 'Salon', value: `<#${channel.id}>`, inline: true },
          { name: 'Modérateur', value: `${moderatorUser?.tag || 'AutoMod'}`, inline: true },
          { name: 'Nombre', value: `${count || '—'}`, inline: true }
        )
        .setTimestamp(new Date());
      await this.sendToCategory(channel.guild, 'moderation', embed, { __decor: { actorUser: moderatorUser, caseId } });
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
      await this.sendToCategory(guild, 'economy', embed, { __decor: { actorUser: user } });
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
      await this.sendToCategory(guild, 'economy', embed, { __decor: { actorUser: fromUser, targetUser: toUser } });
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
      await this.sendToCategory(guild, 'economy', embed, { __decor: { actorUser: moderatorUser, targetUser } });
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
      await this.sendToCategory(guild, 'economy', embed, { __decor: { actorUser: moderatorUser, targetUser } });
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
      await this.sendToCategory(message.guild, 'economy', embed, { __decor: { actorUser: message.author } });
    } catch {}
  }

	// === Channels ===
	async logChannelCreate(channel) {
		try {
			const guild = channel.guild;
			if (!guild) return;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.channels;
			if (!cat?.enabled || !cat.logCreates) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.Green)
				.setTitle('📺 Salon créé')
				.addFields(
					{ name: 'Salon', value: channel.isTextBased?.() ? `<#${channel.id}>` : `${channel.name} (${channel.id})`, inline: true },
					{ name: 'Type', value: `${channel.type}`, inline: true }
				)
				.setTimestamp(new Date());
			await this.sendToCategory(guild, 'channels', embed);
		} catch {}
	}

	async logChannelDelete(channel) {
		try {
			const guild = channel.guild;
			if (!guild) return;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.channels;
			if (!cat?.enabled || !cat.logDeletes) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.DarkRed)
				.setTitle('🗑️ Salon supprimé')
				.addFields(
					{ name: 'Nom', value: `${channel.name || '—'}`, inline: true },
					{ name: 'Type', value: `${channel.type}`, inline: true }
				)
				.setTimestamp(new Date());
			await this.sendToCategory(guild, 'channels', embed);
		} catch {}
	}

	async logChannelUpdate(oldChannel, newChannel) {
		try {
			const guild = newChannel.guild;
			if (!guild) return;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.channels;
			if (!cat?.enabled || !cat.logUpdates) return;
			const changes = [];
			if (oldChannel.name !== newChannel.name) changes.push({ name: 'Nom', value: `${oldChannel.name} → ${newChannel.name}` });
			if (typeof oldChannel.topic !== 'undefined' && oldChannel.topic !== newChannel.topic) changes.push({ name: 'Sujet', value: `${oldChannel.topic || '—'} → ${newChannel.topic || '—'}` });
			if (typeof oldChannel.nsfw !== 'undefined' && oldChannel.nsfw !== newChannel.nsfw) changes.push({ name: 'NSFW', value: `${oldChannel.nsfw ? 'Oui' : 'Non'} → ${newChannel.nsfw ? 'Oui' : 'Non'}` });
			if (typeof oldChannel.rateLimitPerUser !== 'undefined' && oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) changes.push({ name: 'Slowmode', value: `${oldChannel.rateLimitPerUser || 0}s → ${newChannel.rateLimitPerUser || 0}s` });
			if (changes.length === 0) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.Blurple)
				.setTitle('✏️ Salon modifié')
				.addFields(
					{ name: 'Salon', value: newChannel.isTextBased?.() ? `<#${newChannel.id}>` : `${newChannel.name} (${newChannel.id})` },
					...changes.slice(0, 24)
				)
				.setTimestamp(new Date());
			await this.sendToCategory(guild, 'channels', embed);
		} catch {}
	}

	// === Threads ===
	async logThreadCreate(thread) {
		try {
			const guild = thread.guild;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.threads;
			if (!cat?.enabled || !cat.logCreates) return;
			
			// Récupérer les informations du créateur et des membres
			let creatorInfo = 'Inconnu';
			let memberCount = 0;
			let parentChannelName = 'Canal supprimé';
			
			try {
				// Récupérer le canal parent
				if (thread.parentId) {
					const parentChannel = guild.channels.cache.get(thread.parentId) || await guild.channels.fetch(thread.parentId).catch(() => null);
					if (parentChannel) {
						parentChannelName = `#${parentChannel.name}`;
					}
				}
				
				// Récupérer le créateur du thread
				if (thread.ownerId) {
					const owner = guild.members.cache.get(thread.ownerId) || await guild.members.fetch(thread.ownerId).catch(() => null);
					if (owner) {
						creatorInfo = `${owner.user.tag} (<@${owner.id}>)`;
					} else {
						creatorInfo = `<@${thread.ownerId}>`;
					}
				}
				
				// Récupérer le nombre de membres
				if (thread.memberCount !== undefined) {
					memberCount = thread.memberCount;
				} else {
					// Fallback: essayer de fetch les membres
					try {
						const members = await thread.members.fetch();
						memberCount = members.size;
					} catch {
						memberCount = 1; // Au minimum le créateur
					}
				}
			} catch {}
			
			const embed = new EmbedBuilder()
				.setColor(Colors.Green)
				.setTitle('🧵 Thread créé')
				.addFields(
					{ name: 'Thread', value: `<#${thread.id}> (${thread.name || 'Sans nom'})`, inline: true },
					{ name: 'Canal parent', value: thread.parentId ? `<#${thread.parentId}> (${parentChannelName})` : '—', inline: true },
					{ name: 'Créateur', value: creatorInfo, inline: true },
					{ name: 'Membres', value: `${memberCount} membre${memberCount > 1 ? 's' : ''}`, inline: true }
				)
				.setTimestamp(new Date());
				
			// Ajouter l'avatar du créateur si disponible
			let creatorUser = null;
			if (thread.ownerId) {
				creatorUser = guild.members.cache.get(thread.ownerId)?.user;
			}
			
			await this.sendToCategory(guild, 'threads', embed, { __decor: { actorUser: creatorUser } });
		} catch {}
	}

	async logThreadDelete(thread) {
		try {
			const guild = thread.guild;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.threads;
			if (!cat?.enabled || !cat.logDeletes) return;
			
			// Récupérer les informations du créateur et des membres
			let creatorInfo = 'Inconnu';
			let memberCount = 0;
			let parentChannelName = 'Canal supprimé';
			
			try {
				// Récupérer le canal parent
				if (thread.parentId) {
					const parentChannel = guild.channels.cache.get(thread.parentId) || await guild.channels.fetch(thread.parentId).catch(() => null);
					if (parentChannel) {
						parentChannelName = `#${parentChannel.name}`;
					}
				}
				
				// Récupérer le créateur du thread
				if (thread.ownerId) {
					const owner = guild.members.cache.get(thread.ownerId) || await guild.members.fetch(thread.ownerId).catch(() => null);
					if (owner) {
						creatorInfo = `${owner.user.tag} (<@${owner.id}>)`;
					} else {
						creatorInfo = `<@${thread.ownerId}>`;
					}
				}
				
				// Récupérer le nombre de membres
				if (thread.memberCount !== undefined) {
					memberCount = thread.memberCount;
				} else {
					// Fallback: essayer de fetch les membres
					try {
						const members = await thread.members.fetch();
						memberCount = members.size;
					} catch {
						memberCount = 1; // Au minimum le créateur
					}
				}
			} catch {}
			
			const embed = new EmbedBuilder()
				.setColor(Colors.DarkRed)
				.setTitle('🧵 Thread supprimé')
				.addFields(
					{ name: 'Nom', value: `${thread.name || '—'}`, inline: true },
					{ name: 'Canal parent', value: thread.parentId ? `<#${thread.parentId}> (${parentChannelName})` : '—', inline: true },
					{ name: 'Créateur', value: creatorInfo, inline: true },
					{ name: 'Membres', value: `${memberCount} membre${memberCount > 1 ? 's' : ''}`, inline: true }
				)
				.setTimestamp(new Date());
				
			// Ajouter l'avatar du créateur si disponible
			let creatorUser = null;
			if (thread.ownerId) {
				creatorUser = guild.members.cache.get(thread.ownerId)?.user;
			}
			
			await this.sendToCategory(guild, 'threads', embed, { __decor: { actorUser: creatorUser } });
		} catch {}
	}

	async logThreadUpdate(oldThread, newThread) {
		try {
			const guild = newThread.guild;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.threads;
			if (!cat?.enabled || !cat.logUpdates) return;
			
			const changes = [];
			if (oldThread.name !== newThread.name) changes.push({ name: 'Nom', value: `${oldThread.name} → ${newThread.name}` });
			if (oldThread.archived !== newThread.archived) {
				const archiveChange = `${oldThread.archived ? 'Archivé' : 'Ouvert'} → ${newThread.archived ? 'Archivé' : 'Ouvert'}`;
				changes.push({ name: 'Archive', value: archiveChange });
			}
			if (oldThread.locked !== newThread.locked) changes.push({ name: 'Verrou', value: `${oldThread.locked ? 'Verrouillé' : 'Déverrouillé'} → ${newThread.locked ? 'Verrouillé' : 'Déverrouillé'}` });
			
			// Si aucun changement significatif, ne pas logger
			if (changes.length === 0) return;
			
			// Récupérer les informations du créateur et des membres
			let creatorInfo = 'Inconnu';
			let memberCount = 0;
			let parentChannelName = 'Canal supprimé';
			
			try {
				// Récupérer le canal parent
				if (newThread.parentId) {
					const parentChannel = guild.channels.cache.get(newThread.parentId) || await guild.channels.fetch(newThread.parentId).catch(() => null);
					if (parentChannel) {
						parentChannelName = `#${parentChannel.name}`;
					}
				}
				
				// Récupérer le créateur du thread
				if (newThread.ownerId) {
					const owner = guild.members.cache.get(newThread.ownerId) || await guild.members.fetch(newThread.ownerId).catch(() => null);
					if (owner) {
						creatorInfo = `${owner.user.tag} (<@${owner.id}>)`;
					} else {
						creatorInfo = `<@${newThread.ownerId}>`;
					}
				}
				
				// Récupérer le nombre de membres
				if (newThread.memberCount !== undefined) {
					memberCount = newThread.memberCount;
				} else {
					// Fallback: essayer de fetch les membres
					try {
						const members = await newThread.members.fetch();
						memberCount = members.size;
					} catch {
						memberCount = 1; // Au minimum le créateur
					}
				}
			} catch {}
			
			const embed = new EmbedBuilder()
				.setColor(Colors.Blurple)
				.setTitle('✏️ Thread modifié')
				.addFields(
					{ name: 'Thread', value: `<#${newThread.id}> (${newThread.name || 'Sans nom'})` },
					{ name: 'Canal parent', value: newThread.parentId ? `<#${newThread.parentId}> (${parentChannelName})` : '—', inline: true },
					{ name: 'Créateur', value: creatorInfo, inline: true },
					{ name: 'Membres', value: `${memberCount} membre${memberCount > 1 ? 's' : ''}`, inline: true },
					...changes.slice(0, 21)
				)
				.setTimestamp(new Date());
				
			// Ajouter l'avatar du créateur si disponible
			let creatorUser = null;
			if (newThread.ownerId) {
				creatorUser = guild.members.cache.get(newThread.ownerId)?.user;
			}
			
			await this.sendToCategory(guild, 'threads', embed, { __decor: { actorUser: creatorUser } });
		} catch {}
	}

	// === Emojis ===
	async logEmojiCreate(emoji) {
		try {
			const guild = emoji.guild;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.emojis;
			if (!cat?.enabled || !cat.logCreates) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.Green)
				.setTitle('😜 Émoji créé')
				.addFields(
					{ name: 'Émoji', value: `<:${emoji.name}:${emoji.id}> (${emoji.name})`, inline: true },
					{ name: 'Animé', value: emoji.animated ? 'Oui' : 'Non', inline: true }
				)
				.setTimestamp(new Date());
			await this.sendToCategory(guild, 'emojis', embed);
		} catch {}
	}

	async logEmojiDelete(emoji) {
		try {
			const guild = emoji.guild;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.emojis;
			if (!cat?.enabled || !cat.logDeletes) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.DarkRed)
				.setTitle('🗑️ Émoji supprimé')
				.addFields(
					{ name: 'Émoji', value: `${emoji.name} (${emoji.id})`, inline: true }
				)
				.setTimestamp(new Date());
			await this.sendToCategory(guild, 'emojis', embed);
		} catch {}
	}

	async logEmojiUpdate(oldEmoji, newEmoji) {
		try {
			const guild = newEmoji.guild;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.emojis;
			if (!cat?.enabled || !cat.logUpdates) return;
			const changes = [];
			if (oldEmoji.name !== newEmoji.name) changes.push({ name: 'Nom', value: `${oldEmoji.name} → ${newEmoji.name}` });
			if (changes.length === 0) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.Blurple)
				.setTitle('✏️ Émoji modifié')
				.addFields(
					{ name: 'Émoji', value: `<:${newEmoji.name}:${newEmoji.id}>` },
					...changes.slice(0, 24)
				)
				.setTimestamp(new Date());
			await this.sendToCategory(guild, 'emojis', embed);
		} catch {}
	}

	// === Stickers ===
	async logStickerCreate(sticker) {
		try {
			const guild = sticker.guild;
			if (!guild) return;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.stickers;
			if (!cat?.enabled || !cat.logCreates) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.Green)
				.setTitle('🏷️ Sticker créé')
				.addFields(
					{ name: 'Sticker', value: `${sticker.name} (${sticker.id})`, inline: true }
				)
				.setTimestamp(new Date());
			await this.sendToCategory(guild, 'stickers', embed);
		} catch {}
	}

	async logStickerDelete(sticker) {
		try {
			const guild = sticker.guild;
			if (!guild) return;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.stickers;
			if (!cat?.enabled || !cat.logDeletes) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.DarkRed)
				.setTitle('🗑️ Sticker supprimé')
				.addFields(
					{ name: 'Sticker', value: `${sticker.name} (${sticker.id})`, inline: true }
				)
				.setTimestamp(new Date());
			await this.sendToCategory(guild, 'stickers', embed);
		} catch {}
	}

	async logStickerUpdate(oldSticker, newSticker) {
		try {
			const guild = newSticker.guild;
			if (!guild) return;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.stickers;
			if (!cat?.enabled || !cat.logUpdates) return;
			const changes = [];
			if (oldSticker.name !== newSticker.name) changes.push({ name: 'Nom', value: `${oldSticker.name} → ${newSticker.name}` });
			if (changes.length === 0) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.Blurple)
				.setTitle('✏️ Sticker modifié')
				.addFields(
					{ name: 'Sticker', value: `${newSticker.name} (${newSticker.id})` },
					...changes.slice(0, 24)
				)
				.setTimestamp(new Date());
			await this.sendToCategory(guild, 'stickers', embed);
		} catch {}
	}

	// === Invites ===
	async logInviteCreate(invite) {
		try {
			const guild = invite.guild;
			if (!guild) return;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.invites;
			if (!cat?.enabled || !cat.logCreates) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.Green)
				.setTitle('✉️ Invitation créée')
				.addFields(
					{ name: 'Code', value: invite.code || '—', inline: true },
					{ name: 'Salon', value: invite.channelId ? `<#${invite.channelId}>` : '—', inline: true },
					{ name: 'Par', value: invite.inviter ? `${invite.inviter.tag} (<@${invite.inviter.id}>)` : '—', inline: true }
				)
				.setTimestamp(new Date());
			await this.sendToCategory(guild, 'invites', embed, { __decor: { actorUser: invite.inviter } });
		} catch {}
	}

	async logInviteDelete(invite) {
		try {
			const guild = invite.guild;
			if (!guild) return;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.invites;
			if (!cat?.enabled || !cat.logDeletes) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.DarkRed)
				.setTitle('🗑️ Invitation supprimée')
				.addFields(
					{ name: 'Code', value: invite.code || '—', inline: true },
					{ name: 'Salon', value: invite.channelId ? `<#${invite.channelId}>` : '—', inline: true }
				)
				.setTimestamp(new Date());
			await this.sendToCategory(guild, 'invites', embed);
		} catch {}
	}

	// === Webhooks ===
	async logWebhookUpdate(channel) {
		try {
			const guild = channel.guild;
			if (!guild) return;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.webhooks;
			if (!cat?.enabled || !cat.logUpdates) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.Orange)
				.setTitle('🪝 Webhooks mis à jour')
				.addFields(
					{ name: 'Salon', value: channel.isTextBased?.() ? `<#${channel.id}>` : `${channel.name} (${channel.id})` }
				)
				.setTimestamp(new Date());
			await this.sendToCategory(guild, 'webhooks', embed);
		} catch {}
	}

	// === Server (Guild) ===
	async logGuildUpdate(oldGuild, newGuild) {
		try {
			const cfg = await this.getGuildConfig(newGuild.id);
			const cat = cfg.categories.server;
			if (!cat?.enabled || !cat.logUpdates) return;
			const changes = [];
			if (oldGuild.name !== newGuild.name) changes.push({ name: 'Nom', value: `${oldGuild.name} → ${newGuild.name}` });
			if (oldGuild.icon !== newGuild.icon) changes.push({ name: 'Icône', value: `${oldGuild.icon ? 'Oui' : 'Non'} → ${newGuild.icon ? 'Oui' : 'Non'}` });
			if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) changes.push({ name: 'Vanity URL', value: `${oldGuild.vanityURLCode || '—'} → ${newGuild.vanityURLCode || '—'}` });
			if (changes.length === 0) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.Blurple)
				.setTitle('🏰 Serveur modifié')
				.addFields(...changes.slice(0, 24))
				.setTimestamp(new Date());
			await this.sendToCategory(newGuild, 'server', embed);
		} catch {}
	}

	// === Boosts ===
	async logBoostStart(member) {
		try {
			const cfg = await this.getGuildConfig(member.guild.id);
			const cat = cfg.categories.boosts;
			if (!cat?.enabled || !cat.logStart) return;
			const embed = new EmbedBuilder()
				.setColor(0x9b59b6)
				.setTitle('💎 Boost activé')
				.addFields({ name: 'Membre', value: `${member.user.tag} (<@${member.id}>)` })
				.setTimestamp(new Date());
			await this.sendToCategory(member.guild, 'boosts', embed, { __decor: { actorUser: member.user } });
		} catch {}
	}

	async logBoostEnd(member) {
		try {
			const cfg = await this.getGuildConfig(member.guild.id);
			const cat = cfg.categories.boosts;
			if (!cat?.enabled || !cat.logEnd) return;
			const embed = new EmbedBuilder()
				.setColor(0x8e44ad)
				.setTitle('💔 Boost terminé')
				.addFields({ name: 'Membre', value: `${member.user.tag} (<@${member.id}>)` })
				.setTimestamp(new Date());
			await this.sendToCategory(member.guild, 'boosts', embed, { __decor: { targetUser: member.user } });
		} catch {}
	}

	// === Scheduled Events ===
	async logScheduledEventCreate(evt) {
		try {
			const guild = evt.guild;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.events;
			if (!cat?.enabled || !cat.logCreates) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.Green)
				.setTitle('📅 Événement créé')
				.addFields(
					{ name: 'Nom', value: `${evt.name}`, inline: true },
					{ name: 'Début', value: evt.scheduledStartAt ? `<t:${Math.floor(evt.scheduledStartAt.getTime()/1000)}:F>` : '—', inline: true }
				)
				.setTimestamp(new Date());
			await this.sendToCategory(guild, 'events', embed);
		} catch {}
	}

	async logScheduledEventUpdate(oldEvt, newEvt) {
		try {
			const guild = newEvt.guild;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.events;
			if (!cat?.enabled || !cat.logUpdates) return;
			const changes = [];
			if (oldEvt.name !== newEvt.name) changes.push({ name: 'Nom', value: `${oldEvt.name} → ${newEvt.name}` });
			if (oldEvt.scheduledStartAt?.getTime() !== newEvt.scheduledStartAt?.getTime()) changes.push({ name: 'Début', value: `${oldEvt.scheduledStartAt ? `<t:${Math.floor(oldEvt.scheduledStartAt.getTime()/1000)}:F>` : '—'} → ${newEvt.scheduledStartAt ? `<t:${Math.floor(newEvt.scheduledStartAt.getTime()/1000)}:F>` : '—'}` });
			if (changes.length === 0) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.Blurple)
				.setTitle('✏️ Événement modifié')
				.addFields(...changes.slice(0, 24))
				.setTimestamp(new Date());
			await this.sendToCategory(guild, 'events', embed);
		} catch {}
	}

	async logScheduledEventDelete(evt) {
		try {
			const guild = evt.guild;
			const cfg = await this.getGuildConfig(guild.id);
			const cat = cfg.categories.events;
			if (!cat?.enabled || !cat.logDeletes) return;
			const embed = new EmbedBuilder()
				.setColor(Colors.DarkRed)
				.setTitle('🗑️ Événement supprimé')
				.addFields(
					{ name: 'Nom', value: `${evt.name}`, inline: true }
				)
				.setTimestamp(new Date());
			await this.sendToCategory(guild, 'events', embed);
		} catch {}
	}
}

module.exports = LogManager;