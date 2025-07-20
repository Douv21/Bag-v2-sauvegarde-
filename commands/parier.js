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
            
            // Vérifier cooldown
            const users = await dataManager.getData('users');
            const userKey = `${userId}_${guildId}`;
            const userData = users[userKey] || { balance: 0, karmaGood: 0, karmaBad: 0 };
            
            const now = Date.now();
            const cooldownTime = 1800000; // 30 minutes
            
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
            
            // Probabilité de gagner (45% - légèrement défavorable)
            const win = Math.random() < 0.45;
            
            if (win) {
                // Victoire - double la mise
                const winnings = betAmount * 2;
                userData.balance = (userData.balance || 0) + betAmount; // +mise (car déjà déduite)
                userData.karmaBad = (userData.karmaBad || 0) + 1; // +1 karma mauvais même en gagnant
                userData.lastBet = now;
                
                users[userKey] = userData;
                await dataManager.saveData('users', users);
                
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
                            value: `+1 (Total: ${userData.karmaBad})`,
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
                userData.balance = (userData.balance || 0) - betAmount;
                userData.karmaBad = (userData.karmaBad || 0) + 1; // +1 karma mauvais
                userData.lastBet = now;
                
                users[userKey] = userData;
                await dataManager.saveData('users', users);
                
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
                            value: `+1 (Total: ${userData.karmaBad})`,
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