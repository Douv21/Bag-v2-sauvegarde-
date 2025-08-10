const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { skip } = require('../managers/SimpleMusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Passe au morceau suivant')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(voiceChannel.type)) {
      return interaction.reply({ content: '🎧 Rejoins un salon vocal pour utiliser cette commande.', ephemeral: true });
    }

    try { await interaction.deferReply({ ephemeral: true }); } catch {}

    try {
      await skip(interaction.guildId);
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '⏭️ Morceau suivant.' });
      else await interaction.reply({ content: '⏭️ Morceau suivant.', ephemeral: true });
    } catch (err) {
      const msg = `❌ Erreur: ${String(err.message || err)}`;
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: msg }).catch(() => {});
      else await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  }
};