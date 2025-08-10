const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { pause } = require('../managers/SimpleMusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Met en pause le morceau en cours')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '🧘 Rejoins un vocal pour mettre en pause.', ephemeral: true });
    }

    try { await interaction.deferReply({ ephemeral: true }); } catch {}

    try {
      await pause(interaction.guildId);
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '⏸️ C’est en pause.' });
      else await interaction.reply({ content: '⏸️ C’est en pause.', ephemeral: true });
    } catch (err) {
      const msg = `❌ Oups: ${String(err.message || err)}`;
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: msg }).catch(() => {});
      else await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  }
};