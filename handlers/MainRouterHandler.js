/**
 * Router principal pour déléguer les interactions aux handlers spécialisés
 */

class MainRouterHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.handlers = {};
        
        // Initialiser tous les handlers spécialisés
        this.initializeHandlers();
    }

    /**
     * Initialiser tous les handlers spécialisés
     */
    initializeHandlers() {
        const ConfessionConfigHandler = require('./ConfessionConfigHandler');

        const AutoThreadConfigHandler = require('./AutoThreadConfigHandler');
        const CountingConfigHandler = require('./CountingConfigHandler');
        const DashboardHandler = require('./DashboardHandler');

        // Import du ConfessionHandler original pour les méthodes complètes
        const ConfessionHandler = require('./ConfessionHandler');
        
        this.handlers = {
            confession: new ConfessionHandler(this.dataManager),

            autothread: new AutoThreadConfigHandler(this.dataManager),
            counting: new CountingConfigHandler(this.dataManager),
            dashboard: new DashboardHandler(this.dataManager)
        };
    }

    /**
     * Router principal pour toutes les interactions
     */
    async handleInteraction(interaction) {
        if (!interaction.isStringSelectMenu() && !interaction.isChannelSelectMenu() && !interaction.isRoleSelectMenu() && !interaction.isButton()) {
            return false;
        }

        const customId = interaction.customId;
        console.log(`🔄 MainRouter traite: ${customId}`);

        try {
            // Router basé sur le préfixe du customId
            if (customId.startsWith('confession_config') || customId.startsWith('confession_')) {
                console.log(`➡️ Routage vers ConfessionHandler: ${customId}`);
                return await this.routeToConfessionHandler(interaction, customId);
            }
            
            // Gestion des sélecteurs de rôles pour la boutique
            if (customId === 'temp_role_select') {
                console.log(`➡️ Routage sélection rôle temporaire: ${customId}`);
                const handler = this.handlers.economy;
                await handler.handleTempRoleSelect(interaction);
                return true;
            }
            
            if (customId === 'perm_role_select') {
                console.log(`➡️ Routage sélection rôle permanent: ${customId}`);
                const handler = this.handlers.economy;
                await handler.handlePermRoleSelect(interaction);
                return true;
            }

            // Gestion héritée pour certains IDs économiques spécifiques uniquement
            if (customId === 'economy_shop_config' ||
                customId === 'karma_temp_role_select' || customId.startsWith('karma_temp_type_select_') || customId === 'karma_reset_day_select' || customId === 'karma_reset_confirm' || 
                // Nouveaux IDs des menus redesignés (sauf economy_config qui est géré directement)
                customId.includes('actions_main') || customId.includes('shop_main') || customId.includes('karma_main') || customId.includes('daily_main') || customId.includes('messages_main') || customId.includes('stats_main') ||
                customId.includes('actions_toggle') || customId.includes('shop_') || customId.includes('karma_') || customId.includes('daily_') || customId.includes('messages_') || customId.includes('stats_') ||
                customId === 'back_to_main') {
                console.log(`➡️ Routage vers EconomyHandler: ${customId}`);
                return await this.routeToEconomyHandler(interaction, customId);
            }
            
            if (customId.startsWith('autothread_config') || customId.startsWith('autothread_')) {
                console.log(`➡️ Routage vers AutoThreadHandler: ${customId}`);
                return await this.routeToAutoThreadHandler(interaction, customId);
            }
            
            if (customId.startsWith('counting_config') || customId.startsWith('counting_')) {
                console.log(`➡️ Routage vers CountingHandler: ${customId}`);
                return await this.routeToCountingHandler(interaction, customId);
            }
            
            if (customId.startsWith('dashboard_') || customId.includes('dashboard')) {
                console.log(`➡️ Routage vers DashboardHandler: ${customId}`);
                return await this.routeToDashboardHandler(interaction, customId);
            }

            // Routes pour la gestion boutique
            if (customId === 'shop_item_management' || customId.startsWith('shop_item_actions_')) {
                console.log(`➡️ Routage gestion boutique: ${customId}`);
                const handler = this.handlers.economy;
                if (customId === 'shop_item_management') {
                    await handler.handleShopItemManagement(interaction);
                } else {
                    await handler.handleShopItemActions(interaction);
                }
                return true;
            }

            // Routes pour boutons de suppression et modification d'articles boutique
            if (customId.startsWith('confirm_delete_') || customId.startsWith('cancel_delete_') || 
                customId === 'back_to_shop_management') {
                console.log(`➡️ Routage boutons boutique: ${customId}`);
                const handler = this.handlers.economy;
                if (customId === 'back_to_shop_management') {
                    await handler.showShopManagement(interaction);
                } else {
                    await handler.handleItemDeletion(interaction);
                }
                return true;
            }

            // Routes pour les remises karma et gestion articles
            if (customId === 'karma_discounts_actions' || 
                customId === 'edit_item_select' || 
                customId === 'delete_item_select' ||
                customId === 'edit_karma_discount_select' ||
                customId === 'delete_karma_discount_select' ||
                customId === 'back_to_karma_discounts' ||
                customId === 'back_to_shop') {
                console.log(`➡️ Routage gestion boutique: ${customId}`);
                const handler = this.handlers.economy;
                
                if (customId === 'karma_discounts_actions') {
                    await handler.handleKarmaDiscountsActions(interaction);
                } else if (customId === 'edit_item_select') {
                    await handler.handleEditItemSelect(interaction);
                } else if (customId === 'delete_item_select') {
                    await handler.handleDeleteItemSelect(interaction);
                } else if (customId === 'edit_karma_discount_select') {
                    await handler.handleEditKarmaDiscountSelect(interaction);
                } else if (customId === 'delete_karma_discount_select') {
                    await handler.handleDeleteKarmaDiscountSelect(interaction);
                } else if (customId === 'back_to_karma_discounts') {
                    await handler.showKarmaDiscountsMenu(interaction);
                } else if (customId === 'back_to_shop') {
                    await handler.showShopConfig(interaction);
                }
                return true;
            }

            if (customId === 'karma_discounts_config' || customId === 'back_karma_discounts') {
                console.log(`➡️ Routage remises karma: ${customId}`);
                const handler = this.handlers.economy;
                if (customId === 'back_karma_discounts') {
                    await handler.showKarmaDiscountsConfig(interaction);
                } else {
                    await handler.handleKarmaDiscountsInteraction(interaction);
                }
                return true;
            }

            // Routes spéciales pour les commandes principales
            if (customId === 'config_main_menu') {
                console.log(`➡️ Routage config_main_menu vers ConfessionHandler`);
                return await this.handlers.confession.showMainConfigMenu(interaction);
            }

            console.log(`⚠️ CustomId non géré par le router: ${customId}`);
            return false;

        } catch (error) {
            console.error(`Erreur dans MainRouterHandler pour ${customId}:`, error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ Une erreur est survenue lors du traitement de votre demande.', 
                    flags: 64 
                });
            }
            
            return true;
        }
    }

    /**
     * Router vers le handler des confessions
     */
    async routeToConfessionHandler(interaction, customId) {
        const handler = this.handlers.confession;

        switch (customId) {
            case 'confession_config_main':
                // Route vers la méthode de gestion de la configuration principale
                console.log('Appel handleConfessionMainConfig...');
                await handler.handleConfessionMainConfig(interaction);
                return true;
            
            case 'confession_channel_config':
                console.log('Appel handleConfessionChannelsConfig...');
                await handler.handleConfessionChannelsConfig(interaction);
                return true;
                
            case 'confession_autothread_config':
                console.log('Appel handleAutoThreadConfig...');
                await handler.handleAutoThreadConfig(interaction);
                return true;
                
            case 'confession_logs_config':
                console.log('Appel handleLogsConfig...');
                await handler.handleLogsConfig(interaction);
                return true;

            // Routes pour les sélecteurs de logs admin
            case 'confession_log_channel_select':
            case 'confession_log_level_select':  
            case 'confession_log_images_select':
            case 'confession_log_ping_roles_select':
            case 'confession_ping_roles_select':
                console.log(`➡️ Sélecteur logs: ${customId}`);
                await handler.handleSpecializedSelector(interaction, customId);
                return true;

            // Routes pour les sélecteurs auto-thread
            case 'confession_autothread_toggle_select':
            case 'confession_thread_name_select':
            case 'confession_archive_time_select':
                console.log(`➡️ Sélecteur autothread: ${customId}`);
                await handler.handleSpecializedSelector(interaction, customId);
                return true;

            // Routes pour les sélecteurs de rôles pour boutique
            case 'temp_role_select':
            case 'perm_role_select':
                console.log(`➡️ Sélecteur rôle boutique: ${customId}`);
                await handler.handleRoleSelection(interaction, customId);
                return true;

            case 'confession_add_channel':
                console.log('Appel handleConfessionAddChannel...');
                await handler.handleConfessionAddChannel(interaction);
                return true;
            
            case 'confession_remove_channel':
                return await handler.handleConfessionRemoveChannel(interaction);
                
            case 'confession_channel_add':
                return await handler.handleChannelAdd(interaction);
            
            case 'confession_channel_remove':
                return await handler.handleChannelRemove(interaction);
            
            case 'confession_logs_options':
                console.log('Appel handleLogOption via confession_logs_options...');
                const logValue = interaction.values[0];
                if (logValue === 'back_main_confession') {
                    return await handler.handleConfessionMainConfig(interaction);
                }
                await handler.handleLogOption(interaction, logValue);
                return true;
            
            case 'confession_autothread_options':
                console.log('Appel handleAutoThreadOption via confession_autothread_options...');
                const threadValue = interaction.values[0];
                if (threadValue === 'back_main_confession') {
                    return await handler.handleConfessionMainConfig(interaction);
                }
                await handler.handleAutoThreadOption(interaction, threadValue);
                return true;

            // Options logs admin détaillées
            case 'log_channel':
            case 'log_level':
            case 'log_images':
            case 'log_ping_roles':
            case 'confession_ping_roles':
                console.log(`➡️ Option logs: ${customId}`);
                await handler.handleLogOption(interaction, customId);
                return true;

            // Options auto-thread détaillées
            case 'toggle_autothread':
            case 'thread_name':
            case 'archive_time':
                console.log(`➡️ Option auto-thread: ${customId}`);
                await handler.handleAutoThreadOption(interaction, customId);
                return true;

            // Sélecteurs spécialisés pour la configuration
            case 'confession_log_channel_select':
            case 'confession_log_level_select':
            case 'confession_archive_time_select':
            case 'confession_thread_name_select':
            case 'confession_remove_channel_select':
            case 'confession_log_ping_roles_select':
            case 'confession_ping_roles_select':
                console.log(`➡️ Sélecteur spécialisé: ${customId}`);
                await handler.handleSpecializedSelector(interaction, customId);
                return true;
                
            // Boutons retour confession avec valeurs
            case 'confession_channels_back':
                console.log('Retour menu confession channels...');
                const channelValue = interaction.values[0];
                if (channelValue === 'back_channels') {
                    await handler.handleConfessionChannelsConfig(interaction);
                }
                return true;
                
            case 'confession_logs_back':
                console.log('Retour menu confession logs...');
                const logsValue = interaction.values[0];
                if (logsValue === 'back_logs') {
                    await handler.handleLogsConfig(interaction);
                }
                return true;
                
            case 'confession_autothread_back':
                console.log('Retour menu confession autothread...');
                const autoValue = interaction.values[0];
                if (autoValue === 'back_autothread') {
                    await handler.handleAutoThreadConfig(interaction);
                }
                return true;
                


            default:
                console.log(`CustomId confession non géré: ${customId}`);
                return false;
        }
    }

    /**
     * Router vers le handler économique
     */
    async routeToEconomyHandler(interaction, customId) {
        const handler = this.handlers.economy;

        switch (customId) {
            // Suppression des routes economy_config_* qui sont gérées directement dans index.render-final.js
                
            case 'economy_actions_back':
                console.log('Retour menu principal économie...');
                await handler.handleMainMenu(interaction);
                return true;
            
            case 'economy_action_select':
                return await handler.showActionsConfig(interaction);
            
            case 'economy_shop_options':
                return await handler.showShopConfig(interaction);
            
            case 'economy_karma_options':
                return await handler.showKarmaConfig(interaction);
            
            case 'karma_reset_confirm':
                console.log('Routage karma_reset_confirm vers handleKarmaReset...');
                await handler.handleKarmaReset(interaction);
                return true;
            
            case 'economy_daily_options':
                return await handler.showDailyConfig(interaction);
            
            case 'economy_messages_options':
                return await handler.showMessagesConfig(interaction);
            
            case 'economy_stats_options':
                return await handler.showStatsConfig(interaction);

            // Routes pour les sous-menus de configuration
            case 'economy_karma_config':
                console.log('Routage vers handleKarmaConfig...');
                await handler.handleKarmaConfig(interaction);
                return true;
                
            case 'karma_reset_day_select':
                console.log('Routage vers handleKarmaResetDaySelection...');
                await handler.handleKarmaResetDaySelection(interaction);
                return true;
                
            // Routes pour les configurations d'actions
            case 'action_config_travailler':
            case 'action_config_pecher':
            case 'action_config_donner':
            case 'action_config_voler':
            case 'action_config_crime':
            case 'action_config_parier':
                console.log(`Routage vers handleActionConfigSelection: ${customId}`);
                await handler.handleActionConfigSelection(interaction);
                return true;
                
            case 'action_travailler_config':
            case 'action_pecher_config':
            case 'action_donner_config':
            case 'action_voler_config':
            case 'action_crime_config':
            case 'action_parier_config':
                console.log(`Routage vers handleActionSettings: ${customId}`);
                await handler.handleActionSettings(interaction);
                return true;
                
            case 'economy_shop_config':
                console.log('Routage vers showShopConfig...');
                await handler.showShopConfig(interaction);
                return true;
                
            case 'economy_daily_config':
                console.log('Routage vers handleDailyConfig...');
                await handler.handleDailyConfig(interaction);
                return true;
                
            case 'economy_messages_config':
                console.log('Routage vers handleMessagesConfig...');
                await handler.handleMessagesConfig(interaction);
                return true;
                
            case 'economy_stats_config':
                console.log('Routage vers handleStatsConfig...');
                await handler.handleStatsConfig(interaction);
                return true;

            // Gestion des actions économiques sélectionnées
            case 'economy_actions_select':
                console.log(`➡️ Sélection actions économiques`);
                await handler.handleActionSelection(interaction);
                return true;

            // Gestion des retours vers le menu actions
            case 'back_actions':
                console.log('Retour vers menu actions...');
                await handler.showActionsConfig(interaction);
                return true;

            // Nouvelle gestion des actions spécifiques et sous-menus
            case 'travailler':
            case 'pecher':
            case 'donner':
            case 'voler':
            case 'crime':
            case 'parier':
                console.log(`➡️ Action économique: ${customId}`);
                return await handler.handleActionSelection(interaction);

            // Gestion des options karma détaillées
            case 'karma_levels':
            case 'karma_rewards':
            case 'karma_reset':
            case 'karma_stats':
                console.log(`➡️ Option karma: ${customId}`);
                return await handler.handleKarmaOption(interaction);

            // Gestion des options boutique détaillées
            case 'add_custom':
            case 'add_temp_role':
            case 'add_perm_role':
            case 'edit_items':
            case 'delete_items':
                console.log(`➡️ Option boutique: ${customId}`);
                return await handler.handleShopOption(interaction);

            // Gestion des options daily détaillées
            case 'daily_amount':
            case 'streak_bonus':
            case 'max_streak':
            case 'reset_daily':
                console.log(`➡️ Option daily: ${customId}`);
                return await handler.handleDailyOption(interaction);

            // Gestion des options messages détaillées
            case 'toggle_messages':
            case 'message_amount':
            case 'message_cooldown':
            case 'message_stats':
                console.log(`➡️ Option messages: ${customId}`);
                return await handler.handleMessagesOption(interaction);

            // Gestion des statistiques détaillées
            case 'detailed_stats':
            case 'backup_data':
            case 'reset_economy':
            case 'import_export':
                console.log(`➡️ Option stats: ${customId}`);
                return await handler.handleStatsOption(interaction);

            // Gestion des retours vers menus parents
            case 'economy_shop_back':
            case 'economy_karma_back':
            case 'economy_daily_back':
            case 'economy_messages_back':
            case 'economy_stats_back':
                console.log('Retour menu principal économie...');
                await handler.handleMainMenu(interaction);
                return true;

            case 'economy_karma_rewards_config':
                console.log('Routage vers handleInteraction pour rewards...');
                return await handler.handleInteraction(interaction);

            case 'economy_karma_type_select':
                console.log('Routage vers handleInteraction pour type select...');
                return await handler.handleInteraction(interaction);

            case 'karma_temp_role_select':
                console.log('🎭 Route karma_temp_role_select vers EconomyHandler');
                const roleId = interaction.values[0];
                return await handler.showTempRoleTypeSelector(interaction, roleId);

            default:
                // Gestion du sélecteur de type pour rôle temporaire
                if (customId.startsWith('karma_temp_type_select_')) {
                    console.log('⚖️ Route karma_temp_type_select vers EconomyHandler');
                    const roleId = customId.replace('karma_temp_type_select_', '');
                    const type = interaction.values[0];
                    return await handler.showTempRoleModal(interaction, roleId, type);
                }
                console.log(`CustomId economy non géré: ${customId}`);
                // Gestion générique des customIds dynamiques pour actions
                if (customId.startsWith('action_config_')) {
                    console.log(`➡️ Configuration action dynamique: ${customId}`);
                    return await handler.handleActionConfig(interaction);
                }
                // Gestion des retours d'actions spécifiques
                if (customId.startsWith('action_') && customId.includes('_back_')) {
                    console.log(`➡️ Retour action spécifique: ${customId}`);
                    return await handler.handleActionReturn(interaction);
                }
                
                // Gestion des configurations spécifiques d'actions
                if (customId.startsWith('action_rewards_config_') || 
                    customId.startsWith('action_karma_config_') || 
                    customId.startsWith('action_cooldown_config_')) {
                    console.log(`➡️ Configuration spécifique: ${customId}`);
                    return await handler.handleActionSpecificConfig(interaction);
                }
                
                // Gestion des sélecteurs de rôles pour boutique
                if (customId === 'temp_role_select' || customId === 'perm_role_select') {
                    console.log(`➡️ Sélecteur rôle boutique: ${customId}`);
                    await handler.handleRoleSelection(interaction, customId);
                    return true;
                }
                
                return false;
        }
    }

    /**
     * Router vers le handler auto-thread
     */
    async routeToAutoThreadHandler(interaction, customId) {
        const handler = this.handlers.autothread;

        switch (customId) {
            case 'autothread_config':
                console.log('Appel autothread handleMainConfig...');
                await handler.handleMainConfig(interaction);
                return true;
                
            case 'autothread_action':
                console.log('Appel autothread handleAction...');
                await handler.handleAction(interaction);
                return true;
                
            case 'autothread_add_channel':
                console.log('Appel autothread handleAddChannel...');
                await handler.handleAddChannel(interaction);
                return true;
                
            case 'autothread_remove_channel':
                console.log('Appel autothread handleRemoveChannel...');
                await handler.handleRemoveChannel(interaction);
                return true;
                
            case 'autothread_name_select':
                console.log('Appel autothread handleThreadNameSelection...');
                await handler.handleThreadNameSelection(interaction);
                return true;
                
            case 'autothread_archive':
                console.log('Appel autothread handleArchive...');
                await handler.handleArchive(interaction);
                return true;
                
            case 'autothread_slowmode':
                console.log('Appel autothread handleSlowMode...');
                await handler.handleSlowMode(interaction);
                return true;
            
            case 'autothread_channel_add':
                return await handler.handleChannelAdd(interaction);
            
            case 'autothread_channel_remove':
                return await handler.handleChannelRemove(interaction);
            
            case 'autothread_naming_presets':
                return await handler.showNamingConfig(interaction);
            
            case 'autothread_advanced_options':
                return await handler.showAdvancedSettings(interaction);

            case 'autothread_channels_options':
                console.log('Appel autothread handleChannelsOptions...');
                await handler.handleChannelsOptions(interaction);
                return true;

            case 'autothread_toggle_back':
                console.log('Retour menu principal autothread...');
                await handler.handleToggleBack(interaction);
                return true;

            case 'autothread_channels_back':
                console.log('Retour gestion canaux...');
                await handler.handleChannelsBack(interaction);
                return true;

            case 'autothread_settings_back':
                console.log('Retour paramètres...');
                await handler.handleSettingsBack(interaction);
                return true;

            case 'autothread_stats_back':
                console.log('Retour menu principal autothread...');
                await handler.handleStatsBack(interaction);
                return true;

            case 'autothread_settings_options':
                console.log('Appel autothread handleSettingsOptions...');
                await handler.handleSettingsOptions(interaction);
                return true;

            case 'autothread_channel_add_select':
                console.log('Sélection canal à ajouter...');
                await handler.handleChannelAddSelect(interaction);
                return true;

            case 'autothread_channel_remove_select':
                console.log('Sélection canal à retirer...');
                await handler.handleChannelRemoveSelect(interaction);
                return true;

            case 'autothread_archive_select':
                console.log('Sélection durée archivage...');
                await handler.handleArchiveSelect(interaction);
                return true;

            case 'autothread_slowmode_select':
                console.log('Sélection slow mode...');
                await handler.handleSlowModeSelect(interaction);
                return true;

            default:
                console.log(`CustomId autothread non géré: ${customId}`);
                return false;
        }
    }

    /**
     * Router vers le handler de comptage
     */
    async routeToCountingHandler(interaction, customId) {
        const handler = this.handlers.counting;

        switch (customId) {
            case 'counting_config_main':
                console.log('Appel counting handleMainMenu...');
                await handler.handleMainMenu(interaction);
                return true;
            
            case 'counting_channel_add':
                return await handler.handleChannelAdd(interaction);
            
            case 'counting_channel_configure':
                return await handler.handleChannelConfigure(interaction);
            
            case 'counting_remove_channel':
                console.log('Appel counting handleRemoveChannel...');
                await handler.handleRemoveChannel(interaction);
                return true;
            
            case 'counting_global_options':
                return await handler.handleGlobalOptions(interaction);
            
            case 'counting_records_options':
                return await handler.handleRecordsOptions(interaction);
            
            case 'counting_stats_options':
                return await handler.handleCountingStats(interaction);

            case 'counting_channels_options':
                console.log('Appel counting handleChannelsOptions...');
                await handler.handleChannelsOptions(interaction);
                return true;
                
            case 'counting_channels_menu':
                console.log('Appel counting handleChannelsMenu...');
                await handler.handleChannelsMenu(interaction);
                return true;
                
            case 'counting_add_channel':
                console.log('Appel counting handleAddChannel...');
                await handler.handleAddChannel(interaction);
                return true;
                
            case 'counting_configure_channel':
                console.log('Appel counting handleConfigureChannel...');
                await handler.handleConfigureChannel(interaction);
                return true;
                
            case 'counting_global_settings':
                console.log('Appel counting handleGlobalSettings...');
                await handler.handleGlobalSettings(interaction);
                return true;
                
            case 'counting_global_options':
                console.log('Appel counting showGlobalSettings...');
                await handler.showGlobalSettings(interaction);
                return true;
                
            case 'counting_records_menu':
                console.log('Appel counting handleRecordsMenu...');
                await handler.handleRecordsMenu(interaction);
                return true;
                
            case 'counting_records_options':
                console.log('Appel counting showRecordsManagement...');
                await handler.showRecordsManagement(interaction);
                return true;
                
            case 'counting_reset_specific':
                console.log('Appel counting handleResetSpecific...');
                await handler.handleResetSpecific(interaction);
                return true;
                
            case 'counting_set_max_number':
                console.log('Appel counting handleSetMaxNumber...');
                await handler.handleSetMaxNumber(interaction);
                return true;
                
            case 'counting_stats_back':
                console.log('Appel counting retour stats...');
                await handler.showMainConfigMenu(interaction);
                return true;
                
            case 'counting_add_back':
            case 'counting_config_back':
            case 'counting_remove_back':
                console.log('Appel counting retour canaux...');
                await handler.showChannelsManagement(interaction);
                return true;
                
            case 'counting_reset_back':
                console.log('Appel counting retour records...');
                await handler.showRecordsManagement(interaction);
                return true;

            // Nouvelles options globales
            case 'toggle_math':
            case 'toggle_delete':
            case 'delete_delay':
            case 'reset_all_channels':
                console.log(`➡️ Option globale comptage: ${customId}`);
                return await handler.handleGlobalOption(interaction);

            // Nouvelles options records
            case 'detailed_records':
            case 'reset_specific_record':
            case 'manual_record':
            case 'advanced_stats':
                console.log(`➡️ Option records: ${customId}`);
                return await handler.handleRecordOption(interaction);

            case 'counting_channels_back':
                console.log('Retour menu principal comptage...');
                await handler.handleMainMenu(interaction);
                return true;

            default:
                // Gestion des customIds dynamiques pour configuration de canal spécifique
                if (customId.startsWith('counting_channel_config_')) {
                    return await handler.handleChannelConfigure(interaction);
                }
                
                console.log(`CustomId counting non géré: ${customId}`);
                return false;
        }
    }

    /**
     * Router vers le handler dashboard
     */
    async routeToDashboardHandler(interaction, customId) {
        const handler = this.handlers.dashboard;

        switch (customId) {
            case 'dashboard_sections':
                return await handler.handleDashboardInteraction(interaction);
            
            case 'economy_dashboard_options':
                return await handler.showEconomyDashboard(interaction);
            
            case 'confessions_dashboard_options':
                return await handler.showConfessionsDashboard(interaction);
            
            case 'counting_dashboard_options':
                return await handler.showCountingDashboard(interaction);
            
            case 'admin_panel_options':
                return await handler.showAdminPanel(interaction);

            default:
                // Routes spéciales
                if (interaction.values && interaction.values.includes('back_main_dashboard')) {
                    return await handler.showMainDashboard(interaction);
                }
                
                console.log(`CustomId dashboard non géré: ${customId}`);
                return false;
        }
    }

    /**
     * Obtenir des statistiques sur l'utilisation des handlers
     */
    getHandlerStats() {
        return {
            handlersLoaded: Object.keys(this.handlers).length,
            availableHandlers: Object.keys(this.handlers),
            lastUpdate: new Date().toISOString()
        };
    }
}

module.exports = MainRouterHandler;