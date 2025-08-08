const { SlashCommandBuilder, ChannelType, EmbedBuilder, MessageFlags } = require('discord.js');
const { getMusic, THEME } = require('../managers/MusicManager');

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

    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    if (!queue || !queue.songs.length) {
      return interaction.reply({ content: '😴 La file est vide.', ephemeral: true });
    }

    const desc = queue.songs
      .map((s, i) => `${i === 0 ? '▶️' : `${i}.`} ${s.name} — ${s.formattedDuration} • <@${s.user?.id || s.user}>`)
      .slice(0, 10)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(THEME.colorPrimary)
      .setTitle('🔥 File Boys & Girls')
      .setDescription(desc)
      .setFooter({ text: THEME.footer });

    try {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch {
      // dernier recours
      await interaction.followUp({ embeds: [embed], ephemeral: true }).catch(() => {});
    }
  }
};