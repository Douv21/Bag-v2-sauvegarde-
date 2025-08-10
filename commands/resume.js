const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { resume } = require('../managers/SimpleMusicManager');

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
      return interaction.reply({ content: '💬 Rejoins un vocal pour relancer la musique.', ephemeral: true });
    }

    try { await interaction.deferReply({ ephemeral: true }); } catch {}

    try {
      await resume(interaction.guildId);
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '▶️ Et c’est reparti !' });
      else await interaction.reply({ content: '▶️ Et c’est reparti !', ephemeral: true });
    } catch (err) {
      const msg = `❌ Oups: ${String(err.message || err)}`;
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: msg }).catch(() => {});
      else await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  }
};