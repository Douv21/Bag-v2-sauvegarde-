const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const https = require('https');

function httpGetBuffer(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('membre-proche')
    .setDescription('Affiche une carte des membres proches (100km max)')
    .addIntegerOption(o =>
      o.setName('rayon_km')
        .setDescription('Rayon (km, max 100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(false)
    )
    .addStringOption(o =>
      o.setName('filtre')
        .setDescription('Filtrer par préférence (plan-cul, sex-friends, amities, amour, autre)')
        .addChoices(
          { name: 'Tous', value: 'tous' },
          { name: 'Plan cul', value: 'plan-cul' },
          { name: 'Sex Friends', value: 'sex-friends' },
          { name: 'Amitiés', value: 'amities' },
          { name: 'Amour', value: 'amour' },
          { name: 'Autre', value: 'autre' }
        )
        .setRequired(false)
    ),

  cooldown: 5,

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const memberLocationManager = require('../utils/memberLocationManager');
      const guildId = interaction.guildId;
      const userId = interaction.user.id;
      const self = memberLocationManager.getLocation(userId, guildId);
      if (!self) {
        return interaction.editReply('Tu dois d’abord enregistrer ta ville avec `/ajouter-carte`.');
      }

      const radiusKm = Math.min(100, interaction.options.getInteger('rayon_km') || 100);
      const filterPref = interaction.options.getString('filtre') || 'tous';

      let nearby = memberLocationManager.findNearby(guildId, self.lat, self.lng, radiusKm, 50);
      nearby = nearby.filter(r => r.userId !== userId);
      if (filterPref !== 'tous') {
        nearby = nearby.filter(r => (r.preference || '') === filterPref);
      }

      // Construire la carte statique LocationIQ
      const key = process.env.LOCATIONIQ_KEY || process.env.LOCATIONIQ_TOKEN;
      if (!key) {
        return interaction.editReply('Clé LocationIQ manquante. Configurez LOCATIONIQ_KEY.');
      }

      const center = `${self.lat},${self.lng}`;
      const size = '800x600';
      const zoom = 9; // raisonnable pour ~100km
      const markers = [
        // marqueur bleu pour soi
        `color:blue|label:me|${self.lat},${self.lng}`,
        // marqueurs rouges pour les proches
        ...nearby.slice(0, 30).map(r => `color:red|${r.lat},${r.lng}`)
      ];

      // Syntaxe LocationIQ static map (compatible Google Static Maps-like)
      const baseQuery = `key=${encodeURIComponent(key)}&center=${encodeURIComponent(center)}&zoom=${encodeURIComponent(String(zoom))}&size=${encodeURIComponent(size)}`;
      const markersQuery = markers.map(m => `&markers=${encodeURIComponent(m)}`).join('');
      const mapUrl = `https://maps.locationiq.com/v3/staticmap?${baseQuery}${markersQuery}`;

      let attachment;
      try {
        const buf = await httpGetBuffer(mapUrl);
        attachment = new AttachmentBuilder(buf, { name: 'membres_proches.png' });
      } catch (e) {
        // En cas d’échec, répondre sans image
      }

      const lines = [];
      lines.push(`📍 Centre: ${self.city || self.address || 'Position enregistrée'} • Rayon: ${radiusKm}km`);
      if (filterPref !== 'tous') lines.push(`Filtre: ${filterPref}`);
      if (nearby.length === 0) {
        lines.push('Aucun membre trouvé à proximité.');
      } else {
        const usernames = await interaction.guild.members.fetch({ user: nearby.map(n => n.userId) }).catch(() => null);
        lines.push(`Membres trouvés: ${nearby.length}`);
        for (const r of nearby.slice(0, 10)) {
          const member = usernames?.get(r.userId);
          const name = member ? (member.displayName || member.user.username) : r.userId;
          const pref = r.preference || 'non précisé';
          lines.push(`- ${name} • ${pref} • ${(r.distanceKm).toFixed(1)} km`);
        }
        if (nearby.length > 10) lines.push(`… et ${nearby.length - 10} autres.`);
      }
      const content = lines.join('\n');
      if (attachment) {
        return interaction.editReply({ content, files: [attachment] });
      }
      return interaction.editReply(content);
    } catch (error) {
      return interaction.editReply('Une erreur est survenue.');
    }
  }
};

