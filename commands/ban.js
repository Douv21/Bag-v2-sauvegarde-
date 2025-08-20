const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannir un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre à bannir').setRequired(true))
    .addIntegerOption(o =>
      o
        .setName('suppr_jours')
        .setDescription('Supprimer les messages des N derniers jours (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
    )
    .addStringOption(o => o.setName('raison').setDescription('Raison'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }

    const guild = interaction.guild;

    const user = interaction.options.getUser('membre', true);
    const deleteDays = interaction.options.getInteger('suppr_jours') ?? 0;
    const reason = interaction.options.getString('raison') || 'Aucun motif';
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'Utilisateur introuvable dans ce serveur.', flags: 64 });
    const deleteMessageSeconds = Math.max(0, Math.min(7, deleteDays)) * 24 * 60 * 60;
    await member.ban({ reason, deleteMessageSeconds });
    
    // Ajouter à l'historique global
    try {
      await interaction.client.moderationManager?.addBanToHistory(user.id, guild.id, reason, interaction.user.id);
    } catch {}
    
    try { await interaction.client.logManager?.logBan(guild, user, reason, interaction.user); } catch {}
    return interaction.reply({ content: `✅ ${user.tag} a été banni.`, flags: 64 });
  }
};