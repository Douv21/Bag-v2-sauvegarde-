
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
            const user = dataManager.getUser(targetUser.id, interaction.guild.id);
            
            const level = Math.floor((user.xp || 0) / 1000);
            const nextLevelXP = (level + 1) * 1000;
            const xpProgress = (user.xp || 0) - (level * 1000);

            // Utiliser les propriétés karma unifiées
            const goodKarma = user.goodKarma || 0;
            const badKarma = user.badKarma || 0;
            const karmaNet = goodKarma - badKarma; // karma net réel
            
            console.log(`🔍 Profil: ${targetUser.username} - Good: ${goodKarma}, Bad: ${badKarma}, Net: ${karmaNet}`);
            
            // Calculer niveau de karma basé sur le net
            let karmaLevel = 'Neutre';
            if (karmaNet >= 50) karmaLevel = 'Saint 😇';
            else if (karmaNet >= 20) karmaLevel = 'Bon 😊';
            else if (karmaNet <= -50) karmaLevel = 'Diabolique 😈';
            else if (karmaNet <= -20) karmaLevel = 'Mauvais 😠';

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
                        name: '⚖️ Karma Net',
                        value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`,
                        inline: true
                    },
                    {
                        name: '🏆 Niveau Karma',
                        value: `${karmaLevel}`,
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