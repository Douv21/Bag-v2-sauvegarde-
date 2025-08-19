const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-securite')
    .setDescription('Configurer le système de sécurité et contrôle d\'accès')
    .addSubcommand(subcommand =>
      subcommand
        .setName('voir')
        .setDescription('Voir la configuration actuelle'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('activer')
        .setDescription('Activer/désactiver le système')
        .addBooleanOption(o => o.setName('etat').setDescription('Activer ou désactiver').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('acces')
        .setDescription('Configurer le contrôle d\'accès automatique')
        .addBooleanOption(o => o.setName('activer').setDescription('Activer le contrôle d\'accès').setRequired(true))
        .addIntegerOption(o => o.setName('age-minimum').setDescription('Âge minimum du compte en jours').setMinValue(0).setMaxValue(365))
        .addIntegerOption(o => o.setName('score-max').setDescription('Score de risque maximum (0-100)').setMinValue(0).setMaxValue(100)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('roles')
        .setDescription('Configurer les rôles de sécurité')
        .addRoleOption(o => o.setName('quarantaine').setDescription('Rôle de quarantaine pour membres suspects'))
        .addRoleOption(o => o.setName('verifie').setDescription('Rôle pour membres vérifiés'))
        .addChannelOption(o => o.setName('canal-quarantaine').setDescription('Canal de quarantaine').addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('actions')
        .setDescription('Configurer les actions automatiques')
        .addStringOption(o => o.setName('compte-recent').setDescription('Action pour compte trop récent').addChoices(
          { name: '🔒 Quarantaine', value: 'QUARANTINE' },
          { name: '👨‍💼 Demander approbation admin', value: 'ADMIN_APPROVAL' },
          { name: '👢 Kick automatique', value: 'KICK' },
          { name: '🔨 Ban automatique', value: 'BAN' }
        ))
        .addStringOption(o => o.setName('risque-eleve').setDescription('Action pour risque élevé').addChoices(
          { name: '📢 Alerte seulement', value: 'ALERT' },
          { name: '🔒 Quarantaine', value: 'QUARANTINE' },
          { name: '👨‍💼 Demander approbation admin', value: 'ADMIN_APPROVAL' },
          { name: '👢 Kick automatique', value: 'KICK' }
        )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('admins')
        .setDescription('Configurer les notifications et approbations admin')
        .addChannelOption(o => o.setName('canal-alertes').setDescription('Canal pour alertes sécurité').addChannelTypes(ChannelType.GuildText))
        .addRoleOption(o => o.setName('role-admin').setDescription('Rôle admin à mentionner'))
        .addIntegerOption(o => o.setName('delai').setDescription('Délai avant action auto (minutes)').setMinValue(5).setMaxValue(1440)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('whitelist')
        .setDescription('Gérer la liste d\'exemption')
        .addStringOption(o => o.setName('action').setDescription('Action').setRequired(true).addChoices(
          { name: 'Voir la liste', value: 'view' },
          { name: 'Ajouter utilisateur', value: 'add_user' },
          { name: 'Retirer utilisateur', value: 'remove_user' },
          { name: 'Ajouter rôle', value: 'add_role' },
          { name: 'Retirer rôle', value: 'remove_role' }
        ))
        .addUserOption(o => o.setName('utilisateur').setDescription('Utilisateur à ajouter/retirer'))
        .addRoleOption(o => o.setName('role').setDescription('Rôle à ajouter/retirer')))
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
        case 'voir':
          await this.handleViewConfig(interaction, mod, guildId);
          break;
        case 'activer':
          await this.handleToggle(interaction, mod, guildId);
          break;
        case 'acces':
          await this.handleAccessControl(interaction, mod, guildId);
          break;
        case 'roles':
          await this.handleRoles(interaction, mod, guildId);
          break;
        case 'actions':
          await this.handleActions(interaction, mod, guildId);
          break;
        case 'admins':
          await this.handleAdmins(interaction, mod, guildId);
          break;
        case 'whitelist':
          await this.handleWhitelist(interaction, mod, guildId);
          break;
      }
    } catch (error) {
      console.error('Erreur config sécurité:', error);
      return interaction.reply({ content: '❌ Erreur lors de la configuration.', flags: 64 });
    }
  },

  async handleViewConfig(interaction, mod, guildId) {
    const config = await mod.getSecurityConfig(guildId);
    
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Configuration Sécurité')
      .setColor(config.enabled ? 0x51cf66 : 0x6c757d)
      .setTimestamp();

    // État général
    embed.addFields({
      name: '🔧 État général',
      value: `**Système :** ${config.enabled ? '✅ Activé' : '❌ Désactivé'}\n` +
             `**Contrôle d'accès :** ${config.accessControl?.enabled ? '✅ Activé' : '❌ Désactivé'}\n` +
             `**Alertes auto :** ${config.autoAlerts?.enabled ? '✅ Activées' : '❌ Désactivées'}`,
      inline: false
    });

    // Contrôle d'accès
    if (config.accessControl?.enabled) {
      let accessText = '';
      
      if (config.accessControl.accountAgeGate?.enabled) {
        accessText += `🕐 **Âge minimum :** ${config.accessControl.accountAgeGate.minimumAgeDays} jour(s)\n`;
        accessText += `   └ Action : ${this.getActionDisplay(config.accessControl.accountAgeGate.action)}\n\n`;
      }
      
      if (config.accessControl.riskGate?.enabled) {
        accessText += `📊 **Score max :** ${config.accessControl.riskGate.maxAllowedScore}/100\n`;
        accessText += `   └ Action : ${this.getActionDisplay(config.accessControl.riskGate.action)}\n`;
      }

      embed.addFields({
        name: '🚪 Contrôle d\'accès',
        value: accessText || 'Aucune restriction active',
        inline: false
      });
    }

    // Rôles et canaux
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

    // Seuils et délais
    embed.addFields({
      name: '📊 Paramètres',
      value: `**Seuil alerte :** ${config.thresholds?.alertThreshold || 50}/100\n` +
             `**Seuil critique :** ${config.thresholds?.criticalRisk || 85}/100\n` +
             `**Multi-comptes :** ${config.thresholds?.multiAccountAlert || 60}/100\n` +
             `**Délai admin :** ${config.accessControl?.adminApproval?.timeoutMinutes || 60} min`,
      inline: false
    });

    // Guide de configuration
    embed.addFields({
      name: '🚀 Configuration rapide',
      value: '**Étapes recommandées :**\n' +
             '1️⃣ `/config-securite acces activer:true age-minimum:7 score-max:40`\n' +
             '2️⃣ `/config-securite roles` (configurer rôles)\n' +
             '3️⃣ `/config-securite actions` (définir actions auto)\n' +
             '4️⃣ `/config-securite admins` (canal d\'alertes)',
      inline: false
    });

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
      response += '\n• Configurez les rôles avec `/config-securite roles`';
      response += '\n• Définissez les actions avec `/config-securite actions`';
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