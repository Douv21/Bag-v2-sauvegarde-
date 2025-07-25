const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
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
    await interaction.deferReply();

    try {
      const dataManager = require('../utils/dataManager');
      const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
      const targetMember = interaction.options.getMember('utilisateur') || interaction.member;
      const targetId = targetUser.id;
      const guildId = interaction.guildId;

      // Forcer le rechargement des données pour garantir la cohérence
      const userData = dataManager.getUser(targetId, guildId);

      // Utiliser DIRECTEMENT les valeurs unifiées de users.json
      const balance = userData.balance || 1000;
      const goodKarma = userData.goodKarma || 0;
      const badKarma = userData.badKarma || 0;
      const karmaNet = userData.karmaNet || 0;
      const messageCount = userData.messageCount || 0;
      const timeInVocal = userData.timeInVocal || 0;
      const level = userData.level || 0;
      
      console.log(`🔍 PROFIL-CARTE - ${targetUser.username}:`);
      console.log(`   Balance: ${balance}€, Level: ${level}`);
      console.log(`   Karma: +${goodKarma} / -${badKarma} (Net: ${karmaNet})`);
      console.log(`   Messages: ${messageCount}, Vocal: ${timeInVocal}s`);
      let karmaLevel = 'Neutre';
      if (karmaNet >= 50) karmaLevel = 'Saint 😇';
      else if (karmaNet >= 20) karmaLevel = 'Bon 😊';
      else if (karmaNet <= -50) karmaLevel = 'Diabolique 😈';
      else if (karmaNet <= -20) karmaLevel = 'Mauvais 😠';

      const level = userData.level || 0;
      const inscriptionDate = new Date(targetUser.createdTimestamp).toLocaleDateString('fr-FR');
      const arriveeDate = new Date(targetMember.joinedTimestamp).toLocaleDateString('fr-FR');

      const avatarUrl = targetUser.displayAvatarURL({ format: 'png', size: 128 });
      const avatarBuffer = await fetch(avatarUrl).then(res => res.buffer());
      const avatarBase64 = avatarBuffer.toString('base64');
      const avatarHref = `data:image/png;base64,${avatarBase64}`;

      const bgPath = path.join(__dirname, '1.jpg');
      const bgImage = fs.readFileSync(bgPath).toString('base64');
      const bgHref = `data:image/jpeg;base64,${bgImage}`;

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
  </defs>
  <image href="${bgHref}" x="0" y="0" width="800" height="400" preserveAspectRatio="xMidYMid slice"/>
  <image href="${avatarHref}" x="640" y="40" width="120" height="120" clip-path="url(#circleView)"/>
  <text x="400" y="60" text-anchor="middle" fill="#00ffff" font-size="24" font-family="Arial" filter="url(#textGlow)">HOLOGRAPHIC CARD</text>
  <text x="50" y="120" fill="#ffffff" font-size="16" font-family="Arial" filter="url(#textGlow)">Utilisateur : ${targetUser.username}</text>
  <text x="50" y="150" fill="#00ff88" font-size="14" font-family="Arial" filter="url(#textGlow)">ID : ${targetId}</text>
  <text x="50" y="180" fill="#ffff00" font-size="14" font-family="Arial" filter="url(#textGlow)">Messages : ${messageCount}</text>
  <text x="50" y="210" fill="#00ff00" font-size="14" font-family="Arial" filter="url(#textGlow)">Solde : ${balance}€</text>
  <text x="50" y="240" fill="#ff6600" font-size="14" font-family="Arial" filter="url(#textGlow)">Karma + : ${goodKarma} | - : ${badKarma}</text>
  <text x="50" y="270" fill="#cc33ff" font-size="14" font-family="Arial" filter="url(#textGlow)">Vocal : ${(timeInVocal / 3600).toFixed(1)} h</text>
  <text x="50" y="300" fill="#00ccff" font-size="12" font-family="Arial" filter="url(#textGlow)">Inscription : ${inscriptionDate}</text>
  <text x="50" y="320" fill="#00ccff" font-size="12" font-family="Arial" filter="url(#textGlow)">Serveur : ${arriveeDate}</text>
  <text x="50" y="350" fill="#ffaa00" font-size="14" font-family="Arial" filter="url(#textGlow)">Niveau : ${level}</text>
  <text x="50" y="370" fill="#ff00aa" font-size="14" font-family="Arial" filter="url(#textGlow)">État karmique : ${karmaLevel}</text>
</svg>`;

      const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
      const attachment = new AttachmentBuilder(buffer, { name: 'carte-profil.png' });

      await interaction.editReply({ files: [attachment] });

    } catch (err) {
      console.error('❌ Erreur dans /profil-carte :', err);
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: 'Erreur lors de la génération de la carte.' });
        } else {
          await interaction.reply({ content: 'Erreur lors de la génération de la carte.', ephemeral: true });
        }
      } catch (e) {
        console.error('❌ Impossible d\'envoyer un message d\'erreur :', e);
      }
    }
  }
};
