const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crime')
        .setDescription('Commettre un crime pour de l\'argent (risqué mais rentable)'),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const rawCfg = economyConfig.actions?.crime || {};
            
            // Normaliser les valeurs
            const minReward = asNumber(rawCfg.min || rawCfg.minReward || 20);
            const maxReward = asNumber(rawCfg.max || rawCfg.maxReward || 50);
            
            // Gérer cooldown
            let cooldownTime = asNumber(rawCfg.cooldown, 900000); // 15 min par défaut
            if (typeof rawCfg.cooldown === 'object' && rawCfg.cooldown.cooldown) {
                cooldownTime = asNumber(rawCfg.cooldown.cooldown, 900000);
            }
            
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            
            if (userData.lastCrime && (now - userData.lastCrime) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastCrime)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir commettre un autre crime.`,
                    flags: 64
                });
            }

            // 30% de chance d'échec
            const success = Math.random() > 0.3;
            
            if (!success) {
                // Échec - perte d'argent
                const penalty = Math.floor(Math.random() * 30) + 10;
                const newBalance = Math.max(0, (userData.balance || 0) - penalty);
                const actualLoss = (userData.balance || 0) - newBalance;
                
                userData.balance = newBalance;
                userData.lastCrime = now;
                userData.badKarma = (userData.badKarma || 0) + 1;
                
                await dataManager.updateUser(userId, guildId, userData);

                const failActions = [
                    'Vous avez été attrapé en train de voler dans un magasin',
                    'Votre tentative de cambriolage a échoué',
                    'Vous avez été pris en flagrant délit de fraude',
                    'Votre plan de vol à l\'étalage a foiré',
                    'Vous avez été surpris en train de pirater'
                ];

                const failAction = failActions[Math.floor(Math.random() * failActions.length)];

                const embed = new EmbedBuilder()
                    .setColor('#e74c3c')
                    .setTitle('🚨 Crime Échoué')
                    .setDescription(`${failAction} et avez perdu **${actualLoss}💋** !`)
                    .addFields(
                        { name: '💰 Nouveau solde', value: `${userData.balance}💋`, inline: true },
                        { name: '📉 Perte', value: `-${actualLoss}💋`, inline: true },
                        { name: '😈 Karma', value: `${(userData.goodKarma || 0) + (userData.badKarma || 0)} (${userData.badKarma || 0} mauvais)`, inline: true }
                    )
                    .setFooter({ text: `Prochaine tentative dans ${Math.round(cooldownTime / 60000)} minutes` });

                await interaction.reply({ embeds: [embed] });
                return;
            }

            // Succès
            const crimeActions = [
                'Vous avez réussi un cambriolage discret',
                'Vous avez piraté avec succès',
                'Votre arnaque a parfaitement fonctionné',
                'Vous avez volé sans vous faire prendre',
                'Votre fraude est passée inaperçue'
            ];

            const action = crimeActions[Math.floor(Math.random() * crimeActions.length)];
            const baseReward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
            
            // Appliquer les bonus/malus karma
            const userKarma = (userData.goodKarma || 0) + (userData.badKarma || 0);
            let karmaMultiplier = 1;
            if (userKarma >= 10) karmaMultiplier = 0.8; // Les saints gagnent moins en crime
            else if (userKarma >= 1) karmaMultiplier = 0.9;
            else if (userKarma <= -10) karmaMultiplier = 1.3; // Les méchants sont doués
            else if (userKarma < 0) karmaMultiplier = 1.1;
            
            const totalReward = Math.floor(baseReward * karmaMultiplier);
            
            userData.balance = (userData.balance || 0) + totalReward;
            userData.lastCrime = now;
            userData.badKarma = (userData.badKarma || 0) + 1;
            
            await dataManager.updateUser(userId, guildId, userData);

            const successDescription = `${action} et avez gagné **${totalReward}💋** !`;

            const embed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle('💰 Crime Réussi')
                .setDescription(successDescription)
                .addFields(
                    { name: '💰 Nouveau solde', value: `${userData.balance}💋`, inline: true },
                    { name: '📈 Gains', value: `+${totalReward}💋`, inline: true },
                    { name: '😈 Karma', value: `${(userData.goodKarma || 0) + (userData.badKarma || 0)} (${userData.badKarma || 0} mauvais)`, inline: true }
                )
                .setFooter({ text: `Prochaine utilisation dans ${Math.round(cooldownTime / 60000)} minutes` });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur commande crime:', error);
            await interaction.reply({
                content: '❌ Une erreur s\'est produite lors de l\'exécution de cette commande.',
                flags: 64
            });
        }
    }
};