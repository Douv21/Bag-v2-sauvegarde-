const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('travailler')
        .setDescription('Travailler pour gagner de l\'argent (Action positive)'),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            // Vérifier cooldown avec dataManager
            const userData = await dataManager.getUser(userId, guildId);
            
            const now = Date.now();
            const cooldownTime = 3600000; // 1 heure
            
            if (userData.lastWork && (now - userData.lastWork) < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - (now - userData.lastWork)) / 60000);
                return await interaction.reply({
                    content: `⏰ Vous devez attendre encore **${remaining} minutes** avant de pouvoir retravailler.`,
                    flags: 64
                });
            }
            
            // Calculer gains
            const baseReward = 100;
            const bonus = Math.floor(Math.random() * 50);
            const totalReward = baseReward + bonus;
            
            // Mettre à jour utilisateur avec dataManager
            userData.balance = (userData.balance || 1000) + totalReward;
            userData.karmaGood = (userData.karmaGood || 0) + 1;
            userData.karmaBad = Math.max(0, (userData.karmaBad || 0) - 1);
            userData.lastWork = now;
            
            await dataManager.updateUser(userId, guildId, userData);
            
            const workActions = [
                'Vous avez travaillé dans un café',
                'Vous avez aidé des personnes âgées',
                'Vous avez fait du bénévolat',
                'Vous avez livré des colis',
                'Vous avez fait du jardinage'
            ];
            
            const action = workActions[Math.floor(Math.random() * workActions.length)];
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('💼 Travail Terminé !')
                .setDescription(`${action} et avez gagné **${totalReward}€** !`)
                .addFields([
                    {
                        name: '💰 Nouveau Solde',
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
                ])
                .setFooter({ text: 'Prochaine utilisation dans 1 heure' });
                
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('❌ Erreur travailler:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};