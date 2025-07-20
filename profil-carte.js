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
            
            // Charger les données utilisateur avec le même système que economie.js
            const DataManager = require('../managers/DataManager');
            const dataManager = new DataManager();
            
            let userData;
            try {
                userData = await dataManager.getUser(targetUser.id, interaction.guild.id);
            } catch (error) {
                console.error('❌ Erreur DataManager:', error);
                // Fallback: lecture directe
                try {
                    const usersPath = path.join(__dirname, '..', 'data', 'users.json');
                    if (fs.existsSync(usersPath)) {
                        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
                        userData = usersData[targetUser.id] || {};
                    } else {
                        userData = {};
                    }
                } catch (fallbackError) {
                    userData = {};
                }
            }
            
            // Valeurs par défaut compatibles avec le système économie
            userData = Object.assign({
                balance: 0,
                goodKarma: 0,
                badKarma: 0,
                dailyStreak: 0,
                messageCount: 0,
                xp: 0
            }, userData);

            // Calculer les statistiques compatibles avec le système économie
            const karmaNet = (userData.goodKarma || 0) - (userData.badKarma || 0);
            const balance = userData.balance || 0;
            const level = Math.floor((userData.xp || 0) / 1000);
            const nextLevelXP = (level + 1) * 1000;
            const xpProgress = (userData.xp || 0) - (level * 1000);

            // Calculer le niveau karma et la rareté
            const karmaLevel = this.getKarmaLevel(karmaNet);
            const cardRarity = this.getCardRarity(level, karmaNet, balance, userData.dailyStreak || 0);

            // Dates
            const discordJoinDate = targetUser.createdAt.toLocaleDateString('fr-FR');
            const serverJoinDate = member ? member.joinedAt.toLocaleDateString('fr-FR') : 'Inconnu';

            // Créer le SVG
            const svgCard = this.createSVGCard(targetUser, userData, {
                karmaNet, karmaLevel, level, xpProgress, nextLevelXP,
                cardRarity, discordJoinDate, serverJoinDate
            });

            // Convertir SVG en PNG avec Sharp
            const pngBuffer = await sharp(Buffer.from(svgCard))
                .png()
                .resize(500, 800)
                .toBuffer();

            const attachment = new AttachmentBuilder(pngBuffer, {
                name: `profil-${targetUser.username}.png`,
                description: `Carte de profil de ${targetUser.displayName}`
            });

            const embed = new EmbedBuilder()
                .setColor(cardRarity.color || '#00FFFF')
                .setImage(`attachment://profil-${targetUser.username}.png`);

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
        const { karmaNet, karmaLevel, cardRarity } = stats;
        const balance = (userData.balance || 0).toLocaleString();
        const userName = user.displayName.length > 15 ? user.displayName.substring(0, 12) + '...' : user.displayName;

        return `
<svg width="500" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Dégradé principal futuriste animé -->
    <radialGradient id="bgGradient" cx="50%" cy="50%" r="70%">
      <stop offset="0%" style="stop-color:#001122;stop-opacity:1">
        <animate attributeName="stop-color" values="#001122;#002244;#001122" dur="4s" repeatCount="indefinite"/>
      </stop>
      <stop offset="50%" style="stop-color:#003366;stop-opacity:1">
        <animate attributeName="stop-color" values="#003366;#004488;#003366" dur="4s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" style="stop-color:#000000;stop-opacity:1"/>
    </radialGradient>
    
    <!-- Effet glow cyan pulsant -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur">
        <animate attributeName="stdDeviation" values="3;6;3" dur="2s" repeatCount="indefinite"/>
      </feGaussianBlur>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Motif géométrique animé -->
    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#00FFFF" stroke-width="0.5" opacity="0.3">
        <animate attributeName="opacity" values="0.1;0.5;0.1" dur="3s" repeatCount="indefinite"/>
      </path>
    </pattern>
    
    <!-- Dégradé de rareté animé -->
    <linearGradient id="rarityGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${cardRarity.color};stop-opacity:0.8">
        <animate attributeName="stop-opacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite"/>
      </stop>
      <stop offset="50%" style="stop-color:#ffffff;stop-opacity:0.9">
        <animate attributeName="stop-opacity" values="0.5;1.0;0.5" dur="2.5s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" style="stop-color:${cardRarity.color};stop-opacity:0.8">
        <animate attributeName="stop-opacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
    
    <!-- Particules flottantes -->
    <g id="particles">
      <circle r="2" fill="${cardRarity.color}" opacity="0.6">
        <animateTransform attributeName="transform" type="translate" values="100,700;120,100;140,700" dur="8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;0.8;0" dur="8s" repeatCount="indefinite"/>
      </circle>
      <circle r="1.5" fill="${cardRarity.color}" opacity="0.4">
        <animateTransform attributeName="transform" type="translate" values="380,750;360,150;340,750" dur="10s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;0.6;0" dur="10s" repeatCount="indefinite"/>
      </circle>
      <circle r="3" fill="#00FFFF" opacity="0.3">
        <animateTransform attributeName="transform" type="translate" values="200,800;230,200;260,800" dur="12s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;0.7;0" dur="12s" repeatCount="indefinite"/>
      </circle>
    </g>
  </defs>

  <!-- Arrière-plan principal -->
  <rect width="500" height="800" fill="url(#bgGradient)"/>
  <rect width="500" height="800" fill="url(#grid)"/>

  <!-- Bordures futuristes externes animées -->
  <!-- Coins supérieurs avec animations -->
  <path d="M 30 20 L 100 20 L 120 40 L 120 80 L 100 100 L 80 80 L 80 40 L 30 40 Z" 
        fill="none" stroke="#00FFFF" stroke-width="2" filter="url(#glow)">
    <animate attributeName="stroke-width" values="1;3;1" dur="3s" repeatCount="indefinite"/>
  </path>
  <circle cx="120" cy="40" r="6" fill="#00FFFF" filter="url(#glow)">
    <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite"/>
    <animate attributeName="fill" values="#00FFFF;${cardRarity.color};#00FFFF" dur="3s" repeatCount="indefinite"/>
  </circle>
  
  <path d="M 470 20 L 400 20 L 380 40 L 380 80 L 400 100 L 420 80 L 420 40 L 470 40 Z" 
        fill="none" stroke="#00FFFF" stroke-width="2" filter="url(#glow)">
    <animate attributeName="stroke-width" values="1;3;1" dur="3s" repeatCount="indefinite" begin="1s"/>
  </path>
  <circle cx="380" cy="40" r="6" fill="#00FFFF" filter="url(#glow)">
    <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" begin="1s"/>
    <animate attributeName="fill" values="#00FFFF;${cardRarity.color};#00FFFF" dur="3s" repeatCount="indefinite" begin="1s"/>
  </circle>

  <!-- Bordures latérales avec circuits animés -->
  <g stroke="#00FFFF" stroke-width="2" fill="none" filter="url(#glow)">
    <!-- Gauche avec flux d'énergie -->
    <path d="M 20 120 L 20 200 L 40 220 L 40 280 L 20 300 L 20 380 L 40 400 L 40 460 L 20 480 L 20 560 L 40 580 L 40 640 L 20 660 L 20 740">
      <animate attributeName="stroke" values="#00FFFF;${cardRarity.color};#00FFFF" dur="4s" repeatCount="indefinite"/>
    </path>
    <circle cx="20" cy="160" r="4" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1s" repeatCount="indefinite"/>
      <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite"/>
    </circle>
    <circle cx="40" cy="250" r="4" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1s" repeatCount="indefinite" begin="0.2s"/>
      <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" begin="0.2s"/>
    </circle>
    <circle cx="20" cy="340" r="4" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1s" repeatCount="indefinite" begin="0.4s"/>
      <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" begin="0.4s"/>
    </circle>
    <circle cx="40" cy="430" r="4" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1s" repeatCount="indefinite" begin="0.6s"/>
      <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" begin="0.6s"/>
    </circle>
    <circle cx="20" cy="520" r="4" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1s" repeatCount="indefinite" begin="0.8s"/>
      <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" begin="0.8s"/>
    </circle>
    <circle cx="40" cy="610" r="4" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1s" repeatCount="indefinite" begin="1.0s"/>
      <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" begin="1.0s"/>
    </circle>
    
    <!-- Droite avec flux d'énergie -->
    <path d="M 480 120 L 480 200 L 460 220 L 460 280 L 480 300 L 480 380 L 460 400 L 460 460 L 480 480 L 480 560 L 460 580 L 460 640 L 480 660 L 480 740">
      <animate attributeName="stroke" values="${cardRarity.color};#00FFFF;${cardRarity.color}" dur="4s" repeatCount="indefinite"/>
    </path>
    <circle cx="480" cy="160" r="4" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1s" repeatCount="indefinite" begin="1.0s"/>
      <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" begin="1.0s"/>
    </circle>
    <circle cx="460" cy="250" r="4" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1s" repeatCount="indefinite" begin="0.8s"/>
      <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" begin="0.8s"/>
    </circle>
    <circle cx="480" cy="340" r="4" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1s" repeatCount="indefinite" begin="0.6s"/>
      <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" begin="0.6s"/>
    </circle>
    <circle cx="460" cy="430" r="4" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1s" repeatCount="indefinite" begin="0.4s"/>
      <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" begin="0.4s"/>
    </circle>
    <circle cx="480" cy="520" r="4" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1s" repeatCount="indefinite" begin="0.2s"/>
      <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" begin="0.2s"/>
    </circle>
    <circle cx="460" cy="610" r="4" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1s" repeatCount="indefinite"/>
      <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite"/>
    </circle>
  </g>

  <!-- Coins inférieurs -->
  <path d="M 30 780 L 100 780 L 120 760 L 120 720 L 100 700 L 80 720 L 80 760 L 30 760 Z" 
        fill="none" stroke="#00FFFF" stroke-width="2" filter="url(#glow)"/>
  <circle cx="120" cy="760" r="6" fill="#00FFFF" filter="url(#glow)"/>
  
  <path d="M 470 780 L 400 780 L 380 760 L 380 720 L 400 700 L 420 720 L 420 760 L 470 760 Z" 
        fill="none" stroke="#00FFFF" stroke-width="2" filter="url(#glow)"/>
  <circle cx="380" cy="760" r="6" fill="#00FFFF" filter="url(#glow)"/>

  <!-- Particules flottantes -->
  <use href="#particles"/>
  
  <!-- Zone de contenu centrale avec animation -->
  <rect x="80" y="120" width="340" height="560" fill="rgba(0,255,255,0.05)" 
        stroke="#00FFFF" stroke-width="1" rx="10" filter="url(#glow)">
    <animate attributeName="fill" values="rgba(0,255,255,0.05);rgba(0,255,255,0.15);rgba(0,255,255,0.05)" dur="5s" repeatCount="indefinite"/>
    <animate attributeName="stroke-width" values="1;2;1" dur="4s" repeatCount="indefinite"/>
  </rect>

  <!-- Avatar placeholder circulaire animé -->
  <circle cx="250" cy="200" r="50" fill="rgba(0,255,255,0.1)" 
          stroke="#00FFFF" stroke-width="2" filter="url(#glow)">
    <animate attributeName="stroke" values="#00FFFF;${cardRarity.color};#00FFFF" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="stroke-width" values="2;4;2" dur="2s" repeatCount="indefinite"/>
    <animateTransform attributeName="transform" type="rotate" values="0 250 200;5 250 200;-5 250 200;0 250 200" dur="6s" repeatCount="indefinite"/>
  </circle>
  <text x="250" y="210" text-anchor="middle" fill="#00FFFF" 
        font-family="Arial, sans-serif" font-size="40">
    <animate attributeName="fill" values="#00FFFF;${cardRarity.color};#00FFFF" dur="3s" repeatCount="indefinite"/>
    👤
  </text>

  <!-- Nom utilisateur avec effet de frappe -->
  <text x="250" y="280" text-anchor="middle" fill="white" 
        font-family="Arial, sans-serif" font-size="24" font-weight="bold">
    <animate attributeName="fill" values="white;${cardRarity.color};white" dur="4s" repeatCount="indefinite"/>
    <animateTransform attributeName="transform" type="scale" values="1;1.05;1" dur="3s" repeatCount="indefinite"/>
    ${userName}
  </text>
  
  <!-- Rareté avec brillance -->
  <text x="250" y="310" text-anchor="middle" fill="${cardRarity.color}" 
        font-family="Arial, sans-serif" font-size="18" filter="url(#glow)">
    <animate attributeName="fill" values="${cardRarity.color};#ffffff;${cardRarity.color}" dur="2s" repeatCount="indefinite"/>
    <animate attributeName="font-size" values="18;20;18" dur="2s" repeatCount="indefinite"/>
    ${cardRarity.icon} ${cardRarity.name.toUpperCase()} ${cardRarity.icon}
  </text>

  <!-- Section Solde avec animation -->
  <rect x="100" y="340" width="300" height="80" fill="rgba(0,255,255,0.1)" 
        stroke="#00FFFF" stroke-width="1" rx="8">
    <animate attributeName="fill" values="rgba(0,255,255,0.1);rgba(255,215,0,0.2);rgba(0,255,255,0.1)" dur="6s" repeatCount="indefinite"/>
    <animate attributeName="stroke" values="#00FFFF;#FFD700;#00FFFF" dur="6s" repeatCount="indefinite"/>
  </rect>
  <text x="250" y="365" text-anchor="middle" fill="#00FFFF" 
        font-family="Arial, sans-serif" font-size="16" font-weight="bold">
    <animate attributeName="fill" values="#00FFFF;#FFD700;#00FFFF" dur="6s" repeatCount="indefinite"/>
    💰 SOLDE
  </text>
  <text x="250" y="395" text-anchor="middle" fill="white" 
        font-family="Arial, sans-serif" font-size="28" font-weight="bold">
    <animate attributeName="fill" values="white;#FFD700;white" dur="3s" repeatCount="indefinite"/>
    <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="4s" repeatCount="indefinite"/>
    ${balance}€
  </text>

  <!-- Section Karma avec animation -->
  <rect x="100" y="440" width="300" height="100" fill="rgba(0,255,255,0.1)" 
        stroke="#00FFFF" stroke-width="1" rx="8">
    <animate attributeName="fill" values="rgba(0,255,255,0.1);rgba(138,43,226,0.2);rgba(0,255,255,0.1)" dur="7s" repeatCount="indefinite"/>
    <animate attributeName="stroke" values="#00FFFF;#8A2BE2;#00FFFF" dur="7s" repeatCount="indefinite"/>
  </rect>
  <text x="250" y="465" text-anchor="middle" fill="#00FFFF" 
        font-family="Arial, sans-serif" font-size="16" font-weight="bold">
    <animate attributeName="fill" values="#00FFFF;#8A2BE2;#00FFFF" dur="7s" repeatCount="indefinite"/>
    ⚖️ KARMA
  </text>
  <text x="160" y="490" text-anchor="middle" fill="#00ff00" 
        font-family="Arial, sans-serif" font-size="16">
    <animate attributeName="fill" values="#00ff00;#32ff32;#00ff00" dur="2s" repeatCount="indefinite"/>
    <animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="3s" repeatCount="indefinite"/>
    😇 ${userData.goodKarma || 0}
  </text>
  <text x="340" y="490" text-anchor="middle" fill="#ff6666" 
        font-family="Arial, sans-serif" font-size="16">
    <animate attributeName="fill" values="#ff6666;#ff3333;#ff6666" dur="2s" repeatCount="indefinite"/>
    <animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="3s" repeatCount="indefinite" begin="1.5s"/>
    😈 ${userData.badKarma || 0}
  </text>
  <text x="250" y="520" text-anchor="middle" fill="${karmaNet >= 0 ? '#00ff00' : '#ff0000'}" 
        font-family="Arial, sans-serif" font-size="18" font-weight="bold">
    <animate attributeName="fill" values="${karmaNet >= 0 ? '#00ff00;#32ff32;#00ff00' : '#ff0000;#ff3333;#ff0000'}" dur="2.5s" repeatCount="indefinite"/>
    <animateTransform attributeName="transform" type="scale" values="1;1.15;1" dur="3s" repeatCount="indefinite"/>
    Net: ${karmaNet >= 0 ? '+' : ''}${karmaNet}
  </text>

  <!-- Section Dates avec animation -->
  <rect x="100" y="560" width="300" height="80" fill="rgba(0,255,255,0.1)" 
        stroke="#00FFFF" stroke-width="1" rx="8">
    <animate attributeName="fill" values="rgba(0,255,255,0.1);rgba(75,0,130,0.2);rgba(0,255,255,0.1)" dur="8s" repeatCount="indefinite"/>
    <animate attributeName="stroke" values="#00FFFF;#4B0082;#00FFFF" dur="8s" repeatCount="indefinite"/>
  </rect>
  <text x="250" y="585" text-anchor="middle" fill="#00FFFF" 
        font-family="Arial, sans-serif" font-size="16" font-weight="bold">
    <animate attributeName="fill" values="#00FFFF;#4B0082;#00FFFF" dur="8s" repeatCount="indefinite"/>
    📅 DATES
  </text>
  <text x="250" y="605" text-anchor="middle" fill="white" 
        font-family="Arial, sans-serif" font-size="14">
    <animate attributeName="fill" values="white;#DDA0DD;white" dur="4s" repeatCount="indefinite"/>
    Discord: ${stats.discordJoinDate}
  </text>
  <text x="250" y="625" text-anchor="middle" fill="white" 
        font-family="Arial, sans-serif" font-size="14">
    <animate attributeName="fill" values="white;#DDA0DD;white" dur="4s" repeatCount="indefinite" begin="2s"/>
    Serveur: ${stats.serverJoinDate}
  </text>

  <!-- ID utilisateur en bas avec animation -->
  <text x="250" y="720" text-anchor="middle" fill="#666666" 
        font-family="monospace" font-size="12">
    <animate attributeName="fill" values="#666666;#999999;#666666" dur="5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite"/>
    ID: ${user.id.slice(-12)}
  </text>
  
  <!-- Effet de scan final -->
  <rect x="0" y="0" width="500" height="5" fill="url(#rarityGlow)" opacity="0.8">
    <animateTransform attributeName="transform" type="translate" values="0,-10;0,810" dur="10s" repeatCount="indefinite"/>
  </rect>
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