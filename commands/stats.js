
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Statistiques du bot'),

    async execute(interaction, dataManager) {
        try {
            const stats = await dataManager.getStats();
            
            const embed = new EmbedBuilder()
                .setColor('#9C27B0')
                .setTitle('📊 Statistiques Bot')
                .addFields([
                    {
                        name: '👥 Utilisateurs',
                        value: `${stats.totalUsers}`,
                        inline: true
                    },
                    {
                        name: '💭 Confessions',
                        value: `${stats.totalConfessions}`,
                        inline: true
                    },
                    {
                        name: '⚡ Uptime',
                        value: `${Math.floor(stats.uptime / 3600)}h ${Math.floor((stats.uptime % 3600) / 60)}m`,
                        inline: true
                    },
                    {
                        name: '🔧 Mémoire',
                        value: `${Math.round(stats.memory.used / 1024 / 1024)}MB`,
                        inline: true
                    },
                    {
                        name: '🌐 Serveurs',
                        value: `${interaction.client.guilds.cache.size}`,
                        inline: true
                    },
                    {
                        name: '⚙️ Commandes',
                        value: `${interaction.client.commands.size}`,
                        inline: true
                    }
                ])
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });

        } catch (error) {
            console.error('❌ Erreur stats:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};