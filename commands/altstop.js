const { SlashCommandBuilder } = require('discord.js');
const { stopAlt } = require('../managers/AltPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('altstop')
    .setDescription('Arrête la lecture (moteur alternatif)')
    .setDMPermission(false),

  cooldown: 1,

  async execute(interaction) {
    try { await interaction.deferReply({ ephemeral: true }); } catch {}
    try {
      await stopAlt(interaction.guildId);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '🛑 Arrêt du moteur alternatif.' }).catch(() => {});
      } else {
        await interaction.reply({ content: '🛑 Arrêt du moteur alternatif.', ephemeral: true }).catch(() => {});
      }
    } catch (err) {
      const msg = `❌ Échec: ${String(err?.message || err)}`;
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: msg }).catch(() => {});
      } else {
        await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
      }
    }
  }
};