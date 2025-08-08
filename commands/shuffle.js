const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Mélange la file de lecture')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '🔀 Rejoins un salon vocal pour mélanger la file.', ephemeral: true });
    }

    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '😴 La file est vide.', ephemeral: true });

    queue.shuffle();
    await interaction.reply({ content: '🔀 File mélangée.', ephemeral: true }).catch(() => {});
  }
};