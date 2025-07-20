const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profil-utilisateur')
        .setDescription('Afficher votre carte de profil holographique')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Membre dont voir le profil (optionnel)')
                .setRequired(false)),

    async execute(interaction, dataManager) {
        try {
            const targetUser = interaction.options.getUser('membre') || interaction.user;
            const userId = targetUser.id;
            const guildId = interaction.guild.id;
            
            // Récupérer données utilisateur
            const users = await dataManager.getData('users');
            const userKey = `${userId}_${guildId}`;
            const userData = users[userKey] || { 
                balance: 0, 
                karmaGood: 0, 
                karmaBad: 0,
                lastWork: null,
                lastFish: null,
                lastSteal: null,
                lastCrime: null,
                lastBet: null,
                lastDonate: null,
                dailyStreak: 0,
                messageCount: 0
            };

            // Calculer statistiques avancées
            const karmaNet = (userData.karmaGood || 0) - (userData.karmaBad || 0);
            const totalActions = [
                userData.lastWork,
                userData.lastFish,
                userData.lastSteal,
                userData.lastCrime,
                userData.lastBet,
                userData.lastDonate
            ].filter(Boolean).length;

            // Récupérer niveau karma personnalisé
            const karmaConfig = await dataManager.getData('karma_config') || { customRewards: [] };
            let karmaLevel = this.calculateKarmaLevel(karmaNet, karmaConfig.customRewards);

            // Calculer niveau et XP (basé sur argent et actions)
            const xpFromMoney = Math.floor((userData.balance || 0) / 100);
            const xpFromActions = totalActions * 50;
            const xpFromMessages = (userData.messageCount || 0) * 2;
            const totalXP = xpFromMoney + xpFromActions + xpFromMessages;
            const level = Math.floor(totalXP / 1000) + 1;
            const nextLevelXP = level * 1000;
            const xpProgress = totalXP - ((level - 1) * 1000);

            // Déterminer rareté de la carte
            const cardRarity = this.getCardRarity(level, karmaNet, userData.balance, userData.dailyStreak);

            // Créer l'embed de la carte holographique
            const embed = this.createHolographicCard(targetUser, userData, {
                karmaNet,
                karmaLevel,
                level,
                xpProgress,
                nextLevelXP,
                totalXP,
                cardRarity,
                totalActions
            });

            // Boutons d'interaction
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`card_flip_${userId}`)
                        .setLabel('🔄 Retourner Carte')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`card_shine_${userId}`)
                        .setLabel('✨ Effet Holographique')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`card_stats_${userId}`)
                        .setLabel('📊 Statistiques Détaillées')
                        .setStyle(ButtonStyle.Success)
                );

            await interaction.reply({
                embeds: [embed],
                components: [row],
                flags: 64
            });

        } catch (error) {
            console.error('❌ Erreur profil-utilisateur:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'affichage du profil.',
                flags: 64
            });
        }
    },

    calculateKarmaLevel(karmaNet, customRewards) {
        // Trier les récompenses par seuil décroissant
        const sortedRewards = customRewards
            .filter(reward => reward && typeof reward.karmaThreshold === 'number')
            .sort((a, b) => b.karmaThreshold - a.karmaThreshold);

        // Trouver le niveau correspondant
        for (const reward of sortedRewards) {
            if (karmaNet >= reward.karmaThreshold) {
                return {
                    name: reward.name,
                    description: reward.description,
                    money: reward.money,
                    icon: this.getKarmaIcon(reward.karmaThreshold)
                };
            }
        }

        // Niveau par défaut si aucun niveau personnalisé
        return this.getDefaultKarmaLevel(karmaNet);
    },

    getDefaultKarmaLevel(karmaNet) {
        if (karmaNet >= 50) return { name: 'Saint', icon: '😇', description: 'Âme pure et généreuse' };
        if (karmaNet >= 20) return { name: 'Bon', icon: '😊', description: 'Personne bienveillante' };
        if (karmaNet >= -19) return { name: 'Neutre', icon: '😐', description: 'Équilibre parfait' };
        if (karmaNet >= -49) return { name: 'Mauvais', icon: '😠', description: 'Tendances négatives' };
        return { name: 'Diabolique', icon: '😈', description: 'Âme corrompue' };
    },

    getKarmaIcon(threshold) {
        if (threshold >= 50) return '😇';
        if (threshold >= 20) return '😊';
        if (threshold >= -19) return '😐';
        if (threshold >= -49) return '😠';
        return '😈';
    },

    getCardRarity(level, karmaNet, balance, dailyStreak) {
        const score = level + Math.abs(karmaNet) / 10 + balance / 1000 + dailyStreak;
        
        if (score >= 100) return { name: 'Mythique', color: '#ff6b6b', icon: '🌟', border: '═══════════' };
        if (score >= 75) return { name: 'Légendaire', color: '#ffd93d', icon: '⭐', border: '═══════════' };
        if (score >= 50) return { name: 'Épique', color: '#a8e6cf', icon: '💎', border: '═══════════' };
        if (score >= 25) return { name: 'Rare', color: '#87ceeb', icon: '💙', border: '═══════════' };
        return { name: 'Commune', color: '#dda0dd', icon: '🤍', border: '═══════════' };
    },

    createHolographicCard(user, userData, stats) {
        const { karmaNet, karmaLevel, level, xpProgress, nextLevelXP, totalXP, cardRarity, totalActions } = stats;

        // Créer barre de progression XP visuelle
        const progressBarLength = 20;
        const filledBars = Math.floor((xpProgress / nextLevelXP) * progressBarLength);
        const emptyBars = progressBarLength - filledBars;
        const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

        // Créer jauge karma visuelle
        const karmaBarLength = 10;
        const karmaPosition = Math.min(Math.max(karmaNet + 50, 0), 100);
        const karmaFilled = Math.floor((karmaPosition / 100) * karmaBarLength);
        const karmaEmpty = karmaBarLength - karmaFilled;
        const karmaBar = '😈' + '▓'.repeat(karmaFilled) + '░'.repeat(karmaEmpty) + '😇';

        const embed = new EmbedBuilder()
            .setColor(cardRarity.color)
            .setTitle(`${cardRarity.icon} CARTE ${cardRarity.name.toUpperCase()} ${cardRarity.icon}`)
            .setDescription(`
\`\`\`
${cardRarity.border}
║ ${user.displayName.padEnd(25)} LVL ${level.toString().padStart(3)} ║
${cardRarity.border}
║                                     ║
║  ${karmaLevel.icon} ${karmaLevel.name.padEnd(12)} ${(userData.balance || 0).toLocaleString().padStart(10)}€ ║
║                                     ║
║  XP: ${progressBar} ║
║      ${xpProgress}/${nextLevelXP} (${totalXP} total)   ║
║                                     ║
║  KARMA: ${karmaBar} ║
║         Net: ${karmaNet >= 0 ? '+' : ''}${karmaNet}           ║
║                                     ║
║  📊 Actions: ${totalActions.toString().padStart(2)}   🔥 Streak: ${(userData.dailyStreak || 0).toString().padStart(2)} ║
║  💬 Messages: ${(userData.messageCount || 0).toString().padStart(4)}   ${karmaLevel.description} ║
${cardRarity.border}
\`\`\``)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields([
                {
                    name: '💰 Économie',
                    value: `**Solde:** ${(userData.balance || 0).toLocaleString()}€\n**Niveau:** ${level}\n**XP Total:** ${totalXP.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '⚖️ Karma',
                    value: `**😇 Positif:** ${userData.karmaGood || 0}\n**😈 Négatif:** ${userData.karmaBad || 0}\n**📊 Net:** ${karmaNet >= 0 ? '+' : ''}${karmaNet}`,
                    inline: true
                },
                {
                    name: '🏆 Statistiques',
                    value: `**🎯 Actions:** ${totalActions}\n**🔥 Streak:** ${userData.dailyStreak || 0} jours\n**💬 Messages:** ${userData.messageCount || 0}`,
                    inline: true
                }
            ])
            .setFooter({ 
                text: `${cardRarity.name} • Holographic Card • ${new Date().toLocaleDateString('fr-FR')}`,
                iconURL: user.displayAvatarURL()
            })
            .setTimestamp();

        return embed;
    }
};