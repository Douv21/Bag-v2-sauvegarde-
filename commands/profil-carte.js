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
      option.setName('utilisateur').setDescription('Un autre membre à afficher')
    )
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Mode de couleur : clair ou sombre')
        .addChoices(
          { name: 'Clair', value: 'light' },
          { name: 'Sombre', value: 'dark' }
        )
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
    const member = interaction.guild.members.cache.get(targetUser.id);
    const mode = interaction.options.getString('mode') || 'dark';

    // --- Récupération des données de l'utilisateur ---
    let userData = {
      balance: 0,
      goodKarma: 0,
      badKarma: 0,
      dailyStreak: 0,
      xp: 0,
    };

    try {
      const usersPath = path.join(__dirname, '..', 'data', 'users.json');
      if (fs.existsSync(usersPath)) {
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        userData = Object.assign(userData, usersData[targetUser.id] || {});
      }
    } catch {
      console.log('⚠️ Données par défaut utilisées');
    }

    // --- Couleurs dynamiques par rôle ---
    let color = '#00ffff'; // par défaut
    let roleLabel = 'Aucun';

    if (member) {
      const roles = member.roles.cache.map(r => r.name.toLowerCase());
      if (roles.some(r => r.includes('certifié'))) {
        color = '#a020f0';
        roleLabel = 'Certifié';
      } else if (roles.some(r => r.includes('femme'))) {
        color = '#ff69b4';
        roleLabel = 'Femme';
      } else if (roles.some(r => r.includes('homme'))) {
        color = '#00bfff';
        roleLabel = 'Homme';
      }
    }

    const backgroundColor = mode === 'dark' ? '#111111' : '#f2f2f2';
    const textColor = mode === 'dark' ? '#ffffff' : '#000000';

    const karmaNet = userData.goodKarma + userData.badKarma;
    let karmaLevel = 'Neutre';
    if (karmaNet >= 50) karmaLevel = 'Saint 😇';
    else if (karmaNet >= 20) karmaLevel = 'Bon 😊';
    else if (karmaNet <= -50) karmaLevel = 'Diabolique 😈';
    else if (karmaNet <= -20) karmaLevel = 'Mauvais 😠';

    const level = Math.floor(userData.xp / 1000);

    const inscriptionDate = new Date(targetUser.createdTimestamp).toLocaleDateString('fr-FR');
    const arriveeDate = member ? new Date(member.joinedTimestamp).toLocaleDateString('fr-FR') : 'Inconnu';

    const avatarUrl = targetUser.displayAvatarURL({ format: 'png', size: 128 });
    const avatarBuffer = await fetch(avatarUrl).then(res => res.buffer());
    const avatarBase64 = avatarBuffer.toString('base64');
    const avatarHref = `data:image/png;base64,${avatarBase64}`;

    const bgPath = path.join(__dirname, '1.jpg');
    const bgImage = fs.readFileSync(bgPath).toString('base64');
    const bgHref = `data:image/jpeg;base64,${bgImage}`;

    const width = 800;
    const height = 400;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="circleView">
      <circle cx="700" cy="100" r="60"/>
    </clipPath>
    <filter id="textGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  <image href="${bgHref}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" opacity="0.15"/>
  <image href="${avatarHref}" x="640" y="40" width="120" height="120" clip-path="url(#circleView)"/>

  <text x="400" y="50" text-anchor="middle" fill="${color}" font-size="28" font-family="Arial Black" filter="url(#textGlow)">🎴 CARTE DE PROFIL</text>

  <text x="50" y="120" fill="${textColor}" font-size="20" font-family="Arial" filter="url(#textGlow)">👤 Utilisateur : ${targetUser.username}</text>
  <text x="50" y="155" fill="${textColor}" font-size="16" font-family="Arial" filter="url(#textGlow)">🆔 ID : ${targetUser.id.slice(0, 10)}...</text>
  <text x="50" y="185" fill="${textColor}" font-size="16" font-family="Arial" filter="url(#textGlow)">📬 Messages : ${userData.messageCount || 0}</text>
  <text x="50" y="215" fill="${textColor}" font-size="16" font-family="Arial" filter="url(#textGlow)">💰 Solde : ${userData.balance}€</text>
  <text x="50" y="245" fill="${textColor}" font-size="16" font-family="Arial" filter="url(#textGlow)">❤️ Karma + : ${userData.goodKarma} | - : ${userData.badKarma}</text>
  <text x="50" y="275" fill="${textColor}" font-size="16" font-family="Arial" filter="url(#textGlow)">🧘 Niveau Karma : ${karmaLevel}</text>
  <text x="50" y="305" fill="${textColor}" font-size="16" font-family="Arial" filter="url(#textGlow)">🏅 Niveau : ${level}</text>
  <text x="50" y="335" fill="${textColor}" font-size="14" font-family="Arial" filter="url(#textGlow)">📅 Inscription : ${inscriptionDate}</text>
  <text x="50" y="360" fill="${textColor}" font-size="14" font-family="Arial" filter="url(#textGlow)">🎉 Serveur : ${arriveeDate}</text>
  <text x="50" y="385" fill="${color}" font-size="16" font-family="Arial" filter="url(#textGlow)">🏷 Rôle : ${roleLabel}</text>
</svg>`;

    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const attachment = new AttachmentBuilder(buffer, { name: 'carte-profil.png' });

    await interaction.reply({ files: [attachment] });
  }
};
