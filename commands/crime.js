const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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
            const actions = economyConfig.actions || {};
            const rawCfg = (actions['coup-de-folie'] || actions.coup_de_folie || actions.crime) || {};

            // Normaliser les paramètres numériques
            const enabled = rawCfg.enabled !== false;
            const minReward = asNumber(rawCfg.minReward, 200);
            const maxReward = asNumber(rawCfg.maxReward, Math.max(200, minReward));
            const cooldown = asNumber(rawCfg.cooldown, 14400000); // 4h défaut
            const deltaGood = asNumber(rawCfg.goodKarma, -2);
            const deltaBad = asNumber(rawCfg.badKarma, 3);

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
            const cooldownTime = cooldown;
            
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

            const safeBalance = asNumber(userData.balance, 1000);
            const safeGood = asNumber(userData.goodKarma, 0);
            const safeBad = asNumber(userData.badKarma, 0);
            
            if (success) {
                // Crime réussi - gains selon configuration
                const range = Math.max(0, maxReward - minReward);
                const earnings = Math.floor(Math.random() * (range + 1)) + minReward;
                
                userData.balance = safeBalance + earnings;
                userData.badKarma = safeBad + deltaBad;
                userData.goodKarma = safeGood + deltaGood;
                userData.lastCrime = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                // Calculer karma net après mise à jour
                const karmaNet = (Number(userData.goodKarma) || 0) - (Number(userData.badKarma) || 0);
                
                const embed = new EmbedBuilder()
                    .setColor('#8b0000')
                    .setTitle('🔥 Coup de Folie Réussi !')
                    .setDescription(`${crime} et avez gagné **${earnings}💋** !`)
                    .addFields([
                        { name: '💋 Nouveau Plaisir', value: `${userData.balance}💋`, inline: true },
                        { name: '😈 Karma Négatif', value: `${deltaBad >= 0 ? '+' : ''}${deltaBad} (${userData.badKarma})`, inline: true },
                        { name: '😇 Karma Positif', value: `${deltaGood >= 0 ? '+' : ''}${deltaGood} (${userData.goodKarma})`, inline: true },
                        { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
                        { name: '⚠️ Attention', value: 'Vos actions ont des conséquences morales', inline: false }
                    ])
                    .setFooter({ text: `Prochaine utilisation dans ${Math.round(cooldown / 3600000)} heures` });
                
                await interaction.reply({ embeds: [embed] });
                
            } else {
                // Crime échoué - amende selon configuration
                const penalty = Math.floor(minReward / 2) || 0;
                userData.balance = Math.max(0, safeBalance - penalty);
                userData.badKarma = safeBad + Math.floor(deltaBad / 2);
                userData.goodKarma = safeGood + Math.floor(deltaGood / 2);
                userData.lastCrime = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                // Calculer karma net après mise à jour
                const karmaNet = (Number(userData.goodKarma) || 0) - (Number(userData.badKarma) || 0);
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Coup de Folie Échoué !')
                    .setDescription(`Ça n'a pas pris... Pénalité de **${penalty}💋**.`)
                    .addFields([
                        { name: '💋 Nouveau Plaisir', value: `${userData.balance}💋`, inline: true },
                        { name: '😈 Karma Négatif', value: `${Math.floor(deltaBad / 2) >= 0 ? '+' : ''}${Math.floor(deltaBad / 2)} (${userData.badKarma})`, inline: true },
                        { name: '😇 Karma Positif', value: `${Math.floor(deltaGood / 2) >= 0 ? '+' : ''}${Math.floor(deltaGood / 2)} (${userData.goodKarma})`, inline: true },
                        { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
                        { name: '⚖️ Justice', value: 'Le crime ne paie pas toujours', inline: false }
                    ])
                    .setFooter({ text: `Prochaine utilisation dans ${Math.round(cooldown / 3600000)} heures` });
                
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