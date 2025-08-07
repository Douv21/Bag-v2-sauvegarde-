const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Passer au prochain morceau')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '👂 Rejoins un salon vocal pour skipper, coquin(e)!', flags: 64 });
    }

    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '😴 Rien à skipper…', flags: 64 });

    await interaction.deferReply();
    try {
      await queue.skip();
      await interaction.editReply({ content: '⏭️ Hop ! Suivant.' });
    } catch (err) {
      await interaction.editReply({ content: `❌ Oups: ${String(err.message || err)}` });
    }
  }
};