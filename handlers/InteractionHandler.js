// handlers/InteractionHandler.js
const ConfessionHandler = require('./ConfessionHandler');
const EconomyConfigHandler = require('./EconomyConfigHandler');

class InteractionHandler {
    constructor(dataManager) {
        this.confessionHandler = new ConfessionHandler(dataManager);
        this.economyHandler = new EconomyConfigHandler(dataManager);
    }

    // === ECONOMY ===
    handleEconomyMainConfig(interaction) { return this.economyHandler.handleEconomyMainConfig(interaction); }
    handleEconomyActionsConfig(interaction) { return this.economyHandler.handleEconomyActionsConfig(interaction); }
    handleEconomyShopConfig(interaction) { return this.economyHandler.handleEconomyShopConfig(interaction); }
    handleEconomyKarmaConfig(interaction) { return this.economyHandler.handleEconomyKarmaConfig(interaction); }
    handleEconomyDailyConfig(interaction) { return this.economyHandler.handleEconomyDailyConfig(interaction); }
    handleEconomyMessagesConfig(interaction) { return this.economyHandler.handleEconomyMessagesConfig(interaction); }
    handleStatsAction(interaction) { return this.economyHandler.handleStatsAction(interaction); }

    // === CONFESSION ===
    handleConfessionMainConfig(interaction) { return this.confessionHandler.handleConfessionMainConfig(interaction); }
    handleConfessionChannelsConfig(interaction) { return this.confessionHandler.handleConfessionChannelsConfig(interaction); }
    handleConfessionAutothreadConfig(interaction) { return this.confessionHandler.handleConfessionAutothreadConfig(interaction); }
    handleConfessionLogsConfig(interaction) { return this.confessionHandler.handleConfessionLogsConfig(interaction); }

    // === EXAMPLES FOR DYNAMIC ===
    handleShopRemoveRoleConfirm(interaction) { return this.economyHandler.handleShopRemoveRoleConfirm(interaction); }
    handleShopEditPriceValue(interaction) { return this.economyHandler.handleShopEditPriceValue(interaction); }
    handleActionToggleStatus(interaction) { return this.economyHandler.handleActionToggleStatus(interaction); }
}

module.exports = InteractionHandler;
