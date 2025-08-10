const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { stop } = require('../managers/SimpleMusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Arrête la musique et vide la file')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(voiceChannel.type)) {
      return interaction.reply({ content: '🎧 Rejoins un salon vocal pour utiliser cette commande.', ephemeral: true });
    }

    try { await interaction.deferReply({ ephemeral: true }); } catch {}

    try {
      await stop(interaction.guildId);
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '🛑 Musique arrêtée et file nettoyée.', ephemeral: true });
      else await interaction.reply({ content: '🛑 Musique arrêtée et file nettoyée.', ephemeral: true });
    } catch (err) {
      const msg = `❌ Erreur: ${String(err.message || err)}`;
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: msg }).catch(() => {});
      else await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  }
};