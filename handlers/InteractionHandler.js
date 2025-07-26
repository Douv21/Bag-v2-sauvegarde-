const ConfessionHandler = require('./ConfessionHandler');
const EconomyConfigHandler = require('./EconomyConfigHandler');

class InteractionHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.confessionHandler = new ConfessionHandler(dataManager);
        this.economyHandler = new EconomyConfigHandler(dataManager);
    }

    /**
     * Méthode sécurisée pour répondre à une interaction
     * @param {Interaction} interaction - Interaction Discord
     * @param {Object} options - Options pour la réponse
     * @param {boolean} followUp - Si true, utilise followUp
     */
    async safeReply(interaction, options, followUp = false) {
        try {
            if (followUp) {
                return await interaction.followUp(options);
            }

            if (interaction.replied) {
                return await interaction.editReply(options);
            } else if (interaction.deferred) {
                return await interaction.editReply(options);
            } else {
                return await interaction.reply(options);
            }
        } catch (error) {
            console.error('[safeReply ERROR]', error);
        }
    }

    /**
     * Déférer automatiquement l'interaction si nécessaire
     * @param {Interaction} interaction 
     * @param {boolean} ephemeral 
     */
    async deferIfNeeded(interaction, ephemeral = true) {
        if (!interaction.deferred && !interaction.replied) {
            try {
                if (interaction.isButton() || interaction.isStringSelectMenu()) {
                    await interaction.deferUpdate();
                } else {
                    await interaction.deferReply({ ephemeral });
                }
            } catch (error) {
                console.error('[deferIfNeeded ERROR]', error);
            }
        }
    }

    /**
     * Gestion dynamique : map des handlers
     */
    get handlers() {
        return {
            // Confession Handlers
            confession_main: this.confessionHandler.handleConfessionMainConfig.bind(this.confessionHandler),
            confession_channels: this.confessionHandler.handleConfessionChannelsConfig.bind(this.confessionHandler),
            confession_autothread: this.confessionHandler.handleConfessionAutothreadConfig.bind(this.confessionHandler),
            confession_logs: this.confessionHandler.handleConfessionLogsConfig.bind(this.confessionHandler),
            confession_log_level: this.confessionHandler.handleConfessionLogLevel.bind(this.confessionHandler),
            confession_log_channel: this.confessionHandler.handleConfessionLogChannel.bind(this.confessionHandler),

            // Economy Handlers
            economy_main: this.economyHandler.handleEconomyMainConfig.bind(this.economyHandler),
            economy_actions: this.economyHandler.handleEconomyActionsConfig.bind(this.economyHandler),
            economy_shop: this.economyHandler.handleEconomyShopConfig.bind(this.economyHandler),
            economy_karma: this.economyHandler.handleEconomyKarmaConfig.bind(this.economyHandler),
            economy_daily: this.economyHandler.handleEconomyDailyConfig.bind(this.economyHandler),
        };
    }

    /**
     * Route l'interaction vers le bon handler
     * @param {Interaction} interaction
     */
    async handle(interaction) {
        const customId = interaction.customId;
        const handler = this.handlers[customId];

        if (!handler) {
            return this.safeReply(interaction, {
                content: '❌ Aucune action correspondante.',
                ephemeral: true
            });
        }

        // Déférer si nécessaire
        await this.deferIfNeeded(interaction);

        // Exécuter le handler
        try {
            await handler(interaction, this);
        } catch (error) {
            console.error(`[Handler ERROR: ${customId}]`, error);
            await this.safeReply(interaction, {
                content: '❌ Une erreur est survenue lors du traitement.',
                ephemeral: true
            });
        }
    }
}

module.exports = InteractionHandler;
