const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Relance la lecture')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '💬 Rejoins un vocal pour relancer la musique, honey.', ephemeral: true });
    }

    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '😴 Pas de lecture en cours.', ephemeral: true });

    await interaction.deferReply();
    try {
      queue.resume();
      await interaction.editReply({ content: '▶️ Et c’est reparti !' });
    } catch (err) {
      await interaction.editReply({ content: `❌ Oups: ${String(err.message || err)}` });
    }
  }
};