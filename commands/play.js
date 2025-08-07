const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Joue un titre depuis YouTube/Spotify/SoundCloud/URL')
    .addStringOption(o => o.setName('query').setDescription('Lien ou recherche').setRequired(true))
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '💋 Rejoins un salon vocal pour que je te fasse vibrer…', flags: 64 });
    }

    const query = interaction.options.getString('query', true);

    await interaction.deferReply();

    const client = interaction.client;
    const distube = getMusic(client);

    try {
      await distube.play(voiceChannel, query, {
        member,
        textChannel: interaction.channel,
        interaction
      });
      await interaction.editReply({ content: `🔥 Je lance: ${query}` });
    } catch (err) {
      await interaction.editReply({ content: `❌ Impossible de jouer: ${String(err.message || err)}` });
    }
  }
};