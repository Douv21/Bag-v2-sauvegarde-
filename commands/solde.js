const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('solde')
        .setDescription('Voir votre solde et karma rapidement'),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            const users = await dataManager.getData('users');
            const userKey = `${userId}_${guildId}`;
            const userData = users[userKey] || { 
                balance: 0, 
                karmaGood: 0, 
                karmaBad: 0 
            };
            
            const karmaNet = (userData.karmaGood || 0) - (userData.karmaBad || 0);
            
            // Déterminer le statut moral
            let moralIcon = '';
            if (karmaNet > 10) moralIcon = '😇';
            else if (karmaNet > 0) moralIcon = '😇';
            else if (karmaNet === 0) moralIcon = '😐';
            else if (karmaNet > -10) moralIcon = '😈';
            else moralIcon = '😈';

            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('💳 Solde Express')
                .setDescription(`Solde de ${interaction.user.username}`)
                .addFields([
                    {
                        name: '💰 Argent',
                        value: `**${userData.balance}€**`,
                        inline: true
                    },
                    {
                        name: '⚖️ Karma Net',
                        value: `${moralIcon} ${karmaNet > 0 ? '+' : ''}${karmaNet}`,
                        inline: true
                    },
                    {
                        name: '📊 Détails',
                        value: `😇 ${userData.karmaGood || 0} | 😈 ${userData.karmaBad || 0}`,
                        inline: true
                    }
                ])
                .setFooter({ text: 'Utilisez /economie pour plus de détails' });

            await interaction.reply({ embeds: [embed], flags: 64 });

        } catch (error) {
            console.error('❌ Erreur solde:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};