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
        const EconomyConfigHandler = require('./EconomyConfigHandler');
        const AutoThreadConfigHandler = require('./AutoThreadConfigHandler');
        const CountingConfigHandler = require('./CountingConfigHandler');
        const DashboardHandler = require('./DashboardHandler');

        this.handlers = {
            confession: new ConfessionConfigHandler(this.dataManager),
            economy: new EconomyConfigHandler(this.dataManager),
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
            
            if (customId.startsWith('economy_config') || customId.startsWith('economy_')) {
                console.log(`➡️ Routage vers EconomyHandler: ${customId}`);
                return await this.routeToEconomyHandler(interaction, customId);
            }
            
            if (customId.startsWith('autothread_config') || customId.startsWith('autothread_')) {
                console.log(`➡️ Routage vers AutoThreadHandler: ${customId}`);
                return await this.routeToAutothreadHandler(interaction, customId);
            }
            
            if (customId.startsWith('counting_config') || customId.startsWith('counting_')) {
                console.log(`➡️ Routage vers CountingHandler: ${customId}`);
                return await this.routeToCountingHandler(interaction, customId);
            }
            
            if (customId.startsWith('dashboard_') || customId.includes('dashboard')) {
                console.log(`➡️ Routage vers DashboardHandler: ${customId}`);
                return await this.routeToDashboardHandler(interaction, customId);
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
                return await handler.handleMainMenu(interaction);
            
            case 'confession_channel_add':
                return await handler.handleChannelAdd(interaction);
            
            case 'confession_channel_remove':
                return await handler.handleChannelRemove(interaction);
            
            case 'confession_logs_options':
                return await handler.handleLogsOptions(interaction);
            
            case 'confession_autothread_options':
                return await handler.handleAutoThreadOptions(interaction);

            // Nouvelles options logs détaillées
            case 'log_channel':
            case 'log_level':
            case 'log_images':
            case 'ping_roles_logs':
                console.log(`➡️ Option logs: ${customId}`);
                return await handler.handleLogOption(interaction);

            // Nouvelles options auto-thread détaillées
            case 'toggle_autothread':
            case 'thread_name':
            case 'archive_duration':
            case 'slowmode':
                console.log(`➡️ Option auto-thread: ${customId}`);
                return await handler.handleAutoThreadOption(interaction);

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
            case 'economy_config_main':
                return await handler.handleMainMenu(interaction);
            
            case 'economy_action_select':
                return await handler.showActionsConfig(interaction);
            
            case 'economy_shop_options':
                return await handler.showShopConfig(interaction);
            
            case 'economy_karma_options':
                return await handler.showKarmaConfig(interaction);
            
            case 'economy_daily_options':
                return await handler.showDailyConfig(interaction);
            
            case 'economy_messages_options':
                return await handler.showMessagesConfig(interaction);
            
            case 'economy_stats_options':
                return await handler.showStatsConfig(interaction);

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

            default:
                console.log(`CustomId economy non géré: ${customId}`);
                return false;
        }
    }

    /**
     * Router vers le handler auto-thread
     */
    async routeToAutothreadHandler(interaction, customId) {
        const handler = this.handlers.autothread;

        switch (customId) {
            case 'autothread_config_main':
                return await handler.handleMainMenu(interaction);
            
            case 'autothread_channel_add':
                return await handler.handleChannelAdd(interaction);
            
            case 'autothread_channel_remove':
                return await handler.handleChannelRemove(interaction);
            
            case 'autothread_naming_presets':
                return await handler.showNamingConfig(interaction);
            
            case 'autothread_advanced_options':
                return await handler.showAdvancedSettings(interaction);

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
                return await handler.handleMainMenu(interaction);
            
            case 'counting_channel_add':
                return await handler.handleChannelAdd(interaction);
            
            case 'counting_channel_configure':
                return await handler.handleChannelConfigure(interaction);
            
            case 'counting_global_options':
                return await handler.handleGlobalOptions(interaction);
            
            case 'counting_records_options':
                return await handler.handleRecordsOptions(interaction);
            
            case 'counting_stats_options':
                return await handler.handleCountingStats(interaction);

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