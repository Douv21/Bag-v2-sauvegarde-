const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Met en pause le morceau en cours')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '🧘 Va dans un salon vocal pour mettre en pause.', flags: 64 });
    }

    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '😴 Pas de lecture en cours.', flags: 64 });

    await interaction.deferReply();
    try {
      queue.pause();
      await interaction.editReply({ content: '⏸️ C’est en pause, baby.' });
    } catch (err) {
      await interaction.editReply({ content: `❌ Oups: ${String(err.message || err)}` });
    }
  }
};