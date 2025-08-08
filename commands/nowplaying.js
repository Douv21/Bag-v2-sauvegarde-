const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getMusic, createNowPlayingEmbed } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Affiche le morceau en cours')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '🎶 Rejoins un salon vocal pour voir ce qui joue.', ephemeral: true });
    }

    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    const song = queue?.songs?.[0];
    if (!song) {
      return interaction.reply({ content: '😴 Aucun morceau en cours.', ephemeral: true });
    }

    const embed = createNowPlayingEmbed(song);
    await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
  }
};