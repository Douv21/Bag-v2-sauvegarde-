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
            
            console.log('✅ Handlers spécialisés initialisés');
        } catch (error) {
            console.error('❌ Erreur initialisation handlers:', error);
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
            // Modals économiques
            if (customId.startsWith('action_config_modal_')) {
                await this.economyHandler.handleActionConfigModal(interaction);
                return true;
            }
            
            if (customId === 'objet_perso_modal') {
                await this.economyHandler.handleObjetPersoModal(interaction);
                return true;
            }

            // Modals Daily
            if (customId === 'daily_amount_modal') {
                await this.economyHandler.handleDailyAmountModal(interaction);
                return true;
            }

            if (customId === 'daily_streak_modal') {
                await this.economyHandler.handleDailyStreakModal(interaction);
                return true;
            }

            // Modals Messages
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

            // Modals Karma
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

            // Autres modals
            if (customId.includes('shop_role_price_modal')) {
                await this.economyHandler.handleShopRolePriceModal(interaction);
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Erreur modal submit:', error);
            return false;
        }
    }

    async handleButtonInteraction(interaction, customId) {
        try {
            // Boutons économie
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

            // Boutons confession
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

            return false;
        } catch (error) {
            console.error('❌ Erreur button interaction:', error);
            return false;
        }
    }

    async handleSelectMenuInteraction(interaction, customId) {
        try {
            // Select menus économie
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

            // Select menus confession
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
}

module.exports = MainRouterHandler;