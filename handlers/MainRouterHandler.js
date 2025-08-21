const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class MainRouterHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
        
        // Initialiser les handlers spécialisés
        this.initializeHandlers();
    }

    initializeHandlers() {
        try {
            const InteractionHandler = require('./InteractionHandler');
            this.interactionHandler = new InteractionHandler(this.dataManager);
            
            const EconomyConfigHandler = require('./EconomyConfigHandler');
            this.economyHandler = new EconomyConfigHandler(this.dataManager);
            
            const ConfessionHandler = require('./ConfessionHandler');
            this.confessionHandler = new ConfessionHandler(this.dataManager);
            
            const ConfessionConfigHandler = require('./ConfessionConfigHandler');
            this.confessionConfigHandler = new ConfessionConfigHandler(this.dataManager);
            
            // Initialiser les autres handlers
            try {
                const AouvConfigHandler = require('./AouvConfigHandler');
                this.aouvHandler = new AouvConfigHandler(this.dataManager);
            } catch (e) {
                console.log('⚠️ AouvConfigHandler non disponible');
            }

            try {
                const LevelConfigHandler = require('./LevelConfigHandler');
                this.levelHandler = new LevelConfigHandler();
            } catch (e) {
                console.log('⚠️ LevelConfigHandler non disponible');
            }

            try {
                const CountingConfigHandler = require('./CountingConfigHandler');
                this.countingHandler = new CountingConfigHandler(this.dataManager);
            } catch (e) {
                console.log('⚠️ CountingConfigHandler non disponible');
            }

            try {
                const LogsConfigHandler = require('./LogsConfigHandler');
                this.logsHandler = new LogsConfigHandler(this.dataManager);
            } catch (e) {
                console.log('⚠️ LogsConfigHandler non disponible');
            }

            try {
                const AutoThreadConfigHandler = require('./AutoThreadConfigHandler');
                this.autothreadHandler = new AutoThreadConfigHandler(this.dataManager);
            } catch (e) {
                console.log('⚠️ AutoThreadConfigHandler non disponible');
            }

            try {
                const BumpInteractionHandler = require('./BumpInteractionHandler');
                this.bumpHandler = new BumpInteractionHandler(this.dataManager);
            } catch (e) {
                console.log('⚠️ BumpInteractionHandler non disponible');
            }

            try {
                const DashboardHandler = require('./DashboardHandler');
                this.dashboardHandler = new DashboardHandler(this.dataManager);
            } catch (e) {
                console.log('⚠️ DashboardHandler non disponible');
            }

            try {
                const SecurityConfigHandler = require('./SecurityConfigHandler');
                // Le moderationManager sera initialisé plus tard via setClient
                this.securityConfigHandler = null;
            } catch (e) {
                console.log('⚠️ SecurityConfigHandler non disponible:', e.message);
            }
            
            console.log('✅ Handlers spécialisés initialisés');
        } catch (error) {
            console.error('❌ Erreur initialisation handlers:', error);
        }
    }

    /**
     * Initialiser les handlers qui dépendent du client
     * @param {Client} client - Le client Discord
     */
    setClient(client) {
        try {
            // Initialiser SecurityConfigHandler avec moderationManager
            if (client.moderationManager && !this.securityConfigHandler) {
                const SecurityConfigHandler = require('./SecurityConfigHandler');
                this.securityConfigHandler = new SecurityConfigHandler(client.moderationManager);
                console.log('✅ SecurityConfigHandler initialisé avec moderationManager');
            }
        } catch (error) {
            console.error('❌ Erreur initialisation SecurityConfigHandler:', error);
        }
    }

    async handleInteraction(interaction) {
        try {
            if (!interaction.customId) {
                return false;
            }

            const customId = interaction.customId;
            console.log(`🔄 Traitement interaction: ${customId}`);

            // === GESTION DES MODALS ===
            if (interaction.isModalSubmit()) {
                return await this.handleModalSubmit(interaction, customId);
            }

            // === GESTION DES BOUTONS ===
            if (interaction.isButton()) {
                return await this.handleButtonInteraction(interaction, customId);
            }

            // === GESTION DES SELECT MENUS ===
            if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu() || interaction.isRoleSelectMenu()) {
                return await this.handleSelectMenuInteraction(interaction, customId);
            }

            return false;
        } catch (error) {
            console.error('❌ Erreur dans MainRouterHandler:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors du traitement de cette interaction.',
                        ephemeral: true
                    });
                } catch (replyError) {
                    console.error('❌ Erreur lors de la réponse d\'erreur:', replyError);
                }
            }
            return true; // Interaction gérée même en cas d'erreur
        }
    }

    async handleModalSubmit(interaction, customId) {
        try {
            // === VALIDATION MODAL HANDLER ===
            const { modalHandler } = require('../utils/modalHandler');
            const isImplemented = await modalHandler.handleModalSubmission(interaction);
            if (!isImplemented) {
                return true; // Modal non implémenté, déjà géré par modalHandler
            }

            // === MODALS ÉCONOMIQUES ===
            if (customId.startsWith('action_config_modal_')) {
                await this.economyHandler.handleActionConfigModal(interaction);
                return true;
            }
            
            if (customId === 'objet_perso_modal') {
                await this.economyHandler.handleObjetPersoModal(interaction);
                return true;
            }

            if (customId === 'daily_amount_modal') {
                await this.economyHandler.handleDailyAmountModal(interaction);
                return true;
            }

            if (customId === 'daily_streak_modal') {
                await this.economyHandler.handleDailyStreakModal(interaction);
                return true;
            }

            if (customId === 'message_amount_modal') {
                await this.economyHandler.handleMessageAmountModal(interaction);
                return true;
            }

            if (customId === 'message_cooldown_modal') {
                await this.economyHandler.handleMessageCooldownModal(interaction);
                return true;
            }

            if (customId === 'message_limits_modal') {
                await this.economyHandler.handleMessageLimitsModal(interaction);
                return true;
            }

            if (customId === 'karma_levels_modal') {
                await this.economyHandler.handleKarmaLevelsModal(interaction);
                return true;
            }
            
            if (customId === 'remise_karma_modal') {
                await this.economyHandler.handleRemiseModal(interaction);
                return true;
            }
            
            if (customId === 'modify_remises_modal') {
                await this.economyHandler.handleModifyRemiseModal(interaction);
                return true;
            }
            
            if (customId === 'delete_remises_modal') {
                await this.economyHandler.handleDeleteRemiseModal(interaction);
                return true;
            }

            if (customId.includes('shop_role_price_modal')) {
                await this.economyHandler.handleShopRolePriceModal(interaction);
                return true;
            }

            // === MODALS AOUV ===
            if (this.aouvHandler) {
                if (customId === 'aouv_prompt_add_modal') {
                    await this.aouvHandler.handleAouvPromptAddModal(interaction);
                    return true;
                }

                if (customId === 'aouv_prompt_add_bulk_modal') {
                    await this.aouvHandler.handleAouvPromptAddBulkModal(interaction);
                    return true;
                }

                if (customId === 'aouv_prompt_edit_modal') {
                    await this.aouvHandler.handleAouvPromptEditModal(interaction);
                    return true;
                }

                if (customId === 'aouv_prompt_remove_modal') {
                    await this.aouvHandler.handleAouvPromptRemoveModal(interaction);
                    return true;
                }

                if (customId === 'aouv_prompt_disable_base_modal') {
                    await this.aouvHandler.handleAouvPromptBaseModal(interaction, true);
                    return true;
                }

                if (customId === 'aouv_prompt_enable_base_modal') {
                    await this.aouvHandler.handleAouvPromptBaseModal(interaction, false);
                    return true;
                }

                if (customId === 'aouv_prompt_list_base_modal') {
                    await this.aouvHandler.handleAouvPromptListBaseModal(interaction);
                    return true;
                }

                if (customId === 'aouv_prompt_override_base_modal') {
                    await this.aouvHandler.handleAouvPromptOverrideBaseModal(interaction);
                    return true;
                }

                if (customId === 'aouv_prompt_reset_override_base_modal') {
                    await this.aouvHandler.handleAouvPromptResetOverrideBaseModal(interaction);
                    return true;
                }

                // NSFW Modals
                if (customId === 'aouv_nsfw_prompt_add_modal') {
                    await this.aouvHandler.handleAouvNsfwPromptAddModal(interaction);
                    return true;
                }

                if (customId === 'aouv_nsfw_prompt_add_bulk_modal') {
                    await this.aouvHandler.handleAouvNsfwPromptAddBulkModal(interaction);
                    return true;
                }

                if (customId === 'aouv_nsfw_prompt_edit_modal') {
                    await this.aouvHandler.handleAouvNsfwPromptEditModal(interaction);
                    return true;
                }

                if (customId === 'aouv_nsfw_prompt_remove_modal') {
                    await this.aouvHandler.handleAouvNsfwPromptRemoveModal(interaction);
                    return true;
                }

                if (customId === 'aouv_nsfw_prompt_list_base_modal') {
                    await this.aouvHandler.handleAouvNsfwPromptListBaseModal(interaction);
                    return true;
                }

                if (customId === 'aouv_nsfw_prompt_override_base_modal') {
                    await this.aouvHandler.handleAouvNsfwPromptOverrideBaseModal(interaction);
                    return true;
                }

                if (customId === 'aouv_nsfw_prompt_reset_override_base_modal') {
                    await this.aouvHandler.handleAouvNsfwPromptResetOverrideBaseModal(interaction);
                    return true;
                }

                if (customId === 'aouv_nsfw_prompt_disable_base_modal') {
                    await this.aouvHandler.handleAouvNsfwPromptBaseModal(interaction, true);
                    return true;
                }

                if (customId === 'aouv_nsfw_prompt_enable_base_modal') {
                    await this.aouvHandler.handleAouvNsfwPromptBaseModal(interaction, false);
                    return true;
                }
            }

            // === MODALS LEVEL SYSTEM ===
            if (this.levelHandler) {
                if (customId.startsWith('style_backgrounds_modal_') || customId.startsWith('style_backgrounds_default_modal_')) {
                    await this.levelHandler.handleStyleBackgroundsModal(interaction, customId);
                    return true;
                }
            }

            // === MODALS AUTOTHREAD SYSTEM ===
            if (this.autothreadHandler && customId.startsWith('autothread_')) {
                if (customId === 'autothread_name_modal') {
                    await this.autothreadHandler.handleThreadNameModal(interaction);
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('❌ Erreur modal submit:', error);
            return false;
        }
    }

    async handleButtonInteraction(interaction, customId) {
        try {
            // === BOUTONS ÉCONOMIE ===
            if (customId === 'economy_main_config') {
                await this.economyHandler.handleEconomyMainConfig(interaction);
                return true;
            }

            if (customId === 'economy_actions_config') {
                await this.economyHandler.handleEconomyActionsConfig(interaction);
                return true;
            }

            if (customId === 'economy_shop_config') {
                await this.economyHandler.handleEconomyShopConfig(interaction);
                return true;
            }

            if (customId === 'economy_karma_config') {
                await this.economyHandler.handleEconomyKarmaConfig(interaction);
                return true;
            }

            if (customId === 'economy_daily_config') {
                await this.economyHandler.handleEconomyDailyConfig(interaction);
                return true;
            }

            if (customId === 'economy_messages_config') {
                await this.economyHandler.handleEconomyMessagesConfig(interaction);
                return true;
            }

            // Boutons de navigation
            if (customId === 'back_to_main') {
                await this.economyHandler.handleBackToMain(interaction);
                return true;
            }

            if (customId === 'back_to_actions') {
                await this.economyHandler.handleBackToActions(interaction);
                return true;
            }

            // Boutons karma
            if (customId === 'karma_force_reset') {
                await this.economyHandler.handleKarmaForceReset(interaction);
                return true;
            }

            if (customId === 'toggle_message_rewards') {
                await this.economyHandler.handleToggleMessageRewards(interaction);
                return true;
            }

            // === BOUTONS CONFESSION ===
            if (customId === 'confession_main_config') {
                await this.confessionHandler.handleConfessionMainConfig(interaction);
                return true;
            }

            if (customId === 'confession_channels_config') {
                await this.confessionHandler.handleConfessionChannelsConfig(interaction);
                return true;
            }

            if (customId === 'confession_autothread_config') {
                await this.confessionHandler.handleConfessionAutothreadConfig(interaction);
                return true;
            }

            if (customId === 'confession_logs_config') {
                await this.confessionHandler.handleConfessionLogsConfig(interaction);
                return true;
            }

            // === BOUTONS AOUV ===
            if (customId === 'aouv_btn_action' || customId === 'aouv_btn_verite') {
                console.log('🎯 Bouton AouV cliqué via MainRouter:', customId);
                const aouvCommand = require('../commands/aouv');
                await aouvCommand.handleButton(interaction, this.dataManager);
                return true;
            }

            // === BOUTONS CONTINUATION AOUV ===
            if (this.aouvHandler && (customId.startsWith('aouv_continue_') || customId === 'aouv_back_to_menu')) {
                console.log('🔄 Bouton continuation AouV:', customId);
                await this.aouvHandler.handleContinueAddingButton(interaction, customId);
                return true;
            }

            // === BOUTONS PAGINATION AOUV ===
            if (this.aouvHandler && customId.includes('_page_') && (customId.startsWith('aouv_prompt_') || customId.startsWith('aouv_nsfw_prompt_'))) {
                console.log('📄 Bouton pagination AouV:', customId);
                
                // Parser le customId pour extraire les informations de pagination
                const parts = customId.split('_');
                const pageIndex = parts.indexOf('page');
                if (pageIndex !== -1 && pageIndex + 1 < parts.length) {
                    const page = parseInt(parts[pageIndex + 1], 10) || 1;
                    const kind = parts[pageIndex - 1]; // Le type est généralement juste avant 'page'
                    
                    // Déterminer quelle méthode appeler selon le type de pagination
                    if (customId.includes('_edit_list_')) {
                        if (customId.includes('_nsfw_')) {
                            await this.aouvHandler.showAouvNsfwPromptEditListPaged(interaction, kind, page);
                        } else {
                            await this.aouvHandler.showAouvPromptEditListPaged(interaction, kind, page);
                        }
                    } else if (customId.includes('_remove_list_')) {
                        if (customId.includes('_nsfw_')) {
                            await this.aouvHandler.showAouvNsfwPromptRemoveListPaged(interaction, kind, page);
                        } else {
                            await this.aouvHandler.showAouvPromptRemoveListPaged(interaction, kind, page);
                        }
                    } else if (customId.includes('_list_custom_')) {
                        if (customId.includes('_nsfw_')) {
                            await this.aouvHandler.showAouvNsfwPromptListCustomPaged(interaction, kind, page);
                        } else {
                            await this.aouvHandler.showAouvPromptListCustomPaged(interaction, kind, page);
                        }
                    } else if (customId.includes('_list_base_')) {
                        await this.aouvHandler.showAouvPromptListBasePaged(interaction, kind, page);
                    } else if (customId.includes('_override_list_')) {
                        await this.aouvHandler.showAouvPromptOverrideBaseListPaged(interaction, kind, page);
                    }
                    
                    return true;
                }
            }

            // === BOUTONS DASHBOARD ===
            if (this.dashboardHandler && customId.startsWith('dashboard_')) {
                await this.dashboardHandler.handleDashboardButton(interaction);
                return true;
            }

            // === BOUTONS LEVEL SYSTEM ===
            if (this.levelHandler && customId.startsWith('level_')) {
                await this.levelHandler.handleLevelButton(interaction, customId);
                return true;
            }

            // === BOUTONS COUNTING SYSTEM ===
            if (this.countingHandler && customId.startsWith('counting_')) {
                await this.countingHandler.handleCountingSelect(interaction);
                return true;
            }

            // === BOUTONS AUTOTHREAD SYSTEM ===
            if (this.autothreadHandler && customId.startsWith('autothread_')) {
                await this.autothreadHandler.handleAutothreadSelect(interaction);
                return true;
            }

            // === BOUTONS CONFESSION CONFIG ===
            if (this.confessionConfigHandler && (customId.startsWith('confession_config') || customId.includes('confession_logs_back') || customId.includes('confession_autothread_back'))) {
                await this.confessionConfigHandler.handleConfessionConfigSelect(interaction);
                return true;
            }

            // === BOUTONS SECURITY CONFIG ===
            if (customId.startsWith('config_verif_')) {
                if (this.securityConfigHandler) {
                    await this.securityConfigHandler.handleConfigVerifButton(interaction);
                    return true;
                } else {
                    await interaction.reply({
                        content: '❌ Le gestionnaire de configuration de sécurité n\'est pas disponible.',
                        ephemeral: true
                    });
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('❌ Erreur button interaction:', error);
            return false;
        }
    }

    async handleSelectMenuInteraction(interaction, customId) {
        try {
            // === SELECT MENUS ÉCONOMIE ===
            if (customId.startsWith('action_sub_config_')) {
                await this.economyHandler.handleActionSubConfig(interaction);
                return true;
            }

            if (customId === 'shop_items_action') {
                await this.economyHandler.handleShopItemsAction(interaction);
                return true;
            }

            if (customId === 'manage_existing_items') {
                await this.economyHandler.handleManageExistingItems(interaction);
                return true;
            }

            if (customId === 'shop_stats_options') {
                await this.economyHandler.handleShopStatsOptions(interaction);
                return true;
            }

            if (customId === 'shop_role_type_select') {
                await this.economyHandler.handleShopRoleTypeSelect(interaction);
                return true;
            }

            if (customId === 'shop_permanent_price_select') {
                await this.economyHandler.handleShopPermanentPriceSelect(interaction);
                return true;
            }

            if (customId === 'shop_temporary_duration_select') {
                await this.economyHandler.handleShopTemporaryDurationSelect(interaction);
                return true;
            }

            // Select menus karma
            if (customId === 'karma_levels_edit') {
                await this.economyHandler.handleKarmaLevelsEdit(interaction);
                return true;
            }

            if (customId === 'karma_reward_config') {
                await this.economyHandler.handleKarmaRewardConfig(interaction);
                return true;
            }

            if (customId === 'karma_reset_edit') {
                await this.economyHandler.handleKarmaResetEdit(interaction);
                return true;
            }

            // Select menus daily
            if (customId === 'daily_amounts_edit') {
                await this.economyHandler.handleDailyAmountsEdit(interaction);
                return true;
            }

            if (customId === 'daily_streak_edit') {
                await this.economyHandler.handleDailyStreakEdit(interaction);
                return true;
            }

            if (customId === 'daily_reset_edit') {
                await this.economyHandler.handleDailyResetEdit(interaction);
                return true;
            }

            // Select menus messages
            if (customId === 'messages_toggle_edit') {
                await this.economyHandler.handleMessagesToggleEdit(interaction);
                return true;
            }

            if (customId === 'messages_amount_edit') {
                await this.economyHandler.handleMessagesAmountEdit(interaction);
                return true;
            }

            if (customId === 'messages_cooldown_edit') {
                await this.economyHandler.handleMessagesCooldownEdit(interaction);
                return true;
            }

            // === SELECT MENUS CONFESSION ===
            if (customId === 'confession_log_level') {
                await this.confessionHandler.handleConfessionLogLevel(interaction);
                return true;
            }

            if (customId === 'confession_log_channel') {
                await this.confessionHandler.handleConfessionLogChannel(interaction);
                return true;
            }

            if (customId === 'confession_log_ping_roles') {
                await this.confessionHandler.handleConfessionLogPingRoles(interaction);
                return true;
            }

            if (customId === 'confession_ping_roles') {
                await this.confessionHandler.handleConfessionPingRoles(interaction);
                return true;
            }

            if (customId === 'confession_add_channel') {
                await this.confessionHandler.handleConfessionAddChannel(interaction);
                return true;
            }

            if (customId === 'confession_remove_channel') {
                await this.confessionHandler.handleConfessionRemoveChannel(interaction);
                return true;
            }

            if (customId === 'confession_archive_time') {
                await this.confessionHandler.handleConfessionArchiveTime(interaction);
                return true;
            }

            // === SELECT MENUS AOUV ===
            if (this.aouvHandler) {
                if (customId === 'aouv_main_select') {
                    await this.aouvHandler.handleAouvSelect(interaction);
                    return true;
                }

                if (customId === 'aouv_prompt_edit_kind_select') {
                    await this.aouvHandler.handleAouvPromptEditKindSelect(interaction);
                    return true;
                }

                if (customId === 'aouv_prompt_remove_kind_select') {
                    await this.aouvHandler.handleAouvPromptRemoveKindSelect(interaction);
                    return true;
                }

                if (customId === 'aouv_prompt_list_custom_kind_select') {
                    await this.aouvHandler.handleAouvPromptListCustomKindSelect(interaction);
                    return true;
                }

                if (customId === 'aouv_prompt_list_base_kind_select') {
                    await this.aouvHandler.handleAouvPromptListBaseKindSelect(interaction);
                    return true;
                }

                if (customId === 'aouv_prompt_override_kind_select') {
                    await this.aouvHandler.handleAouvPromptOverrideKindSelect(interaction);
                    return true;
                }

                if (customId === 'aouv_disable_all_select') {
                    await this.aouvHandler.handleAouvDisableAllSelect(interaction);
                    return true;
                }

                // NSFW selects
                if (customId === 'aouv_nsfw_prompt_edit_kind_select') {
                    await this.aouvHandler.handleAouvNsfwPromptEditKindSelect(interaction);
                    return true;
                }

                if (customId === 'aouv_nsfw_prompt_remove_kind_select') {
                    await this.aouvHandler.handleAouvNsfwPromptRemoveKindSelect(interaction);
                    return true;
                }

                if (customId === 'aouv_nsfw_prompt_list_custom_kind_select') {
                    await this.aouvHandler.handleAouvNsfwPromptListCustomKindSelect(interaction);
                    return true;
                }

                if (customId === 'aouv_nsfw_disable_all_select') {
                    await this.aouvHandler.handleAouvNsfwDisableAllSelect(interaction);
                    return true;
                }

                // Channel selects
                if (customId === 'aouv_channel_add') {
                    await this.aouvHandler.handleAouvChannelAdd(interaction);
                    return true;
                }

                if (customId === 'aouv_channel_remove') {
                    await this.aouvHandler.handleAouvChannelRemove(interaction);
                    return true;
                }

                if (customId === 'aouv_nsfw_channel_add') {
                    await this.aouvHandler.handleAouvNsfwChannelAdd(interaction);
                    return true;
                }

                if (customId === 'aouv_nsfw_channel_remove') {
                    await this.aouvHandler.handleAouvNsfwChannelRemove(interaction);
                    return true;
                }

                // Prompt specific selects
                if (customId === 'aouv_prompt_remove_select_action') {
                    await this.aouvHandler.handleAouvPromptRemoveSelect(interaction, 'action');
                    return true;
                }

                if (customId === 'aouv_prompt_remove_select_truth') {
                    await this.aouvHandler.handleAouvPromptRemoveSelect(interaction, 'verite');
                    return true;
                }

                if (customId === 'aouv_prompt_edit_select_action') {
                    await this.aouvHandler.handleAouvPromptEditSelect(interaction, 'action');
                    return true;
                }

                if (customId === 'aouv_prompt_edit_select_truth') {
                    await this.aouvHandler.handleAouvPromptEditSelect(interaction, 'verite');
                    return true;
                }

                if (customId === 'aouv_nsfw_prompt_edit_select_action') {
                    await this.aouvHandler.handleAouvNsfwPromptEditSelect(interaction, 'action');
                    return true;
                }

                if (customId === 'aouv_nsfw_prompt_edit_select_truth') {
                    await this.aouvHandler.handleAouvNsfwPromptEditSelect(interaction, 'verite');
                    return true;
                }

                if (customId === 'aouv_nsfw_prompt_remove_select_action') {
                    await this.aouvHandler.handleAouvNsfwPromptRemoveSelect(interaction, 'action');
                    return true;
                }

                if (customId === 'aouv_nsfw_prompt_remove_select_truth') {
                    await this.aouvHandler.handleAouvNsfwPromptRemoveSelect(interaction, 'verite');
                    return true;
                }

                if (customId === 'aouv_prompt_override_select_action') {
                    await this.aouvHandler.handleAouvPromptOverrideSelect(interaction, 'action');
                    return true;
                }

                if (customId === 'aouv_prompt_override_select_truth') {
                    await this.aouvHandler.handleAouvPromptOverrideSelect(interaction, 'verite');
                    return true;
                }

                // Gestion des selects paginés
                if (customId.startsWith('aouv_prompt_edit_list_')) {
                    const parts = customId.split('_');
                    const kind = parts[parts.length - 3];
                    const page = parseInt(parts[parts.length - 1], 10) || 1;
                    await this.aouvHandler.showAouvPromptEditListPaged(interaction, kind, page);
                    return true;
                }

                if (customId.startsWith('aouv_prompt_remove_list_')) {
                    const parts = customId.split('_');
                    const kind = parts[parts.length - 3];
                    const page = parseInt(parts[parts.length - 1], 10) || 1;
                    await this.aouvHandler.showAouvPromptRemoveListPaged(interaction, kind, page);
                    return true;
                }

                if (customId.startsWith('aouv_prompt_list_custom_')) {
                    const parts = customId.split('_');
                    const kind = parts[parts.length - 3];
                    const page = parseInt(parts[parts.length - 1], 10) || 1;
                    await this.aouvHandler.showAouvPromptListCustomPaged(interaction, kind, page);
                    return true;
                }

                if (customId.startsWith('aouv_prompt_override_list_')) {
                    const parts = customId.split('_');
                    const kind = parts[parts.length - 3];
                    const page = parseInt(parts[parts.length - 1], 10) || 1;
                    await this.aouvHandler.showAouvPromptOverrideBaseListPaged(interaction, kind, page);
                    return true;
                }

                if (customId.startsWith('aouv_nsfw_prompt_edit_list_')) {
                    const parts = customId.split('_');
                    const kind = parts[parts.length - 3];
                    const page = parseInt(parts[parts.length - 1], 10) || 1;
                    await this.aouvHandler.showAouvNsfwPromptEditListPaged(interaction, kind, page);
                    return true;
                }

                if (customId.startsWith('aouv_nsfw_prompt_remove_list_')) {
                    const parts = customId.split('_');
                    const kind = parts[parts.length - 3];
                    const page = parseInt(parts[parts.length - 1], 10) || 1;
                    await this.aouvHandler.showAouvNsfwPromptRemoveListPaged(interaction, kind, page);
                    return true;
                }

                if (customId.startsWith('aouv_nsfw_prompt_list_custom_')) {
                    const parts = customId.split('_');
                    const kind = parts[parts.length - 3];
                    const page = parseInt(parts[parts.length - 1], 10) || 1;
                    await this.aouvHandler.showAouvNsfwPromptListCustomPaged(interaction, kind, page);
                    return true;
                }
            }

            // === SELECT MENUS LEVEL SYSTEM ===
            if (this.levelHandler) {
                if (customId === 'level_notification_channel') {
                    await this.levelHandler.handleLevelNotificationChannel(interaction);
                    return true;
                }

                if (customId === 'level_card_style') {
                    await this.levelHandler.handleLevelCardStyle(interaction);
                    return true;
                }

                if (customId === 'style_backgrounds_style') {
                    await this.levelHandler.handleStyleBackgroundsStyle(interaction);
                    return true;
                }

                if (customId.startsWith('style_backgrounds_role_')) {
                    await this.levelHandler.handleStyleBackgroundsRole(interaction, customId);
                    return true;
                }

                if (customId.startsWith('style_backgrounds_actions_')) {
                    await this.levelHandler.handleStyleBackgroundsActions(interaction, customId);
                    return true;
                }

                if (customId === 'add_role_reward_select') {
                    await this.levelHandler.handleAddRoleRewardSelect(interaction);
                    return true;
                }

                if (customId === 'remove_role_reward') {
                    await this.levelHandler.handleRemoveRoleReward(interaction);
                    return true;
                }
            }

            // === SELECT MENUS LEVEL SYSTEM ===
            if (customId === 'level_config_menu') {
                console.log('🎯 Menu level_config_menu détecté, valeur:', interaction.values[0]);
                if (this.levelHandler) {
                    const selectedValue = interaction.values[0];
                    await this.levelHandler.handleLevelButton(interaction, `level_${selectedValue}`);
                } else {
                    console.log('⚠️ LevelConfigHandler non disponible');
                    await interaction.reply({
                        content: '❌ Le gestionnaire de configuration des niveaux n\'est pas disponible.',
                        ephemeral: true
                    });
                }
                return true;
            }

            // === SELECT MENUS AUTRES HANDLERS ===
            if (this.countingHandler && customId.startsWith('counting_')) {
                await this.countingHandler.handleCountingSelect(interaction);
                return true;
            }

            if (this.logsHandler && customId.startsWith('logs_')) {
                await this.logsHandler.handleLogsSelect(interaction);
                return true;
            }

            if (this.autothreadHandler && customId.startsWith('autothread_')) {
                await this.autothreadHandler.handleAutothreadSelect(interaction);
                return true;
            }

            if (this.bumpHandler && customId.startsWith('bump_')) {
                await this.bumpHandler.handleBumpSelect(interaction);
                return true;
            }

            // === SELECT MENUS CONFESSION CONFIG ===
            if (this.confessionConfigHandler && (customId.startsWith('confession_config') || customId.startsWith('confession_channel'))) {
                await this.confessionConfigHandler.handleConfessionConfigSelect(interaction);
                return true;
            }

            // === SELECT MENUS MODERATION ===
            if (customId === 'moderation_config_menu') {
                const selectedValue = interaction.values[0];
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setTitle(`⚙️ Configuration: ${selectedValue}`)
                    .setDescription('Cette fonctionnalité est en cours de développement.')
                    .setColor('#FFA500')
                    .addFields([
                        { name: '🚧 En Construction', value: 'Cette section sera bientôt disponible.', inline: false }
                    ])
                    .setTimestamp();
                    
                await interaction.update({ embeds: [embed], components: [] });
                return true;
            }

            // === SELECT MENUS SECURITY CONFIG ===
            if (customId === 'config_verif_menu') {
                if (this.securityConfigHandler) {
                    await this.securityConfigHandler.handleConfigVerifMenu(interaction);
                    return true;
                } else {
                    await interaction.reply({
                        content: '❌ Le gestionnaire de configuration de sécurité n\'est pas disponible.',
                        ephemeral: true
                    });
                    return true;
                }
            }

            // Nouvelles sélections: choix d'action automatique
            if (customId === 'config_verif_action_recentAccount' || customId === 'config_verif_action_multiAccount' || customId === 'config_verif_action_suspiciousName') {
                if (this.securityConfigHandler) {
                    await this.securityConfigHandler.handleAutoActionSelect(interaction);
                    return true;
                } else {
                    await interaction.reply({ content: '❌ Module sécurité indisponible.', ephemeral: true });
                    return true;
                }
            }

            // Sélecteur de rôle: rôle de quarantaine
            if (customId === 'config_verif_quarantine_role') {
                if (this.securityConfigHandler) {
                    await this.securityConfigHandler.handleQuarantineRoleSelect(interaction);
                    return true;
                } else {
                    await interaction.reply({ content: '❌ Module sécurité indisponible.', ephemeral: true });
                    return true;
                }
            }

            // Sélecteur de rôle: rôle vérifié
            if (customId === 'config_verif_verified_role') {
                if (this.securityConfigHandler) {
                    await this.securityConfigHandler.handleVerifiedRoleSelect(interaction);
                    return true;
                } else {
                    await interaction.reply({ content: '❌ Module sécurité indisponible.', ephemeral: true });
                    return true;
                }
            }

            // Sélecteur de canal: canal d'alertes
            if (customId === 'config_verif_alert_channel') {
                if (this.securityConfigHandler) {
                    await this.securityConfigHandler.handleAlertChannelSelect(interaction);
                    return true;
                } else {
                    await interaction.reply({ content: '❌ Module sécurité indisponible.', ephemeral: true });
                    return true;
                }
            }

            // Sélecteur de rôle: rôle modérateur pour mentions
            if (customId === 'config_verif_moderator_role') {
                if (this.securityConfigHandler) {
                    await this.securityConfigHandler.handleModeratorRoleSelect(interaction);
                    return true;
                } else {
                    await interaction.reply({ content: '❌ Module sécurité indisponible.', ephemeral: true });
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('❌ Erreur select menu interaction:', error);
            return false;
        }
    }

    // Méthode pour gérer les sélecteurs de couleur de rôle
    async handleColorRoleSelect(interaction, customId) {
        try {
            if (!customId.startsWith('color_role_select|')) {
                return false;
            }

            const { findStyleByKey } = require('../utils/rolePalette');
            const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

            // Vérification des permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply({ content: '❌ Permission requise: Administrateur.', ephemeral: true });
                return true;
            }

            // Traitement du sélecteur de couleur de rôle
            const parts = customId.split('|');
            if (parts.length < 4) {
                await interaction.reply({ content: '❌ Format d\'interaction invalide.', ephemeral: true });
                return true;
            }

            const targetType = parts[1]; // 'r' pour rôle, 'm' pour membre
            const targetId = parts[2];
            const shouldRename = parts[3] === '1';
            const selectedStyleKey = interaction.values[0];

            const style = findStyleByKey(selectedStyleKey);
            if (!style) {
                await interaction.reply({ content: `❌ Style inconnu: ${selectedStyleKey}.`, ephemeral: true });
                return true;
            }

            await interaction.deferReply({ ephemeral: true });

            if (targetType === 'r') {
                // Modification d'un rôle existant
                const targetRole = interaction.guild.roles.cache.get(targetId);
                if (!targetRole) {
                    await interaction.editReply({ content: '❌ Rôle introuvable.' });
                    return true;
                }

                const roleEditData = { color: style.color };
                if (shouldRename) roleEditData.name = style.name;
                await targetRole.edit(roleEditData, 'Application de couleur via sélecteur');

                const embed = new EmbedBuilder()
                    .setTitle(`Style appliqué: ${style.name}`)
                    .setDescription(`Clé: ${style.key}\nHex: ${style.color}`)
                    .setColor(style.color);

                await interaction.editReply({ 
                    content: `✅ Mis à jour: ${targetRole.toString()} → ${style.name} (${style.color})`, 
                    embeds: [embed] 
                });
            } else if (targetType === 'm') {
                // Attribution à un membre
                const targetMember = interaction.guild.members.cache.get(targetId);
                if (!targetMember) {
                    await interaction.editReply({ content: '❌ Membre introuvable.' });
                    return true;
                }

                // Trouver ou créer le rôle de couleur
                let styleRole = interaction.guild.roles.cache.find(r => r.name === style.name);
                if (!styleRole) {
                    const { createAndPositionColorRole } = require('../utils/rolePositioning');
                    const meForPosition = interaction.guild.members.me;
                    
                    if (!meForPosition) {
                        await interaction.editReply({ content: '❌ Impossible de récupérer les informations du bot.' });
                        return true;
                    }

                    styleRole = await createAndPositionColorRole(
                        interaction.guild, 
                        meForPosition, 
                        style, 
                        'Création automatique du rôle de couleur (sélecteur)'
                    );

                    if (!styleRole) {
                        await interaction.editReply({ content: '❌ Impossible de créer le rôle de couleur.' });
                        return true;
                    }
                }

                // Vérifier que le bot peut gérer ce rôle
                const me = interaction.guild.members.me;
                if (!me || me.roles.highest.comparePositionTo(styleRole) <= 0) {
                    await interaction.editReply({ 
                        content: `❌ Je ne peux pas assigner le rôle ${styleRole.toString()} (position trop haute). Place mon rôle au-dessus.` 
                    });
                    return true;
                }

                await targetMember.roles.add(styleRole, 'Attribution de la couleur via sélecteur');

                const embed = new EmbedBuilder()
                    .setTitle(`Style appliqué à ${targetMember.displayName}`)
                    .setDescription(`Rôle attribué: ${styleRole.toString()}\nClé: ${style.key}\nHex: ${style.color}`)
                    .setColor(style.color);

                await interaction.editReply({ 
                    content: `✅ Couleur attribuée à ${targetMember.toString()} → ${style.name} (${style.color})`, 
                    embeds: [embed] 
                });
            }

            return true;
        } catch (error) {
            console.error('❌ Erreur color role select:', error);
            try {
                const content = `❌ Action impossible. Vérifie mes permissions et la position des rôles.\nErreur: ${error.message}`;
                if (interaction.deferred) {
                    await interaction.editReply({ content });
                } else {
                    await interaction.reply({ content, ephemeral: true });
                }
            } catch (e) {
                console.error('❌ Impossible de répondre à l\'interaction:', e);
            }
            return true;
        }
    }

    // Méthode pour gérer l'interface de modération
    async handleModerationUI(interaction, menuType) {
        try {
            const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
            
            const embed = new EmbedBuilder()
                .setTitle('⚙️ Configuration de Modération')
                .setDescription('Configurez les paramètres de modération de votre serveur')
                .setColor('#FF6B6B')
                .addFields([
                    { name: '🛡️ Système de Sécurité', value: 'Configuration des vérifications automatiques', inline: true },
                    { name: '⚠️ Avertissements', value: 'Gestion des avertissements et sanctions', inline: true },
                    { name: '🔨 Actions Auto', value: 'Configuration des actions automatiques', inline: true }
                ])
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('moderation_config_menu')
                        .setPlaceholder('Choisissez une section à configurer...')
                        .addOptions([
                            {
                                label: 'Système de Sécurité',
                                description: 'Configurer les vérifications d\'entrée',
                                value: 'security_config',
                                emoji: '🛡️'
                            },
                            {
                                label: 'Avertissements',
                                description: 'Gérer le système d\'avertissements',
                                value: 'warnings_config',
                                emoji: '⚠️'
                            },
                            {
                                label: 'Actions Automatiques',
                                description: 'Configurer les sanctions automatiques',
                                value: 'auto_actions_config',
                                emoji: '🔨'
                            }
                        ])
                );

            await interaction.editReply({ embeds: [embed], components: [row] });
            
        } catch (error) {
            console.error('❌ Erreur handleModerationUI:', error);
            await interaction.editReply({
                content: '❌ Erreur lors de l\'affichage du menu de modération.',
                embeds: [],
                components: []
            });
        }
    }
}

module.exports = MainRouterHandler;