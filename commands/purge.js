const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Vider le salon courant et restaurer les paramètres spéciaux')
    .addIntegerOption(o => o.setName('messages').setDescription('Nombre de messages à supprimer (optionnel, sinon purge étendue)').setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction, dataManager) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }

    const guild = interaction.guild;
    const mod = interaction.client.moderationManager;
    const count = interaction.options.getInteger('messages');
    const channel = interaction.channel;
    if (count && count > 0) {
      const deleted = await channel.bulkDelete(count, true).catch(() => null);
      return interaction.reply({ content: `🧹 ${deleted?.size || 0} messages supprimés.`, flags: 64 });
    } else {
      await interaction.deferReply({ flags: 64 });
      await mod.purgeChannel(channel, { resetFeatures: true }, interaction.user);
      return interaction.editReply({ content: '🧹 Salon vidé et paramètres restaurés (confession, counting, autothread, ...).' });
    }
  }
};