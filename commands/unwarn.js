const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Retirer le dernier avertissement d\'un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }

    const guild = interaction.guild;
    const mod = interaction.client.moderationManager;

    const user = interaction.options.getUser('membre', true);
    const removed = await mod.removeLastWarning(guild.id, user.id);
    if (!removed) return interaction.reply({ content: `❌ Aucun warn à retirer pour ${user.tag}.`, flags: 64 });
    return interaction.reply({ content: `✅ Dernier warn retiré pour ${user.tag}.`, flags: 64 });
  }
};