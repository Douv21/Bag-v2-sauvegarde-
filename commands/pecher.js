const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('flirter')
        .setDescription('Flirter pour gagner du plaisir (Action positive 😇)'),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const actionConfig = (economyConfig.actions?.flirter || economyConfig.actions?.pecher) || {
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
                    content: '❌ La commande /flirter est actuellement désactivée.',
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
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir flirter à nouveau.`,
                    flags: 64
                });
            }
            
            // Calculer le gain aléatoire selon la configuration
            const minReward = actionConfig.minReward;
            const maxReward = actionConfig.maxReward;
            const gainAmount = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
            
            // Types de poissons avec valeurs basées sur le gain calculé
            const fishTypes = [
                { name: 'un clin d’œil', emoji: '😉', multiplier: 0.6 },
                { name: 'un compliment', emoji: '💬', multiplier: 0.8 },
                { name: 'un sourire', emoji: '😊', multiplier: 1.0 },
                { name: 'un regard appuyé', emoji: '👀', multiplier: 1.2 },
                { name: 'une vibe irrésistible', emoji: '🔥', multiplier: 1.5 },
                { name: 'une alchimie parfaite', emoji: '💞', multiplier: 2.0 }
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
            const karmaNet = userData.goodKarma - userData.badKarma;
            
            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('🍑 Flirt Réussi !')
                .setDescription(`Vous avez décroché ${selectedFish.name} ${selectedFish.emoji}`)
                .addFields([
                    {
                        name: '💋 Plaisir Gagné',
                        value: `${actualGain}💋`,
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
                        name: '⚖️ Réputation 🥵',
                        value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`,
                        inline: true
                    },
                    {
                        name: '⏰ Cooldown',
                        value: `${Math.floor(cooldownTime / 60000)} minutes`,
                        inline: true
                    },
                    {
                        name: '💋 Plaisir Total',
                        value: `${userData.balance}💋`,
                        inline: true
                    },
                    {
                        name: '🎯 Configuration',
                        value: `Gains: ${minReward}💋-${maxReward}💋`,
                        inline: false
                    }
                ])
                .setFooter({ text: 'Prochain flirt dans 1h30' });
            
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
            console.error('❌ Erreur flirter:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};