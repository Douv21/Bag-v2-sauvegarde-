const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const sharp = require('sharp');

// Fonction pour échapper les caractères spéciaux XML
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
    .setDescription('Génère une carte de profil personnalisée.'),

  async execute(interaction) {
    try {
      const user = interaction.user;
      const member = interaction.member;

      // Simule des données (à remplacer par ta base)
      const userData = {
        balance: 1500,
        karmaGood: 12,
        karmaBad: 3
      };

      const userStats = {
        messageCount: 420
      };

      const width = 800;
      const height = 400;

      const inscriptionDate = new Date(user.createdTimestamp).toLocaleDateString('fr-FR');
      const arriveeDate = new Date(member.joinedTimestamp).toLocaleDateString('fr-FR');

      // ✅ Avatar utilisateur avec fallback
      const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
      const defaultAvatarPath = path.join(__dirname, 'default-avatar.png');
      let avatarBuffer;

      try {
        avatarBuffer = await fetch(avatarUrl).then(res => res.buffer());
      } catch (err) {
        console.warn("Impossible de charger l'avatar, utilisation du fallback.");
        avatarBuffer = fs.readFileSync(defaultAvatarPath);
      }

      const avatarBase64 = avatarBuffer.toString('base64');
      const avatarHref = `data:image/png;base64,${avatarBase64}`;

      // ✅ Image de fond avec fallback
      const bgPath = path.join(__dirname, '1.jpg');
      let bgImage;

      if (fs.existsSync(bgPath)) {
        bgImage = fs.readFileSync(bgPath).toString('base64');
      } else {
        console.warn("Image de fond manquante, utilisation d'un fond noir.");
        const fallbackBuffer = await sharp({
          create: {
            width,
            height,
            channels: 3,
            background: { r: 0, g: 0, b: 0 }
          }
        }).jpeg().toBuffer();
        bgImage = fallbackBuffer.toString('base64');
      }

      const bgHref = `data:image/jpeg;base64,${bgImage}`;

      // ✅ Génération du SVG sécurisé
      const svg = `
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
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display&display=swap');
            .title {
              font-family: 'Great Vibes', cursive;
              font-size: 40px;
              fill: #00ffff;
              filter: url(#textGlow);
            }
            .info {
              font-family: 'Playfair Display', serif;
              font-size: 20px;
              fill: #ffffff;
              filter: url(#textGlow);
            }
            .label {
              font-size: 18px;
            }
          </style>
        </defs>

        <image href="${bgHref}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
        <image href="${avatarHref}" x="640" y="40" width="120" height="120" clip-path="url(#circleView)"/>

        <text x="400" y="60" text-anchor="middle" class="title">Holographic Card</text>

        <text x="50" y="130" class="info">👤 Utilisateur : ${escapeXML(user.username)}</text>
        <text x="50" y="170" class="info label" fill="#00ff88">🆔 ID : ${escapeXML(user.id.slice(0, 10))}...</text>
        <text x="50" y="210" class="info label" fill="#ffff00">💬 Messages : ${userStats.messageCount}</text>
        <text x="50" y="250" class="info label" fill="#00ff00">💰 Solde : ${userData.balance}€</text>
        <text x="50" y="290" class="info label" fill="#ff6600">💞 Karma + : ${userData.karmaGood} | - : ${userData.karmaBad}</text>
        <text x="50" y="330" class="info label" fill="#00ccff">📅 Inscription : ${escapeXML(inscriptionDate)}</text>
        <text x="50" y="360" class="info label" fill="#00ccff">🔑 Serveur : ${escapeXML(arriveeDate)}</text>
      </svg>`;

      // ✅ Conversion en PNG
      const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
      const attachment = new AttachmentBuilder(buffer, { name: 'carte-profil.png' });

      await interaction.reply({ files: [attachment] });
    } catch (error) {
      console.error('Erreur dans la commande profil-carte:', error);
      await interaction.reply('❌ Une erreur est survenue lors de la génération de la carte.');
    }
  }
};
