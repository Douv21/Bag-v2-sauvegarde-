const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test-verif')
    .setDescription('Tester le système de vérification et notifications')
    .addSubcommand(subcommand =>
      subcommand
        .setName('config')
        .setDescription('Vérifier la configuration du système'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('canal')
        .setDescription('Tester la détection du canal d\'alertes'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('alerte')
        .setDescription('Envoyer une alerte de test')
        .addUserOption(o => o.setName('membre').setDescription('Membre à utiliser pour le test')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('quarantaine')
        .setDescription('Tester le système de quarantaine complet')
        .addUserOption(o => o.setName('membre').setDescription('Membre à utiliser pour le test (optionnel)')))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 10,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', ephemeral: true });
    }

    const mod = interaction.client.moderationManager;
    if (!mod) {
      return interaction.reply({ content: '❌ Système de modération non disponible.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'config':
          await this.testConfig(interaction, mod);
          break;
        case 'canal':
          await this.testChannel(interaction);
          break;
        case 'alerte':
          await this.testAlert(interaction);
          break;
        case 'quarantaine':
          await this.testQuarantine(interaction);
          break;
      }
    } catch (error) {
      console.error('Erreur test vérification:', error);
      return interaction.reply({ content: '❌ Erreur lors du test.', ephemeral: true });
    }
  },

  async testConfig(interaction, mod) {
    const config = await mod.getSecurityConfig(interaction.guild.id);
    
    const embed = new EmbedBuilder()
      .setTitle('🔧 Test Configuration Sécurité')
      .setColor(config.enabled ? 0x51cf66 : 0xff6b6b)
      .setTimestamp();

    // État général
    embed.addFields({
      name: '⚙️ État du système',
      value: `**Système activé :** ${config.enabled ? '✅ Oui' : '❌ Non'}\n` +
             `**Auto-alertes :** ${config.autoAlerts?.enabled ? '✅ Activées' : '❌ Désactivées'}\n` +
             `**Contrôle d'accès :** ${config.accessControl?.enabled ? '✅ Activé' : '❌ Désactivé'}`,
      inline: false
    });

    // Canal d'alertes
    let channelStatus = '❌ Non configuré';
    if (config.autoAlerts?.alertChannelId) {
      const channel = interaction.guild.channels.cache.get(config.autoAlerts.alertChannelId);
      channelStatus = channel ? `✅ <#${channel.id}>` : '⚠️ Canal introuvable';
    }

    embed.addFields({
      name: '📢 Canal d\'alertes',
      value: channelStatus,
      inline: true
    });

    // Rôle modérateur
    let roleStatus = '❌ Non configuré';
    if (config.autoAlerts?.moderatorRoleId) {
      const role = interaction.guild.roles.cache.get(config.autoAlerts.moderatorRoleId);
      roleStatus = role ? `✅ @${role.name}` : '⚠️ Rôle introuvable';
    }

    embed.addFields({
      name: '👮 Rôle modérateur',
      value: roleStatus,
      inline: true
    });

    // Seuils
    embed.addFields({
      name: '📊 Seuils de risque',
      value: `**Alerte :** ${config.thresholds?.alertThreshold || 50}/100\n` +
             `**Multi-comptes :** ${config.thresholds?.multiAccountAlert || 60}/100\n` +
             `**Critique :** ${config.thresholds?.criticalRisk || 85}/100`,
      inline: false
    });

    // Recommandations
    const recommendations = [];
    if (!config.enabled) recommendations.push('• Activer le système avec `/config-verif activer etat:true`');
    if (!config.autoAlerts?.alertChannelId) recommendations.push('• Configurer le canal d\'alertes avec `/config-verif admins canal-alertes:#votre-canal`');
    if (!config.autoAlerts?.moderatorRoleId) recommendations.push('• Configurer le rôle modérateur avec `/config-verif admins role-admin:@votre-role`');

    if (recommendations.length > 0) {
      embed.addFields({
        name: '💡 Recommandations',
        value: recommendations.join('\n'),
        inline: false
      });
    } else {
      embed.addFields({
        name: '✅ Configuration',
        value: 'Le système semble correctement configuré !',
        inline: false
      });
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },

  async testChannel(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // Utiliser la méthode du bot principal pour trouver le canal
    const bot = interaction.client;
    const channel = await bot.findSecurityLogChannel(interaction.guild);

    const embed = new EmbedBuilder()
      .setTitle('📡 Test Détection Canal')
      .setTimestamp();

    if (channel) {
      embed.setColor(0x51cf66);
      embed.addFields({
        name: '✅ Canal trouvé',
        value: `**Canal :** <#${channel.id}>\n**Nom :** #${channel.name}\n**Type :** ${channel.type}`,
        inline: false
      });

      // Tester l'envoi d'un message de test
      try {
        await channel.send({
          content: '🧪 **Message de test du système de vérification**\n' +
                   `Envoyé par ${interaction.user.tag} depuis ${interaction.channel.name}\n` +
                   '*Ce message confirme que le canal d\'alertes fonctionne correctement.*'
        });
        
        embed.addFields({
          name: '📤 Test d\'envoi',
          value: '✅ Message de test envoyé avec succès',
          inline: false
        });
      } catch (error) {
        embed.addFields({
          name: '📤 Test d\'envoi',
          value: `❌ Erreur: ${error.message}`,
          inline: false
        });
      }
    } else {
      embed.setColor(0xff6b6b);
      embed.addFields({
        name: '❌ Aucun canal trouvé',
        value: 'Le système n\'a pas pu trouver de canal d\'alertes.\n\n' +
               '**Solutions possibles :**\n' +
               '• Configurer avec `/config-verif admins canal-alertes:#votre-canal`\n' +
               '• Créer un canal nommé "sécurité", "alertes" ou "logs"\n' +
               '• Configurer les logs généraux avec `/config-logs`',
        inline: false
      });
    }

    return interaction.editReply({ embeds: [embed] });
  },

  async testAlert(interaction) {
    const member = interaction.options.getMember('membre') || interaction.member;
    
    await interaction.deferReply({ ephemeral: true });

    // Créer des données de test
    const testSecurityAnalysis = {
      riskScore: 45,
      flags: ['🆕 Compte récent', '⚠️ Aucun avatar personnalisé'],
      recommendations: ['👀 Surveiller l\'activité', '🔍 Vérifier l\'authenticité']
    };

    const testDetails = {
      totalScore: 45,
      raidCheck: { isRaidSuspect: false, reasons: [] },
      multiAccountCheck: { totalSuspects: 0, confidence: 15 }
    };

    // Utiliser la méthode du bot principal
    const bot = interaction.client;
    
    try {
      await bot.sendSecurityAlert(member, testSecurityAnalysis, testDetails);
      
      return interaction.editReply({
        content: `✅ **Alerte de test envoyée !**\n\n` +
                 `**Membre testé :** ${member.user.tag}\n` +
                 `**Score simulé :** ${testDetails.totalScore}/100\n\n` +
                 `Vérifiez le canal d'alertes pour voir le message.`,
        ephemeral: true
      });
    } catch (error) {
      return interaction.editReply({
        content: `❌ **Erreur lors de l'envoi de l'alerte de test**\n\n` +
                 `**Erreur :** ${error.message}\n\n` +
                 `Vérifiez la configuration avec \`/test-verif config\``,
        ephemeral: true
      });
    }
  },

  async testQuarantine(interaction) {
    const member = interaction.options.getMember('membre') || interaction.member;
    
    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Impossible de tester la quarantaine sur un administrateur. Utilisez un membre normal.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Créer des données de test pour la quarantaine
      const testDetails = {
        reason: 'Test du système de quarantaine',
        score: 75,
        manual: true,
        tester: interaction.user.id
      };

      // Utiliser le système de quarantaine du bot principal
      const bot = interaction.client;
      
      // Informer l'utilisateur du début du test
      await interaction.editReply({
        content: `🧪 **Test de quarantaine en cours...**\n\n` +
                 `**Membre testé :** ${member.user.tag}\n` +
                 `**Étape 1/3 :** Création des canaux de quarantaine...\n\n` +
                 `⚠️ **Attention :** Ce test va temporairement isoler le membre. ` +
                 `Il sera automatiquement libéré dans 30 secondes.`
      });

      // Vérifier que la méthode est disponible avant de l'appeler
      console.log('🔍 Vérification de bot.quarantineMember:', typeof bot.quarantineMember);
      
      if (typeof bot.quarantineMember !== 'function') {
        throw new Error(`La méthode quarantineMember n'est pas disponible (type: ${typeof bot.quarantineMember})`);
      }
      
      // Appliquer la quarantaine de test
      await bot.quarantineMember(member, 'TEST', testDetails);

      // Attendre un moment pour que tout se mette en place
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Vérifier que les canaux ont été créés
      const quarantineInfo = await bot.getQuarantineInfo(member);
      
      let testResult = `✅ **Test de quarantaine réussi !**\n\n`;
      testResult += `**Membre testé :** ${member.user.tag}\n`;
      testResult += `**Étapes accomplies :**\n`;
      testResult += `• ✅ Rôle de quarantaine appliqué\n`;
      
      if (quarantineInfo && quarantineInfo.textChannelId) {
        testResult += `• ✅ Canal texte créé : <#${quarantineInfo.textChannelId}>\n`;
      }
      
      if (quarantineInfo && quarantineInfo.voiceChannelId) {
        testResult += `• ✅ Canal vocal créé : <#${quarantineInfo.voiceChannelId}>\n`;
      }
      
      testResult += `• ✅ Permissions configurées\n`;
      testResult += `• ✅ Message de bienvenue envoyé\n`;
      testResult += `• ✅ Notification admin envoyée\n\n`;
      testResult += `🔄 **Libération automatique dans 30 secondes...**`;

      await interaction.editReply({ content: testResult });

      // Attendre 30 secondes puis libérer automatiquement
      setTimeout(async () => {
        try {
          await bot.grantAccess(member, 'Fin du test automatique');
          
          // Notifier que le test est terminé
          try {
            await interaction.followUp({
              content: `🎉 **Test terminé !**\n\n` +
                       `${member.user.tag} a été automatiquement libéré de la quarantaine de test.\n` +
                       `Tous les canaux ont été nettoyés et l'accès a été restauré.`,
              ephemeral: true
            });
          } catch {}
        } catch (error) {
          console.error('Erreur libération automatique test:', error);
          try {
            await interaction.followUp({
              content: `⚠️ **Erreur lors de la libération automatique**\n\n` +
                       `Veuillez libérer manuellement ${member.user.tag} avec :\n` +
                       `\`/quarantaine liberer membre:${member.user.tag} raison:Fin du test\``,
              ephemeral: true
            });
          } catch {}
        }
      }, 30000);

    } catch (error) {
      console.error('Erreur test quarantaine:', error);
      return interaction.editReply({
        content: `❌ **Erreur lors du test de quarantaine**\n\n` +
                 `**Erreur :** ${error.message}\n\n` +
                 `Vérifiez que le bot a les permissions nécessaires :\n` +
                 `• Gérer les rôles\n` +
                 `• Gérer les canaux\n` +
                 `• Gérer les permissions`
      });
    }
  }
};