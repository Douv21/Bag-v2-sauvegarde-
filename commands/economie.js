
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economie')
        .setDescription('Voir votre profil économique')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('Utilisateur dont afficher le profil économique (optionnel)')
                .setRequired(false)
        ),

    async execute(interaction, dataManager) {
        try {
            const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
            const user = await dataManager.getUser(targetUser.id, interaction.guild.id);
            
            const level = Math.floor((user.xp || 0) / 1000);
            const nextLevelXP = (level + 1) * 1000;
            const xpProgress = (user.xp || 0) - (level * 1000);

            // Utiliser les bonnes propriétés karma (priorité aux nouvelles)
            const goodKarma = user.karmaGood || user.karma_good || 0;
            const badKarma = user.karmaBad || user.karma_bad || 0;
            
            // Calculer niveau de karma
            const karmaBalance = goodKarma - badKarma;
            let karmaLevel = 'Neutre';
            if (karmaBalance >= 50) karmaLevel = 'Saint 😇';
            else if (karmaBalance >= 20) karmaLevel = 'Bon 😊';
            else if (karmaBalance <= -50) karmaLevel = 'Diabolique 😈';
            else if (karmaBalance <= -20) karmaLevel = 'Mauvais 😠';

            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle(`💼 Profil Économique - ${targetUser.displayName}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields([
                    {
                        name: '💰 Solde',
                        value: `${user.balance || 1000}€`,
                        inline: true
                    },
                    {
                        name: '📊 Niveau',
                        value: `Niveau ${level}`,
                        inline: true
                    },
                    {
                        name: '⭐ XP',
                        value: `${xpProgress}/${1000} (${user.xp || 0} total)`,
                        inline: true
                    },
                    {
                        name: '😇 Karma Bon',
                        value: `${goodKarma}`,
                        inline: true
                    },
                    {
                        name: '😈 Karma Mauvais',
                        value: `${badKarma}`,
                        inline: true
                    },
                    {
                        name: '⚖️ Niveau Karma',
                        value: `${karmaLevel} (${karmaBalance >= 0 ? '+' : ''}${karmaBalance})`,
                        inline: true
                    },
                    {
                        name: '💬 Messages',
                        value: `${user.messageCount || 0}`,
                        inline: true
                    },
                    {
                        name: '🎁 Streak Daily',
                        value: `${user.dailyStreak || 0} jours`,
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