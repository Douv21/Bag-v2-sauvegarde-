const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Voir les avertissements d\'un membre (admin)')
    .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 3,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }
    const user = interaction.options.getUser('membre', true);
    const warns = await interaction.client.moderationManager.getWarnings(interaction.guild.id, user.id);
    if (warns.length === 0) return interaction.reply({ content: `✅ Aucun avertissement pour ${user.tag}.`, flags: 64 });
    const list = warns.map((w, i) => `${i + 1}. ${new Date(w.timestamp).toLocaleString('fr-FR')} - <@${w.moderatorId}>: ${w.reason}`).join('\n');
    return interaction.reply({ content: `⚠️ Avertissements pour ${user.tag} (${warns.length})\n${list}`, flags: 64 });
  }
};