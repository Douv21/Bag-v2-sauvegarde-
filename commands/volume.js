const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { setVolume } = require('../managers/SimpleMusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Règle le volume (0-100)')
    .addIntegerOption(o => o.setName('pourcent').setDescription('Volume (0-100)').setRequired(true).setMinValue(0).setMaxValue(100))
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '🔈 Rejoins un salon vocal pour régler le volume.', ephemeral: true });
    }

    const value = interaction.options.getInteger('pourcent', true);

    try {
      const v = await setVolume(interaction.guildId, value);
      await interaction.reply({ content: `🔊 Volume: ${v}%`, ephemeral: true }).catch(() => {});
    } catch (e) {
      await interaction.reply({ content: `❌ Impossible de régler le volume: ${String(e.message || e)}`, ephemeral: true }).catch(() => {});
    }
  }
};