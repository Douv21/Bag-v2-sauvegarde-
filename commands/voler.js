const { SlashCommandBuilder, EmbedBuilder, UserSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voler')
        .setDescription('Tenter de séduire (Action pimentée)')
        .addUserOption(option =>
            option.setName('cible')
                .setDescription('Utilisateur à voler (optionnel - aléatoire si non spécifié)')
                .setRequired(false)),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            const targetUser = interaction.options.getUser('cible');
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const actionConfig = economyConfig.actions?.voler || {
                enabled: true,
                successChance: 0.7,
                minSteal: 10,
                maxSteal: 100,
                cooldown: 7200000, // 2 heures
                goodKarma: -1,
                badKarma: 1
            };

            // Vérifier si l'action est activée
            if (!actionConfig.enabled) {
                await interaction.reply({
                    content: '❌ La commande /voler est actuellement désactivée.',
                    flags: 64
                });
                return;
            }
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = actionConfig.cooldown;
            
            if (userData.lastSteal && (now - userData.lastSteal) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastSteal)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir voler à nouveau.`,
                    flags: 64
                });
            }

            let target;
            if (targetUser) {
                target = targetUser;
            } else {
                // Sélectionner une cible aléatoire
                const members = await interaction.guild.members.fetch();
                // Obtenir tous les utilisateurs du serveur pour trouver des cibles valides
                const allUsers = await dataManager.getAllUsers(guildId);
                const validTargets = members.filter(member => 
                    !member.user.bot && 
                    member.user.id !== userId &&
                    allUsers.some(u => u.userId === member.user.id && (u.balance || 1000) > 10)
                );
                
                if (validTargets.size === 0) {
                    return await interaction.reply({
                        content: '❌ Aucune cible valide trouvée avec de l\'argent.',
                        flags: 64
                    });
                }
                
                const randomTarget = validTargets.random();
                target = randomTarget.user;
            }

            const targetData = await dataManager.getUser(target.id, guildId);

            if (target.id === userId) {
                return await interaction.reply({
                    content: '❌ Vous ne pouvez pas vous voler vous-même !',
                    flags: 64
                });
            }

            if (targetData.balance < 10) {
                return await interaction.reply({
                    content: `❌ ${target.username} n'a pas assez de plaisir à prendre (minimum 10💋).`,
                    flags: 64
                });
            }

            // Probabilité de succès selon configuration
            const success = Math.random() < actionConfig.successChance;
            
            if (success) {
                // Vol réussi selon configuration
                const maxSteal = Math.min(
                    Math.floor(Math.random() * (actionConfig.maxSteal - actionConfig.minSteal + 1)) + actionConfig.minSteal,
                    Math.floor(targetData.balance * 0.3) // Maximum 30% du solde de la cible
                );
                const stolenAmount = Math.max(actionConfig.minSteal, maxSteal);
                
                userData.balance = (userData.balance || 1000) + stolenAmount;
                userData.badKarma = (userData.badKarma || 0) + actionConfig.badKarma;
                userData.goodKarma = (userData.goodKarma || 0) + actionConfig.goodKarma;
                userData.lastSteal = now;
                
                targetData.balance -= stolenAmount;
                
                await dataManager.updateUser(userId, guildId, userData);
                await dataManager.updateUser(target.id, guildId, targetData);
                
                // Calculer karma net après mise à jour (somme des valeurs absolues)
                const karmaNet = userData.goodKarma - userData.badKarma;
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('😈 Séduction Réussie !')
                    .setDescription(`Vous avez arraché **${stolenAmount}💋** à ${target.username} !`)
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
                
            } else {
                // Vol échoué
                const penalty = Math.floor(Math.random() * 50) + 25; // 25-75💋
                userData.balance = Math.max(0, (userData.balance || 1000) - penalty);
                userData.badKarma = (userData.badKarma || 0) + actionConfig.badKarma;
                userData.goodKarma = (userData.goodKarma || 0) + actionConfig.goodKarma;
                userData.lastSteal = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                // Calculer karma net après échec (somme des valeurs absolues)
                const karmaNet = userData.goodKarma - userData.badKarma;
                
                const embed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Séduction Échouée !')
                    .setDescription(`Repéré(e) ! Pénalité de **${penalty}💋**.`)
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
                            name: '⚖️ Karma Net',
                            value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`,
                            inline: true
                        }
                    ])
                    .setFooter({ text: `Prochaine utilisation dans ${Math.round(actionConfig.cooldown / 60000)} minutes` });
                    
                await interaction.reply({ embeds: [embed] });

                // Vérifier et appliquer les récompenses karma automatiques (vol échoué)
                try {
                    const KarmaRewardManager = require('../utils/karmaRewardManager');
                    const karmaManager = new KarmaRewardManager(dataManager);
                    await karmaManager.checkAndApplyKarmaRewards(interaction.user, interaction.guild, interaction.channel);
                } catch (error) {
                    console.error('Erreur vérification récompenses karma:', error);
                }
            }
            
        } catch (error) {
            console.error('❌ Erreur voler:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};