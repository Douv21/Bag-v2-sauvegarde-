const { SlashCommandBuilder } = require('discord.js');
const https = require('https');

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(new Error('INVALID_JSON'));
          }
        });
      })
      .on('error', reject);
  });
}

const PREFERENCES = [
  'plan-cul',
  'sex-friends',
  'amities',
  'amour',
  'autre'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajouter-carte')
    .setDescription('Enregistre ta ville et ce que tu recherches pour la carte des membres')
    .addStringOption(o =>
      o.setName('ville')
        .setDescription('Ville où tu habites (ex: Lyon, France)')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('recherche')
        .setDescription('Ce que tu recherches')
        .addChoices(
          { name: 'Plan cul', value: 'plan-cul' },
          { name: 'Sex Friends', value: 'sex-friends' },
          { name: 'Amitiés', value: 'amities' },
          { name: 'Amour', value: 'amour' },
          { name: 'Autre', value: 'autre' }
        )
        .setRequired(true)
    ),

  cooldown: 5,

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: 64 });

      const ville = interaction.options.getString('ville', true).trim();
      const recherche = interaction.options.getString('recherche', true);

      if (!PREFERENCES.includes(recherche)) {
        return interaction.editReply('Choix de "recherche" invalide.');
      }

      const key = process.env.LOCATIONIQ_KEY || process.env.LOCATIONIQ_TOKEN;
      if (!key) {
        return interaction.editReply('Clé LocationIQ manquante. Configurez LOCATIONIQ_KEY.');
      }

      const q = encodeURIComponent(ville);
      const url = `https://us1.locationiq.com/v1/search?key=${encodeURIComponent(key)}&q=${q}&format=json&limit=1`;

      let lat, lon, displayName;
      try {
        const results = await httpGetJson(url);
        if (!Array.isArray(results) || results.length === 0) {
          return interaction.editReply('Ville introuvable. Essayez avec "Ville, Pays".');
        }
        const r = results[0];
        lat = Number(r.lat);
        lon = Number(r.lon);
        displayName = r.display_name || ville;
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          return interaction.editReply('Coordonnées invalides retournées par le géocodage.');
        }
      } catch (e) {
        return interaction.editReply('Erreur géocodage LocationIQ. Réessayez plus tard.');
      }

      const memberLocationManager = require('../utils/memberLocationManager');
      const userId = interaction.user.id;
      const guildId = interaction.guildId;
      const record = memberLocationManager.setLocation(userId, guildId, lat, lon, displayName, ville, recherche);

      return interaction.editReply(`✅ Enregistré: ${displayName} (${record.lat.toFixed(4)}, ${record.lng.toFixed(4)}) • Recherche: ${recherche}`);
    } catch (error) {
      return interaction.editReply('Une erreur est survenue.');
    }
  }
};

