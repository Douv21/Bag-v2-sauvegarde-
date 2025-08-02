const { errorHandler, ErrorLevels } = require('./errorHandler');

/**
 * Wrapper sécurisé pour les interactions Discord.js
 * Evite les erreurs "interaction déjà reconnue" (DiscordAPIError[40060])
 */
class InteractionWrapper {
    constructor(interaction) {
        this.interaction = interaction;
        this.isProcessed = false;
        this.processingTimestamp = null;
    }

    /**
     * Vérifie si l'interaction peut encore être utilisée
     */
    isValid() {
        if (!this.interaction) return false;
        if (this.isProcessed) return false;
        
        // Les interactions expirent après 15 minutes (900000ms)
        const now = Date.now();
        const interactionTime = this.interaction.createdTimestamp;
        const timeElapsed = now - interactionTime;
        
        return timeElapsed < 900000; // 15 minutes
    }

    /**
     * Vérifie si l'interaction a déjà été répondue
     */
    hasBeenReplied() {
        return this.interaction.replied || this.interaction.deferred;
    }

    /**
     * Réponse sécurisée à une interaction
     */
    async safeReply(options) {
        if (!this.isValid()) {
            console.warn('⚠️ Tentative de réponse à une interaction expirée/déjà traitée');
            return false;
        }

        try {
            if (this.hasBeenReplied()) {
                // Si déjà répondu, utiliser editReply
                await this.interaction.editReply(options);
            } else {
                // Première réponse
                await this.interaction.reply(options);
            }
            
            this.markAsProcessed();
            return true;
        } catch (error) {
            if (error.code === 40060) {
                console.warn('⚠️ Interaction déjà reconnue (40060) - ignoré');
                this.markAsProcessed();
                return false;
            }
            
            await errorHandler.logError(
                ErrorLevels.ERROR,
                'Erreur lors de la réponse à une interaction',
                error,
                {
                    interactionId: this.interaction.id,
                    interactionType: this.interaction.type,
                    hasBeenReplied: this.hasBeenReplied()
                }
            );
            throw error;
        }
    }

    /**
     * Mise à jour sécurisée d'une interaction
     */
    async safeUpdate(options) {
        if (!this.isValid()) {
            console.warn('⚠️ Tentative de mise à jour d\'une interaction expirée/déjà traitée');
            return false;
        }

        try {
            await this.interaction.update(options);
            this.markAsProcessed();
            return true;
        } catch (error) {
            if (error.code === 40060) {
                console.warn('⚠️ Interaction déjà reconnue (40060) - ignoré');
                this.markAsProcessed();
                return false;
            }
            
            await errorHandler.logError(
                ErrorLevels.ERROR,
                'Erreur lors de la mise à jour d\'une interaction',
                error,
                {
                    interactionId: this.interaction.id,
                    interactionType: this.interaction.type
                }
            );
            throw error;
        }
    }

    /**
     * Defer sécurisé d'une interaction
     */
    async safeDefer(options = {}) {
        if (!this.isValid()) {
            console.warn('⚠️ Tentative de defer sur une interaction expirée/déjà traitée');
            return false;
        }

        if (this.hasBeenReplied()) {
            console.warn('⚠️ Tentative de defer sur une interaction déjà répondue');
            return false;
        }

        try {
            await this.interaction.deferReply(options);
            return true;
        } catch (error) {
            if (error.code === 40060) {
                console.warn('⚠️ Interaction déjà reconnue (40060) - defer ignoré');
                return false;
            }
            
            await errorHandler.logError(
                ErrorLevels.ERROR,
                'Erreur lors du defer d\'une interaction',
                error,
                {
                    interactionId: this.interaction.id,
                    interactionType: this.interaction.type
                }
            );
            throw error;
        }
    }

    /**
     * Followup sécurisé
     */
    async safeFollowUp(options) {
        if (!this.isValid()) {
            console.warn('⚠️ Tentative de followup sur une interaction expirée/déjà traitée');
            return false;
        }

        try {
            const followUpMessage = await this.interaction.followUp(options);
            return followUpMessage;
        } catch (error) {
            await errorHandler.logError(
                ErrorLevels.ERROR,
                'Erreur lors du followup d\'une interaction',
                error,
                {
                    interactionId: this.interaction.id,
                    interactionType: this.interaction.type
                }
            );
            throw error;
        }
    }

    /**
     * Marque l'interaction comme traitée
     */
    markAsProcessed() {
        this.isProcessed = true;
        this.processingTimestamp = Date.now();
    }

    /**
     * Accès aux propriétés de l'interaction originale
     */
    get user() { return this.interaction.user; }
    get guild() { return this.interaction.guild; }
    get channel() { return this.interaction.channel; }
    get member() { return this.interaction.member; }
    get customId() { return this.interaction.customId; }
    get values() { return this.interaction.values; }
    get options() { return this.interaction.options; }
    get id() { return this.interaction.id; }
    get type() { return this.interaction.type; }
    get createdTimestamp() { return this.interaction.createdTimestamp; }
    get replied() { return this.interaction.replied; }
    get deferred() { return this.interaction.deferred; }
}

/**
 * Factory function pour créer un wrapper sécurisé
 */
function wrapInteraction(interaction) {
    return new InteractionWrapper(interaction);
}

/**
 * Middleware pour wrapper automatiquement les interactions
 */
function createInteractionMiddleware() {
    return (interaction, next) => {
        const wrappedInteraction = wrapInteraction(interaction);
        next(wrappedInteraction);
    };
}

module.exports = {
    InteractionWrapper,
    wrapInteraction,
    createInteractionMiddleware
};