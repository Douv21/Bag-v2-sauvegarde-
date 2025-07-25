
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
            
            // Forcer le rechargement des données pour garantir la cohérence
            const user = dataManager.getUser(targetUser.id, interaction.guild.id);
            
            // Utiliser DIRECTEMENT les valeurs de l'objet retourné (toujours à jour)
            const balance = user.balance || 1000;
            const xp = user.xp || 0;
            const level = user.level || 0;
            const goodKarma = user.goodKarma || 0;
            const badKarma = user.badKarma || 0;
            const karmaNet = user.karmaNet || 0; // Utiliser la valeur calculée
            const messageCount = user.messageCount || 0;
            const dailyStreak = user.dailyStreak || 0;
            const timeInVocal = user.timeInVocal || 0;
            
            const nextLevelXP = (level + 1) * 1000;
            const xpProgress = xp - (level * 1000);
            
            console.log(`🔍 ECONOMIE - ${targetUser.username}:`);
            console.log(`   Balance: ${balance}€, XP: ${xp}, Level: ${level}`);
            console.log(`   Karma: +${goodKarma} / -${badKarma} (Net: ${karmaNet})`);
            console.log(`   Messages: ${messageCount}, Vocal: ${timeInVocal}s, Streak: ${dailyStreak}`);
            
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
                        value: `${balance}€`,
                        inline: true
                    },
                    {
                        name: '📊 Niveau',
                        value: `Niveau ${level}`,
                        inline: true
                    },
                    {
                        name: '⭐ XP',
                        value: `${xpProgress}/${1000} (${xp} total)`,
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
                        value: `${messageCount}`,
                        inline: true
                    },
                    {
                        name: '🎁 Streak Daily',
                        value: `${dailyStreak} jours`,
                        inline: true
                    },
                    {
                        name: '🎤 Temps Vocal',
                        value: `${(timeInVocal / 3600).toFixed(1)} h`,
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