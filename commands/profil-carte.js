const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profil-carte')
        .setDescription('Affiche votre profil utilisateur avec carte visuelle PNG')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('Utilisateur dont afficher le profil (optionnel)')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: 64 });

            const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
            const member = interaction.guild?.members.cache.get(targetUser.id);
            
            // Charger les données utilisateur
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

            // Calculer le niveau karma et la rareté
            const karmaLevel = this.getKarmaLevel(karmaNet);
            const cardRarity = this.getCardRarity(level, karmaNet, balance, userData.dailyStreak || 0);

            // Dates
            const discordJoinDate = targetUser.createdAt.toLocaleDateString('fr-FR');
            const serverJoinDate = member ? member.joinedAt.toLocaleDateString('fr-FR') : 'Inconnu';

            // Créer le SVG
            const svgCard = this.createSVGCard(targetUser, userData, {
                karmaNet, karmaLevel, level, xpProgress, nextLevelXP,
                cardRarity, totalActions, discordJoinDate, serverJoinDate
            });

            // Convertir SVG en PNG avec Sharp
            const pngBuffer = await sharp(Buffer.from(svgCard))
                .png()
                .resize(800, 600)
                .toBuffer();

            const attachment = new AttachmentBuilder(pngBuffer, {
                name: `profil-${targetUser.username}.png`,
                description: `Carte de profil de ${targetUser.displayName}`
            });

            const embed = new EmbedBuilder()
                .setColor(cardRarity.color || '#00FFFF')
                .setTitle(`${cardRarity.icon} Carte Profil - ${targetUser.displayName}`)
                .setDescription(`Carte de profil générée avec succès !`)
                .setImage(`attachment://profil-${targetUser.username}.png`)
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
                    }
                ])
                .setFooter({ 
                    text: `Carte générée • ${new Date().toLocaleDateString('fr-FR')}`,
                    iconURL: targetUser.displayAvatarURL() 
                });

            await interaction.editReply({
                embeds: [embed],
                files: [attachment]
            });

        } catch (error) {
            console.error('❌ Erreur profil-carte:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de la génération de la carte.'
            });
        }
    },

    createSVGCard(user, userData, stats) {
        const { karmaNet, karmaLevel, level, cardRarity, totalActions } = stats;
        const balance = (userData.balance || 0).toLocaleString();
        const karmaGood = userData.karmaGood || 0;
        const karmaBad = userData.karmaBad || 0;
        const userName = user.displayName.length > 20 ? user.displayName.substring(0, 17) + '...' : user.displayName;

        // Créer la barre de progression XP
        const progressPercent = (stats.xpProgress / stats.nextLevelXP) * 100;

        return `
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <!-- Arrière-plan avec dégradé -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${cardRarity.color || '#00FFFF'};stop-opacity:0.2" />
      <stop offset="100%" style="stop-color:#000033;stop-opacity:0.9" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Arrière-plan -->
  <rect width="800" height="600" fill="url(#bgGradient)" rx="20"/>
  
  <!-- Bordure principale -->
  <rect x="20" y="20" width="760" height="560" fill="none" stroke="${cardRarity.color || '#00FFFF'}" stroke-width="3" rx="15" filter="url(#glow)"/>
  
  <!-- Titre de la carte -->
  <text x="400" y="70" text-anchor="middle" fill="${cardRarity.color || '#00FFFF'}" font-family="Arial, sans-serif" font-size="32" font-weight="bold" filter="url(#glow)">
    ${cardRarity.icon} CARTE PROFIL ${cardRarity.icon}
  </text>
  
  <!-- Nom utilisateur et rareté -->
  <text x="400" y="110" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
    ${cardRarity.name.toUpperCase()} • ${userName}
  </text>
  
  <!-- Section Solde -->
  <rect x="50" y="140" width="300" height="120" fill="rgba(0,255,255,0.1)" stroke="${cardRarity.color || '#00FFFF'}" stroke-width="2" rx="10"/>
  <text x="60" y="170" fill="${cardRarity.color || '#00FFFF'}" font-family="Arial, sans-serif" font-size="20" font-weight="bold">💰 SOLDE</text>
  <text x="60" y="200" fill="white" font-family="Arial, sans-serif" font-size="32" font-weight="bold">${balance}€</text>
  <text x="60" y="230" fill="#cccccc" font-family="Arial, sans-serif" font-size="16">Niveau ${level}</text>
  
  <!-- Section Karma -->
  <rect x="450" y="140" width="300" height="120" fill="rgba(0,255,255,0.1)" stroke="${cardRarity.color || '#00FFFF'}" stroke-width="2" rx="10"/>
  <text x="460" y="170" fill="${cardRarity.color || '#00FFFF'}" font-family="Arial, sans-serif" font-size="20" font-weight="bold">⚖️ KARMA</text>
  <text x="460" y="200" fill="white" font-family="Arial, sans-serif" font-size="18">😇 Positif: ${karmaGood}</text>
  <text x="460" y="225" fill="white" font-family="Arial, sans-serif" font-size="18">😈 Négatif: ${karmaBad}</text>
  <text x="460" y="250" fill="${karmaNet >= 0 ? '#00ff00' : '#ff0000'}" font-family="Arial, sans-serif" font-size="16" font-weight="bold">Net: ${karmaNet >= 0 ? '+' : ''}${karmaNet} (${karmaLevel.name})</text>
  
  <!-- Section Statistiques -->
  <rect x="50" y="280" width="700" height="100" fill="rgba(0,255,255,0.1)" stroke="${cardRarity.color || '#00FFFF'}" stroke-width="2" rx="10"/>
  <text x="60" y="310" fill="${cardRarity.color || '#00FFFF'}" font-family="Arial, sans-serif" font-size="20" font-weight="bold">🏆 STATISTIQUES</text>
  <text x="60" y="340" fill="white" font-family="Arial, sans-serif" font-size="16">🎯 Actions: ${totalActions} • 🔥 Streak: ${userData.dailyStreak || 0} • 💬 Messages: ${userData.messageCount || 0}</text>
  <text x="60" y="365" fill="white" font-family="Arial, sans-serif" font-size="16">🌐 Discord: ${stats.discordJoinDate} • 🏠 Serveur: ${stats.serverJoinDate}</text>
  
  <!-- Barre de progression XP -->
  <rect x="50" y="400" width="700" height="40" fill="rgba(0,0,0,0.5)" stroke="${cardRarity.color || '#00FFFF'}" stroke-width="2" rx="20"/>
  <rect x="50" y="400" width="${progressPercent * 7}" height="40" fill="${cardRarity.color || '#00FFFF'}" rx="20"/>
  <text x="400" y="425" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
    ${stats.xpProgress}/${stats.nextLevelXP} XP
  </text>
  
  <!-- Footer avec ID -->
  <text x="400" y="570" text-anchor="middle" fill="#888888" font-family="Arial, sans-serif" font-size="14">
    ID: ${user.id.slice(-8)} • Généré le ${new Date().toLocaleDateString('fr-FR')} • ${cardRarity.icon} ${cardRarity.name} ${cardRarity.icon}
  </text>
</svg>`;
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