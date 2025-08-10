const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { skip } = require('../managers/SimpleMusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Passer au prochain morceau')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '👂 Rejoins un salon vocal pour passer au suivant.', ephemeral: true });
    }

    try { await interaction.deferReply({ ephemeral: true }); } catch {}

    try {
      await skip(interaction.guildId);
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '⏭️ Hop ! Suivant.' });
      else await interaction.reply({ content: '⏭️ Hop ! Suivant.', ephemeral: true });
    } catch (err) {
      const msg = `❌ Oups: ${String(err.message || err)}`;
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: msg }).catch(() => {});
      else await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  }
};