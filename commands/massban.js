const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('massban')
    .setDescription('Bannir plusieurs utilisateurs (IDs séparés par des espaces)')
    .addStringOption(o => o.setName('userids').setDescription('IDs utilisateurs').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }
    const guild = interaction.guild;

    const ids = (interaction.options.getString('userids', true) || '').split(/\s+/).filter(Boolean);
    const reason = interaction.options.getString('raison') || 'Aucun motif';
    let success = 0; let failed = 0;
    for (const id of ids) {
      await guild.bans.create(id, { reason }).then(() => success++).catch(() => failed++);
    }
    return interaction.reply({ content: `✅ Massban terminé. Réussis: ${success}, Échecs: ${failed}`, flags: 64 });
  }
};