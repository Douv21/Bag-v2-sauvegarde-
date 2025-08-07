const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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
            const amount = interaction.options.getInteger('montant');
            
            if (targetUser.id === userId) {
                return await interaction.reply({
                    content: '❌ Vous ne pouvez pas vous offrir de l\'argent à vous-même !',
                    flags: 64
                });
            }
            
            if (targetUser.bot) {
                return await interaction.reply({
                    content: '❌ Vous ne pouvez pas offrir d\'argent à un bot !',
                    flags: 64
                });
            }
            
            // Charger la configuration économique
            const economyConfig = await dataManager.loadData('economy.json', {});
            const actionConfig = economyConfig.actions?.donner || {
                enabled: true,
                cooldown: 3600000, // 1 heure
                goodKarma: 3,
                badKarma: -2
            };

            // Vérifier si l'action est activée
            if (!actionConfig.enabled) {
                await interaction.reply({
                    content: '❌ La commande /offrir est actuellement désactivée.',
                    flags: 64
                });
                return;
            }
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = actionConfig.cooldown;
            
            if (userData.lastDonate && (now - userData.lastDonate) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastDonate)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir faire un autre don.`,
                    flags: 64
                });
            }
            
            if (userData.balance < amount) {
                return await interaction.reply({
                    content: `❌ Vous n'avez pas assez d'argent ! Votre solde : **${userData.balance}€**`,
                    flags: 64
                });
            }
            
            // Effectuer le don avec dataManager
            const targetData = await dataManager.getUser(targetUser.id, guildId);
            
            userData.balance = (userData.balance || 1000) - amount;
            userData.goodKarma = (userData.goodKarma || 0) + actionConfig.goodKarma;
            userData.badKarma = (userData.badKarma || 0) + actionConfig.badKarma;
            userData.lastDonate = now;
            
            targetData.balance = (targetData.balance || 1000) + amount;
            
            await dataManager.updateUser(userId, guildId, userData);
            await dataManager.updateUser(targetUser.id, guildId, targetData);
            
            // Calculer karma net après mise à jour
            const karmaNet = userData.goodKarma + Math.abs(userData.badKarma);
            
            const embed = new EmbedBuilder()
                .setColor('#32cd32')
                .setTitle('💝 Don Effectué !')
                .setDescription(`Vous avez fait don de **${amount}€** à ${targetUser.username}`)
                .addFields([
                    {
                        name: '💸 Montant Donné',
                        value: `${amount}€`,
                        inline: true
                    },
                    {
                        name: '💳 Votre Nouveau Solde',
                        value: `${userData.balance}€`,
                        inline: true
                    },
                    {
                        name: '😇 Karma Positif',
                        value: `${actionConfig.goodKarma >= 0 ? '+' : ''}${actionConfig.goodKarma} (${userData.goodKarma})`,
                        inline: true
                    },
                    {
                        name: '😈 Karma Négatif',
                        value: `${actionConfig.badKarma >= 0 ? '+' : ''}${actionConfig.badKarma} (${userData.badKarma})`,
                        inline: true
                    },
                    {
                        name: '⚖️ Réputation 🥵',
                        value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`,
                        inline: true
                    },
                    {
                        name: '🎁 Bénéficiaire',
                        value: `${targetUser.username} a reçu ${amount}€`,
                        inline: false
                    },
                    {
                        name: '🌟 Générosité',
                        value: 'Votre acte de générosité améliore grandement votre karma',
                        inline: false
                    }
                ])
                .setFooter({ text: `Prochaine utilisation dans ${Math.round(actionConfig.cooldown / 60000)} minutes` });
                
            await interaction.reply({ embeds: [embed] });
            
            // Notification privée au bénéficiaire
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#32cd32')
                    .setTitle('💝 Vous avez reçu un don !')
                    .setDescription(`${interaction.user.username} vous a fait don de **${amount}€** sur ${interaction.guild.name}`)
                    .addFields([
                        {
                            name: '💰 Montant Reçu',
                            value: `${amount}€`,
                            inline: true
                        },
                        {
                            name: '💳 Votre Nouveau Solde',
                            value: `${targetData.balance}€`,
                            inline: true
                        }
                    ]);
                    
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // MP fermés ou erreur - pas grave
            }
            
        } catch (error) {
            console.error('❌ Erreur donner:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};