const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Relance la lecture')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '💬 Rejoins un vocal pour relancer la musique, honey.', ephemeral: true });
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(interaction.client.user.id);
    const permissions = voiceChannel.permissionsFor(me);
    if (!permissions?.has(PermissionsBitField.Flags.Connect) || !permissions?.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({ content: '❌ Je n’ai pas la permission de me connecter/parler dans ce salon.', ephemeral: true });
    }

    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '😴 Pas de lecture en cours.', ephemeral: true });

    await interaction.deferReply();
    try {
      queue.resume();
      await interaction.editReply({ content: '▶️ Et c’est reparti !' });
    } catch (err) {
      const msg = `❌ Oups: ${String(err.message || err)}`;
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: msg }).catch(() => {});
      } else {
        await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
      }
    }
  }
};