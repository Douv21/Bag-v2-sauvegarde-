const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profil-simple')
        .setDescription('Affiche votre profil utilisateur avec carte ASCII')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('Utilisateur dont afficher le profil (optionnel)')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
            const member = interaction.guild?.members.cache.get(targetUser.id);
            
            // Charger les données utilisateur
            const fs = require('fs');
            const path = require('path');
            
            let userData;
            try {
                const usersPath = path.join(__dirname, '..', 'data', 'users.json');
                if (fs.existsSync(usersPath)) {
                    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
                    userData = usersData[targetUser.id] || {};
                } else {
                    userData = {};
                }
            } catch (error) {
                console.error('❌ Erreur lecture données utilisateur:', error);
                userData = {};
            }
            
            // Valeurs par défaut
            userData = Object.assign({
                balance: 0,
                karmaGood: 0,
                karmaBad: 0,
                dailyStreak: 0,
                messageCount: 0,
                actions: { travailler: 0, pecher: 0, voler: 0, crime: 0, parier: 0, donner: 0 }
            }, userData);

            // Calculer les statistiques
            const karmaNet = (userData.karmaGood || 0) - (userData.karmaBad || 0);
            const totalActions = Object.values(userData.actions || {}).reduce((a, b) => a + b, 0);
            const balance = userData.balance || 0;
            const level = Math.floor(totalActions / 10) + 1;
            const xpProgress = totalActions % 10;
            const nextLevelXP = 10;

            // Calculer le niveau karma
            const karmaLevel = this.getKarmaLevel(karmaNet);
            const cardRarity = this.getCardRarity(level, karmaNet, balance, userData.dailyStreak || 0);

            // Dates
            const discordJoinDate = targetUser.createdAt.toLocaleDateString('fr-FR');
            const serverJoinDate = member ? member.joinedAt.toLocaleDateString('fr-FR') : 'Inconnu';

            // Créer la carte ASCII
            const asciiCard = this.createAsciiCard(targetUser, userData, {
                karmaNet, karmaLevel, level, xpProgress, nextLevelXP,
                cardRarity, totalActions, discordJoinDate, serverJoinDate
            });

            const embed = new EmbedBuilder()
                .setColor(cardRarity.color || '#00FFFF')
                .setTitle(`${cardRarity.icon} Carte Profil - ${targetUser.displayName}`)
                .setDescription(`\`\`\`\n${asciiCard}\`\`\``)
                .addFields([
                    {
                        name: '💰 Solde',
                        value: `${balance.toLocaleString()}€`,
                        inline: true
                    },
                    {
                        name: '⚖️ Karma Net',
                        value: `${karmaNet >= 0 ? '+' : ''}${karmaNet} (${karmaLevel.name})`,
                        inline: true
                    },
                    {
                        name: '🏆 Niveau',
                        value: `${level} (${xpProgress}/${nextLevelXP} XP)`,
                        inline: true
                    },
                    {
                        name: '📊 Statistiques',
                        value: `Actions: ${totalActions}\nStreak: ${userData.dailyStreak || 0}\nMessages: ${userData.messageCount || 0}`,
                        inline: true
                    },
                    {
                        name: '📅 Dates',
                        value: `Discord: ${discordJoinDate}\nServeur: ${serverJoinDate}`,
                        inline: true
                    },
                    {
                        name: '🎭 Rareté',
                        value: `${cardRarity.name} ${cardRarity.icon}`,
                        inline: true
                    }
                ])
                .setThumbnail(targetUser.displayAvatarURL())
                .setFooter({ 
                    text: `ID: ${targetUser.id} • ${new Date().toLocaleDateString('fr-FR')}`,
                    iconURL: targetUser.displayAvatarURL() 
                });

            await interaction.reply({
                embeds: [embed],
                flags: 64 // ephemeral
            });

        } catch (error) {
            console.error('❌ Erreur profil-simple:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'affichage du profil.',
                flags: 64
            });
        }
    },

    createAsciiCard(user, userData, stats) {
        const { karmaNet, karmaLevel, level, cardRarity, totalActions } = stats;
        const balance = (userData.balance || 0).toLocaleString();
        const karmaGood = userData.karmaGood || 0;
        const karmaBad = userData.karmaBad || 0;
        const userName = user.displayName.length > 15 ? user.displayName.substring(0, 12) + '...' : user.displayName;

        return `
╔═══════════════════════════════════════════════════════════════╗
║  ${cardRarity.icon} CARTE PROFIL UTILISATEUR ${cardRarity.icon}                          ║
║                   ${cardRarity.name.toUpperCase()} • ${userName}                    ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║    👤           💰 SOLDE: ${balance}€                     ║
║   ╭─╮                                                         ║
║   │ │            ⚖️ KARMA                                    ║
║   ╰─╯            😇 Positif: ${karmaGood}                          ║
║                  😈 Négatif: ${karmaBad}                          ║
║  ${userName}       📊 Net: ${karmaNet >= 0 ? '+' : ''}${karmaNet} (${karmaLevel.name})          ║
║  Niveau ${level}                                                ║
║                  📅 DATES                                      ║
║                  🌐 Discord: ${stats.discordJoinDate}                    ║
║                  🏠 Serveur: ${stats.serverJoinDate}                    ║
║                                                               ║
║                  🏆 STATISTIQUES                              ║
║                  🎯 Actions: ${totalActions} • 🔥 Streak: ${userData.dailyStreak || 0}        ║
║                  💬 Messages: ${userData.messageCount || 0}                       ║
║                                                               ║
║                  ▓▓▓▓▓▓▓▓░░ ${stats.xpProgress}/${stats.nextLevelXP} XP              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
ID: ${user.id.slice(-8)} • Généré le ${new Date().toLocaleDateString('fr-FR')}`;
    },

    getKarmaLevel(karmaNet) {
        if (karmaNet >= 50) return { name: 'Saint', icon: '😇' };
        if (karmaNet >= 20) return { name: 'Bon', icon: '😊' };
        if (karmaNet >= -19) return { name: 'Neutre', icon: '😐' };
        if (karmaNet >= -49) return { name: 'Mauvais', icon: '😠' };
        return { name: 'Diabolique', icon: '😈' };
    },

    getCardRarity(level, karmaNet, balance, dailyStreak) {
        const score = level + Math.abs(karmaNet) / 10 + balance / 1000 + dailyStreak;
        
        if (score >= 100) return { name: 'Mythique', color: '#ff6b6b', icon: '🌟' };
        if (score >= 75) return { name: 'Légendaire', color: '#ffd93d', icon: '⭐' };
        if (score >= 50) return { name: 'Épique', color: '#a8e6cf', icon: '💎' };
        if (score >= 25) return { name: 'Rare', color: '#87ceeb', icon: '💙' };
        return { name: 'Commune', color: '#dda0dd', icon: '🤍' };
    }
};