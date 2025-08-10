const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { pause } = require('../managers/SimpleMusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Met la lecture en pause')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(voiceChannel.type)) {
      return interaction.reply({ content: '🎧 Rejoins un salon vocal pour utiliser cette commande.', ephemeral: true });
    }

    try {
      await pause(interaction.guildId);
      await interaction.reply({ content: '⏸️ Lecture en pause.', ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: `❌ Erreur: ${String(err.message || err)}`, ephemeral: true }).catch(() => {});
    }
  }
};