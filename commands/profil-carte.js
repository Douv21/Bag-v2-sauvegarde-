const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const sharp = require('sharp');

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
    .setDescription('Génère une carte de profil personnalisée avec thème et options.')
    .addStringOption(option =>
      option.setName('theme')
        .setDescription('Choisir le thème (clair ou sombre)')
        .setRequired(false)
        .addChoices(
          { name: 'Clair', value: 'clair' },
          { name: 'Sombre', value: 'sombre' }
        ))
    .addStringOption(option =>
      option.setName('couleur')
        .setDescription('Couleur hex pour le texte (#RRGGBB)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('premium')
        .setDescription('Activer le mode premium (oui ou non)')
        .setRequired(false)
        .addChoices(
          { name: 'Oui', value: 'oui' },
          { name: 'Non', value: 'non' }
        )),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const user = interaction.user;
      const member = interaction.member;

      // Options utilisateur
      const theme = interaction.options.getString('theme') || 'sombre';
      const textColor = interaction.options.getString('couleur') || '#00ffff';
      const premium = interaction.options.getString('premium') === 'oui';

      const userData = { balance: 1500, karmaGood: 12, karmaBad: 3 };
      const userStats = { messageCount: 420 };

      const width = 800;
      const height = 400;

      const inscriptionDate = new Date(user.createdTimestamp).toLocaleDateString('fr-FR');
      const arriveeDate = new Date(member.joinedTimestamp).toLocaleDateString('fr-FR');

      const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
      const avatarBuffer = await fetch(avatarUrl).then(res => res.buffer());

      // ✅ Couleur et fond selon thème
      const bgColor = theme === 'clair' ? '#ffffff' : '#000000';

      const bgBuffer = await sharp({
        create: { width, height, channels: 3, background: bgColor }
      }).png().toBuffer();

      // ✅ SVG dynamique avec premium
      const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="textGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          ${premium ? `
          <filter id="neon">
            <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="${textColor}"/>
          </filter>` : ''}
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display&display=swap');
            .title { font-family: 'Great Vibes'; font-size: 40px; fill: ${textColor}; ${premium ? 'filter:url(#neon);' : 'filter:url(#textGlow);'} }
            .info { font-family: 'Playfair Display'; font-size: 20px; fill: ${theme === 'clair' ? '#000' : '#fff'}; filter: url(#textGlow); }
          </style>
        </defs>
        ${premium ? `<rect x="5" y="5" width="${width-10}" height="${height-10}" rx="20" ry="20" stroke="${textColor}" stroke-width="6" fill="none"/>` : ''}
        <text x="400" y="60" text-anchor="middle" class="title">Carte Profil</text>
        <text x="50" y="130" class="info">👤 ${escapeXML(user.username)}</text>
        <text x="50" y="170" class="info">🆔 ID : ${escapeXML(user.id)}</text>
        <text x="50" y="210" class="info">💬 Messages : ${userStats.messageCount}</text>
        <text x="50" y="250" class="info">💰 Solde : ${userData.balance}€</text>
        <text x="50" y="290" class="info">💞 Karma + : ${userData.karmaGood} | - : ${userData.karmaBad}</text>
        <text x="50" y="330" class="info">📅 Inscription : ${escapeXML(inscriptionDate)}</text>
        <text x="50" y="360" class="info">🔑 Serveur : ${escapeXML(arriveeDate)}</text>
      </svg>`;

      const svgBuffer = Buffer.from(svg);

      // ✅ Composition finale
      const finalImage = await sharp(bgBuffer)
        .composite([
          { input: svgBuffer, top: 0, left: 0 },
          { input: avatarBuffer, top: 40, left: 640 }
        ])
        .png()
        .toBuffer();

      await interaction.editReply({ files: [new AttachmentBuilder(finalImage, { name: 'carte-profil.png' })] });

    } catch (error) {
      console.error('Erreur profil-carte:', error);
      if (!interaction.replied) {
        await interaction.editReply('❌ Une erreur est survenue lors de la génération de la carte.');
      }
    }
  }
};
