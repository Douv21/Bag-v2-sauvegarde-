const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const QuarantineChannelManager = require('../handlers/QuarantineChannelManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quarantaine')
    .setDescription('Gérer les quarantaines de sécurité avec canaux privés automatiques')
    .addSubcommand(subcommand =>
      subcommand
        .setName('appliquer')
        .setDescription('Mettre un membre en quarantaine avec canaux privés')
        .addUserOption(o => o.setName('membre').setDescription('Membre à mettre en quarantaine').setRequired(true))
        .addStringOption(o => o.setName('raison').setDescription('Raison de la quarantaine').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('liberer')
        .setDescription('Libérer un membre de la quarantaine et supprimer ses canaux')
        .addUserOption(o => o.setName('membre').setDescription('Membre à libérer').setRequired(true))
        .addStringOption(o => o.setName('raison').setDescription('Raison de la libération').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('liste')
        .setDescription('Voir tous les membres en quarantaine avec leurs canaux'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Voir les détails d\'une quarantaine et ses canaux')
        .addUserOption(o => o.setName('membre').setDescription('Membre à examiner').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('nettoyer')
        .setDescription('Nettoyer les canaux de quarantaine orphelins'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('configurer-permissions')
        .setDescription('Reconfigurer les permissions du rôle de quarantaine sur tous les canaux'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('verifier-isolation')
        .setDescription('Vérifier et corriger l\'isolation complète d\'un membre en quarantaine')
        .addUserOption(o => o.setName('membre').setDescription('Membre à vérifier').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('diagnostic')
        .setDescription('Diagnostic complet du système de quarantaine du serveur'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers.toString()),

  cooldown: 5,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ Réservé aux modérateurs.', ephemeral: true });
    }

    // Initialiser le gestionnaire de quarantaine
    const mod = interaction.client.moderationManager;
    if (!mod) {
      return interaction.reply({ content: '❌ Système de modération non disponible.', ephemeral: true });
    }

    this.quarantineManager = new QuarantineChannelManager(mod);
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'appliquer':
          await this.handleApply(interaction);
          break;
        case 'liberer':
          await this.handleRelease(interaction);
          break;
        case 'liste':
          await this.handleList(interaction);
          break;
        case 'info':
          await this.handleInfo(interaction);
          break;
        case 'nettoyer':
          await this.handleCleanup(interaction);
          break;
        case 'configurer-permissions':
          await this.handleConfigurePermissions(interaction);
          break;
        case 'verifier-isolation':
          await this.handleVerifyIsolation(interaction);
          break;
        case 'diagnostic':
          await this.handleDiagnostic(interaction);
          break;
      }
    } catch (error) {
      console.error('Erreur commande quarantaine:', error);
      return interaction.reply({ content: '❌ Erreur lors de l\'exécution de la commande.', ephemeral: true });
    }
  },

  async handleApply(interaction) {
    const member = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison');

    if (!member) {
      return interaction.reply({ content: '❌ Membre introuvable sur ce serveur.', ephemeral: true });
    }

    if (member.id === interaction.user.id) {
      return interaction.reply({ content: '❌ Vous ne pouvez pas vous mettre en quarantaine.', ephemeral: true });
    }

    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Impossible de mettre un administrateur en quarantaine.', ephemeral: true });
    }

    // Vérifier si le membre est déjà en quarantaine
    const config = await this.quarantineManager.moderationManager.getSecurityConfig(interaction.guild.id);
    if (config.accessControl?.quarantineRoleId) {
      const quarantineRole = interaction.guild.roles.cache.get(config.accessControl.quarantineRoleId);
      if (quarantineRole && member.roles.cache.has(quarantineRole.id)) {
        return interaction.reply({ 
          content: `❌ **${member.user.tag}** est déjà en quarantaine.`, 
          ephemeral: true 
        });
      }
    }

    await interaction.deferReply({ ephemeral: false });

    try {
      // Utiliser le nouveau système de canaux de quarantaine
      const fullReason = `Quarantaine manuelle par ${interaction.user.tag}: ${reason}`;
      const channels = await this.quarantineManager.createQuarantineChannels(member, fullReason);

      // Créer l'embed de confirmation
      const embed = new EmbedBuilder()
        .setTitle('🔒 Quarantaine appliquée')
        .setDescription(`**${member.user.tag}** a été mis en quarantaine`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setColor(0xff922b)
        .addFields(
          {
            name: '👮 Modérateur',
            value: interaction.user.tag,
            inline: true
          },
          {
            name: '📝 Raison',
            value: reason,
            inline: true
          },
          {
            name: '🏗️ Canaux créés',
            value: `**Texte :** ${channels.textChannel}\n**Vocal :** ${channels.voiceChannel}`,
            inline: false
          },
          {
            name: '⚙️ Système',
            value: `• Accès limité aux canaux de quarantaine uniquement\n• Communication possible avec les modérateurs\n• Libération via \`/quarantaine liberer\``,
            inline: false
          }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Envoyer notification dans le canal d'alertes si configuré
      const alertChannelId = config.autoAlerts?.alertChannelId;
      if (alertChannelId) {
        const alertChannel = interaction.guild.channels.cache.get(alertChannelId);
        if (alertChannel) {
          await alertChannel.send({
            content: `🔒 **Quarantaine manuelle appliquée**`,
            embeds: [embed]
          });
        }
      }

      console.log(`🔒 Quarantaine manuelle appliquée: ${member.user.tag} par ${interaction.user.tag}`);

    } catch (error) {
      console.error('Erreur application quarantaine:', error);
      return interaction.editReply({
        content: `❌ **Erreur lors de l'application de la quarantaine**\n\n` +
                 `${error.message}\n\n` +
                 `Vérifiez que le rôle de quarantaine est configuré avec \`/config-verif quarantaine\``
      });
    }
  },

  async handleRelease(interaction) {
    const member = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison');

    if (!member) {
      return interaction.reply({ content: '❌ Membre introuvable sur ce serveur.', ephemeral: true });
    }

    // Vérifier si le membre est en quarantaine
    const config = await this.quarantineManager.moderationManager.getSecurityConfig(interaction.guild.id);
    if (config.accessControl?.quarantineRoleId) {
      const quarantineRole = interaction.guild.roles.cache.get(config.accessControl.quarantineRoleId);
      if (!quarantineRole || !member.roles.cache.has(quarantineRole.id)) {
        return interaction.reply({ 
          content: `❌ **${member.user.tag}** n'est pas en quarantaine.`, 
          ephemeral: true 
        });
      }
    }

    await interaction.deferReply({ ephemeral: false });

    try {
      // Récupérer les infos de quarantaine avant libération
      const quarantineInfo = this.quarantineManager.getQuarantineInfo(member.user.id);
      
      // Utiliser le nouveau système de libération
      const fullReason = `Libération manuelle par ${interaction.user.tag}: ${reason}`;
      await this.quarantineManager.releaseFromQuarantine(member, fullReason);

      // Créer l'embed de confirmation
      const embed = new EmbedBuilder()
        .setTitle('✅ Quarantaine levée')
        .setDescription(`**${member.user.tag}** a été libéré de quarantaine`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setColor(0x51cf66)
        .addFields(
          {
            name: '👮 Modérateur',
            value: interaction.user.tag,
            inline: true
          },
          {
            name: '📝 Raison',
            value: reason,
            inline: true
          },
          {
            name: '🗑️ Canaux supprimés',
            value: quarantineInfo ? 
              `Canal texte et vocal de quarantaine supprimés` : 
              `Aucun canal trouvé`,
            inline: false
          },
          {
            name: '⚙️ Statut',
            value: `• Accès complet restauré\n• Rôle vérifié ajouté (si configuré)\n• Membre peut accéder à tous les canaux autorisés`,
            inline: false
          }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Envoyer notification dans le canal d'alertes si configuré
      const alertChannelId = config.autoAlerts?.alertChannelId;
      if (alertChannelId) {
        const alertChannel = interaction.guild.channels.cache.get(alertChannelId);
        if (alertChannel) {
          await alertChannel.send({
            content: `✅ **Libération de quarantaine**`,
            embeds: [embed]
          });
        }
      }

      console.log(`✅ Libération de quarantaine: ${member.user.tag} par ${interaction.user.tag}`);

    } catch (error) {
      console.error('Erreur libération quarantaine:', error);
      return interaction.editReply({
        content: `❌ **Erreur lors de la libération**\n\n` +
                 `${error.message}\n\n` +
                 `Le membre pourrait ne pas être en quarantaine ou les canaux pourraient déjà être supprimés.`
      });
    }
  },

  async handleList(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Utiliser le nouveau système pour lister les membres en quarantaine
      const quarantinedMembers = await this.quarantineManager.listQuarantinedMembers(interaction.guild);

      if (quarantinedMembers.length === 0) {
        return interaction.editReply({
          content: '✅ **Aucune quarantaine active**\n\nTous les membres ont accès normal au serveur.'
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🔒 Quarantaines actives (${quarantinedMembers.length})`)
        .setColor(0xff922b)
        .setTimestamp();

      let description = '';
      for (const memberInfo of quarantinedMembers.slice(0, 10)) { // Limiter à 10
        const { member, channels, duration } = memberInfo;
        const quarantineHours = Math.floor(duration / (1000 * 60 * 60));
        const quarantineDays = Math.floor(quarantineHours / 24);
        
        description += `👤 **${member.user.tag}**\n`;
        
        if (channels) {
          description += `   📝 ${channels.reason}\n`;
          description += `   💬 Texte: ${channels.textChannel}\n`;
          description += `   🔊 Vocal: ${channels.voiceChannel}\n`;
          
          if (quarantineDays > 0) {
            description += `   ⏰ Depuis: ${quarantineDays}j ${quarantineHours % 24}h\n`;
          } else {
            description += `   ⏰ Depuis: ${quarantineHours}h\n`;
          }
        } else {
          description += `   📝 Quarantaine sans canaux détectés\n`;
          description += `   ⚠️ Canaux possiblement supprimés manuellement\n`;
        }
        
        description += '\n';
      }

      if (quarantinedMembers.length > 10) {
        description += `*Et ${quarantinedMembers.length - 10} autre(s)...*`;
      }

      embed.setDescription(description);

      // Ajouter des informations utiles
      embed.addFields({
        name: '💡 Actions disponibles',
        value: `• \`/quarantaine liberer\` pour libérer un membre\n` +
               `• \`/quarantaine info\` pour voir les détails\n` +
               `• \`/quarantaine nettoyer\` pour supprimer les canaux orphelins`,
        inline: false
      });

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur liste quarantaines:', error);
      return interaction.editReply({
        content: '❌ Erreur lors de la récupération de la liste des quarantaines.'
      });
    }
  },

  async handleInfo(interaction) {
    const member = interaction.options.getMember('membre');

    if (!member) {
      return interaction.reply({ content: '❌ Membre introuvable sur ce serveur.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Vérifier si le membre est actuellement en quarantaine
      const config = await this.quarantineManager.moderationManager.getSecurityConfig(interaction.guild.id);
      const isCurrentlyQuarantined = config.accessControl?.quarantineRoleId && 
        member.roles.cache.has(config.accessControl.quarantineRoleId);

      // Récupérer les informations de quarantaine actuelle
      const quarantineInfo = this.quarantineManager.getQuarantineInfo(member.user.id);

      if (!isCurrentlyQuarantined && !quarantineInfo) {
        return interaction.editReply({
          content: `ℹ️ **${member.user.tag}** n'est pas actuellement en quarantaine et n'a pas de canaux actifs.`
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🔍 Détails de quarantaine - ${member.user.tag}`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setColor(isCurrentlyQuarantined ? 0xff922b : 0x51cf66)
        .setTimestamp();

      // Informations générales
      embed.addFields({
        name: '📊 Statut actuel',
        value: `**Statut :** ${isCurrentlyQuarantined ? '🔒 En quarantaine' : '✅ Non en quarantaine'}\n` +
               `**Rôle quarantaine :** ${isCurrentlyQuarantined ? '✅ Possédé' : '❌ Non possédé'}\n` +
               `**Canaux actifs :** ${quarantineInfo ? '✅ Oui' : '❌ Non'}`,
        inline: false
      });

      // Détails des canaux si disponibles
      if (quarantineInfo) {
        const duration = Date.now() - quarantineInfo.createdAt;
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        embed.addFields({
          name: '🏗️ Canaux de quarantaine',
          value: `**Texte :** ${quarantineInfo.textChannel}\n` +
                 `**Vocal :** ${quarantineInfo.voiceChannel}\n` +
                 `**Créés :** ${days > 0 ? `${days}j ${hours % 24}h` : `${hours}h`} ago\n` +
                 `**Raison :** ${quarantineInfo.reason}`,
          inline: false
        });
      }

      // Informations du membre
      const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
      const joinAge = Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24));
      
      embed.addFields({
        name: '👤 Informations membre',
        value: `**ID :** ${member.user.id}\n` +
               `**Compte créé :** ${accountAge} jour(s) ago\n` +
               `**Rejoint serveur :** ${joinAge} jour(s) ago\n` +
               `**Rôles :** ${member.roles.cache.size - 1} (hors @everyone)`,
        inline: false
      });

      // Actions disponibles
      if (isCurrentlyQuarantined) {
        embed.addFields({
          name: '⚡ Actions disponibles',
          value: `• \`/quarantaine liberer membre:${member.user.tag} raison:...\`\n` +
                 `• Accès aux canaux : ${quarantineInfo ? 'Voir les canaux ci-dessus' : 'Aucun canal actif'}\n` +
                 `• Communication directe possible avec le membre`,
          inline: false
        });
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur info quarantaine:', error);
      return interaction.editReply({
        content: '❌ Erreur lors de la récupération des informations.'
      });
    }
  },

  async handleCleanup(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Utiliser le système de nettoyage intégré
      await this.quarantineManager.cleanupOrphanedChannels(interaction.guild);

      // Compter les canaux de quarantaine restants pour rapport
      const guild = interaction.guild;
      const quarantineCategory = guild.channels.cache.find(
        c => c.type === 4 && c.name.toLowerCase().includes('quarantaine')
      );

      let remainingChannels = 0;
      if (quarantineCategory) {
        remainingChannels = quarantineCategory.children.cache.size;
      }

      // Compter les membres actuellement en quarantaine
      const quarantinedMembers = await this.quarantineManager.listQuarantinedMembers(guild);
      const activeQuarantines = quarantinedMembers.length;

      const embed = new EmbedBuilder()
        .setTitle('🧹 Nettoyage des canaux de quarantaine')
        .setColor(0x51cf66)
        .addFields(
          {
            name: '📊 État après nettoyage',
            value: `**Quarantaines actives :** ${activeQuarantines}\n` +
                   `**Canaux restants :** ${remainingChannels}\n` +
                   `**Catégorie :** ${quarantineCategory ? '✅ Présente' : '❌ Absente'}`,
            inline: false
          },
          {
            name: '🔧 Nettoyage effectué',
            value: `• Suppression des canaux orphelins (sans membre correspondant)\n` +
                   `• Suppression des catégories vides\n` +
                   `• Vérification de la cohérence des rôles\n` +
                   `• Conservation des canaux avec membres actifs`,
            inline: false
          },
          {
            name: '💡 Informations',
            value: `Le nettoyage automatique supprime uniquement :\n` +
                   `• Les canaux sans membre correspondant en quarantaine\n` +
                   `• Les catégories complètement vides\n` +
                   `• Les canaux corrompus ou inaccessibles`,
            inline: false
          }
        )
        .setTimestamp();

      // Ajouter liste des membres encore en quarantaine si peu nombreux
      if (activeQuarantines > 0 && activeQuarantines <= 5) {
        let membersList = '';
        for (const memberInfo of quarantinedMembers.slice(0, 5)) {
          membersList += `• ${memberInfo.member.user.tag}\n`;
        }
        
        embed.addFields({
          name: '👥 Membres encore en quarantaine',
          value: membersList,
          inline: false
        });
      }

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erreur nettoyage quarantaines:', error);
      return interaction.editReply({
        content: `❌ **Erreur lors du nettoyage**\n\n` +
                 `${error.message}\n\n` +
                 `Vérifiez les permissions du bot pour gérer les canaux.`
      });
    }
  },

  async handleConfigurePermissions(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Vérifier si le système de quarantaine est configuré
      const config = await this.quarantineManager.moderationManager.getSecurityConfig(interaction.guild.id);
      
      if (!config.accessControl?.quarantineRoleId) {
        return interaction.editReply({
          content: '❌ **Aucun rôle de quarantaine configuré**\n\n' +
                   'Configurez d\'abord le système avec `/config-verif quarantaine`'
        });
      }

      const quarantineRole = interaction.guild.roles.cache.get(config.accessControl.quarantineRoleId);
      if (!quarantineRole) {
        return interaction.editReply({
          content: '❌ **Rôle de quarantaine introuvable**\n\n' +
                   'Le rôle configuré n\'existe plus. Reconfigurez avec `/config-verif quarantaine`'
        });
      }

      // Reconfigurer les permissions
      const stats = await this.quarantineManager.configureQuarantineRolePermissions(interaction.guild, quarantineRole);

      const embed = new EmbedBuilder()
        .setTitle('✅ Permissions de quarantaine reconfigurées')
        .setColor(stats.errors === 0 ? 0x51cf66 : 0xff922b)
        .addFields(
          {
            name: '🔒 Rôle configuré',
            value: `**${quarantineRole.name}**`,
            inline: true
          },
          {
            name: '📊 Statistiques de configuration',
            value: `**Canaux configurés :** ${stats.configured}\n` +
                   `**Canaux ignorés :** ${stats.skipped}\n` +
                   `**Erreurs :** ${stats.errors}\n` +
                   `**Total traité :** ${stats.total}`,
            inline: false
          },
          {
            name: '🔧 Restrictions appliquées',
            value: `• Accès refusé à tous les canaux généraux\n• Permissions par défaut du rôle supprimées\n• Configuration complète des permissions restrictives\n• Canaux de quarantaine exemptés`,
            inline: false
          },
          {
            name: '💡 Informations',
            value: `• Isolation complète garantie pour les membres en quarantaine\n• Traitement par lots pour éviter les limitations\n• Vérification automatique des permissions existantes\n• Support de tous les types de canaux`,
            inline: false
          }
        )
        .setTimestamp();

      // Ajouter un aperçu des erreurs si présent
      if (stats.errors > 0 && Array.isArray(stats.errorDetails) && stats.errorDetails.length > 0) {
        const preview = stats.errorDetails
          .slice(0, 15)
          .map(e => `• #${e.name} (ID: ${e.id}) — ${e.error}`)
          .join('\n');

        embed.addFields({
          name: `⚠️ Salons en erreur (${Math.min(15, stats.errorDetails.length)}/${stats.errorDetails.length})`,
          value: preview || '—',
          inline: false
        });

        if (stats.errorDetails.length > 15) {
          embed.addFields({
            name: '🔎 Astuce',
            value: 'Relancez la commande et regardez les logs du bot pour la liste complète, ou corrigez ces salons manuellement.',
            inline: false
          });
        }
      }

      // Ajouter un avertissement si il y a eu des erreurs
      if (stats.errors > 0) {
        embed.addFields({
          name: '⚠️ Attention',
          value: `${stats.errors} erreur(s) détectée(s) lors de la configuration.\nVérifiez les logs du bot pour plus de détails.\nCertains canaux peuvent nécessiter une configuration manuelle.`,
          inline: false
        });
      }

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erreur configuration permissions:', error);
      return interaction.editReply({
        content: `❌ **Erreur lors de la configuration**\n\n` +
                 `${error.message}\n\n` +
                 `Vérifiez que le bot a les permissions nécessaires pour gérer les canaux.`
      });
    }
  },

  async handleVerifyIsolation(interaction) {
    const member = interaction.options.getMember('membre');

    if (!member) {
      return interaction.reply({ content: '❌ Membre introuvable sur ce serveur.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Vérifier et corriger l'isolation
      const report = await this.quarantineManager.verifyAndFixQuarantineIsolation(member);

      if (!report.success) {
        return interaction.editReply({
          content: `❌ **Erreur lors de la vérification**\n\n${report.error}`
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🔍 Vérification d\'isolation - Quarantaine')
        .setDescription(`Vérification terminée pour **${report.member}**`)
        .setColor(report.accessibleChannels === 0 ? 0x51cf66 : 0xff922b)
        .addFields(
          {
            name: '📊 Résultats de la vérification',
            value: `**Canaux restreints :** ${report.restrictedChannels}\n` +
                   `**Canaux accessibles :** ${report.accessibleChannels}\n` +
                   `**Statut :** ${report.accessibleChannels === 0 ? '✅ Isolation complète' : '⚠️ Isolation partielle'}`,
            inline: false
          },
          {
            name: '🔧 Configuration appliquée',
            value: `**Canaux configurés :** ${report.stats.configured}\n` +
                   `**Canaux ignorés :** ${report.stats.skipped}\n` +
                   `**Erreurs :** ${report.stats.errors}\n` +
                   `**Total :** ${report.stats.total}`,
            inline: false
          }
        )
        .setTimestamp();

      // Ajouter détails des canaux accessibles si il y en a
      if (report.accessibleChannels > 0 && report.accessibleChannelsList.length > 0) {
        let accessibleList = '';
        for (const channel of report.accessibleChannelsList) {
          accessibleList += `• ${channel.name} (${channel.type})\n`;
        }
        if (report.accessibleChannels > 5) {
          accessibleList += `• Et ${report.accessibleChannels - 5} autres...`;
        }

        embed.addFields({
          name: '⚠️ Canaux encore accessibles',
          value: accessibleList,
          inline: false
        });

        embed.addFields({
          name: '💡 Actions recommandées',
          value: `• Vérifiez les permissions spéciales de ces canaux\n` +
                 `• Assurez-vous que le rôle de quarantaine est bien configuré\n` +
                 `• Relancez \`/quarantaine configurer-permissions\` si nécessaire`,
          inline: false
        });
      }

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erreur vérification isolation:', error);
      return interaction.editReply({
        content: `❌ **Erreur lors de la vérification**\n\n` +
                 `${error.message}`
      });
    }
  },

  async handleDiagnostic(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const config = await this.quarantineManager.moderationManager.getSecurityConfig(interaction.guild.id);
      const guild = interaction.guild;

      // Vérifications de base
      const hasQuarantineRole = config.accessControl?.quarantineRoleId;
      const quarantineRole = hasQuarantineRole ? guild.roles.cache.get(config.accessControl.quarantineRoleId) : null;
      const quarantinedMembers = await this.quarantineManager.listQuarantinedMembers(guild);

      // Vérifier les canaux de quarantaine
      const quarantineCategory = guild.channels.cache.find(
        c => c.type === 4 && c.name.toLowerCase().includes('quarantaine')
      );
      const quarantineChannels = quarantineCategory ? quarantineCategory.children.cache.size : 0;

      // Analyser les permissions sur quelques canaux
      let channelAnalysis = {
        total: 0,
        configured: 0,
        missing: 0,
        errors: []
      };

      if (quarantineRole) {
        const testChannels = guild.channels.cache
          .filter(c => [0, 2].includes(c.type) && !c.name.toLowerCase().includes('quarantaine'))
          .first(10);

        channelAnalysis.total = testChannels.size;

        for (const channel of testChannels.values()) {
          try {
            const overwrite = channel.permissionOverwrites.cache.get(quarantineRole.id);
            if (overwrite && overwrite.deny.has(PermissionFlagsBits.ViewChannel)) {
              channelAnalysis.configured++;
            } else {
              channelAnalysis.missing++;
            }
          } catch (error) {
            channelAnalysis.errors.push(channel.name);
          }
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('🔍 Diagnostic du système de quarantaine')
        .setDescription(`Analyse complète du système de quarantaine de **${guild.name}**`)
        .setColor(hasQuarantineRole && quarantineRole ? 0x51cf66 : 0xff6b6b)
        .setTimestamp();

      // Configuration de base
      embed.addFields({
        name: '⚙️ Configuration de base',
        value: `**Système activé :** ${config.enabled ? '✅ Oui' : '❌ Non'}\n` +
               `**Rôle de quarantaine :** ${quarantineRole ? `✅ ${quarantineRole.name}` : '❌ Non configuré'}\n` +
               `**Rôle vérifié :** ${config.accessControl?.verifiedRoleId ? '✅ Configuré' : '❌ Non configuré'}\n` +
               `**Canal d'alertes :** ${config.autoAlerts?.alertChannelId ? '✅ Configuré' : '❌ Non configuré'}`,
        inline: false
      });

      // État actuel
      embed.addFields({
        name: '📊 État actuel',
        value: `**Membres en quarantaine :** ${quarantinedMembers.length}\n` +
               `**Catégorie quarantaine :** ${quarantineCategory ? '✅ Présente' : '❌ Absente'}\n` +
               `**Canaux de quarantaine :** ${quarantineChannels}\n` +
               `**Canaux orphelins :** ${Math.max(0, quarantineChannels - quarantinedMembers.length * 2)}`,
        inline: false
      });

      // Analyse des permissions
      if (quarantineRole) {
        const permissionStatus = channelAnalysis.configured === channelAnalysis.total ? '✅ Complètes' :
                               channelAnalysis.configured > 0 ? '⚠️ Partielles' : '❌ Manquantes';

        embed.addFields({
          name: '🔒 Analyse des permissions (échantillon)',
          value: `**Statut :** ${permissionStatus}\n` +
                 `**Canaux testés :** ${channelAnalysis.total}\n` +
                 `**Correctement configurés :** ${channelAnalysis.configured}\n` +
                 `**Manquants :** ${channelAnalysis.missing}\n` +
                 `**Erreurs :** ${channelAnalysis.errors.length}`,
          inline: false
        });
      }

      // Recommandations
      let recommendations = [];
      
      if (!hasQuarantineRole || !quarantineRole) {
        recommendations.push('• Configurez le rôle de quarantaine avec `/config-verif quarantaine`');
      }
      
      if (channelAnalysis.missing > 0) {
        recommendations.push('• Reconfigurez les permissions avec `/quarantaine configurer-permissions`');
      }
      
      if (quarantineChannels > quarantinedMembers.length * 2) {
        recommendations.push('• Nettoyez les canaux orphelins avec `/quarantaine nettoyer`');
      }
      
      if (!config.autoAlerts?.alertChannelId) {
        recommendations.push('• Configurez un canal d\'alertes avec `/config-verif admins`');
      }

      if (recommendations.length === 0) {
        recommendations.push('✅ Le système semble correctement configuré');
      }

      embed.addFields({
        name: '💡 Recommandations',
        value: recommendations.join('\n'),
        inline: false
      });

      // Actions de maintenance
      embed.addFields({
        name: '🛠️ Actions de maintenance disponibles',
        value: `• \`/quarantaine configurer-permissions\` - Reconfigurer toutes les permissions\n` +
               `• \`/quarantaine nettoyer\` - Nettoyer les canaux orphelins\n` +
               `• \`/quarantaine verifier-isolation membre:@user\` - Vérifier un membre spécifique\n` +
               `• \`/config-verif\` - Modifier la configuration de sécurité`,
        inline: false
      });

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erreur diagnostic quarantaine:', error);
      return interaction.editReply({
        content: `❌ **Erreur lors du diagnostic**\n\n` +
                 `${error.message}`
      });
    }
  }
};