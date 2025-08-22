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
      .setColor(0xff2e88)
      .setTitle('BAG Dashboard')
      .setURL(dashboardUrl)
      .setDescription('Gérez votre serveur en toute simplicité: modération, économie, niveaux, logs et plus encore.')
      .setThumbnail(`${baseUrl}/logo-bag-premium.svg`)
      .setImage(`${baseUrl}/dashboard-hero.jpg`)
      .addFields(
        { name: 'Aperçu', value: '• Navigation claire par catégories\n• Commandes documentées et filtrables\n• Paramètres clés accessibles rapidement' }
      )
      .setFooter({ text: 'BAG Bot • Dashboard', iconURL: `${baseUrl}/logo-bag.svg` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Ouvrir le dashboard')
        .setStyle(ButtonStyle.Link)
        .setURL(dashboardUrl)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};