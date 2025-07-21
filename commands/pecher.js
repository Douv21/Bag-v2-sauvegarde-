const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pecher')
        .setDescription('Aller à la pêche pour gagner de l\'argent (Action positive 😇)'),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = 5400000; // 1h30
            
            if (userData.lastFish && (now - userData.lastFish) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastFish)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir pêcher à nouveau.`,
                    flags: 64
                });
            }
            
            // Types de poissons avec probabilités
            const catches = [
                { name: 'des sardines', value: 30, chance: 0.4, emoji: '🐟' },
                { name: 'une truite', value: 60, chance: 0.25, emoji: '🐠' },
                { name: 'un saumon', value: 100, chance: 0.15, emoji: '🍣' },
                { name: 'un thon', value: 150, chance: 0.1, emoji: '🐟' },
                { name: 'un poisson rare', value: 250, chance: 0.05, emoji: '🐠' },
                { name: 'un trésor sous-marin', value: 500, chance: 0.03, emoji: '💎' },
                { name: 'rien du tout', value: 0, chance: 0.02, emoji: '🕳️' }
            ];
            
            // Sélectionner une prise selon les probabilités
            const random = Math.random();
            let cumulative = 0;
            let selectedCatch = catches[0];
            
            for (const catchItem of catches) {
                cumulative += catchItem.chance;
                if (random <= cumulative) {
                    selectedCatch = catchItem;
                    break;
                }
            }
            
            // Mettre à jour utilisateur avec dataManager
            userData.balance = (userData.balance || 1000) + selectedCatch.value;
            userData.karmaGood = (userData.karmaGood || 0) + 1;
            userData.karmaBad = Math.max(0, (userData.karmaBad || 0) - 1);
            userData.lastFish = now;
            
            await dataManager.updateUser(userId, guildId, userData);
            
            let embed;
            
            if (selectedCatch.value === 0) {
                embed = new EmbedBuilder()
                    .setColor('#87ceeb')
                    .setTitle('🎣 Pêche Infructueuse')
                    .setDescription(`Vous n'avez attrapé ${selectedCatch.name} ! ${selectedCatch.emoji}`)
                    .addFields([
                        {
                            name: '💰 Gain',
                            value: `${selectedCatch.value}€`,
                            inline: true
                        },
                        {
                            name: '😇 Karma Positif',
                            value: `+1 (${userData.karmaGood})`,
                            inline: true
                        },
                        {
                            name: '😈 Karma Négatif',
                            value: `-1 (${userData.karmaBad})`,
                            inline: true
                        },
                        {
                            name: '🌊 Sagesse',
                            value: 'La patience est la clé de la pêche',
                            inline: false
                        }
                    ]);
            } else {
                embed = new EmbedBuilder()
                    .setColor('#00ff7f')
                    .setTitle('🎣 Belle Pêche !')
                    .setDescription(`Vous avez attrapé ${selectedCatch.name} ! ${selectedCatch.emoji}`)
                    .addFields([
                        {
                            name: '💰 Gain',
                            value: `${selectedCatch.value}€`,
                            inline: true
                        },
                        {
                            name: '💳 Nouveau Solde',
                            value: `${userData.balance}€`,
                            inline: true
                        },
                        {
                            name: '😇 Karma Positif',
                            value: `+1 (${userData.karmaGood})`,
                            inline: true
                        },
                        {
                            name: '😈 Karma Négatif',
                            value: `-1 (${userData.karmaBad})`,
                            inline: true
                        }
                    ]);
            }
            
            embed.setFooter({ text: 'Prochaine pêche dans 1h30' });
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('❌ Erreur pecher:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};