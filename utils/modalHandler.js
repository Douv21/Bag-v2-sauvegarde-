const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { errorHandler, ErrorLevels } = require('./errorHandler');

class ModalHandler {
    constructor() {
        // Liste des modals implémentées
        this.implementedModals = new Set([
            'action_config_modal',
            'objet_perso_modal', 
            'role_config_modal',
            'remise_karma_modal',
            'daily_amount_modal',
            'daily_streak_modal',
            'message_amount_modal',
            'message_cooldown_modal',
            'message_limits_modal',
            'karma_levels_modal',
            'create_positive_reward_modal',
            'create_negative_reward_modal'
        ]);

        // Liste des modals prévues mais non implémentées
        this.plannedModals = {
            'message_limits_modal': 'Configuration des limites de messages',
            'advanced_karma_modal': 'Configuration avancée du karma',
            'backup_settings_modal': 'Configuration des sauvegardes',
            'notification_settings_modal': 'Paramètres de notifications',
            'role_permissions_modal': 'Gestion des permissions de rôles',
            'economy_settings_modal': 'Paramètres économiques avancés',
            'level_rewards_modal': 'Configuration des récompenses de niveau',
            'custom_commands_modal': 'Création de commandes personnalisées',
            'automod_settings_modal': 'Configuration de la modération automatique',
            'welcome_message_modal': 'Configuration des messages de bienvenue'
        };
    }

    // Vérifier si un modal est implémenté
    isModalImplemented(customId) {
        // Extraire le nom de base du modal (sans paramètres)
        const baseCustomId = customId.split('_').slice(0, 3).join('_');
        return this.implementedModals.has(baseCustomId);
    }

    // Obtenir le nom convivial d'un modal
    getModalFriendlyName(customId) {
        const baseCustomId = customId.split('_').slice(0, 3).join('_');
        return this.plannedModals[baseCustomId] || 'Fonctionnalité inconnue';
    }

    // Créer un modal générique "non implémenté"
    createNotImplementedModal(customId, title = 'Fonctionnalité en développement') {
        const modal = new ModalBuilder()
            .setCustomId(`not_implemented_${customId}`)
            .setTitle(title);

        const feedbackInput = new TextInputBuilder()
            .setCustomId('feedback_input')
            .setLabel('Votre feedback (optionnel)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Dites-nous ce que vous attendez de cette fonctionnalité...')
            .setRequired(false)
            .setMaxLength(1000);

        const contactInput = new TextInputBuilder()
            .setCustomId('contact_input')
            .setLabel('Comment vous contacter (optionnel)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Discord ID, email, etc.')
            .setRequired(false)
            .setMaxLength(100);

        const priorityInput = new TextInputBuilder()
            .setCustomId('priority_input')
            .setLabel('Priorité pour vous (1-5)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('1 = pas urgent, 5 = très urgent')
            .setRequired(false)
            .setMinLength(1)
            .setMaxLength(1);

        modal.addComponents(
            new ActionRowBuilder().addComponents(feedbackInput),
            new ActionRowBuilder().addComponents(contactInput),
            new ActionRowBuilder().addComponents(priorityInput)
        );

        return modal;
    }

    // Gérer la soumission d'un modal "non implémenté"
    async handleNotImplementedSubmission(interaction) {
        try {
            const originalCustomId = interaction.customId.replace('not_implemented_', '');
            const feedback = interaction.fields.getTextInputValue('feedback_input') || 'Aucun feedback fourni';
            const contact = interaction.fields.getTextInputValue('contact_input') || 'Non fourni';
            const priority = interaction.fields.getTextInputValue('priority_input') || '3';

            // Logger la demande d'utilisateur
            await errorHandler.logError(
                ErrorLevels.INFO,
                `Demande de fonctionnalité: ${this.getModalFriendlyName(originalCustomId)}`,
                null,
                {
                    userId: interaction.user.id,
                    username: interaction.user.username,
                    guildId: interaction.guild?.id,
                    guildName: interaction.guild?.name,
                    originalCustomId,
                    feedback,
                    contact,
                    priority: parseInt(priority) || 3
                }
            );

            await errorHandler.respondWithError(
                interaction,
                ErrorLevels.INFO,
                'Demande Enregistrée',
                `Merci pour votre intérêt pour **${this.getModalFriendlyName(originalCustomId)}** !\n\n` +
                '✅ **Votre demande a été enregistrée**\n' +
                `📊 **Priorité attribuée :** ${priority}/5\n` +
                '📝 **Feedback :** Transmis à l\'équipe de développement\n\n' +
                '**Prochaines étapes :**\n' +
                '• Votre demande sera évaluée par l\'équipe\n' +
                '• Les fonctionnalités les plus demandées seront priorisées\n' +
                '• Vous serez notifié des nouvelles versions\n\n' +
                '*Merci de contribuer à l\'amélioration du bot !*'
            );

        } catch (error) {
            await errorHandler.handleCriticalError(error, {
                context: 'Gestion soumission modal non implémenté',
                customId: interaction.customId
            }, interaction);
        }
    }

    // Middleware pour gérer automatiquement les modals non implémentées
    async handleModalSubmission(interaction) {
        try {
            // Vérifier si c'est un modal "non implémenté"
            if (interaction.customId.startsWith('not_implemented_')) {
                return await this.handleNotImplementedSubmission(interaction);
            }

            // Vérifier si le modal est implémenté
            if (!this.isModalImplemented(interaction.customId)) {
                const featureName = this.getModalFriendlyName(interaction.customId);
                await errorHandler.handleNotImplementedModal(interaction, featureName);
                return false; // Indique que le modal n'est pas implémenté
            }

            return true; // Modal implémenté, continuer le traitement normal
        } catch (error) {
            await errorHandler.handleCriticalError(error, {
                context: 'ModalHandler.handleModalSubmission',
                customId: interaction.customId
            }, interaction);
            return false;
        }
    }

    // Créer un modal sécurisé avec gestion d'erreur
    createSafeModal(customId, title, components) {
        try {
            const modal = new ModalBuilder()
                .setCustomId(customId)
                .setTitle(title);

            components.forEach(component => {
                modal.addComponents(component);
            });

            return modal;
        } catch (error) {
            errorHandler.logError(
                ErrorLevels.ERROR,
                `Erreur création modal: ${customId}`,
                error,
                { customId, title }
            );
            throw error;
        }
    }

    // Afficher un modal avec gestion d'erreur
    async showModal(interaction, modal) {
        try {
            await interaction.showModal(modal);
            return true;
        } catch (error) {
            await errorHandler.logError(
                ErrorLevels.ERROR,
                'Erreur affichage modal',
                error,
                {
                    modalCustomId: modal.data.custom_id,
                    userId: interaction.user?.id,
                    guildId: interaction.guild?.id
                }
            );

            await errorHandler.respondWithError(
                interaction,
                ErrorLevels.ERROR,
                'Erreur d\'affichage',
                'Impossible d\'afficher le formulaire. Veuillez réessayer dans quelques instants.\n\n' +
                'Si le problème persiste, contactez un administrateur.'
            );
            return false;
        }
    }

    // Obtenir la liste des modals disponibles
    getAvailableModals() {
        return {
            implemented: Array.from(this.implementedModals),
            planned: Object.keys(this.plannedModals)
        };
    }

    // Créer un modal de feedback pour une fonctionnalité
    createFeatureFeedbackModal(featureName) {
        return this.createNotImplementedModal(
            `feedback_${featureName.toLowerCase().replace(/\s+/g, '_')}`,
            `Feedback: ${featureName}`
        );
    }
}

// Singleton
const modalHandler = new ModalHandler();

module.exports = {
    ModalHandler,
    modalHandler
};