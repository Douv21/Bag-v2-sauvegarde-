
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economie')
        .setDescription('Voir votre profil économique'),

    async execute(interaction, dataManager) {
        try {
            const user = await dataManager.getUser(interaction.user.id, interaction.guild.id);
            
            const level = Math.floor(user.xp / 1000);
            const nextLevelXP = (level + 1) * 1000;
            const xpProgress = user.xp - (level * 1000);

            // Calculer niveau de karma
            const karmaBalance = user.goodKarma - user.badKarma;
            let karmaLevel = 'Neutre';
            if (karmaBalance >= 50) karmaLevel = 'Saint 😇';
            else if (karmaBalance >= 20) karmaLevel = 'Bon 😊';
            else if (karmaBalance <= -50) karmaLevel = 'Diabolique 😈';
            else if (karmaBalance <= -20) karmaLevel = 'Mauvais 😠';

            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle(`💼 Profil Économique - ${interaction.user.displayName}`)
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields([
                    {
                        name: '💰 Solde',
                        value: `${user.balance}€`,
                        inline: true
                    },
                    {
                        name: '📊 Niveau',
                        value: `Niveau ${level}`,
                        inline: true
                    },
                    {
                        name: '⭐ XP',
                        value: `${xpProgress}/${1000} (${user.xp} total)`,
                        inline: true
                    },
                    {
                        name: '😇 Karma Bon',
                        value: `${user.goodKarma}`,
                        inline: true
                    },
                    {
                        name: '😈 Karma Mauvais',
                        value: `${user.badKarma}`,
                        inline: true
                    },
                    {
                        name: '⚖️ Niveau Karma',
                        value: karmaLevel,
                        inline: true
                    },
                    {
                        name: '💬 Messages',
                        value: `${user.messageCount}`,
                        inline: true
                    },
                    {
                        name: '🎁 Streak Daily',
                        value: `${user.dailyStreak} jours`,
                        inline: true
                    }
                ])
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });

        } catch (error) {
            console.error('❌ Erreur économie:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};