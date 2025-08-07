const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

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
      return interaction.reply({ content: '👀 La file ? Rejoins un vocal pour jeter un œil.', flags: 64 });
    }

    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    if (!queue || !queue.songs.length) {
      return interaction.reply({ content: '😴 La file est vide.', flags: 64 });
    }

    const desc = queue.songs.map((s, i) => `${i === 0 ? '▶️' : `${i}.`} ${s.name} — ${s.formattedDuration} • <@${s.user?.id || s.user}>`).slice(0, 10).join('\n');
    const embed = new EmbedBuilder().setColor('#FF3E8D').setTitle('🔥 File Boys & Girls').setDescription(desc);

    await interaction.reply({ embeds: [embed] });
  }
};