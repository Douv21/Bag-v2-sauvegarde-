const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('securite')
    .setDescription('Analyser le niveau de risque sécuritaire d\'un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre à analyser').setRequired(true))
    .addBooleanOption(o => o.setName('detaille').setDescription('Affichage détaillé des indicateurs').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers.toString()),

  cooldown: 10,

  async execute(interaction) {
    // Vérifier les permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ Réservé aux modérateurs.', flags: 64 });
    }

    const user = interaction.options.getUser('membre', true);
    const detailed = interaction.options.getBoolean('detaille') || false;
    const mod = interaction.client.moderationManager;

    if (!mod) {
      return interaction.reply({ content: '❌ Système de modération non disponible.', flags: 64 });
    }

    // Déférer la réponse car l'analyse peut prendre du temps
    await interaction.deferReply({ ephemeral: true });

    try {
      // Analyser la sécurité du membre
      const analysis = await mod.analyzeUserSecurity(interaction.guild, user);
      const raidCheck = await mod.checkRaidIndicators(interaction.guild, user);
      const multiAccountCheck = await mod.detectMultiAccounts(interaction.guild, user);
      const genderInfo = await mod.analyzeGenderInfo(user);

      // Couleurs selon le niveau de risque
      const colors = {
        LOW: 0x51cf66,      // Vert
        MEDIUM: 0xffd43b,   // Jaune
        HIGH: 0xff922b,     // Orange
        CRITICAL: 0xff6b6b, // Rouge
        UNKNOWN: 0x6c757d   // Gris
      };

      // Emojis selon le niveau de risque
      const riskEmojis = {
        LOW: '✅',
        MEDIUM: '⚠️',
        HIGH: '🚨',
        CRITICAL: '🔴',
        UNKNOWN: '❓'
      };

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Analyse de sécurité - ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setColor(colors[analysis.riskLevel])
        .setTimestamp();

      // Résumé du niveau de risque
      embed.addFields({
        name: `${riskEmojis[analysis.riskLevel]} Niveau de risque`,
        value: `**${analysis.riskLevel}** (Score: ${analysis.riskScore}/100)`,
        inline: true
      });

      // Informations du compte
      embed.addFields({
        name: '👤 Informations du compte',
        value: `**Créé le :** ${analysis.details.accountAge?.created || 'Inconnu'}\n` +
               `**Âge :** ${analysis.details.accountAge?.days || 0} jour(s)\n` +
               `**Avatar :** ${user.avatar ? '✅ Personnalisé' : '❌ Par défaut'}`,
        inline: true
      });

      // Informations du serveur
      if (analysis.details.serverJoin) {
        embed.addFields({
          name: '🏠 Sur ce serveur',
          value: `**Rejoint le :** ${analysis.details.serverJoin.joined}\n` +
                 `**Depuis :** ${analysis.details.serverJoin.days} jour(s)`,
          inline: true
        });
      }

      // Informations sur le genre détecté
      if (genderInfo.detected !== 'UNKNOWN') {
        const genderEmojis = {
          MALE: '👨',
          FEMALE: '👩',
          NON_BINARY: '🧑'
        };
        
        const genderNames = {
          MALE: 'Masculin',
          FEMALE: 'Féminin',
          NON_BINARY: 'Non-binaire'
        };

        embed.addFields({
          name: '👤 Genre détecté',
          value: `${genderEmojis[genderInfo.detected]} **${genderNames[genderInfo.detected]}**\n` +
                 `**Confiance :** ${genderInfo.confidence}%\n` +
                 `**Source :** ${genderInfo.sources.join(', ') || 'Analyse automatique'}`,
          inline: true
        });
      }

      // Drapeaux de risque
      if (analysis.flags.length > 0) {
        const flagsText = analysis.flags.slice(0, 10).join('\n');
        embed.addFields({
          name: '🚩 Indicateurs de risque',
          value: flagsText.slice(0, 1024),
          inline: false
        });
      }

      // Détection de multi-comptes
      if (multiAccountCheck.totalSuspects > 0) {
        let multiText = `**${multiAccountCheck.totalSuspects} compte(s) suspect(s) détecté(s)**\n`;
        multiText += `**Confiance :** ${multiAccountCheck.confidence}%\n\n`;
        
        // Afficher les 3 comptes les plus suspects
        const topSuspects = multiAccountCheck.suspiciousAccounts.slice(0, 3);
        for (const suspect of topSuspects) {
          multiText += `👤 **${suspect.user.tag}** (${suspect.similarity}%)\n`;
          multiText += `└ ${suspect.reasons.slice(0, 2).join(', ')}\n`;
        }

        if (multiAccountCheck.totalSuspects > 3) {
          multiText += `\n*Et ${multiAccountCheck.totalSuspects - 3} autre(s)...*`;
        }

        embed.addFields({
          name: '🔍 Multi-comptes détectés',
          value: multiText.slice(0, 1024),
          inline: false
        });
      }

      // Vérification anti-raid
      if (raidCheck.isRaidSuspect) {
        embed.addFields({
          name: '🚨 Alerte Anti-Raid',
          value: `**Confiance :** ${raidCheck.confidence}%\n` +
                 `**Raisons :** ${raidCheck.reasons.join(', ')}`,
          inline: false
        });
      }

      // Historique de modération (résumé)
      if (analysis.details.moderationStats) {
        const stats = analysis.details.moderationStats;
        embed.addFields({
          name: '📊 Historique cross-serveur',
          value: `🔨 Bans: ${stats.bans} | 👢 Kicks: ${stats.kicks} | ⚠️ Warns: ${stats.warns} | 🔇 Mutes: ${stats.mutes}`,
          inline: false
        });
      }

      // Historique audit log du serveur
      if (analysis.details.auditHistory) {
        const audit = analysis.details.auditHistory;
        const auditTotal = audit.bans.length + audit.kicks.length + audit.mutes.length;
        if (auditTotal > 0) {
          embed.addFields({
            name: '🏛️ Historique serveur actuel',
            value: `🔨 Bans: ${audit.bans.length} | 👢 Kicks: ${audit.kicks.length} | 🔇 Mutes: ${audit.mutes.length}`,
            inline: false
          });
        }
      }

      // Recommandations
      if (analysis.recommendations.length > 0) {
        embed.addFields({
          name: '💡 Recommandations',
          value: analysis.recommendations.join('\n'),
          inline: false
        });
      }

      // Affichage détaillé si demandé
      if (detailed && analysis.details.globalHistory?.length > 0) {
        let detailText = '';
        const recentActions = analysis.details.globalHistory
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5);

        for (const action of recentActions) {
          const date = new Date(action.timestamp).toLocaleDateString('fr-FR');
          detailText += `• **${action.type.toUpperCase()}** (${date}) - ${action.guildName}\n`;
          detailText += `  Raison: ${action.reason}\n`;
        }

        if (detailText) {
          embed.addFields({
            name: '📋 Détails récents (5 derniers)',
            value: detailText.slice(0, 1024),
            inline: false
          });
        }
      }

      // Actions rapides selon le niveau de risque
      let quickActions = '';
      switch (analysis.riskLevel) {
        case 'CRITICAL':
          quickActions = '🚨 **Actions suggérées :** `/ban`, `/kick`, surveillance immédiate';
          break;
        case 'HIGH':
          quickActions = '⚠️ **Actions suggérées :** `/warn`, surveillance renforcée, limitation des permissions';
          break;
        case 'MEDIUM':
          quickActions = '👀 **Actions suggérées :** Surveillance normale, vérification périodique';
          break;
        case 'LOW':
          quickActions = '✅ **Statut :** Membre semble fiable, aucune action nécessaire';
          break;
        default:
          quickActions = '❓ **Statut :** Analyse incomplète, réessayer';
      }

      embed.addFields({
        name: '⚡ Actions rapides',
        value: quickActions,
        inline: false
      });

      // Footer avec informations techniques
      embed.setFooter({
        text: `Analyse basée sur: Âge du compte, historique modération, audit log Discord • Score: ${analysis.riskScore}/100`
      });

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erreur lors de l\'analyse de sécurité:', error);
      return interaction.editReply({ 
        content: '❌ Erreur lors de l\'analyse de sécurité. Réessayez plus tard.' 
      });
    }
  }
};