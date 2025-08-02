const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

class ErrorHandler {
    constructor() {
        this.errorLevels = {
            CRITICAL: 'CRITICAL',
            ERROR: 'ERROR', 
            WARNING: 'WARNING',
            INFO: 'INFO'
        };
        
        this.logFile = path.join(__dirname, '../data/error_logs.json');
        this.initializeLogFile();
    }

    async initializeLogFile() {
        try {
            await fs.access(this.logFile);
        } catch {
            await this.saveErrorLog([]);
        }
    }

    async logError(level, message, error = null, context = {}) {
        const timestamp = new Date().toISOString();
        const errorEntry = {
            timestamp,
            level,
            message,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : null,
            context
        };

        try {
            const logs = await this.getErrorLogs();
            logs.push(errorEntry);
            
            // Garder seulement les 1000 derniers logs
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            
            await this.saveErrorLog(logs);
            
            // Log dans la console avec couleurs
            this.consoleLog(level, message, error);
            
        } catch (logError) {
            console.error('❌ Erreur critique lors du logging:', logError);
        }
    }

    consoleLog(level, message, error) {
        const timestamp = new Date().toLocaleString('fr-FR');
        let colorCode = '';
        let emoji = '';
        
        switch (level) {
            case this.errorLevels.CRITICAL:
                colorCode = '\x1b[41m\x1b[37m'; // Rouge sur blanc
                emoji = '🔥';
                break;
            case this.errorLevels.ERROR:
                colorCode = '\x1b[31m'; // Rouge
                emoji = '❌';
                break;
            case this.errorLevels.WARNING:
                colorCode = '\x1b[33m'; // Jaune
                emoji = '⚠️';
                break;
            case this.errorLevels.INFO:
                colorCode = '\x1b[36m'; // Cyan
                emoji = 'ℹ️';
                break;
        }
        
        console.log(`${colorCode}${emoji} [${level}] ${timestamp}: ${message}\x1b[0m`);
        if (error) {
            console.error(`${colorCode}   └─ ${error.message}\x1b[0m`);
            if (level === this.errorLevels.CRITICAL) {
                console.error(`${colorCode}   └─ Stack: ${error.stack}\x1b[0m`);
            }
        }
    }

    async getErrorLogs() {
        try {
            const data = await fs.readFile(this.logFile, 'utf8');
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    async saveErrorLog(logs) {
        await fs.writeFile(this.logFile, JSON.stringify(logs, null, 2));
    }

    // Créer un embed d'erreur pour Discord
    createErrorEmbed(level, title, description, additionalFields = []) {
        let color = 0x95a5a6; // Gris par défaut
        let emoji = 'ℹ️';
        
        switch (level) {
            case this.errorLevels.CRITICAL:
                color = 0xe74c3c; // Rouge
                emoji = '🔥';
                break;
            case this.errorLevels.ERROR:
                color = 0xf39c12; // Orange
                emoji = '❌';
                break;
            case this.errorLevels.WARNING:
                color = 0xf1c40f; // Jaune
                emoji = '⚠️';
                break;
            case this.errorLevels.INFO:
                color = 0x3498db; // Bleu
                emoji = 'ℹ️';
                break;
        }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${emoji} ${title}`)
            .setDescription(description)
            .setTimestamp();

        additionalFields.forEach(field => {
            embed.addFields(field);
        });

        return embed;
    }

    // Répondre à une interaction avec une erreur
    async respondWithError(interaction, level, title, description, ephemeral = true) {
        const embed = this.createErrorEmbed(level, title, description);
        
        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embed], ephemeral });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral });
            }
        } catch (error) {
            await this.logError(this.errorLevels.CRITICAL, 'Impossible de répondre à une interaction', error, {
                interactionId: interaction.id,
                userId: interaction.user?.id
            });
        }
    }

    // Gestion des erreurs critiques avec notification
    async handleCriticalError(error, context = {}, interaction = null) {
        await this.logError(this.errorLevels.CRITICAL, 'Erreur critique détectée', error, context);
        
        if (interaction) {
            await this.respondWithError(
                interaction,
                this.errorLevels.CRITICAL,
                'Erreur Critique',
                'Une erreur critique s\'est produite. L\'équipe technique a été notifiée automatiquement.\n\n' +
                '**Actions recommandées :**\n' +
                '• Réessayez dans quelques minutes\n' +
                '• Si le problème persiste, contactez un administrateur\n' +
                '• Notez l\'heure exacte de l\'erreur pour le support'
            );
        }
    }

    // Gestion des modals non implémentées
    async handleNotImplementedModal(interaction, featureName) {
        await this.logError(
            this.errorLevels.WARNING, 
            `Modal non implémentée: ${featureName}`, 
            null, 
            { 
                userId: interaction.user?.id,
                guildId: interaction.guild?.id,
                customId: interaction.customId
            }
        );

        await this.respondWithError(
            interaction,
            this.errorLevels.WARNING,
            'Fonctionnalité en Développement',
            `**${featureName}** n'est pas encore implémentée.\n\n` +
            '🚧 **Statut :** En cours de développement\n' +
            '📅 **Disponibilité :** Prochainement\n' +
            '💡 **Alternative :** Utilisez les commandes slash en attendant\n\n' +
            '*L\'équipe de développement a été notifiée de votre tentative d\'utilisation.*'
        );
    }

    // Middleware pour wrapper les fonctions avec gestion d'erreur
    wrapAsyncFunction(fn, functionName) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                await this.logError(
                    this.errorLevels.ERROR,
                    `Erreur dans ${functionName}`,
                    error,
                    { functionName, argsCount: args.length }
                );
                throw error; // Re-throw pour permettre la gestion spécifique
            }
        };
    }

    // Récupérer les statistiques d'erreurs
    async getErrorStats(hours = 24) {
        const logs = await this.getErrorLogs();
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        
        const recentLogs = logs.filter(log => new Date(log.timestamp) > cutoff);
        
        const stats = {
            total: recentLogs.length,
            critical: recentLogs.filter(log => log.level === this.errorLevels.CRITICAL).length,
            error: recentLogs.filter(log => log.level === this.errorLevels.ERROR).length,
            warning: recentLogs.filter(log => log.level === this.errorLevels.WARNING).length,
            info: recentLogs.filter(log => log.level === this.errorLevels.INFO).length
        };
        
        return { stats, recentLogs };
    }
}

// Singleton pattern
const errorHandler = new ErrorHandler();

module.exports = {
    ErrorHandler,
    errorHandler,
    ErrorLevels: errorHandler.errorLevels
};