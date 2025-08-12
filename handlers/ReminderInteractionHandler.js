class ReminderInteractionHandler {
  constructor(reminderManager) {
    this.reminderManager = reminderManager;
  }

  async handleInteraction(interaction) {
    if (!interaction.customId) return false;
    if (!interaction.isButton()) return false;

    const id = interaction.customId;
    if (id.startsWith('bump_reminder_done_')) {
      const guildId = id.substring('bump_reminder_done_'.length);
      try {
        await this.reminderManager.restartCooldown(guildId);
        await interaction.reply({ content: '✅ Merci ! Le cooldown a été relancé.', ephemeral: true });
      } catch (e) {
        await interaction.reply({ content: '❌ Erreur lors du redémarrage du cooldown.', ephemeral: true });
      }
      return true;
    }

    if (id.startsWith('bump_reminder_info_')) {
      try {
        await interaction.reply({ content: '📢 Ouvrez le canal de rappel et exécutez la commande /bump avec le bot DISBOARD.', ephemeral: true });
      } catch {}
      return true;
    }

    return false;
  }
}

module.exports = ReminderInteractionHandler;