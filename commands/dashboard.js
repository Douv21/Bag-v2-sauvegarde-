const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Ouvre le dashboard web complet du bot (BAG V2)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction) {
    const port = process.env.PORT || 5000;
    const external = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_BASE_URL || process.env.DASHBOARD_URL;
    const baseUrl = (external ? String(external).replace(/\/$/, '') : `http://localhost:${port}`);
    const dashboardUrl = `${baseUrl}/dashboard/${interaction.guild.id}`;

    const embed = new EmbedBuilder()
      .setTitle('📊 Dashboard BAG V2')
      .setDescription('Ouvrez l\'interface web complète pour consulter les statistiques et configurer toutes les fonctionnalités du bot.')
      .setColor('#ff2e88');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('🌐 Ouvrir le Dashboard Web').setStyle(ButtonStyle.Link).setURL(dashboardUrl)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};