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

      // Appliquer des refus au niveau du membre pour garantir l'isolation même si des autorisations au niveau membre existent ailleurs
      try {
        await this.applyMemberLevelIsolation(member, category, [textChannel.id, voiceChannel.id]);
      } catch (isolationErr) {
        console.warn('⚠️ Échec application des refus au niveau membre:', isolationErr?.message || isolationErr);
      }

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

      // Restaurer les accès aux canaux (suppression des overrides spécifiques au membre)
      try {
        await this.restoreMemberChannelAccess(member);
      } catch (restErr) {
        console.warn('⚠️ Échec restauration des accès canaux:', restErr?.message || restErr);
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
      
      // ÉTAPE 1: Configurer les permissions par défaut du rôle au niveau serveur
      console.log('🔒 Configuration des permissions par défaut du rôle...');
      try {
        await quarantineRole.edit({
          permissions: [] // Retirer toutes les permissions par défaut
        }, 'Configuration automatique - Isolation complète');
        console.log('✅ Permissions par défaut du rôle supprimées');
      } catch (roleError) {
        console.warn('⚠️ Impossible de modifier les permissions par défaut du rôle:', roleError.message);
      }

      // ÉTAPE 2: Obtenir TOUS les canaux du serveur (sauf les canaux de quarantaine)
      const channels = guild.channels.cache.filter(channel => {
        // Exclure les canaux de quarantaine
        if (channel.parent && channel.parent.name.toLowerCase().includes('quarantaine')) {
          return false;
        }
        if (channel.name.toLowerCase().includes('quarantaine')) {
          return false;
        }
        
        // Inclure TOUS les types de canaux où l'accès peut être contrôlé
        return [
          ChannelType.GuildText,           // Canaux texte
          ChannelType.GuildVoice,          // Canaux vocaux
          ChannelType.GuildCategory,       // Catégories
          ChannelType.GuildAnnouncement,   // Canaux d'annonces
          ChannelType.GuildStageVoice,     // Canaux de conférence
          ChannelType.GuildForum,          // Forums
          ChannelType.PublicThread,        // Threads publics
          ChannelType.PrivateThread,       // Threads privés
          ChannelType.AnnouncementThread   // Threads d'annonces
        ].includes(channel.type);
      });

      console.log(`📊 ${channels.size} canaux à configurer`);

      let configuredCount = 0;
      let skippedCount = 0;
      const errors = [];
      const errorDetails = [];

      // ÉTAPE 3: Configurer les permissions par lots pour éviter le rate limiting
      const channelArray = Array.from(channels.values());
      const batchSize = 5; // Traiter 5 canaux à la fois

      for (let i = 0; i < channelArray.length; i += batchSize) {
        const batch = channelArray.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (channel) => {
          try {
            // Vérifier si le rôle a déjà des permissions configurées correctement
            const existingOverwrite = channel.permissionOverwrites.cache.get(quarantineRole.id);
            
            // Configurer seulement si nécessaire
            const needsConfiguration = !existingOverwrite || 
              !existingOverwrite.deny.has(PermissionFlagsBits.ViewChannel) ||
              !existingOverwrite.deny.has(PermissionFlagsBits.SendMessages) ||
              !existingOverwrite.deny.has(PermissionFlagsBits.Connect);

            if (needsConfiguration) {
              // Configuration complète des permissions restrictives
              const restrictivePermissions = {
                // Permissions de base
                ViewChannel: false,
                SendMessages: false,
                ReadMessageHistory: false,
                
                // Permissions vocales
                Connect: false,
                Speak: false,
                Stream: false,
                UseVAD: false,
                
                // Permissions avancées
                SendMessagesInThreads: false,
                CreatePrivateThreads: false,
                CreatePublicThreads: false,
                UseEmbeddedActivities: false,
                UseApplicationCommands: false,
                SendTTSMessages: false,
                AddReactions: false,
                EmbedLinks: false,
                AttachFiles: false,
                UseExternalEmojis: false,
                UseExternalStickers: false,
                MentionEveryone: false,
                
                // Permissions de modération (toujours refusées)
                ManageMessages: false,
                ManageThreads: false,
                
                // Permissions spécifiques aux forums et stages
                SendVoiceMessages: false,
                RequestToSpeak: false
              };

              await channel.permissionOverwrites.edit(quarantineRole, restrictivePermissions, {
                reason: 'Configuration automatique du rôle de quarantaine - Isolation complète'
              });
              
              configuredCount++;
              console.log(`🔒 Canal configuré: ${channel.name} (${channel.type})`);
            } else {
              skippedCount++;
            }
          } catch (channelError) {
            const errMsg = `${channel.name} (${channel.type}): ${channelError.message}`;
            errors.push(errMsg);
            errorDetails.push({ name: channel.name, id: channel.id, type: channel.type, error: channelError.message });
            console.error(`❌ Erreur canal ${channel.name}:`, channelError.message);
          }
        }));

        // Petit délai entre les lots pour éviter le rate limiting
        if (i + batchSize < channelArray.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // ÉTAPE 4: Vérifier les permissions sur @everyone pour s'assurer de l'isolation
      console.log('🔍 Vérification des permissions @everyone...');
      let everyoneConfigured = 0;
      
      for (const channel of channels.values()) {
        try {
          const everyoneOverwrite = channel.permissionOverwrites.cache.get(guild.roles.everyone.id);
          
          // S'assurer que @everyone peut voir le canal (sinon les restrictions n'ont pas de sens)
          if (!everyoneOverwrite || everyoneOverwrite.deny.has(PermissionFlagsBits.ViewChannel)) {
            // Ne pas modifier @everyone automatiquement, juste le signaler
            console.log(`⚠️ Canal ${channel.name}: @everyone ne peut pas voir ce canal`);
          }
        } catch (everyoneError) {
          console.warn(`⚠️ Impossible de vérifier @everyone sur ${channel.name}:`, everyoneError.message);
        }
      }

      // ÉTAPE 5: Rapport final
      console.log(`✅ Configuration terminée pour le rôle ${quarantineRole.name}`);
      console.log(`📊 Statistiques:`);
      console.log(`   • Canaux configurés: ${configuredCount}`);
      console.log(`   • Canaux ignorés (déjà configurés): ${skippedCount}`);
      console.log(`   • Erreurs: ${errors.length}`);
      
      if (errors.length > 0) {
        console.warn(`⚠️ Erreurs de configuration sur ${errors.length} canaux:`);
        errors.slice(0, 10).forEach(error => console.warn(`   • ${error}`));
        if (errors.length > 10) {
          console.warn(`   • Et ${errors.length - 10} autres erreurs...`);
        }
      }

      // Retourner les statistiques pour usage dans les commandes
      return {
        configured: configuredCount,
        skipped: skippedCount,
        errors: errors.length,
        total: channels.size,
        errorDetails
      };

    } catch (error) {
      console.error('Erreur configuration permissions quarantaine:', error);
      throw new Error(`Impossible de configurer les permissions du rôle de quarantaine: ${error.message}`);
    }
  }

  /**
   * Appliquer des refus explicites au niveau du membre sur tous les canaux hors quarantaine
   * pour garantir l'isolation même si des autorisations spécifiques existaient.
   * @param {GuildMember} member
   * @param {CategoryChannel} quarantineCategory
   * @param {Array<string>} excludeChannelIds - Liste d'IDs de canaux à exclure (canaux de quarantaine)
   */
  async applyMemberLevelIsolation(member, quarantineCategory, excludeChannelIds = []) {
    try {
      const guild = member.guild;
      const channels = guild.channels.cache.filter(channel => {
        if (excludeChannelIds.includes(channel.id)) return false;
        if (quarantineCategory && channel.parentId === quarantineCategory.id) return false;
        if (channel.name?.toLowerCase?.().includes('quarantaine')) return false;
        return [
          ChannelType.GuildText,
          ChannelType.GuildVoice,
          ChannelType.GuildCategory,
          ChannelType.GuildAnnouncement,
          ChannelType.GuildStageVoice,
          ChannelType.GuildForum,
          ChannelType.PublicThread,
          ChannelType.PrivateThread,
          ChannelType.AnnouncementThread
        ].includes(channel.type);
      });

      const channelArray = Array.from(channels.values());
      const batchSize = 6;
      for (let i = 0; i < channelArray.length; i += batchSize) {
        const batch = channelArray.slice(i, i + batchSize);
        await Promise.all(batch.map(async (channel) => {
          try {
            await channel.permissionOverwrites.edit(member.id, {
              ViewChannel: false,
              SendMessages: false,
              ReadMessageHistory: false,
              Connect: false,
              Speak: false,
              Stream: false,
              UseVAD: false,
              SendMessagesInThreads: false,
              CreatePrivateThreads: false,
              CreatePublicThreads: false,
              UseEmbeddedActivities: false,
              UseApplicationCommands: false,
              SendTTSMessages: false,
              AddReactions: false,
              EmbedLinks: false,
              AttachFiles: false,
              UseExternalEmojis: false,
              UseExternalStickers: false,
              MentionEveryone: false,
              ManageMessages: false,
              ManageThreads: false,
              SendVoiceMessages: false,
              RequestToSpeak: false
            }, { reason: `Isolation de quarantaine: ${member.user.tag}` });
          } catch (error) {
            console.warn(`⚠️ Impossible d'appliquer isolation membre sur ${channel.name}:`, error?.message || error);
          }
        }));
        if (i + batchSize < channelArray.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log(`🔐 Refus explicites appliqués pour ${member.user.tag} sur ${channelArray.length} canaux`);
    } catch (error) {
      console.error('Erreur applyMemberLevelIsolation:', error);
    }
  }

  /**
   * Supprimer les overrides spécifiques au membre sur tous les canaux
   * @param {GuildMember} member
   */
  async restoreMemberChannelAccess(member) {
    try {
      const guild = member.guild;
      const channelArray = Array.from(guild.channels.cache.values());
      const batchSize = 10;
      for (let i = 0; i < channelArray.length; i += batchSize) {
        const batch = channelArray.slice(i, i + batchSize);
        await Promise.all(batch.map(async (channel) => {
          try {
            const memberOverwrite = channel.permissionOverwrites?.cache?.get?.(member.id);
            if (memberOverwrite) {
              await memberOverwrite.delete(`Libération de quarantaine: ${member.user.tag}`);
            }
          } catch (error) {
            console.warn(`⚠️ Impossible de supprimer override membre sur ${channel.name}:`, error?.message || error);
          }
        }));
        if (i + batchSize < channelArray.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`🔓 Overrides spécifiques supprimés pour ${member.user.tag}`);
    } catch (error) {
      console.error('Erreur restoreMemberChannelAccess:', error);
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

  /**
   * Appliquer automatiquement les restrictions de quarantaine sur un nouveau canal
   * Cette méthode doit être appelée quand un nouveau canal est créé sur le serveur
   * @param {Channel} channel - Le nouveau canal créé
   * @param {Guild} guild - Le serveur
   */
  async applyQuarantineRestrictionsToNewChannel(channel, guild) {
    try {
      const config = await this.moderationManager.getSecurityConfig(guild.id);
      const quarantineRoleId = config.accessControl?.quarantineRoleId;

      if (!quarantineRoleId) return;

      const quarantineRole = guild.roles.cache.get(quarantineRoleId);
      if (!quarantineRole) return;

      // Ne pas appliquer sur les canaux de quarantaine
      if (channel.parent && channel.parent.name.toLowerCase().includes('quarantaine')) {
        return;
      }
      if (channel.name.toLowerCase().includes('quarantaine')) {
        return;
      }

      // Appliquer les restrictions sur le nouveau canal (rôle)
      const restrictivePermissions = {
        ViewChannel: false,
        SendMessages: false,
        ReadMessageHistory: false,
        Connect: false,
        Speak: false,
        Stream: false,
        UseVAD: false,
        SendMessagesInThreads: false,
        CreatePrivateThreads: false,
        CreatePublicThreads: false,
        UseEmbeddedActivities: false,
        UseApplicationCommands: false,
        SendTTSMessages: false,
        AddReactions: false,
        EmbedLinks: false,
        AttachFiles: false,
        UseExternalEmojis: false,
        UseExternalStickers: false,
        MentionEveryone: false,
        ManageMessages: false,
        ManageThreads: false,
        SendVoiceMessages: false,
        RequestToSpeak: false
      };

      await channel.permissionOverwrites.edit(quarantineRole, restrictivePermissions, {
        reason: 'Application automatique des restrictions de quarantaine sur nouveau canal'
      });

      // Appliquer aussi des refus au niveau des membres actuellement en quarantaine
      try {
        const quarantinedMembers = await this.listQuarantinedMembers(guild);
        if (Array.isArray(quarantinedMembers) && quarantinedMembers.length > 0) {
          for (const info of quarantinedMembers) {
            const qMember = info.member;
            try {
              await channel.permissionOverwrites.edit(qMember.id, restrictivePermissions, {
                reason: 'Isolation de quarantaine sur nouveau canal (niveau membre)'
              });
            } catch (mErr) {
              console.warn(`⚠️ Impossible de définir override membre pour ${qMember.user.tag} sur ${channel.name}:`, mErr?.message || mErr);
            }
          }
        }
      } catch (membersErr) {
        console.warn('⚠️ Échec application des refus niveau membre sur nouveau canal:', membersErr?.message || membersErr);
      }

      console.log(`🔒 Restrictions de quarantaine appliquées sur le nouveau canal: ${channel.name}`);

    } catch (error) {
      console.error('Erreur application restrictions nouveau canal:', error);
    }
  }

  /**
   * Vérifier et corriger l'isolation d'un membre en quarantaine
   * @param {GuildMember} member - Le membre en quarantaine
   * @returns {Object} Rapport de vérification
   */
  async verifyAndFixQuarantineIsolation(member) {
    try {
      const config = await this.moderationManager.getSecurityConfig(member.guild.id);
      const quarantineRoleId = config.accessControl?.quarantineRoleId;

      if (!quarantineRoleId) {
        throw new Error('Aucun rôle de quarantaine configuré');
      }

      const quarantineRole = member.guild.roles.cache.get(quarantineRoleId);
      if (!quarantineRole) {
        throw new Error('Rôle de quarantaine introuvable');
      }

      // Vérifier si le membre a le rôle
      if (!member.roles.cache.has(quarantineRoleId)) {
        throw new Error('Le membre n\'a pas le rôle de quarantaine');
      }

      console.log(`🔍 Vérification de l'isolation de quarantaine pour ${member.user.tag}`);

      // Reconfigurer les permissions sur tous les canaux (rôle)
      const stats = await this.configureQuarantineRolePermissions(member.guild, quarantineRole);

      // Appliquer aussi des refus au niveau membre pour contrer d'éventuels allow spécifiques
      await this.applyMemberLevelIsolation(member, null, []);

      // Vérifier l'accès actuel du membre
      const accessibleChannels = [];
      const restrictedChannels = [];

      for (const channel of member.guild.channels.cache.values()) {
        // Ignorer les canaux de quarantaine
        if ((channel.parent && channel.parent.name.toLowerCase().includes('quarantaine')) ||
            channel.name.toLowerCase().includes('quarantaine')) {
          continue;
        }

        // Vérifier si le membre peut voir le canal
        const permissions = channel.permissionsFor(member);
        if (permissions && permissions.has(PermissionFlagsBits.ViewChannel)) {
          accessibleChannels.push({
            name: channel.name,
            type: channel.type,
            id: channel.id
          });
        } else {
          restrictedChannels.push({
            name: channel.name,
            type: channel.type,
            id: channel.id
          });
        }
      }

      return {
        success: true,
        member: member.user.tag,
        stats,
        accessibleChannels: accessibleChannels.length,
        restrictedChannels: restrictedChannels.length,
        accessibleChannelsList: accessibleChannels.slice(0, 5), // Premiers 5 pour debug
        message: `Isolation vérifiée et corrigée. ${restrictedChannels.length} canaux restreints, ${accessibleChannels.length} accessibles.`
      };

    } catch (error) {
      console.error('Erreur vérification isolation quarantaine:', error);
      return {
        success: false,
        error: error.message,
        member: member.user.tag
      };
    }
  }
}

module.exports = QuarantineChannelManager;