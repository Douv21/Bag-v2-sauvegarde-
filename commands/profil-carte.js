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
        .setDescription("L'utilisateur dont afficher la carte (sinon vous).")
        .setRequired(false))
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Mode clair ou sombre')
        .addChoices(
          { name: 'Sombre', value: 'dark' },
          { name: 'Clair', value: 'light' }
        )
        .setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
    const member = interaction.guild.members.cache.get(targetUser.id);
    const mode = interaction.options.getString('mode') || 'dark';

    // Couleurs selon le mode
    const colors = {
      background: mode === 'dark' ? '#111111' : '#f2f2f2',
      text: mode === 'dark' ? '#ffffff' : '#000000',
      neon: '#00ffff',
      border: mode === 'dark' ? '#333333' : '#cccccc'
    };

    // Données utilisateur par défaut
    let userData = {
      balance: 0,
      goodKarma: 0,
      badKarma: 0,
      dailyStreak: 0,
      xp: 0,
      messageCount: 0
    };

    try {
      const usersPath = path.join(__dirname, '..', 'data', 'users.json');
      if (fs.existsSync(usersPath)) {
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        userData = Object.assign(userData, users[targetUser.id] || {});
      }
    } catch (err) {
      console.log("⚠️ Fichier users.json manquant ou invalide");
    }

    const karmaNet = userData.goodKarma + userData.badKarma;
    let karmaLevel = 'Neutre';
    if (karmaNet >= 50) karmaLevel = 'Saint 😇';
    else if (karmaNet >= 20) karmaLevel = 'Bon 😊';
    else if (karmaNet <= -50) karmaLevel = 'Diabolique 😈';
    else if (karmaNet <= -20) karmaLevel = 'Mauvais 😠';

    const level = Math.floor(userData.xp / 1000);
    const inscriptionDate = new Date(targetUser.createdTimestamp).toLocaleDateString('fr-FR');
    const arriveeDate = member ? new Date(member.joinedTimestamp).toLocaleDateString('fr-FR') : 'Inconnu';

    // Avatar & fond
    const avatarURL = targetUser.displayAvatarURL({ format: 'png', size: 128 });
    const avatarBuffer = await fetch(avatarURL).then(res => res.buffer());
    const avatarBase64 = avatarBuffer.toString('base64');
    const avatarHref = `data:image/png;base64,${avatarBase64}`;

    const width = 800;
    const height = 400;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="avatarClip"><circle cx="700" cy="100" r="60"/></clipPath>
    <filter id="neon"><feGaussianBlur stdDeviation="3.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="${colors.background}" rx="20"/>
  <image href="${avatarHref}" x="640" y="40" width="120" height="120" clip-path="url(#avatarClip)"/>
  <text x="400" y="60" text-anchor="middle" fill="${colors.neon}" font-size="30" font-family="Verdana" filter="url(#neon)">Carte de Profil</text>

  <text x="50" y="120" fill="${colors.text}" font-size="20" font-family="Arial" filter="url(#neon)">👤 Utilisateur : ${targetUser.username}</text>
  <text x="50" y="150" fill="${colors.text}" font-size="18" font-family="Arial">💬 Messages : ${userData.messageCount}</text>
  <text x="50" y="180" fill="${colors.text}" font-size="18" font-family="Arial">💰 Solde : ${userData.balance}€</text>
  <text x="50" y="210" fill="${colors.text}" font-size="18" font-family="Arial">✨ Karma : +${userData.goodKarma} / -${userData.badKarma}</text>
  <text x="50" y="240" fill="${colors.text}" font-size="18" font-family="Arial">🧘 Niveau Karma : ${karmaLevel}</text>
  <text x="50" y="270" fill="${colors.text}" font-size="18" font-family="Arial">🔥 Streak : ${userData.dailyStreak} jours</text>
  <text x="50" y="300" fill="${colors.text}" font-size="18" font-family="Arial">🧠 XP : ${userData.xp} (Niv. ${level})</text>
  <text x="50" y="330" fill="${colors.text}" font-size="16" font-family="Arial">📅 Inscrit : ${inscriptionDate}</text>
  <text x="50" y="360" fill="${colors.text}" font-size="16" font-family="Arial">🚪 Serveur : ${arriveeDate}</text>
</svg>`;

    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const attachment = new AttachmentBuilder(buffer, { name: 'carte-profil.png' });

    await interaction.editReply({ files: [attachment] });
  }
};
