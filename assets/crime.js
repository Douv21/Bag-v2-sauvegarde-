const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function toNumber(value, fallback = 0) {
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
            const actions = (economyConfig && economyConfig.actions) ? economyConfig.actions : {};
            const cfg = actions.crime || actions['coup-de-folie'] || actions.coup_de_folie || {};
            
            const enabled = cfg?.enabled !== false;
            const minReward = toNumber(cfg?.minReward, 200);
            const maxReward = toNumber(cfg?.maxReward, Math.max(200, minReward));
            const cooldown = toNumber(cfg?.cooldown, 14400000);
            const goodKarma = toNumber(cfg?.goodKarma, -2);
            const badKarma = toNumber(cfg?.badKarma, 3);

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
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir commettre un autre crime.`,
                    flags: 64
                });
            }
            
            // Probabilité de succès (60% - plus risqué que le vol)
            const success = Math.random() < 0.6;
            
            const crimes = [
                'Vous avez braqué une banque',
                'Vous avez volé une voiture de luxe',
                'Vous avez détourné des fonds',
                'Vous avez fait du trafic illégal',
                'Vous avez cambriolé une bijouterie'
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
                userData.badKarma = safeBad + toNumber(badKarma, 0);
                userData.goodKarma = safeGood + toNumber(goodKarma, 0);
                userData.lastCrime = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                // Calculer karma net après mise à jour
                const karmaNet = toNumber(userData.goodKarma, 0) - toNumber(userData.badKarma, 0);
                const cooldownHours = Math.max(1, Math.round(toNumber(cooldownTime, 3600000) / 3600000));
                
                const embed = new EmbedBuilder()
                    .setColor('#8b0000')
                    .setTitle('🔫 Crime Réussi !')
                    .setDescription(`${crime} et avez gagné **${earnings}€** !`)
                    .addFields([
                        { name: '💰 Nouveau Solde', value: `${toNumber(userData.balance, 0)}€`, inline: true },
                        { name: '😈 Karma Négatif', value: `${toNumber(badKarma, 0) >= 0 ? '+' : ''}${toNumber(badKarma, 0)} (${toNumber(userData.badKarma, 0)})`, inline: true },
                        { name: '😇 Karma Positif', value: `${toNumber(goodKarma, 0) >= 0 ? '+' : ''}${toNumber(goodKarma, 0)} (${toNumber(userData.goodKarma, 0)})`, inline: true },
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
                userData.badKarma = safeBad + Math.floor(toNumber(badKarma, 0) / 2);
                userData.goodKarma = safeGood + Math.floor(toNumber(goodKarma, 0) / 2);
                userData.lastCrime = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                // Calculer karma net après mise à jour
                const karmaNet = toNumber(userData.goodKarma, 0) - toNumber(userData.badKarma, 0);
                const cooldownHours = Math.max(1, Math.round(toNumber(cooldownTime, 3600000) / 3600000));
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🚔 Crime Échoué !')
                    .setDescription(`Vous avez été arrêté ! Amende de **${penalty}€**.`)
                    .addFields([
                        { name: '💰 Nouveau Solde', value: `${toNumber(userData.balance, 0)}€`, inline: true },
                        { name: '😈 Karma Négatif', value: `${Math.floor(toNumber(badKarma, 0) / 2) >= 0 ? '+' : ''}${Math.floor(toNumber(badKarma, 0) / 2)} (${toNumber(userData.badKarma, 0)})`, inline: true },
                        { name: '😇 Karma Positif', value: `${Math.floor(toNumber(goodKarma, 0) / 2) >= 0 ? '+' : ''}${Math.floor(toNumber(goodKarma, 0) / 2)} (${toNumber(userData.goodKarma, 0)})`, inline: true },
                        { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
                        { name: '⚖️ Justice', value: 'Le crime ne paie pas toujours', inline: false }
                    ])
                    .setFooter({ text: `Prochaine utilisation dans ${cooldownHours} heures` });
                    
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