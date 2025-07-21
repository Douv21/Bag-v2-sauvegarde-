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
        if (!interaction.isSelectMenu() && !interaction.isButton()) {
            return false;
        }

        const customId = interaction.customId;

        try {
            // Router basé sur le préfixe du customId
            if (customId.startsWith('confession_config') || customId.startsWith('confession_')) {
                return await this.routeToConfessionHandler(interaction, customId);
            }
            
            if (customId.startsWith('economy_config') || customId.startsWith('economy_')) {
                return await this.routeToEconomyHandler(interaction, customId);
            }
            
            if (customId.startsWith('autothread_config') || customId.startsWith('autothread_')) {
                return await this.routeToAutothreadHandler(interaction, customId);
            }
            
            if (customId.startsWith('counting_config') || customId.startsWith('counting_')) {
                return await this.routeToCountingHandler(interaction, customId);
            }
            
            if (customId.startsWith('dashboard_') || customId.includes('dashboard')) {
                return await this.routeToDashboardHandler(interaction, customId);
            }

            // Routes spéciales pour les commandes principales
            if (customId === 'config_main_menu') {
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
                return await handler.showAdminLogsConfig(interaction);
            
            case 'confession_autothread_options':
                return await handler.showAutoThreadConfig(interaction);

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
                return await handler.showGlobalSettings(interaction);
            
            case 'counting_records_options':
                return await handler.showRecordsManagement(interaction);
            
            case 'counting_stats_options':
                return await handler.showCountingStats(interaction);

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