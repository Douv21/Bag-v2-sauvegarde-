const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('karma')
        .setDescription('Classement karma - Actions bonnes 😇 vs mauvaises 😈'),

    async execute(interaction, dataManager) {
        await interaction.deferReply({ flags: 64 });
        
        try {
            const guildId = interaction.guild.id;
            
            // Récupérer toutes les données
            const economyDataNew = await dataManager.loadData('economy', {});
            const economyDataOld = await dataManager.loadData('economy.json', {});
            const allMembers = await interaction.guild.members.fetch();
            
            const membersMap = new Map();
            
            console.log(`🔍 Analysing karma data for guild ${guildId}...`);
            
            // Priorité au format economy.json (données des actions réelles)
            for (const [key, userData] of Object.entries(economyDataOld)) {
                if (key.endsWith(`_${guildId}`) && typeof userData === 'object') {
                    const userId = key.replace(`_${guildId}`, '');
                    
                    try {
                        const member = allMembers.get(userId);
                        if (!member || member.user.bot) continue;
                        
                        // Utiliser uniquement goodKarma/badKarma (valeurs réelles des actions)
                        const goodKarma = userData.goodKarma || 0;
                        const badKarma = Math.abs(userData.badKarma || 0);
                        
                        console.log(`📊 REAL DATA - ${member.displayName}: Good=${goodKarma}, Bad=${badKarma}`);
                        
                        if (goodKarma > 0 || badKarma > 0) {
                            membersMap.set(userId, {
                                displayName: member.displayName || member.user.username,
                                goodKarma,
                                badKarma,
                                userId,
                                source: 'actions'
                            });
                        }
                    } catch (error) {
                        continue;
                    }
                }
            }
            
            // Vérifier s'il existe des données d'actions réelles avant d'ajouter les données manuelles
            const hasRealActions = Array.from(membersMap.values()).some(m => m.source === 'actions');
            
            // Ajouter données du nouveau format seulement si pas d'actions détectées ET si elles ne sont pas nulles
            if (economyDataNew[guildId] && !hasRealActions) {
                for (const [userId, userData] of Object.entries(economyDataNew[guildId])) {
                    if (!userData || typeof userData !== 'object') continue;
                    
                    // Ignorer si déjà présent dans les données d'actions
                    if (membersMap.has(userId)) continue;
                    
                    try {
                        const member = allMembers.get(userId);
                        if (!member || member.user.bot) continue;
                        
                        const goodKarma = userData.goodKarma || 0;
                        const badKarma = Math.abs(userData.badKarma || 0);
                        
                        // Ne pas ajouter si karma = 0 (évite les affichages après reset)
                        if (goodKarma === 0 && badKarma === 0) continue;
                        
                        console.log(`📊 MANUAL ADD - ${member.displayName}: Good=${goodKarma}, Bad=${badKarma}`);
                        
                        if (goodKarma > 0 || badKarma > 0) {
                            membersMap.set(userId, {
                                displayName: member.displayName || member.user.username,
                                goodKarma,
                                badKarma,
                                userId,
                                source: 'manual'
                            });
                        }
                    } catch (error) {
                        continue;
                    }
                }
            }
            
            // Convertir Map en array
            const membersWithKarma = Array.from(membersMap.values());
            console.log(`✅ Total unique members with karma: ${membersWithKarma.length}`);
            
            // Trier par karma bon (Top 5)
            const topGoodKarma = membersWithKarma
                .filter(u => u.goodKarma > 0)
                .sort((a, b) => b.goodKarma - a.goodKarma)
                .slice(0, 5);
                
            // Trier par karma mauvais (Top 5)
            const topBadKarma = membersWithKarma
                .filter(u => u.badKarma > 0)
                .sort((a, b) => b.badKarma - a.badKarma)
                .slice(0, 5);
            
            const embed = new EmbedBuilder()
                .setColor('#9932cc')
                .setTitle('⚖️ Classement Réputation du Serveur')
                .setDescription('Classement des membres par **charme 🫦** et **perversion 😈**\n*Actions séduisantes 🫦 vs actions coquines 😈*')
                .setTimestamp();
            
            // Classement karma bon
            let goodLeaderboard = '';
            if (topGoodKarma.length > 0) {
                topGoodKarma.forEach((user, index) => {
                    const position = index + 1;
                    let medal = '';
                    
                    if (position === 1) medal = '🥇';
                    else if (position === 2) medal = '🥈';
                    else if (position === 3) medal = '🥉';
                    else medal = `**${position}.**`;
                    
                    const karmaNet = user.goodKarma + Math.abs(user.badKarma);
                    goodLeaderboard += `${medal} **${user.displayName}**\n`;
                    goodLeaderboard += `   └ **${user.goodKarma}** charme 🫦 (Réputation: ${karmaNet})\n\n`;
                });
            } else {
                goodLeaderboard = '*Aucune action positive détectée*\n\n💡 Essayez `/travailler`, `/pecher` ou `/donner` !';
            }
            
            // Classement karma mauvais
            let badLeaderboard = '';
            if (topBadKarma.length > 0) {
                topBadKarma.forEach((user, index) => {
                    const position = index + 1;
                    let medal = '';
                    
                    if (position === 1) medal = '🥇';
                    else if (position === 2) medal = '🥈';
                    else if (position === 3) medal = '🥉';
                    else medal = `**${position}.**`;
                    
                    const karmaNet = user.goodKarma + Math.abs(user.badKarma);
                    badLeaderboard += `${medal} **${user.displayName}**\n`;
                    badLeaderboard += `   └ **${user.badKarma}** perversion 😈 (Réputation: ${karmaNet})\n\n`;
                });
            } else {
                badLeaderboard = '*Aucune action négative détectée*\n\n🎉 Serveur exemplaire !';
            }
            
            embed.addFields([
                {
                    name: '😇 Top Karma Positif',
                    value: goodLeaderboard,
                    inline: true
                },
                {
                    name: '😈 Top Karma Négatif',
                    value: badLeaderboard,
                    inline: true
                }
            ]);
            
            // Statistiques générales
            const totalGoodActions = membersWithKarma.reduce((sum, user) => sum + user.goodKarma, 0);
            const totalBadActions = membersWithKarma.reduce((sum, user) => sum + user.badKarma, 0);
            const totalKarmaNet = totalGoodActions + totalBadActions;
            const activeMembers = membersWithKarma.length;
            
            embed.addFields([
                {
                    name: '📊 Statistiques du Serveur',
                    value: `**${activeMembers}** membres actifs\n**${totalGoodActions}** actions de charme 🫦\n**${totalBadActions}** actions de perversion 😈\n**${totalKarmaNet}** réputation totale`,
                    inline: false
                }
            ]);
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('❌ Erreur commande karma:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Erreur')
                .setDescription('Impossible de récupérer les données karma.')
                .setTimestamp();
                
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};