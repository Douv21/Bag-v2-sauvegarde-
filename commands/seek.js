const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { seek } = require('../managers/SimpleMusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Va à un instant du morceau (en secondes)')
    .addIntegerOption(o => o.setName('secondes').setDescription('Position en secondes').setRequired(true).setMinValue(0))
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '⏩ Rejoins un salon vocal pour seek.', ephemeral: true });
    }

    const seconds = interaction.options.getInteger('secondes', true);

    try {
      await seek(interaction.guildId, seconds);
      await interaction.reply({ content: `⏩ Position: ${seconds}s`, ephemeral: true });
    } catch (e) {
      await interaction.reply({ content: `❌ Impossible de seek: ${String(e.message || e)}`, ephemeral: true }).catch(() => {});
    }
  }
};