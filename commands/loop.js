const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Règle le mode loop')
    .addStringOption(o => o.setName('mode').setDescription('off | song | queue').setRequired(true).addChoices(
      { name: 'off', value: 'off' },
      { name: 'song', value: 'song' },
      { name: 'queue', value: 'queue' }
    ))
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '🔁 Rejoins un salon vocal pour régler le loop.', ephemeral: true });
    }

    const modeOpt = interaction.options.getString('mode', true);
    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '😴 Aucun morceau en cours.', ephemeral: true });

    let mode = 0;
    if (modeOpt === 'song') mode = 1;
    else if (modeOpt === 'queue') mode = 2;
    const res = queue.setRepeatMode(mode);

    const label = res === 0 ? 'off' : res === 1 ? 'song' : 'queue';
    await interaction.reply({ content: `🔁 Loop: ${label}`, ephemeral: true }).catch(() => {});
  }
};