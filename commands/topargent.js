const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('topargent')
        .setDescription('Classement des membres les plus riches'),

    async execute(interaction, dataManager) {
        try {
            const guildId = interaction.guild.id;
            
            // Utiliser getAllUsers au lieu de getData('users')
            const allUsers = await dataManager.getAllUsers(guildId);
            
            // Filtrer et trier par solde
            const guildUsers = allUsers
                .filter(user => (user.balance || 1000) > 1000) // Seulement ceux avec plus que le montant de base
                .map(user => ({
                    userId: user.userId,
                    balance: user.balance || 1000,
                    karmaGood: user.karmaGood || 0,
                    karmaBad: user.karmaBad || 0
                }))
                .sort((a, b) => b.balance - a.balance)
                .slice(0, 10);

            if (guildUsers.length === 0) {
                return await interaction.reply({
                    content: '📊 Aucun utilisateur avec de l\'argent trouvé sur ce serveur.',
                    flags: 64
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('💰 Top Argent - Classement')
                .setDescription('Voici les membres les plus riches du serveur :')
                .setFooter({ text: `${guildUsers.length} membres classés` });

            // Créer le classement
            let leaderboardText = '';
            for (let i = 0; i < guildUsers.length; i++) {
                const user = guildUsers[i];
                let medal = '';
                
                switch (i) {
                    case 0: medal = '🥇'; break;
                    case 1: medal = '🥈'; break;
                    case 2: medal = '🥉'; break;
                    default: medal = `${i + 1}.`; break;
                }

                try {
                    const discordUser = await interaction.client.users.fetch(user.userId);
                    const username = discordUser.username;
                    const karmaRatio = user.karmaGood - user.karmaBad;
                    const karmaIcon = karmaRatio > 0 ? '😇' : karmaRatio < 0 ? '😈' : '😐';
                    
                    leaderboardText += `${medal} **${username}** - **${user.balance}€** ${karmaIcon}\n`;
                } catch (error) {
                    leaderboardText += `${medal} *Utilisateur inconnu* - **${user.balance}€**\n`;
                }
            }

            embed.addFields([{
                name: '🏆 Classement',
                value: leaderboardText,
                inline: false
            }]);

            // Ajouter la position de l'utilisateur actuel
            const currentUser = await dataManager.getUser(interaction.user.id, guildId);
            if (currentUser && currentUser.balance > 0) {
                const userPosition = guildUsers.findIndex(u => u.userId === interaction.user.id) + 1;
                if (userPosition > 0) {
                    embed.addFields([{
                        name: '📍 Votre Position',
                        value: `Vous êtes **${userPosition}ème** avec **${currentUser.balance}€**`,
                        inline: false
                    }]);
                }
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Erreur topargent:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'affichage du classement.',
                flags: 64
            });
        }
    }
};