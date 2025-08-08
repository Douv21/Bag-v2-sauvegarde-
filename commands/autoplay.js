const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Active/désactive l’autoplay')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '🎼 Rejoins un vocal pour basculer l’autoplay.', ephemeral: true });
    }

    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '😴 Aucun morceau en cours.', ephemeral: true });

    const enabled = queue.toggleAutoplay();
    await interaction.reply({ content: enabled ? '🎼 Autoplay activé.' : '🎼 Autoplay désactivé.', ephemeral: true }).catch(() => {});
  }
};