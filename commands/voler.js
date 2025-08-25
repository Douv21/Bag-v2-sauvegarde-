const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voler')
        .setDescription('Voler du plaisir à un membre (risqué 😈)')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Utilisateur à voler (obligatoire)')
                .setRequired(true)),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            const target = interaction.options.getUser('membre');
            
            if (!target) {
                return await interaction.reply({ content: '❌ Vous devez choisir un membre à voler.', flags: 64 });
            }
            if (target.bot) {
                return await interaction.reply({ content: '❌ Impossible de voler un bot.', flags: 64 });
            }
            if (target.id === userId) {
                return await interaction.reply({ content: '❌ Vous ne pouvez pas vous voler vous-même !', flags: 64 });
            }
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const rawCfg = (economyConfig.actions?.voler) || {};

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
                    content: '❌ La commande /voler est actuellement désactivée.',
                    flags: 64
                });
                return;
            }
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            const targetData = await dataManager.getUser(target.id, guildId);
            
            const now = Date.now();
            const { getCooldownFactor } = require('../utils/cooldownBoostManager');
            const factor = getCooldownFactor(userData, now);
            const cooldownTime = Math.floor(cooldown * factor);
            
            if (userData.lastSteal && (now - userData.lastSteal) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastSteal)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir voler à nouveau.`,
                    flags: 64
                });
            }

            const targetBalance = asNumber(targetData.balance, 0);

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
                
                // Calculer réputation (karma net = charme + perversion négative)
                const karmaNet = (asNumber(userData.goodKarma, 0)) + (asNumber(userData.badKarma, 0));
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('😈 Vol Réussi !')
                    .setDescription(`Vous avez volé **${stolenAmount}💋** à <@${target.id}> !`)
                    .addFields([
                        { name: '💋 Nouveau Plaisir', value: `${userData.balance}💋`, inline: true },
                        { name: '😈 Karma Négatif', value: `${deltaBad >= 0 ? '+' : ''}${deltaBad} (${userData.badKarma})`, inline: true },
                        { name: '😇 Karma Positif', value: `${deltaGood >= 0 ? '+' : ''}${deltaGood} (${userData.goodKarma})`, inline: true },
                        { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true }
                    ])
                    .setFooter({ text: `Prochaine utilisation dans ${Math.round(cooldownTime / 60000)} minutes` });
                    
                await interaction.reply({ content: `<@${target.id}>`, embeds: [embed] });
                
            } else {
                // Vol échoué
                const penalty = Math.floor(Math.random() * 50) + 25; // 25-75💋
                userData.balance = Math.max(0, userBalance - penalty);
                userData.badKarma = (asNumber(userData.badKarma, 0)) + deltaBad;
                userData.goodKarma = (asNumber(userData.goodKarma, 0)) + deltaGood;
                userData.lastSteal = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                // Calculer réputation (karma net = charme + perversion négative)
                const karmaNet = (asNumber(userData.goodKarma, 0)) + (asNumber(userData.badKarma, 0));
                
                const embed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Vol Échoué !')
                    .setDescription(`Repéré(e) ! Pénalité de **${penalty}💋**.`)
                    .addFields([
                        { name: '💋 Nouveau Plaisir', value: `${userData.balance}💋`, inline: true },
                        { name: '😈 Karma Négatif', value: `${deltaBad >= 0 ? '+' : ''}${deltaBad} (${userData.badKarma})`, inline: true },
                        { name: '😇 Karma Positif', value: `${deltaGood >= 0 ? '+' : ''}${deltaGood} (${userData.goodKarma})`, inline: true },
                        { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true }
                    ])
                    .setFooter({ text: `Prochaine utilisation dans ${Math.round(cooldownTime / 60000)} minutes` });
                    
                await interaction.reply({ embeds: [embed] });
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