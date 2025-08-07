const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crime')
        .setDescription('Faire un coup de folie pour beaucoup de plaisir (Action très pimentée 😈)'),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const actionConfig = economyConfig.actions?.crime || {
                enabled: true,
                minReward: 200,
                maxReward: 600,
                cooldown: 14400000, // 4 heures
                goodKarma: -2,
                badKarma: 3
            };

            // Vérifier si l'action est activée
            if (!actionConfig.enabled) {
                await interaction.reply({
                    content: '❌ La commande /coup-de-folie est actuellement désactivée.',
                    flags: 64
                });
                return;
            }
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = actionConfig.cooldown;
            
            if (userData.lastCrime && (now - userData.lastCrime) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastCrime)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir refaire un coup de folie.`,
                    flags: 64
                });
            }
            
            // Probabilité de succès (60% - plus risqué que le vol)
            const success = Math.random() < 0.6;
            
            const crimes = [
                'Vous avez tenté un baiser volé',
                'Vous avez envoyé un message audacieux',
                'Vous avez dansé au milieu de la piste',
                'Vous avez flirté sans retenue',
                'Vous avez soufflé des compliments torrides'
            ];
            
            const crime = crimes[Math.floor(Math.random() * crimes.length)];
            
            if (success) {
                // Crime réussi - gains selon configuration
                const earnings = Math.floor(Math.random() * (actionConfig.maxReward - actionConfig.minReward + 1)) + actionConfig.minReward;
                
                userData.balance = (userData.balance || 1000) + earnings;
                userData.badKarma = (userData.badKarma || 0) + actionConfig.badKarma;
                userData.goodKarma = (userData.goodKarma || 0) + actionConfig.goodKarma;
                userData.lastCrime = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                // Calculer karma net après mise à jour
                const karmaNet = userData.goodKarma - userData.badKarma;
                
                const embed = new EmbedBuilder()
                    .setColor('#8b0000')
                    .setTitle('🔥 Coup de Folie Réussi !')
                    .setDescription(`${crime} et avez gagné **${earnings}💋** !`)
                    .addFields([
                        {
                            name: '💋 Nouveau Plaisir',
                            value: `${userData.balance}💋`,
                            inline: true
                        },
                        {
                            name: '😈 Karma Négatif',
                            value: `${actionConfig.badKarma >= 0 ? '+' : ''}${actionConfig.badKarma} (${userData.badKarma})`,
                            inline: true
                        },
                        {
                            name: '😇 Karma Positif',
                            value: `${actionConfig.goodKarma >= 0 ? '+' : ''}${actionConfig.goodKarma} (${userData.goodKarma})`,
                            inline: true
                        },
                        {
                            name: '⚖️ Réputation 🥵',
                            value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`,
                            inline: true
                        },
                        {
                            name: '⚠️ Attention',
                            value: 'Vos actions ont des conséquences morales',
                            inline: false
                        }
                    ])
                    .setFooter({ text: `Prochaine utilisation dans ${Math.round(actionConfig.cooldown / 3600000)} heures` });
                    
                await interaction.reply({ embeds: [embed] });
                
            } else {
                // Crime échoué - amende selon configuration
                const penalty = Math.floor(actionConfig.minReward / 2);
                userData.balance = Math.max(0, (userData.balance || 1000) - penalty);
                userData.badKarma = (userData.badKarma || 0) + Math.floor(actionConfig.badKarma / 2);
                userData.goodKarma = (userData.goodKarma || 0) + Math.floor(actionConfig.goodKarma / 2);
                userData.lastCrime = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                // Calculer karma net après mise à jour
                const karmaNet = userData.goodKarma - userData.badKarma;
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Coup de Folie Échoué !')
                    .setDescription(`Ça n'a pas pris... Pénalité de **${penalty}💋**.`)
                    .addFields([
                        {
                            name: '💋 Nouveau Plaisir',
                            value: `${userData.balance}💋`,
                            inline: true
                        },
                        {
                            name: '😈 Karma Négatif',
                            value: `${Math.floor(actionConfig.badKarma / 2) >= 0 ? '+' : ''}${Math.floor(actionConfig.badKarma / 2)} (${userData.badKarma})`,
                            inline: true
                        },
                        {
                            name: '😇 Karma Positif',
                            value: `${Math.floor(actionConfig.goodKarma / 2) >= 0 ? '+' : ''}${Math.floor(actionConfig.goodKarma / 2)} (${userData.goodKarma})`,
                            inline: true
                        },
                        {
                            name: '⚖️ Réputation 🥵',
                            value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`,
                            inline: true
                        },
                        {
                            name: '⚖️ Justice',
                            value: 'Le crime ne paie pas toujours',
                            inline: false
                        }
                    ])
                    .setFooter({ text: `Prochaine utilisation dans ${Math.round(actionConfig.cooldown / 3600000)} heures` });
                    
                await interaction.reply({ embeds: [embed] });
            }
            
        } catch (error) {
            console.error('❌ Erreur crime:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};