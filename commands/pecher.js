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
            
            // Calculer le gain aléatoire selon la configuration
            const minReward = actionConfig.minReward;
            const maxReward = actionConfig.maxReward;
            const gainAmount = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
            
            // Types de poissons avec valeurs basées sur le gain calculé
            const fishTypes = [
                { name: 'des sardines', emoji: '🐟', multiplier: 0.6 },
                { name: 'une truite', emoji: '🐠', multiplier: 0.8 },
                { name: 'un saumon', emoji: '🍣', multiplier: 1.0 },
                { name: 'un thon', emoji: '🐟', multiplier: 1.2 },
                { name: 'un poisson rare', emoji: '🐠', multiplier: 1.5 },
                { name: 'un trésor sous-marin', emoji: '💎', multiplier: 2.0 }
            ];
            
            // Sélectionner un type de poisson aléatoire
            const selectedFish = fishTypes[Math.floor(Math.random() * fishTypes.length)];
            const actualGain = Math.floor(gainAmount * selectedFish.multiplier);
            
            // Mettre à jour utilisateur avec dataManager selon configuration
            userData.balance = (userData.balance || 1000) + actualGain;
            userData.goodKarma = (userData.goodKarma || 0) + actionConfig.goodKarma;
            userData.badKarma = (userData.badKarma || 0) + actionConfig.badKarma;
            userData.lastFish = now;
            
            await dataManager.updateUser(userId, guildId, userData);
            
            // Calculer karma net après mise à jour
            const karmaNet = userData.goodKarma + Math.abs(userData.badKarma);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff7f')
                .setTitle('🎣 Belle Pêche !')
                .setDescription(`Vous avez attrapé ${selectedFish.name} ! ${selectedFish.emoji}`)
                .addFields([
                    {
                        name: '💰 Gain',
                        value: `${actualGain}€`,
                        inline: true
                    },
                    {
                        name: '😇 Karma Positif',
                        value: `+${actionConfig.goodKarma} (${userData.goodKarma})`,
                        inline: true
                    },
                    {
                        name: '😈 Karma Négatif',
                        value: `${actionConfig.badKarma} (${userData.badKarma})`,
                        inline: true
                    },
                    {
                        name: '⚖️ Karma Net',
                        value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`,
                        inline: true
                    },
                    {
                        name: '⏰ Cooldown',
                        value: `${Math.floor(cooldownTime / 60000)} minutes`,
                        inline: true
                    },
                    {
                        name: '💰 Solde Total',
                        value: `${userData.balance}€`,
                        inline: true
                    },
                    {
                        name: '🎯 Configuration',
                        value: `Gains: ${minReward}€-${maxReward}€`,
                        inline: false
                    }
                ])
                .setFooter({ text: 'Prochaine pêche dans 1h30' });
            
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