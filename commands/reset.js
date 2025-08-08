// commands/admin/reset.js
const { SlashCommandBuilder, REST, Routes, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Supprime toutes les commandes slash du bot (ADMIN)')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    await interaction.reply({ content: '⏳ Suppression des commandes en cours...', ephemeral: true });

    try {
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: [] }
      );

      await interaction.editReply('✅ Toutes les commandes slash ont été supprimées.');
    } catch (err) {
      console.error('Erreur de suppression :', err);
      await interaction.editReply('❌ Une erreur est survenue lors de la suppression.');
    }
  }
};
