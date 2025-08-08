const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('oser')
        .setDescription('Oser pour gagner du plaisir (Action pimentée 😈)')
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant à oser (minimum 10💋)')
                .setRequired(true)
                .setMinValue(10)),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            const betAmount = asNumber(interaction.options.getInteger('montant'), 0);
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const rawCfg = (economyConfig.actions?.oser || economyConfig.actions?.parier) || {};
            
            const enabled = rawCfg.enabled !== false;
            const winChance = asNumber(rawCfg.winChance, 0.45);
            const cooldown = asNumber(rawCfg.cooldown, 1800000);
            const deltaGood = asNumber(rawCfg.goodKarma, -1);
            const deltaBad = asNumber(rawCfg.badKarma, 1);

            // Vérifier si l'action est activée
            if (!enabled) {
                await interaction.reply({ content: '❌ La commande /oser est actuellement désactivée.', flags: 64 });
                return;
            }
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = cooldown;
            
            if (userData.lastBet && (now - userData.lastBet) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastBet)) / 60000);
                return await interaction.reply({ content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir oser à nouveau.`, flags: 64 });
            }
            
            const currentBalance = asNumber(userData.balance, 0);
            if (currentBalance < betAmount) {
                return await interaction.reply({ content: `❌ Vous n'avez pas assez de plaisir ! Votre solde : **${currentBalance}💋**`, flags: 64 });
            }
            
            // Probabilité de gagner selon configuration
            const win = Math.random() < winChance;
            
            if (win) {
                // Victoire - profit net = mise
                userData.balance = currentBalance + betAmount;
                userData.badKarma = (asNumber(userData.badKarma, 0)) + deltaBad;
                userData.goodKarma = (asNumber(userData.goodKarma, 0)) + deltaGood;
                userData.lastBet = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                // Calculer karma net après mise à jour
                const karmaNet = (asNumber(userData.goodKarma, 0)) - (asNumber(userData.badKarma, 0));
                
                const embed = new EmbedBuilder()
                    .setColor('#ffd700')
                    .setTitle('🎲 Ose Réussi !')
                    .setDescription('Félicitations ! Vous avez doublé votre mise !')
                    .addFields([
                        { name: '💋 Plaisir Gagné', value: `+${betAmount}💋`, inline: true },
                        { name: '💋 Nouveau Plaisir', value: `${userData.balance}💋`, inline: true },
                        { name: '😈 Karma Négatif', value: `${deltaBad >= 0 ? '+' : ''}${deltaBad} (${userData.badKarma})`, inline: true },
                        { name: '😇 Karma Positif', value: `${deltaGood >= 0 ? '+' : ''}${deltaGood} (${userData.goodKarma})`, inline: true },
                        { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
                        { name: '🎲 Chance', value: `${Math.round(winChance * 100)}% de victoire`, inline: true }
                    ])
                    .setFooter({ text: `Prochaine utilisation dans ${Math.round(cooldown / 60000)} minutes` });
                
                await interaction.reply({ embeds: [embed] });
                
            } else {
                // Défaite - perte de la mise
                userData.balance = Math.max(0, currentBalance - betAmount);
                userData.badKarma = (asNumber(userData.badKarma, 0)) + deltaBad;
                userData.goodKarma = (asNumber(userData.goodKarma, 0)) + deltaGood;
                userData.lastBet = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                const karmaNet = (asNumber(userData.goodKarma, 0)) - (asNumber(userData.badKarma, 0));
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🎲 Ose Perdu !')
                    .setDescription('Dommage ! Vous avez perdu votre mise.')
                    .addFields([
                        { name: '💋 Plaisir Perdu', value: `-${betAmount}💋`, inline: true },
                        { name: '💋 Nouveau Plaisir', value: `${userData.balance}💋`, inline: true },
                        { name: '😈 Karma Négatif', value: `${deltaBad >= 0 ? '+' : ''}${deltaBad} (${userData.badKarma})`, inline: true },
                        { name: '😇 Karma Positif', value: `${deltaGood >= 0 ? '+' : ''}${deltaGood} (${userData.goodKarma})`, inline: true },
                        { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
                        { name: '🎲 Chance', value: `${Math.round(winChance * 100)}% de victoire`, inline: true }
                    ])
                    .setFooter({ text: `Prochaine utilisation dans ${Math.round(cooldown / 60000)} minutes` });
                
                await interaction.reply({ embeds: [embed] });
            }
            
        } catch (error) {
            console.error('❌ Erreur oser:', error);
            await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
        }
    }
};