const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('historique')
    .setDescription('Afficher l\'historique de modération d\'un membre sur tous les serveurs')
    .addUserOption(o => o.setName('membre').setDescription('Membre à vérifier').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 5,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }

    const user = interaction.options.getUser('membre', true);
    const mod = interaction.client.moderationManager;

    if (!mod) {
      return interaction.reply({ content: '❌ Système de modération non disponible.', flags: 64 });
    }

    try {
      // Récupérer l'historique global (cross-serveur du bot)
      const globalHistory = await mod.getGlobalModerationHistory(user.id);
      
      // Récupérer les warnings locaux du serveur actuel
      const localWarnings = await mod.getWarnings(interaction.guild.id, user.id);
      
      // Récupérer l'historique via Discord Audit Log (toutes actions sur ce serveur)
      const auditHistory = await mod.getDiscordAuditHistory(interaction.guild, user.id);

      // Calculer le total d'actions pour la couleur
      const totalActions = globalHistory.length + auditHistory.bans.length + auditHistory.kicks.length + auditHistory.mutes.length;
      
      // Créer l'embed de réponse
      const embed = new EmbedBuilder()
        .setTitle(`📋 Historique de modération - ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setColor(totalActions > 0 ? 0xff6b6b : 0x51cf66)
        .setTimestamp();

      // Section historique cross-serveur
      if (globalHistory.length > 0) {
        // Trier par timestamp décroissant (plus récent en premier)
        const sortedHistory = globalHistory.sort((a, b) => b.timestamp - a.timestamp);
        
        // Grouper par type d'action
        const groupedHistory = {
          ban: sortedHistory.filter(h => h.type === 'ban'),
          kick: sortedHistory.filter(h => h.type === 'kick'),
          mute: sortedHistory.filter(h => h.type === 'mute'),
          warn: sortedHistory.filter(h => h.type === 'warn')
        };

        let historyText = '';
        
        // Afficher les statistiques
        const totalActions = globalHistory.length;
        const uniqueServers = [...new Set(globalHistory.map(h => h.guildId))].length;
        
        embed.addFields({
          name: '📊 Statistiques globales',
          value: `**Total d'actions:** ${totalActions}\n**Serveurs concernés:** ${uniqueServers}\n**Bans:** ${groupedHistory.ban.length} | **Kicks:** ${groupedHistory.kick.length} | **Mutes:** ${groupedHistory.mute.length} | **Warns:** ${groupedHistory.warn.length}`,
          inline: false
        });

        // Afficher les 10 actions les plus récentes
        const recentActions = sortedHistory.slice(0, 10);
        let recentText = '';
        
        for (const action of recentActions) {
          const date = new Date(action.timestamp);
          const dateStr = date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          
          const timeStr = date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          });

          const emoji = {
            ban: '🔨',
            kick: '👢',
            mute: '🔇',
            warn: '⚠️'
          }[action.type] || '❓';

          const moderator = action.moderatorId ? `<@${action.moderatorId}>` : 'Système';
          
          recentText += `${emoji} **${action.type.toUpperCase()}** - ${dateStr} ${timeStr}\n`;
          recentText += `📍 **Serveur:** ${action.guildName}\n`;
          recentText += `👮 **Modérateur:** ${moderator}\n`;
          recentText += `📝 **Raison:** ${action.reason}\n\n`;
        }

        if (recentText) {
          embed.addFields({
            name: `🕒 Actions récentes (${Math.min(recentActions.length, 10)} sur ${totalActions})`,
            value: recentText.slice(0, 1024), // Limite Discord
            inline: false
          });
        }

        // Si il y a plus de 10 actions, indiquer qu'il y en a d'autres
        if (sortedHistory.length > 10) {
          embed.addFields({
            name: '📝 Note',
            value: `Et ${sortedHistory.length - 10} autre(s) action(s) plus ancienne(s)...`,
            inline: false
          });
        }

      } else {
        embed.addFields({
          name: '✅ Aucun historique cross-serveur',
          value: 'Ce membre n\'a aucun historique de modération enregistré sur d\'autres serveurs où ce bot est présent.',
          inline: false
        });
      }

      // Section historique Audit Log Discord (serveur actuel)
      const totalAuditActions = auditHistory.bans.length + auditHistory.kicks.length + auditHistory.mutes.length;
      
      if (totalAuditActions > 0) {
        // Combiner toutes les actions de l'audit log
        const allAuditActions = [
          ...auditHistory.bans,
          ...auditHistory.kicks,
          ...auditHistory.mutes
        ].sort((a, b) => b.timestamp - a.timestamp);

        let auditText = `**${totalAuditActions} action(s) trouvée(s) sur ce serveur (tous bots confondus):**\n\n`;
        
        // Afficher les 8 actions les plus récentes
        const recentAuditActions = allAuditActions.slice(0, 8);
        for (const action of recentAuditActions) {
          const date = new Date(action.timestamp);
          const dateStr = date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          
          const timeStr = date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          });

          const emoji = {
            ban: '🔨',
            kick: '👢',
            mute: '🔇'
          }[action.action] || '❓';

          auditText += `${emoji} **${action.action.toUpperCase()}** - ${dateStr} ${timeStr}\n`;
          auditText += `👮 **Par:** ${action.executor}\n`;
          auditText += `📝 **Raison:** ${action.reason}\n`;
          if (action.duration) {
            auditText += `⏱️ **Jusqu'à:** ${new Date(action.duration).toLocaleString('fr-FR')}\n`;
          }
          auditText += '\n';
        }

        if (allAuditActions.length > 8) {
          auditText += `*Et ${allAuditActions.length - 8} autre(s) action(s)...*`;
        }

        embed.addFields({
          name: '🏛️ Historique Discord (ce serveur)',
          value: auditText.slice(0, 1024),
          inline: false
        });

        // Statistiques audit log
        embed.addFields({
          name: '📊 Statistiques serveur actuel',
          value: `**Bans:** ${auditHistory.bans.length} | **Kicks:** ${auditHistory.kicks.length} | **Mutes:** ${auditHistory.mutes.length}`,
          inline: false
        });
      } else {
        embed.addFields({
          name: '🏛️ Historique Discord (ce serveur)',
          value: 'Aucune action de modération trouvée dans l\'Audit Log Discord pour ce membre.',
          inline: false
        });
      }

      // Section warnings locaux
      if (localWarnings.length > 0) {
        let localText = `**${localWarnings.length} warning(s) sur ce serveur:**\n\n`;
        
        const recentWarnings = localWarnings.slice(-5); // 5 plus récents
        for (const warning of recentWarnings) {
          const date = new Date(warning.timestamp);
          const dateStr = date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          
          const moderator = warning.moderatorId ? `<@${warning.moderatorId}>` : 'Inconnu';
          localText += `⚠️ ${dateStr} - **${warning.reason}** (par ${moderator})\n`;
        }

        if (localWarnings.length > 5) {
          localText += `\n*Et ${localWarnings.length - 5} autre(s) warning(s)...*`;
        }

        embed.addFields({
          name: '🏠 Warnings sur ce serveur',
          value: localText.slice(0, 1024),
          inline: false
        });
      } else {
        embed.addFields({
          name: '🏠 Warnings sur ce serveur',
          value: 'Aucun warning sur ce serveur.',
          inline: false
        });
      }

      // Footer informatif
      embed.setFooter({
        text: '🤖 Historique cross-serveur (bot) + 🏛️ Audit Log Discord (ce serveur) • Limité aux 90 derniers jours'
      });

      // Ajouter une note explicative
      if (totalActions === 0) {
        embed.addFields({
          name: 'ℹ️ Information importante',
          value: '**Limitations du système :**\n' +
                 '• **Cross-serveur :** Seulement les serveurs où ce bot est installé\n' +
                 '• **Audit Log :** Seulement ce serveur, tous bots confondus (90 jours max)\n' +
                 '• **APIs tierces :** Carl-bot, MEE6, etc. ne partagent pas leurs données',
          inline: false
        });
      } else {
        embed.addFields({
          name: 'ℹ️ Sources des données',
          value: '🤖 **Cross-serveur :** Serveurs avec ce bot\n🏛️ **Audit Log :** Actions sur ce serveur (tous bots)',
          inline: false
        });
      }

      return interaction.reply({ embeds: [embed], flags: 64 });

    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return interaction.reply({ 
        content: '❌ Erreur lors de la récupération de l\'historique de modération.', 
        flags: 64 
      });
    }
  }
};