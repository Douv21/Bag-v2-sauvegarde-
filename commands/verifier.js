const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verifier')
    .setDescription('Vérification complète de sécurité d\'un membre (risques, multi-comptes, genre, historique)')
    .addUserOption(o => o.setName('membre').setDescription('Membre à vérifier').setRequired(true))
    .addBooleanOption(o => o.setName('detaille').setDescription('Affichage détaillé de tous les indicateurs').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers.toString()),

  cooldown: 15,

  async execute(interaction) {
    // Vérifier les permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ Réservé aux modérateurs.', ephemeral: true });
    }

    const user = interaction.options.getUser('membre', true);
    const detailed = interaction.options.getBoolean('detaille') || false;
    const mod = interaction.client.moderationManager;

    if (!mod) {
      return interaction.reply({ content: '❌ Système de modération non disponible.', ephemeral: true });
    }

    // Déférer la réponse car l'analyse complète peut prendre du temps
    await interaction.deferReply({ ephemeral: false });

    try {
      // Effectuer toutes les analyses en parallèle
      const [
        securityAnalysis,
        raidCheck,
        multiAccountCheck,
        genderInfo,
        globalHistory,
        localWarnings,
        auditHistory
      ] = await Promise.all([
        mod.analyzeUserSecurity(interaction.guild, user),
        mod.checkRaidIndicators(interaction.guild, user),
        mod.detectMultiAccounts(interaction.guild, user),
        mod.analyzeGenderInfo(user),
        mod.getGlobalModerationHistory(user.id),
        mod.getWarnings(interaction.guild.id, user.id),
        mod.getDiscordAuditHistory(interaction.guild, user.id)
      ]);

      // Calculer le score de risque global (incluant multi-comptes)
      let globalRiskScore = securityAnalysis.riskScore;
      if (multiAccountCheck.confidence >= 70) {
        globalRiskScore += 25;
      } else if (multiAccountCheck.confidence >= 50) {
        globalRiskScore += 15;
      } else if (multiAccountCheck.confidence >= 30) {
        globalRiskScore += 8;
      }

      // Déterminer le niveau de risque final
      let finalRiskLevel = 'LOW';
      if (globalRiskScore >= 80) {
        finalRiskLevel = 'CRITICAL';
      } else if (globalRiskScore >= 60) {
        finalRiskLevel = 'HIGH';
      } else if (globalRiskScore >= 30) {
        finalRiskLevel = 'MEDIUM';
      }

      // Couleurs selon le niveau de risque
      const colors = {
        LOW: 0x51cf66,      // Vert
        MEDIUM: 0xffd43b,   // Jaune
        HIGH: 0xff922b,     // Orange
        CRITICAL: 0xff6b6b  // Rouge
      };

      // Emojis selon le niveau de risque
      const riskEmojis = {
        LOW: '✅',
        MEDIUM: '⚠️',
        HIGH: '🚨',
        CRITICAL: '🔴'
      };

      const embed = new EmbedBuilder()
        .setTitle(`🔍 VÉRIFICATION COMPLÈTE - ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setColor(colors[finalRiskLevel])
        .setTimestamp();

      // === RÉSUMÉ PRINCIPAL ===
      const accountAge = Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24));
      
      embed.addFields({
        name: `${riskEmojis[finalRiskLevel]} ÉVALUATION GLOBALE`,
        value: `**Niveau de risque :** ${finalRiskLevel}\n` +
               `**Score :** ${globalRiskScore}/100\n` +
               `**Âge du compte :** ${accountAge} jour(s)\n` +
               `**Multi-comptes :** ${multiAccountCheck.totalSuspects > 0 ? `🚨 ${multiAccountCheck.totalSuspects} suspect(s)` : '✅ Aucun'}\n` +
               `**Genre détecté :** ${this.getGenderDisplay(genderInfo.detected)}`,
        inline: false
      });

      // === HISTORIQUE DE MODÉRATION ===
      const totalGlobalActions = globalHistory.length;
      const totalAuditActions = auditHistory.bans.length + auditHistory.kicks.length + auditHistory.mutes.length;
      const totalWarnings = localWarnings.length;

      if (totalGlobalActions > 0 || totalAuditActions > 0 || totalWarnings > 0) {
        let historyText = '';
        
        if (totalGlobalActions > 0) {
          const bans = globalHistory.filter(h => h.type === 'ban').length;
          const kicks = globalHistory.filter(h => h.type === 'kick').length;
          const warns = globalHistory.filter(h => h.type === 'warn').length;
          const mutes = globalHistory.filter(h => h.type === 'mute').length;
          
          historyText += `🌐 **Cross-serveur :** ${bans} bans, ${kicks} kicks, ${warns} warns, ${mutes} mutes\n`;
        }
        
        if (totalAuditActions > 0) {
          historyText += `🏛️ **Ce serveur (audit log) :** ${auditHistory.bans.length} bans, ${auditHistory.kicks.length} kicks, ${auditHistory.mutes.length} mutes\n`;
        }
        
        if (totalWarnings > 0) {
          historyText += `⚠️ **Warnings locaux :** ${totalWarnings}\n`;
        }

        embed.addFields({
          name: '📊 HISTORIQUE DE MODÉRATION',
          value: historyText || 'Aucun historique trouvé',
          inline: false
        });
      }

      // === DÉTECTION MULTI-COMPTES ===
      if (multiAccountCheck.totalSuspects > 0) {
        let multiText = `🚨 **${multiAccountCheck.totalSuspects} compte(s) suspect(s)** (confiance: ${multiAccountCheck.confidence}%)\n\n`;
        
        const topSuspects = multiAccountCheck.suspiciousAccounts.slice(0, detailed ? 5 : 3);
        for (const suspect of topSuspects) {
          const suspectAge = Math.floor((Date.now() - suspect.user.createdTimestamp) / (1000 * 60 * 60 * 24));
          multiText += `👤 **${suspect.user.tag}** (${suspect.similarity}% similaire)\n`;
          multiText += `   📅 Créé il y a ${suspectAge} jour(s)\n`;
          if (detailed) {
            multiText += `   🔍 ${suspect.reasons.join(', ')}\n`;
          }
          multiText += '\n';
        }

        if (multiAccountCheck.totalSuspects > (detailed ? 5 : 3)) {
          multiText += `*Et ${multiAccountCheck.totalSuspects - (detailed ? 5 : 3)} autre(s)...*`;
        }

        embed.addFields({
          name: '🔍 MULTI-COMPTES DÉTECTÉS',
          value: multiText.slice(0, 1024),
          inline: false
        });
      }

      // === INFORMATIONS PROFIL ET GENRE ===
      let profileText = '';
      
      // Genre détaillé
      if (genderInfo.detected !== 'UNKNOWN') {
        const genderDisplay = this.getGenderDisplay(genderInfo.detected);
        profileText += `👤 **Genre :** ${genderDisplay} (${genderInfo.confidence}% confiance)\n`;
        if (detailed && genderInfo.indicators.length > 0) {
          profileText += `   🔍 Basé sur: ${genderInfo.indicators.join(', ')}\n`;
        }
        profileText += '\n';
      }
      
      // Informations compte
      profileText += `🕐 **Créé le :** ${new Date(user.createdTimestamp).toLocaleDateString('fr-FR')}\n`;
      profileText += `🖼️ **Avatar :** ${user.avatar ? '✅ Personnalisé' : '❌ Par défaut'}\n`;
      profileText += `🆔 **ID :** ${user.id}\n`;
      
      // Informations serveur
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (member) {
        const joinAge = Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24));
        profileText += `🏠 **Sur le serveur :** ${joinAge} jour(s)\n`;
        profileText += `🎭 **Rôles :** ${member.roles.cache.size - 1} (hors @everyone)\n`;
        
        // Statut de boost
        if (member.premiumSince) {
          profileText += `💎 **Boost :** Depuis le ${new Date(member.premiumSince).toLocaleDateString('fr-FR')}\n`;
        }
      }

      embed.addFields({
        name: '👤 INFORMATIONS PROFIL',
        value: profileText,
        inline: false
      });

      // === ALERTES ET DRAPEAUX ===
      const allFlags = [...securityAnalysis.flags];
      
      if (raidCheck.isRaidSuspect) {
        allFlags.push('🚨 SUSPECT DE RAID');
        allFlags.push(...raidCheck.reasons.map(r => `  └ ${r}`));
      }
      
      if (multiAccountCheck.confidence >= 50) {
        allFlags.push('🔍 MULTI-COMPTES PROBABLES');
      }

      if (allFlags.length > 0) {
        embed.addFields({
          name: '🚩 ALERTES ET DRAPEAUX',
          value: allFlags.slice(0, 15).join('\n').slice(0, 1024),
          inline: false
        });
      }

      // === RECOMMANDATIONS D'ACTIONS ===
      const recommendations = [...securityAnalysis.recommendations];
      
      if (multiAccountCheck.confidence >= 70) {
        recommendations.push('🔍 Vérifier les multi-comptes immédiatement');
        recommendations.push('🚨 Considérer un ban de tous les comptes suspects');
      } else if (multiAccountCheck.confidence >= 50) {
        recommendations.push('👀 Surveiller les comptes suspects');
      }

      if (raidCheck.isRaidSuspect) {
        recommendations.push('🛡️ Activer la protection anti-raid');
        recommendations.push('⚡ Action immédiate recommandée');
      }

      embed.addFields({
        name: '💡 RECOMMANDATIONS',
        value: recommendations.slice(0, 8).join('\n').slice(0, 1024),
        inline: false
      });

      // === ACTIONS RAPIDES ===
      let quickActions = '';
      if (finalRiskLevel === 'CRITICAL') {
        quickActions = '🚨 `/ban` • `/kick` • Surveillance immédiate • Vérifier multi-comptes';
      } else if (finalRiskLevel === 'HIGH') {
        quickActions = '⚠️ `/warn` • `/mute` • Surveillance renforcée • Limiter permissions';
      } else if (finalRiskLevel === 'MEDIUM') {
        quickActions = '👀 Surveillance normale • Vérification périodique • `/warn` si nécessaire';
      } else {
        quickActions = '✅ Aucune action nécessaire • Membre semble fiable';
      }

      embed.addFields({
        name: '⚡ ACTIONS RAPIDES',
        value: quickActions,
        inline: false
      });

      // === DÉTAILS SUPPLÉMENTAIRES (si demandé) ===
      if (detailed) {
        // Historique détaillé récent
        if (globalHistory.length > 0) {
          let detailText = '';
          const recentActions = globalHistory
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);

          for (const action of recentActions) {
            const date = new Date(action.timestamp).toLocaleDateString('fr-FR');
            const time = new Date(action.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            detailText += `• **${action.type.toUpperCase()}** (${date} ${time})\n`;
            detailText += `  🏛️ ${action.guildName}\n`;
            detailText += `  📝 ${action.reason}\n\n`;
          }

          if (detailText) {
            embed.addFields({
              name: '📋 HISTORIQUE DÉTAILLÉ (5 récents)',
              value: detailText.slice(0, 1024),
              inline: false
            });
          }
        }

        // Détails audit log
        if (auditHistory.bans.length > 0 || auditHistory.kicks.length > 0 || auditHistory.mutes.length > 0) {
          let auditText = '';
          
          // Combiner et trier les actions audit log
          const allAuditActions = [
            ...auditHistory.bans,
            ...auditHistory.kicks,
            ...auditHistory.mutes
          ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);

          for (const action of allAuditActions) {
            const date = new Date(action.timestamp).toLocaleDateString('fr-FR');
            auditText += `• **${action.action.toUpperCase()}** (${date})\n`;
            auditText += `  👮 Par: ${action.executor}\n`;
            auditText += `  📝 ${action.reason}\n\n`;
          }

          if (auditText) {
            embed.addFields({
              name: '🏛️ AUDIT LOG DÉTAILLÉ (3 récents)',
              value: auditText.slice(0, 1024),
              inline: false
            });
          }
        }
      }

      // Footer avec résumé technique
      embed.setFooter({
        text: `Score: ${globalRiskScore}/100 • Multi-comptes: ${multiAccountCheck.confidence}% • Genre: ${genderInfo.confidence}% • Analyse complète`
      });

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erreur lors de la vérification complète:', error);
      return interaction.editReply({ 
        content: '❌ Erreur lors de la vérification complète. Réessayez plus tard.' 
      });
    }
  },

  /**
   * Obtenir l'affichage du genre avec emoji
   * @param {string} gender - Genre détecté
   * @returns {string} Affichage formaté
   */
  getGenderDisplay(gender) {
    const displays = {
      MALE: '👨 Masculin',
      FEMALE: '👩 Féminin',
      NON_BINARY: '🧑 Non-binaire',
      UNKNOWN: '❓ Inconnu'
    };
    return displays[gender] || '❓ Inconnu';
  }
};