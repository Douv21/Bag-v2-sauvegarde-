const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voler')
        .setDescription('Voler un autre utilisateur (PvP risqué)')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('L\'utilisateur à voler')
                .setRequired(true)),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const targetUser = interaction.options.getUser('utilisateur');
            const guildId = interaction.guild.id;
            
            if (targetUser.id === userId) {
                return await interaction.reply({
                    content: '❌ Vous ne pouvez pas vous voler vous-même !',
                    flags: 64
                });
            }

            if (targetUser.bot) {
                return await interaction.reply({
                    content: '❌ Vous ne pouvez pas voler un bot !',
                    flags: 64
                });
            }
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const rawCfg = economyConfig.actions?.voler || {};
            
            // Gérer cooldown
            let cooldownTime = asNumber(rawCfg.cooldown, 1200000); // 20 min par défaut
            if (typeof rawCfg.cooldown === 'object' && rawCfg.cooldown.cooldown) {
                cooldownTime = asNumber(rawCfg.cooldown.cooldown, 1200000);
            }
            
            const userData = await dataManager.getUser(userId, guildId);
            const targetData = await dataManager.getUser(targetUser.id, guildId);
            
            const now = Date.now();
            
            if (userData.lastSteal && (now - userData.lastSteal) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastSteal)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir voler à nouveau.`,
                    flags: 64
                });
            }

            // Vérifier si la cible a assez d'argent
            if ((targetData.balance || 0) < 10) {
                return await interaction.reply({
                    content: `❌ ${targetUser.username} n'a pas assez d'argent à voler (minimum 10💋).`,
                    flags: 64
                });
            }

            // 50% de chance de succès
            const success = Math.random() > 0.5;
            
            if (!success) {
                // Échec - perte d'argent et karma
                const penalty = Math.floor(Math.random() * 20) + 10;
                const newBalance = Math.max(0, (userData.balance || 0) - penalty);
                const actualLoss = (userData.balance || 0) - newBalance;
                
                userData.balance = newBalance;
                userData.lastSteal = now;
                userData.badKarma = (userData.badKarma || 0) + 1;
                
                await dataManager.updateUser(userId, guildId, userData);

                const embed = new EmbedBuilder()
                    .setColor('#e74c3c')
                    .setTitle('🚨 Tentative de Vol Échouée')
                    .setDescription(`${targetUser.username} vous a attrapé et vous avez perdu **${actualLoss}💋** !`)
                    .addFields(
                        { name: '💰 Votre solde', value: `${userData.balance}💋`, inline: true },
                        { name: '📉 Perte', value: `-${actualLoss}💋`, inline: true },
                        { name: '😈 Karma', value: `${(userData.goodKarma || 0) + (userData.badKarma || 0)} (${userData.badKarma || 0} mauvais)`, inline: true }
                    )
                    .setFooter({ text: `Prochaine tentative dans ${Math.round(cooldownTime / 60000)} minutes` });

                await interaction.reply({ embeds: [embed] });
                return;
            }

            // Succès - voler entre 10% et 30% de l'argent de la cible
            const targetBalance = targetData.balance || 0;
            const stealPercentage = Math.random() * 0.2 + 0.1; // 10% à 30%
            const stolenAmount = Math.floor(targetBalance * stealPercentage);
            const actualStolen = Math.min(stolenAmount, targetBalance);
            
            // Appliquer les changements
            userData.balance = (userData.balance || 0) + actualStolen;
            userData.lastSteal = now;
            userData.badKarma = (userData.badKarma || 0) + 1;
            
            targetData.balance = Math.max(0, targetBalance - actualStolen);
            
            await dataManager.updateUser(userId, guildId, userData);
            await dataManager.updateUser(targetUser.id, guildId, targetData);

            const embed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle('💰 Vol Réussi')
                .setDescription(`Vous avez volé **${actualStolen}💋** à ${targetUser.username} !`)
                .addFields(
                    { name: '💰 Votre nouveau solde', value: `${userData.balance}💋`, inline: true },
                    { name: '📈 Gains', value: `+${actualStolen}💋`, inline: true },
                    { name: '😈 Karma', value: `${(userData.goodKarma || 0) + (userData.badKarma || 0)} (${userData.badKarma || 0} mauvais)`, inline: true }
                )
                .setFooter({ text: `Prochaine utilisation dans ${Math.round(cooldownTime / 60000)} minutes` });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur commande voler:', error);
            await interaction.reply({
                content: '❌ Une erreur s\'est produite lors de l\'exécution de cette commande.',
                flags: 64
            });
        }
    }
};