const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ConfessionHandler = require('./ConfessionHandler');
const EconomyConfigHandler = require('./EconomyConfigHandler');

class InteractionHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.confessionHandler = new ConfessionHandler(dataManager);
        this.economyHandler = new EconomyConfigHandler(dataManager);
    }

    // === DELEGATIONS VERS HANDLERS SPECIALISES ===

    // Délégations ConfessionHandler
    async handleConfessionMainConfig(interaction) {
        return await this.confessionHandler.handleConfessionMainConfig(interaction);
    }

    async handleConfessionChannelsConfig(interaction) {
        return await this.confessionHandler.handleConfessionChannelsConfig(interaction);
    }

    async handleConfessionAutothreadConfig(interaction) {
        return await this.confessionHandler.handleConfessionAutothreadConfig(interaction);
    }

    async handleConfessionLogsConfig(interaction) {
        return await this.confessionHandler.handleConfessionLogsConfig(interaction);
    }

    async handleConfessionLogLevel(interaction) {
        return await this.confessionHandler.handleConfessionLogLevel(interaction);
    }

    async handleConfessionLogChannel(interaction) {
        return await this.confessionHandler.handleConfessionLogChannel(interaction);
    }

    async handleConfessionLogPingRoles(interaction) {
        return await this.confessionHandler.handleConfessionLogPingRoles(interaction);
    }

    async handleConfessionPingRoles(interaction) {
        return await this.confessionHandler.handleConfessionPingRoles(interaction);
    }

    async handleConfessionAddChannel(interaction) {
        return await this.confessionHandler.handleConfessionAddChannel(interaction);
    }

    async handleConfessionRemoveChannel(interaction) {
        return await this.confessionHandler.handleConfessionRemoveChannel(interaction);
    }

    async handleConfessionArchiveTime(interaction) {
        return await this.confessionHandler.handleConfessionArchiveTime(interaction);
    }

    // Délégations EconomyHandler
    async handleEconomyMainConfig(interaction) {
        return await this.economyHandler.handleEconomyMainConfig(interaction);
    }

    async handleEconomyActionsConfig(interaction) {
        return await this.economyHandler.handleEconomyActionsConfig(interaction);
    }

    async handleEconomyShopConfig(interaction) {
        return await this.economyHandler.handleEconomyShopConfig(interaction);
    }

    async handleEconomyKarmaConfig(interaction) {
        return await this.economyHandler.handleEconomyKarmaConfig(interaction);
    }

    async handleEconomyDailyConfig(interaction) {
        return await this.economyHandler.handleEconomyDailyConfig(interaction);
    }

    async handleEconomyMessagesConfig(interaction) {
        return await this.economyHandler.handleEconomyMessagesConfig(interaction);
    }

    // Autres délégations économie
    async handleActionSubConfig(interaction) {
        return await this.economyHandler.handleActionSubConfig(interaction);
    }

    async handleActionRewardAmounts(interaction) {
        return await this.economyHandler.handleActionRewardAmounts(interaction);
    }

    async handleActionKarmaAmounts(interaction) {
        return await this.economyHandler.handleActionKarmaAmounts(interaction);
    }

    async handleActionCooldownAmounts(interaction) {
        return await this.economyHandler.handleActionCooldownAmounts(interaction);
    }

    async handleActionToggleStatus(interaction) {
        return await this.economyHandler.handleActionToggleStatus(interaction);
    }

    async handleRewardsEditConfig(interaction) {
        return await this.economyHandler.handleRewardsEditConfig(interaction);
    }

    async handleKarmaEditConfig(interaction) {
        return await this.economyHandler.handleKarmaEditConfig(interaction);
    }

    async handleCooldownEditConfig(interaction) {
        return await this.economyHandler.handleCooldownEditConfig(interaction);
    }

    async handleToggleEditConfig(interaction) {
        return await this.economyHandler.handleToggleEditConfig(interaction);
    }

    // Boutique handlers
    async handleShopAddRolePrice(interaction) {
        return await this.economyHandler.handleShopAddRolePrice(interaction);
    }

    async handleShopRemoveRoleConfirm(interaction) {
        return await this.economyHandler.handleShopRemoveRoleConfirm(interaction);
    }

    async handleShopEditPriceValue(interaction) {
        return await this.economyHandler.handleShopEditPriceValue(interaction);
    }

    async handleShopItemsAction(interaction) {
        return await this.economyHandler.handleShopItemsAction(interaction);
    }

    async handleManageExistingItems(interaction) {
        return await this.economyHandler.handleManageExistingItems(interaction);
    }

    async handleShopStatsOptions(interaction) {
        return await this.economyHandler.handleShopStatsOptions(interaction);
    }

    // Karma handlers
    async handleKarmaLevelsEdit(interaction) {
        return await this.economyHandler.handleKarmaLevelsEdit(interaction);
    }

    async handleKarmaRewardConfig(interaction) {
        return await this.economyHandler.handleKarmaRewardConfig(interaction);
    }

    async handleKarmaResetEdit(interaction) {
        return await this.economyHandler.handleKarmaResetEdit(interaction);
    }

    async handleActionKarmaValues(interaction) {
        return await this.economyHandler.handleActionKarmaValues(interaction);
    }

    // Daily handlers
    async handleDailyAmountsEdit(interaction) {
        return await this.economyHandler.handleDailyAmountsEdit(interaction);
    }

    async handleDailyStreakEdit(interaction) {
        return await this.economyHandler.handleDailyStreakEdit(interaction);
    }

    async handleDailyResetEdit(interaction) {
        return await this.economyHandler.handleDailyResetEdit(interaction);
    }

    // Messages handlers
    async handleMessagesToggleEdit(interaction) {
        return await this.economyHandler.handleMessagesToggleEdit(interaction);
    }

    async handleMessagesAmountEdit(interaction) {
        return await this.economyHandler.handleMessagesAmountEdit(interaction);
    }

    async handleMessagesCooldownEdit(interaction) {
        return await this.economyHandler.handleMessagesCooldownEdit(interaction);
    }

    // Stats handlers
    async handleStatsAction(interaction) {
        return await this.economyHandler.handleStatsAction(interaction);
    }

    // Role select handlers
    async handleShopRoleTypeSelect(interaction) {
        return await this.economyHandler.handleShopRoleTypeSelect(interaction);
    }

    async handleShopPermanentPriceSelect(interaction) {
        return await this.economyHandler.handleShopPermanentPriceSelect(interaction);
    }

    async handleShopTemporaryDurationSelect(interaction) {
        return await this.economyHandler.handleShopTemporaryDurationSelect(interaction);
    }

    // Boutons handlers
    async handleBackToMain(interaction) {
        return await this.economyHandler.handleBackToMain(interaction);
    }

    async handleBackToActions(interaction) {
        return await this.economyHandler.handleBackToActions(interaction);
    }

    async handleKarmaForceReset(interaction) {
        return await this.economyHandler.handleKarmaForceReset(interaction);
    }

    async handleToggleMessageRewards(interaction) {
        return await this.economyHandler.handleToggleMessageRewards(interaction);
    }
}

module.exports = InteractionHandler;