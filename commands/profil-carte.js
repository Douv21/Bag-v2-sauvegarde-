const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const sharp = require('sharp');

// Fonction pour échapper les caractères XML
function escapeXML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil-carte')
    .setDescription('Génère une carte de profil stylisée.'),

  async execute(interaction) {
    await interaction.deferReply(); // Évite l'erreur DiscordAPIError[40060]

    const user = interaction.user;
    const member = interaction.member;

    // Données simulées (remplace avec ta BDD)
    const userData = {
      balance: 1500,
      karmaGood: 12,
      karmaBad: 3
    };

    const userStats = {
      messageCount: 420
    };

    const karmaTotal = userData.karmaGood - userData.karmaBad;
    const width = 900;
    const height = 500;

    const inscriptionDate = new Date(user.createdTimestamp).toLocaleDateString('fr-FR');
    const arriveeDate = new Date(member.joinedTimestamp).toLocaleDateString('fr-FR');

    // Récupération de l'avatar
    const avatarUrl = user.displayAvatarURL({ format: 'png', size: 256 });
    const avatarBuffer = await fetch(avatarUrl).then(res => res.buffer());
    const avatarBase64 = avatarBuffer.toString('base64');
    const avatarHref = `data:image/png;base64,${avatarBase64}`;

    // Fond personnalisé
    const bgPath = path.join(__dirname, '1.jpg'); // Mets ton fond premium
    const bgImage = fs.readFileSync(bgPath).toString('base64');
    const bgHref = `data:image/jpeg;base64,${bgImage}`;

    // SVG Premium
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="avatarCircle">
          <circle cx="750" cy="120" r="80"/>
        </clipPath>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1a1a2e"/>
          <stop offset="100%" stop-color="#16213e"/>
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600&display=swap');
          .title {
            font-family: 'Orbitron', sans-serif;
            font-size: 45px;
            fill: #00f7ff;
            filter: url(#glow);
          }
          .info {
            font-family: 'Orbitron', sans-serif;
            font-size: 22px;
            fill: #ffffff;
          }
          .label {
            font-size: 18px;
          }
        </style>
      </defs>

      <!-- Fond -->
      <rect width="100%" height="100%" fill="url(#bgGradient)"/>
      <image href="${bgHref}" x="0" y="0" width="${width}" height="${height}" opacity="0.25" preserveAspectRatio="xMidYMid slice"/>
      
      <!-- Avatar -->
      <image href="${avatarHref}" x="670" y="40" width="160" height="160" clip-path="url(#avatarCircle)"/>
      <circle cx="750" cy="120" r="82" stroke="#00f7ff" stroke-width="4" fill="none" opacity="0.8"/>

      <!-- Titre -->
      <text x="450" y="70" text-anchor="middle" class="title">CARTE PREMIUM</text>

      <!-- Infos -->
      <text x="50" y="150" class="info">👤 ${escapeXML(user.username)}</text>
      <text x="50" y="190" class="info label" fill="#00ff88">🆔 ID : ${escapeXML(user.id)}</text>
      <text x="50" y="230" class="info label" fill="#ffff00">💬 Messages : ${userStats.messageCount}</text>
      <text x="50" y="270" class="info label" fill="#00ff00">💰 Solde : ${userData.balance}€</text>
      <text x="50" y="310" class="info label" fill="#ff6600">💞 Karma : +${userData.karmaGood} | -${userData.karmaBad}</text>
      <text x="50" y="350" class="info label" fill="#00ccff">📅 Inscription : ${escapeXML(inscriptionDate)}</text>
      <text x="50" y="390" class="info label" fill="#00ccff">🔑 Serveur : ${escapeXML(arriveeDate)}</text>
    </svg>`;

    // Conversion SVG -> PNG
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const attachment = new AttachmentBuilder(buffer, { name: 'carte-premium.png' });

    await interaction.editReply({ files: [attachment] });
  }
};
