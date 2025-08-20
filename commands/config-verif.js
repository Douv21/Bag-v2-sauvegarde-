const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-verif')
    .setDescription('Configuration unifiée du système de vérification et sécurité')
    .addSubcommand(subcommand =>
      subcommand
        .setName('menu')
        .setDescription('Ouvrir le menu de configuration principal'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('voir')
        .setDescription('Voir la configuration actuelle'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('auto-verif')
        .setDescription('Configurer la vérification automatique à l\'arrivée')
        .addBooleanOption(o => o.setName('activer').setDescription('Activer la vérification automatique').setRequired(true))
        .addIntegerOption(o => o.setName('age-minimum').setDescription('Âge minimum du compte en jours').setMinValue(0).setMaxValue(365))
        .addIntegerOption(o => o.setName('score-risque-max').setDescription('Score de risque maximum (0-100)').setMinValue(0).setMaxValue(100))
        .addIntegerOption(o => o.setName('seuil-multicompte').setDescription('Seuil de détection multi-comptes (%)').setMinValue(30).setMaxValue(100)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('quarantaine')
        .setDescription('Configurer le système de quarantaine (canaux créés automatiquement)')
        .addRoleOption(o => o.setName('role-quarantaine').setDescription('Rôle de quarantaine (canaux privés créés automatiquement)').setRequired(true))
        .addRoleOption(o => o.setName('role-verifie').setDescription('Rôle pour membres vérifiés après libération')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('actions-auto')
        .setDescription('Configurer les actions automatiques')
        .addStringOption(o => o.setName('compte-recent').setDescription('Action pour compte trop récent').addChoices(
          { name: '🔒 Quarantaine automatique', value: 'QUARANTINE' },
          { name: '👨‍💼 Approbation admin requise', value: 'ADMIN_APPROVAL' },
          { name: '👢 Kick automatique', value: 'KICK' },
          { name: '🔨 Ban automatique', value: 'BAN' },
          { name: '📢 Alerte seulement', value: 'ALERT' }
        ))
        .addStringOption(o => o.setName('multicompte').setDescription('Action pour multi-comptes suspects').addChoices(
          { name: '🔒 Quarantaine automatique', value: 'QUARANTINE' },
          { name: '👨‍💼 Approbation admin requise', value: 'ADMIN_APPROVAL' },
          { name: '👢 Kick automatique', value: 'KICK' },
          { name: '🔨 Ban automatique', value: 'BAN' },
          { name: '📢 Alerte seulement', value: 'ALERT' }
        ))
        .addStringOption(o => o.setName('nom-suspect').setDescription('Action pour nom suspect').addChoices(
          { name: '🔒 Quarantaine automatique', value: 'QUARANTINE' },
          { name: '👨‍💼 Approbation admin requise', value: 'ADMIN_APPROVAL' },
          { name: '👢 Kick automatique', value: 'KICK' },
          { name: '📢 Alerte seulement', value: 'ALERT' }
        )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('notifications')
        .setDescription('Configurer les notifications admin')
        .addChannelOption(o => o.setName('canal-alertes').setDescription('Canal pour alertes sécurité').addChannelTypes(ChannelType.GuildText))
        .addRoleOption(o => o.setName('role-admin').setDescription('Rôle admin à mentionner'))
        .addIntegerOption(o => o.setName('delai-decision').setDescription('Délai avant action auto (minutes)').setMinValue(5).setMaxValue(1440)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('exemptions')
        .setDescription('Gérer les exemptions de vérification')
        .addStringOption(o => o.setName('action').setDescription('Action').setRequired(true).addChoices(
          { name: 'Voir la liste', value: 'view' },
          { name: 'Ajouter utilisateur', value: 'add_user' },
          { name: 'Retirer utilisateur', value: 'remove_user' },
          { name: 'Ajouter rôle', value: 'add_role' },
          { name: 'Retirer rôle', value: 'remove_role' }
        ))
        .addUserOption(o => o.setName('utilisateur').setDescription('Utilisateur à ajouter/retirer'))
        .addRoleOption(o => o.setName('role').setDescription('Rôle à ajouter/retirer')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Réinitialiser la configuration (ATTENTION: supprime tout)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 5,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }

    const mod = interaction.client.moderationManager;
    if (!mod) {
      return interaction.reply({ content: '❌ Système de modération non disponible.', flags: 64 });
    }

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    try {
      switch (subcommand) {
        case 'menu':
          await this.handleMainMenu(interaction, mod, guildId);
          break;
        case 'voir':
          await this.handleViewConfig(interaction, mod, guildId);
          break;
        case 'auto-verif':
          await this.handleAutoVerification(interaction, mod, guildId);
          break;
        case 'quarantaine':
          await this.handleQuarantineConfig(interaction, mod, guildId);
          break;
        case 'actions-auto':
          await this.handleAutoActions(interaction, mod, guildId);
          break;
        case 'notifications':
          await this.handleNotifications(interaction, mod, guildId);
          break;
        case 'exemptions':
          await this.handleExemptions(interaction, mod, guildId);
          break;
        case 'reset':
          await this.handleReset(interaction, mod, guildId);
          break;
      }
    } catch (error) {
      console.error('Erreur config sécurité:', error);
      return interaction.reply({ content: '❌ Erreur lors de la configuration.', flags: 64 });
    }
  },

  async handleMainMenu(interaction, mod, guildId) {
    const config = await mod.getSecurityConfig(guildId);
    
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

    return interaction.reply({ 
      embeds: [embed], 
      components: [row, buttons], 
      flags: 64 
    });
  },

  async handleAutoVerification(interaction, mod, guildId) {
    const enabled = interaction.options.getBoolean('activer', true);
    const minAge = interaction.options.getInteger('age-minimum');
    const maxRiskScore = interaction.options.getInteger('score-risque-max');
    const multiAccountThreshold = interaction.options.getInteger('seuil-multicompte');

    const updates = {
      autoVerification: {
        enabled,
        ...(minAge !== null && { minimumAccountAge: minAge }),
        ...(maxRiskScore !== null && { maxRiskScore }),
        ...(multiAccountThreshold !== null && { multiAccountThreshold })
      }
    };

    await mod.updateSecurityConfig(guildId, updates);

    let response = `✅ **Vérification automatique ${enabled ? 'activée' : 'désactivée'}**\n\n`;
    
    if (enabled) {
      response += '⚙️ **Paramètres configurés :**\n';
      if (minAge !== null) response += `• Âge minimum du compte : **${minAge} jour(s)**\n`;
      if (maxRiskScore !== null) response += `• Score de risque maximum : **${maxRiskScore}/100**\n`;
      if (multiAccountThreshold !== null) response += `• Seuil multi-comptes : **${multiAccountThreshold}%**\n`;
      
      response += '\n💡 **Prochaines étapes :**\n';
      response += '• Configurez la quarantaine avec `/config-verif quarantaine`\n';
      response += '• Définissez les actions avec `/config-verif actions-auto`\n';
      response += '• Configurez les notifications avec `/config-verif notifications`';
    }

    return interaction.reply({ content: response, flags: 64 });
  },

  async handleQuarantineConfig(interaction, mod, guildId) {
    const quarantineRole = interaction.options.getRole('role-quarantaine', true);
    const verifiedRole = interaction.options.getRole('role-verifie');

    const updates = { accessControl: {} };
    
    // Configuration du rôle de quarantaine (obligatoire)
    updates.accessControl.quarantineRoleId = quarantineRole.id;
    updates.accessControl.quarantineRoleName = quarantineRole.name;
    
    // Configuration du rôle vérifié (optionnel)
    if (verifiedRole) {
      updates.accessControl.verifiedRoleId = verifiedRole.id;
      updates.accessControl.verifiedRoleName = verifiedRole.name;
    }

    await mod.updateSecurityConfig(guildId, updates);

    let response = '✅ **Configuration de quarantaine mise à jour :**\n\n';
    response += `🔒 **Rôle quarantaine :** ${quarantineRole}\n`;
    if (verifiedRole) response += `✅ **Rôle vérifié :** ${verifiedRole}\n`;

    response += '\n🏗️ **Fonctionnement automatique :**\n';
    response += '• **Canaux créés automatiquement** pour chaque membre en quarantaine\n';
    response += '• **Canal texte privé** pour communication avec les admins\n';
    response += '• **Canal vocal privé** pour discussions vocales si nécessaire\n';
    response += '• **Catégorie "🔒 QUARANTAINE"** créée automatiquement\n';
    response += '• **Suppression automatique** des canaux à la libération\n\n';

    response += '⚙️ **Permissions automatiques du rôle quarantaine :**\n';
    response += '• ❌ **Accès refusé** à tous les canaux généraux\n';
    response += '• ✅ **Accès autorisé** uniquement aux canaux de quarantaine personnels\n';
    response += '• 🔧 **Configuration automatique** des permissions par canal\n\n';

    response += '💡 **Recommandations :**\n';
    response += '• Configurez le rôle pour **refuser l\'accès** à tous les canaux normaux\n';
    response += '• Les permissions des canaux de quarantaine sont **gérées automatiquement**\n';
    response += '• Les admins ont accès aux canaux de quarantaine pour modération';

    return interaction.reply({ content: response, flags: 64 });
  },

  async handleAutoActions(interaction, mod, guildId) {
    const recentAccountAction = interaction.options.getString('compte-recent');
    const multiAccountAction = interaction.options.getString('multicompte');
    const suspiciousNameAction = interaction.options.getString('nom-suspect');

    const updates = { 
      autoVerification: {
        actions: {}
      }
    };
    
    if (recentAccountAction) {
      updates.autoVerification.actions.recentAccount = recentAccountAction;
    }
    
    if (multiAccountAction) {
      updates.autoVerification.actions.multiAccount = multiAccountAction;
    }
    
    if (suspiciousNameAction) {
      updates.autoVerification.actions.suspiciousName = suspiciousNameAction;
    }

    await mod.updateSecurityConfig(guildId, updates);

    let response = '✅ **Actions automatiques configurées :**\n\n';
    if (recentAccountAction) response += `🕐 **Compte récent :** ${this.getActionDisplay(recentAccountAction)}\n`;
    if (multiAccountAction) response += `🔍 **Multi-comptes :** ${this.getActionDisplay(multiAccountAction)}\n`;
    if (suspiciousNameAction) response += `👤 **Nom suspect :** ${this.getActionDisplay(suspiciousNameAction)}\n`;

    response += '\n⚠️ **Important :**\n';
    response += '• Les actions automatiques s\'exécutent sans intervention humaine\n';
    response += '• Recommandé : Commencer par "Quarantaine" ou "Approbation admin"\n';
    response += '• Les actions "Kick" et "Ban" sont irréversibles\n';
    response += '• Testez d\'abord avec des comptes de test';

    return interaction.reply({ content: response, flags: 64 });
  },

  async handleNotifications(interaction, mod, guildId) {
    const alertChannel = interaction.options.getChannel('canal-alertes');
    const adminRole = interaction.options.getRole('role-admin');
    const decisionDelay = interaction.options.getInteger('delai-decision');

    const updates = {};
    
    if (alertChannel) {
      updates.autoAlerts = {
        enabled: true,
        alertChannelId: alertChannel.id
      };
    }
    
    if (adminRole) {
      updates.autoAlerts = {
        ...updates.autoAlerts,
        moderatorRoleId: adminRole.id,
        mentionModerators: true
      };
    }
    
    if (decisionDelay) {
      updates.autoVerification = {
        adminApproval: {
          enabled: true,
          timeoutMinutes: decisionDelay,
          defaultAction: 'KICK'
        }
      };
    }

    await mod.updateSecurityConfig(guildId, updates);

    let response = '✅ **Configuration des notifications mise à jour :**\n\n';
    if (alertChannel) response += `📢 **Canal d'alertes :** ${alertChannel}\n`;
    if (adminRole) response += `👮 **Rôle admin :** ${adminRole}\n`;
    if (decisionDelay) response += `⏰ **Délai de décision :** ${decisionDelay} minute(s)\n`;

    response += '\n💡 **Fonctionnement :**\n';
    response += '• Les alertes apparaissent avec des boutons d\'action\n';
    response += '• Les admins peuvent approuver/refuser/quarantaine\n';
    response += '• Action automatique si pas de réponse dans le délai\n';
    response += '• Historique de toutes les décisions conservé';

    return interaction.reply({ content: response, flags: 64 });
  },

  async handleExemptions(interaction, mod, guildId) {
    const action = interaction.options.getString('action', true);
    const user = interaction.options.getUser('utilisateur');
    const role = interaction.options.getRole('role');

    const config = await mod.getSecurityConfig(guildId);

    switch (action) {
      case 'view':
        return this.showExemptions(interaction, config);
      
      case 'add_user':
        if (!user) return interaction.reply({ content: '❌ Utilisateur requis.', flags: 64 });
        if (!config.whitelist.userIds.includes(user.id)) {
          config.whitelist.userIds.push(user.id);
          await mod.updateSecurityConfig(guildId, { whitelist: config.whitelist });
        }
        return interaction.reply({ content: `✅ **${user.tag}** ajouté aux exemptions.`, flags: 64 });
      
      case 'remove_user':
        if (!user) return interaction.reply({ content: '❌ Utilisateur requis.', flags: 64 });
        config.whitelist.userIds = config.whitelist.userIds.filter(id => id !== user.id);
        await mod.updateSecurityConfig(guildId, { whitelist: config.whitelist });
        return interaction.reply({ content: `✅ **${user.tag}** retiré des exemptions.`, flags: 64 });
      
      case 'add_role':
        if (!role) return interaction.reply({ content: '❌ Rôle requis.', flags: 64 });
        if (!config.whitelist.roleIds.includes(role.id)) {
          config.whitelist.roleIds.push(role.id);
          await mod.updateSecurityConfig(guildId, { whitelist: config.whitelist });
        }
        return interaction.reply({ content: `✅ Rôle **${role.name}** ajouté aux exemptions.`, flags: 64 });
      
      case 'remove_role':
        if (!role) return interaction.reply({ content: '❌ Rôle requis.', flags: 64 });
        config.whitelist.roleIds = config.whitelist.roleIds.filter(id => id !== role.id);
        await mod.updateSecurityConfig(guildId, { whitelist: config.whitelist });
        return interaction.reply({ content: `✅ Rôle **${role.name}** retiré des exemptions.`, flags: 64 });
    }
  },

  async handleReset(interaction, mod, guildId) {
    const embed = new EmbedBuilder()
      .setTitle('⚠️ Confirmation de réinitialisation')
      .setDescription('**Attention !** Cette action va supprimer toute la configuration de vérification.\n\nÊtes-vous sûr de vouloir continuer ?')
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
      flags: 64 
    });
  },

  async handleViewConfig(interaction, mod, guildId) {
    const config = await mod.getSecurityConfig(guildId);
    
    const embed = new EmbedBuilder()
      .setTitle('📊 Configuration Complète du Système de Vérification')
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

    // Actions automatiques
    if (config.autoVerification?.actions) {
      let actionsText = '';
      const actions = config.autoVerification.actions;
      
      if (actions.recentAccount) {
        actionsText += `🕐 **Compte récent :** ${this.getActionDisplay(actions.recentAccount)}\n`;
      }
      
      if (actions.multiAccount) {
        actionsText += `🔍 **Multi-comptes :** ${this.getActionDisplay(actions.multiAccount)}\n`;
      }
      
      if (actions.suspiciousName) {
        actionsText += `👤 **Nom suspect :** ${this.getActionDisplay(actions.suspiciousName)}\n`;
      }

      if (actionsText) {
        embed.addFields({
          name: '⚡ Actions automatiques',
          value: actionsText,
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

    return interaction.reply({ embeds: [embed], flags: 64 });
  },

  async showExemptions(interaction, config) {
    const embed = new EmbedBuilder()
      .setTitle('📝 Liste des exemptions de vérification')
      .setColor(0x51cf66)
      .setTimestamp();

    // Utilisateurs exemptés
    if (config.whitelist?.userIds?.length > 0) {
      let userList = '';
      for (const userId of config.whitelist.userIds.slice(0, 10)) {
        try {
          const user = await interaction.client.users.fetch(userId);
          userList += `• ${user.tag}\n`;
        } catch {
          userList += `• Utilisateur inconnu (${userId})\n`;
        }
      }
      
      embed.addFields({
        name: `👥 Utilisateurs exemptés (${config.whitelist.userIds.length})`,
        value: userList || 'Aucun',
        inline: false
      });
    }

    // Rôles exemptés
    if (config.whitelist?.roleIds?.length > 0) {
      let roleList = '';
      for (const roleId of config.whitelist.roleIds.slice(0, 10)) {
        const role = interaction.guild.roles.cache.get(roleId);
        roleList += `• ${role ? role.name : 'Rôle inconnu'}\n`;
      }
      
      embed.addFields({
        name: `🎭 Rôles exemptés (${config.whitelist.roleIds.length})`,
        value: roleList || 'Aucun',
        inline: false
      });
    }

    if (!config.whitelist?.userIds?.length && !config.whitelist?.roleIds?.length) {
      embed.addFields({
        name: 'ℹ️ Aucune exemption',
        value: 'Tous les nouveaux membres seront vérifiés automatiquement.',
        inline: false
      });
    }

    return interaction.reply({ embeds: [embed], flags: 64 });
  },

  async handleToggle(interaction, mod, guildId) {
    const enabled = interaction.options.getBoolean('etat', true);
    await mod.updateSecurityConfig(guildId, { enabled });
    
    return interaction.reply({
      content: `✅ Système de sécurité ${enabled ? '**activé**' : '**désactivé**'}.`,
      flags: 64
    });
  },

  async handleAccessControl(interaction, mod, guildId) {
    const enabled = interaction.options.getBoolean('activer', true);
    const minAge = interaction.options.getInteger('age-minimum');
    const maxScore = interaction.options.getInteger('score-max');

    const updates = {
      accessControl: {
        enabled,
        ...(minAge !== null && {
          accountAgeGate: {
            enabled: true,
            minimumAgeDays: minAge,
            action: 'QUARANTINE'
          }
        }),
        ...(maxScore !== null && {
          riskGate: {
            enabled: true,
            maxAllowedScore: maxScore,
            action: 'ADMIN_APPROVAL'
          }
        })
      }
    };

    await mod.updateSecurityConfig(guildId, updates);

    let response = `✅ **Contrôle d'accès ${enabled ? 'activé' : 'désactivé'}**`;
    if (minAge !== null) response += `\n🕐 Âge minimum : **${minAge} jour(s)**`;
    if (maxScore !== null) response += `\n📊 Score maximum : **${maxScore}/100**`;
    
    if (enabled) {
      response += '\n\n💡 **Prochaines étapes :**';
      response += '\n• Configurez les rôles avec `/config-verif roles`';
      response += '\n• Définissez les actions avec `/config-verif actions`';
    }

    return interaction.reply({ content: response, flags: 64 });
  },

  async handleRoles(interaction, mod, guildId) {
    const quarantineRole = interaction.options.getRole('quarantaine');
    const verifiedRole = interaction.options.getRole('verifie');
    const quarantineChannel = interaction.options.getChannel('canal-quarantaine');

    const updates = { accessControl: {} };
    
    if (quarantineRole) {
      updates.accessControl.quarantineRoleId = quarantineRole.id;
      updates.accessControl.quarantineRoleName = quarantineRole.name;
    }
    
    if (verifiedRole) {
      updates.accessControl.verifiedRoleId = verifiedRole.id;
      updates.accessControl.verifiedRoleName = verifiedRole.name;
    }
    
    if (quarantineChannel) {
      updates.accessControl.quarantineChannelId = quarantineChannel.id;
    }

    await mod.updateSecurityConfig(guildId, updates);

    let response = '✅ **Configuration des rôles mise à jour :**';
    if (quarantineRole) response += `\n🔒 **Quarantaine :** ${quarantineRole}`;
    if (verifiedRole) response += `\n✅ **Vérifié :** ${verifiedRole}`;
    if (quarantineChannel) response += `\n📢 **Canal quarantaine :** ${quarantineChannel}`;

    response += '\n\n💡 **Permissions recommandées pour le rôle quarantaine :**';
    response += '\n• ❌ Voir les canaux généraux';
    response += '\n• ✅ Voir seulement le canal de quarantaine';
    response += '\n• ❌ Envoyer des messages (sauf quarantaine)';

    return interaction.reply({ content: response, flags: 64 });
  },

  async handleActions(interaction, mod, guildId) {
    const accountAction = interaction.options.getString('compte-recent');
    const riskAction = interaction.options.getString('risque-eleve');

    const updates = { accessControl: {} };
    
    if (accountAction) {
      updates.accessControl.accountAgeGate = {
        enabled: true,
        action: accountAction
      };
    }
    
    if (riskAction) {
      updates.accessControl.riskGate = {
        enabled: true,
        action: riskAction
      };
    }

    await mod.updateSecurityConfig(guildId, updates);

    let response = '✅ **Actions automatiques configurées :**';
    if (accountAction) response += `\n🕐 **Compte récent :** ${this.getActionDisplay(accountAction)}`;
    if (riskAction) response += `\n📊 **Risque élevé :** ${this.getActionDisplay(riskAction)}`;

    response += '\n\n⚠️ **Important :** Les actions automatiques peuvent bannir/kicker sans intervention humaine.';
    response += '\n💡 Recommandé : Commencer par "Quarantaine" ou "Approbation admin"';

    return interaction.reply({ content: response, flags: 64 });
  },

  async handleAdmins(interaction, mod, guildId) {
    const alertChannel = interaction.options.getChannel('canal-alertes');
    const adminRole = interaction.options.getRole('role-admin');
    const timeout = interaction.options.getInteger('delai');

    const updates = {};
    
    if (alertChannel) {
      updates.autoAlerts = {
        enabled: true,
        alertChannelId: alertChannel.id
      };
    }
    
    if (adminRole) {
      updates.autoAlerts = {
        ...updates.autoAlerts,
        moderatorRoleId: adminRole.id,
        mentionModerators: true
      };
    }
    
    if (timeout) {
      updates.accessControl = {
        adminApproval: {
          enabled: true,
          timeoutMinutes: timeout,
          defaultAction: 'KICK'
        }
      };
    }

    await mod.updateSecurityConfig(guildId, updates);

    let response = '✅ **Configuration admin mise à jour :**';
    if (alertChannel) response += `\n📢 **Canal alertes :** ${alertChannel}`;
    if (adminRole) response += `\n👮 **Rôle admin :** ${adminRole}`;
    if (timeout) response += `\n⏰ **Délai décision :** ${timeout} minute(s)`;

    response += '\n\n💡 **Fonctionnement :**';
    response += '\n• Les alertes apparaîtront avec des boutons d\'action';
    response += '\n• Les admins peuvent approuver/refuser directement';
    response += '\n• Action automatique si pas de réponse dans le délai';

    return interaction.reply({ content: response, flags: 64 });
  },

  async handleWhitelist(interaction, mod, guildId) {
    const action = interaction.options.getString('action', true);
    const user = interaction.options.getUser('utilisateur');
    const role = interaction.options.getRole('role');

    const config = await mod.getSecurityConfig(guildId);

    switch (action) {
      case 'view':
        return this.showWhitelist(interaction, config);
      
      case 'add_user':
        if (!user) return interaction.reply({ content: '❌ Utilisateur requis.', flags: 64 });
        if (!config.whitelist.userIds.includes(user.id)) {
          config.whitelist.userIds.push(user.id);
          await mod.updateSecurityConfig(guildId, { whitelist: config.whitelist });
        }
        return interaction.reply({ content: `✅ **${user.tag}** ajouté à la liste d'exemption.`, flags: 64 });
      
      case 'remove_user':
        if (!user) return interaction.reply({ content: '❌ Utilisateur requis.', flags: 64 });
        config.whitelist.userIds = config.whitelist.userIds.filter(id => id !== user.id);
        await mod.updateSecurityConfig(guildId, { whitelist: config.whitelist });
        return interaction.reply({ content: `✅ **${user.tag}** retiré de la liste d'exemption.`, flags: 64 });
      
      case 'add_role':
        if (!role) return interaction.reply({ content: '❌ Rôle requis.', flags: 64 });
        if (!config.whitelist.roleIds.includes(role.id)) {
          config.whitelist.roleIds.push(role.id);
          await mod.updateSecurityConfig(guildId, { whitelist: config.whitelist });
        }
        return interaction.reply({ content: `✅ Rôle **${role.name}** ajouté à la liste d'exemption.`, flags: 64 });
      
      case 'remove_role':
        if (!role) return interaction.reply({ content: '❌ Rôle requis.', flags: 64 });
        config.whitelist.roleIds = config.whitelist.roleIds.filter(id => id !== role.id);
        await mod.updateSecurityConfig(guildId, { whitelist: config.whitelist });
        return interaction.reply({ content: `✅ Rôle **${role.name}** retiré de la liste d'exemption.`, flags: 64 });
    }
  },

  async showWhitelist(interaction, config) {
    const embed = new EmbedBuilder()
      .setTitle('📝 Liste d\'exemption sécurité')
      .setColor(0x51cf66)
      .setTimestamp();

    // Utilisateurs
    if (config.whitelist.userIds.length > 0) {
      let userList = '';
      for (const userId of config.whitelist.userIds.slice(0, 10)) {
        try {
          const user = await interaction.client.users.fetch(userId);
          userList += `• ${user.tag}\n`;
        } catch {
          userList += `• Utilisateur inconnu (${userId})\n`;
        }
      }
      
      embed.addFields({
        name: `👥 Utilisateurs exemptés (${config.whitelist.userIds.length})`,
        value: userList || 'Aucun',
        inline: false
      });
    }

    // Rôles
    if (config.whitelist.roleIds.length > 0) {
      let roleList = '';
      for (const roleId of config.whitelist.roleIds.slice(0, 10)) {
        const role = interaction.guild.roles.cache.get(roleId);
        roleList += `• ${role ? role.name : 'Rôle inconnu'}\n`;
      }
      
      embed.addFields({
        name: `🎭 Rôles exemptés (${config.whitelist.roleIds.length})`,
        value: roleList || 'Aucun',
        inline: false
      });
    }

    if (config.whitelist.userIds.length === 0 && config.whitelist.roleIds.length === 0) {
      embed.addFields({
        name: 'ℹ️ Liste vide',
        value: 'Aucun utilisateur ou rôle dans la liste d\'exemption.\nTous les nouveaux membres seront vérifiés.',
        inline: false
      });
    }

    return interaction.reply({ embeds: [embed], flags: 64 });
  },

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
};

