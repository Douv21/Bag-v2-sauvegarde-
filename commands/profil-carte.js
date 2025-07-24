const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const { generateHolographicCard } = require('./utils/cardgenerator.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil-carte')
    .setDescription('Affiche votre carte de profil'),

  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.user;
    const member = interaction.member;

    // Dummy userData / userStats à remplacer par ta DB
    const userData = {
      balance: 560,
      karmaGood: 12,
      karmaBad: 3
    };

    const userStats = {
      messageCount: 482
    };

    const karmaTotal = userData.karmaGood - userData.karmaBad;

    // --- TÉLÉCHARGEMENT AVATAR ---
    const avatarURL = user.displayAvatarURL({ format: 'png', size: 256 });
    const response = await fetch(avatarURL);
    const avatarBuffer = await response.buffer();
    const avatarBase64 = avatarBuffer.toString('base64');
    const avatarDataURI = `data:image/png;base64,${avatarBase64}`;

    // --- GÉNÉRER SVG ---
    const svg = generateHolographicCard(user, userData, userStats, member, karmaTotal, avatarDataURI);

    // --- CONVERTIR SVG EN PNG ---
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    const attachment = new AttachmentBuilder(pngBuffer, { name: 'profil.png' });

    await interaction.editReply({
      content: `Voici votre carte holographique, ${user.username} :`,
      files: [attachment]
    });
  }
};
