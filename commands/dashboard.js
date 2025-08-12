const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Ouvre un mini tableau de bord rapide')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🛠️ Panneau Rapide')
      .setDescription('Accès rapide aux outils admin')
      .setColor('#ff2e88');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('moderation_main').setLabel('🔞 Modération NSFW').setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};