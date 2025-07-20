const { SlashCommandBuilder, EmbedBuilder, UserSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voler')
        .setDescription('Tenter de voler de l\'argent (Action négative)')
        .addUserOption(option =>
            option.setName('cible')
                .setDescription('Utilisateur à voler (optionnel - aléatoire si non spécifié)')
                .setRequired(false)),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            const targetUser = interaction.options.getUser('cible');
            
            // Vérifier cooldown
            const users = await dataManager.getData('users');
            const userKey = `${userId}_${guildId}`;
            const userData = users[userKey] || { balance: 0, karmaGood: 0, karmaBad: 0 };
            
            const now = Date.now();
            const cooldownTime = 7200000; // 2 heures
            
            if (userData.lastSteal && (now - userData.lastSteal) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastSteal)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir voler à nouveau.`,
                    flags: 64
                });
            }

            let target;
            if (targetUser) {
                target = targetUser;
            } else {
                // Sélectionner une cible aléatoire
                const members = await interaction.guild.members.fetch();
                const validTargets = members.filter(member => 
                    !member.user.bot && 
                    member.user.id !== userId &&
                    users[`${member.user.id}_${guildId}`]?.balance > 0
                );
                
                if (validTargets.size === 0) {
                    return await interaction.reply({
                        content: '❌ Aucune cible valide trouvée avec de l\'argent.',
                        flags: 64
                    });
                }
                
                const randomTarget = validTargets.random();
                target = randomTarget.user;
            }

            const targetKey = `${target.id}_${guildId}`;
            const targetData = users[targetKey] || { balance: 0, karmaGood: 0, karmaBad: 0 };

            if (target.id === userId) {
                return await interaction.reply({
                    content: '❌ Vous ne pouvez pas vous voler vous-même !',
                    flags: 64
                });
            }

            if (targetData.balance < 10) {
                return await interaction.reply({
                    content: `❌ ${target.username} n'a pas assez d'argent à voler (minimum 10€).`,
                    flags: 64
                });
            }

            // Probabilité de succès (70%)
            const success = Math.random() < 0.7;
            
            if (success) {
                // Vol réussi
                const stolenAmount = Math.min(
                    Math.floor(targetData.balance * 0.1), // 10% max
                    Math.floor(Math.random() * 100) + 20 // 20-120€
                );
                
                userData.balance = (userData.balance || 0) + stolenAmount;
                userData.karmaBad = (userData.karmaBad || 0) + 1;
                userData.karmaGood = Math.max(0, (userData.karmaGood || 0) - 1); // Réduit le karma positif
                userData.lastSteal = now;
                
                targetData.balance -= stolenAmount;
                
                users[userKey] = userData;
                users[targetKey] = targetData;
                
                await dataManager.saveData('users', users);
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('💸 Vol Réussi !')
                    .setDescription(`Vous avez volé **${stolenAmount}€** à ${target.username} !`)
                    .addFields([
                        {
                            name: '💰 Nouveau Solde',
                            value: `${userData.balance}€`,
                            inline: true
                        },
                        {
                            name: '😈 Karma Négatif',
                            value: `+1 (${userData.karmaBad})`,
                            inline: true
                        },
                        {
                            name: '😇 Karma Positif',
                            value: `-1 (${userData.karmaGood})`,
                            inline: true
                        }
                    ])
                    .setFooter({ text: 'Prochaine utilisation dans 2 heures' });
                    
                await interaction.reply({ embeds: [embed] });
                
            } else {
                // Vol échoué
                const penalty = Math.floor(Math.random() * 50) + 25; // 25-75€
                userData.balance = Math.max(0, (userData.balance || 0) - penalty);
                userData.karmaBad = (userData.karmaBad || 0) + 1;
                userData.karmaGood = Math.max(0, (userData.karmaGood || 0) - 1); // -1 karma positif
                userData.lastSteal = now;
                
                users[userKey] = userData;
                await dataManager.saveData('users', users);
                
                const embed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Vol Échoué !')
                    .setDescription(`Vous avez été attrapé ! Amende de **${penalty}€**.`)
                    .addFields([
                        {
                            name: '💰 Nouveau Solde',
                            value: `${userData.balance}€`,
                            inline: true
                        },
                        {
                            name: '😈 Karma Négatif',
                            value: `+1 (${userData.karmaBad})`,
                            inline: true
                        },
                        {
                            name: '😇 Karma Positif',
                            value: `-1 (${userData.karmaGood})`,
                            inline: true
                        }
                    ])
                    .setFooter({ text: 'Prochaine utilisation dans 2 heures' });
                    
                await interaction.reply({ embeds: [embed] });
            }
            
        } catch (error) {
            console.error('❌ Erreur voler:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};