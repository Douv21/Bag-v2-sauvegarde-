const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Ouvre le tableau de bord (version minimale)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction) {
    const port = process.env.PORT || 5000;
    const external = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_BASE_URL || process.env.DASHBOARD_URL;
    const baseUrl = (external ? String(external).replace(/\/$/, '') : `http://localhost:${port}`);
    const guildId = interaction.guildId || interaction.guild?.id || '';
    const dashboardUrl = `${baseUrl}/dashboard${guildId ? `?guildId=${guildId}` : ''}`;

    const embed = new EmbedBuilder()
      .setTitle('📊 Tableau de bord — BAG v2')
      .setDescription('Accès au tableau de bord minimal, avec statistiques en temps réel (membres actifs, messages du jour, etc.).')
      .addFields({ name: 'Lien', value: `[Ouvrir le tableau de bord](${dashboardUrl})` })
      .setColor('#ff2e88');

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};