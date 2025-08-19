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
      // Récupérer l'historique global
      const globalHistory = await mod.getGlobalModerationHistory(user.id);
      
      // Récupérer les warnings locaux du serveur actuel
      const localWarnings = await mod.getWarnings(interaction.guild.id, user.id);

      // Créer l'embed de réponse
      const embed = new EmbedBuilder()
        .setTitle(`📋 Historique de modération - ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setColor(globalHistory.length > 0 ? 0xff6b6b : 0x51cf66)
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
          value: 'Ce membre n\'a aucun historique de modération enregistré sur d\'autres serveurs.',
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
        text: 'Historique cross-serveur • Données partagées entre serveurs utilisant ce bot'
      });

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