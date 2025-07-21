const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ConfessionHandler = require('./ConfessionHandler');
const EconomyHandler = require('./EconomyHandler');

class InteractionHandler {
    constructor(client, dataManager) {
        this.client = client;
        this.dataManager = dataManager;
        this.confessionHandler = new ConfessionHandler(dataManager);
        this.economyHandler = new EconomyHandler(dataManager);
        this.handlers = {
            selectMenu: new Map(),
            button: new Map(),
            modal: new Map(),
            channelSelect: new Map(),
            roleSelect: new Map()
        };
        
        this.setupHandlers();
        this.registerEventListeners();
    }

    setupHandlers() {
        // Configuration Économie (délégués à EconomyHandler)
        this.handlers.selectMenu.set('economy_main_config', this.economyHandler.handleEconomyMainConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_actions_config', this.economyHandler.handleEconomyActionsConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_shop_config', this.economyHandler.handleEconomyShopConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_karma_config', this.economyHandler.handleEconomyKarmaConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_daily_config', this.economyHandler.handleEconomyDailyConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_messages_config', this.economyHandler.handleEconomyMessagesConfig.bind(this.economyHandler));
        
        // Handlers pour actions individuelles (architecture originale)
        const economyActions = ['travailler', 'pecher', 'donner', 'voler', 'crime', 'parier'];
        economyActions.forEach(action => {
            this.handlers.selectMenu.set(`economy_action_${action}_config`, this.economyHandler.handleEconomyActionsConfig.bind(this.economyHandler));
        });
        
        // Handlers pour sous-configurations d'actions
        this.handlers.selectMenu.set('economy_action_rewards_config', this.economyHandler.handleActionSubConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_action_reward_amounts', this.economyHandler.handleActionRewardAmounts.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_action_karma_amounts', this.economyHandler.handleActionKarmaAmounts.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_action_cooldown_amounts', this.economyHandler.handleActionCooldownAmounts.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_action_toggle_status', this.economyHandler.handleActionToggleStatus.bind(this.economyHandler));
        
        // Handlers pour édition des configurations spécifiques
        this.handlers.selectMenu.set('economy_rewards_edit_config', this.economyHandler.handleRewardsEditConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_karma_edit_config', this.economyHandler.handleKarmaEditConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_cooldown_edit_config', this.economyHandler.handleCooldownEditConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_toggle_edit_config', this.economyHandler.handleToggleEditConfig.bind(this.economyHandler));
        
        // Nouveaux handlers pour tous les sous-menus de configeconomie
        // BOUTIQUE
        this.handlers.selectMenu.set('economy_shop_add_role_price', this.economyHandler.handleShopAddRolePrice.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_shop_remove_role_confirm', this.economyHandler.handleShopRemoveRoleConfirm.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_shop_edit_price_value', this.economyHandler.handleShopEditPriceValue.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_shop_items_action', this.economyHandler.handleShopItemsAction.bind(this.economyHandler));
        
        // KARMA
        this.handlers.selectMenu.set('economy_karma_levels_edit', this.economyHandler.handleKarmaLevelsEdit.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_karma_rewards_edit', this.economyHandler.handleKarmaRewardConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_karma_reset_edit', this.economyHandler.handleKarmaResetEdit.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_action_karma_values', this.economyHandler.handleActionKarmaValues.bind(this.economyHandler));
        
        // DAILY
        this.handlers.selectMenu.set('economy_daily_amounts_edit', this.economyHandler.handleDailyAmountsEdit.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_daily_streak_edit', this.economyHandler.handleDailyStreakEdit.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_daily_reset_edit', this.economyHandler.handleDailyResetEdit.bind(this.economyHandler));
        
        // MESSAGES
        this.handlers.selectMenu.set('economy_messages_toggle_edit', this.economyHandler.handleMessagesToggleEdit.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_messages_amount_edit', this.economyHandler.handleMessagesAmountEdit.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_messages_cooldown_edit', this.economyHandler.handleMessagesCooldownEdit.bind(this.economyHandler));
        
        // STATISTIQUES
        this.handlers.selectMenu.set('economy_stats_action', this.economyHandler.handleStatsAction.bind(this.economyHandler));
        
        // CARTE HOLOGRAPHIQUE PROFIL-UTILISATEUR

        
        // NOUVEAUX HANDLERS BOUTIQUE AVANCÉE
        this.handlers.selectMenu.set('economy_shop_role_type_select', this.economyHandler.handleShopRoleTypeSelect.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_shop_permanent_price_select', this.economyHandler.handleShopPermanentPriceSelect.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_shop_temporary_duration_select', this.economyHandler.handleShopTemporaryDurationSelect.bind(this.economyHandler));
        
        // HANDLERS pour nouveaux workflows boutique
        this.handlers.selectMenu.set('economy_shop_workflow_select', this.economyHandler.handleEconomyShopConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('manage_existing_items', this.economyHandler.handleManageExistingItems.bind(this.economyHandler));
        this.handlers.selectMenu.set('shop_stats_options', this.economyHandler.handleShopStatsOptions.bind(this.economyHandler));
        
        // HANDLERS pour sélection de rôles serveur (RoleSelectMenuBuilder) - Pattern matching
        // Les handlers dynamiques seront gérés dans handleRoleSelect
        
        // HANDLERS pour modals boutique (anciens + nouveaux)
        this.handlers.modal = this.handlers.modal || new Map();
        this.handlers.modal.set('shop_permanent_price_modal', this.economyHandler.handlePermanentPriceModal.bind(this.economyHandler));
        this.handlers.modal.set('shop_temporary_duration_modal', this.economyHandler.handleTemporaryDurationModal.bind(this.economyHandler));
        this.handlers.modal.set('custom_object_creation_modal', this.economyHandler.handleCustomObjectCreationModal.bind(this.economyHandler));
        // Les modals dynamiques avec role ID seront gérés dans handleModal
        
        // Handlers pour les valeurs spécifiques 
        this.handlers.selectMenu.set('economy_rewards_value_config', this.economyHandler.handleRewardsValueConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_karma_value_config', this.economyHandler.handleKarmaValueConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_toggle_action_config', this.economyHandler.handleToggleActionConfig.bind(this.economyHandler));
        
        // Handlers pour les sélecteurs de valeurs spécifiques
        this.handlers.selectMenu.set('economy_money_value_config', this.economyHandler.handleMoneyValueConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_bonus_value_config', this.economyHandler.handleBonusValueConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_good_karma_config', this.economyHandler.handleGoodKarmaConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_bad_karma_config', this.economyHandler.handleBadKarmaConfig.bind(this.economyHandler));
        this.handlers.selectMenu.set('economy_multiplier_config', this.economyHandler.handleMultiplierConfig.bind(this.economyHandler));
        
        // Configuration Confession
        this.handlers.selectMenu.set('confession_main_config', this.handleConfessionMainConfig.bind(this));
        this.handlers.selectMenu.set('config_main_menu', this.handleConfigMainMenu.bind(this));
        this.handlers.selectMenu.set('confession_channels', this.handleConfessionChannels.bind(this));
        // this.handlers.selectMenu.set('confession_autothread', this.handleConfessionAutothread.bind(this)); // Retiré car dupliqué
        this.handlers.selectMenu.set('autothread_config', this.handleAutothreadGlobalConfig.bind(this));
        
        // Legacy handlers supprimés pour éviter conflits

        // Nouveaux handlers pour autothread global
        this.handlers.selectMenu.set('autothread_channels_config', this.handleAutothreadChannelsConfig.bind(this));
        this.handlers.selectMenu.set('autothread_name_config', this.handleAutothreadNameConfig.bind(this));
        this.handlers.selectMenu.set('autothread_archive_config', this.handleAutothreadArchiveConfig.bind(this));
        this.handlers.selectMenu.set('autothread_slowmode_config', this.handleAutothreadSlowmodeConfig.bind(this));
        this.handlers.selectMenu.set('autothread_toggle_status', this.handleAutothreadToggleStatus.bind(this));

        // Nouveaux handlers pour config-confession (délégués au ConfessionHandler)
        this.handlers.selectMenu.set('confession_channels_config', this.handleConfessionChannelsConfig.bind(this));
        this.handlers.selectMenu.set('confession_autothread_config', this.handleConfessionAutothreadConfig.bind(this));
        this.handlers.selectMenu.set('confession_logs_config', this.confessionHandler.handleConfessionLogsConfig.bind(this.confessionHandler));
        this.handlers.selectMenu.set('confession_log_level', this.confessionHandler.handleConfessionLogLevel.bind(this.confessionHandler));

        // Handlers pour sélecteurs canaux (ChannelSelectMenuBuilder)
        this.handlers.channelSelect = new Map();
        this.handlers.channelSelect.set('autothread_add_channel', this.handleAutothreadAddChannel.bind(this));
        this.handlers.channelSelect.set('autothread_remove_channel', this.handleAutothreadRemoveChannel.bind(this));
        this.handlers.channelSelect.set('confession_add_channel', this.handleConfessionAddChannel.bind(this));
        this.handlers.channelSelect.set('confession_remove_channel', this.handleConfessionRemoveChannel.bind(this));
        this.handlers.channelSelect.set('confession_log_channel', this.confessionHandler.handleConfessionLogChannel.bind(this.confessionHandler));
        
        // Handlers pour sélecteurs de rôles
        this.handlers.roleSelect.set('confession_log_ping_roles', this.confessionHandler.handleConfessionLogPingRoles.bind(this.confessionHandler));
        this.handlers.roleSelect.set('confession_ping_roles', this.confessionHandler.handleConfessionPingRoles.bind(this.confessionHandler));
        
        // Handlers pour sélecteurs modaux et toggles
        this.handlers.selectMenu.set('confession_archive_time', this.handleConfessionArchiveTime.bind(this));
        this.handlers.selectMenu.set('confession_thread_format', this.handleConfessionThreadFormat.bind(this));
        this.handlers.selectMenu.set('confession_autothread_config', this.handleConfessionAutothreadConfig.bind(this));
        this.handlers.selectMenu.set('confession_log_level', this.handleConfessionLogLevel.bind(this));
        
        // Handlers pour boutons confession
        this.handlers.button.set('toggle_confession_autothread', this.handleToggleConfessionAutothread.bind(this));
        
        // Boutons Navigation
        this.handlers.button.set('economy_back_main', this.handleBackToMain.bind(this));
        this.handlers.button.set('economy_back_actions', this.handleBackToActions.bind(this));
        this.handlers.button.set('config_back_main', this.handleBackToMain.bind(this));
        this.handlers.button.set('karma_force_reset', this.handleKarmaForceReset.bind(this));
        this.handlers.button.set('toggle_message_rewards', this.handleToggleMessageRewards.bind(this));

        // Legacy button handlers supprimés pour éviter erreurs
    }

    registerEventListeners() {
        this.client.on('interactionCreate', async (interaction) => {
            try {
                if (interaction.isStringSelectMenu()) {
                    await this.handleSelectMenu(interaction);
                } else if (interaction.isChannelSelectMenu()) {
                    await this.handleChannelSelect(interaction);
                } else if (interaction.isButton()) {
                    await this.handleButton(interaction);
                } else if (interaction.isModalSubmit()) {
                    await this.handleModal(interaction);
                } else if (interaction.isRoleSelectMenu()) {
                    await this.handleRoleSelect(interaction);
                }
            } catch (error) {
                console.error('Erreur interaction:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: 'Une erreur est survenue lors du traitement de votre demande.',
                        flags: 64
                    }).catch(() => {});
                }
            }
        });
    }

    async handleSelectMenu(interaction) {
        console.log(`🔍 Recherche handler pour: ${interaction.customId}`);
        const handler = this.handlers.selectMenu.get(interaction.customId);
        if (handler) {
            console.log(`✅ Handler trouvé pour: ${interaction.customId}`);
            await handler(interaction);
        } else {
            console.log(`❌ Handler non trouvé pour: ${interaction.customId}`);
            console.log(`📋 Handlers disponibles:`, Array.from(this.handlers.selectMenu.keys()));
            await interaction.reply({
                content: `Sélecteur ${interaction.customId} non géré.`,
                flags: 64
            });
        }
    }

    async handleChannelSelect(interaction) {
        console.log(`🔍 Channel Select Interaction: ${interaction.customId}`);
        
        const handler = this.handlers.channelSelect?.get(interaction.customId);
        if (handler) {
            console.log(`✅ Handler trouvé pour ${interaction.customId}`);
            await handler(interaction);
        } else {
            console.log(`❌ Aucun handler pour ${interaction.customId}`);
            console.log('Handlers disponibles:', Array.from(this.handlers.channelSelect.keys()));
            await interaction.reply({
                content: `Handler canal non trouvé pour ${interaction.customId}.`,
                flags: 64
            });
        }
    }

    async handleRoleSelect(interaction) {
        console.log(`🔍 Role Select Interaction: ${interaction.customId}`);
        
        // Gestion des patterns dynamiques pour la boutique (anciens workflows)
        if (interaction.customId.startsWith('shop_permanent_role_select_')) {
            const price = interaction.customId.split('_')[4];
            await this.economyHandler.handleShopPermanentRoleSelect(interaction, price);
            return;
        }
        
        if (interaction.customId.startsWith('shop_temporary_role_select_')) {
            const parts = interaction.customId.split('_');
            const price = parts[4];
            const duration = parts[5];
            await this.economyHandler.handleShopTemporaryRoleSelect(interaction, price, duration);
            return;
        }
        
        // Nouveaux workflows boutique
        if (interaction.customId === 'temporary_role_workflow_select') {
            await this.economyHandler.handleTemporaryRoleWorkflowSelect(interaction);
            return;
        }
        
        if (interaction.customId === 'permanent_role_workflow_select') {
            await this.economyHandler.handlePermanentRoleWorkflowSelect(interaction);
            return;
        }
        
        // Handlers statiques
        const handler = this.handlers.roleSelect?.get(interaction.customId);
        if (handler) {
            console.log(`✅ Handler trouvé pour ${interaction.customId}`);
            await handler(interaction);
        } else {
            console.log(`❌ Aucun handler pour ${interaction.customId}`);
            console.log('Handlers disponibles:', Array.from(this.handlers.roleSelect.keys()));
            await interaction.reply({
                content: `Handler rôle non trouvé pour ${interaction.customId}.`,
                flags: 64
            });
        }
    }

    async handleButton(interaction) {
        const handler = this.handlers.button.get(interaction.customId);
        if (handler) {
            await handler(interaction);
        } else {
            await interaction.reply({
                content: `Bouton ${interaction.customId} non géré.`,
                flags: 64
            });
        }
    }

    async handleModal(interaction) {
        const customId = interaction.customId;
        console.log(`🔍 Modal soumis: ${customId}`);
        
        // Gestion des nouveaux modals dynamiques pour workflows boutique
        if (customId.startsWith('temporary_role_price_modal_')) {
            await this.economyHandler.handleTemporaryRolePriceModal(interaction);
            return;
        }
        
        if (customId.startsWith('permanent_role_price_modal_')) {
            await this.economyHandler.handlePermanentRolePriceModal(interaction);
            return;
        }
        
        if (customId === 'custom_object_modal') {
            await this.economyHandler.handleCustomObjectCreationModal(interaction);
            return;
        }
        
        // Custom karma reward modals
        if (customId.startsWith('custom_karma_reward_modal_')) {
            await this.economyHandler.handleCustomKarmaRewardModal(interaction);
            return;
        }
        
        // Vérifier les handlers statiques de modals boutique
        const modalHandler = this.handlers.modal?.get(customId);
        if (modalHandler) {
            console.log(`✅ Handler modal trouvé pour: ${customId}`);
            await modalHandler(interaction);
            return;
        }
        
        // Anciens handlers de modals
        if (customId.startsWith('reward_modal_')) {
            await this.handleRewardModal(interaction);
        } else if (customId.startsWith('karma_modal_')) {
            await this.handleKarmaModal(interaction);
        } else if (customId.startsWith('cooldown_modal_')) {
            await this.handleCooldownModal(interaction);
        } else {
            console.log(`❌ Aucun handler modal pour: ${customId}`);
            await interaction.reply({
                content: `Modal ${customId} non géré.`,
                flags: 64
            });
        }
    }

    async handleRewardModal(interaction) {
        const action = interaction.customId.split('_')[2];
        const minReward = interaction.fields.getTextInputValue('min_reward');
        const maxReward = interaction.fields.getTextInputValue('max_reward');
        const karmaBonus = interaction.fields.getTextInputValue('karma_bonus') || '0';

        await interaction.reply({
            content: `✅ Configuration récompenses mise à jour pour ${action}:\n• Min: ${minReward}€\n• Max: ${maxReward}€\n• Bonus karma: ${karmaBonus}%`,
            flags: 64
        });
    }

    async handleKarmaModal(interaction) {
        const action = interaction.customId.split('_')[2];
        const goodKarma = interaction.fields.getTextInputValue('good_karma');
        const badKarma = interaction.fields.getTextInputValue('bad_karma');
        const multiplier = interaction.fields.getTextInputValue('level_multiplier') || '0';

        await interaction.reply({
            content: `✅ Configuration karma mise à jour pour ${action}:\n• Karma bon: ${goodKarma}😇\n• Karma mauvais: ${badKarma}😈\n• Multiplicateur: ${multiplier}%`,
            flags: 64
        });
    }

    async handleCooldownModal(interaction) {
        const action = interaction.customId.split('_')[2];
        const duration = interaction.fields.getTextInputValue('cooldown_duration');
        const reduction = interaction.fields.getTextInputValue('karma_reduction') || '0';
        const type = interaction.fields.getTextInputValue('cooldown_type') || 'user';

        await interaction.reply({
            content: `✅ Configuration cooldown mise à jour pour ${action}:\n• Durée: ${duration}min\n• Réduction karma: ${reduction}%\n• Type: ${type}`,
            flags: 64
        });
    }

    // === HANDLERS CONFIGURATION ÉCONOMIE - Délégués à EconomyHandler ===

    // === HANDLERS CONFIGURATION CONFESSION ===

    async handleConfessionMainConfig(interaction) {
        const value = interaction.values[0];
        
        switch(value) {
            case 'channels':
                await this.showChannelsConfig(interaction);
                break;
            case 'autothread':
                await this.showAutothreadConfig(interaction);
                break;
            case 'logs':
                await this.showLogsConfig(interaction);
                break;
            default:
                await interaction.reply({
                    content: `Configuration confession ${value} disponible.`,
                    flags: 64
                });
        }
    }

    async handleConfessionChannels(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        const confessionConfig = config.confessions?.[guildId] || {
            channels: [],
            logChannel: null,
            autoThread: false,
            threadName: 'Confession #{number}'
        };

        let channelsList = '• Aucun canal configuré pour le moment';
        if (confessionConfig.channels && confessionConfig.channels.length > 0) {
            channelsList = confessionConfig.channels.map(channelId => {
                const channel = interaction.guild.channels.cache.get(channelId);
                return channel ? `• **#${channel.name}** (${channel.id})` : `• Canal supprimé (${channelId})`;
            }).join('\n');
        }

        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle('📋 Canaux Confession Configurés')
            .setDescription('Liste des canaux configurés pour les confessions anonymes')
            .addFields([
                {
                    name: `📱 Canaux Actifs (${confessionConfig.channels.length})`,
                    value: channelsList,
                    inline: false
                },
                {
                    name: '⚙️ Configuration',
                    value: `**Auto-Thread:** ${confessionConfig.autoThread ? '🟢 Activé' : '🔴 Désactivé'}\n**Format Thread:** \`${confessionConfig.threadName}\``,
                    inline: false
                }
            ]);

        await interaction.update({
            embeds: [embed],
            components: []
        });
    }

    async handleConfigMainMenu(interaction) {
        const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
        const value = interaction.values[0];
        
        if (value === 'channels') {
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('💭 Configuration Canaux Confessions')
                .setDescription('Gérez les canaux où les confessions sont envoyées');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confession_channels_config')
                .setPlaceholder('💭 Configurer les canaux confessions')
                .addOptions([
                    {
                        label: 'Ajouter Canal',
                        description: 'Ajouter un nouveau canal de confessions',
                        value: 'add_channel',
                        emoji: '➕'
                    },
                    {
                        label: 'Retirer Canal',
                        description: 'Retirer un canal de confessions',
                        value: 'remove_channel',
                        emoji: '➖'
                    },
                    {
                        label: 'Voir Canaux',
                        description: 'Afficher tous les canaux configurés',
                        value: 'list_channels',
                        emoji: '📋'
                    }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        } else if (value === 'autothread') {
            const guildId = interaction.guild.id;
            const config = await this.dataManager.getData('config');
            
            if (!config.confessions) config.confessions = {};
            if (!config.confessions[guildId]) {
                config.confessions[guildId] = {
                    channels: [],
                    logChannel: null,
                    autoThread: false,
                    threadName: 'Confession #{number}',
                    archiveTime: 1440
                };
            }

            const currentStatus = config.confessions[guildId].autoThread ? '🟢 Activé' : '🔴 Désactivé';
            const threadFormat = config.confessions[guildId].threadName || 'Confession #{number}';
            const archiveTime = config.confessions[guildId].archiveTime || 1440;
            
            const archiveDurations = {
                60: '1 heure',
                1440: '1 jour',  
                4320: '3 jours',
                10080: '7 jours'
            };

            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('🧵 Configuration Auto-Thread Confessions')
                .setDescription('Configurez la création automatique de threads pour les confessions')
                .addFields([
                    {
                        name: '📊 Status Actuel',
                        value: `**Auto-Thread :** ${currentStatus}\n**Format :** \`${threadFormat}\`\n**Archive :** ${archiveDurations[archiveTime] || `${archiveTime} minutes`}`,
                        inline: false
                    }
                ]);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confession_autothread_config')
                .setPlaceholder('🧵 Configurer auto-thread confessions')
                .addOptions([
                    {
                        label: 'Activer/Désactiver',
                        description: `Actuellement ${config.confessions[guildId].autoThread ? 'activé' : 'désactivé'}`,
                        value: 'toggle_autothread',
                        emoji: config.confessions[guildId].autoThread ? '🔴' : '🟢'
                    },
                    {
                        label: 'Format Nom Threads',
                        description: `Actuel: ${threadFormat.substring(0, 40)}${threadFormat.length > 40 ? '...' : ''}`,
                        value: 'thread_name',
                        emoji: '🏷️'
                    },
                    {
                        label: 'Durée Archive',
                        description: `Actuellement: ${archiveDurations[archiveTime] || `${archiveTime}min`}`,
                        value: 'archive_time',
                        emoji: '📦'
                    }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });

        } else if (value === 'logs') {
            const guildId = interaction.guild.id;
            const config = await this.dataManager.getData('config');
            
            if (!config.confessions) config.confessions = {};
            if (!config.confessions[guildId]) {
                config.confessions[guildId] = {
                    channels: [],
                    logChannel: null,
                    autoThread: false,
                    threadName: 'Confession #{number}',
                    logLevel: 'basic',
                    logImages: true
                };
            }

            const logChannel = config.confessions[guildId].logChannel;
            const logLevel = config.confessions[guildId].logLevel || 'basic';
            const logImages = config.confessions[guildId].logImages !== false;
            
            const levels = {
                'basic': '📄 Basique',
                'detailed': '📋 Détaillé', 
                'full': '🔍 Complet'
            };

            const channelName = logChannel ? 
                (interaction.guild.channels.cache.get(logChannel)?.name || 'Canal supprimé') : 
                'Aucun configuré';

            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('📋 Configuration Logs Admin')
                .setDescription('Configurez les logs des confessions pour la modération')
                .addFields([
                    {
                        name: '📊 Configuration Actuelle',
                        value: `**Canal :** ${channelName}\n**Niveau :** ${levels[logLevel]}\n**Images :** ${logImages ? '🟢 Incluses' : '🔴 Masquées'}`,
                        inline: false
                    }
                ]);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confession_logs_config')
                .setPlaceholder('📋 Configurer les logs admin')
                .addOptions([
                    {
                        label: 'Canal Logs',
                        description: `Actuel: ${channelName.substring(0, 40)}`,
                        value: 'log_channel',
                        emoji: '📝'
                    },
                    {
                        label: 'Niveau de Détail',
                        description: `Actuel: ${levels[logLevel]}`,
                        value: 'log_level',
                        emoji: '🔍'
                    },
                    {
                        label: 'Images dans Logs',
                        description: `${logImages ? 'Désactiver' : 'Activer'} l'affichage des images`,
                        value: 'log_images',
                        emoji: logImages ? '🔴' : '🟢'
                    },
                    {
                        label: 'Ping Rôles Logs',
                        description: 'Rôles à mentionner dans les logs admin',
                        value: 'log_ping_roles',
                        emoji: '🔔'
                    },
                    {
                        label: 'Ping Rôles Confessions',
                        description: 'Rôles à mentionner lors de nouvelles confessions',
                        value: 'confession_ping_roles',
                        emoji: '📢'
                    }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        }
    }

    async handleConfessionAutothreadConfig(interaction) {
        const value = interaction.values[0];
        const dataManager = require('../managers/DataManager');
        const config = await dataManager.getData('config');
        const guildId = interaction.guild.id;

        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}',
                archiveTime: 1440
            };
        }

        if (value === 'toggle_autothread') {
            const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
            
            const currentStatus = config.confessions[guildId].autoThread ? '🟢 Activé' : '🔴 Désactivé';
            const newAction = config.confessions[guildId].autoThread ? 'Désactiver' : 'Activer';
            
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('🔄 Auto-Thread Confessions')
                .setDescription(`**Status actuel :** ${currentStatus}\n\nCliquez pour ${newAction.toLowerCase()} les threads automatiques pour les confessions.`)
                .addFields({
                    name: 'ℹ️ Information',
                    value: config.confessions[guildId].autoThread 
                        ? 'Les confessions créent actuellement des threads automatiques'
                        : 'Les confessions n\'utilisent pas de threads automatiques',
                    inline: false
                });

            const toggleButton = new ButtonBuilder()
                .setCustomId('toggle_confession_autothread')
                .setLabel(`${newAction} Auto-Thread`)
                .setStyle(config.confessions[guildId].autoThread ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji(config.confessions[guildId].autoThread ? '🔴' : '🟢');

            const components = [new ActionRowBuilder().addComponents(toggleButton)];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });

        } else if (value === 'thread_name') {
            const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
            
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('🏷️ Format Nom des Threads')
                .setDescription('Choisissez le format pour les noms des threads de confessions')
                .addFields({
                    name: 'Format actuel',
                    value: `\`${config.confessions[guildId].threadName || 'Confession #{number}'}\``,
                    inline: false
                });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confession_thread_format')
                .setPlaceholder('🏷️ Choisir format nom thread')
                .addOptions([
                    {
                        label: 'Confession #{number}',
                        description: 'Format simple avec numéro',
                        value: 'Confession #{number}',
                        emoji: '📝'
                    },
                    {
                        label: 'Confession #{number} - {date}',
                        description: 'Numéro avec date du jour',
                        value: 'Confession #{number} - {date}',
                        emoji: '📅'
                    },
                    {
                        label: 'Thread Confession {date}',
                        description: 'Format avec date seulement',
                        value: 'Thread Confession {date}',
                        emoji: '🗓️'
                    },
                    {
                        label: 'Confession Anonyme #{number}',
                        description: 'Format anonyme avec numéro',
                        value: 'Confession Anonyme #{number}',
                        emoji: '🔒'
                    }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });

        } else if (value === 'archive_time') {
            const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
            
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('📦 Archive Automatique')
                .setDescription('Choisissez la durée avant archivage automatique des threads');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confession_archive_time')
                .setPlaceholder('📦 Durée d\'archivage')
                .addOptions([
                    { label: '1 heure', description: 'Archive après 1 heure d\'inactivité', value: '60', emoji: '⏰' },
                    { label: '24 heures', description: 'Archive après 1 jour d\'inactivité', value: '1440', emoji: '📅' },
                    { label: '3 jours', description: 'Archive après 3 jours d\'inactivité', value: '4320', emoji: '📆' },
                    { label: '7 jours', description: 'Archive après 1 semaine d\'inactivité', value: '10080', emoji: '🗓️' }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        }
    }

    async handleConfessionLogLevel(interaction) {
        const level = interaction.values[0];
        const config = await this.dataManager.getData('config');
        const guildId = interaction.guild.id;

        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                logLevel: 'basic'
            };
        }

        config.confessions[guildId].logLevel = level;
        await this.dataManager.saveData('config', config);

        const levels = {
            'basic': '📄 Basique - Contenu et utilisateur seulement',
            'detailed': '📋 Détaillé - Toutes les informations',
            'full': '🔍 Complet - Inclut métadonnées et traces'
        };

        await interaction.reply({
            content: `🔍 Niveau de logs configuré :\n${levels[level]}`,
            flags: 64
        });
    }

    async handleAutothreadGlobalConfig(interaction) {
        const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
        const value = interaction.values[0];
        
        if (value === 'toggle') {
            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('🔄 Activer/Désactiver Auto-Thread')
                .setDescription('Choisissez l\'état du système auto-thread global');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('autothread_toggle_status')
                .setPlaceholder('🔄 Choisir l\'état du système')
                .addOptions([
                    {
                        label: 'Activer',
                        description: 'Activer le système auto-thread sur tous les canaux configurés',
                        value: 'enable',
                        emoji: '🟢'
                    },
                    {
                        label: 'Désactiver',
                        description: 'Désactiver complètement le système auto-thread',
                        value: 'disable',
                        emoji: '🔴'
                    }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        } else if (value === 'channels') {
            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('📱 Configuration Canaux')
                .setDescription('Sélectionnez une option pour gérer les canaux');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('autothread_channels_config')
                .setPlaceholder('📱 Configurer les canaux')
                .addOptions([
                    {
                        label: 'Ajouter Canal',
                        description: 'Ajouter un nouveau canal',
                        value: 'add_channel',
                        emoji: '➕'
                    },
                    {
                        label: 'Retirer Canal',
                        description: 'Retirer un canal existant',
                        value: 'remove_channel',
                        emoji: '➖'
                    },
                    {
                        label: 'Voir Canaux',
                        description: 'Afficher tous les canaux configurés',
                        value: 'list_channels',
                        emoji: '📋'
                    }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        } else if (value === 'name') {
            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('🏷️ Configuration Nom des Threads')
                .setDescription('Sélectionnez un format pour le nom des threads');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('autothread_name_config')
                .setPlaceholder('🏷️ Choisir format du nom')
                .addOptions([
                    {
                        label: 'Discussion - {user}',
                        description: 'Format standard avec nom utilisateur',
                        value: 'Discussion - {user}',
                        emoji: '👤'
                    },
                    {
                        label: 'Thread {user}',
                        description: 'Format simple',
                        value: 'Thread {user}',
                        emoji: '🧵'
                    },
                    {
                        label: 'Chat avec {user}',
                        description: 'Format conversationnel',
                        value: 'Chat avec {user}',
                        emoji: '💬'
                    },
                    {
                        label: 'Personnalisé',
                        description: 'Définir un format personnalisé',
                        value: 'custom',
                        emoji: '✏️'
                    }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        } else if (value === 'archive') {
            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('📦 Configuration Archive Automatique')
                .setDescription('Sélectionnez la durée avant archivage automatique');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('autothread_archive_config')
                .setPlaceholder('📦 Choisir durée archivage')
                .addOptions([
                    {
                        label: '60 minutes',
                        description: 'Archive après 1 heure',
                        value: '60',
                        emoji: '⏰'
                    },
                    {
                        label: '1440 minutes (24h)',
                        description: 'Archive après 1 jour',
                        value: '1440',
                        emoji: '📅'
                    },
                    {
                        label: '4320 minutes (3 jours)',
                        description: 'Archive après 3 jours',
                        value: '4320',
                        emoji: '📆'
                    },
                    {
                        label: '10080 minutes (7 jours)',
                        description: 'Archive après 1 semaine',
                        value: '10080',
                        emoji: '🗓️'
                    }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        } else if (value === 'slowmode') {
            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('⏱️ Configuration Mode Lent')
                .setDescription('Sélectionnez le délai entre les messages');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('autothread_slowmode_config')
                .setPlaceholder('⏱️ Choisir délai mode lent')
                .addOptions([
                    {
                        label: 'Désactivé',
                        description: 'Aucun délai entre messages',
                        value: '0',
                        emoji: '🚫'
                    },
                    {
                        label: '5 secondes',
                        description: 'Délai de 5 secondes',
                        value: '5',
                        emoji: '⏱️'
                    },
                    {
                        label: '10 secondes',
                        description: 'Délai de 10 secondes',
                        value: '10',
                        emoji: '⏰'
                    },
                    {
                        label: '30 secondes',
                        description: 'Délai de 30 secondes',
                        value: '30',
                        emoji: '⏳'
                    },
                    {
                        label: '60 secondes',
                        description: 'Délai de 1 minute',
                        value: '60',
                        emoji: '⌛'
                    }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        } else {
            await interaction.reply({
                content: `✅ Configuration ${value} mise à jour.`,
                flags: 64
            });
        }
    }

    // === AFFICHAGE CONFIGURATIONS ===

    async showActionsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('💼 Configuration Actions Économiques')
            .setDescription('Configurez toutes les actions avec karma paramétrable et récompenses automatiques')
            .addFields([
                {
                    name: '😇 Actions Positives',
                    value: '**Travailler** (+1😇 -1😈)\n**Pêcher** (+1😇 -1😈)\n**Donner** (+3😇 -2😈)',
                    inline: true
                },
                {
                    name: '😈 Actions Négatives', 
                    value: '**Voler** (-1😇 +1😈)\n**Crime** (-3😇 +3😈)\n**Parier** (-1😇 +1😈)',
                    inline: true
                },
                {
                    name: '⚖️ Système Automatique',
                    value: 'Récompenses/sanctions selon karma\nReset hebdomadaire configurable\nMultiplicateurs bonus/malus',
                    inline: false
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_action_config')
            .setPlaceholder('💼 Sélectionner une action à configurer')
            .addOptions([
                {
                    label: 'Travailler 💼',
                    description: 'Gains: 100-150€ | Karma: +1😇 | Cooldown: 1h',
                    value: 'work',
                    emoji: '💼'
                },
                {
                    label: 'Pêcher 🎣',
                    description: 'Gains variables | Karma: +1😇 | Cooldown: 1h30',
                    value: 'fish',
                    emoji: '🎣'
                },
                {
                    label: 'Donner 💝',
                    description: 'Transfert argent | Karma: +3😇 | Cooldown: 1h',
                    value: 'donate',
                    emoji: '💝'
                },
                {
                    label: 'Voler 💸',
                    description: 'Vol avec risque | Karma: +1😈 | Cooldown: 2h',
                    value: 'steal',
                    emoji: '💸'
                },
                {
                    label: 'Crime 🔫',
                    description: 'Gros gains/risques | Karma: +3😈 | Cooldown: 4h',
                    value: 'crime',
                    emoji: '🔫'
                },
                {
                    label: 'Parier 🎰',
                    description: 'Gambling 45% | Karma: +1😈 | Cooldown: 30min',
                    value: 'bet',
                    emoji: '🎰'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        if (interaction.deferred) {
            await interaction.editReply({
                embeds: [embed],
                components: components
            });
        } else {
            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        }
    }

    async showActionSettings(interaction, action) {
        const actionConfig = {
            work: {
                name: 'Travailler 💼',
                description: 'Action positive qui génère de l\'argent et du karma bon',
                settings: { minReward: 100, maxReward: 150, karmaGood: 1, karmaBad: 0, cooldown: 3600000 }
            },
            fish: {
                name: 'Pêcher 🎣',
                description: 'Action positive avec gains variables selon la chance',
                settings: { minReward: 50, maxReward: 200, karmaGood: 1, karmaBad: 0, cooldown: 5400000 }
            },
            donate: {
                name: 'Donner 💝',
                description: 'Action très positive qui transfère de l\'argent',
                settings: { minReward: 0, maxReward: 0, karmaGood: 3, karmaBad: 0, cooldown: 3600000 }
            },
            steal: {
                name: 'Voler 💸',
                description: 'Action négative avec risques et récompenses',
                settings: { minReward: 50, maxReward: 100, karmaGood: 0, karmaBad: 1, cooldown: 7200000 }
            },
            crime: {
                name: 'Crime 🔫',
                description: 'Action très négative avec gros gains mais gros risques',
                settings: { minReward: 200, maxReward: 500, karmaGood: 0, karmaBad: 3, cooldown: 14400000 }
            },
            bet: {
                name: 'Parier 🎰',
                description: 'Action négative de gambling avec 45% de chance',
                settings: { minReward: 0, maxReward: 200, karmaGood: 0, karmaBad: 1, cooldown: 1800000 }
            }
        };

        const config = actionConfig[action];
        if (!config) {
            await interaction.reply({
                content: 'Action non trouvée.',
                flags: 64
            });
            return;
        }

        const cooldownHours = Math.floor(config.settings.cooldown / 3600000);
        const cooldownMins = Math.floor((config.settings.cooldown % 3600000) / 60000);
        const cooldownText = cooldownHours > 0 ? `${cooldownHours}h${cooldownMins > 0 ? cooldownMins + 'min' : ''}` : `${cooldownMins}min`;

        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle(`⚙️ Configuration: ${config.name}`)
            .setDescription(config.description)
            .addFields([
                {
                    name: '💰 Récompenses',
                    value: config.settings.minReward === config.settings.maxReward 
                        ? `**${config.settings.minReward}€**`
                        : `**${config.settings.minReward}€** - **${config.settings.maxReward}€**`,
                    inline: true
                },
                {
                    name: '⚖️ Karma',
                    value: `😇 +${config.settings.karmaGood} | 😈 +${config.settings.karmaBad}`,
                    inline: true
                },
                {
                    name: '⏰ Cooldown',
                    value: `**${cooldownText}**`,
                    inline: true
                }
            ]);

        const buttons = [
            new ButtonBuilder()
                .setCustomId(`edit_reward_${action}`)
                .setLabel('Modifier Récompenses')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('💰'),
            new ButtonBuilder()
                .setCustomId(`edit_karma_${action}`)
                .setLabel('Modifier Karma')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⚖️'),
            new ButtonBuilder()
                .setCustomId(`edit_cooldown_${action}`)
                .setLabel('Modifier Cooldown')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⏰')
        ];

        const components = [new ActionRowBuilder().addComponents(buttons)];

        if (interaction.deferred) {
            await interaction.editReply({
                embeds: [embed],
                components: components
            });
        } else {
            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        }
    }

    async showKarmaConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('⚖️ Configuration Système Karma Avancé')
            .setDescription('Système automatique avec récompenses/sanctions et reset hebdomadaire')
            .addFields([
                {
                    name: '🏆 Niveaux et Récompenses',
                    value: '**😇 Saint** (+10+): +500€, x1.5 daily, -30% cooldown\n**😇 Bon** (+1/+9): +200€, x1.2 daily, -10% cooldown\n**😐 Neutre** (0): Aucun effet\n**😈 Mauvais** (-1/-9): -100€, x0.8 daily, +20% cooldown\n**😈 Diabolique** (-10-): -300€, x0.5 daily, +50% cooldown',
                    inline: false
                },
                {
                    name: '📅 Reset Automatique',
                    value: 'Reset chaque semaine (configurable)\nRécompenses distribuées avant reset\nTous les karma remis à 0',
                    inline: true
                },
                {
                    name: '⚙️ Actions Configurables',
                    value: 'Gains karma bon/mauvais par action\nEffets personnalisables\nActivation/désactivation par action',
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('karma_config_menu')
            .setPlaceholder('⚖️ Configurer le système karma')
            .addOptions([
                {
                    label: 'Niveaux et Récompenses',
                    description: 'Configurer les récompenses par niveau karma',
                    value: 'levels',
                    emoji: '🏆'
                },
                {
                    label: 'Reset Hebdomadaire',
                    description: 'Jour et fréquence de réinitialisation',
                    value: 'reset',
                    emoji: '📅'
                },
                {
                    label: 'Karma par Action',
                    description: 'Configurer karma gagné/perdu par action',
                    value: 'actions',
                    emoji: '⚙️'
                }
            ]);

        const resetButton = new ButtonBuilder()
            .setCustomId('karma_force_reset')
            .setLabel('Reset Immédiat')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔄');

        const components = [
            new ActionRowBuilder().addComponents(selectMenu),
            new ActionRowBuilder().addComponents(resetButton)
        ];

        if (interaction.deferred) {
            await interaction.editReply({
                embeds: [embed],
                components: components
            });
        } else {
            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        }
    }

    async showShopConfig(interaction) {
        await interaction.reply({
            content: 'Configuration boutique disponible.',
            flags: 64
        });
    }

    async showRewardsConfig(interaction) {
        await interaction.reply({
            content: 'Configuration récompenses disponible.',
            flags: 64
        });
    }

    async showChannelsConfig(interaction) {
        const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor('#2196F3')
            .setTitle('💭 Configuration Canaux Confessions')
            .setDescription('Gérez les canaux où les confessions sont envoyées');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_channels_config')
            .setPlaceholder('💭 Configurer les canaux confessions')
            .addOptions([
                {
                    label: 'Ajouter Canal',
                    description: 'Ajouter un nouveau canal de confessions',
                    value: 'add_channel',
                    emoji: '➕'
                },
                {
                    label: 'Retirer Canal',
                    description: 'Retirer un canal de confessions',
                    value: 'remove_channel',
                    emoji: '➖'
                },
                {
                    label: 'Voir Canaux',
                    description: 'Afficher tous les canaux configurés',
                    value: 'list_channels',
                    emoji: '📋'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showAutothreadConfig(interaction) {
        const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}',
                archiveTime: 1440
            };
        }

        const currentStatus = config.confessions[guildId].autoThread ? '🟢 Activé' : '🔴 Désactivé';
        const threadFormat = config.confessions[guildId].threadName || 'Confession #{number}';
        const archiveTime = config.confessions[guildId].archiveTime || 1440;
        
        const archiveDurations = {
            60: '1 heure',
            1440: '1 jour',  
            4320: '3 jours',
            10080: '7 jours'
        };

        const embed = new EmbedBuilder()
            .setColor('#2196F3')
            .setTitle('🧵 Configuration Auto-Thread Confessions')
            .setDescription('Configurez la création automatique de threads pour les confessions')
            .addFields([
                {
                    name: '📊 Status Actuel',
                    value: `**Auto-Thread :** ${currentStatus}\n**Format :** \`${threadFormat}\`\n**Archive :** ${archiveDurations[archiveTime] || `${archiveTime} minutes`}`,
                    inline: false
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_autothread_config')
            .setPlaceholder('🧵 Configurer auto-thread confessions')
            .addOptions([
                {
                    label: 'Activer/Désactiver',
                    description: `Actuellement ${config.confessions[guildId].autoThread ? 'activé' : 'désactivé'}`,
                    value: 'toggle_autothread',
                    emoji: config.confessions[guildId].autoThread ? '🔴' : '🟢'
                },
                {
                    label: 'Format Nom Threads',
                    description: `Actuel: ${threadFormat.substring(0, 40)}${threadFormat.length > 40 ? '...' : ''}`,
                    value: 'thread_name',
                    emoji: '🏷️'
                },
                {
                    label: 'Durée Archive',
                    description: `Actuel: ${archiveDurations[archiveTime] || `${archiveTime} minutes`}`,
                    value: 'archive_time',
                    emoji: '⏰'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showLogsConfig(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}',
                logLevel: 'basic',
                logImages: true
            };
        }

        const logChannel = config.confessions[guildId].logChannel;
        const logLevel = config.confessions[guildId].logLevel || 'basic';
        const logImages = config.confessions[guildId].logImages !== false;
        
        const levels = {
            'basic': '📄 Basique',
            'detailed': '📋 Détaillé', 
            'full': '🔍 Complet'
        };

        const channelName = logChannel ? 
            (interaction.guild.channels.cache.get(logChannel)?.name || 'Canal supprimé') : 
            'Aucun configuré';

        const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

        const embed = new EmbedBuilder()
            .setColor('#2196F3')
            .setTitle('📋 Configuration Logs Admin')
            .setDescription('Configurez les logs des confessions pour la modération')
            .addFields([
                {
                    name: '📊 Configuration Actuelle',
                    value: `**Canal :** ${channelName}\n**Niveau :** ${levels[logLevel]}\n**Images :** ${logImages ? '🟢 Incluses' : '🔴 Masquées'}`,
                    inline: false
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_logs_config')
            .setPlaceholder('📋 Configurer les logs admin')
            .addOptions([
                {
                    label: 'Canal Logs',
                    description: `Actuel: ${channelName.substring(0, 40)}`,
                    value: 'log_channel',
                    emoji: '📝'
                },
                {
                    label: 'Niveau de Détail',
                    description: `Actuel: ${levels[logLevel]}`,
                    value: 'log_level',
                    emoji: '🔍'
                },
                {
                    label: 'Images dans Logs',
                    description: `${logImages ? 'Désactiver' : 'Activer'} l'affichage des images`,
                    value: 'log_images',
                    emoji: logImages ? '🔴' : '🟢'
                },
                {
                    label: 'Ping Rôles Logs',
                    description: 'Rôles à mentionner dans les logs admin',
                    value: 'log_ping_roles',
                    emoji: '🔔'
                },
                {
                    label: 'Ping Rôles Confessions',
                    description: 'Rôles à mentionner lors de nouvelles confessions',
                    value: 'confession_ping_roles',
                    emoji: '📢'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    // === HANDLERS KARMA AVANCÉS ===

    async showKarmaLevelsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('🏆 Configuration Niveaux Karma')
            .setDescription('Récompenses automatiques selon le niveau de karma')
            .addFields([
                {
                    name: '😇 Saint (+10 karma+)',
                    value: '💰 +500€ | 🎁 x1.5 daily | ⏰ -30% cooldown',
                    inline: true
                },
                {
                    name: '😇 Bon (+1 à +9 karma)',
                    value: '💰 +200€ | 🎁 x1.2 daily | ⏰ -10% cooldown',
                    inline: true
                },
                {
                    name: '😐 Neutre (0 karma)',
                    value: '💰 Aucun effet | 🎁 Normal | ⏰ Normal',
                    inline: true
                },
                {
                    name: '😈 Mauvais (-1 à -9 karma)',
                    value: '💰 -100€ | 🎁 x0.8 daily | ⏰ +20% cooldown',
                    inline: true
                },
                {
                    name: '😈 Diabolique (-10 karma-)',
                    value: '💰 -300€ | 🎁 x0.5 daily | ⏰ +50% cooldown',
                    inline: true
                }
            ]);

        await interaction.reply({
            embeds: [embed],
            content: 'Configuration des récompenses par niveau disponible.',
            flags: 64
        });
    }

    async showKarmaResetConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff6b6b')
            .setTitle('📅 Configuration Reset Hebdomadaire')
            .setDescription('Paramètres de réinitialisation automatique du karma')
            .addFields([
                {
                    name: 'Jour actuel',
                    value: 'Lundi (configurable)',
                    inline: true
                },
                {
                    name: 'Prochain reset',
                    value: 'Dans 5 jours',
                    inline: true
                },
                {
                    name: 'Actions du reset',
                    value: '1. Distribution récompenses\n2. Reset karma à 0\n3. Log des statistiques',
                    inline: false
                }
            ]);

        await interaction.reply({
            embeds: [embed],
            content: 'Configuration du jour de reset disponible.',
            flags: 64
        });
    }

    async showKarmaActionsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('⚙️ Configuration Karma par Action')
            .setDescription('Paramètres karma gagnés/perdus pour chaque action économique')
            .addFields([
                {
                    name: '💼 Travailler',
                    value: '😇 +1 karma bon | 😈 -1 karma mauvais',
                    inline: true
                },
                {
                    name: '🎣 Pêcher', 
                    value: '😇 +1 karma bon | 😈 -1 karma mauvais',
                    inline: true
                },
                {
                    name: '💝 Donner',
                    value: '😇 +3 karma bon | 😈 -2 karma mauvais',
                    inline: true
                },
                {
                    name: '💸 Voler',
                    value: '😇 -1 karma bon | 😈 +1 karma mauvais',
                    inline: true
                },
                {
                    name: '🔫 Crime',
                    value: '😇 -3 karma bon | 😈 +3 karma mauvais',
                    inline: true
                },
                {
                    name: '🎰 Parier',
                    value: '😇 -1 karma bon | 😈 +1 karma mauvais',
                    inline: true
                }
            ]);

        await interaction.reply({
            embeds: [embed],
            content: 'Configuration karma par action disponible.',
            flags: 64
        });
    }

    // === HANDLERS BOUTONS ===

    async handleEditRewardSelector(interaction) {
        const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
        const action = interaction.customId.split('_')[2];
        
        const actionNames = {
            work: 'Travailler',
            fish: 'Pêcher', 
            donate: 'Donner',
            steal: 'Voler',
            crime: 'Crime',
            bet: 'Parier'
        };

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`💰 Configuration Récompenses: ${actionNames[action]}`)
            .setDescription('Sélectionnez la valeur à modifier');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`reward_value_${action}`)
            .setPlaceholder('💰 Choisir valeur à modifier')
            .addOptions([
                {
                    label: 'Montant Minimum',
                    description: 'Modifier le montant minimum (actuellement: 100€)',
                    value: 'min_reward',
                    emoji: '📉'
                },
                {
                    label: 'Montant Maximum',
                    description: 'Modifier le montant maximum (actuellement: 150€)',
                    value: 'max_reward',
                    emoji: '📈'
                },
                {
                    label: 'Bonus Karma',
                    description: 'Modifier le bonus selon karma (actuellement: 10%)',
                    value: 'karma_bonus',
                    emoji: '⚖️'
                },
                {
                    label: 'Valeurs Prédéfinies',
                    description: 'Choisir parmi des configurations prêtes',
                    value: 'presets',
                    emoji: '⚡'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.reply({
            embeds: [embed],
            components: components,
            flags: 64
        });
    }

    async handleEditKarmaSelector(interaction) {
        const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
        const action = interaction.customId.split('_')[2];
        
        const actionNames = {
            work: 'Travailler',
            fish: 'Pêcher', 
            donate: 'Donner',
            steal: 'Voler',
            crime: 'Crime',
            bet: 'Parier'
        };

        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle(`⚖️ Configuration Karma: ${actionNames[action]}`)
            .setDescription('Sélectionnez la valeur karma à modifier');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`karma_value_${action}`)
            .setPlaceholder('⚖️ Choisir valeur karma à modifier')
            .addOptions([
                {
                    label: 'Karma Bon (😇)',
                    description: 'Modifier karma bon gagné/perdu (actuellement: +1)',
                    value: 'good_karma',
                    emoji: '😇'
                },
                {
                    label: 'Karma Mauvais (😈)',
                    description: 'Modifier karma mauvais gagné/perdu (actuellement: -1)',
                    value: 'bad_karma',
                    emoji: '😈'
                },
                {
                    label: 'Multiplicateur Niveau',
                    description: 'Modifier bonus/malus selon niveau (actuellement: 50%)',
                    value: 'level_multiplier',
                    emoji: '📊'
                },
                {
                    label: 'Configurations Prêtes',
                    description: 'Actions bonnes, neutres ou mauvaises prédéfinies',
                    value: 'karma_presets',
                    emoji: '⚡'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.reply({
            embeds: [embed],
            components: components,
            flags: 64
        });
    }

    async handleEditCooldownSelector(interaction) {
        const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
        const action = interaction.customId.split('_')[2];
        
        const actionNames = {
            work: 'Travailler',
            fish: 'Pêcher', 
            donate: 'Donner',
            steal: 'Voler',
            crime: 'Crime',
            bet: 'Parier'
        };

        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle(`⏰ Configuration Cooldown: ${actionNames[action]}`)
            .setDescription('Sélectionnez la valeur cooldown à modifier');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`cooldown_value_${action}`)
            .setPlaceholder('⏰ Choisir valeur cooldown à modifier')
            .addOptions([
                {
                    label: 'Durée Cooldown',
                    description: 'Modifier durée en minutes (actuellement: 60min)',
                    value: 'cooldown_duration',
                    emoji: '⏱️'
                },
                {
                    label: 'Réduction Karma',
                    description: 'Réduction selon niveau karma (actuellement: 10%)',
                    value: 'karma_reduction',
                    emoji: '⚖️'
                },
                {
                    label: 'Type Cooldown',
                    description: 'Global ou par utilisateur (actuellement: user)',
                    value: 'cooldown_type',
                    emoji: '👥'
                },
                {
                    label: 'Durées Prédéfinies',
                    description: 'Choisir parmi des durées standard',
                    value: 'duration_presets',
                    emoji: '⚡'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.reply({
            embeds: [embed],
            components: components,
            flags: 64
        });
    }

    // Nouveaux handlers pour autothread global
    async handleAutothreadChannelsConfig(interaction) {
        const { ChannelSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
        const value = interaction.values[0];
        
        if (value === 'add_channel') {
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('➕ Ajouter Canal Auto-Thread')
                .setDescription('Sélectionnez un canal à ajouter pour l\'auto-thread global');

            const channelSelect = new ChannelSelectMenuBuilder()
                .setCustomId('autothread_add_channel')
                .setPlaceholder('📱 Sélectionnez un canal à ajouter')
                .setChannelTypes([0]); // Text channels

            const components = [new ActionRowBuilder().addComponents(channelSelect)];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        } else if (value === 'remove_channel') {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('➖ Retirer Canal Auto-Thread')
                .setDescription('Sélectionnez un canal à retirer de l\'auto-thread global');

            const channelSelect = new ChannelSelectMenuBuilder()
                .setCustomId('autothread_remove_channel')
                .setPlaceholder('📱 Sélectionnez un canal à retirer')
                .setChannelTypes([0]); // Text channels

            const components = [new ActionRowBuilder().addComponents(channelSelect)];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        } else if (value === 'list_channels') {
            const guildId = interaction.guild.id;
            const config = await this.dataManager.getData('config');
            const autoThreadConfig = config.autoThread?.[guildId] || {
                enabled: false,
                channels: [],
                threadName: 'Discussion - {user}',
                archiveTime: 60,
                slowMode: 0
            };

            let channelsList = '• Aucun canal configuré pour le moment';
            if (autoThreadConfig.channels && autoThreadConfig.channels.length > 0) {
                channelsList = autoThreadConfig.channels.map(channelId => {
                    const channel = interaction.guild.channels.cache.get(channelId);
                    return channel ? `• **#${channel.name}** (${channel.id})` : `• Canal supprimé (${channelId})`;
                }).join('\n');
            }

            const embed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('📋 Canaux Auto-Thread Configurés')
                .setDescription('Liste des canaux configurés pour l\'auto-thread global')
                .addFields([
                    {
                        name: `📱 Canaux Actifs (${autoThreadConfig.channels.length})`,
                        value: channelsList,
                        inline: false
                    },
                    {
                        name: '⚙️ Configuration',
                        value: `**Statut:** ${autoThreadConfig.enabled ? '🟢 Activé' : '🔴 Désactivé'}\n**Format:** \`${autoThreadConfig.threadName}\`\n**Archive:** ${autoThreadConfig.archiveTime} minutes`,
                        inline: false
                    },
                    {
                        name: '💡 Information',
                        value: 'Utilisez "Ajouter Canal" pour configurer l\'auto-thread sur vos canaux',
                        inline: false
                    }
                ]);

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });
        }
    }

    async handleConfessionLogsConfig(interaction) {
        const value = interaction.values[0];
        const config = await this.dataManager.getData('config');
        const guildId = interaction.guild.id;

        if (value === 'log_channel') {
            const { ChannelSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
            
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('📝 Canal Logs Admin')
                .setDescription('Sélectionnez le canal où envoyer les logs de confessions');

            const channelSelect = new ChannelSelectMenuBuilder()
                .setCustomId('confession_log_channel')
                .setPlaceholder('📝 Sélectionnez le canal logs')
                .setChannelTypes([0]); // Text channels

            const components = [new ActionRowBuilder().addComponents(channelSelect)];

            await interaction.update({
                embeds: [embed],
                components: components
            });

        } else if (value === 'log_level') {
            const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
            
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('🔍 Niveau de Détail')
                .setDescription('Choisissez le niveau d\'information dans les logs');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confession_log_level')
                .setPlaceholder('🔍 Choisir niveau de détail')
                .addOptions([
                    { label: 'Basique', description: 'Contenu et utilisateur seulement', value: 'basic', emoji: '📄' },
                    { label: 'Détaillé', description: 'Toutes les informations', value: 'detailed', emoji: '📋' },
                    { label: 'Complet', description: 'Inclut métadonnées et traces', value: 'full', emoji: '🔍' }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.update({
                embeds: [embed],
                components: components
            });

        } else if (value === 'log_images') {
            if (!config.confessions) config.confessions = {};
            if (!config.confessions[guildId]) config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}',
                logImages: true
            };

            config.confessions[guildId].logImages = !config.confessions[guildId].logImages;
            await this.dataManager.saveData('config', config);

            const status = config.confessions[guildId].logImages ? '🟢 Activé' : '🔴 Désactivé';
            await interaction.update({
                content: `🖼️ Images dans logs : ${status}`,
                components: []
            });
        }
    }

    async handleConfessionLogLevel(interaction) {
        const value = interaction.values[0];
        const config = await this.dataManager.getData('config');
        const guildId = interaction.guild.id;

        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}',
                logLevel: 'basic'
            };
        }

        config.confessions[guildId].logLevel = value;
        await this.dataManager.saveData('config', config);

        const levels = {
            'basic': '📄 Basique - Contenu et utilisateur seulement',
            'detailed': '📋 Détaillé - Toutes les informations',
            'full': '🔍 Complet - Inclut métadonnées et traces'
        };

        await interaction.update({
            content: `✅ Niveau de détail mis à jour: ${levels[value]}`,
            components: []
        });
    }

    async handleAutothreadNameConfig(interaction) {
        const value = interaction.values[0];
        
        if (value === 'custom') {
            await interaction.reply({
                content: '✏️ Format personnalisé configuré. Variables disponibles: {user}, {channel}, {date}',
                flags: 64
            });
        } else {
            await interaction.reply({
                content: `✅ Format de nom mis à jour: "${value}"`,
                flags: 64
            });
        }
    }

    async handleAutothreadArchiveConfig(interaction) {
        const value = interaction.values[0];
        const timeLabels = {
            '60': '1 heure',
            '1440': '24 heures',
            '4320': '3 jours',
            '10080': '7 jours'
        };
        
        await interaction.reply({
            content: `✅ Archive automatique configurée: ${timeLabels[value] || value + ' minutes'}`,
            flags: 64
        });
    }

    async handleAutothreadSlowmodeConfig(interaction) {
        const value = interaction.values[0];
        
        if (value === '0') {
            await interaction.reply({
                content: '✅ Mode lent désactivé.',
                flags: 64
            });
        } else {
            await interaction.reply({
                content: `✅ Mode lent configuré: ${value} secondes entre les messages.`,
                flags: 64
            });
        }
    }

    // Nouveaux handlers pour boutons actions (compatibilité)
    async handleEditRewardButton(interaction) {
        const action = interaction.customId.split('_')[2];
        // Defer l'interaction d'abord pour éviter l'erreur timeout
        await interaction.deferReply({ flags: 64 });
        
        // Créer une interaction simulée pour les handlers de sélecteurs
        const mockInteraction = {
            ...interaction,
            customId: `edit_reward_${action}`,
            values: ['menu'],
            reply: async (options) => {
                return await interaction.editReply(options);
            }
        };
        
        await this.handleEditRewardSelector(mockInteraction);
    }

    async handleEditKarmaButton(interaction) {
        const action = interaction.customId.split('_')[2];
        await interaction.deferReply({ flags: 64 });
        
        const mockInteraction = {
            ...interaction,
            customId: `edit_karma_${action}`,
            values: ['menu'],
            reply: async (options) => {
                return await interaction.editReply(options);
            }
        };
        
        await this.handleEditKarmaSelector(mockInteraction);
    }

    async handleEditCooldownButton(interaction) {
        const action = interaction.customId.split('_')[2];
        await interaction.deferReply({ flags: 64 });
        
        const mockInteraction = {
            ...interaction,
            customId: `edit_cooldown_${action}`,
            values: ['menu'],
            reply: async (options) => {
                return await interaction.editReply(options);
            }
        };
        
        await this.handleEditCooldownSelector(mockInteraction);
    }

    // Nouveaux handlers pour config-confession
    async handleConfessionChannelsConfig(interaction) {
        const { ChannelSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
        const value = interaction.values[0];
        
        if (value === 'add_channel') {
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('➕ Ajouter Canal Confessions')
                .setDescription('Sélectionnez un canal pour recevoir les confessions anonymes');

            const channelSelect = new ChannelSelectMenuBuilder()
                .setCustomId('confession_add_channel')
                .setPlaceholder('💭 Sélectionnez un canal confessions')
                .setChannelTypes([0]); // Text channels

            const components = [new ActionRowBuilder().addComponents(channelSelect)];

            await interaction.update({
                embeds: [embed],
                components: components
            });
        } else if (value === 'remove_channel') {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('➖ Retirer Canal Confessions')
                .setDescription('Sélectionnez un canal à retirer des confessions');

            const channelSelect = new ChannelSelectMenuBuilder()
                .setCustomId('confession_remove_channel')
                .setPlaceholder('💭 Canal à retirer')
                .setChannelTypes([0]); // Text channels

            const components = [new ActionRowBuilder().addComponents(channelSelect)];

            await interaction.update({
                embeds: [embed],
                components: components
            });
        } else if (value === 'list_channels') {
            await this.handleConfessionChannels(interaction);
        }
    }

    async handleConfessionAutothreadConfig(interaction) {
        const value = interaction.values[0];
        const dataManager = require('../managers/DataManager');
        const config = await dataManager.getData('config');
        const guildId = interaction.guild.id;

        if (value === 'toggle_autothread') {
            if (!config.confessions) config.confessions = {};
            if (!config.confessions[guildId]) config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}'
            };

            config.confessions[guildId].autoThread = !config.confessions[guildId].autoThread;
            await dataManager.saveData('config', config);

            const status = config.confessions[guildId].autoThread ? '🟢 Activé' : '🔴 Désactivé';
            await interaction.update({
                content: `🧵 Auto-thread confessions : ${status}`,
                components: []
            });

        } else if (value === 'thread_name') {
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
            
            const modal = new ModalBuilder()
                .setCustomId('confession_thread_name_modal')
                .setTitle('🏷️ Format Nom Thread');

            const nameInput = new TextInputBuilder()
                .setCustomId('thread_name_input')
                .setLabel('Format du nom des threads')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: Confession #{number} ou Discussion - {date}')
                .setValue(config.confessions?.[guildId]?.threadName || 'Confession #{number}')
                .setRequired(true)
                .setMaxLength(100);

            const row = new ActionRowBuilder().addComponents(nameInput);
            modal.addComponents(row);

            await interaction.showModal(modal);

        } else if (value === 'archive_time') {
            const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
            
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('📦 Archive Automatique')
                .setDescription('Choisissez la durée avant archivage automatique des threads');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confession_archive_time')
                .setPlaceholder('📦 Choisir durée archivage')
                .addOptions([
                    { label: '1 heure', value: '60', emoji: '⏰' },
                    { label: '24 heures', value: '1440', emoji: '📅' },
                    { label: '3 jours', value: '4320', emoji: '🗓️' },
                    { label: '7 jours', value: '10080', emoji: '📆' }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        }
    }

    async handleConfessionAutothreadConfig(interaction) {
        const value = interaction.values[0];
        
        if (value === 'toggle_autothread') {
            await interaction.reply({
                content: '🔄 Auto-thread confessions activé/désactivé.',
                flags: 64
            });
        } else if (value === 'thread_name') {
            await interaction.reply({
                content: '🏷️ Format du nom des threads configuré.',
                flags: 64
            });
        } else if (value === 'archive_time') {
            await interaction.reply({
                content: '📦 Durée d\'archivage automatique configurée.',
                flags: 64
            });
        } else if (value === 'private_mode') {
            await interaction.reply({
                content: '🔐 Mode privé des threads configuré.',
                flags: 64
            });
        }
    }

    // Handler délégué au ConfessionHandler

    // Handlers pour channel selects
    async handleAutothreadAddChannel(interaction) {
        const channelId = interaction.values[0];
        const channel = interaction.guild.channels.cache.get(channelId);
        const guildId = interaction.guild.id;
        
        // Charger configuration actuelle
        const config = await this.dataManager.getData('config');
        if (!config.autoThread) config.autoThread = {};
        if (!config.autoThread[guildId]) {
            config.autoThread[guildId] = {
                enabled: false,
                channels: [],
                threadName: 'Discussion - {user}',
                archiveTime: 60,
                slowMode: 0
            };
        }
        
        // Ajouter canal s'il n'existe pas déjà
        if (!config.autoThread[guildId].channels.includes(channelId)) {
            config.autoThread[guildId].channels.push(channelId);
            await this.dataManager.saveData('config', config);
        }
        
        await interaction.reply({
            content: `✅ Canal **${channel.name}** ajouté à l'auto-thread global !\n\n📊 **${config.autoThread[guildId].channels.length}** canaux configurés au total.`,
            flags: 64
        });
    }

    async handleAutothreadRemoveChannel(interaction) {
        const channelId = interaction.values[0];
        const channel = interaction.guild.channels.cache.get(channelId);
        const guildId = interaction.guild.id;
        
        // Charger configuration actuelle
        const config = await this.dataManager.getData('config');
        if (!config.autoThread) config.autoThread = {};
        if (!config.autoThread[guildId]) {
            config.autoThread[guildId] = {
                enabled: false,
                channels: [],
                threadName: 'Discussion - {user}',
                archiveTime: 60,
                slowMode: 0
            };
        }
        
        // Retirer canal s'il existe
        const index = config.autoThread[guildId].channels.indexOf(channelId);
        if (index > -1) {
            config.autoThread[guildId].channels.splice(index, 1);
            await this.dataManager.saveData('config', config);
        }
        
        await interaction.reply({
            content: `❌ Canal **${channel.name}** retiré de l'auto-thread global !\n\n📊 **${config.autoThread[guildId].channels.length}** canaux configurés restants.`,
            flags: 64
        });
    }

    async handleConfessionAddChannel(interaction) {
        const channelId = interaction.values[0];
        const channel = interaction.guild.channels.cache.get(channelId);
        const guildId = interaction.guild.id;
        
        // Charger configuration actuelle
        const config = await this.dataManager.getData('config');
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}'
            };
        }
        
        // Ajouter canal s'il n'existe pas déjà
        if (!config.confessions[guildId].channels.includes(channelId)) {
            config.confessions[guildId].channels.push(channelId);
            await this.dataManager.saveData('config', config);
        }
        
        await interaction.reply({
            content: `✅ Canal **${channel.name}** ajouté aux canaux confessions !\n\n📊 **${config.confessions[guildId].channels.length}** canaux configurés au total.`,
            flags: 64
        });
    }

    async handleConfessionRemoveChannel(interaction) {
        const channelId = interaction.values[0];
        const channel = interaction.guild.channels.cache.get(channelId);
        const guildId = interaction.guild.id;
        
        // Charger configuration actuelle
        const config = await this.dataManager.getData('config');
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}'
            };
        }
        
        // Retirer canal s'il existe
        const index = config.confessions[guildId].channels.indexOf(channelId);
        if (index > -1) {
            config.confessions[guildId].channels.splice(index, 1);
            await this.dataManager.saveData('config', config);
        }
        
        await interaction.reply({
            content: `❌ Canal **${channel.name}** retiré des canaux confessions !\n\n📊 **${config.confessions[guildId].channels.length}** canaux configurés restants.`,
            flags: 64
        });
    }

    async handleConfessionMainChannel(interaction) {
        const channelId = interaction.values[0];
        const channel = interaction.guild.channels.cache.get(channelId);
        
        await interaction.reply({
            content: `🎯 Canal **${channel.name}** défini comme canal principal pour les confessions !`,
            flags: 64
        });
    }

    async handleAutothreadToggleStatus(interaction) {
        const value = interaction.values[0];
        const guildId = interaction.guild.id;
        
        // Charger configuration actuelle
        const config = await this.dataManager.getData('config');
        if (!config.autoThread) config.autoThread = {};
        if (!config.autoThread[guildId]) {
            config.autoThread[guildId] = {
                enabled: false,
                channels: [],
                threadName: 'Discussion - {user}',
                archiveTime: 60,
                slowMode: 0
            };
        }
        
        // Mettre à jour le statut
        const newStatus = value === 'enable';
        config.autoThread[guildId].enabled = newStatus;
        await this.dataManager.saveData('config', config);
        
        const channelCount = config.autoThread[guildId].channels.length;
        
        if (value === 'enable') {
            await interaction.reply({
                content: `✅ **Système auto-thread activé !**\n\nTous les messages dans les **${channelCount}** canaux configurés créeront automatiquement des threads.`,
                flags: 64
            });
        } else if (value === 'disable') {
            await interaction.reply({
                content: `❌ **Système auto-thread désactivé !**\n\nAucun thread ne sera créé automatiquement sur les **${channelCount}** canaux configurés.`,
                flags: 64
            });
        }
    }

    async handleBackToMain(interaction) {
        await interaction.reply({
            content: 'Retour au menu principal.',
            flags: 64
        });
    }

    async handleBackToActions(interaction) {
        await this.showActionsConfig(interaction);
    }

    async handleKarmaForceReset(interaction) {
        await interaction.reply({
            content: '🔄 Reset karma forcé disponible.\n\nCette action va :\n• Distribuer les récompenses actuelles\n• Remettre tous les karma à 0\n• Logger l\'action dans les statistiques',
            flags: 64
        });
    }

    async handleToggleMessageRewards(interaction) {
        await interaction.reply({
            content: 'Toggle récompenses messages disponible.',
            flags: 64
        });
    }

    // Handler pour configeconomie menus
    async handleEconomyMainConfig(interaction) {
        const value = interaction.values[0];
        const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

        if (value === 'actions') {
            const embed = new EmbedBuilder()
                .setColor('#9932cc')
                .setTitle('💼 Actions Économiques')
                .setDescription('Configurez les 6 actions économiques disponibles');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('economy_actions_config')
                .setPlaceholder('💼 Choisir une action à configurer')
                .addOptions([
                    { label: 'Travailler', description: 'Configuration action travail (+😇)', value: 'travailler', emoji: '💼' },
                    { label: 'Pêcher', description: 'Configuration action pêche (+😇)', value: 'pecher', emoji: '🎣' },
                    { label: 'Donner', description: 'Configuration don argent (+😇)', value: 'donner', emoji: '💝' },
                    { label: 'Voler', description: 'Configuration vol argent (+😈)', value: 'voler', emoji: '🥷' },
                    { label: 'Crime', description: 'Configuration crime (+😈)', value: 'crime', emoji: '🔫' },
                    { label: 'Parier', description: 'Configuration pari argent (+😈)', value: 'parier', emoji: '🎲' }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];
            await interaction.reply({ embeds: [embed], components: components, flags: 64 });

        } else if (value === 'shop') {
            await interaction.reply({ content: '🛒 Configuration boutique disponible prochainement', flags: 64 });
        } else if (value === 'karma') {
            await interaction.reply({ content: '⚖️ Configuration karma disponible prochainement', flags: 64 });
        } else if (value === 'daily') {
            await interaction.reply({ content: '🎁 Configuration daily disponible prochainement', flags: 64 });
        } else if (value === 'messages') {
            await interaction.reply({ content: '💬 Configuration messages disponible prochainement', flags: 64 });
        } else if (value === 'stats') {
            await this.showEconomyStats(interaction);
        }
    }

    async showEconomyStats(interaction) {
        const dataManager = require('../managers/DataManager');
        const users = await dataManager.getData('users');
        const guildUsers = Object.values(users).filter(user => user.guildId === interaction.guild.id);
        const totalUsers = guildUsers.length;
        const totalMoney = guildUsers.reduce((sum, user) => sum + (user.money || 0), 0);

        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('📊 Statistiques Économiques')
            .addFields([
                { name: '👥 Utilisateurs', value: `**Total:** ${totalUsers}`, inline: true },
                { name: '💰 Total Argent', value: `${totalMoney}€`, inline: true },
                { name: '⚖️ Karma Saints', value: `${guildUsers.filter(u => (u.goodKarma || 0) > (u.badKarma || 0)).length}`, inline: true }
            ]);

        await interaction.reply({ embeds: [embed], flags: 64 });
    }

    async handleConfessionLogChannel(interaction) {
        const channelId = interaction.values[0];
        const channel = interaction.guild.channels.cache.get(channelId);
        const guildId = interaction.guild.id;
        
        // Charger configuration actuelle
        const config = await this.dataManager.getData('config');
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}'
            };
        }
        
        // Sauvegarder canal logs
        config.confessions[guildId].logChannel = channelId;
        await this.dataManager.saveData('config', config);
        
        await interaction.reply({
            content: `✅ Canal logs configuré : **${channel.name}**\n\nLes confessions seront automatiquement loggées ici avec les détails utilisateur.`,
            flags: 64
        });
    }

    async handleConfessionArchiveTime(interaction) {
        const archiveTime = parseInt(interaction.values[0]);
        const config = await this.dataManager.getData('config');
        const guildId = interaction.guild.id;

        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}',
                archiveTime: 1440
            };
        }

        config.confessions[guildId].archiveTime = archiveTime;
        await this.dataManager.saveData('config', config);

        const durations = {
            60: '1 heure',
            1440: '24 heures (1 jour)',
            4320: '3 jours',
            10080: '7 jours (1 semaine)'
        };

        await interaction.reply({
            content: `📦 Durée d'archivage configurée : **${durations[archiveTime]}**\n\nLes threads seront archivés automatiquement après cette durée d'inactivité.`,
            flags: 64
        });
    }

    async handleToggleConfessionAutothread(interaction) {
        const config = await this.dataManager.getData('config');
        const guildId = interaction.guild.id;

        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}',
                archiveTime: 1440
            };
        }

        // Toggle l'état
        config.confessions[guildId].autoThread = !config.confessions[guildId].autoThread;
        await this.dataManager.saveData('config', config);

        const status = config.confessions[guildId].autoThread ? '🟢 Activé' : '🔴 Désactivé';
        const description = config.confessions[guildId].autoThread 
            ? 'Les confessions créeront maintenant automatiquement des threads avec le format configuré.'
            : 'Les confessions n\'utiliseront plus les threads automatiques.';

        await interaction.reply({
            content: `🧵 **Auto-Thread Confessions ${status}**\n\n${description}`,
            flags: 64
        });
    }

    async handleConfessionThreadFormat(interaction) {
        const format = interaction.values[0];
        const config = await this.dataManager.getData('config');
        const guildId = interaction.guild.id;

        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}',
                archiveTime: 1440
            };
        }

        config.confessions[guildId].threadName = format;
        await this.dataManager.saveData('config', config);

        const examples = {
            'Confession #{number}': 'Confession #1, Confession #2...',
            'Confession #{number} - {date}': 'Confession #1 - 20/07/2025',
            'Thread Confession {date}': 'Thread Confession 20/07/2025',
            'Confession Anonyme #{number}': 'Confession Anonyme #1'
        };

        await interaction.reply({
            content: `🏷️ **Format nom configuré :** \`${format}\`\n\n**Exemple :** ${examples[format] || format}\n\nLes nouveaux threads utiliseront ce format.`,
            flags: 64
        });
    }

    async handleConfessionAutothreadConfig(interaction) {
        const value = interaction.values[0];
        const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

        if (value === 'toggle_autothread') {
            // Bouton toggle pour activer/désactiver
            const { ButtonBuilder, ButtonStyle } = require('discord.js');
            
            const config = await this.dataManager.getData('config');
            const guildId = interaction.guild.id;
            const currentStatus = config.confessions?.[guildId]?.autoThread || false;
            
            const button = new ButtonBuilder()
                .setCustomId('toggle_confession_autothread')
                .setLabel(currentStatus ? 'Désactiver Auto-Thread' : 'Activer Auto-Thread')
                .setStyle(currentStatus ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji(currentStatus ? '🔴' : '🟢');

            const embed = new EmbedBuilder()
                .setColor(currentStatus ? '#f44336' : '#4caf50')
                .setTitle('🧵 Toggle Auto-Thread Confessions')
                .setDescription(`Status actuel : ${currentStatus ? '🟢 **Activé**' : '🔴 **Désactivé**'}`)
                .addFields({
                    name: 'Action',
                    value: `Cliquez pour ${currentStatus ? 'désactiver' : 'activer'} les threads automatiques`,
                    inline: false
                });

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(button)],
                flags: 64
            });

        } else if (value === 'thread_name') {
            // Sélecteur pour format nom
            const config = await this.dataManager.getData('config');
            const guildId = interaction.guild.id;
            const currentFormat = config.confessions?.[guildId]?.threadName || 'Confession #{number}';
            
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('🏷️ Format Nom des Threads')
                .setDescription('Choisissez le format pour les noms des threads de confessions')
                .addFields({
                    name: 'Format actuel',
                    value: `\`${currentFormat}\``,
                    inline: false
                });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confession_thread_format')
                .setPlaceholder('🏷️ Choisir format nom thread')
                .addOptions([
                    {
                        label: 'Confession #{number}',
                        description: 'Format simple avec numéro',
                        value: 'Confession #{number}',
                        emoji: '📝'
                    },
                    {
                        label: 'Confession #{number} - {date}',
                        description: 'Numéro avec date du jour',
                        value: 'Confession #{number} - {date}',
                        emoji: '📅'
                    },
                    {
                        label: 'Thread Confession {date}',
                        description: 'Format avec date seulement',
                        value: 'Thread Confession {date}',
                        emoji: '🗓️'
                    },
                    {
                        label: 'Confession Anonyme #{number}',
                        description: 'Format anonyme avec numéro',
                        value: 'Confession Anonyme #{number}',
                        emoji: '🔒'
                    }
                ]);

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(selectMenu)],
                flags: 64
            });

        } else if (value === 'archive_time') {
            // Sélecteur pour durée archive
            const config = await this.dataManager.getData('config');
            const guildId = interaction.guild.id;
            const currentTime = config.confessions?.[guildId]?.archiveTime || 1440;
            
            const durations = {
                60: '1 heure',
                1440: '1 jour',  
                4320: '3 jours',
                10080: '7 jours'
            };

            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('📦 Durée Archive Automatique')
                .setDescription('Configurez la durée avant archivage automatique des threads')
                .addFields({
                    name: 'Durée actuelle',
                    value: `${durations[currentTime] || `${currentTime} minutes`}`,
                    inline: false
                });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confession_archive_time')
                .setPlaceholder('📦 Choisir durée archive')
                .addOptions([
                    {
                        label: '1 heure',
                        description: 'Archive après 1 heure',
                        value: '60',
                        emoji: '⏰'
                    },
                    {
                        label: '1 jour',
                        description: 'Archive après 24 heures',
                        value: '1440',
                        emoji: '📅'
                    },
                    {
                        label: '3 jours',
                        description: 'Archive après 3 jours',
                        value: '4320',
                        emoji: '🗓️'
                    },
                    {
                        label: '7 jours',
                        description: 'Archive après 1 semaine',
                        value: '10080',
                        emoji: '📋'
                    }
                ]);

            await interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(selectMenu)],
                flags: 64
            });
        }
    }


}

module.exports = InteractionHandler;
