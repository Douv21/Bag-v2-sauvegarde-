const { SlashCommandBuilder, EmbedBuilder, UserSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seduire')
        .setDescription('Tenter de séduire (Action pimentée)')
        .addUserOption(option =>
            option.setName('cible')
                .setDescription('Utilisateur à séduire (optionnel - aléatoire si non spécifié)')
                .setRequired(false)),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            const targetUser = interaction.options.getUser('cible');
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const rawCfg = (economyConfig.actions?.seduire || economyConfig.actions?.voler) || {};

            const enabled = rawCfg.enabled !== false;
            const successChance = asNumber(rawCfg.successChance, 0.7);
            const minSteal = asNumber(rawCfg.minSteal, 10);
            const maxSteal = asNumber(rawCfg.maxSteal, Math.max(10, minSteal));
            const cooldown = asNumber(rawCfg.cooldown, 7200000);
            const deltaGood = asNumber(rawCfg.goodKarma, -1);
            const deltaBad = asNumber(rawCfg.badKarma, 1);

            // Vérifier si l'action est activée
            if (!enabled) {
                await interaction.reply({
                    content: '❌ La commande /seduire est actuellement désactivée.',
                    flags: 64
                });
                return;
            }
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = cooldown;
            
            if (userData.lastSteal && (now - userData.lastSteal) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastSteal)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir séduire à nouveau.`,
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
                    allUsers.some(u => u.userId === member.user.id && (asNumber(u.balance, 1000)) > 10)
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
            const targetBalance = asNumber(targetData.balance, 0);

            if (target.id === userId) {
                return await interaction.reply({
                    content: '❌ Vous ne pouvez pas vous voler vous-même !',
                    flags: 64
                });
            }

            if (targetBalance < 10) {
                return await interaction.reply({
                    content: `❌ ${target.username} n'a pas assez de plaisir à prendre (minimum 10💋).`,
                    flags: 64
                });
            }

            // Probabilité de succès selon configuration
            const success = Math.random() < successChance;
            const userBalance = asNumber(userData.balance, 1000);
            
            if (success) {
                // Vol réussi selon configuration
                const computedMax = Math.min(
                    Math.floor(Math.random() * (Math.max(0, maxSteal - minSteal) + 1)) + minSteal,
                    Math.floor(targetBalance * 0.3) // Maximum 30% du solde de la cible
                );
                const stolenAmount = Math.max(minSteal, computedMax);
                
                userData.balance = userBalance + stolenAmount;
                userData.badKarma = (asNumber(userData.badKarma, 0)) + deltaBad;
                userData.goodKarma = (asNumber(userData.goodKarma, 0)) + deltaGood;
                userData.lastSteal = now;
                
                targetData.balance = Math.max(0, targetBalance - stolenAmount);
                
                await dataManager.updateUser(userId, guildId, userData);
                await dataManager.updateUser(target.id, guildId, targetData);
                
                // Calculer karma net après mise à jour (somme des valeurs absolues)
                const karmaNet = (asNumber(userData.goodKarma, 0)) - (asNumber(userData.badKarma, 0));
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('😈 Séduction Réussie !')
                    .setDescription(`Vous avez arraché **${stolenAmount}💋** à ${target.username} !`)
                    .addFields([
                        { name: '💋 Nouveau Plaisir', value: `${userData.balance}💋`, inline: true },
                        { name: '😈 Karma Négatif', value: `${deltaBad >= 0 ? '+' : ''}${deltaBad} (${userData.badKarma})`, inline: true },
                        { name: '😇 Karma Positif', value: `${deltaGood >= 0 ? '+' : ''}${deltaGood} (${userData.goodKarma})`, inline: true },
                        { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true }
                    ])
                    .setFooter({ text: `Prochaine utilisation dans ${Math.round(cooldown / 60000)} minutes` });
                    
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
                userData.balance = Math.max(0, userBalance - penalty);
                userData.badKarma = (asNumber(userData.badKarma, 0)) + deltaBad;
                userData.goodKarma = (asNumber(userData.goodKarma, 0)) + deltaGood;
                userData.lastSteal = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                // Calculer karma net après échec (somme des valeurs absolues)
                const karmaNet = (asNumber(userData.goodKarma, 0)) - (asNumber(userData.badKarma, 0));
                
                const embed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Séduction Échouée !')
                    .setDescription(`Repéré(e) ! Pénalité de **${penalty}💋**.`)
                    .addFields([
                        { name: '💋 Nouveau Plaisir', value: `${userData.balance}💋`, inline: true },
                        { name: '😈 Karma Négatif', value: `${deltaBad >= 0 ? '+' : ''}${deltaBad} (${userData.badKarma})`, inline: true },
                        { name: '😇 Karma Positif', value: `${deltaGood >= 0 ? '+' : ''}${deltaGood} (${userData.goodKarma})`, inline: true },
                        { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true }
                    ])
                    .setFooter({ text: `Prochaine utilisation dans ${Math.round(cooldown / 60000)} minutes` });
                    
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
            console.error('❌ Erreur séduire:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};