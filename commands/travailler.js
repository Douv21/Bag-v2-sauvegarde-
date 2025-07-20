const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('travailler')
        .setDescription('Travailler pour gagner de l\'argent (Action positive)'),

    async execute(interaction, dataManager) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            // Vérifier cooldown
            const users = await dataManager.getData('users');
            const userKey = `${userId}_${guildId}`;
            const userData = users[userKey] || { balance: 0, karmaGood: 0, karmaBad: 0 };
            
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
            
            // Mettre à jour utilisateur
            userData.balance = (userData.balance || 0) + totalReward;
            userData.karmaGood = (userData.karmaGood || 0) + 1;
            userData.lastWork = now;
            users[userKey] = userData;
            
            await dataManager.saveData('users', users);
            
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
                        value: `+1 (Total: ${userData.karmaGood})`,
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