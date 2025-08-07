const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil-carte')
    .setDescription('Génère une carte de profil personnalisée.')
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
      const dataManager = require('../utils/dataManager');
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

      const avatarUrl = targetUser.displayAvatarURL({ format: 'png', size: 128 });
      
      // Télécharger l'avatar avec HTTPS natif
      let avatarBase64 = '';
      try {
        const avatarBuffer = await new Promise((resolve, reject) => {
          https.get(avatarUrl, (response) => {
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
          }).on('error', reject);
        });
        avatarBase64 = avatarBuffer.toString('base64');
      } catch (error) {
        console.error('❌ Erreur téléchargement avatar:', error);
        // Utiliser un avatar par défaut en cas d'erreur
        avatarBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      }
      
      const avatarHref = `data:image/png;base64,${avatarBase64}`;

      // Vérifier si l'image de fond existe, sinon utiliser un SVG holographique
      const bgPath = path.join(__dirname, '1.jpg');
      let bgHref = '';
      
      if (fs.existsSync(bgPath)) {
        const bgImage = fs.readFileSync(bgPath).toString('base64');
        bgHref = `data:image/jpeg;base64,${bgImage}`;
      } else {
        // Créer un arrière-plan holographique en SVG
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
      <circle cx="700" cy="100" r="60"/>
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
  <image href="${avatarHref}" x="640" y="40" width="120" height="120" clip-path="url(#circleView)"/>
  <text x="400" y="60" text-anchor="middle" fill="#00ffff" font-size="24" font-family="Arial" filter="url(#textGlow)">HOLOGRAPHIC CARD</text>
  <text x="50" y="120" fill="#ffffff" font-size="16" font-family="Arial" filter="url(#textGlow)">Utilisateur : ${targetUser.username}</text>
  <text x="50" y="150" fill="#00ff88" font-size="14" font-family="Arial" filter="url(#textGlow)">ID : ${targetId}</text>
  <text x="50" y="180" fill="#ffff00" font-size="14" font-family="Arial" filter="url(#textGlow)">Messages : ${messageCount}</text>
  <text x="50" y="210" fill="#00ff00" font-size="14" font-family="Arial" filter="url(#textGlow)">Plaisir : ${balance}💋</text>
  <text x="50" y="240" fill="#ff6600" font-size="14" font-family="Arial" filter="url(#textGlow)">Karma + : ${goodKarma} | - : ${badKarma}</text>
  <text x="50" y="270" fill="#cc33ff" font-size="14" font-family="Arial" filter="url(#textGlow)">Vocal : ${(timeInVocal / 3600).toFixed(1)} h</text>
  <text x="50" y="300" fill="#00ccff" font-size="12" font-family="Arial" filter="url(#textGlow)">Inscription : ${inscriptionDate}</text>
  <text x="50" y="320" fill="#00ccff" font-size="12" font-family="Arial" filter="url(#textGlow)">Serveur : ${arriveeDate}</text>
  <text x="50" y="350" fill="#ffaa00" font-size="14" font-family="Arial" filter="url(#textGlow)">Niveau : ${level}</text>
  <text x="50" y="370" fill="#ff00aa" font-size="14" font-family="Arial" filter="url(#textGlow)">État karmique : ${karmaLevel}</text>
</svg>`;

      const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
      const attachment = new AttachmentBuilder(buffer, { name: 'carte-profil.png' });

      // Envoi sécurisé de la carte
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ files: [attachment] });
        } else {
          await interaction.reply({ files: [attachment] });
        }
        console.log('✅ Carte profil envoyée avec succès');
      } catch (replyError) {
        console.log('⚠️ Erreur envoi carte, tentative alternative...');
        // En cas d'erreur, ne pas essayer d'autres méthodes qui pourraient également échouer
        console.error('❌ Impossible d\'envoyer la carte:', replyError.message);
      }

    } catch (err) {
      console.error('❌ Erreur dans /profil-carte :', err);
      // Ne pas essayer d'envoyer de message d'erreur en cas de problème d'interaction
      console.log('❌ Génération de carte échouée pour', interaction.user?.username || 'utilisateur inconnu');
    }
  }
};