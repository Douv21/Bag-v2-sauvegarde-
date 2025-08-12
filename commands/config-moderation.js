const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-moderation')
    .setDescription('Configurer séparément: autokick sans rôle OU autokick inactivité')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', ephemeral: true });
    }

    const guild = interaction.guild;
    const mod = interaction.client.moderationManager;
    const cfg = await mod.getGuildConfig(guild.id);

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Configuration Modération')
      .setColor('#e91e63')
      .setDescription('Choisissez une fonctionnalité à configurer: Autokick sans rôle OU Autokick inactivité');

    const featureSelect = new StringSelectMenuBuilder()
      .setCustomId('moderation_feature_select')
      .setPlaceholder('Choisir la fonctionnalité à configurer')
      .addOptions([
        { label: 'Autokick sans rôle', value: 'feature_role', description: 'Kick si le rôle requis n\'est pas obtenu après un délai' },
        { label: 'Autokick inactivité', value: 'feature_inactivity', description: 'Kick après une période d\'inactivité' }
      ]);

    const row = new ActionRowBuilder().addComponents(featureSelect);

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};