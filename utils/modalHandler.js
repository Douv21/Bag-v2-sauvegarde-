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
            'create_negative_reward_modal',
            'custom_message_modal',
            'edit_item_modal',
            'modify_reward_modal',
            // Modals du système de niveaux
            'text_xp_modal',
            'voice_xp_modal',
            'base_xp_modal',
            'multiplier_modal',
            'add_role_reward_modal',
            'level_for_role',
            'style_backgrounds_modal',
            'style_backgrounds_default_modal',
            // Modals AOUV
            'aouv_prompt_add_modal',
            'aouv_prompt_add_bulk_modal',
            'aouv_prompt_edit_modal',
            'aouv_prompt_remove_modal',
            'aouv_prompt_disable_base_modal',
            'aouv_prompt_enable_base_modal',
            'aouv_prompt_list_base_modal',
            'aouv_prompt_override_base_modal',
            'aouv_prompt_reset_override_base_modal',
            // Modals AOUV NSFW
            'aouv_nsfw_prompt_add_modal',
            'aouv_nsfw_prompt_add_bulk_modal',
            'aouv_nsfw_prompt_edit_modal',
            'aouv_nsfw_prompt_remove_modal',
            'aouv_nsfw_prompt_disable_base_modal',
            'aouv_nsfw_prompt_enable_base_modal',
            'aouv_nsfw_prompt_list_base_modal',
            'aouv_nsfw_prompt_override_base_modal',
            'aouv_nsfw_prompt_reset_override_base_modal'
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
        // Cas spéciaux pour les modals dynamiques de niveau
        if (customId.startsWith('level_for_role_')) {
            return this.implementedModals.has('level_for_role');
        }
        
        // Vérifier d'abord le customId complet
        if (this.implementedModals.has(customId)) {
            return true;
        }
        
        // Extraire le nom de base du modal (sans paramètres) - essayer différentes longueurs
        for (let i = customId.split('_').length; i >= 2; i--) {
            const baseCustomId = customId.split('_').slice(0, i).join('_');
            if (this.implementedModals.has(baseCustomId)) {
                return true;
            }
        }
        
        return false;
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
            .setCustomId('feature_feedback')
            .setLabel('Que souhaitez-vous voir dans cette fonctionnalité ?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setPlaceholder('Décrivez votre besoin...')
            .setMinLength(10)
            .setMaxLength(500);

        const contactInput = new TextInputBuilder()
            .setCustomId('contact_info')
            .setLabel('Souhaitez-vous être contacté ? Si oui, précisez.')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder('Pseudo Discord, email...');

        const priorityInput = new TextInputBuilder()
            .setCustomId('feature_priority')
            .setLabel('Priorité (1-5)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder('3')
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
            // Logger la demande d'utilisateur
            await errorHandler.logError(
                ErrorLevels.INFO,
                `Demande de fonctionnalité: ${this.getModalFriendlyName(originalCustomId)}`,
                null,
                {
                    userId: interaction.user.id,
                    guildId: interaction.guild?.id,
                    customId: originalCustomId
                }
            );

            const priority = (() => {
                try { return interaction.fields.getTextInputValue('feature_priority') || '3'; } catch (_) { return '3'; }
            })();
            await errorHandler.safeReply(
                interaction,
                ErrorLevels.INFO,
                'Demande Enregistrée',
                `Merci pour votre intérêt pour **${this.getModalFriendlyName(originalCustomId)}** !\n\n` +
                '✅ **Votre demande a été enregistrée**\n' +
                `📊 **Priorité attribuée :** ${priority}/5\n` +
                '📝 **Feedback :** Transmis à l\'équipe de développement\n\n' +
                'Nous vous tiendrons informé des avancées.'
            );

            return true;

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

            // Retourner un modal par défaut minimal pour éviter les crashs
            const fallback = new ModalBuilder().setCustomId('error_modal').setTitle('Erreur');
            const messageInput = new TextInputBuilder()
                .setCustomId('error_message')
                .setLabel('Une erreur est survenue lors de la création du modal')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);
            fallback.addComponents(new ActionRowBuilder().addComponents(messageInput));
            return fallback;
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