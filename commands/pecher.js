const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pecher')
        .setDescription('Pêcher pour gagner de l\'argent (activité relaxante)'),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const rawCfg = economyConfig.actions?.pecher || {};
            
            // Normaliser les valeurs
            const minReward = asNumber(rawCfg.min || rawCfg.minReward || 5);
            const maxReward = asNumber(rawCfg.max || rawCfg.maxReward || 20);
            
            // Gérer cooldown
            let cooldownTime = asNumber(rawCfg.cooldown, 480000); // 8 min par défaut
            if (typeof rawCfg.cooldown === 'object' && rawCfg.cooldown.cooldown) {
                cooldownTime = asNumber(rawCfg.cooldown.cooldown, 480000);
            }
            
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            
            if (userData.lastFish && (now - userData.lastFish) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastFish)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir pêcher à nouveau.`,
                    flags: 64
                });
            }

            // 85% de chance de succès (pêche plus fiable)
            const success = Math.random() > 0.15;
            
            if (!success) {
                userData.lastFish = now;
                await dataManager.updateUser(userId, guildId, userData);

                const embed = new EmbedBuilder()
                    .setColor('#3498db')
                    .setTitle('🎣 Aucune Prise')
                    .setDescription('Vous n\'avez rien attrapé cette fois-ci... La pêche demande de la patience !')
                    .addFields(
                        { name: '💰 Votre solde', value: `${userData.balance || 0}💋`, inline: true }
                    )
                    .setFooter({ text: `Prochaine tentative dans ${Math.round(cooldownTime / 60000)} minutes` });

                await interaction.reply({ embeds: [embed] });
                return;
            }

            // Succès - différents types de poissons
            const fishTypes = [
                { name: 'une truite', multiplier: 1, rarity: 'commune' },
                { name: 'un saumon', multiplier: 1.2, rarity: 'commune' },
                { name: 'une carpe', multiplier: 0.8, rarity: 'commune' },
                { name: 'un brochet', multiplier: 1.5, rarity: 'rare' },
                { name: 'un thon', multiplier: 1.8, rarity: 'rare' },
                { name: 'un requin', multiplier: 3, rarity: 'légendaire' },
                { name: 'un poisson d\'or', multiplier: 5, rarity: 'mythique' }
            ];

            // Probabilités: 60% commune, 25% rare, 10% légendaire, 5% mythique
            let fishCaught;
            const rarity = Math.random();
            if (rarity < 0.6) {
                fishCaught = fishTypes.filter(f => f.rarity === 'commune')[Math.floor(Math.random() * 3)];
            } else if (rarity < 0.85) {
                fishCaught = fishTypes.filter(f => f.rarity === 'rare')[Math.floor(Math.random() * 2)];
            } else if (rarity < 0.95) {
                fishCaught = fishTypes.find(f => f.rarity === 'légendaire');
            } else {
                fishCaught = fishTypes.find(f => f.rarity === 'mythique');
            }

            const baseReward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
            const finalReward = Math.floor(baseReward * fishCaught.multiplier);
            
            // Appliquer bonus karma (les bons pêcheurs ont de la chance)
            const userKarma = (userData.goodKarma || 0) + (userData.badKarma || 0);
            let karmaMultiplier = 1;
            if (userKarma >= 10) karmaMultiplier = 1.3;
            else if (userKarma >= 1) karmaMultiplier = 1.1;
            else if (userKarma <= -10) karmaMultiplier = 0.8;
            else if (userKarma < 0) karmaMultiplier = 0.9;
            
            const totalReward = Math.floor(finalReward * karmaMultiplier);
            
            userData.balance = (userData.balance || 0) + totalReward;
            userData.lastFish = now;
            
            await dataManager.updateUser(userId, guildId, userData);

            // Emojis selon la rareté
            const rarityEmojis = {
                'commune': '🐟',
                'rare': '🐠',
                'légendaire': '🦈',
                'mythique': '🐉'
            };

            const embed = new EmbedBuilder()
                .setColor(fishCaught.rarity === 'mythique' ? '#f1c40f' : 
                         fishCaught.rarity === 'légendaire' ? '#9b59b6' :
                         fishCaught.rarity === 'rare' ? '#3498db' : '#2ecc71')
                .setTitle('🎣 Belle Prise !')
                .setDescription(`Vous avez attrapé ${fishCaught.name} ${rarityEmojis[fishCaught.rarity]} et gagné **${totalReward}💋** !`)
                .addFields(
                    { name: '💰 Nouveau solde', value: `${userData.balance}💋`, inline: true },
                    { name: '📈 Gains', value: `+${totalReward}💋`, inline: true },
                    { name: '🏆 Rareté', value: fishCaught.rarity, inline: true }
                )
                .setFooter({ text: `Prochaine utilisation dans ${Math.round(cooldownTime / 60000)} minutes` });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur commande pecher:', error);
            await interaction.reply({
                content: '❌ Une erreur s\'est produite lors de l\'exécution de cette commande.',
                flags: 64
            });
        }
    }
};