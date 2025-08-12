const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-moderation')
    .setDescription('Ouvrir le menu de configuration de la modération')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Configuration Modération')
      .setColor('#e91e63')
      .setDescription('Cliquez sur le bouton ci-dessous pour ouvrir le menu de modération complet.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('moderation_main')
        .setLabel('Ouvrir le menu Modération')
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};