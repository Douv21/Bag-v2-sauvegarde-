const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const sharp = require('sharp');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil-carte')
    .setDescription('Génère une carte de profil personnalisée.'),

  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.user;
    const member = interaction.member;

    // Chargement des données utilisateur depuis users.json
    const usersPath = path.join(__dirname, '..', 'data', 'user_stats.json);
    let userData = {
  balance: 999,
  goodKarma: 77,
  badKarma: -22,
  messageCount: 444,
  timeInVocal: 7320, // 2h02
  xp: 3000
};
    };

    try {
      if (fs.existsSync(usersPath)) {
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        userData = Object.assign(userData, usersData[user.id] || {});
      }
    } catch (error) {
      console.error('Erreur lors de la lecture de users.json :', error);
    }

    // Statistiques dérivées
    const karmaNet = userData.goodKarma + userData.badKarma;
    let karmaLevel = 'Neutre';
    if (karmaNet >= 50) karmaLevel = 'Saint 😇';
    else if (karmaNet >= 20) karmaLevel = 'Bon 😊';
    else if (karmaNet <= -50) karmaLevel = 'Diabolique 😈';
    else if (karmaNet <= -20) karmaLevel = 'Mauvais 😠';

    const level = Math.floor(userData.xp / 1000);
    const inscriptionDate = new Date(user.createdTimestamp).toLocaleDateString('fr-FR');
    const arriveeDate = new Date(member.joinedTimestamp).toLocaleDateString('fr-FR');

    // Conversion du temps vocal en heures/minutes
    const totalSeconds = userData.timeInVocal || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const vocalTime = `${hours}h ${minutes}m`;

    // Avatar et fond
    const avatarUrl = user.displayAvatarURL({ format: 'png', size: 128 });
    const avatarBuffer = await fetch(avatarUrl).then(res => res.buffer());
    const avatarHref = `data:image/png;base64,${avatarBuffer.toString('base64')}`;

    const bgPath = path.join(__dirname, '1.jpg');
    const bgHref = `data:image/jpeg;base64,${fs.readFileSync(bgPath).toString('base64')}`;

    // Carte SVG
    const width = 800;
    const height = 400;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
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
  </defs>
  <image href="${bgHref}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
  <image href="${avatarHref}" x="640" y="40" width="120" height="120" clip-path="url(#circleView)"/>
  <text x="400" y="60" text-anchor="middle" fill="#00ffff" font-size="24" font-family="Arial" filter="url(#textGlow)">CARTE DE PROFIL</text>

  <text x="50" y="120" fill="#ffffff" font-size="16" font-family="Arial" filter="url(#textGlow)">Utilisateur : ${user.username}</text>
  <text x="50" y="150" fill="#00ff88" font-size="14" font-family="Arial" filter="url(#textGlow)">ID : ${user.id.substring(0, 10)}...</text>
  <text x="50" y="180" fill="#ffff00" font-size="14" font-family="Arial" filter="url(#textGlow)">Messages : ${userData.messageCount}</text>
  <text x="50" y="210" fill="#00ff00" font-size="14" font-family="Arial" filter="url(#textGlow)">Solde : ${userData.balance}€</text>
  <text x="50" y="240" fill="#ff6600" font-size="14" font-family="Arial" filter="url(#textGlow)">Karma + : ${userData.goodKarma} | - : ${userData.badKarma}</text>
  <text x="50" y="270" fill="#ff66ff" font-size="14" font-family="Arial" filter="url(#textGlow)">Vocal : ${vocalTime}</text>
  <text x="50" y="290" fill="#00ccff" font-size="12" font-family="Arial" filter="url(#textGlow)">Inscription : ${inscriptionDate}</text>
  <text x="50" y="310" fill="#00ccff" font-size="12" font-family="Arial" filter="url(#textGlow)">Serveur : ${arriveeDate}</text>
</svg>`;

    // Transformation SVG -> PNG
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const attachment = new AttachmentBuilder(buffer, { name: 'carte-profil.png' });

    // Envoi du résultat
    await interaction.editReply({ files: [attachment] });
  }
};
