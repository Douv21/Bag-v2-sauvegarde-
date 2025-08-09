const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { playAlt } = require('../managers/AltPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('altplay')
    .setDescription('Lecture via moteur alternatif (SoundCloud/YouTube/URL direct)')
    .addStringOption(o => o.setName('query').setDescription('Lien ou recherche').setRequired(true))
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '🎧 Rejoins un salon vocal.', ephemeral: true });
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(interaction.client.user.id);
    const permissions = voiceChannel.permissionsFor(me);
    if (!permissions?.has(PermissionsBitField.Flags.Connect)) {
      return interaction.reply({ content: '❌ Je ne peux pas me connecter à ce salon vocal. (Connect).', ephemeral: true });
    }
    if (!permissions?.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({ content: '❌ Je ne peux pas parler dans ce salon vocal. (Speak).', ephemeral: true });
    }

    const query = interaction.options.getString('query', true);

    try {
      await interaction.deferReply({ ephemeral: true });
    } catch {}

    try {
      await playAlt(voiceChannel, query, interaction.channel, interaction.user);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: `🚀 Moteur alternatif lancé: ${query}` }).catch(() => {});
      } else {
        await interaction.reply({ content: `🚀 Moteur alternatif lancé: ${query}`, ephemeral: true }).catch(() => {});
      }
    } catch (err) {
      const msg = `❌ Échec: ${String(err?.message || err)}`;
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: msg }).catch(() => {});
      } else {
        await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
      }
    }
  }
};