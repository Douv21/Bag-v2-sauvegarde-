const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Récupérer votre récompense quotidienne'),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000; // 24h en millisecondes
            const timeSinceLastDaily = now - (userData.lastDaily || 0);
            
            if (timeSinceLastDaily < oneDay) {
                const remaining = Math.ceil((oneDay - timeSinceLastDaily) / (60 * 60 * 1000));
                return await interaction.reply({
                    content: `⏰ Vous avez déjà récupéré votre récompense aujourd'hui ! Prochaine récompense dans **${remaining}h**.`,
                    flags: 64
                });
            }
            
            // Calculer streak
            const wasYesterday = timeSinceLastDaily <= (oneDay * 1.5); // Grace period de 36h
            const newStreak = wasYesterday ? (userData.dailyStreak || 0) + 1 : 1;
            
            // Calculer récompense
            const baseReward = 200;
            const streakBonus = Math.min(newStreak * 10, 100); // Max 100€ bonus
            const karmaBonus = Math.max(0, (userData.karmaGood || 0) - (userData.karmaBad || 0)) * 5;
            const totalReward = baseReward + streakBonus + karmaBonus;
            
            // Mettre à jour utilisateur avec dataManager
            userData.balance = (userData.balance || 1000) + totalReward;
            userData.dailyStreak = newStreak;
            userData.lastDaily = now;
            
            await dataManager.updateUser(userId, guildId, userData);
            
            const embed = new EmbedBuilder()
                .setColor('#ffd700')
                .setTitle('🎁 Récompense Quotidienne !')
                .setDescription(`Vous avez récupéré **${totalReward}€** !`)
                .addFields([
                    {
                        name: '💰 Récompense de Base',
                        value: `${baseReward}€`,
                        inline: true
                    },
                    {
                        name: '🔥 Bonus Streak',
                        value: `${streakBonus}€ (Jour ${newStreak})`,
                        inline: true
                    },
                    {
                        name: '⚖️ Bonus Karma',
                        value: `${karmaBonus}€`,
                        inline: true
                    },
                    {
                        name: '💳 Nouveau Solde',
                        value: `${userData.balance}€`,
                        inline: false
                    }
                ])
                .setFooter({ text: `Streak actuel: ${newStreak} jour(s) • Prochaine récompense dans 24h` });
                
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('❌ Erreur daily:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};