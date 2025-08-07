const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Arrête la musique et vide la file')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '🛑 Viens dans un vocal pour arrêter la musique, sexy.', flags: 64 });
    }

    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '😴 Rien à arrêter.', flags: 64 });

    await interaction.deferReply();
    try {
      await queue.stop();
      await interaction.editReply({ content: '🧹 File nettoyée. Bisous 💋' });
    } catch (err) {
      await interaction.editReply({ content: `❌ Oups: ${String(err.message || err)}` });
    }
  }
};