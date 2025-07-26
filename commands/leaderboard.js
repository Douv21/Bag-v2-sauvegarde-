const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const levelManager = require('../utils/levelManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Afficher le classement des niveaux du serveur')
        .addIntegerOption(option =>
            option.setName('limite')
                .setDescription('Nombre d\'utilisateurs à afficher (défaut: 10, max: 25)')
                .setMinValue(5)
                .setMaxValue(25)
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply();
            
            const limit = interaction.options.getInteger('limite') || 10;
            const topUsers = levelManager.getTopUsers(interaction.guild.id, limit);
            
            if (topUsers.length === 0) {
                return await interaction.editReply({
                    content: '📊 Aucun utilisateur avec de l\'XP trouvé sur ce serveur.'
                });
            }
            
            const embed = new EmbedBuilder()
                .setTitle('🏆 Classement des Niveaux')
                .setDescription(`Top ${topUsers.length} des utilisateurs avec le plus d'XP`)
                .setColor('#FFD700')
                .setTimestamp();
            
            let leaderboardText = '';
            
            for (let i = 0; i < topUsers.length; i++) {
                const user = topUsers[i];
                let medal = '';
                
                if (i === 0) medal = '🥇';
                else if (i === 1) medal = '🥈';
                else if (i === 2) medal = '🥉';
                else medal = `${i + 1}.`;
                
                try {
                    const discordUser = await interaction.guild.members.fetch(user.userId);
                    const username = discordUser.user.username;
                    
                    leaderboardText += `${medal} **${username}**\n`;
                    leaderboardText += `    Niveau **${user.level}** • ${user.xp.toLocaleString()} XP\n`;
                    leaderboardText += `    📝 ${user.totalMessages || 0} msgs • 🎤 ${Math.floor((user.totalVoiceTime || 0) / 60000)}min\n\n`;
                } catch (error) {
                    // Utilisateur non trouvé, l'ignorer
                    continue;
                }
            }
            
            if (leaderboardText.length > 4096) {
                leaderboardText = leaderboardText.substring(0, 4000) + '\n...(tronqué)';
            }
            
            embed.setDescription(leaderboardText || 'Aucun utilisateur valide trouvé.');
            
            // Ajouter des statistiques globales
            const stats = levelManager.getGuildStats(interaction.guild.id);
            embed.addFields({
                name: '📊 Statistiques du Serveur',
                value: `👥 **${stats.totalUsers}** utilisateurs actifs\n📈 **${Math.round(stats.avgLevel)}** niveau moyen\n💬 **${stats.totalMessages.toLocaleString()}** messages total\n⚡ **${stats.totalXP.toLocaleString()}** XP distribué`,
                inline: false
            });
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Erreur commande leaderboard:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de l\'affichage du classement.',
                embeds: []
            });
        }
    }
};