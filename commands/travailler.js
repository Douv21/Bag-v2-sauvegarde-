const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('travailler')
        .setDescription('Travailler pour gagner de l\'argent (Action positive)'),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const actionConfig = economyConfig.actions?.travailler || {
                enabled: true,
                minReward: 100,
                maxReward: 150,
                cooldown: 3600000, // 1 heure
                goodKarma: 1,
                badKarma: -1
            };

            // Vérifier si l'action est activée
            if (!actionConfig.enabled) {
                await interaction.reply({
                    content: '❌ La commande /travailler est actuellement désactivée.',
                    flags: 64
                });
                return;
            }
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = actionConfig.cooldown;
            
            if (userData.lastWork && (now - userData.lastWork) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastWork)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir retravailler.`,
                    flags: 64
                });
            }
            
            // Calculer gains selon configuration
            const totalReward = Math.floor(Math.random() * (actionConfig.maxReward - actionConfig.minReward + 1)) + actionConfig.minReward;
            
            // Mettre à jour utilisateur avec dataManager
            userData.balance = (userData.balance || 1000) + totalReward;
            userData.goodKarma = (userData.goodKarma || 0) + actionConfig.goodKarma;
            userData.badKarma = (userData.badKarma || 0) + actionConfig.badKarma;
            userData.lastWork = now;
            
            await dataManager.updateUser(userId, guildId, userData);
            
            const workActions = [
                'Vous avez travaillé dans un café',
                'Vous avez aidé des personnes âgées',
                'Vous avez fait du bénévolat',
                'Vous avez livré des colis',
                'Vous avez fait du jardinage'
            ];
            
            const action = workActions[Math.floor(Math.random() * workActions.length)];
            
            // Recalculer le karma net APRÈS la mise à jour (addition avec Math.abs pour badKarma)
            const karmaNet = userData.goodKarma + Math.abs(userData.badKarma);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('💼 Travail Terminé !')
                .setDescription(`${action} et avez gagné **${totalReward}€** !`)
                .addFields([
                    {
                        name: '💰 Nouveau Solde',
                        value: `${userData.balance}€`,
                        inline: true
                    },
                    {
                        name: '😇 Karma Positif',
                        value: `${actionConfig.goodKarma >= 0 ? '+' : ''}${actionConfig.goodKarma} (${userData.goodKarma})`,
                        inline: true
                    },
                    {
                        name: '😈 Karma Négatif',
                        value: `${actionConfig.badKarma >= 0 ? '+' : ''}${actionConfig.badKarma} (${userData.badKarma})`,
                        inline: true
                    },
                    {
                        name: '⚖️ Karma Net',
                        value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`,
                        inline: true
                    }
                ])
                .setFooter({ text: `Prochaine utilisation dans ${Math.round(actionConfig.cooldown / 60000)} minutes` });
                
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
            console.error('❌ Erreur travailler:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};