const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { playCommand } = require('../managers/SimpleMusicManager');
const { buildControls } = require('../handlers/MusicControls');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Joue un titre depuis YouTube/SoundCloud/URL')
    .addStringOption(o => o.setName('query').setDescription('Lien ou recherche').setRequired(true))
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '💋 Rejoins un salon vocal pour jouer de la musique.', ephemeral: true });
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(interaction.client.user.id);
    const permissions = voiceChannel.permissionsFor(me);
    if (!permissions?.has(PermissionsBitField.Flags.Connect)) {
      return interaction.reply({ content: '❌ Je ne peux pas me connecter à ce salon vocal. Vérifie mes permissions (Connect).', ephemeral: true });
    }
    if (!permissions?.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({ content: '❌ Je ne peux pas parler dans ce salon vocal. Vérifie mes permissions (Speak).', ephemeral: true });
    }

    const query = interaction.options.getString('query', true);

    try {
      await interaction.deferReply({ ephemeral: true });
    } catch {}

    try {
      const track = await playCommand(voiceChannel, query, interaction.channel, interaction.user);
      // Afficher les contrôles
      try {
        await interaction.channel.send({ components: buildControls() }).catch(() => {});
      } catch {}

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: `🔥 Je lance: ${track.title || query}` }).catch(() => {});
      } else {
        await interaction.reply({ content: `🔥 Je lance: ${track.title || query}`, ephemeral: true }).catch(() => {});
      }
    } catch (err) {
      const msg = `❌ Impossible de jouer: ${String(err.message || err)}`;
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: msg }).catch(() => {});
      } else {
        await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
      }
    }
  }
};