class ReminderInteractionHandler {
  constructor(reminderManager) {
    this.reminderManager = reminderManager;
  }

  async handleInteraction(interaction) {
    return false;
  }
}

module.exports = ReminderInteractionHandler;