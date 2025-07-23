// commands/admin/reset.js
const { SlashCommandBuilder } = require('discord.js');
const { REST, Routes } = require('discord.js');
const config = require('../../config.json'); // adapte le chemin si besoin

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('🔁 Supprime toutes les commandes slash du bot (globales et guild)')
    .setDefaultMemberPermissions(0), // Admin uniquement
  async execute(interaction) {
    await interaction.reply({ content: '⏳ Suppression des commandes en cours...', ephemeral: true });

    const rest = new REST({ version: '10' }).setToken(config.token);
    const clientId = config.clientId;
    const guildId = config.guildId;

    try {
      // Supprimer les commandes globales
      const globalCommands = await rest.get(Routes.applicationCommands(clientId));
      for (const command of globalCommands) {
        await rest.delete(Routes.applicationCommand(clientId, command.id));
      }

      // Supprimer les commandes guild
      const guildCommands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
      for (const command of guildCommands) {
        await rest.delete(Routes.applicationGuildCommand(clientId, guildId, command.id));
      }

      await interaction.editReply('✅ Toutes les commandes slash ont été supprimées.');
    } catch (err) {
      console.error('Erreur de suppression :', err);
      await interaction.editReply('❌ Une erreur est survenue lors de la suppression.');
    }
  },
};
