const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { setVolume, getQueueInfo } = require('../managers/SimpleMusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Ajuste le volume de la musique')
    .addIntegerOption(o => o.setName('pourcentage').setDescription('0-100').setRequired(true))
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(voiceChannel.type)) {
      return interaction.reply({ content: '🎧 Rejoins un salon vocal pour utiliser cette commande.', ephemeral: true });
    }

    try {
      const val = interaction.options.getInteger('pourcentage', true);
      const v = await setVolume(interaction.guildId, val);
      await interaction.reply({ content: `🔊 Volume: ${v}%`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: `❌ Erreur: ${String(err.message || err)}`, ephemeral: true }).catch(() => {});
    }
  }
};