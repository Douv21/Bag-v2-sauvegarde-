const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

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
        case 'risk_actions':
          await this.showRiskActionsConfig(interaction, config);
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

      description += '\n💡 Configuration rapide :\n';
      description += '• Utilisez le bouton ci-dessous pour activer/désactiver\n';
      description += '• Utilisez "Retour au menu" pour naviguer vers d’autres sections';
    } else {
      description += '💡 Pour activer :\n';
      description += '• Cliquez sur le bouton "Activer" ci-dessous';
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
      description += '💡 Pour configurer :\n';
      description += '• Cette configuration sera disponible via ce menu.';
    }

    embed.setDescription(description);

    // Sélecteur de rôle de quarantaine
    const quarantineRoleRow = new ActionRowBuilder()
      .addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId('config_verif_quarantine_role')
          .setPlaceholder('Sélectionnez le rôle de quarantaine')
          .setMinValues(1)
          .setMaxValues(1)
      );

    // Sélecteur de rôle vérifié (optionnel)
    const verifiedRoleRow = new ActionRowBuilder()
      .addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId('config_verif_verified_role')
          .setPlaceholder('Sélectionnez le rôle "Vérifié" (optionnel)')
          .setMinValues(1)
          .setMaxValues(1)
      );

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
      components: [quarantineRoleRow, verifiedRoleRow, buttons], 
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

      const riskActions = config.autoVerification.riskActions || {};
      if (Object.keys(riskActions).length > 0) {
        description += '\n📊 **Actions par niveau de risque :**\n';
        if (riskActions.low) description += `• Faible: ${this.getActionDisplay(riskActions.low)}\n`;
        if (riskActions.medium) description += `• Moyen: ${this.getActionDisplay(riskActions.medium)}\n`;
        if (riskActions.high) description += `• Élevé: ${this.getActionDisplay(riskActions.high)}\n`;
        if (riskActions.critical) description += `• Critique: ${this.getActionDisplay(riskActions.critical)}\n`;
      }

      if (!actions.recentAccount && !actions.multiAccount && !actions.suspiciousName && Object.keys(riskActions).length === 0) {
        description += 'Aucune action configurée\n';
      }
    } else {
      description += '❌ **Aucune action configurée**\n';
    }

    description += '\n💡 Configuration :\n';
    description += '• Sélectionnez une action pour chaque type détecté\n\n';

    description += '⚠️ **Important :**\n';
    description += '• Les actions automatiques s\'exécutent sans intervention\n';
    description += '• Recommandé : Commencer par "Quarantaine" ou "Approbation admin"\n';
    description += '• Les actions "Kick" et "Ban" sont irréversibles';

    embed.setDescription(description);

    // Menus de sélection d'action
    const currentActions = config.autoVerification?.actions || {};
    const options = this.buildAutoActionOptions();

    const rowRecent = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_verif_action_recentAccount')
        .setPlaceholder('Action pour compte récent')
        .addOptions(options.map(o => ({ label: o.label, value: o.value, emoji: o.emoji, description: o.description, default: currentActions.recentAccount === o.value })))
    );

    const rowMulti = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_verif_action_multiAccount')
        .setPlaceholder('Action pour multi-comptes')
        .addOptions(options.map(o => ({ label: o.label, value: o.value, emoji: o.emoji, description: o.description, default: currentActions.multiAccount === o.value })))
    );

    const rowName = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_verif_action_suspiciousName')
        .setPlaceholder('Action pour nom suspect')
        .addOptions(options.map(o => ({ label: o.label, value: o.value, emoji: o.emoji, description: o.description, default: currentActions.suspiciousName === o.value })))
    );

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('config_verif_risk_actions')
        .setLabel('Actions par risque')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📊'),
      new ButtonBuilder()
        .setCustomId('config_verif_back_menu')
        .setLabel('Retour au menu')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔙')
    );

    return interaction.reply({
      embeds: [embed],
      components: [rowRecent, rowMulti, rowName, buttons],
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
      description += '💡 Configuration :\n';
      description += '• Bientôt configurable via ce menu';
    }

    embed.setDescription(description);

    // Sélecteur de canal d'alertes
    const alertChannelRow = new ActionRowBuilder()
      .addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId('config_verif_alert_channel')
          .setPlaceholder("Sélectionnez le canal d'alertes")
          .setMinValues(1)
          .setMaxValues(1)
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      );

    // Sélecteur de rôle modérateur à mentionner
    const moderatorRoleRow = new ActionRowBuilder()
      .addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId('config_verif_moderator_role')
          .setPlaceholder('Sélectionnez le rôle à mentionner (optionnel)')
          .setMinValues(1)
          .setMaxValues(1)
      );

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('config_verif_toggle_alerts')
          .setLabel(config.autoAlerts?.enabled ? 'Désactiver alertes' : 'Activer alertes')
          .setStyle(config.autoAlerts?.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
          .setEmoji(config.autoAlerts?.enabled ? '❌' : '✅'),
        new ButtonBuilder()
          .setCustomId('config_verif_back_menu')
          .setLabel('Retour au menu')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    return interaction.reply({ 
      embeds: [embed], 
      components: [alertChannelRow, moderatorRoleRow, buttons], 
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
      description += '💡 Pour ajouter des exemptions :\n';
      description += '• Bientôt configurable via ce menu\n\n';
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
        case 'toggle_auto':
          await this.toggleAutoVerification(interaction);
          break;
        case 'enable':
          await this.toggleSystemEnable(interaction);
          break;
        case 'reset':
          await this.handleSystemReset(interaction);
          break;
        case 'help':
          await this.showHelpGuide(interaction);
          break;
        case 'show_exemptions':
          await this.showExemptionsList(interaction);
          break;
        case 'reset_confirm':
          await this.confirmSystemReset(interaction);
          break;
        case 'reset_cancel':
          await this.cancelSystemReset(interaction);
          break;
        case 'back_menu':
          await this.showMainMenuUpdate(interaction);
          break;
        case 'toggle_alerts':
          await this.toggleAlerts(interaction);
          break;
        case 'risk_actions':
          await this.showRiskActionsConfig(interaction, await this.moderationManager.getSecurityConfig(interaction.guild.id));
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
   * Traitement: sélection du rôle de quarantaine
   */
  async handleQuarantineRoleSelect(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Réservé aux administrateurs.', ephemeral: true });
      }

      const guildId = interaction.guild.id;
      const roleId = interaction.values?.[0];
      if (!roleId) {
        return interaction.reply({ content: '❌ Aucun rôle sélectionné.', ephemeral: true });
      }

      const updated = await this.moderationManager.updateSecurityConfig(guildId, {
        accessControl: { quarantineRoleId: roleId }
      });

      // Reconstruire l'embed de la section quarantaine
      const embed = new EmbedBuilder()
        .setTitle('🔒 Configuration du système de quarantaine')
        .setColor(updated.accessControl?.quarantineRoleId ? 0x51cf66 : 0x6c757d)
        .setTimestamp();

      let description = '';
      if (updated.accessControl?.quarantineRoleId) {
        const quarantineRole = interaction.guild.roles.cache.get(updated.accessControl.quarantineRoleId);
        const verifiedRole = updated.accessControl?.verifiedRoleId ? 
          interaction.guild.roles.cache.get(updated.accessControl.verifiedRoleId) : null;

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
        description += '💡 Pour configurer :\n';
        description += '• Cette configuration sera disponible via ce menu.';
      }
      embed.setDescription(description);

      const quarantineRoleRow = new ActionRowBuilder()
        .addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId('config_verif_quarantine_role')
            .setPlaceholder('Sélectionnez le rôle de quarantaine')
            .setMinValues(1)
            .setMaxValues(1)
        );

      const verifiedRoleRow = new ActionRowBuilder()
        .addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId('config_verif_verified_role')
            .setPlaceholder('Sélectionnez le rôle "Vérifié" (optionnel)')
            .setMinValues(1)
            .setMaxValues(1)
        );

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('config_verif_back_menu')
            .setLabel('Retour au menu')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      return interaction.update({ embeds: [embed], components: [quarantineRoleRow, verifiedRoleRow, buttons] });
    } catch (error) {
      console.error('Erreur handleQuarantineRoleSelect:', error);
      return interaction.reply({ content: '❌ Erreur lors de la mise à jour du rôle de quarantaine.', ephemeral: true });
    }
  }

  /**
   * Traitement: sélection du rôle vérifié
   */
  async handleVerifiedRoleSelect(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Réservé aux administrateurs.', ephemeral: true });
      }

      const guildId = interaction.guild.id;
      const roleId = interaction.values?.[0];
      if (!roleId) {
        return interaction.reply({ content: '❌ Aucun rôle sélectionné.', ephemeral: true });
      }

      const updated = await this.moderationManager.updateSecurityConfig(guildId, {
        accessControl: { verifiedRoleId: roleId }
      });

      // Re-utiliser la vue quarantaine
      const embed = new EmbedBuilder()
        .setTitle('🔒 Configuration du système de quarantaine')
        .setColor(updated.accessControl?.quarantineRoleId ? 0x51cf66 : 0x6c757d)
        .setTimestamp();

      let description = '';
      if (updated.accessControl?.quarantineRoleId) {
        const quarantineRole = interaction.guild.roles.cache.get(updated.accessControl.quarantineRoleId);
        const verifiedRole = updated.accessControl?.verifiedRoleId ? 
          interaction.guild.roles.cache.get(updated.accessControl.verifiedRoleId) : null;

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
        description += '💡 Pour configurer :\n';
        description += '• Cette configuration sera disponible via ce menu.';
      }
      embed.setDescription(description);

      const quarantineRoleRow = new ActionRowBuilder()
        .addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId('config_verif_quarantine_role')
            .setPlaceholder('Sélectionnez le rôle de quarantaine')
            .setMinValues(1)
            .setMaxValues(1)
        );

      const verifiedRoleRow = new ActionRowBuilder()
        .addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId('config_verif_verified_role')
            .setPlaceholder('Sélectionnez le rôle "Vérifié" (optionnel)')
            .setMinValues(1)
            .setMaxValues(1)
        );

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('config_verif_back_menu')
            .setLabel('Retour au menu')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      return interaction.update({ embeds: [embed], components: [quarantineRoleRow, verifiedRoleRow, buttons] });
    } catch (error) {
      console.error('Erreur handleVerifiedRoleSelect:', error);
      return interaction.reply({ content: '❌ Erreur lors de la mise à jour du rôle vérifié.', ephemeral: true });
    }
  }

  /**
   * Traitement: sélection du canal d'alertes
   */
  async handleAlertChannelSelect(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Réservé aux administrateurs.', ephemeral: true });
      }

      const guildId = interaction.guild.id;
      const channelId = interaction.values?.[0];
      if (!channelId) {
        return interaction.reply({ content: '❌ Aucun canal sélectionné.', ephemeral: true });
      }

      const updated = await this.moderationManager.updateSecurityConfig(guildId, {
        autoAlerts: { alertChannelId: channelId, enabled: true }
      });

      // Reconstruire la vue notifications
      const embed = new EmbedBuilder()
        .setTitle('📢 Configuration des notifications admin')
        .setColor(updated.autoAlerts?.enabled ? 0x51cf66 : 0x6c757d)
        .setTimestamp();

      let description = `**État :** ${updated.autoAlerts?.enabled ? '✅ Activées' : '❌ Désactivées'}\n\n`;
      if (updated.autoAlerts?.enabled && updated.autoAlerts.alertChannelId) {
        const alertChannel = interaction.guild.channels.cache.get(updated.autoAlerts.alertChannelId);
        description += '⚙️ **Configuration actuelle :**\n';
        description += `📢 **Canal d'alertes :** ${alertChannel ? `<#${alertChannel.id}>` : 'Canal introuvable'}\n`;
        if (updated.autoAlerts.moderatorRoleId) {
          const modRole = interaction.guild.roles.cache.get(updated.autoAlerts.moderatorRoleId);
          description += `👮 **Rôle admin :** ${modRole ? modRole.name : 'Rôle introuvable'}\n`;
        }
        if (updated.autoVerification?.adminApproval?.timeoutMinutes) {
          description += `⏰ **Délai de décision :** ${updated.autoVerification.adminApproval.timeoutMinutes} minute(s)\n`;
        }
        description += '\n💡 **Fonctionnement :**\n';
        description += "• Alertes avec boutons d'action intégrés\n";
        description += '• Mentions automatiques des modérateurs\n';
        description += '• Actions par défaut si pas de réponse\n';
        description += '• Historique complet des décisions';
      } else {
        description += '💡 Configuration :\n';
        description += '• Bientôt configurable via ce menu';
      }
      embed.setDescription(description);

      const alertChannelRow = new ActionRowBuilder()
        .addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('config_verif_alert_channel')
            .setPlaceholder("Sélectionnez le canal d'alertes")
            .setMinValues(1)
            .setMaxValues(1)
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        );

      const moderatorRoleRow = new ActionRowBuilder()
        .addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId('config_verif_moderator_role')
            .setPlaceholder('Sélectionnez le rôle à mentionner (optionnel)')
            .setMinValues(1)
            .setMaxValues(1)
        );

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('config_verif_toggle_alerts')
            .setLabel(updated.autoAlerts?.enabled ? 'Désactiver alertes' : 'Activer alertes')
            .setStyle(updated.autoAlerts?.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(updated.autoAlerts?.enabled ? '❌' : '✅'),
          new ButtonBuilder()
            .setCustomId('config_verif_back_menu')
            .setLabel('Retour au menu')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      return interaction.update({ embeds: [embed], components: [alertChannelRow, moderatorRoleRow, buttons] });
    } catch (error) {
      console.error('Erreur handleAlertChannelSelect:', error);
      return interaction.reply({ content: '❌ Erreur lors de la mise à jour du canal d\'alertes.', ephemeral: true });
    }
  }

  /**
   * Traitement: sélection du rôle modérateur (notifications)
   */
  async handleModeratorRoleSelect(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Réservé aux administrateurs.', ephemeral: true });
      }

      const guildId = interaction.guild.id;
      const roleId = interaction.values?.[0];
      if (!roleId) {
        return interaction.reply({ content: '❌ Aucun rôle sélectionné.', ephemeral: true });
      }

      const updated = await this.moderationManager.updateSecurityConfig(guildId, {
        autoAlerts: { moderatorRoleId: roleId, mentionModerators: true, enabled: true }
      });

      // Reconstruire la vue notifications
      const embed = new EmbedBuilder()
        .setTitle('📢 Configuration des notifications admin')
        .setColor(updated.autoAlerts?.enabled ? 0x51cf66 : 0x6c757d)
        .setTimestamp();

      let description = `**État :** ${updated.autoAlerts?.enabled ? '✅ Activées' : '❌ Désactivées'}\n\n`;
      if (updated.autoAlerts?.enabled && updated.autoAlerts.alertChannelId) {
        const alertChannel = interaction.guild.channels.cache.get(updated.autoAlerts.alertChannelId);
        description += '⚙️ **Configuration actuelle :**\n';
        description += `📢 **Canal d'alertes :** ${alertChannel ? `<#${alertChannel.id}>` : 'Canal introuvable'}\n`;
        if (updated.autoAlerts.moderatorRoleId) {
          const modRole = interaction.guild.roles.cache.get(updated.autoAlerts.moderatorRoleId);
          description += `👮 **Rôle admin :** ${modRole ? modRole.name : 'Rôle introuvable'}\n`;
        }
        if (updated.autoVerification?.adminApproval?.timeoutMinutes) {
          description += `⏰ **Délai de décision :** ${updated.autoVerification.adminApproval.timeoutMinutes} minute(s)\n`;
        }
        description += '\n💡 **Fonctionnement :**\n';
        description += "• Alertes avec boutons d'action intégrés\n";
        description += '• Mentions automatiques des modérateurs\n';
        description += '• Actions par défaut si pas de réponse\n';
        description += '• Historique complet des décisions';
      } else {
        description += '💡 Configuration :\n';
        description += '• Bientôt configurable via ce menu';
      }
      embed.setDescription(description);

      const alertChannelRow = new ActionRowBuilder()
        .addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('config_verif_alert_channel')
            .setPlaceholder("Sélectionnez le canal d'alertes")
            .setMinValues(1)
            .setMaxValues(1)
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        );

      const moderatorRoleRow = new ActionRowBuilder()
        .addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId('config_verif_moderator_role')
            .setPlaceholder('Sélectionnez le rôle à mentionner (optionnel)')
            .setMinValues(1)
            .setMaxValues(1)
        );

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('config_verif_toggle_alerts')
            .setLabel(updated.autoAlerts?.enabled ? 'Désactiver alertes' : 'Activer alertes')
            .setStyle(updated.autoAlerts?.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(updated.autoAlerts?.enabled ? '❌' : '✅'),
          new ButtonBuilder()
            .setCustomId('config_verif_back_menu')
            .setLabel('Retour au menu')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      return interaction.update({ embeds: [embed], components: [alertChannelRow, moderatorRoleRow, buttons] });
    } catch (error) {
      console.error('Erreur handleModeratorRoleSelect:', error);
      return interaction.reply({ content: '❌ Erreur lors de la mise à jour du rôle modérateur.', ephemeral: true });
    }
  }

  /**
   * Bouton: activer/désactiver les alertes
   */
  async toggleAlerts(interaction) {
    try {
      const guildId = interaction.guild.id;
      const current = await this.moderationManager.getSecurityConfig(guildId);
      const newState = !current.autoAlerts?.enabled;
      const updated = await this.moderationManager.updateSecurityConfig(guildId, {
        autoAlerts: { enabled: newState }
      });

      // Reconstruire la vue notifications
      const embed = new EmbedBuilder()
        .setTitle('📢 Configuration des notifications admin')
        .setColor(updated.autoAlerts?.enabled ? 0x51cf66 : 0x6c757d)
        .setTimestamp();

      let description = `**État :** ${updated.autoAlerts?.enabled ? '✅ Activées' : '❌ Désactivées'}\n\n`;
      if (updated.autoAlerts?.enabled && updated.autoAlerts.alertChannelId) {
        const alertChannel = interaction.guild.channels.cache.get(updated.autoAlerts.alertChannelId);
        description += '⚙️ **Configuration actuelle :**\n';
        description += `📢 **Canal d'alertes :** ${alertChannel ? `<#${alertChannel.id}>` : 'Canal introuvable'}\n`;
        if (updated.autoAlerts.moderatorRoleId) {
          const modRole = interaction.guild.roles.cache.get(updated.autoAlerts.moderatorRoleId);
          description += `👮 **Rôle admin :** ${modRole ? modRole.name : 'Rôle introuvable'}\n`;
        }
        if (updated.autoVerification?.adminApproval?.timeoutMinutes) {
          description += `⏰ **Délai de décision :** ${updated.autoVerification.adminApproval.timeoutMinutes} minute(s)\n`;
        }
        description += '\n💡 **Fonctionnement :**\n';
        description += "• Alertes avec boutons d'action intégrés\n";
        description += '• Mentions automatiques des modérateurs\n';
        description += '• Actions par défaut si pas de réponse\n';
        description += '• Historique complet des décisions';
      } else {
        description += '💡 Configuration :\n';
        description += '• Bientôt configurable via ce menu';
      }
      embed.setDescription(description);

      const alertChannelRow = new ActionRowBuilder()
        .addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('config_verif_alert_channel')
            .setPlaceholder("Sélectionnez le canal d'alertes")
            .setMinValues(1)
            .setMaxValues(1)
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        );

      const moderatorRoleRow = new ActionRowBuilder()
        .addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId('config_verif_moderator_role')
            .setPlaceholder('Sélectionnez le rôle à mentionner (optionnel)')
            .setMinValues(1)
            .setMaxValues(1)
        );

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('config_verif_toggle_alerts')
            .setLabel(updated.autoAlerts?.enabled ? 'Désactiver alertes' : 'Activer alertes')
            .setStyle(updated.autoAlerts?.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(updated.autoAlerts?.enabled ? '❌' : '✅'),
          new ButtonBuilder()
            .setCustomId('config_verif_back_menu')
            .setLabel('Retour au menu')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      return interaction.update({ embeds: [embed], components: [alertChannelRow, moderatorRoleRow, buttons] });
    } catch (error) {
      console.error('Erreur toggleAlerts:', error);
      return interaction.reply({ content: '❌ Erreur lors du changement d\'état des alertes.', ephemeral: true });
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
      'ADMIN_APPROVAL': '👨‍💼 Demander approbation admin',
      'APPROVE': '✅ Approuver'
    };
    return displays[action] || action;
  }

  /**
   * Options pour les actions automatiques
   */
  buildAutoActionOptions() {
    return [
      { label: '📢 Alerte seulement', value: 'ALERT', emoji: '📢', description: 'Notifier sans agir' },
      { label: '⚠️ Avertissement', value: 'WARN', emoji: '⚠️', description: 'Envoyer un avertissement' },
      { label: '🔒 Mise en quarantaine', value: 'QUARANTINE', emoji: '🔒', description: "Restreindre l'accès" },
      { label: '👨‍💼 Approbation admin', value: 'ADMIN_APPROVAL', emoji: '👨‍💼', description: 'Demander une décision' },
      { label: '👢 Expulsion automatique', value: 'KICK', emoji: '👢', description: 'Expulser le membre' },
      { label: '🔨 Bannissement automatique', value: 'BAN', emoji: '🔨', description: 'Bannir le membre' },
      { label: '✅ Approuver (aucune action)', value: 'APPROVE', emoji: '✅', description: 'Ne rien faire' }
    ];
  }

  /**
   * Basculer l'activation/désactivation du système
   */
  async toggleSystemEnable(interaction) {
    try {
      const guildId = interaction.guild.id;
      const config = await this.moderationManager.getSecurityConfig(guildId);
      const newState = !config.enabled;
      
      await this.moderationManager.updateSecurityConfig(guildId, { enabled: newState });
      
      const embed = new EmbedBuilder()
        .setTitle('⚙️ Système de Vérification')
        .setDescription(`Le système de vérification a été **${newState ? 'activé' : 'désactivé'}**.`)
        .setColor(newState ? 0x51cf66 : 0x6c757d)
        .setTimestamp();

      if (newState) {
        embed.addFields({
          name: '✅ Système activé',
          value: 'Le système de vérification est maintenant opérationnel.\nLes nouveaux membres seront vérifiés selon la configuration actuelle.',
          inline: false
        });
      } else {
        embed.addFields({
          name: '❌ Système désactivé',
          value: 'Le système de vérification est maintenant inactif.\nTous les nouveaux membres pourront rejoindre librement.',
          inline: false
        });
      }

      // Recréer le menu principal avec le nouvel état
      await this.showMainMenuUpdate(interaction, embed);
      
    } catch (error) {
      console.error('Erreur toggle système:', error);
      return interaction.reply({ 
        content: '❌ Erreur lors du changement d\'état du système.', 
        ephemeral: true 
      });
    }
  }

  /**
   * Activer/Désactiver la vérification automatique et mettre à jour la vue
   */
  async toggleAutoVerification(interaction) {
    try {
      const guildId = interaction.guild.id;
      const current = await this.moderationManager.getSecurityConfig(guildId);
      const currentEnabled = !!current.autoVerification?.enabled;

      const updated = await this.moderationManager.updateSecurityConfig(guildId, {
        autoVerification: { enabled: !currentEnabled }
      });

      // Recréer l'embed de la section Auto Verification
      const embed = new EmbedBuilder()
        .setTitle('🔍 Configuration de la vérification automatique')
        .setColor(updated.autoVerification?.enabled ? 0x51cf66 : 0x6c757d)
        .setTimestamp();

      let description = `**État :** ${updated.autoVerification?.enabled ? '✅ Activée' : '❌ Désactivée'}\n\n`;
      if (updated.autoVerification?.enabled) {
        description += '⚙️ **Paramètres actuels :**\n';
        if (updated.autoVerification.minimumAccountAge) {
          description += `• **Âge minimum :** ${updated.autoVerification.minimumAccountAge} jour(s)\n`;
        }
        if (updated.autoVerification.maxRiskScore) {
          description += `• **Score de risque max :** ${updated.autoVerification.maxRiskScore}/100\n`;
        }
        if (updated.autoVerification.multiAccountThreshold) {
          description += `• **Seuil multi-comptes :** ${updated.autoVerification.multiAccountThreshold}%\n`;
        }
        description += '\n💡 Configuration rapide :\n';
        description += '• Utilisez le bouton ci-dessous pour activer/désactiver\n';
        description += '• Utilisez "Retour au menu" pour naviguer vers d’autres sections';
      } else {
        description += '💡 Pour activer :\n';
        description += '• Cliquez sur le bouton "Activer" ci-dessous';
      }
      embed.setDescription(description);

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('config_verif_toggle_auto')
            .setLabel(updated.autoVerification?.enabled ? 'Désactiver' : 'Activer')
            .setStyle(updated.autoVerification?.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(updated.autoVerification?.enabled ? '❌' : '✅'),
          new ButtonBuilder()
            .setCustomId('config_verif_back_menu')
            .setLabel('Retour au menu')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      // Mettre à jour le message en place
      return interaction.update({ embeds: [embed], components: [buttons] });
    } catch (error) {
      console.error('Erreur toggle auto verification:', error);
      return interaction.reply({
        content: '❌ Erreur lors du changement d\'état de la vérification automatique.',
        ephemeral: true
      });
    }
  }

  /**
   * Afficher la liste détaillée des exemptions (utilisateurs/rôles)
   */
  async showExemptionsList(interaction) {
    try {
      const config = await this.moderationManager.getSecurityConfig(interaction.guild.id);
      const userIds = config.whitelist?.userIds || [];
      const roleIds = config.whitelist?.roleIds || [];

      const embed = new EmbedBuilder()
        .setTitle('📋 Liste des exemptions')
        .setColor(0x51cf66)
        .setTimestamp();

      if (userIds.length === 0 && roleIds.length === 0) {
        embed.setDescription('Aucune exemption configurée.');
      } else {
        if (userIds.length > 0) {
          const usersText = userIds
            .slice(0, 20)
            .map(id => `<@${id}>`)
            .join(', ');
          embed.addFields({ name: `👥 Utilisateurs (${userIds.length})`, value: usersText || '—', inline: false });
        }
        if (roleIds.length > 0) {
          const rolesText = roleIds
            .slice(0, 20)
            .map(id => `<@&${id}>`)
            .join(', ');
          embed.addFields({ name: `🎭 Rôles (${roleIds.length})`, value: rolesText || '—', inline: false });
        }
        if (userIds.length + roleIds.length > 20) {
          embed.addFields({ name: 'ℹ️ Remarque', value: 'Liste tronquée à 20 éléments pour l\'aperçu.', inline: false });
        }
      }

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('config_verif_back_menu')
            .setLabel('Retour au menu')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      return interaction.update({ embeds: [embed], components: [buttons] });
    } catch (error) {
      console.error('Erreur showExemptionsList:', error);
      return interaction.reply({
        content: '❌ Erreur lors de l\'affichage des exemptions.',
        ephemeral: true
      });
    }
  }

  /**
   * Gérer le choix d'une action automatique (select menu)
   */
  async handleAutoActionSelect(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Réservé aux administrateurs.', ephemeral: true });
      }

      const actionType = interaction.customId.replace('config_verif_action_', '');
      const selected = interaction.values?.[0];
      if (!selected) {
        return interaction.reply({ content: '❌ Aucune action sélectionnée.', ephemeral: true });
      }

      const guildId = interaction.guild.id;
      const current = await this.moderationManager.getSecurityConfig(guildId);
      const currentActions = current.autoVerification?.actions || {};
      const currentRiskActions = current.autoVerification?.riskActions || {};

      let updates;
      if (actionType.startsWith('risk_')) {
        const riskKey = actionType.split('_')[1]; // low|medium|high|critical
        updates = {
          autoVerification: {
            riskActions: {
              ...currentRiskActions,
              [riskKey]: selected
            }
          }
        };
      } else {
        updates = {
          autoVerification: {
            actions: {
              ...currentActions,
              [actionType]: selected
            }
          }
        };
      }

      const updated = await this.moderationManager.updateSecurityConfig(guildId, updates);

      // Reconstruire la vue appropriée
      if (actionType.startsWith('risk_')) {
        await this.showRiskActionsConfig(interaction, updated);
      } else {
        await this.showAutoActionsConfig(interaction, updated);
      }
    } catch (error) {
      console.error('Erreur handleAutoActionSelect:', error);
      return interaction.reply({ content: '❌ Erreur lors de la mise à jour des actions automatiques.', ephemeral: true });
    }
  }

  /**
   * Gérer la réinitialisation du système
   */
  async handleSystemReset(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('⚠️ Confirmation de réinitialisation')
        .setDescription('**Attention !** Cette action va supprimer toute la configuration de vérification.\n\n' +
                       '**Sera supprimé :**\n' +
                       '• Configuration de vérification automatique\n' +
                       '• Paramètres de quarantaine\n' +
                       '• Actions automatiques\n' +
                       '• Notifications et alertes\n' +
                       '• Liste des exemptions\n\n' +
                       'Êtes-vous sûr de vouloir continuer ?')
        .setColor(0xff6b6b)
        .setTimestamp();

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('config_verif_reset_confirm')
            .setLabel('Confirmer la réinitialisation')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🗑️'),
          new ButtonBuilder()
            .setCustomId('config_verif_reset_cancel')
            .setLabel('Annuler')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌')
        );

      return interaction.reply({ 
        embeds: [embed], 
        components: [buttons], 
        ephemeral: true 
      });
      
    } catch (error) {
      console.error('Erreur reset système:', error);
      return interaction.reply({ 
        content: '❌ Erreur lors de la préparation de la réinitialisation.', 
        ephemeral: true 
      });
    }
  }

  /**
   * Confirmer la réinitialisation du système
   */
  async confirmSystemReset(interaction) {
    try {
      const guildId = interaction.guild.id;
      
      // Réinitialiser la configuration
      await this.moderationManager.resetSecurityConfig(guildId);
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Réinitialisation terminée')
        .setDescription('La configuration du système de vérification a été complètement réinitialisée.')
        .setColor(0x51cf66)
        .setTimestamp();

      embed.addFields({
        name: '🔄 Configuration réinitialisée',
        value: '• Système désactivé\n' +
               '• Vérification automatique désactivée\n' +
               '• Paramètres de quarantaine supprimés\n' +
               '• Actions automatiques supprimées\n' +
               '• Notifications supprimées\n' +
               '• Liste des exemptions vidée',
        inline: false
      });

      return interaction.update({ 
        embeds: [embed], 
        components: [] 
      });
      
    } catch (error) {
      console.error('Erreur confirm reset:', error);
      return interaction.reply({ 
        content: '❌ Erreur lors de la réinitialisation du système.', 
        ephemeral: true 
      });
    }
  }

  /**
   * Annuler la réinitialisation du système
   */
  async cancelSystemReset(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('❌ Réinitialisation annulée')
        .setDescription('La réinitialisation a été annulée. La configuration actuelle est conservée.')
        .setColor(0x6c757d)
        .setTimestamp();

      return interaction.update({ 
        embeds: [embed], 
        components: [] 
      });
      
    } catch (error) {
      console.error('Erreur cancel reset:', error);
      return interaction.reply({ 
        content: '❌ Erreur lors de l\'annulation.', 
        ephemeral: true 
      });
    }
  }

  /**
   * Afficher le guide d'aide
   */
  async showHelpGuide(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('❓ Guide d\'aide - Configuration de Vérification')
        .setDescription('Guide complet pour configurer le système de vérification et sécurité')
        .setColor(0x3498db)
        .setTimestamp();

      embed.addFields(
        {
          name: '🔍 Vérification automatique',
          value: '• **Âge minimum** : Définit l\'âge minimum requis pour un compte Discord\n' +
                '• **Score de risque** : Évalue automatiquement le risque d\'un utilisateur\n' +
                '• **Multi-comptes** : Détecte les comptes multiples suspects',
          inline: false
        },
        {
          name: '🔒 Système de quarantaine',
          value: '• **Rôle quarantaine** : Rôle attribué aux membres suspects\n' +
                '• **Canaux privés** : Création automatique de canaux pour chaque membre\n' +
                '• **Permissions** : Configuration automatique des accès',
          inline: false
        },
        {
          name: '⚡ Actions automatiques',
          value: '• **Quarantaine** : Mise en quarantaine automatique\n' +
                '• **Approbation admin** : Demande validation manuelle\n' +
                '• **Kick/Ban** : Actions immédiates (attention !)\n' +
                '• **Alerte** : Notification simple sans action',
          inline: false
        },
        {
          name: '📢 Notifications',
          value: '• **Canal d\'alertes** : Où envoyer les notifications\n' +
                '• **Rôle admin** : Qui mentionner en cas d\'alerte\n' +
                '• **Délai décision** : Temps avant action automatique',
          inline: false
        },
        {
          name: '📝 Exemptions',
          value: '• **Utilisateurs** : Comptes exemptés de vérification\n' +
                '• **Rôles** : Rôles exemptés automatiquement\n' +
                '• **Gestion** : Ajout/suppression facile',
          inline: false
        },
        {
          name: '⚙️ Conseils de configuration',
          value: '1. **Commencez par la quarantaine** plutôt que kick/ban\n' +
                '2. **Testez avec des comptes de test** avant activation\n' +
                '3. **Configurez les notifications** pour surveiller\n' +
                '4. **Ajoutez des exemptions** pour les bots et admins\n' +
                '5. **Surveillez les logs** après activation',
          inline: false
        }
      );

      const backButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('config_verif_back_menu')
            .setLabel('Retour au menu')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔙')
        );

      return interaction.reply({ 
        embeds: [embed], 
        components: [backButton], 
        ephemeral: true 
      });
      
    } catch (error) {
      console.error('Erreur guide aide:', error);
      return interaction.reply({ 
        content: '❌ Erreur lors de l\'affichage du guide d\'aide.', 
        ephemeral: true 
      });
    }
  }

  /**
   * Mettre à jour le menu principal avec un embed personnalisé
   */
  async showMainMenuUpdate(interaction, customEmbed = null) {
    try {
      const config = await this.moderationManager.getSecurityConfig(interaction.guild.id);
      
      let embed;
      if (customEmbed) {
        embed = customEmbed;
      } else {
        embed = new EmbedBuilder()
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
      }

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
    } catch (error) {
      console.error('Erreur showMainMenuUpdate:', error);
      return interaction.reply({ 
        content: '❌ Erreur lors de la mise à jour du menu.', 
        ephemeral: true 
      });
    }
  }

  async showRiskActionsConfig(interaction, config) {
    const embed = new EmbedBuilder()
      .setTitle('📊 Actions automatiques par niveau de risque')
      .setColor(0x9b59b6)
      .setTimestamp();

    let description = 'Définissez l\'action automatique selon le score de risque détecté.\n\n';
    description += 'Seuils actuels (config > thresholds):\n';
    description += `• Faible < ${config.thresholds?.mediumRisk ?? 40}\n`;
    description += `• Moyen ≥ ${config.thresholds?.mediumRisk ?? 40} et < ${config.thresholds?.highRisk ?? 70}\n`;
    description += `• Élevé ≥ ${config.thresholds?.highRisk ?? 70} et < ${config.thresholds?.criticalRisk ?? 85}\n`;
    description += `• Critique ≥ ${config.thresholds?.criticalRisk ?? 85}\n`;

    const current = config.autoVerification?.riskActions || {};
    if (Object.keys(current).length > 0) {
      description += '\nActuel :\n';
      if (current.low) description += `• Faible: ${this.getActionDisplay(current.low)}\n`;
      if (current.medium) description += `• Moyen: ${this.getActionDisplay(current.medium)}\n`;
      if (current.high) description += `• Élevé: ${this.getActionDisplay(current.high)}\n`;
      if (current.critical) description += `• Critique: ${this.getActionDisplay(current.critical)}\n`;
    }

    embed.setDescription(description);

    const options = this.buildAutoActionOptions();

    const rowLow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_verif_action_risk_low')
        .setPlaceholder('Action pour risque Faible')
        .addOptions(options.map(o => ({ label: o.label, value: o.value, emoji: o.emoji, description: o.description, default: current.low === o.value })))
    );

    const rowMedium = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_verif_action_risk_medium')
        .setPlaceholder('Action pour risque Moyen')
        .addOptions(options.map(o => ({ label: o.label, value: o.value, emoji: o.emoji, description: o.description, default: current.medium === o.value })))
    );

    const rowHigh = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_verif_action_risk_high')
        .setPlaceholder('Action pour risque Élevé')
        .addOptions(options.map(o => ({ label: o.label, value: o.value, emoji: o.emoji, description: o.description, default: current.high === o.value })))
    );

    const rowCritical = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_verif_action_risk_critical')
        .setPlaceholder('Action pour risque Critique')
        .addOptions(options.map(o => ({ label: o.label, value: o.value, emoji: o.emoji, description: o.description, default: current.critical === o.value })))
    );

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('config_verif_back_menu')
        .setLabel('Retour au menu')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔙')
    );

    return interaction.reply({
      embeds: [embed],
      components: [rowLow, rowMedium, rowHigh, rowCritical, buttons],
      ephemeral: true
    });
  }
}

module.exports = SecurityConfigHandler;