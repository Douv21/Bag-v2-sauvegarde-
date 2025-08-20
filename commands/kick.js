const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulser un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre à expulser').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }

    const guild = interaction.guild;

    const user = interaction.options.getUser('membre', true);
    const reason = interaction.options.getString('raison') || 'Aucun motif';
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'Utilisateur introuvable.', flags: 64 });
    await member.kick(reason);
    
    // Ajouter à l'historique global
    try {
      await interaction.client.moderationManager?.addKickToHistory(user.id, guild.id, reason, interaction.user.id);
    } catch {}
    
    try { await interaction.client.logManager?.logKick(member, interaction.user, reason); } catch {}
    return interaction.reply({ content: `✅ ${user.tag} a été expulsé.`, flags: 64 });
  }
};