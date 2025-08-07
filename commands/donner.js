const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('offrir')
        .setDescription('Offrir du plaisir à un membre (Action très positive 😇)')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Membre à qui offrir du plaisir')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant à offrir (minimum 10💋)')
                .setRequired(true)
                .setMinValue(10)),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            const targetUser = interaction.options.getUser('membre');
            const amount = asNumber(interaction.options.getInteger('montant'), 0);
            
            if (targetUser.id === userId) {
                return await interaction.reply({ content: '❌ Vous ne pouvez pas vous offrir de l\'argent à vous-même !', flags: 64 });
            }
            
            if (targetUser.bot) {
                return await interaction.reply({ content: '❌ Vous ne pouvez pas offrir d\'argent à un bot !', flags: 64 });
            }
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const rawCfg = (economyConfig.actions?.offrir || economyConfig.actions?.donner) || {};
            
            const enabled = rawCfg.enabled !== false;
            const cooldown = asNumber(rawCfg.cooldown, 3600000);
            const deltaGood = asNumber(rawCfg.goodKarma, 3);
            const deltaBad = asNumber(rawCfg.badKarma, -2);

            // Vérifier si l'action est activée
            if (!enabled) {
                await interaction.reply({ content: '❌ La commande /offrir est actuellement désactivée.', flags: 64 });
                return;
            }
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = cooldown;
            
            if (userData.lastDonate && (now - userData.lastDonate) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastDonate)) / 60000);
                return await interaction.reply({ content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir faire un autre don.`, flags: 64 });
            }
            
            const currentBalance = asNumber(userData.balance, 0);
            if (currentBalance < amount) {
                return await interaction.reply({ content: `❌ Vous n'avez pas assez de plaisir ! Votre solde : **${currentBalance}💋**`, flags: 64 });
            }
            
            // Effectuer le don avec dataManager
            const targetData = await dataManager.getUser(targetUser.id, guildId);
            const targetBalance = asNumber(targetData.balance, 1000);
            
            userData.balance = currentBalance - amount;
            userData.goodKarma = (asNumber(userData.goodKarma, 0)) + deltaGood;
            userData.badKarma = (asNumber(userData.badKarma, 0)) + deltaBad;
            userData.lastDonate = now;
            
            targetData.balance = targetBalance + amount;
            
            await dataManager.updateUser(userId, guildId, userData);
            await dataManager.updateUser(targetUser.id, guildId, targetData);
            
            // Calculer karma net après mise à jour
            const karmaNet = (asNumber(userData.goodKarma, 0)) - (asNumber(userData.badKarma, 0));
            
            const embed = new EmbedBuilder()
                .setColor('#32cd32')
                .setTitle('🎁 Cadeau Coquin !')
                .setDescription(`Vous avez offert **${amount}💋** à ${targetUser.username}`)
                .addFields([
                    { name: '💋 Plaisir Offert', value: `${amount}💋`, inline: true },
                    { name: '💋 Votre Nouveau Plaisir', value: `${userData.balance}💋`, inline: true },
                    { name: '😇 Karma Positif', value: `${deltaGood >= 0 ? '+' : ''}${deltaGood} (${userData.goodKarma})`, inline: true },
                    { name: '😈 Karma Négatif', value: `${deltaBad >= 0 ? '+' : ''}${deltaBad} (${userData.badKarma})`, inline: true },
                    { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
                    { name: '🎁 Bénéficiaire', value: `${targetUser.username} a reçu ${amount}💋`, inline: false },
                    { name: '🌟 Générosité', value: 'Votre acte de générosité améliore grandement votre karma', inline: false }
                ])
                .setFooter({ text: `Prochaine utilisation dans ${Math.round(cooldown / 60000)} minutes` });
                
            await interaction.reply({ embeds: [embed] });
            
            // Notification privée au bénéficiaire
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#32cd32')
                    .setTitle('🎁 Vous avez reçu un cadeau !')
                    .setDescription(`${interaction.user.username} vous a offert **${amount}💋** sur ${interaction.guild.name}`)
                    .addFields([
                        { name: '💋 Plaisir Reçu', value: `${amount}💋`, inline: true },
                        { name: '💋 Votre Nouveau Plaisir', value: `${targetData.balance}💋`, inline: true }
                    ]);
                    
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // MP fermés ou erreur - pas grave
            }
        } catch (error) {
            console.error('❌ Erreur offrir:', error);
            await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
        }
    }
};