const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Statut du dashboard web')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction) {
    const port = process.env.PORT || 5000;
    const external = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_BASE_URL || process.env.DASHBOARD_URL;
    const baseUrl = (external ? String(external).replace(/\/$/, '') : `http://localhost:${port}`);
    const dashboardUrl = `${baseUrl}/dashboard`;

    const embed = new EmbedBuilder()
      .setTitle('📊 Dashboard en reconstruction')
      .setDescription('Le tableau de bord web est en cours de refonte. Une version allégée sera réintroduite progressivement.')
      .addFields({ name: 'Accès', value: `[Page placeholder](${dashboardUrl})` })
      .setColor('#ff2e88');

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};