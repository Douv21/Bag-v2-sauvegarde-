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
        const userName = user.displayName.length > 18 ? user.displayName.substring(0, 15) + '...' : user.displayName;

        return `
<svg width="500" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Dégradé arrière-plan sombre -->
    <radialGradient id="bgGradient" cx="50%" cy="50%" r="80%">
      <stop offset="0%" style="stop-color:#001a33;stop-opacity:1">
        <animate attributeName="stop-color" values="#001a33;#002a44;#001a33" dur="5s" repeatCount="indefinite"/>
      </stop>
      <stop offset="50%" style="stop-color:#000d1a;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#000000;stop-opacity:1"/>
    </radialGradient>
    
    <!-- Motif X diagonal -->
    <pattern id="xPattern" width="100" height="100" patternUnits="userSpaceOnUse">
      <path d="M 0 0 L 100 100 M 100 0 L 0 100" stroke="#00FFFF" stroke-width="1" opacity="0.15">
        <animate attributeName="opacity" values="0.05;0.25;0.05" dur="4s" repeatCount="indefinite"/>
      </path>
    </pattern>
    
    <!-- Grille fine -->
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#00FFFF" stroke-width="0.3" opacity="0.1">
        <animate attributeName="opacity" values="0.05;0.15;0.05" dur="6s" repeatCount="indefinite"/>
      </path>
    </pattern>
    
    <!-- Effet glow pour bordures -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur">
        <animate attributeName="stdDeviation" values="2;5;2" dur="3s" repeatCount="indefinite"/>
      </feGaussianBlur>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Dégradé de rareté -->
    <linearGradient id="rarityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${cardRarity.color};stop-opacity:0.8"/>
      <stop offset="50%" style="stop-color:#ffffff;stop-opacity:0.9"/>
      <stop offset="100%" style="stop-color:${cardRarity.color};stop-opacity:0.8"/>
    </linearGradient>
  </defs>

  <!-- Arrière-plan principal -->
  <rect width="500" height="800" fill="url(#bgGradient)"/>
  <rect width="500" height="800" fill="url(#xPattern)"/>
  <rect width="500" height="800" fill="url(#grid)"/>

  <!-- Bordure principale externe -->
  <rect x="20" y="20" width="460" height="760" fill="none" stroke="#00FFFF" stroke-width="2" rx="15" filter="url(#glow)">
    <animate attributeName="stroke" values="#00FFFF;${cardRarity.color};#00FFFF" dur="8s" repeatCount="indefinite"/>
  </rect>

  <!-- Coins technologiques supérieurs -->
  <!-- Coin supérieur gauche -->
  <g filter="url(#glow)">
    <path d="M 40 40 L 80 40 L 100 60 L 100 80 L 80 100 L 60 80 L 60 60 L 40 40" 
          fill="none" stroke="#00FFFF" stroke-width="2">
      <animate attributeName="stroke-width" values="1;3;1" dur="2s" repeatCount="indefinite"/>
    </path>
    <circle cx="70" cy="50" r="4" fill="#00FFFF">
      <animate attributeName="r" values="2;6;2" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="fill" values="#00FFFF;${cardRarity.color};#00FFFF" dur="3s" repeatCount="indefinite"/>
    </circle>
    <circle cx="90" cy="70" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.5s" repeatCount="indefinite"/>
    </circle>
  </g>

  <!-- Coin supérieur droit -->
  <g filter="url(#glow)">
    <path d="M 460 40 L 420 40 L 400 60 L 400 80 L 420 100 L 440 80 L 440 60 L 460 40" 
          fill="none" stroke="#00FFFF" stroke-width="2">
      <animate attributeName="stroke-width" values="1;3;1" dur="2s" repeatCount="indefinite" begin="1s"/>
    </path>
    <circle cx="430" cy="50" r="4" fill="#00FFFF">
      <animate attributeName="r" values="2;6;2" dur="2s" repeatCount="indefinite" begin="1s"/>
      <animate attributeName="fill" values="#00FFFF;${cardRarity.color};#00FFFF" dur="3s" repeatCount="indefinite" begin="1s"/>
    </circle>
    <circle cx="410" cy="70" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.5s" repeatCount="indefinite" begin="1s"/>
    </circle>
  </g>

  <!-- Circuits latéraux complexes -->
  <g filter="url(#glow)">
    <!-- Circuits gauche -->
    <path d="M 30 120 L 30 180 L 50 200 L 50 240 L 30 260 L 30 320 L 50 340 L 50 380 L 30 400 L 30 460 L 50 480 L 50 520 L 30 540 L 30 600 L 50 620 L 50 660 L 30 680" 
          fill="none" stroke="#00FFFF" stroke-width="1.5">
      <animate attributeName="stroke" values="#00FFFF;${cardRarity.color};#00FFFF" dur="5s" repeatCount="indefinite"/>
      <animate attributeName="stroke-width" values="1;2.5;1" dur="3s" repeatCount="indefinite"/>
    </path>
    
    <!-- Connexions gauche -->
    <circle cx="30" cy="150" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="50" cy="220" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite" begin="0.3s"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite" begin="0.3s"/>
    </circle>
    <circle cx="30" cy="290" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite" begin="0.6s"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite" begin="0.6s"/>
    </circle>
    <circle cx="50" cy="360" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite" begin="0.9s"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite" begin="0.9s"/>
    </circle>
    <circle cx="30" cy="430" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite" begin="1.2s"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite" begin="1.2s"/>
    </circle>
    <circle cx="50" cy="500" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite" begin="1.5s"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite" begin="1.5s"/>
    </circle>
    <circle cx="30" cy="570" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite" begin="1.8s"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite" begin="1.8s"/>
    </circle>
    <circle cx="50" cy="640" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite" begin="2.1s"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite" begin="2.1s"/>
    </circle>

    <!-- Circuits droite -->
    <path d="M 470 120 L 470 180 L 450 200 L 450 240 L 470 260 L 470 320 L 450 340 L 450 380 L 470 400 L 470 460 L 450 480 L 450 520 L 470 540 L 470 600 L 450 620 L 450 660 L 470 680" 
          fill="none" stroke="#00FFFF" stroke-width="1.5">
      <animate attributeName="stroke" values="${cardRarity.color};#00FFFF;${cardRarity.color}" dur="5s" repeatCount="indefinite"/>
      <animate attributeName="stroke-width" values="1;2.5;1" dur="3s" repeatCount="indefinite" begin="2.5s"/>
    </path>
    
    <!-- Connexions droite -->
    <circle cx="470" cy="150" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite" begin="2.1s"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite" begin="2.1s"/>
    </circle>
    <circle cx="450" cy="220" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite" begin="1.8s"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite" begin="1.8s"/>
    </circle>
    <circle cx="470" cy="290" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite" begin="1.5s"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite" begin="1.5s"/>
    </circle>
    <circle cx="450" cy="360" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite" begin="1.2s"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite" begin="1.2s"/>
    </circle>
    <circle cx="470" cy="430" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite" begin="0.9s"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite" begin="0.9s"/>
    </circle>
    <circle cx="450" cy="500" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite" begin="0.6s"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite" begin="0.6s"/>
    </circle>
    <circle cx="470" cy="570" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite" begin="0.3s"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite" begin="0.3s"/>
    </circle>
    <circle cx="450" cy="640" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.2s" repeatCount="indefinite"/>
      <animate attributeName="r" values="2;5;2" dur="1.2s" repeatCount="indefinite"/>
    </circle>
  </g>

  <!-- Coins inférieurs -->
  <g filter="url(#glow)">
    <path d="M 40 760 L 80 760 L 100 740 L 100 720 L 80 700 L 60 720 L 60 740 L 40 760" 
          fill="none" stroke="#00FFFF" stroke-width="2">
      <animate attributeName="stroke-width" values="1;3;1" dur="2s" repeatCount="indefinite" begin="2s"/>
    </path>
    <circle cx="70" cy="750" r="4" fill="#00FFFF">
      <animate attributeName="r" values="2;6;2" dur="2s" repeatCount="indefinite" begin="2s"/>
      <animate attributeName="fill" values="#00FFFF;${cardRarity.color};#00FFFF" dur="3s" repeatCount="indefinite" begin="2s"/>
    </circle>
    <circle cx="90" cy="730" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.5s" repeatCount="indefinite" begin="2s"/>
    </circle>
  </g>

  <g filter="url(#glow)">
    <path d="M 460 760 L 420 760 L 400 740 L 400 720 L 420 700 L 440 720 L 440 740 L 460 760" 
          fill="none" stroke="#00FFFF" stroke-width="2">
      <animate attributeName="stroke-width" values="1;3;1" dur="2s" repeatCount="indefinite" begin="3s"/>
    </path>
    <circle cx="430" cy="750" r="4" fill="#00FFFF">
      <animate attributeName="r" values="2;6;2" dur="2s" repeatCount="indefinite" begin="3s"/>
      <animate attributeName="fill" values="#00FFFF;${cardRarity.color};#00FFFF" dur="3s" repeatCount="indefinite" begin="3s"/>
    </circle>
    <circle cx="410" cy="730" r="3" fill="#00FFFF">
      <animate attributeName="fill" values="#00FFFF;#ffffff;#00FFFF" dur="1.5s" repeatCount="indefinite" begin="3s"/>
    </circle>
  </g>
  
  <!-- Zone de contenu centrale -->
  <rect x="80" y="120" width="340" height="560" fill="rgba(0,20,40,0.3)" 
        stroke="#00FFFF" stroke-width="1" rx="10" opacity="0.8">
    <animate attributeName="fill" values="rgba(0,20,40,0.2);rgba(0,40,80,0.4);rgba(0,20,40,0.2)" dur="6s" repeatCount="indefinite"/>
    <animate attributeName="stroke-width" values="0.5;1.5;0.5" dur="4s" repeatCount="indefinite"/>
  </rect>

  <!-- Avatar circulaire -->
  <circle cx="250" cy="200" r="45" fill="rgba(0,255,255,0.1)" 
          stroke="${cardRarity.color}" stroke-width="2" filter="url(#glow)">
    <animate attributeName="stroke" values="${cardRarity.color};#ffffff;${cardRarity.color}" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="stroke-width" values="2;3;2" dur="2s" repeatCount="indefinite"/>
  </circle>
  <text x="250" y="210" text-anchor="middle" fill="${cardRarity.color}" 
        font-family="Arial, sans-serif" font-size="36">
    <animate attributeName="fill" values="${cardRarity.color};#ffffff;${cardRarity.color}" dur="3s" repeatCount="indefinite"/>
    👤
  </text>

  <!-- Nom utilisateur -->
  <text x="250" y="270" text-anchor="middle" fill="white" 
        font-family="Arial, sans-serif" font-size="22" font-weight="bold">
    <animate attributeName="fill" values="white;${cardRarity.color};white" dur="4s" repeatCount="indefinite"/>
    ${userName}
  </text>
  
  <!-- Rareté -->
  <text x="250" y="300" text-anchor="middle" fill="${cardRarity.color}" 
        font-family="Arial, sans-serif" font-size="16" font-weight="bold">
    <animate attributeName="fill" values="${cardRarity.color};#ffffff;${cardRarity.color}" dur="2s" repeatCount="indefinite"/>
    ${cardRarity.icon} ${cardRarity.name.toUpperCase()} ${cardRarity.icon}
  </text>

  <!-- Section Solde -->
  <rect x="100" y="340" width="300" height="70" fill="rgba(0,40,80,0.3)" 
        stroke="#00FFFF" stroke-width="1" rx="5">
    <animate attributeName="fill" values="rgba(0,40,80,0.2);rgba(255,215,0,0.15);rgba(0,40,80,0.2)" dur="6s" repeatCount="indefinite"/>
    <animate attributeName="stroke" values="#00FFFF;#FFD700;#00FFFF" dur="6s" repeatCount="indefinite"/>
  </rect>
  <text x="110" y="360" fill="#FFD700" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
    <animate attributeName="fill" values="#FFD700;#ffffff;#FFD700" dur="3s" repeatCount="indefinite"/>
    💰 SOLDE
  </text>
  <text x="250" y="390" text-anchor="middle" fill="white" 
        font-family="Arial, sans-serif" font-size="24" font-weight="bold">
    <animate attributeName="fill" values="white;#FFD700;white" dur="3s" repeatCount="indefinite"/>
    ${balance}€
  </text>

  <!-- Section Karma -->
  <rect x="100" y="430" width="300" height="90" fill="rgba(0,40,80,0.3)" 
        stroke="#00FFFF" stroke-width="1" rx="5">
    <animate attributeName="fill" values="rgba(0,40,80,0.2);rgba(138,43,226,0.15);rgba(0,40,80,0.2)" dur="7s" repeatCount="indefinite"/>
    <animate attributeName="stroke" values="#00FFFF;#8A2BE2;#00FFFF" dur="7s" repeatCount="indefinite"/>
  </rect>
  <text x="110" y="450" fill="#8A2BE2" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
    <animate attributeName="fill" values="#8A2BE2;#ffffff;#8A2BE2" dur="3s" repeatCount="indefinite"/>
    ⚖️ KARMA
  </text>
  <text x="160" y="475" text-anchor="middle" fill="#00ff00" 
        font-family="Arial, sans-serif" font-size="16">
    <animate attributeName="fill" values="#00ff00;#32ff32;#00ff00" dur="2s" repeatCount="indefinite"/>
    😇 ${userData.goodKarma || 0}
  </text>
  <text x="340" y="475" text-anchor="middle" fill="#ff6666" 
        font-family="Arial, sans-serif" font-size="16">
    <animate attributeName="fill" values="#ff6666;#ff3333;#ff6666" dur="2s" repeatCount="indefinite" begin="1s"/>
    😈 ${userData.badKarma || 0}
  </text>
  <text x="250" y="505" text-anchor="middle" fill="${karmaNet >= 0 ? '#00ff00' : '#ff0000'}" 
        font-family="Arial, sans-serif" font-size="17" font-weight="bold">
    <animate attributeName="fill" values="${karmaNet >= 0 ? '#00ff00;#32ff32;#00ff00' : '#ff0000;#ff3333;#ff0000'}" dur="2.5s" repeatCount="indefinite"/>
    Net: ${karmaNet >= 0 ? '+' : ''}${karmaNet} (${karmaLevel.name})
  </text>

  <!-- Section Dates -->
  <rect x="100" y="540" width="300" height="70" fill="rgba(0,40,80,0.3)" 
        stroke="#00FFFF" stroke-width="1" rx="5">
    <animate attributeName="fill" values="rgba(0,40,80,0.2);rgba(75,0,130,0.15);rgba(0,40,80,0.2)" dur="8s" repeatCount="indefinite"/>
    <animate attributeName="stroke" values="#00FFFF;#4B0082;#00FFFF" dur="8s" repeatCount="indefinite"/>
  </rect>
  <text x="110" y="560" fill="#4B0082" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
    <animate attributeName="fill" values="#4B0082;#ffffff;#4B0082" dur="3s" repeatCount="indefinite"/>
    📅 DATES
  </text>
  <text x="250" y="580" text-anchor="middle" fill="white" 
        font-family="Arial, sans-serif" font-size="13">
    <animate attributeName="fill" values="white;#DDA0DD;white" dur="4s" repeatCount="indefinite"/>
    Discord: ${stats.discordJoinDate}
  </text>
  <text x="250" y="600" text-anchor="middle" fill="white" 
        font-family="Arial, sans-serif" font-size="13">
    <animate attributeName="fill" values="white;#DDA0DD;white" dur="4s" repeatCount="indefinite" begin="2s"/>
    Serveur: ${stats.serverJoinDate}
  </text>

  <!-- Daily Streak -->
  <rect x="100" y="630" width="300" height="40" fill="rgba(0,40,80,0.3)" 
        stroke="#00FFFF" stroke-width="1" rx="5">
    <animate attributeName="fill" values="rgba(0,40,80,0.2);rgba(0,200,100,0.15);rgba(0,40,80,0.2)" dur="5s" repeatCount="indefinite"/>
  </rect>
  <text x="250" y="655" text-anchor="middle" fill="#00ff88" 
        font-family="Arial, sans-serif" font-size="14" font-weight="bold">
    <animate attributeName="fill" values="#00ff88;#ffffff;#00ff88" dur="2s" repeatCount="indefinite"/>
    🔥 Streak: ${userData.dailyStreak || 0} jours
  </text>

  <!-- ID utilisateur -->
  <text x="250" y="720" text-anchor="middle" fill="#555555" 
        font-family="monospace" font-size="10">
    <animate attributeName="fill" values="#555555;#888888;#555555" dur="5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite"/>
    ID: ${user.id.slice(-12)}
  </text>
  
  <!-- Ligne de scan finale -->
  <rect x="80" y="0" width="340" height="3" fill="url(#rarityGradient)" opacity="0.6">
    <animateTransform attributeName="transform" type="translate" values="0,-5;0,810" dur="12s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0;0.8;0" dur="12s" repeatCount="indefinite"/>
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