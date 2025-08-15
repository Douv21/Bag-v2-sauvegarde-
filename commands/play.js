const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { playCommand, THEME } = require('../managers/SimpleMusicManager');
const { buildRadioSelector } = require('../handlers/RadioHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Joue une musique ou une radio')
    .addStringOption(o =>
      o.setName('terme')
        .setDescription('Lien ou recherche (ou tape "radio" pour choisir)')
        .setRequired(true)
    )
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(voiceChannel.type)) {
      return interaction.reply({ content: '🎧 Rejoins un salon vocal pour utiliser cette commande.', ephemeral: true });
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(interaction.client.user.id);
    const permissions = voiceChannel.permissionsFor(me);
    if (!permissions?.has(PermissionsBitField.Flags.Connect) || !permissions?.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({ content: '❌ Je n’ai pas les permissions pour me connecter/parler ici.', ephemeral: true });
    }

    const query = interaction.options.getString('terme', true).trim();

    // Si l'utilisateur demande explicitement le sélecteur de radios
    if (query.toLowerCase() === 'radio') {
      const components = buildRadioSelector();
      return interaction.reply({ content: '📻 Choisis une radio à écouter :', components, ephemeral: true }).catch(() => {});
    }

    try {
      await interaction.deferReply({ ephemeral: true });

      const track = await playCommand(voiceChannel, query, interaction.channel, interaction.user);

      const title = track?.title || track?.query || query;
      const msg = track?.isRadio
        ? `📻 Lecture de la radio: ${title}`
        : `🎵 Ajouté à la file: ${title}`;

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: msg }).catch(() => {});
      } else {
        await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
      }
    } catch (err) {
      const errorMsg = String(err?.message || err || 'Erreur inconnue');
      let friendly;
      
      if (errorMsg.startsWith('TIMEOUT_') || errorMsg === 'TIMEOUT_PIPED_FETCH') {
        friendly = '⏰ Timeout lors de la récupération du flux (Piped). Réessaie dans un instant ou utilise un autre terme/lien.';
      } else if (errorMsg === 'BOT_NOT_CONNECTED') {
        friendly = '🤖 Le bot n\'est pas connecté à Discord. Contacte un administrateur.';
      } else if (errorMsg === 'INVALID_VOICE_ADAPTER') {
        friendly = '⚙️ Problème de configuration vocale. Le bot doit être redémarré.';
      } else if (errorMsg === 'NOT_IN_VOICE') {
        friendly = '🎧 Rejoins un salon vocal pour utiliser cette commande.';
      } else {
        friendly = `❌ Erreur: ${errorMsg}`;
      }

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: friendly }).catch(() => {});
      } else {
        await interaction.reply({ content: friendly, ephemeral: true }).catch(() => {});
      }
    }
  }
};

 
