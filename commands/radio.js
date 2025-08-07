const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('Lance une station de radio (URL du flux)')
    .addStringOption(o => o.setName('url').setDescription('URL du flux radio (mp3/aac/m3u)').setRequired(true))
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '📻 Pour la radio, rejoins un salon vocal.', flags: 64 });
    }

    const url = interaction.options.getString('url', true);

    await interaction.deferReply();
    const distube = getMusic(interaction.client);

    try {
      await distube.play(voiceChannel, url, {
        member,
        textChannel: interaction.channel,
        interaction
      });
      await interaction.editReply({ content: `📻 Radio lancée: ${url}` });
    } catch (err) {
      await interaction.editReply({ content: `❌ Impossible de lire le flux: ${String(err.message || err)}` });
    }
  }
};