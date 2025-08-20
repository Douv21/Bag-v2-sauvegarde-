const { ChannelType, PermissionFlagsBits } = require('discord.js');

class QuarantineChannelManager {
  constructor(moderationManager) {
    this.moderationManager = moderationManager;
    this.quarantineChannels = new Map(); // userId -> { textChannel, voiceChannel }
  }

  /**
   * Créer des canaux de quarantaine pour un membre
   * @param {GuildMember} member - Le membre à mettre en quarantaine
   * @param {String} reason - Raison de la quarantaine
   * @returns {Object} Les canaux créés
   */
  async createQuarantineChannels(member, reason = 'Quarantaine automatique') {
    try {
      const config = await this.moderationManager.getSecurityConfig(member.guild.id);
      const quarantineRoleId = config.accessControl?.quarantineRoleId;
      
      if (!quarantineRoleId) {
        throw new Error('Rôle de quarantaine non configuré');
      }

      const quarantineRole = member.guild.roles.cache.get(quarantineRoleId);
      if (!quarantineRole) {
        throw new Error('Rôle de quarantaine introuvable');
      }

      // Créer ou récupérer la catégorie de quarantaine
      const category = await this.getOrCreateQuarantineCategory(member.guild);

      // Créer le canal texte
      const textChannel = await member.guild.channels.create({
        name: `quarantaine-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${member.user.discriminator}`,
        type: ChannelType.GuildText,
        parent: category,
        topic: `Quarantaine de ${member.user.tag} - ${reason}`,
        permissionOverwrites: [
          {
            id: member.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: member.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AddReactions
            ]
          },
          {
            id: quarantineRoleId,
            allow: [PermissionFlagsBits.ViewChannel]
          },
          // Permissions pour les modérateurs
          ...this.getModeratorPermissions(member.guild, config)
        ]
      });

      // Créer le canal vocal
      const voiceChannel = await member.guild.channels.create({
        name: `🔒 Quarantaine ${member.user.username}`,
        type: ChannelType.GuildVoice,
        parent: category,
        permissionOverwrites: [
          {
            id: member.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: member.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.UseVAD
            ]
          },
          {
            id: quarantineRoleId,
            allow: [PermissionFlagsBits.ViewChannel]
          },
          // Permissions pour les modérateurs
          ...this.getModeratorPermissions(member.guild, config)
        ]
      });

      // Configurer les permissions du rôle de quarantaine sur tous les canaux
      await this.configureQuarantineRolePermissions(member.guild, quarantineRole);

      // Ajouter le rôle de quarantaine
      await member.roles.add(quarantineRole, reason);

      // Enregistrer les canaux
      this.quarantineChannels.set(member.user.id, {
        textChannel,
        voiceChannel,
        createdAt: Date.now(),
        reason
      });

      // Envoyer message de bienvenue dans le canal texte
      await this.sendWelcomeMessage(textChannel, member, reason);

      console.log(`🔒 Canaux de quarantaine créés pour ${member.user.tag}`);
      return { textChannel, voiceChannel };

    } catch (error) {
      console.error('Erreur création canaux quarantaine:', error);
      throw error;
    }
  }

  /**
   * Libérer un membre de la quarantaine
   * @param {GuildMember} member - Le membre à libérer
   * @param {String} reason - Raison de la libération
   */
  async releaseFromQuarantine(member, reason = 'Libéré par un administrateur') {
    try {
      const config = await this.moderationManager.getSecurityConfig(member.guild.id);
      const quarantineRoleId = config.accessControl?.quarantineRoleId;
      const verifiedRoleId = config.accessControl?.verifiedRoleId;

      // Retirer le rôle de quarantaine
      if (quarantineRoleId) {
        const quarantineRole = member.guild.roles.cache.get(quarantineRoleId);
        if (quarantineRole && member.roles.cache.has(quarantineRoleId)) {
          await member.roles.remove(quarantineRole, reason);
        }
      }

      // Ajouter le rôle vérifié
      if (verifiedRoleId) {
        const verifiedRole = member.guild.roles.cache.get(verifiedRoleId);
        if (verifiedRole) {
          await member.roles.add(verifiedRole, reason);
        }
      }

      // Supprimer les canaux de quarantaine
      await this.deleteQuarantineChannels(member.user.id);

      // Notifier le membre
      try {
        await member.send(
          `✅ **Libéré de quarantaine - ${member.guild.name}**\n\n` +
          `Vous avez été libéré de la quarantaine.\n` +
          `**Raison :** ${reason}\n\n` +
          `Vous avez maintenant accès à tous les canaux autorisés. Bienvenue !`
        );
      } catch {}

      console.log(`✅ ${member.user.tag} libéré de quarantaine`);

    } catch (error) {
      console.error('Erreur libération quarantaine:', error);
      throw error;
    }
  }

  /**
   * Supprimer les canaux de quarantaine d'un membre
   * @param {String} userId - ID de l'utilisateur
   */
  async deleteQuarantineChannels(userId) {
    try {
      const channels = this.quarantineChannels.get(userId);
      if (!channels) return;

      // Supprimer le canal texte
      if (channels.textChannel) {
        try {
          await channels.textChannel.delete('Fin de quarantaine');
        } catch (error) {
          console.error('Erreur suppression canal texte:', error);
        }
      }

      // Supprimer le canal vocal
      if (channels.voiceChannel) {
        try {
          await channels.voiceChannel.delete('Fin de quarantaine');
        } catch (error) {
          console.error('Erreur suppression canal vocal:', error);
        }
      }

      // Retirer de la map
      this.quarantineChannels.delete(userId);

    } catch (error) {
      console.error('Erreur suppression canaux:', error);
    }
  }

  /**
   * Obtenir ou créer la catégorie de quarantaine
   * @param {Guild} guild - Le serveur
   * @returns {CategoryChannel} La catégorie
   */
  async getOrCreateQuarantineCategory(guild) {
    // Chercher une catégorie existante
    let category = guild.channels.cache.find(
      c => c.type === ChannelType.GuildCategory && 
      c.name.toLowerCase().includes('quarantaine')
    );

    if (!category) {
      // Créer la catégorie
      category = await guild.channels.create({
        name: '🔒 QUARANTAINE',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          }
        ]
      });
    }

    return category;
  }

  /**
   * Configurer les permissions du rôle de quarantaine sur tous les canaux
   * @param {Guild} guild - Le serveur
   * @param {Role} quarantineRole - Le rôle de quarantaine
   */
  async configureQuarantineRolePermissions(guild, quarantineRole) {
    try {
      console.log(`🔧 Configuration des permissions du rôle de quarantaine: ${quarantineRole.name}`);
      
      // Obtenir tous les canaux du serveur (sauf les canaux de quarantaine)
      const channels = guild.channels.cache.filter(channel => {
        // Exclure les canaux de quarantaine
        if (channel.parent && channel.parent.name.toLowerCase().includes('quarantaine')) {
          return false;
        }
        if (channel.name.toLowerCase().includes('quarantaine')) {
          return false;
        }
        // Inclure seulement les canaux texte, vocaux et catégories
        return [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildCategory].includes(channel.type);
      });

      let configuredCount = 0;
      const errors = [];

      for (const channel of channels.values()) {
        try {
          // Vérifier si le rôle a déjà des permissions configurées sur ce canal
          const existingOverwrite = channel.permissionOverwrites.cache.get(quarantineRole.id);
          
          if (!existingOverwrite || !existingOverwrite.deny.has(PermissionFlagsBits.ViewChannel)) {
            // Configurer les permissions pour refuser l'accès
            await channel.permissionOverwrites.edit(quarantineRole, {
              ViewChannel: false,
              SendMessages: false,
              Connect: false,
              Speak: false,
              SendMessagesInThreads: false,
              CreatePrivateThreads: false,
              CreatePublicThreads: false,
              UseEmbeddedActivities: false,
              UseApplicationCommands: false
            }, {
              reason: 'Configuration automatique du rôle de quarantaine'
            });
            
            configuredCount++;
          }
        } catch (channelError) {
          errors.push(`${channel.name}: ${channelError.message}`);
        }
      }

      console.log(`✅ Permissions configurées sur ${configuredCount} canaux pour le rôle ${quarantineRole.name}`);
      
      if (errors.length > 0) {
        console.warn(`⚠️ Erreurs de configuration sur ${errors.length} canaux:`, errors.slice(0, 5));
      }

    } catch (error) {
      console.error('Erreur configuration permissions quarantaine:', error);
      throw new Error(`Impossible de configurer les permissions du rôle de quarantaine: ${error.message}`);
    }
  }

  /**
   * Obtenir les permissions pour les modérateurs
   * @param {Guild} guild - Le serveur
   * @param {Object} config - Configuration de sécurité
   * @returns {Array} Permissions overwrites
   */
  getModeratorPermissions(guild, config) {
    const permissions = [];

    // Permissions pour le rôle admin configuré
    if (config.autoAlerts?.moderatorRoleId) {
      permissions.push({
        id: config.autoAlerts.moderatorRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak,
          PermissionFlagsBits.MuteMembers,
          PermissionFlagsBits.DeafenMembers
        ]
      });
    }

    // Permissions pour les administrateurs
    permissions.push({
      id: guild.roles.cache.find(r => r.permissions.has(PermissionFlagsBits.Administrator))?.id || guild.ownerId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.MuteMembers,
        PermissionFlagsBits.DeafenMembers
      ]
    });

    return permissions;
  }

  /**
   * Envoyer le message de bienvenue dans le canal de quarantaine
   * @param {TextChannel} channel - Canal texte
   * @param {GuildMember} member - Membre en quarantaine
   * @param {String} reason - Raison de la quarantaine
   */
  async sendWelcomeMessage(channel, member, reason) {
    try {
      await channel.send({
        content: `🔒 **Quarantaine - ${member.user.tag}**`,
        embeds: [{
          title: '🔒 Vous êtes en quarantaine',
          description: `Bonjour ${member.user}, vous avez été placé en quarantaine pour vérification.`,
          color: 0xffd43b,
          fields: [
            {
              name: '📋 Raison',
              value: reason,
              inline: false
            },
            {
              name: '📍 Où vous êtes',
              value: `• **Canal texte :** ${channel}\n• **Canal vocal :** Disponible dans cette catégorie\n• **Accès :** Limité à ces canaux uniquement`,
              inline: false
            },
            {
              name: '⏰ Que faire maintenant ?',
              value: `• Attendez qu'un administrateur examine votre cas\n• Vous pouvez utiliser ce canal pour communiquer\n• Respectez les règles du serveur\n• Soyez patient, nous traiterons votre cas rapidement`,
              inline: false
            },
            {
              name: '🆘 Besoin d\'aide ?',
              value: `Utilisez ce canal pour poser vos questions aux modérateurs.\nIls recevront une notification de votre message.`,
              inline: false
            }
          ],
          footer: {
            text: 'Système de quarantaine automatique',
            icon_url: member.guild.iconURL()
          },
          timestamp: new Date().toISOString()
        }]
      });

      // Ping les modérateurs
      const config = await this.moderationManager.getSecurityConfig(member.guild.id);
      if (config.autoAlerts?.moderatorRoleId) {
        await channel.send(`<@&${config.autoAlerts.moderatorRoleId}> Un nouveau membre est en quarantaine et peut avoir besoin d'assistance.`);
      }

    } catch (error) {
      console.error('Erreur envoi message bienvenue:', error);
    }
  }

  /**
   * Nettoyer les canaux de quarantaine orphelins
   * @param {Guild} guild - Le serveur
   */
  async cleanupOrphanedChannels(guild) {
    try {
      const category = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && 
        c.name.toLowerCase().includes('quarantaine')
      );

      if (!category) return;

      const config = await this.moderationManager.getSecurityConfig(guild.id);
      const quarantineRoleId = config.accessControl?.quarantineRoleId;

      if (!quarantineRoleId) return;

      // Trouver les canaux de quarantaine
      const quarantineChannels = category.children.cache.filter(
        c => c.name.includes('quarantaine-') || c.name.includes('🔒 Quarantaine')
      );

      for (const channel of quarantineChannels.values()) {
        // Vérifier si le membre correspondant existe encore et a le rôle
        const userIdMatch = channel.name.match(/quarantaine-(.+?)-\d{4}/) || 
                           channel.name.match(/🔒 Quarantaine (.+)/);
        
        if (userIdMatch) {
          const username = userIdMatch[1];
          const member = guild.members.cache.find(m => 
            m.user.username.toLowerCase().replace(/[^a-z0-9]/g, '') === username ||
            m.user.username === username
          );

          // Si le membre n'existe plus ou n'a plus le rôle, supprimer le canal
          if (!member || !member.roles.cache.has(quarantineRoleId)) {
            try {
              await channel.delete('Nettoyage automatique - membre non trouvé ou sans rôle');
              console.log(`🧹 Canal de quarantaine orphelin supprimé: ${channel.name}`);
            } catch (error) {
              console.error('Erreur suppression canal orphelin:', error);
            }
          }
        }
      }

    } catch (error) {
      console.error('Erreur nettoyage canaux orphelins:', error);
    }
  }

  /**
   * Obtenir les informations de quarantaine d'un membre
   * @param {String} userId - ID de l'utilisateur
   * @returns {Object|null} Informations de quarantaine
   */
  getQuarantineInfo(userId) {
    return this.quarantineChannels.get(userId) || null;
  }

  /**
   * Lister tous les membres en quarantaine
   * @param {Guild} guild - Le serveur
   * @returns {Array} Liste des membres en quarantaine
   */
  async listQuarantinedMembers(guild) {
    try {
      const config = await this.moderationManager.getSecurityConfig(guild.id);
      const quarantineRoleId = config.accessControl?.quarantineRoleId;

      if (!quarantineRoleId) return [];

      const quarantineRole = guild.roles.cache.get(quarantineRoleId);
      if (!quarantineRole) return [];

      return quarantineRole.members.map(member => ({
        member,
        channels: this.getQuarantineInfo(member.user.id),
        duration: this.getQuarantineInfo(member.user.id)?.createdAt ? 
          Date.now() - this.getQuarantineInfo(member.user.id).createdAt : 0
      }));

    } catch (error) {
      console.error('Erreur liste membres quarantaine:', error);
      return [];
    }
  }
}

module.exports = QuarantineChannelManager;