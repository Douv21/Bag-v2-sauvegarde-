const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-logs')
    .setDescription('Configuration du système de logs (messages, modération, arrivées/départs, pseudos)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction, dataManager) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', ephemeral: true });
    }

    try {
      const LogsConfigHandler = require('../handlers/LogsConfigHandler');
      const LogManager = require('../managers/LogManager');
      const handler = new LogsConfigHandler(dataManager, new LogManager(dataManager, interaction.client));
      const embed = new EmbedBuilder()
        .setTitle('🧾 Système de Logs')
        .setColor('#00bcd4')
        .setDescription('Cliquez pour ouvrir la configuration. Les confessions se gèrent via /config-confession.');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('logs_main').setLabel('Ouvrir la configuration des logs').setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    } catch (e) {
      console.error('Erreur ouverture config-logs:', e);
      return interaction.reply({ content: '❌ Erreur lors de l’ouverture de la configuration des logs.', ephemeral: true });
    }
  }
};