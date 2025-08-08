const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function sanitizeConfig(rawCfg) {
  const minReward = toNumber(rawCfg?.minReward, 200);
  const maxReward = toNumber(rawCfg?.maxReward, Math.max(200, minReward));
  const cooldown = toNumber(rawCfg?.cooldown, 14400000); // 4h par défaut
  const goodKarma = toNumber(rawCfg?.goodKarma, -2);
  const badKarma = toNumber(rawCfg?.badKarma, 3);
  const enabled = rawCfg?.enabled !== false;
  return { minReward, maxReward, cooldown, goodKarma, badKarma, enabled };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coup-de-folie')
        .setDescription('Faire un coup de folie pour beaucoup de plaisir (Action très pimentée 😈)'),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const actions = (economyConfig && economyConfig.actions) ? economyConfig.actions : {};
            const rawCfg = (actions['coup-de-folie'] || actions.coup_de_folie || actions.crime) || {};

            // Normaliser les paramètres numériques
            const { minReward, maxReward, cooldown, goodKarma: deltaGood, badKarma: deltaBad, enabled } = sanitizeConfig(rawCfg);

            // Vérifier si l'action est activée
            if (!enabled) {
                await interaction.reply({
                    content: '❌ La commande /coup-de-folie est actuellement désactivée.',
                    flags: 64
                });
                return;
            }
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = toNumber(cooldown, 14400000);
            
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

            const safeBalance = toNumber(userData.balance, 1000);
            const safeGood = toNumber(userData.goodKarma, 0);
            const safeBad = toNumber(userData.badKarma, 0);
            
            if (success) {
                // Crime réussi - gains selon configuration
                const range = Math.max(0, toNumber(maxReward, 0) - toNumber(minReward, 0));
                const earnings = Math.floor(Math.random() * (range + 1)) + toNumber(minReward, 0);
                
                userData.balance = safeBalance + earnings;
                userData.badKarma = safeBad + toNumber(deltaBad, 0);
                userData.goodKarma = safeGood + toNumber(deltaGood, 0);
                userData.lastCrime = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                // Calculer karma net après mise à jour
                const karmaNet = toNumber(userData.goodKarma, 0) - toNumber(userData.badKarma, 0);
                const cooldownHours = Math.max(1, Math.round(toNumber(cooldownTime, 3600000) / 3600000));
                
                const embed = new EmbedBuilder()
                    .setColor('#8b0000')
                    .setTitle('🔥 Coup de Folie Réussi !')
                    .setDescription(`${crime} et avez gagné **${earnings}💋** !`)
                    .addFields([
                        { name: '💋 Nouveau Plaisir', value: `${toNumber(userData.balance, 0)}💋`, inline: true },
                        { name: '😈 Karma Négatif', value: `${toNumber(deltaBad, 0) >= 0 ? '+' : ''}${toNumber(deltaBad, 0)} (${toNumber(userData.badKarma, 0)})`, inline: true },
                        { name: '😇 Karma Positif', value: `${toNumber(deltaGood, 0) >= 0 ? '+' : ''}${toNumber(deltaGood, 0)} (${toNumber(userData.goodKarma, 0)})`, inline: true },
                        { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
                        { name: '⚠️ Attention', value: 'Vos actions ont des conséquences morales', inline: false }
                    ])
                    .setFooter({ text: `Prochaine utilisation dans ${cooldownHours} heures` });
                
                await interaction.reply({ embeds: [embed] });
                
            } else {
                // Crime échoué - amende selon configuration
                const penaltyBase = Math.floor(toNumber(minReward, 0) / 2);
                const penalty = Math.max(0, penaltyBase);
                userData.balance = Math.max(0, safeBalance - penalty);
                userData.badKarma = safeBad + Math.floor(toNumber(deltaBad, 0) / 2);
                userData.goodKarma = safeGood + Math.floor(toNumber(deltaGood, 0) / 2);
                userData.lastCrime = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                // Calculer karma net après mise à jour
                const karmaNet = toNumber(userData.goodKarma, 0) - toNumber(userData.badKarma, 0);
                const cooldownHours = Math.max(1, Math.round(toNumber(cooldownTime, 3600000) / 3600000));
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Coup de Folie Échoué !')
                    .setDescription(`Ça n'a pas pris... Pénalité de **${penalty}💋**.`)
                    .addFields([
                        { name: '💋 Nouveau Plaisir', value: `${toNumber(userData.balance, 0)}💋`, inline: true },
                        { name: '😈 Karma Négatif', value: `${Math.floor(toNumber(deltaBad, 0) / 2) >= 0 ? '+' : ''}${Math.floor(toNumber(deltaBad, 0) / 2)} (${toNumber(userData.badKarma, 0)})`, inline: true },
                        { name: '😇 Karma Positif', value: `${Math.floor(toNumber(deltaGood, 0) / 2) >= 0 ? '+' : ''}${Math.floor(toNumber(deltaGood, 0) / 2)} (${toNumber(userData.goodKarma, 0)})`, inline: true },
                        { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
                        { name: '⚖️ Justice', value: 'Le crime ne paie pas toujours', inline: false }
                    ])
                    .setFooter({ text: `Prochaine utilisation dans ${cooldownHours} heures` });
                
                await interaction.reply({ embeds: [embed] });
            }
            
        } catch (error) {
            console.error('❌ Erreur coup-de-folie:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};