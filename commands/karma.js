const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('karma')
        .setDescription('Classement karma - Actions bonnes 😇 vs mauvaises 😈'),

    async execute(interaction, dataManager) {
        try {
            const guildId = interaction.guild.id;
            
            // Utiliser getAllUsers au lieu de getData('users')
            const allUsers = await dataManager.getAllUsers(guildId);
            
            // Filtrer et calculer karma net pour le classement
            const karmaUsers = allUsers
                .filter(user => ((user.karmaGood || 0) > 0 || (user.karmaBad || 0) > 0))
                .map(user => ({
                    userId: user.userId,
                    karmaGood: user.karmaGood || 0,
                    karmaBad: user.karmaBad || 0,
                    karmaNet: (user.karmaGood || 0) - (user.karmaBad || 0),
                    balance: user.balance || 1000
                }))
                .sort((a, b) => b.karmaNet - a.karmaNet)
                .slice(0, 10);

            if (karmaUsers.length === 0) {
                return await interaction.reply({
                    content: '📊 Aucune activité karma trouvée sur ce serveur.',
                    flags: 64
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#9932cc')
                .setTitle('⚖️ Classement Karma - Bon vs Mauvais')
                .setDescription('Voici les membres classés par leurs actions morales :')
                .setFooter({ text: `${karmaUsers.length} membres actifs • 😇 = Actions positives, 😈 = Actions négatives` });

            // Créer le classement karma
            let leaderboardText = '';
            for (let i = 0; i < karmaUsers.length; i++) {
                const user = karmaUsers[i];
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
                    
                    // Déterminer le statut moral
                    let moralStatus = '';
                    if (user.karmaNet > 10) moralStatus = '😇 Saint';
                    else if (user.karmaNet > 5) moralStatus = '😇 Très Bon';
                    else if (user.karmaNet > 0) moralStatus = '😇 Bon';
                    else if (user.karmaNet === 0) moralStatus = '😐 Neutre';
                    else if (user.karmaNet > -5) moralStatus = '😈 Mauvais';
                    else if (user.karmaNet > -10) moralStatus = '😈 Très Mauvais';
                    else moralStatus = '😈 Diabolique';
                    
                    leaderboardText += `${medal} **${username}** ${moralStatus}\n`;
                    leaderboardText += `   😇 ${user.karmaGood} | 😈 ${user.karmaBad} | **Net: ${user.karmaNet > 0 ? '+' : ''}${user.karmaNet}**\n\n`;
                    
                } catch (error) {
                    leaderboardText += `${medal} *Utilisateur inconnu* - Net: ${user.karmaNet}\n`;
                }
            }

            embed.addFields([{
                name: '👑 Classement Moral',
                value: leaderboardText,
                inline: false
            }]);

            // Position de l'utilisateur actuel
            const currentUser = await dataManager.getUser(interaction.user.id, guildId);
            if (currentUser && ((currentUser.karmaGood || 0) > 0 || (currentUser.karmaBad || 0) > 0)) {
                const userPosition = karmaUsers.findIndex(u => u.userId === interaction.user.id) + 1;
                const userKarmaNet = (currentUser.karmaGood || 0) - (currentUser.karmaBad || 0);
                
                let userStatus = '';
                if (userKarmaNet > 10) userStatus = '😇 Saint';
                else if (userKarmaNet > 5) userStatus = '😇 Très Bon';
                else if (userKarmaNet > 0) userStatus = '😇 Bon';
                else if (userKarmaNet === 0) userStatus = '😐 Neutre';
                else if (userKarmaNet > -5) userStatus = '😈 Mauvais';
                else if (userKarmaNet > -10) userStatus = '😈 Très Mauvais';
                else userStatus = '😈 Diabolique';
                
                if (userPosition > 0) {
                    embed.addFields([{
                        name: '🎯 Votre Position Morale',
                        value: `**${userPosition}ème** • ${userStatus}\n😇 ${currentUser.karmaGood || 0} bonnes | 😈 ${currentUser.karmaBad || 0} mauvaises | **Net: ${userKarmaNet > 0 ? '+' : ''}${userKarmaNet}**`,
                        inline: false
                    }]);
                }
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Erreur karma:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'affichage du karma.',
                flags: 64
            });
        }
    }
};