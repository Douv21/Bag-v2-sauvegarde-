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
await interaction.deferReply(); // Important pour éviter les erreurs d’interaction

const user = interaction.user;  
const member = interaction.member;  

// Données utilisateur par défaut  
let userData = {  
  balance: 0,  
  goodKarma: 0,  
  badKarma: 0,  
  dailyStreak: 0,  
  xp: 0  
};  

try {  
  const usersPath = path.join(__dirname, '..', 'data', 'user_stats.json.json');  
  if (fs.existsSync(usersPath)) {  
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));  
    userData = Object.assign(userData, usersData[user.id] || {}); // 🔄 user.id ici  
  }  
} catch (error) {  
  console.log('⚠️ Données par défaut utilisées');  
}  

// Statistiques  
const karmaNet = userData.goodKarma + userData.badKarma;  
let karmaLevel = 'Neutre';  
if (karmaNet >= 50) karmaLevel = 'Saint 😇';  
else if (karmaNet >= 20) karmaLevel = 'Bon 😊';  
else if (karmaNet <= -50) karmaLevel = 'Diabolique 😈';  
else if (karmaNet <= -20) karmaLevel = 'Mauvais 😠';  

const level = Math.floor(userData.xp / 1000);  

const inscriptionDate = new Date(user.createdTimestamp).toLocaleDateString('fr-FR');  
const arriveeDate = new Date(member.joinedTimestamp).toLocaleDateString('fr-FR');  

// Avatar et fond  
const avatarUrl = user.displayAvatarURL({ format: 'png', size: 128 });  
const avatarBuffer = await fetch(avatarUrl).then(res => res.buffer());  
const avatarBase64 = avatarBuffer.toString('base64');  
const avatarHref = `data:image/png;base64,${avatarBase64}`;  

const bgPath = path.join(__dirname, '1.jpg');  
const bgImage = fs.readFileSync(bgPath).toString('base64');  
const bgHref = `data:image/jpeg;base64,${bgImage}`;  

// Valeurs fixes (à définir)  
const width = 800;  
const height = 400;  

// userStats.messageCount manquant -> ajout valeur par défaut  
const userStats = {  
  messageCount: userData.messageCount || 0  
};  

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
  <text x="400" y="60" text-anchor="middle" fill="#00ffff" font-size="24" font-family="Arial" filter="url(#textGlow)">HOLOGRAPHIC CARD</text>  
  <text x="50" y="120" fill="#ffffff" font-size="16" font-family="Arial" filter="url(#textGlow)">Utilisateur : ${user.username}</text>  
  <text x="50" y="150" fill="#00ff88" font-size="14" font-family="Arial" filter="url(#textGlow)">ID : ${user.id.substring(0, 10)}...</text>  
  <text x="50" y="180" fill="#ffff00" font-size="14" font-family="Arial" filter="url(#textGlow)">Messages : ${userStats.messageCount}</text>  
  <text x="50" y="210" fill="#00ff00" font-size="14" font-family="Arial" filter="url(#textGlow)">Solde : ${userData.balance}€</text>  
  <text x="50" y="240" fill="#ff6600" font-size="14" font-family="Arial" filter="url(#textGlow)">Karma + : ${userData.goodKarma} | - : ${userData.badKarma}</text>  
  <text x="50" y="270" fill="#00ccff" font-size="12" font-family="Arial" filter="url(#textGlow)">Inscription : ${inscriptionDate}</text>  
  <text x="50" y="290" fill="#00ccff" font-size="12" font-family="Arial" filter="url(#textGlow)">Serveur : ${arriveeDate}</text>  
</svg>`;  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();  
const attachment = new AttachmentBuilder(buffer, { name: 'carte-profil.png' });  

await interaction.editReply({ files: [attachment] }); // <- Ne pas utiliser .reply

}
};

