const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vider-salon')
    .setDescription('Vider le salon courant et restaurer les paramètres (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 5,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }

    const channel = interaction.channel;
    try {
      await interaction.deferReply({ flags: 64 });
      await interaction.client.moderationManager.purgeChannel(channel, { resetFeatures: true });
      await interaction.editReply({ content: '🧹 Salon vidé et paramètres restaurés (confession, counting, autothread).' });
    } catch (e) {
      console.error('Erreur /vider-salon:', e);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '❌ Erreur pendant la vidange du salon.' }).catch(() => {});
      } else {
        await interaction.reply({ content: '❌ Erreur pendant la vidange du salon.', flags: 64 }).catch(() => {});
      }
    }
  }
};