const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class SecurityConfigHandler {
  constructor(moderationManager) {
    this.moderationManager = moderationManager;
  }

  /**
   * Gérer les interactions du menu de configuration de sécurité
   * @param {StringSelectMenuInteraction} interaction - L'interaction du menu
   */
  async handleConfigVerifMenu(interaction) {
    try {
      const selectedValue = interaction.values[0];
      const guildId = interaction.guild.id;
      const config = await this.moderationManager.getSecurityConfig(guildId);

      switch (selectedValue) {
        case 'auto_verification':
          await this.showAutoVerificationConfig(interaction, config);
          break;
        case 'quarantine_system':
          await this.showQuarantineSystemConfig(interaction, config);
          break;
        case 'auto_actions':
          await this.showAutoActionsConfig(interaction, config);
          break;
        case 'notifications':
          await this.showNotificationsConfig(interaction, config);
          break;
        case 'exemptions':
          await this.showExemptionsConfig(interaction, config);
          break;
        case 'view_config':
          await this.showCompleteConfig(interaction, config);
          break;
        default:
          return interaction.reply({ 
            content: '❌ Option non reconnue.', 
            ephemeral: true 
          });
      }
    } catch (error) {
      console.error('Erreur menu config-verif:', error);
      return interaction.reply({ 
        content: '❌ Erreur lors du traitement du menu.', 
        ephemeral: true 
      });
    }
  }

  /**
   * Afficher la configuration de vérification automatique
   */
  async showAutoVerificationConfig(interaction, config) {
    const embed = new EmbedBuilder()
      .setTitle('🔍 Configuration de la vérification automatique')
      .setColor(config.autoVerification?.enabled ? 0x51cf66 : 0x6c757d)
      .setTimestamp();

    let description = `**État :** ${config.autoVerification?.enabled ? '✅ Activée' : '❌ Désactivée'}\n\n`;

    if (config.autoVerification?.enabled) {
      description += '⚙️ **Paramètres actuels :**\n';
      
      if (config.autoVerification.minimumAccountAge) {
        description += `• **Âge minimum :** ${config.autoVerification.minimumAccountAge} jour(s)\n`;
      }
      
      if (config.autoVerification.maxRiskScore) {
        description += `• **Score de risque max :** ${config.autoVerification.maxRiskScore}/100\n`;
      }
      
      if (config.autoVerification.multiAccountThreshold) {
        description += `• **Seuil multi-comptes :** ${config.autoVerification.multiAccountThreshold}%\n`;
      }

      description += '\n💡 **Pour modifier :**\n';
      description += '• Utilisez `/config-verif auto-verif`\n';
      description += '• Configurez les actions avec `/config-verif actions-auto`';
    } else {
      description += '💡 **Pour activer :**\n';
      description += 'Utilisez `/config-verif auto-verif activer:true`';
    }

    embed.setDescription(description);

    // Boutons d'action rapide
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('config_verif_toggle_auto')
          .setLabel(config.autoVerification?.enabled ? 'Désactiver' : 'Activer')
          .setStyle(config.autoVerification?.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
          .setEmoji(config.autoVerification?.enabled ? '❌' : '✅'),
        new ButtonBuilder()
          .setCustomId('config_verif_back_menu')
          .setLabel('Retour au menu')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    return interaction.reply({ 
      embeds: [embed], 
      components: [buttons], 
      ephemeral: true 
    });
  }

  /**
   * Afficher la configuration du système de quarantaine
   */
  async showQuarantineSystemConfig(interaction, config) {
    const embed = new EmbedBuilder()
      .setTitle('🔒 Configuration du système de quarantaine')
      .setColor(config.accessControl?.quarantineRoleId ? 0x51cf66 : 0x6c757d)
      .setTimestamp();

    let description = '';

    if (config.accessControl?.quarantineRoleId) {
      const quarantineRole = interaction.guild.roles.cache.get(config.accessControl.quarantineRoleId);
      const verifiedRole = config.accessControl?.verifiedRoleId ? 
        interaction.guild.roles.cache.get(config.accessControl.verifiedRoleId) : null;

      description += '✅ **Système configuré**\n\n';
      description += `🔒 **Rôle quarantaine :** ${quarantineRole ? quarantineRole.name : 'Rôle introuvable'}\n`;
      
      if (verifiedRole) {
        description += `✅ **Rôle vérifié :** ${verifiedRole.name}\n`;
      }

      description += '\n🏗️ **Fonctionnement automatique :**\n';
      description += '• Canaux créés automatiquement pour chaque membre\n';
      description += '• Canal texte et vocal privés\n';
      description += '• Catégorie "🔒 QUARANTAINE" gérée automatiquement\n';
      description += '• Suppression automatique à la libération\n\n';

      description += '💡 **Commandes utiles :**\n';
      description += '• `/quarantaine appliquer` - Mettre en quarantaine\n';
      description += '• `/quarantaine liberer` - Libérer de quarantaine\n';
      description += '• `/quarantaine liste` - Voir les quarantaines actives';
    } else {
      description += '❌ **Système non configuré**\n\n';
      description += '💡 **Pour configurer :**\n';
      description += 'Utilisez `/config-verif quarantaine role-quarantaine:@RoleQuarantaine`';
    }

    embed.setDescription(description);

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('config_verif_back_menu')
          .setLabel('Retour au menu')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    return interaction.reply({ 
      embeds: [embed], 
      components: [buttons], 
      ephemeral: true 
    });
  }

  /**
   * Afficher la configuration des actions automatiques
   */
  async showAutoActionsConfig(interaction, config) {
    const embed = new EmbedBuilder()
      .setTitle('⚡ Configuration des actions automatiques')
      .setColor(0x3498db)
      .setTimestamp();

    let description = '';

    if (config.autoVerification?.actions) {
      const actions = config.autoVerification.actions;
      description += '⚙️ **Actions configurées :**\n\n';

      if (actions.recentAccount) {
        description += `🕐 **Compte récent :** ${this.getActionDisplay(actions.recentAccount)}\n`;
      }

      if (actions.multiAccount) {
        description += `🔍 **Multi-comptes :** ${this.getActionDisplay(actions.multiAccount)}\n`;
      }

      if (actions.suspiciousName) {
        description += `👤 **Nom suspect :** ${this.getActionDisplay(actions.suspiciousName)}\n`;
      }

      if (!actions.recentAccount && !actions.multiAccount && !actions.suspiciousName) {
        description += 'Aucune action configurée\n';
      }
    } else {
      description += '❌ **Aucune action configurée**\n';
    }

    description += '\n💡 **Pour configurer :**\n';
    description += 'Utilisez `/config-verif actions-auto`\n\n';

    description += '⚠️ **Important :**\n';
    description += '• Les actions automatiques s\'exécutent sans intervention\n';
    description += '• Recommandé : Commencer par "Quarantaine" ou "Approbation admin"\n';
    description += '• Les actions "Kick" et "Ban" sont irréversibles';

    embed.setDescription(description);

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('config_verif_back_menu')
          .setLabel('Retour au menu')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    return interaction.reply({ 
      embeds: [embed], 
      components: [buttons], 
      ephemeral: true 
    });
  }

  /**
   * Afficher la configuration des notifications
   */
  async showNotificationsConfig(interaction, config) {
    const embed = new EmbedBuilder()
      .setTitle('📢 Configuration des notifications admin')
      .setColor(config.autoAlerts?.enabled ? 0x51cf66 : 0x6c757d)
      .setTimestamp();

    let description = `**État :** ${config.autoAlerts?.enabled ? '✅ Activées' : '❌ Désactivées'}\n\n`;

    if (config.autoAlerts?.enabled && config.autoAlerts.alertChannelId) {
      const alertChannel = interaction.guild.channels.cache.get(config.autoAlerts.alertChannelId);
      description += '⚙️ **Configuration actuelle :**\n';
      description += `📢 **Canal d'alertes :** ${alertChannel ? `<#${alertChannel.id}>` : 'Canal introuvable'}\n`;

      if (config.autoAlerts.moderatorRoleId) {
        const modRole = interaction.guild.roles.cache.get(config.autoAlerts.moderatorRoleId);
        description += `👮 **Rôle admin :** ${modRole ? modRole.name : 'Rôle introuvable'}\n`;
      }

      if (config.autoVerification?.adminApproval?.timeoutMinutes) {
        description += `⏰ **Délai de décision :** ${config.autoVerification.adminApproval.timeoutMinutes} minute(s)\n`;
      }

      description += '\n💡 **Fonctionnement :**\n';
      description += '• Alertes avec boutons d\'action intégrés\n';
      description += '• Mentions automatiques des modérateurs\n';
      description += '• Actions par défaut si pas de réponse\n';
      description += '• Historique complet des décisions';
    } else {
      description += '💡 **Pour configurer :**\n';
      description += 'Utilisez `/config-verif notifications canal-alertes:#votre-canal`';
    }

    embed.setDescription(description);

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('config_verif_back_menu')
          .setLabel('Retour au menu')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    return interaction.reply({ 
      embeds: [embed], 
      components: [buttons], 
      ephemeral: true 
    });
  }

  /**
   * Afficher la configuration des exemptions
   */
  async showExemptionsConfig(interaction, config) {
    const embed = new EmbedBuilder()
      .setTitle('📝 Configuration des exemptions')
      .setColor(0x51cf66)
      .setTimestamp();

    const userExemptions = config.whitelist?.userIds?.length || 0;
    const roleExemptions = config.whitelist?.roleIds?.length || 0;
    const totalExemptions = userExemptions + roleExemptions;

    let description = `**Total exemptions :** ${totalExemptions}\n\n`;

    description += '📊 **Répartition :**\n';
    description += `👥 **Utilisateurs exemptés :** ${userExemptions}\n`;
    description += `🎭 **Rôles exemptés :** ${roleExemptions}\n\n`;

    if (totalExemptions > 0) {
      description += '💡 **Gestion :**\n';
      description += '• `/config-verif exemptions action:view` - Voir la liste\n';
      description += '• `/config-verif exemptions action:add_user` - Ajouter utilisateur\n';
      description += '• `/config-verif exemptions action:add_role` - Ajouter rôle\n\n';

      description += 'ℹ️ **Les membres exemptés ne passent pas par la vérification automatique.**';
    } else {
      description += '💡 **Pour ajouter des exemptions :**\n';
      description += 'Utilisez `/config-verif exemptions`\n\n';
      description += 'ℹ️ **Tous les nouveaux membres seront vérifiés automatiquement.**';
    }

    embed.setDescription(description);

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('config_verif_show_exemptions')
          .setLabel('Voir la liste')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📋')
          .setDisabled(totalExemptions === 0),
        new ButtonBuilder()
          .setCustomId('config_verif_back_menu')
          .setLabel('Retour au menu')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    return interaction.reply({ 
      embeds: [embed], 
      components: [buttons], 
      ephemeral: true 
    });
  }

  /**
   * Afficher la configuration complète
   */
  async showCompleteConfig(interaction, config) {
    const embed = new EmbedBuilder()
      .setTitle('📊 Configuration complète du système de vérification')
      .setColor(config.enabled ? 0x51cf66 : 0x6c757d)
      .setTimestamp();

    // État général
    embed.addFields({
      name: '🔧 État général',
      value: `**Système :** ${config.enabled ? '✅ Activé' : '❌ Désactivé'}\n` +
             `**Vérification auto :** ${config.autoVerification?.enabled ? '✅ Activée' : '❌ Désactivée'}\n` +
             `**Alertes admin :** ${config.autoAlerts?.enabled ? '✅ Activées' : '❌ Désactivées'}`,
      inline: false
    });

    // Vérification automatique
    if (config.autoVerification?.enabled) {
      let autoText = '';
      
      if (config.autoVerification.minimumAccountAge) {
        autoText += `🕐 **Âge minimum :** ${config.autoVerification.minimumAccountAge} jour(s)\n`;
      }
      
      if (config.autoVerification.maxRiskScore) {
        autoText += `📊 **Score risque max :** ${config.autoVerification.maxRiskScore}/100\n`;
      }
      
      if (config.autoVerification.multiAccountThreshold) {
        autoText += `🔍 **Seuil multi-comptes :** ${config.autoVerification.multiAccountThreshold}%\n`;
      }

      if (autoText) {
        embed.addFields({
          name: '🔍 Vérification automatique',
          value: autoText,
          inline: false
        });
      }
    }

    // Infrastructure
    let infrastructureText = '';
    
    if (config.accessControl?.quarantineRoleId) {
      const role = interaction.guild.roles.cache.get(config.accessControl.quarantineRoleId);
      infrastructureText += `🔒 **Quarantaine :** ${role ? role.name : 'Rôle introuvable'}\n`;
    }
    
    if (config.accessControl?.verifiedRoleId) {
      const role = interaction.guild.roles.cache.get(config.accessControl.verifiedRoleId);
      infrastructureText += `✅ **Vérifié :** ${role ? role.name : 'Rôle introuvable'}\n`;
    }
    
    if (config.autoAlerts?.alertChannelId) {
      infrastructureText += `📢 **Alertes :** <#${config.autoAlerts.alertChannelId}>\n`;
    }

    if (infrastructureText) {
      embed.addFields({
        name: '🏗️ Infrastructure',
        value: infrastructureText,
        inline: false
      });
    }

    // Exemptions
    const exemptionsCount = (config.whitelist?.userIds?.length || 0) + (config.whitelist?.roleIds?.length || 0);
    if (exemptionsCount > 0) {
      embed.addFields({
        name: '📝 Exemptions',
        value: `**Utilisateurs :** ${config.whitelist?.userIds?.length || 0}\n` +
               `**Rôles :** ${config.whitelist?.roleIds?.length || 0}`,
        inline: false
      });
    }

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('config_verif_back_menu')
          .setLabel('Retour au menu')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    return interaction.reply({ 
      embeds: [embed], 
      components: [buttons], 
      ephemeral: true 
    });
  }

  /**
   * Gérer les interactions des boutons de configuration
   */
  async handleConfigVerifButton(interaction) {
    try {
      const action = interaction.customId.replace('config_verif_', '');
      
      switch (action) {
        case 'back_menu':
          await this.showMainMenu(interaction);
          break;
        case 'toggle_auto':
          await this.toggleAutoVerification(interaction);
          break;
        case 'show_exemptions':
          await this.showDetailedExemptions(interaction);
          break;
        default:
          return interaction.reply({ 
            content: '❌ Action non reconnue.', 
            ephemeral: true 
          });
      }
    } catch (error) {
      console.error('Erreur bouton config-verif:', error);
      return interaction.reply({ 
        content: '❌ Erreur lors du traitement du bouton.', 
        ephemeral: true 
      });
    }
  }

  /**
   * Afficher le menu principal (retour)
   */
  async showMainMenu(interaction) {
    const config = await this.moderationManager.getSecurityConfig(interaction.guild.id);
    
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Configuration Système de Vérification')
      .setDescription('Sélectionnez une option de configuration ci-dessous')
      .setColor(config.enabled ? 0x51cf66 : 0x6c757d)
      .setTimestamp();

    // État actuel
    embed.addFields({
      name: '📊 État actuel',
      value: `**Système :** ${config.enabled ? '✅ Activé' : '❌ Désactivé'}\n` +
             `**Vérification auto :** ${config.autoVerification?.enabled ? '✅ Activée' : '❌ Désactivée'}\n` +
             `**Quarantaine :** ${config.accessControl?.quarantineRoleId ? '✅ Configurée' : '❌ Non configurée'}\n` +
             `**Notifications :** ${config.autoAlerts?.alertChannelId ? '✅ Configurées' : '❌ Non configurées'}`,
      inline: false
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('config_verif_menu')
      .setPlaceholder('Choisissez une section à configurer')
      .addOptions([
        {
          label: '🔍 Vérification automatique',
          description: 'Configurer la vérification à l\'arrivée des membres',
          value: 'auto_verification',
          emoji: '🔍'
        },
        {
          label: '🔒 Système de quarantaine',
          description: 'Configurer les rôles et canaux de quarantaine',
          value: 'quarantine_system',
          emoji: '🔒'
        },
        {
          label: '⚡ Actions automatiques',
          description: 'Définir les actions pour chaque type de suspect',
          value: 'auto_actions',
          emoji: '⚡'
        },
        {
          label: '📢 Notifications admin',
          description: 'Configurer les alertes et délais de décision',
          value: 'notifications',
          emoji: '📢'
        },
        {
          label: '📝 Exemptions',
          description: 'Gérer la liste des utilisateurs/rôles exemptés',
          value: 'exemptions',
          emoji: '📝'
        },
        {
          label: '📊 Voir configuration',
          description: 'Afficher la configuration complète actuelle',
          value: 'view_config',
          emoji: '📊'
        }
      ]);

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('config_verif_enable')
          .setLabel(config.enabled ? 'Désactiver système' : 'Activer système')
          .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
          .setEmoji(config.enabled ? '❌' : '✅'),
        new ButtonBuilder()
          .setCustomId('config_verif_reset')
          .setLabel('Réinitialiser')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️'),
        new ButtonBuilder()
          .setCustomId('config_verif_help')
          .setLabel('Guide d\'aide')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('❓')
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    return interaction.update({ 
      embeds: [embed], 
      components: [row, buttons]
    });
  }

  /**
   * Obtenir l'affichage d'une action
   */
  getActionDisplay(action) {
    const displays = {
      'ALERT': '📢 Alerte seulement',
      'WARN': '⚠️ Avertissement',
      'KICK': '👢 Expulsion automatique',
      'BAN': '🔨 Bannissement automatique',
      'QUARANTINE': '🔒 Mise en quarantaine',
      'ADMIN_APPROVAL': '👨‍💼 Demander approbation admin'
    };
    return displays[action] || action;
  }
}

module.exports = SecurityConfigHandler;