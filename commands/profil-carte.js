const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const sharp = require('sharp');
const https = require('https');
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
            
            console.log(`🎨 Génération carte rapide pour ${targetUser.displayName}`);
            
            // Lecture directe des données (plus rapide)
            let userData = {
                balance: 0,
                goodKarma: 0,
                badKarma: 0,
                dailyStreak: 0,
                xp: 0
            };
            
            try {
                const usersPath = path.join(__dirname, '..', 'data', 'users.json');
                if (fs.existsSync(usersPath)) {
                    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
                    userData = Object.assign(userData, usersData[targetUser.id] || {});
                }
            } catch (error) {
                console.log('⚠️ Données par défaut utilisées');
            }

            // Calculs rapides
            const karmaNet = userData.goodKarma + userData.badKarma;
            let karmaLevel = 'Neutre';
            if (karmaNet >= 50) karmaLevel = 'Saint 😇';
            else if (karmaNet >= 20) karmaLevel = 'Bon 😊';
            else if (karmaNet <= -50) karmaLevel = 'Diabolique 😈';
            else if (karmaNet <= -20) karmaLevel = 'Mauvais 😠';
            
            const level = Math.floor(userData.xp / 1000);
            const cardRarity = this.getCardRarity(level, karmaNet, userData.balance, userData.dailyStreak);
            
            // Dates
            const discordDate = targetUser.createdAt.toLocaleDateString('fr-FR');
            const serverDate = member ? member.joinedAt.toLocaleDateString('fr-FR') : 'Inconnu';

            // Télécharger l'avatar et créer la carte
             const { AttachmentBuilder } = require('discord.js');
const { generateHolographicCard } = require('../utils/cardgenerator');

const user = interaction.user;
const member = interaction.member;

// Récupère les données du membre depuis ta base
const userData = await getUserData(user.id); // balance, karmaGood, karmaBad
const userStats = await getUserStats(user.id); // messageCount

const karmaTotal = userData.karmaGood - userData.karmaBad;

const svg = await generateHolographicCard(user, userData, userStats, member, karmaTotal);

const sharp = require('sharp');
const buffer = await sharp(Buffer.from(svg)).png().toBuffer();

const attachment = new AttachmentBuilder(buffer, { name: 'carte-profil.png' });

await interaction.reply({ files: [attachment] });
        // Nom utilisateur
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(userName, 250, 260);

        // Section Solde
        this.drawSection(ctx, 100, 320, 300, 60, 'rgba(255,215,0,0.1)', '#FFD700');
        ctx.fillStyle = '#FFD700';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('💰 SOLDE', 120, 340);
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${balance}€`, 250, 365);

        // Section Karma
        this.drawSection(ctx, 100, 390, 300, 80, 'rgba(138,43,226,0.1)', '#8A2BE2');
        ctx.fillStyle = '#8A2BE2';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('⚖️ KARMA', 120, 410);
        
        ctx.font = '16px Arial';
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'center';
        ctx.fillText(`😇 ${userData.goodKarma}`, 160, 435);
        
        ctx.fillStyle = '#ff6666';
        ctx.fillText(`😈 ${userData.badKarma}`, 340, 435);
        
        ctx.font = 'bold 17px Arial';
        ctx.fillStyle = karmaNet >= 0 ? '#00ff00' : '#ff0000';
        ctx.fillText(`Net: ${karmaNet >= 0 ? '+' : ''}${karmaNet} (${karmaLevel})`, 250, 460);

        // Section Dates
        this.drawSection(ctx, 100, 480, 300, 80, 'rgba(75,0,130,0.1)', '#4B0082');
        ctx.fillStyle = '#4B0082';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('📅 DATES', 120, 500);
        ctx.fillStyle = '#9370DB';
        ctx.fillText(`Discord: ${discordDate}`, 120, 525);
        ctx.fillText(`Serveur: ${serverDate}`, 120, 550);

        // Section Streak
        this.drawSection(ctx, 100, 570, 300, 60, 'rgba(0,255,0,0.1)', '#00FF00');
        ctx.fillStyle = '#00FF00';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('🔥 STREAK DAILY', 120, 590);
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${userData.dailyStreak} jours`, 250, 615);

        // Rareté
        ctx.fillStyle = cardRarity.color;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${cardRarity.icon} ${cardRarity.name}`, 250, 680);

        // ID utilisateur
        ctx.fillStyle = '#555555';
        ctx.font = '10px monospace';
        ctx.fillText(`ID: ${user.id.slice(-12)}`, 250, 750);

        return canvas;
    },

    drawSection(ctx, x, y, width, height, fillColor, strokeColor) {
        // Convertir la couleur rgba en format Canvas
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    },

    createSVG_OLD(user, userData, stats) {
        const { karmaNet, karmaLevel, cardRarity, discordDate, serverDate } = stats;
        const balance = userData.balance.toLocaleString();
        const userName = user.displayName.length > 18 ? user.displayName.substring(0, 15) + '...' : user.displayName;

        return `
<svg width="500" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGradient" cx="50%" cy="50%" r="80%">
      <stop offset="0%" style="stop-color:#001a33;stop-opacity:1"/>
      <stop offset="50%" style="stop-color:#000d1a;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#000000;stop-opacity:1"/>
    </radialGradient>
    
    <pattern id="xPattern" patternUnits="userSpaceOnUse" width="40" height="40">
      <path d="M0,0 L40,40 M40,0 L0,40" stroke="#00ffff" stroke-width="0.5" opacity="0.1"/>
    </pattern>
    
    <linearGradient id="rarityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${cardRarity.color};stop-opacity:0"/>
      <stop offset="50%" style="stop-color:${cardRarity.color};stop-opacity:0.8"/>
      <stop offset="100%" style="stop-color:${cardRarity.color};stop-opacity:0"/>
    </linearGradient>
    
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <clipPath id="avatarClip">
      <circle cx="250" cy="200" r="40"/>
    </clipPath>
  </defs>

  <!-- Arrière-plan principal -->
  <rect width="500" height="800" fill="url(#bgGradient)"/>
  <rect width="500" height="800" fill="url(#xPattern)"/>

  <!-- Bordures technologiques -->
  <rect x="10" y="10" width="480" height="780" fill="none" 
        stroke="#00ffff" stroke-width="2" opacity="0.3" rx="20"/>
  
  <!-- Coins hexagonaux -->
  <polygon points="30,30 70,30 90,50 70,70 30,70 10,50" 
           fill="none" stroke="${cardRarity.color}" stroke-width="2" opacity="0.6"/>
  <polygon points="430,30 470,30 490,50 470,70 430,70 410,50" 
           fill="none" stroke="${cardRarity.color}" stroke-width="2" opacity="0.6"/>
  <polygon points="30,730 70,730 90,750 70,770 30,770 10,750" 
           fill="none" stroke="${cardRarity.color}" stroke-width="2" opacity="0.6"/>
  <polygon points="430,730 470,730 490,750 470,770 430,770 410,750" 
           fill="none" stroke="${cardRarity.color}" stroke-width="2" opacity="0.6"/>

  <!-- Circuits latéraux -->
  <path d="M20,100 L80,100 L80,120 L20,120 Z M20,140 L80,140 L80,160 L20,160" 
        fill="none" stroke="#00ffff" stroke-width="1" opacity="0.4"/>
  <path d="M420,100 L480,100 L480,120 L420,120 Z M420,140 L480,140 L480,160 L420,160" 
        fill="none" stroke="#00ffff" stroke-width="1" opacity="0.4"/>

  <!-- Zone centrale transparente -->
  <rect x="80" y="300" width="340" height="400" 
        fill="rgba(0,20,40,0.3)" stroke="rgba(0,255,255,0.2)" stroke-width="1" rx="15"/>

  <!-- Avatar placeholder -->
  <circle cx="250" cy="200" r="42" fill="rgba(0,255,255,0.05)" 
          stroke="${cardRarity.color}" stroke-width="3" filter="url(#glow)"/>
  <text x="250" y="210" text-anchor="middle" fill="${cardRarity.color}" 
        font-family="Arial, sans-serif" font-size="36">👤</text>

  <!-- Nom utilisateur -->
  <text x="250" y="260" text-anchor="middle" fill="#ffffff" 
        font-family="Arial, sans-serif" font-size="24" font-weight="bold">${userName}</text>

  <!-- Sections de données -->
  
  <!-- Section Solde -->
  <rect x="100" y="320" width="300" height="60" fill="rgba(255,215,0,0.1)" 
        stroke="#FFD700" stroke-width="1" rx="10"/>
  <text x="120" y="340" fill="#FFD700" font-family="Arial, sans-serif" font-size="14">💰 SOLDE</text>
  <text x="250" y="365" text-anchor="middle" fill="#FFD700" 
        font-family="Arial, sans-serif" font-size="20" font-weight="bold">${balance}€</text>

  <!-- Section Karma -->
  <rect x="100" y="390" width="300" height="80" fill="rgba(138,43,226,0.1)" 
        stroke="#8A2BE2" stroke-width="1" rx="10"/>
  <text x="120" y="410" fill="#8A2BE2" font-family="Arial, sans-serif" font-size="14">⚖️ KARMA</text>
  <text x="160" y="435" text-anchor="middle" fill="#00ff00" 
        font-family="Arial, sans-serif" font-size="16">😇 ${userData.goodKarma}</text>
  <text x="340" y="435" text-anchor="middle" fill="#ff6666" 
        font-family="Arial, sans-serif" font-size="16">😈 ${userData.badKarma}</text>
  <text x="250" y="460" text-anchor="middle" fill="${karmaNet >= 0 ? '#00ff00' : '#ff0000'}" 
        font-family="Arial, sans-serif" font-size="17" font-weight="bold">Net: ${karmaNet >= 0 ? '+' : ''}${karmaNet} (${karmaLevel})</text>

  <!-- Section Dates -->
  <rect x="100" y="480" width="300" height="80" fill="rgba(75,0,130,0.1)" 
        stroke="#4B0082" stroke-width="1" rx="10"/>
  <text x="120" y="500" fill="#4B0082" font-family="Arial, sans-serif" font-size="14">📅 DATES</text>
  <text x="120" y="525" fill="#9370DB" font-family="Arial, sans-serif" font-size="14">Discord: ${discordDate}</text>
  <text x="120" y="550" fill="#9370DB" font-family="Arial, sans-serif" font-size="14">Serveur: ${serverDate}</text>

  <!-- Section Streak -->
  <rect x="100" y="570" width="300" height="60" fill="rgba(0,255,0,0.1)" 
        stroke="#00FF00" stroke-width="1" rx="10"/>
  <text x="120" y="590" fill="#00FF00" font-family="Arial, sans-serif" font-size="14">🔥 STREAK DAILY</text>
  <text x="250" y="615" text-anchor="middle" fill="#00FF00" 
        font-family="Arial, sans-serif" font-size="20" font-weight="bold">${userData.dailyStreak} jours</text>

  <!-- Rareté de carte -->
  <text x="250" y="680" text-anchor="middle" fill="${cardRarity.color}" 
        font-family="Arial, sans-serif" font-size="18" font-weight="bold">${cardRarity.icon} ${cardRarity.name}</text>

  <!-- ID utilisateur -->
  <text x="250" y="750" text-anchor="middle" fill="#555555" 
        font-family="monospace" font-size="10">ID: ${user.id.slice(-12)}</text>
  
  <!-- Ligne de scan -->
  <rect x="80" y="0" width="340" height="3" fill="url(#rarityGradient)" opacity="0.6"/>
</svg>`;
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
