const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, registerFont, loadImage } = require('canvas');
const fs = require('fs');

// Commande slash
module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil-carte')
    .setDescription('Affiche votre carte de profil stylisée')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('Afficher la carte d’un autre utilisateur')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    // Récupération des rôles
    const estFemme = member.roles.cache.some(role => role.name.toLowerCase().includes('femme'));
    const estHomme = member.roles.cache.some(role => role.name.toLowerCase().includes('homme'));
    const estCertifie = member.roles.cache.some(role => role.name.toLowerCase().includes('certifié'));

    // Données fictives (à remplacer par votre base de données)
    const profil = {
      pseudo: user.username,
      messages: 0,
      solde: 0,
      karma: '+0 / -0',
      streak: 0,
      xp: 0,
      niveau: 0,
      inscription: '16/02/2022',
      serveur: '13/04/2025',
    };

    // Configuration du canvas
    const largeur = 800;
    const hauteur = 400;
    const canvas = createCanvas(largeur, hauteur);
    const ctx = canvas.getContext('2d');

    // Couleur par rôle
    let couleur = '#00ffff'; // par défaut néon bleu
    if (estCertifie) couleur = '#da70d6'; // violet
    else if (estFemme) couleur = '#ff69b4'; // rose
    else if (estHomme) couleur = '#00bfff'; // bleu

    // Arrière-plan noir
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, largeur, hauteur);

    // Police personnalisée (optionnel)
    registerFont('./fonts/Orbitron-Bold.ttf', { family: 'Orbitron' }); // à adapter

    ctx.font = '24px Orbitron';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = couleur;
    ctx.shadowBlur = 10;

    // Titre
    ctx.fillStyle = couleur;
    ctx.font = '30px Orbitron';
    ctx.fillText('Carte de Profil', 300, 60);

    // Contenu compact
    ctx.fillStyle = '#fff';
    ctx.font = '22px Orbitron';
    const lignes = [
      `👤 ${profil.pseudo}`,
      `💬 ${profil.messages} msg   💰 ${profil.solde}€   ⚖️ ${profil.karma}`,
      `🔥 ${profil.streak}j   ⭐ ${profil.xp} XP (Niv. ${profil.niveau})`,
      `📅 ${profil.inscription}   🏠 ${profil.serveur}`
    ];

    lignes.forEach((ligne, index) => {
      ctx.fillText(ligne, 80, 130 + index * 40);
    });

    // Export du fichier image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('./profil-carte.png', buffer);

    await interaction.reply({
      files: ['./profil-carte.png']
    });
  },
};
