const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('je-suis-actif')
    .setDescription("Signaler votre activité pour éviter l'auto-kick pour inactivité"),

  cooldown: 10,

  async execute(interaction) {
    try {
      await interaction.client.moderationManager.markActive(interaction.guild.id, interaction.user.id);
      await interaction.reply({ content: '✅ Activité enregistrée. Merci !', ephemeral: true });
    } catch (e) {
      console.error('Erreur /je-suis-actif:', e);
      await interaction.reply({ content: '❌ Impossible de signaler votre activité pour le moment.', ephemeral: true });
    }
  }
};