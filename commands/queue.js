const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const { getQueueInfo, THEME } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Affiche la file d\'attente musique')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(voiceChannel.type)) {
      return interaction.reply({ content: '🎧 Rejoins un salon vocal pour voir la file.', ephemeral: true });
    }

    const info = getQueueInfo(interaction.guildId);
    const desc = [
      info.current ? `▶️ En cours: ${info.current.title || info.current.query}` : '😴 Rien en cours',
      '',
      ...info.queue.map((t, i) => `${i + 1}. ${t.title || t.query}`)
    ].join('\n');

    const embed = new EmbedBuilder().setColor(THEME.colorSecondary).setTitle('📜 File d\'attente').setDescription(desc || 'Vide');

    await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
  }
};