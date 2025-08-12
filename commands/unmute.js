const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Retirer le mute (timeout)')
    .addUserOption(o => o.setName('membre').setDescription('Membre à unmute').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }

    const guild = interaction.guild;
    const mod = interaction.client.moderationManager;

    const user = interaction.options.getUser('membre', true);
    const reason = interaction.options.getString('raison') || 'Aucun motif';
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'Utilisateur introuvable.', flags: 64 });
    await mod.unmuteMember(member, reason);
    return interaction.reply({ content: `✅ ${user.tag} a été unmute.`, flags: 64 });
  }
};