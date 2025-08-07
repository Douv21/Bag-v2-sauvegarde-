const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('charmer')
        .setDescription('Charmer pour gagner du plaisir (Action positive)'),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            // Charger la configuration économique avec debug
            const economyConfig = await dataManager.loadData('economy.json', {});
            const rawCfg = (economyConfig.actions?.charmer || economyConfig.actions?.travailler) || {};
            
            const enabled = rawCfg.enabled !== false;
            const minReward = asNumber(rawCfg.minReward ?? rawCfg?.montant?.minAmount, 100);
            const maxReward = asNumber(rawCfg.maxReward ?? rawCfg?.montant?.maxAmount, Math.max(150, minReward));
            const cooldown = asNumber(rawCfg.cooldown, 3600000);
            const deltaGood = asNumber(rawCfg.goodKarma ?? rawCfg?.karma?.goodKarma, 1);
            const deltaBad = asNumber(rawCfg.badKarma ?? rawCfg?.karma?.badKarma, -1);

            // Vérifier si l'action est activée
            if (!enabled) {
                await interaction.reply({
                    content: '❌ La commande /charmer est actuellement désactivée.',
                    flags: 64
                });
                return;
            }
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = cooldown;
            
            if (userData.lastWork && (now - userData.lastWork) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastWork)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir recharmer.`,
                    flags: 64
                });
            }
            
            // Calculer gains selon configuration
            const totalReward = Math.floor(Math.random() * (Math.max(0, maxReward - minReward) + 1)) + minReward;
            
            // Mettre à jour utilisateur avec dataManager
            const previousBalance = asNumber(userData.balance, 1000);
            userData.balance = previousBalance + totalReward;
            userData.goodKarma = (asNumber(userData.goodKarma, 0)) + deltaGood;
            userData.badKarma = (asNumber(userData.badKarma, 0)) + deltaBad;
            userData.lastWork = now;
            
            await dataManager.updateUser(userId, guildId, userData);
            
            const workActions = [
                'Vous avez charmé la galerie',
                'Vous avez envoyé un clin d’œil ravageur',
                'Vous avez lancé un compliment coquin',
                'Vous avez esquissé un sourire mystérieux',
                'Vous avez fait monter la température'
            ];
            
            const action = workActions[Math.floor(Math.random() * workActions.length)];
            
            // Recalculer le karma net APRÈS la mise à jour
            const karmaNet = (asNumber(userData.goodKarma, 0)) - (asNumber(userData.badKarma, 0));
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('💋 Charme Réussi !')
                .setDescription(`${action} et avez gagné **${totalReward}💋** !`)
                .addFields([
                    { name: '💋 Nouveau Plaisir', value: `${userData.balance}💋`, inline: true },
                    { name: '😇 Karma Positif', value: `${deltaGood >= 0 ? '+' : ''}${deltaGood} (${userData.goodKarma})`, inline: true },
                    { name: '😈 Karma Négatif', value: `${deltaBad >= 0 ? '+' : ''}${deltaBad} (${userData.badKarma})`, inline: true },
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
            
        } catch (error) {
            console.error('❌ Erreur charmer:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};