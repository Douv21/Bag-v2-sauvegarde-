const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { buildRadioSelector } = require('../handlers/RadioHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('Ouvre un sélecteur pour écouter une radio en direct')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(voiceChannel.type)) {
      return interaction.reply({ content: '🎧 Rejoins un salon vocal pour écouter la radio.', ephemeral: true });
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(interaction.client.user.id);
    const permissions = voiceChannel.permissionsFor(me);
    if (!permissions?.has(PermissionsBitField.Flags.Connect)) {
      return interaction.reply({ content: '❌ Je ne peux pas me connecter à ce salon vocal. Vérifie mes permissions (Connect).', ephemeral: true });
    }
    if (!permissions?.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({ content: '❌ Je ne peux pas parler dans ce salon vocal. Vérifie mes permissions (Speak).', ephemeral: true });
    }

    try {
      await interaction.reply({ content: '📻 Choisis une radio:', components: buildRadioSelector() });
    } catch (err) {
      await interaction.reply({ content: `❌ Erreur: ${String(err.message || err)}`, ephemeral: true }).catch(() => {});
    }
  }
};