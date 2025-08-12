const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Rendre muet un membre (timeout)')
    .addUserOption(o => o.setName('membre').setDescription('Membre à mute').setRequired(true))
    .addIntegerOption(o => o.setName('minutes').setDescription('Durée en minutes (max 40320 = 28 jours)').setMinValue(1))
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
    const minutes = interaction.options.getInteger('minutes') || 60;
    const reason = interaction.options.getString('raison') || 'Aucun motif';
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'Utilisateur introuvable.', flags: 64 });
    await mod.muteMember(member, minutes * 60 * 1000, reason, interaction.user);
    return interaction.reply({ content: `✅ ${user.tag} a été mute ${minutes} min.`, flags: 64 });
  }
};