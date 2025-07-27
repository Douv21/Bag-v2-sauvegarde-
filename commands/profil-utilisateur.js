const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil-utilisateur')
    .setDescription('Profil utilisateur avec carte personnalisée.')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('Le membre dont vous voulez voir la carte (laisser vide pour soi-même)')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Gestion robuste des interactions Discord
    let isDeferred = false;
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.deferReply();
        isDeferred = true;
      }
    } catch (error) {
      console.log('⚠️ Interaction déjà traitée, continuation...');
    }

    try {
      const dataManager = require('../utils/simpleDataManager');
      const levelManager = require('../utils/levelManager');
      const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
      const targetMember = interaction.options.getMember('utilisateur') || interaction.member;
      const targetId = targetUser.id;
      const guildId = interaction.guildId;

      // Charger tous les fichiers de données possibles
      const economyData = dataManager.getUser(targetId, guildId);
      const levelData = levelManager.getUserLevel(targetId, guildId);
      
      // Chercher aussi dans les autres sources de données économiques avec les bons formats de clés
      let alternateEconomyData = {};
      try {
        const economyFile = require('../data/economy.json');
        // Format: userID_guildID dans economy.json
        const economyKey = `${targetId}_${guildId}`;
        alternateEconomyData = economyFile[economyKey] || {};
        console.log(`📊 Economy Key: ${economyKey}`, alternateEconomyData);
      } catch (e) {
        console.log('📁 economy.json non trouvé');
      }
      
      // Récupérer les vraies valeurs avec priorité aux sources les plus récentes
      const balance = alternateEconomyData.balance || economyData.balance || 0;
      const goodKarma = alternateEconomyData.goodKarma || economyData.goodKarma || 0;
      const badKarma = alternateEconomyData.badKarma || economyData.badKarma || 0;
      const karmaNet = goodKarma - badKarma;
      
      // Priorité aux données alternates (economy.json) qui sont les plus à jour
      const messageCount = alternateEconomyData.messageCount || levelData.totalMessages || levelData.messageCount || economyData.messageCount || 0;
      const timeInVocal = alternateEconomyData.timeInVocal || levelData.totalVoiceTime || levelData.voiceTime || economyData.timeInVocal || 0;
      const level = levelData.level || alternateEconomyData.level || economyData.level || 0;
      
      console.log(`🎯 Valeurs finales: Balance=${balance}, Karma=${goodKarma}/${badKarma}, Messages=${messageCount}, Vocal=${timeInVocal}, Level=${level}`);

      console.log(`🔍 PROFIL-CARTE - ${targetUser.username}:`);
      console.log(`   DataManager Economy:`, JSON.stringify(economyData, null, 2));
      console.log(`   Alternate Economy:`, JSON.stringify(alternateEconomyData, null, 2));
      console.log(`   Level Data:`, JSON.stringify(levelData, null, 2));
      console.log(`   🎯 Valeurs finales: Balance=${balance}, Karma=${goodKarma}/${badKarma}, Messages=${messageCount}, Vocal=${timeInVocal}, Level=${level}`);

      let karmaLevel = `Neutre (${karmaNet})`;
      if (karmaNet >= 50) karmaLevel = `Saint 😇 (${karmaNet})`;
      else if (karmaNet >= 20) karmaLevel = `Bon 😊 (${karmaNet})`;
      else if (karmaNet <= -50) karmaLevel = `Diabolique 😈 (${karmaNet})`;
      else if (karmaNet <= -20) karmaLevel = `Mauvais 😠 (${karmaNet})`;

      const inscriptionDate = new Date(targetUser.createdTimestamp).toLocaleDateString('fr-FR');
      const arriveeDate = new Date(targetMember.joinedTimestamp).toLocaleDateString('fr-FR');

      // Récupérer le rôle configuré pour le niveau de l'utilisateur
      let levelRole = null;
      let levelRoleColor = '#ff88ff'; // Couleur par défaut
      try {
        const levelRoleInfo = levelManager.getRoleForLevel(level, interaction.guild);
        if (levelRoleInfo && levelRoleInfo.roleName) {
          levelRole = levelRoleInfo.roleName;
          
          // Récupérer la couleur du rôle depuis Discord
          const discordRole = interaction.guild.roles.cache.get(levelRoleInfo.roleId);
          if (discordRole && discordRole.hexColor && discordRole.hexColor !== '#000000') {
            levelRoleColor = discordRole.hexColor;
          }
          
          console.log(`🎭 Rôle de niveau trouvé: ${levelRole} (niveau ${levelRoleInfo.level}) couleur: ${levelRoleColor}`);
        }
      } catch (error) {
        console.log('⚠️ Erreur récupération rôle de niveau:', error);
      }

      // Détection des rôles pour image de fond
      let backgroundImageName = '1_1753517381716.jpg'; // Image par défaut
      const userRoles = targetMember.roles.cache.map(role => role.name.toLowerCase());
      
      if (userRoles.includes('certifié')) {
        backgroundImageName = '3_1753521071380.png';
        console.log('🎨 Utilisation image certifié (3_1753521071380.png) pour la carte');
      } else if (userRoles.includes('femme')) {
        backgroundImageName = '2_1753521071482.png';
        console.log('🎨 Utilisation image femme (2_1753521071482.png) pour la carte');
      } else {
        console.log('🎨 Utilisation image par défaut (1_1753517381716.jpg) pour la carte');
      }

      // Charger l'image de fond depuis attached_assets
      let backgroundImageBase64 = '';
      try {
        const imagePath = path.join(__dirname, '../../attached_assets', backgroundImageName);
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          backgroundImageBase64 = imageBuffer.toString('base64');
          const imageFormat = backgroundImageName.includes('.png') ? 'png' : 'jpg';
          backgroundImageBase64 = `data:image/${imageFormat};base64,${backgroundImageBase64}`;
          console.log(`✅ Image de fond chargée: ${backgroundImageBase64.length} chars (${backgroundImageName})`);
        } else {
          console.log(`⚠️ Image de fond non trouvée: ${imagePath}`);
        }
      } catch (error) {
        console.log('⚠️ Erreur chargement image de fond:', error.message);
      }

      // Récupérer l'avatar avec priorité serveur > global et forcer le format PNG
      const serverAvatar = targetMember.displayAvatarURL?.({ format: 'png', size: 256 }) || null;
      const globalAvatar = targetUser.displayAvatarURL?.({ format: 'png', size: 256 }) || null;
      
      // Convertir les URL webp en PNG si nécessaire
      let finalAvatar = serverAvatar || globalAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
      if (finalAvatar && finalAvatar.includes('.webp')) {
          finalAvatar = finalAvatar.replace('.webp', '.png');
      }
      
      console.log(`🖼️ Avatar final sélectionné pour profil:`, finalAvatar);
      
      // Télécharger et encoder l'avatar en base64 pour l'intégrer directement dans le SVG
      let avatarBase64 = '';
      try {
          if (finalAvatar && finalAvatar.startsWith('http')) {
              const avatarData = await new Promise((resolve, reject) => {
                  https.get(finalAvatar, (response) => {
                      let data = Buffer.alloc(0);
                      response.on('data', (chunk) => {
                          data = Buffer.concat([data, chunk]);
                      });
                      response.on('end', () => {
                          resolve(data);
                      });
                  }).on('error', (err) => {
                      console.log('⚠️ Erreur téléchargement avatar profil:', err);
                      reject(err);
                  });
              });
              avatarBase64 = `data:image/png;base64,${avatarData.toString('base64')}`;
              console.log(`✅ Avatar profil téléchargé et encodé en base64: ${avatarBase64.length} chars`);
          }
      } catch (error) {
          console.log('⚠️ Impossible de télécharger avatar profil, utilisation avatar par défaut');
          avatarBase64 = 'https://cdn.discordapp.com/embed/avatars/0.png';
      }
      
      const avatarHref = avatarBase64 || 'https://cdn.discordapp.com/embed/avatars/0.png';

      // Utiliser l'image de fond chargée basée sur les rôles ou créer un arrière-plan holographique
      let bgHref = backgroundImageBase64;
      
      if (!backgroundImageBase64) {
        // Créer un arrière-plan holographique en SVG si aucune image n'est chargée
        const holoBg = `
          <defs>
            <linearGradient id="holographicBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#0a0a2a;stop-opacity:1"/>
              <stop offset="25%" style="stop-color:#1e1e4a;stop-opacity:1"/>
              <stop offset="50%" style="stop-color:#2a2a6a;stop-opacity:1"/>
              <stop offset="75%" style="stop-color:#1a1a3a;stop-opacity:1"/>
              <stop offset="100%" style="stop-color:#0a0a1a;stop-opacity:1"/>
            </linearGradient>
            <pattern id="holoPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="none"/>
              <line x1="0" y1="0" x2="40" y2="40" stroke="#00ffff" stroke-width="0.5" opacity="0.3"/>
              <line x1="40" y1="0" x2="0" y2="40" stroke="#ff00ff" stroke-width="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="800" height="400" fill="url(#holographicBg)"/>
          <rect width="800" height="400" fill="url(#holoPattern)"/>`;
        bgHref = holoBg;
      }

      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="circleView">
      <circle cx="150" cy="200" r="60"/>
    </clipPath>
    <filter id="textGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    ${bgHref.includes('data:image') ? '' : bgHref}
  </defs>
  ${bgHref.includes('data:image') ? `<image href="${bgHref}" x="0" y="0" width="800" height="400" preserveAspectRatio="xMidYMid slice"/>` : ''}
  
  <!-- Avatar déplacé plus à gauche -->
  <circle cx="150" cy="200" r="85" fill="#00ffff" opacity="0.8" filter="url(#textGlow)"/>
  <circle cx="150" cy="200" r="80" fill="#000000" stroke="#00ffff" stroke-width="3"/>
  <image href="${avatarHref}" x="90" y="140" width="120" height="120" clip-path="url(#circleView)"/>
  
  <!-- Titre centré en haut -->
  <text x="400" y="40" text-anchor="middle" fill="#00ffff" font-size="24" font-family="Arial Black" font-weight="bold" filter="url(#textGlow)">PROFIL UTILISATEUR</text>
  <text x="400" y="65" text-anchor="middle" fill="#ffffff" font-size="18" font-family="Arial" filter="url(#textGlow)">${targetUser.username}</text>
  
  <!-- Informations décalées plus à droite avec couleurs améliorées -->
  <!-- Colonne gauche -->
  <text x="360" y="130" text-anchor="middle" fill="#ffff00" font-size="16" font-family="Arial Black" font-weight="bold" filter="url(#textGlow)">💰 Solde: ${balance}€</text>
  <text x="360" y="155" text-anchor="middle" fill="#00ffaa" font-size="16" font-family="Arial Black" font-weight="bold" filter="url(#textGlow)">📊 Niveau: ${level}</text>
  <text x="360" y="180" text-anchor="middle" fill="#ffaa00" font-size="16" font-family="Arial Black" font-weight="bold" filter="url(#textGlow)">💬 Messages: ${messageCount}</text>
  
  <!-- Colonne droite -->
  <text x="540" y="130" text-anchor="middle" fill="#ff88ff" font-size="16" font-family="Arial Black" font-weight="bold" filter="url(#textGlow)">🎤 Vocal: ${(timeInVocal / 3600).toFixed(1)}h</text>
  <text x="540" y="155" text-anchor="middle" fill="#ffaa00" font-size="16" font-family="Arial Black" font-weight="bold" filter="url(#textGlow)">⚖️ Karma</text>
  <text x="540" y="180" text-anchor="middle" fill="#88ff88" font-size="15" font-family="Arial Black" font-weight="bold" filter="url(#textGlow)">😇 Bon: ${goodKarma}</text>
  <text x="540" y="200" text-anchor="middle" fill="#ff6666" font-size="15" font-family="Arial Black" font-weight="bold" filter="url(#textGlow)">😈 Mauvais: ${badKarma}</text>
  
  <!-- Section centrale en bas -->
  <text x="450" y="250" text-anchor="middle" fill="#ffffff" font-size="15" font-family="Arial Black" font-weight="bold" filter="url(#textGlow)">${karmaLevel}</text>
  <text x="450" y="280" text-anchor="middle" fill="#ffee88" font-size="13" font-family="Arial Black" font-weight="bold" filter="url(#textGlow)">📅 Discord: ${inscriptionDate}</text>
  <text x="450" y="300" text-anchor="middle" fill="#ffee88" font-size="13" font-family="Arial Black" font-weight="bold" filter="url(#textGlow)">🏠 Serveur: ${arriveeDate}</text>
  
  <!-- ID en bas centré -->
  <text x="400" y="350" text-anchor="middle" fill="#888888" font-size="12" font-family="Arial" filter="url(#textGlow)">ID: ${targetId}</text>
  
  <!-- Rôle de niveau en bas -->
  <line x1="50" y1="370" x2="750" y2="370" stroke="#00ffff" stroke-width="2" opacity="0.6" filter="url(#textGlow)"/>
  ${levelRole ? `<text x="400" y="390" text-anchor="middle" fill="${levelRoleColor}" font-size="20" font-family="Arial Black" font-weight="bold" filter="url(#textGlow)">🎭 ${levelRole} 🎭</text>` : ''}
</svg>`;

      const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
      const attachment = new AttachmentBuilder(buffer, { name: 'profil-utilisateur.png' });

      // Envoi sécurisé de la carte
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ files: [attachment] });
        } else {
          await interaction.reply({ files: [attachment] });
        }
        console.log('✅ Profil utilisateur envoyé avec succès pour:', targetUser.username);
      } catch (replyError) {
        console.log('⚠️ Erreur envoi carte, tentative alternative...');
        // En cas d'erreur, ne pas essayer d'autres méthodes qui pourraient également échouer
        console.error('❌ Impossible d\'envoyer la carte:', replyError.message);
      }

    } catch (err) {
      console.error('❌ Erreur dans /profil-utilisateur :', err);
      // Ne pas essayer d'envoyer de message d'erreur en cas de problème d'interaction
      console.log('❌ Génération de profil échouée pour', interaction.user?.username || 'utilisateur inconnu');
    }
  }
};