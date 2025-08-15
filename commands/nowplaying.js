const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getQueueInfo, createNowPlayingEmbed, updatePlayerMessage } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Affiche le morceau en cours (Lavalink)')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(voiceChannel.type)) {
      return interaction.reply({ content: '🎶 Rejoins un salon vocal pour voir ce qui joue.', ephemeral: true });
    }

    const info = getQueueInfo(interaction.guildId);
    const song = info?.current;
    if (!song) {
      try { await updatePlayerMessage(interaction.guildId); } catch {}
      return interaction.reply({ content: '😴 Aucun morceau en cours.', ephemeral: true });
    }

    const embed = createNowPlayingEmbed(song, interaction.guild);
    await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
    try { await updatePlayerMessage(interaction.guildId); } catch {}
  }
};