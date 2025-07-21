const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('donner')
        .setDescription('Donner de l\'argent à un membre (Action très positive 😇)')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Membre à qui donner de l\'argent')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant à donner (minimum 10€)')
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
                    content: '❌ Vous ne pouvez pas vous donner de l\'argent à vous-même !',
                    flags: 64
                });
            }
            
            if (targetUser.bot) {
                return await interaction.reply({
                    content: '❌ Vous ne pouvez pas donner d\'argent à un bot !',
                    flags: 64
                });
            }
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = 3600000; // 1 heure
            
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
            userData.karmaGood = (userData.karmaGood || 0) + 3;
            userData.karmaBad = Math.max(0, (userData.karmaBad || 0) - 2);
            userData.lastDonate = now;
            
            targetData.balance = (targetData.balance || 1000) + amount;
            
            await dataManager.updateUser(userId, guildId, userData);
            await dataManager.updateUser(targetUser.id, guildId, targetData);
            
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
                        name: '😇 Karma Très Positif',
                        value: `+3 (${userData.karmaGood})`,
                        inline: true
                    },
                    {
                        name: '😈 Karma Négatif',
                        value: `-2 (${userData.karmaBad})`,
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
                .setFooter({ text: 'Prochaine utilisation dans 1 heure' });
                
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