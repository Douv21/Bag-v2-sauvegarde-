// routes/interactionRoutes.js
module.exports = [
    // === ECONOMY STATIC ROUTES ===
    { pattern: /^economy_config_main$/, method: 'handleEconomyMainConfig' },
    { pattern: /^economy_actions_config$/, method: 'handleEconomyActionsConfig' },
    { pattern: /^economy_shop_config$/, method: 'handleEconomyShopConfig' },
    { pattern: /^economy_karma_config$/, method: 'handleEconomyKarmaConfig' },
    { pattern: /^economy_daily_config$/, method: 'handleEconomyDailyConfig' },
    { pattern: /^economy_messages_config$/, method: 'handleEconomyMessagesConfig' },
    { pattern: /^economy_stats_config$/, method: 'handleStatsAction' },

    // === CONFESSION STATIC ROUTES ===
    { pattern: /^confession_main_config$/, method: 'handleConfessionMainConfig' },
    { pattern: /^confession_channels_config$/, method: 'handleConfessionChannelsConfig' },
    { pattern: /^confession_autothread_config$/, method: 'handleConfessionAutothreadConfig' },
    { pattern: /^confession_logs_config$/, method: 'handleConfessionLogsConfig' },

    // === DYNAMIC ROUTES (EXAMPLES) ===
    { pattern: /^shop_remove_role:\d+$/, method: 'handleShopRemoveRoleConfirm' },
    { pattern: /^shop_edit_price:\d+$/, method: 'handleShopEditPriceValue' },
    { pattern: /^action_toggle_status:\w+$/, method: 'handleActionToggleStatus' },
];
