const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Débannir un utilisateur par ID')
    .addStringOption(o => o.setName('userid').setDescription('ID utilisateur').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }

    const guild = interaction.guild;

    const userId = interaction.options.getString('userid', true);
    const reason = interaction.options.getString('raison') || 'Aucun motif';
    await guild.bans.remove(userId, reason).catch(() => {});
    return interaction.reply({ content: `✅ Utilisateur ${userId} débanni.`, flags: 64 });
  }
};