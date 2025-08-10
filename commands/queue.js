const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const { getQueueInfo, THEME } = require('../managers/SimpleMusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Affiche la file de lecture')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '👀 La file ? Rejoins un vocal pour jeter un œil.', ephemeral: true });
    }

    const info = getQueueInfo(interaction.guildId);
    if ((!info.current) && (!info.queue || info.queue.length === 0)) {
      return interaction.reply({ content: '😴 La file est vide.', ephemeral: true });
    }

    const items = [];
    if (info.current) items.push(`▶️ ${info.current.title || info.current.query}`);
    info.queue.slice(0, 9).forEach((t, i) => items.push(`${i + 1}. ${t.title || t.query}`));

    const embed = new EmbedBuilder()
      .setColor(THEME.colorPrimary)
      .setTitle('🔥 File Boys & Girls')
      .setDescription(items.join('\n'))
      .setFooter({ text: THEME.footer });

    try { await interaction.reply({ embeds: [embed], ephemeral: true }); } catch {}
  }
};