const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertir un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre à avertir').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction, dataManager) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }

    const guild = interaction.guild;
    const mod = interaction.client.moderationManager;

    const user = interaction.options.getUser('membre', true);
    const reason = interaction.options.getString('raison') || 'Aucun motif';
    const warnings = await mod.addWarning(guild.id, user.id, interaction.user.id, reason);
    return interaction.reply({ content: `⚠️ Warn ajouté à ${user.tag}. Total: ${warnings.length}`, flags: 64 });
  }
};