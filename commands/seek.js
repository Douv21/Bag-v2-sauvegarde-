const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { seek } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Aller à un temps spécifique dans le morceau en cours')
    .addIntegerOption(o => o.setName('secondes').setDescription('Position en secondes').setRequired(true))
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(voiceChannel.type)) {
      return interaction.reply({ content: '🎧 Rejoins un salon vocal pour utiliser cette commande.', ephemeral: true });
    }

    const seconds = interaction.options.getInteger('secondes', true);

    try {
      await seek(interaction.guildId, seconds);
      await interaction.reply({ content: `⏩ Avancé à ${seconds}s`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: `❌ Erreur: ${String(err.message || err)}`, ephemeral: true }).catch(() => {});
    }
  }
};