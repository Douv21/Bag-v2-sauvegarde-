const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { playCommand, THEME, getGuildColor } = require('../managers/MusicManager');
const { EmbedBuilder } = require('discord.js');
const { buildControls } = require('../handlers/MusicControls');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Joue une musique via Lavalink')
    .addStringOption(o =>
      o.setName('terme')
        .setDescription('Lien ou recherche')
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

    try {
      await interaction.deferReply({ ephemeral: true });

      const track = await playCommand(voiceChannel, query, interaction.channel, interaction.user);
      const title = track?.title || track?.query || query;
      const msg = `🎵 Ajouté à la file: ${title}`;

      // Envoyer un lecteur musique dans le salon texte
      try {
        const color = getGuildColor(interaction.guild);
        const embed = new EmbedBuilder()
          .setColor(color)
          .setTitle('🎶 Lecteur musique')
          .setDescription(`▶️ ${title}\nDemandé par <@${interaction.user.id}>`)
          .setFooter({ text: THEME.footer });
        const components = buildControls();
        await interaction.channel.send({ embeds: [embed], components }).catch(() => {});
      } catch {}

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: msg }).catch(() => {});
      }
    } catch (err) {
      const errorMsg = String(err?.message || err || 'Erreur inconnue');
      let friendly;
      if (errorMsg === 'LAVALINK_NOT_READY') {
        friendly = '⚙️ Lavalink non configuré ou indisponible.';
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

 
