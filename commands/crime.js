const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crime')
        .setDescription('Commettre un crime pour beaucoup d\'argent (Action très négative 😈)'),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = 14400000; // 4 heures
            
            if (userData.lastCrime && (now - userData.lastCrime) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastCrime)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir commettre un autre crime.`,
                    flags: 64
                });
            }
            
            // Probabilité de succès (60% - plus risqué que le vol)
            const success = Math.random() < 0.6;
            
            const crimes = [
                'Vous avez braqué une banque',
                'Vous avez volé une voiture de luxe',
                'Vous avez détourné des fonds',
                'Vous avez fait du trafic illégal',
                'Vous avez cambriolé une bijouterie'
            ];
            
            const crime = crimes[Math.floor(Math.random() * crimes.length)];
            
            if (success) {
                // Crime réussi - gros gains
                const earnings = Math.floor(Math.random() * 400) + 200; // 200-600€
                
                userData.balance = (userData.balance || 1000) + earnings;
                userData.karmaBad = (userData.karmaBad || 0) + 3;
                userData.karmaGood = Math.max(0, (userData.karmaGood || 0) - 2);
                userData.lastCrime = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                const embed = new EmbedBuilder()
                    .setColor('#8b0000')
                    .setTitle('🔫 Crime Réussi !')
                    .setDescription(`${crime} et avez gagné **${earnings}€** !`)
                    .addFields([
                        {
                            name: '💰 Nouveau Solde',
                            value: `${userData.balance}€`,
                            inline: true
                        },
                        {
                            name: '😈 Karma Négatif',
                            value: `+3 (${userData.karmaBad})`,
                            inline: true
                        },
                        {
                            name: '😇 Karma Positif',
                            value: `-2 (${userData.karmaGood})`,
                            inline: true
                        },
                        {
                            name: '⚠️ Attention',
                            value: 'Vos actions ont des conséquences morales',
                            inline: false
                        }
                    ])
                    .setFooter({ text: 'Prochaine utilisation dans 4 heures' });
                    
                await interaction.reply({ embeds: [embed] });
                
            } else {
                // Crime échoué - grosse amende
                const penalty = Math.floor(Math.random() * 200) + 100; // 100-300€
                userData.balance = Math.max(0, (userData.balance || 1000) - penalty);
                userData.karmaBad = (userData.karmaBad || 0) + 2;
                userData.karmaGood = Math.max(0, (userData.karmaGood || 0) - 1);
                userData.lastCrime = now;
                
                await dataManager.updateUser(userId, guildId, userData);
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🚔 Crime Échoué !')
                    .setDescription(`Vous avez été arrêté ! Amende de **${penalty}€**.`)
                    .addFields([
                        {
                            name: '💰 Nouveau Solde',
                            value: `${userData.balance}€`,
                            inline: true
                        },
                        {
                            name: '😈 Karma Négatif',
                            value: `+2 (${userData.karmaBad})`,
                            inline: true
                        },
                        {
                            name: '😇 Karma Positif',
                            value: `-1 (${userData.karmaGood})`,
                            inline: true
                        },
                        {
                            name: '⚖️ Justice',
                            value: 'Le crime ne paie pas toujours',
                            inline: false
                        }
                    ])
                    .setFooter({ text: 'Prochaine utilisation dans 4 heures' });
                    
                await interaction.reply({ embeds: [embed] });
            }
            
        } catch (error) {
            console.error('❌ Erreur crime:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};