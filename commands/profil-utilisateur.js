const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');

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
            // Récupérer le membre du serveur pour la date d'entrée
            const member = interaction.guild.members.cache.get(targetUser.id);
            
            // Créer la carte SVG
            const svgCard = await this.createUserCard(targetUser, userData, {
                karmaNet,
                karmaLevel,
                level,
                xpProgress,
                nextLevelXP,
                totalXP,
                cardRarity,
                totalActions
            }, member);

            // Sauvegarder temporairement le SVG comme fichier
            const fs = require('fs');
            const path = require('path');
            
            const cardPath = path.join(__dirname, '..', 'temp_cards');
            if (!fs.existsSync(cardPath)) {
                fs.mkdirSync(cardPath, { recursive: true });
            }
            
            const fileName = `card_${targetUser.id}_${Date.now()}.svg`;
            const filePath = path.join(cardPath, fileName);
            fs.writeFileSync(filePath, svgCard);

            const embed = new EmbedBuilder()
                .setColor(cardRarity.color || '#00FFFF')
                .setTitle(`${cardRarity.icon} Carte Profil - ${targetUser.displayName}`)
                .setDescription(`Voici votre carte de profil personnalisée !`)
                .setImage(`attachment://${fileName}`)
                .addFields([
                    {
                        name: '📊 Résumé',
                        value: `**Niveau:** ${level}\n**Solde:** ${(userData.balance || 0).toLocaleString()}€\n**Karma Net:** ${karmaNet >= 0 ? '+' : ''}${karmaNet}`,
                        inline: true
                    },
                    {
                        name: '🏆 Rareté',
                        value: `**Type:** ${cardRarity.name}\n**Score:** ${Math.floor(cardRarity.score || 0)}\n**Statut:** ${karmaLevel.name}`,
                        inline: true
                    }
                ])
                .setFooter({ 
                    text: `Carte générée • ${new Date().toLocaleDateString('fr-FR')}`,
                    iconURL: targetUser.displayAvatarURL() 
                });

            const attachment = new AttachmentBuilder(filePath, { name: fileName });

            await interaction.reply({
                embeds: [embed],
                files: [attachment],
                flags: 64
            });

            // Nettoyer le fichier temporaire après 10 secondes
            setTimeout(() => {
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (error) {
                    console.error('❌ Erreur nettoyage fichier carte:', error);
                }
            }, 10000);

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

    async createUserCard(user, userData, stats, member) {
        const { karmaNet, karmaLevel, level, xpProgress, nextLevelXP, totalXP, cardRarity, totalActions } = stats;

        // Récupérer les dates d'inscription
        const discordJoinDate = user.createdAt.toLocaleDateString('fr-FR');
        const serverJoinDate = member ? member.joinedAt.toLocaleDateString('fr-FR') : 'Inconnu';
        
        // Informations utilisateur
        const userName = user.displayName.length > 18 ? user.displayName.substring(0, 15) + '...' : user.displayName;
        const balance = (userData.balance || 0).toLocaleString();
        const karmaGood = userData.karmaGood || 0;
        const karmaBad = userData.karmaBad || 0;

        // Couleurs basées sur la rareté
        const colors = {
            'Commune': { bg: '#2C2F33', accent: '#99AAB5', glow: '#7289DA' },
            'Rare': { bg: '#2C2F33', accent: '#3498DB', glow: '#5DADE2' },
            'Épique': { bg: '#2C2F33', accent: '#9B59B6', glow: '#BB86FC' },
            'Légendaire': { bg: '#2C2F33', accent: '#F1C40F', glow: '#FFD93D' },
            'Mythique': { bg: '#2C2F33', accent: '#E91E63', glow: '#FF6B9D' }
        };
        
        const cardColor = colors[cardRarity.name] || colors.Commune;

        // Créer SVG de la carte
        const svgCard = `
<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${cardColor.bg};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#23272A;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${cardColor.accent};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${cardColor.glow};stop-opacity:0.8" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Fond de carte -->
  <rect width="800" height="500" rx="20" fill="url(#cardGradient)" stroke="${cardColor.accent}" stroke-width="3"/>
  
  <!-- Bordure d'accentuation -->
  <rect x="10" y="10" width="780" height="480" rx="15" fill="none" stroke="url(#accentGradient)" stroke-width="2" opacity="0.6"/>
  
  <!-- En-tête -->
  <rect x="20" y="20" width="760" height="80" rx="10" fill="${cardColor.accent}" opacity="0.2"/>
  <text x="400" y="50" text-anchor="middle" fill="${cardColor.glow}" font-family="Arial, sans-serif" font-size="24" font-weight="bold" filter="url(#glow)">
    ${cardRarity.icon} CARTE PROFIL UTILISATEUR ${cardRarity.icon}
  </text>
  <text x="400" y="80" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="16" opacity="0.8">
    ${cardRarity.name.toUpperCase()} • ${userName}
  </text>
  
  <!-- Section Gauche - Avatar et Info -->
  <circle cx="150" cy="200" r="70" fill="${cardColor.accent}" opacity="0.3"/>
  <circle cx="150" cy="200" r="65" fill="#36393F" stroke="${cardColor.glow}" stroke-width="3"/>
  <text x="150" y="210" text-anchor="middle" fill="${cardColor.glow}" font-family="Arial, sans-serif" font-size="48" font-weight="bold">
    👤
  </text>
  
  <!-- Nom utilisateur -->
  <text x="150" y="290" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="20" font-weight="bold">
    ${userName}
  </text>
  <text x="150" y="315" text-anchor="middle" fill="${cardColor.accent}" font-family="Arial, sans-serif" font-size="14">
    Niveau ${level} • ${totalXP.toLocaleString()} XP
  </text>
  
  <!-- Section Droite - Statistiques -->
  <rect x="300" y="130" width="480" height="340" rx="15" fill="#36393F" opacity="0.5" stroke="${cardColor.accent}" stroke-width="1"/>
  
  <!-- Solde -->
  <text x="320" y="160" fill="${cardColor.glow}" font-family="Arial, sans-serif" font-size="18" font-weight="bold">💰 SOLDE</text>
  <text x="320" y="185" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${balance}€</text>
  
  <!-- Karma -->
  <text x="320" y="220" fill="${cardColor.glow}" font-family="Arial, sans-serif" font-size="18" font-weight="bold">⚖️ KARMA</text>
  <text x="320" y="245" fill="#43B581" font-family="Arial, sans-serif" font-size="16">😇 Positif: ${karmaGood}</text>
  <text x="320" y="270" fill="#F04747" font-family="Arial, sans-serif" font-size="16">😈 Négatif: ${karmaBad}</text>
  <text x="320" y="295" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="16" font-weight="bold">📊 Net: ${karmaNet >= 0 ? '+' : ''}${karmaNet} (${karmaLevel.name})</text>
  
  <!-- Dates -->
  <text x="320" y="330" fill="${cardColor.glow}" font-family="Arial, sans-serif" font-size="18" font-weight="bold">📅 DATES</text>
  <text x="320" y="355" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="14">🌐 Discord: ${discordJoinDate}</text>
  <text x="320" y="380" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="14">🏠 Serveur: ${serverJoinDate}</text>
  
  <!-- Statistiques -->
  <text x="320" y="415" fill="${cardColor.glow}" font-family="Arial, sans-serif" font-size="18" font-weight="bold">🏆 STATS</text>
  <text x="320" y="440" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="14">🎯 Actions: ${totalActions} • 🔥 Streak: ${userData.dailyStreak || 0} • 💬 Messages: ${userData.messageCount || 0}</text>
  
  <!-- Barre de progression XP -->
  <rect x="550" y="160" width="200" height="20" rx="10" fill="#36393F" stroke="${cardColor.accent}" stroke-width="1"/>
  <rect x="550" y="160" width="${Math.min((xpProgress / nextLevelXP) * 200, 200)}" height="20" rx="10" fill="url(#accentGradient)"/>
  <text x="650" y="175" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
    ${xpProgress}/${nextLevelXP}
  </text>
  
  <!-- Footer -->
  <text x="400" y="485" text-anchor="middle" fill="${cardColor.accent}" font-family="Arial, sans-serif" font-size="12" opacity="0.7">
    ID: ${user.id.slice(-8)} • Généré le ${new Date().toLocaleDateString('fr-FR')}
  </text>
</svg>`;

        return svgCard;
    }
};