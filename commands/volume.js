const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

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
    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '😴 Aucun morceau en cours.', ephemeral: true });

    queue.setVolume(value);
    await interaction.reply({ content: `🔊 Volume: ${value}%`, ephemeral: true }).catch(() => {});
  }
};