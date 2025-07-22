const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('parier')
        .setDescription('Parier de l\'argent (Action négative 😈)')
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant à parier (minimum 10€)')
                .setRequired(true)
                .setMinValue(10)),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            const betAmount = interaction.options.getInteger('montant');
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const actionConfig = economyConfig.actions?.parier || {
                enabled: true,
                winChance: 0.45,
                cooldown: 1800000, // 30 minutes
                goodKarma: -1,
                badKarma: 1
            };

            // Vérifier si l'action est activée
            if (!actionConfig.enabled) {
                await interaction.reply({
                    content: '❌ La commande /parier est actuellement désactivée.',
                    flags: 64
                });
                return;
            }
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = actionConfig.cooldown;
            
            if (userData.lastBet && (now - userData.lastBet) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastBet)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir parier à nouveau.`,
                    flags: 64
                });
            }
            
            if (userData.balance < betAmount) {
                return await interaction.reply({
                    content: `❌ Vous n'avez pas assez d'argent ! Votre solde : **${userData.balance}€**`,
                    flags: 64
                });
            }
            
            // Probabilité de gagner selon configuration
            const win = Math.random() < actionConfig.winChance;
            
            if (win) {
                // Victoire - double la mise
                const winnings = betAmount * 2;
                userData.balance = (userData.balance || 1000) + betAmount;
                userData.karmaBad = (userData.karmaBad || 0) + actionConfig.badKarma;
                userData.karmaGood = (userData.karmaGood || 0) + actionConfig.goodKarma;
                userData.lastBet = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                const embed = new EmbedBuilder()
                    .setColor('#ffd700')
                    .setTitle('🎰 Pari Gagné !')
                    .setDescription(`Félicitations ! Vous avez doublé votre mise !`)
                    .addFields([
                        {
                            name: '💰 Gain',
                            value: `+${betAmount}€`,
                            inline: true
                        },
                        {
                            name: '💳 Nouveau Solde',
                            value: `${userData.balance}€`,
                            inline: true
                        },
                        {
                            name: '😈 Karma Négatif',
                            value: `+1 (${userData.karmaBad})`,
                            inline: true
                        },
                        {
                            name: '😇 Karma Positif',
                            value: `-1 (${userData.karmaGood})`,
                            inline: true
                        },
                        {
                            name: '⚠️ Addiction',
                            value: 'Les jeux d\'argent peuvent créer une dépendance',
                            inline: false
                        }
                    ])
                    .setFooter({ text: 'Prochaine utilisation dans 30 minutes' });
                    
                await interaction.reply({ embeds: [embed] });
                
            } else {
                // Défaite - perte de la mise
                userData.balance = (userData.balance || 1000) - betAmount;
                userData.karmaBad = (userData.karmaBad || 0) + actionConfig.badKarma;
                userData.karmaGood = (userData.karmaGood || 0) + actionConfig.goodKarma;
                userData.lastBet = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🎰 Pari Perdu !')
                    .setDescription(`Dommage ! Vous avez perdu votre mise.`)
                    .addFields([
                        {
                            name: '💸 Perte',
                            value: `-${betAmount}€`,
                            inline: true
                        },
                        {
                            name: '💳 Nouveau Solde',
                            value: `${userData.balance}€`,
                            inline: true
                        },
                        {
                            name: '😈 Karma Négatif',
                            value: `+1 (${userData.karmaBad})`,
                            inline: true
                        },
                        {
                            name: '😇 Karma Positif',
                            value: `-1 (${userData.karmaGood})`,
                            inline: true
                        },
                        {
                            name: '💡 Conseil',
                            value: 'La maison gagne toujours à long terme',
                            inline: false
                        }
                    ])
                    .setFooter({ text: 'Prochaine utilisation dans 30 minutes' });
                    
                await interaction.reply({ embeds: [embed] });
            }
            
        } catch (error) {
            console.error('❌ Erreur parier:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};