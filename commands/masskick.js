const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('masskick')
    .setDescription('Expulser plusieurs membres (@mentions ou IDs séparés par des espaces)')
    .addStringOption(o => o.setName('membres').setDescription('Mentions/IDs').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }
    const guild = interaction.guild;

    const input = interaction.options.getString('membres', true);
    const reason = interaction.options.getString('raison') || 'Aucun motif';
    const ids = input.match(/\d{16,20}/g) || [];
    let success = 0; let failed = 0;
    for (const id of ids) {
      const member = await guild.members.fetch(id).catch(() => null);
      if (!member) { failed++; continue; }
      await member.kick(reason).then(() => success++).catch(() => failed++);
    }
    return interaction.reply({ content: `✅ Masskick terminé. Réussis: ${success}, Échecs: ${failed}`, flags: 64 });
  }
};