const { SlashCommandBuilder, ChannelType, PermissionsBitField, MessageFlags } = require('discord.js');
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
      return interaction.reply({ content: '💋 Rejoins un salon vocal pour que je te fasse vibrer…', flags: MessageFlags.Ephemeral });
    }

    // Vérification des permissions du bot dans le salon vocal
    const me = interaction.guild.members.me || interaction.guild.members.cache.get(interaction.client.user.id);
    const permissions = voiceChannel.permissionsFor(me);
    if (!permissions?.has(PermissionsBitField.Flags.Connect)) {
      return interaction.reply({ content: '❌ Je ne peux pas me connecter à ce salon vocal. Vérifie mes permissions (Connect).', flags: MessageFlags.Ephemeral });
    }
    if (!permissions?.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({ content: '❌ Je ne peux pas parler dans ce salon vocal. Vérifie mes permissions (Speak).', flags: MessageFlags.Ephemeral });
    }

    const query = interaction.options.getString('query', true);

    await interaction.deferReply();

    const client = interaction.client;
    const distube = getMusic(client);

    try {
      // Timeout de sécurité pour éviter un blocage éternel
      const timeoutMs = 15000;
      const playPromise = distube.play(voiceChannel, query, {
        member,
        textChannel: interaction.channel,
        interaction
      });

      await Promise.race([
        playPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_MUSIC_PLAY')), timeoutMs))
      ]);

      await interaction.editReply({ content: `🔥 Je lance: ${query}` });
    } catch (err) {
      const msg = err && err.message === 'TIMEOUT_MUSIC_PLAY'
        ? '⏳ La connexion vocale ou la récupération de la musique est trop lente. Réessaie dans un instant et vérifie mes permissions/latence.'
        : `❌ Impossible de jouer: ${String(err.message || err)}`;
      await interaction.editReply({ content: msg }).catch(() => {});
    }
  }
};