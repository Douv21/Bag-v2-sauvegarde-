const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pecher')
        .setDescription('Pêcher pour gagner du plaisir (Action standard 😇)'),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const rawCfg = (economyConfig.actions?.pecher || economyConfig.actions?.flirter) || {};
            
            const enabled = rawCfg.enabled !== false;
            const minReward = asNumber(rawCfg.minReward, 50);
            const maxReward = asNumber(rawCfg.maxReward, Math.max(50, 150));
            const cooldown = asNumber(rawCfg.cooldown, 5400000);
            const deltaGood = asNumber(rawCfg.goodKarma, 1);
            const deltaBad = asNumber(rawCfg.badKarma, -1);

            // Vérifier si l'action est activée
            if (!enabled) {
                await interaction.reply({
                    content: '❌ La commande /pecher est actuellement désactivée.',
                    flags: 64
                });
                return;
            }
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = cooldown;
            
            if (userData.lastFish && (now - userData.lastFish) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastFish)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir pêcher à nouveau.`,
                    flags: 64
                });
            }
            
            // Calculer le gain aléatoire selon la configuration
            const gainAmount = Math.floor(Math.random() * (Math.max(0, maxReward - minReward) + 1)) + minReward;
            
            // Types de poissons
            const fishTypes = [
                { name: 'un petit poisson', emoji: '🐟', multiplier: 0.6 },
                { name: 'une belle prise', emoji: '🎣', multiplier: 1.0 },
                { name: 'un gros poisson', emoji: '🐠', multiplier: 1.2 },
                { name: 'un banc entier', emoji: '🐡', multiplier: 1.5 },
                { name: 'un trésor englouti', emoji: '💎', multiplier: 2.0 }
            ];
            
            // Sélectionner un type de poisson aléatoire
            const selectedFish = fishTypes[Math.floor(Math.random() * fishTypes.length)];
            const actualGain = Math.floor(gainAmount * selectedFish.multiplier);
            
            // Mettre à jour utilisateur avec dataManager selon configuration
            userData.balance = asNumber(userData.balance, 1000) + actualGain;
            userData.goodKarma = asNumber(userData.goodKarma, 0) + deltaGood;
            userData.badKarma = asNumber(userData.badKarma, 0) + deltaBad;
            userData.lastFish = now;
            
            await dataManager.updateUser(userId, guildId, userData);
            
            // Calculer réputation (karma net = charme + perversion négative)
            const karmaNet = (asNumber(userData.goodKarma, 0)) + (asNumber(userData.badKarma, 0));
            
            const embed = new EmbedBuilder()
                .setColor('#1E90FF')
                .setTitle('🎣 Pêche Réussie !')
                .setDescription(`Vous avez attrapé ${selectedFish.name} ${selectedFish.emoji}`)
                .addFields([
                    { name: '💋 Plaisir Gagné', value: `${actualGain}💋`, inline: true },
                    { name: '😇 Karma Positif', value: `+${deltaGood} (${userData.goodKarma})`, inline: true },
                    { name: '😈 Karma Négatif', value: `${deltaBad} (${userData.badKarma})`, inline: true },
                    { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
                    { name: '⏰ Cooldown', value: `${Math.floor(cooldownTime / 60000)} minutes`, inline: true },
                    { name: '💋 Plaisir Total', value: `${userData.balance}💋`, inline: true },
                    { name: '🎯 Configuration', value: `Gains: ${minReward}💋-${maxReward}💋`, inline: false }
                ])
                .setFooter({ text: 'Prochaine pêche dans 1h30' });
            
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
            console.error('❌ Erreur pecher:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};