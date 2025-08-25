const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('travailler')
        .setDescription('Travailler pour gagner du plaisir (Action standard) '),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            // Charger la configuration économique avec debug
            const economyConfig = await dataManager.loadData('economy.json', {});
            const rawCfg = (economyConfig.actions?.travailler || economyConfig.actions?.charmer) || {};
            
            // Normaliser les valeurs (peuvent être des objets avec .money)
            const minReward = asNumber(rawCfg.min || rawCfg.minReward || 10);
            const maxReward = asNumber(rawCfg.max || rawCfg.maxReward || 25);
            
            // Gérer cooldown (peut être un objet avec .cooldown)
            let cooldownTime = asNumber(rawCfg.cooldown, 600000); // 10 min par défaut
            if (typeof rawCfg.cooldown === 'object' && rawCfg.cooldown.cooldown) {
                cooldownTime = asNumber(rawCfg.cooldown.cooldown, 600000);
            }
            
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            
            if (userData.lastWork && (now - userData.lastWork) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastWork)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir retravailler.`,
                    flags: 64
                });
            }

            // Actions de travail variées
            const workActions = [
                'Vous avez travaillé dans un café coquin', 'Vous avez donné un massage relaxant',
                'Vous avez organisé un spectacle privé', 'Vous avez participé à un shooting photo',
                'Vous avez animé une soirée dansante', 'Vous avez fait du mannequinat charmant',
                'Vous avez écrit des poèmes séduisants', 'Vous avez donné des cours de charme',
                'Vous avez participé à un défilé sensuel', 'Vous avez organisé une dégustation romantique'
            ];

            const action = workActions[Math.floor(Math.random() * workActions.length)];
            const baseReward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
            
            // Appliquer les bonus karma
            const userKarma = (userData.goodKarma || 0) + (userData.badKarma || 0);
            let karmaMultiplier = 1;
            if (userKarma >= 10) karmaMultiplier = 1.5;
            else if (userKarma >= 1) karmaMultiplier = 1.2;
            else if (userKarma <= -10) karmaMultiplier = 0.5;
            else if (userKarma < 0) karmaMultiplier = 0.8;
            
            const totalReward = Math.floor(baseReward * karmaMultiplier);
            
            userData.balance = (userData.balance || 0) + totalReward;
            userData.lastWork = now;
            
            await dataManager.updateUser(userId, guildId, userData);

            const successDescription = `${action} et avez gagné **${totalReward}💋** !`;

            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('💼 Travail Accompli')
                .setDescription(successDescription)
                .addFields(
                    { name: '💰 Nouveau solde', value: `${userData.balance}💋`, inline: true },
                    { name: '📈 Gains', value: `+${totalReward}💋`, inline: true }
                )
                .setFooter({ text: `Prochaine utilisation dans ${Math.round(cooldownTime / 60000)} minutes` });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur commande travailler:', error);
            await interaction.reply({
                content: '❌ Une erreur s\'est produite lors de l\'exécution de cette commande.',
                flags: 64
            });
        }
    }
};