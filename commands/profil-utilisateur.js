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

            // Récupérer niveau karma personnalisé avec sécurité
            let karmaLevel;
            try {
                const karmaConfig = await dataManager.getData('karma_config') || {};
                const customRewards = karmaConfig[guildId]?.customRewards || [];
                karmaLevel = this.calculateKarmaLevel(karmaNet, customRewards);
            } catch (error) {
                console.error('❌ Erreur karma config:', error);
                karmaLevel = this.getDefaultKarmaLevel(karmaNet);
            }

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

            await interaction.reply({
                embeds: [embed],
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
        // Vérifier si customRewards existe et est un tableau
        if (!customRewards || !Array.isArray(customRewards) || customRewards.length === 0) {
            return this.getDefaultKarmaLevel(karmaNet);
        }

        // Trier les récompenses par seuil décroissant
        const sortedRewards = customRewards
            .filter(reward => reward && 
                typeof reward.karmaThreshold === 'number' && 
                reward.name && 
                reward.description)
            .sort((a, b) => b.karmaThreshold - a.karmaThreshold);

        // Trouver le niveau correspondant
        for (const reward of sortedRewards) {
            if (karmaNet >= reward.karmaThreshold) {
                return {
                    name: reward.name || 'Niveau Personnalisé',
                    description: reward.description || 'Niveau karma personnalisé',
                    money: reward.money || 0,
                    icon: this.getKarmaIcon(reward.karmaThreshold)
                };
            }
        }

        // Niveau par défaut si aucun niveau personnalisé correspondant
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

        // Design futuriste avec circuits électroniques bleu cyan
        const cardDesign = `\`\`\`
    ╔═══○═══════════════════════════════════○═══╗
   ╔╝ ◦ ○ ◦                             ◦ ○ ◦ ╚╗
  ╔╝  ╔═○═╗    🎴 CARTE HOLOGRAPHIQUE   ╔═○═╗  ╚╗
 ╔╝   ║   ║          ${user.displayName.padEnd(12).substring(0, 12)}        ║   ║   ╚╗
╔╝ ◦  ╚═○═╝                             ╚═○═╝  ◦ ╚╗
║                                                 ║
║  ╔══○══════════════════════════════════○══╗   ║
║  ║                                       ║   ║
║  ║  💎 LVL ${level.toString().padStart(2)}  💰 ${(userData.balance || 0).toLocaleString().padStart(8)}€      ║   ║
║  ║  ⚖️  ${karmaNet >= 0 ? '+' : ''}${karmaNet.toString().padStart(3)} ${karmaLevel.icon}  🎯 ${totalActions} actions    ║   ║
║  ║                                       ║   ║
║  ║  ┌─○─────────────────────────○─┐     ║   ║
║  ║  │    ${cardRarity.name.toUpperCase().padEnd(16)}    │     ║   ║
║  ║  │    ${karmaLevel.name.padEnd(16)}    │     ║   ║
║  ║  └─○─────────────────────────○─┘     ║   ║
║  ║                                       ║   ║
║  ╚══○══════════════════════════════════○══╝   ║
║                                                 ║
╚╗ ◦  ╔═○═╗                             ╔═○═╗  ◦ ╔╝
 ╚╗   ║   ║      ${cardRarity.icon} ${cardRarity.name}      ║   ║   ╔╝
  ╚╗  ╚═○═╝                             ╚═○═╝  ╔╝
   ╚╗ ◦ ○ ◦                             ◦ ○ ◦ ╔╝
    ╚═══○═══════════════════════════════════○═══╝
\`\`\``;

        const embed = new EmbedBuilder()
            .setColor('#00FFFF') // Cyan futuriste
            .setTitle(`${cardRarity.icon} SYSTÈME HOLOGRAPHIQUE ACTIVÉ`)
            .setDescription(cardDesign)
            .addFields([
                {
                    name: '🔋 DONNÉES BIOMÉTRIQUES',
                    value: `\`\`\`
○ KARMA POSITIF: ${(userData.karmaGood || 0).toString().padStart(3)}
○ KARMA NÉGATIF: ${(userData.karmaBad || 0).toString().padStart(3)}  
○ BALANCE NET:   ${karmaNet >= 0 ? '+' : ''}${karmaNet}
○ STREAK DAILY:  ${(userData.dailyStreak || 0)} jours
\`\`\``,
                    inline: true
                },
                {
                    name: '⚡ PROGRESSION SYSTÈME',
                    value: `\`\`\`
○ NIVEAU ACTUEL: ${level}
○ XP TOTAL:      ${totalXP.toLocaleString()}
○ XP RESTANT:    ${nextLevelXP - totalXP}
○ RARETÉ:        ${cardRarity.name}
\`\`\``,
                    inline: true
                },
                {
                    name: '🌐 STATUT HOLOGRAPHIQUE',
                    value: `\`\`\`
○ TYPE: ${karmaLevel.name}
○ DESCRIPTION: ${karmaLevel.description}
○ SCORE GLOBAL: ${Math.floor(cardRarity.score)}
○ ID UNIQUE: ${user.id.slice(-8)}
\`\`\``,
                    inline: false
                }
            ])
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ 
                text: `◦ HOLOGRAM-TECH © ${new Date().getFullYear()} ◦ SCAN COMPLETED ◦`,
                iconURL: user.displayAvatarURL() 
            });

        return embed;
    }
};