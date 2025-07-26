const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pecher')
        .setDescription('Aller à la pêche pour gagner de l\'argent (Action positive 😇)'),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const actionConfig = economyConfig.actions?.pecher || {
                enabled: true,
                minReward: 50,
                maxReward: 150,
                cooldown: 5400000, // 1h30
                goodKarma: 1,
                badKarma: -1
            };

            // Vérifier si l'action est activée
            if (!actionConfig.enabled) {
                await interaction.reply({
                    content: '❌ La commande /pecher est actuellement désactivée.',
                    flags: 64
                });
                return;
            }
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = actionConfig.cooldown;
            
            if (userData.lastFish && (now - userData.lastFish) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastFish)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir pêcher à nouveau.`,
                    flags: 64
                });
            }
            
            // Types de poissons avec probabilités
            const catches = [
                { name: 'des sardines', value: 30, chance: 0.4, emoji: '🐟' },
                { name: 'une truite', value: 60, chance: 0.25, emoji: '🐠' },
                { name: 'un saumon', value: 100, chance: 0.15, emoji: '🍣' },
                { name: 'un thon', value: 150, chance: 0.1, emoji: '🐟' },
                { name: 'un poisson rare', value: 250, chance: 0.05, emoji: '🐠' },
                { name: 'un trésor sous-marin', value: 500, chance: 0.03, emoji: '💎' },
                { name: 'rien du tout', value: 0, chance: 0.02, emoji: '🕳️' }
            ];
            
            // Sélectionner une prise selon les probabilités
            const random = Math.random();
            let cumulative = 0;
            let selectedCatch = catches[0];
            
            for (const catchItem of catches) {
                cumulative += catchItem.chance;
                if (random <= cumulative) {
                    selectedCatch = catchItem;
                    break;
                }
            }
            
            // Mettre à jour utilisateur avec dataManager selon configuration
            userData.balance = (userData.balance || 1000) + selectedCatch.value;
            userData.goodKarma = (userData.goodKarma || 0) + actionConfig.goodKarma;
            userData.badKarma = (userData.badKarma || 0) + actionConfig.badKarma;
            userData.lastFish = now;
            
            await dataManager.updateUser(userId, guildId, userData);
            
            // Calculer karma net après mise à jour
            const karmaNet = userData.goodKarma + Math.abs(userData.badKarma);
            
            let embed;
            
            if (selectedCatch.value === 0) {
                embed = new EmbedBuilder()
                    .setColor('#87ceeb')
                    .setTitle('🎣 Pêche Infructueuse')
                    .setDescription(`Vous n'avez attrapé ${selectedCatch.name} ! ${selectedCatch.emoji}`)
                    .addFields([
                        {
                            name: '💰 Gain',
                            value: `${selectedCatch.value}€`,
                            inline: true
                        },
                        {
                            name: '😇 Karma Positif',
                            value: `+1 (${userData.goodKarma})`,
                            inline: true
                        },
                        {
                            name: '😈 Karma Négatif',
                            value: `-1 (${userData.badKarma})`,
                            inline: true
                        },
                        {
                            name: '⚖️ Karma Net',
                            value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`,
                            inline: true
                        },
                        {
                            name: '🌊 Sagesse',
                            value: 'La patience est la clé de la pêche',
                            inline: false
                        }
                    ]);
            } else {
                embed = new EmbedBuilder()
                    .setColor('#00ff7f')
                    .setTitle('🎣 Belle Pêche !')
                    .setDescription(`Vous avez attrapé ${selectedCatch.name} ! ${selectedCatch.emoji}`)
                    .addFields([
                        {
                            name: '💰 Gain',
                            value: `${selectedCatch.value}€`,
                            inline: true
                        },
                        {
                            name: '💳 Nouveau Solde',
                            value: `${userData.balance}€`,
                            inline: true
                        },
                        {
                            name: '😇 Karma Positif',
                            value: `+1 (${userData.goodKarma})`,
                            inline: true
                        },
                        {
                            name: '😈 Karma Négatif',
                            value: `-1 (${userData.badKarma})`,
                            inline: true
                        },
                        {
                            name: '⚖️ Karma Net',
                            value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`,
                            inline: true
                        }
                    ]);
            }
            
            embed.setFooter({ text: 'Prochaine pêche dans 1h30' });
            await interaction.reply({ embeds: [embed] });

        // Vérifier et appliquer les récompenses karma automatiques
        try {
            const KarmaRewardManager = require('../utils/karmaRewardManager');
            const karmaManager = new KarmaRewardManager(dataManager);
            await karmaManager.checkAndApplyKarmaRewards(interaction.user, interaction.guild, interaction.channel);
        } catch (error) {
            console.error('Erreur vérification récompenses karma:', error);
        }
            
        } catch (error) {
            console.error('❌ Erreur pecher:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};