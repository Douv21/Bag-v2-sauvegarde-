const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inactivity-report')
    .setDescription('Signaler une activité récente pour éviter l\'auto-kick'),

  cooldown: 2,

  async execute(interaction) {
    const guild = interaction.guild;
    await interaction.client.moderationManager.markActive(guild.id, interaction.user.id);
    return interaction.reply({ content: '✅ Activité signalée. Vous ne serez pas auto-kick pour inactivité.', ephemeral: true });
  }
};