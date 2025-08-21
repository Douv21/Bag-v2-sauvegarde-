const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const QuarantineChannelManager = require('../handlers/QuarantineChannelManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test-isolation')
    .setDescription('Tester l\'isolation complète du système de quarantaine')
    .addSubcommand(subcommand =>
      subcommand
        .setName('membre')
        .setDescription('Tester l\'isolation d\'un membre spécifique en quarantaine')
        .addUserOption(o => o.setName('membre').setDescription('Membre en quarantaine à tester').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('systeme')
        .setDescription('Tester l\'ensemble du système de quarantaine'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('permissions')
        .setDescription('Tester les permissions sur tous les canaux')
        .addRoleOption(o => o.setName('role').setDescription('Rôle de quarantaine à tester (optionnel)')))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 15,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', ephemeral: true });
    }

    const mod = interaction.client.moderationManager;
    if (!mod) {
      return interaction.reply({ content: '❌ Système de modération non disponible.', ephemeral: true });
    }

    this.quarantineManager = new QuarantineChannelManager(mod);
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'membre':
          await this.testMemberIsolation(interaction);
          break;
        case 'systeme':
          await this.testSystemIntegrity(interaction);
          break;
        case 'permissions':
          await this.testPermissions(interaction);
          break;
      }
    } catch (error) {
      console.error('Erreur test isolation:', error);
      return interaction.reply({ content: '❌ Erreur lors du test d\'isolation.', ephemeral: true });
    }
  },

  async testMemberIsolation(interaction) {
    const member = interaction.options.getMember('membre');

    if (!member) {
      return interaction.reply({ content: '❌ Membre introuvable sur ce serveur.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Vérifier si le membre est en quarantaine
      const config = await this.quarantineManager.moderationManager.getSecurityConfig(interaction.guild.id);
      const quarantineRoleId = config.accessControl?.quarantineRoleId;

      if (!quarantineRoleId) {
        return interaction.editReply({
          content: '❌ **Système de quarantaine non configuré**\n\nConfigurez d\'abord avec `/config-verif quarantaine`'
        });
      }

      const isQuarantined = member.roles.cache.has(quarantineRoleId);
      if (!isQuarantined) {
        return interaction.editReply({
          content: `❌ **${member.user.tag} n'est pas en quarantaine**\n\nCe test ne peut être effectué que sur un membre actuellement en quarantaine.`
        });
      }

      console.log(`🧪 Test d'isolation pour ${member.user.tag}`);

      // Effectuer le test complet
      const report = await this.quarantineManager.verifyAndFixQuarantineIsolation(member);

      // Analyser les résultats
      const isolationScore = report.restrictedChannels / (report.restrictedChannels + report.accessibleChannels) * 100;
      const isolationStatus = isolationScore === 100 ? '✅ Parfaite' : 
                             isolationScore >= 90 ? '⚠️ Bonne' : 
                             isolationScore >= 70 ? '⚠️ Partielle' : '❌ Insuffisante';

      const embed = new EmbedBuilder()
        .setTitle('🧪 Test d\'isolation - Résultats détaillés')
        .setDescription(`Test d'isolation pour **${member.user.tag}**`)
        .setColor(isolationScore === 100 ? 0x51cf66 : isolationScore >= 70 ? 0xff922b : 0xff6b6b)
        .addFields(
          {
            name: '📊 Score d\'isolation',
            value: `**${isolationScore.toFixed(1)}%** - ${isolationStatus}`,
            inline: true
          },
          {
            name: '🔒 Canaux restreints',
            value: `${report.restrictedChannels}`,
            inline: true
          },
          {
            name: '⚠️ Canaux accessibles',
            value: `${report.accessibleChannels}`,
            inline: true
          },
          {
            name: '🔧 Configuration effectuée',
            value: `**Configurés :** ${report.stats.configured}\n` +
                   `**Ignorés :** ${report.stats.skipped}\n` +
                   `**Erreurs :** ${report.stats.errors}`,
            inline: false
          }
        )
        .setTimestamp();

      // Détails des canaux accessibles si il y en a
      if (report.accessibleChannels > 0) {
        let accessDetails = '';
        for (const channel of report.accessibleChannelsList) {
          accessDetails += `• **${channel.name}** (Type: ${channel.type})\n`;
        }
        if (report.accessibleChannels > report.accessibleChannelsList.length) {
          accessDetails += `• Et ${report.accessibleChannels - report.accessibleChannelsList.length} autres...\n`;
        }

        embed.addFields({
          name: '⚠️ Canaux encore accessibles',
          value: accessDetails || 'Aucun détail disponible',
          inline: false
        });
      }

      // Recommandations
      let recommendations = [];
      if (isolationScore < 100) {
        recommendations.push('• Vérifiez les permissions spéciales sur les canaux accessibles');
        recommendations.push('• Relancez `/quarantaine configurer-permissions`');
        recommendations.push('• Vérifiez si le membre a d\'autres rôles avec permissions');
      }
      if (report.stats.errors > 0) {
        recommendations.push('• Consultez les logs pour les erreurs de permissions');
        recommendations.push('• Vérifiez les permissions du bot sur les canaux en erreur');
      }
      if (recommendations.length === 0) {
        recommendations.push('✅ L\'isolation est parfaite, aucune action requise');
      }

      embed.addFields({
        name: '💡 Recommandations',
        value: recommendations.join('\n'),
        inline: false
      });

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erreur test isolation membre:', error);
      return interaction.editReply({
        content: `❌ **Erreur lors du test**\n\n${error.message}`
      });
    }
  },

  async testSystemIntegrity(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const config = await this.quarantineManager.moderationManager.getSecurityConfig(interaction.guild.id);
      const guild = interaction.guild;

      console.log('🧪 Test d\'intégrité du système de quarantaine');

      // Tests de base
      const tests = {
        systemEnabled: config.enabled,
        quarantineRoleConfigured: !!config.accessControl?.quarantineRoleId,
        quarantineRoleExists: false,
        verifiedRoleConfigured: !!config.accessControl?.verifiedRoleId,
        alertChannelConfigured: !!config.autoAlerts?.alertChannelId,
        moderatorRoleConfigured: !!config.autoAlerts?.moderatorRoleId,
        autoVerificationEnabled: config.autoVerification?.enabled,
        quarantineCategory: false,
        activeQuarantines: 0,
        orphanedChannels: 0,
        permissionsCoverage: 0
      };

      // Vérifier l'existence du rôle
      if (tests.quarantineRoleConfigured) {
        const quarantineRole = guild.roles.cache.get(config.accessControl.quarantineRoleId);
        tests.quarantineRoleExists = !!quarantineRole;

        if (quarantineRole) {
          // Tester les permissions sur un échantillon de canaux
          const testChannels = guild.channels.cache
            .filter(c => [0, 2].includes(c.type) && !c.name.toLowerCase().includes('quarantaine'))
            .first(20);

          let configuredCount = 0;
          for (const channel of testChannels.values()) {
            try {
              const overwrite = channel.permissionOverwrites.cache.get(quarantineRole.id);
              if (overwrite && overwrite.deny.has(PermissionFlagsBits.ViewChannel)) {
                configuredCount++;
              }
            } catch {}
          }
          tests.permissionsCoverage = testChannels.size > 0 ? (configuredCount / testChannels.size) * 100 : 0;
        }
      }

      // Vérifier la catégorie de quarantaine
      const quarantineCategory = guild.channels.cache.find(
        c => c.type === 4 && c.name.toLowerCase().includes('quarantaine')
      );
      tests.quarantineCategory = !!quarantineCategory;

      // Compter les quarantaines actives
      const quarantinedMembers = await this.quarantineManager.listQuarantinedMembers(guild);
      tests.activeQuarantines = quarantinedMembers.length;

      // Compter les canaux orphelins
      if (quarantineCategory) {
        const quarantineChannels = quarantineCategory.children.cache.size;
        tests.orphanedChannels = Math.max(0, quarantineChannels - tests.activeQuarantines * 2);
      }

      // Calculer le score global
      const criticalTests = [
        tests.systemEnabled,
        tests.quarantineRoleConfigured,
        tests.quarantineRoleExists
      ];
      const optionalTests = [
        tests.verifiedRoleConfigured,
        tests.alertChannelConfigured,
        tests.moderatorRoleConfigured,
        tests.autoVerificationEnabled,
        tests.quarantineCategory,
        tests.permissionsCoverage >= 90
      ];

      const criticalScore = criticalTests.filter(Boolean).length / criticalTests.length * 100;
      const optionalScore = optionalTests.filter(Boolean).length / optionalTests.length * 100;
      const globalScore = (criticalScore * 0.7 + optionalScore * 0.3);

      const embed = new EmbedBuilder()
        .setTitle('🧪 Test d\'intégrité du système')
        .setDescription(`Analyse complète du système de quarantaine`)
        .setColor(globalScore >= 90 ? 0x51cf66 : globalScore >= 70 ? 0xff922b : 0xff6b6b)
        .addFields(
          {
            name: '📊 Score global',
            value: `**${globalScore.toFixed(1)}%** - ${globalScore >= 90 ? '✅ Excellent' : globalScore >= 70 ? '⚠️ Bon' : '❌ Insuffisant'}`,
            inline: true
          },
          {
            name: '🔧 Tests critiques',
            value: `**${criticalScore.toFixed(0)}%** (${criticalTests.filter(Boolean).length}/${criticalTests.length})`,
            inline: true
          },
          {
            name: '⭐ Tests optionnels',
            value: `**${optionalScore.toFixed(0)}%** (${optionalTests.filter(Boolean).length}/${optionalTests.length})`,
            inline: true
          }
        );

      // Détails des tests
      embed.addFields({
        name: '🔍 Tests critiques',
        value: `${tests.systemEnabled ? '✅' : '❌'} Système activé\n` +
               `${tests.quarantineRoleConfigured ? '✅' : '❌'} Rôle de quarantaine configuré\n` +
               `${tests.quarantineRoleExists ? '✅' : '❌'} Rôle de quarantaine existant`,
        inline: true
      });

      embed.addFields({
        name: '⚙️ Configuration optionnelle',
        value: `${tests.verifiedRoleConfigured ? '✅' : '❌'} Rôle vérifié\n` +
               `${tests.alertChannelConfigured ? '✅' : '❌'} Canal d'alertes\n` +
               `${tests.moderatorRoleConfigured ? '✅' : '❌'} Rôle modérateur\n` +
               `${tests.autoVerificationEnabled ? '✅' : '❌'} Vérification auto`,
        inline: true
      });

      embed.addFields({
        name: '📊 État actuel',
        value: `**Quarantaines actives :** ${tests.activeQuarantines}\n` +
               `**Catégorie présente :** ${tests.quarantineCategory ? '✅' : '❌'}\n` +
               `**Canaux orphelins :** ${tests.orphanedChannels}\n` +
               `**Couverture permissions :** ${tests.permissionsCoverage.toFixed(1)}%`,
        inline: false
      });

      // Recommandations
      let recommendations = [];
      if (!tests.systemEnabled) recommendations.push('• Activez le système avec `/config-verif activer`');
      if (!tests.quarantineRoleConfigured) recommendations.push('• Configurez le rôle avec `/config-verif quarantaine`');
      if (!tests.quarantineRoleExists) recommendations.push('• Recréez le rôle de quarantaine');
      if (tests.permissionsCoverage < 90) recommendations.push('• Reconfigurez les permissions avec `/quarantaine configurer-permissions`');
      if (tests.orphanedChannels > 0) recommendations.push('• Nettoyez les canaux orphelins avec `/quarantaine nettoyer`');
      if (!tests.alertChannelConfigured) recommendations.push('• Configurez les alertes avec `/config-verif admins`');

      if (recommendations.length === 0) {
        recommendations.push('✅ Le système est optimal, aucune action requise');
      }

      embed.addFields({
        name: '💡 Recommandations',
        value: recommendations.slice(0, 8).join('\n'),
        inline: false
      });

      embed.setTimestamp();

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erreur test système:', error);
      return interaction.editReply({
        content: `❌ **Erreur lors du test système**\n\n${error.message}`
      });
    }
  },

  async testPermissions(interaction) {
    const testRole = interaction.options.getRole('role');
    
    await interaction.deferReply({ ephemeral: true });

    try {
      const config = await this.quarantineManager.moderationManager.getSecurityConfig(interaction.guild.id);
      const guild = interaction.guild;

      // Déterminer le rôle à tester
      let quarantineRole = testRole;
      if (!quarantineRole && config.accessControl?.quarantineRoleId) {
        quarantineRole = guild.roles.cache.get(config.accessControl.quarantineRoleId);
      }

      if (!quarantineRole) {
        return interaction.editReply({
          content: '❌ **Aucun rôle de quarantaine à tester**\n\nSpécifiez un rôle ou configurez le système avec `/config-verif quarantaine`'
        });
      }

      console.log(`🧪 Test des permissions pour le rôle ${quarantineRole.name}`);

      // Analyser tous les canaux
      const allChannels = guild.channels.cache.filter(channel => {
        return [0, 2, 4, 5, 13, 15].includes(channel.type) && // Types de canaux supportés
               !channel.name.toLowerCase().includes('quarantaine'); // Exclure quarantaine
      });

      const results = {
        total: allChannels.size,
        configured: 0,
        missing: 0,
        errors: 0,
        details: []
      };

      for (const channel of allChannels.values()) {
        try {
          const overwrite = channel.permissionOverwrites.cache.get(quarantineRole.id);
          const hasRestriction = overwrite && overwrite.deny.has(PermissionFlagsBits.ViewChannel);
          
          if (hasRestriction) {
            results.configured++;
          } else {
            results.missing++;
            results.details.push({
              name: channel.name,
              type: channel.type,
              parent: channel.parent?.name || 'Aucune catégorie',
              reason: !overwrite ? 'Aucune permission configurée' : 'Permission ViewChannel non refusée'
            });
          }
        } catch (error) {
          results.errors++;
          results.details.push({
            name: channel.name,
            type: channel.type,
            parent: channel.parent?.name || 'Aucune catégorie',
            reason: `Erreur: ${error.message}`
          });
        }
      }

      const coveragePercent = results.total > 0 ? (results.configured / results.total) * 100 : 0;

      const embed = new EmbedBuilder()
        .setTitle('🧪 Test des permissions - Analyse détaillée')
        .setDescription(`Test des permissions pour le rôle **${quarantineRole.name}**`)
        .setColor(coveragePercent === 100 ? 0x51cf66 : coveragePercent >= 90 ? 0xff922b : 0xff6b6b)
        .addFields(
          {
            name: '📊 Résumé',
            value: `**Couverture :** ${coveragePercent.toFixed(1)}%\n` +
                   `**Canaux testés :** ${results.total}\n` +
                   `**Correctement configurés :** ${results.configured}\n` +
                   `**Non configurés :** ${results.missing}\n` +
                   `**Erreurs :** ${results.errors}`,
            inline: false
          }
        );

      // Détails des problèmes
      if (results.missing > 0 || results.errors > 0) {
        let problemDetails = '';
        const problemChannels = results.details.slice(0, 10);
        
        for (const detail of problemChannels) {
          problemDetails += `• **${detail.name}** (${detail.parent})\n  ${detail.reason}\n`;
        }
        
        if (results.details.length > 10) {
          problemDetails += `\n*Et ${results.details.length - 10} autres problèmes...*`;
        }

        embed.addFields({
          name: '⚠️ Canaux problématiques',
          value: problemDetails || 'Aucun détail disponible',
          inline: false
        });
      }

      // Actions recommandées
      let actions = [];
      if (results.missing > 0) {
        actions.push('• Exécutez `/quarantaine configurer-permissions` pour corriger');
      }
      if (results.errors > 0) {
        actions.push('• Vérifiez les permissions du bot sur les canaux en erreur');
      }
      if (coveragePercent < 100) {
        actions.push('• Vérifiez manuellement les canaux non configurés');
      }
      if (actions.length === 0) {
        actions.push('✅ Toutes les permissions sont correctement configurées');
      }

      embed.addFields({
        name: '💡 Actions recommandées',
        value: actions.join('\n'),
        inline: false
      });

      embed.setTimestamp();

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erreur test permissions:', error);
      return interaction.editReply({
        content: `❌ **Erreur lors du test des permissions**\n\n${error.message}`
      });
    }
  }
};