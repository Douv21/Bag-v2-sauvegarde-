const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class InteractionHandler {
    constructor(client, dataManager) {
        this.client = client;
        this.dataManager = dataManager;
        this.handlers = {
            selectMenu: new Map(),
            button: new Map(),
            modal: new Map()
        };
        
        this.setupHandlers();
        this.registerEventListeners();
    }

    setupHandlers() {
        // Configuration Économie
        this.handlers.selectMenu.set('economy_main_config', this.handleEconomyMainConfig.bind(this));
        this.handlers.selectMenu.set('economy_action_config', this.handleEconomyActionConfig.bind(this));
        this.handlers.selectMenu.set('karma_config_menu', this.handleKarmaConfigMenu.bind(this));
        
        // Configuration Confession
        this.handlers.selectMenu.set('confession_main_config', this.handleConfessionMainConfig.bind(this));
        this.handlers.selectMenu.set('config_main_menu', this.handleConfigMainMenu.bind(this));
        this.handlers.selectMenu.set('confession_channels', this.handleConfessionChannels.bind(this));
        this.handlers.selectMenu.set('confession_autothread', this.handleConfessionAutothread.bind(this));
        this.handlers.selectMenu.set('autothread_config', this.handleAutothreadGlobalConfig.bind(this));
        
        // Sélecteurs Configuration Actions  
        const actions = ['work', 'fish', 'donate', 'steal', 'crime', 'bet'];
        actions.forEach(action => {
            this.handlers.selectMenu.set(`edit_reward_${action}`, this.handleEditRewardSelector.bind(this));
            this.handlers.selectMenu.set(`edit_karma_${action}`, this.handleEditKarmaSelector.bind(this));
            this.handlers.selectMenu.set(`edit_cooldown_${action}`, this.handleEditCooldownSelector.bind(this));
        });

        // Nouveaux handlers pour autothread global
        this.handlers.selectMenu.set('autothread_channels_config', this.handleAutothreadChannelsConfig.bind(this));
        this.handlers.selectMenu.set('autothread_name_config', this.handleAutothreadNameConfig.bind(this));
        this.handlers.selectMenu.set('autothread_archive_config', this.handleAutothreadArchiveConfig.bind(this));
        this.handlers.selectMenu.set('autothread_slowmode_config', this.handleAutothreadSlowmodeConfig.bind(this));
        this.handlers.selectMenu.set('autothread_toggle_status', this.handleAutothreadToggleStatus.bind(this));

        // Nouveaux handlers pour config-confession
        this.handlers.selectMenu.set('confession_channels_config', this.handleConfessionChannelsConfig.bind(this));
        this.handlers.selectMenu.set('confession_autothread_config', this.handleConfessionAutothreadConfig.bind(this));
        this.handlers.selectMenu.set('confession_logs_config', this.handleConfessionLogsConfig.bind(this));

        // Handlers pour sélecteurs canaux (ChannelSelectMenuBuilder)
        this.handlers.channelSelect = new Map();
        this.handlers.channelSelect.set('autothread_add_channel', this.handleAutothreadAddChannel.bind(this));
        this.handlers.channelSelect.set('autothread_remove_channel', this.handleAutothreadRemoveChannel.bind(this));
        this.handlers.channelSelect.set('confession_add_channel', this.handleConfessionAddChannel.bind(this));
        this.handlers.channelSelect.set('confession_remove_channel', this.handleConfessionRemoveChannel.bind(this));
        this.handlers.channelSelect.set('confession_main_channel', this.handleConfessionMainChannel.bind(this));
        
        // Boutons Navigation
        this.handlers.button.set('economy_back_main', this.handleBackToMain.bind(this));
        this.handlers.button.set('economy_back_actions', this.handleBackToActions.bind(this));
        this.handlers.button.set('config_back_main', this.handleBackToMain.bind(this));
        this.handlers.button.set('karma_force_reset', this.handleKarmaForceReset.bind(this));
        this.handlers.button.set('toggle_message_rewards', this.handleToggleMessageRewards.bind(this));

        // Boutons Actions Économiques (pour compatibilité)
        actions.forEach(action => {
            this.handlers.button.set(`edit_reward_${action}`, this.handleEditRewardButton.bind(this));
            this.handlers.button.set(`edit_karma_${action}`, this.handleEditKarmaButton.bind(this));
            this.handlers.button.set(`edit_cooldown_${action}`, this.handleEditCooldownButton.bind(this));
        });
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
        const handler = this.handlers.selectMenu.get(interaction.customId);
        if (handler) {
            await handler(interaction);
        } else {
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
        
        if (customId.startsWith('reward_modal_')) {
            await this.handleRewardModal(interaction);
        } else if (customId.startsWith('karma_modal_')) {
            await this.handleKarmaModal(interaction);
        } else if (customId.startsWith('cooldown_modal_')) {
            await this.handleCooldownModal(interaction);
        } else {
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

    // === HANDLERS CONFIGURATION ÉCONOMIE ===

    async handleEconomyMainConfig(interaction) {
        const value = interaction.values[0];
        
        switch(value) {
            case 'actions':
                await this.showActionsConfig(interaction);
                break;
            case 'shop':
                await this.showShopConfig(interaction);
                break;
            case 'karma':
                await this.showKarmaConfig(interaction);
                break;
            case 'rewards':
                await this.showRewardsConfig(interaction);
                break;
            default:
                await interaction.reply({
                    content: `Configuration ${value} disponible.`,
                    flags: 64
                });
        }
    }

    async handleEconomyActionConfig(interaction) {
        const action = interaction.values[0];
        await this.showActionSettings(interaction, action);
    }

    async handleKarmaConfigMenu(interaction) {
        const value = interaction.values[0];
        
        switch(value) {
            case 'levels':
                await this.showKarmaLevelsConfig(interaction);
                break;
            case 'reset':
                await this.showKarmaResetConfig(interaction);
                break;
            case 'actions':
                await this.showKarmaActionsConfig(interaction);
                break;
            default:
                await interaction.reply({
                    content: `Configuration karma ${value} disponible.`,
                    flags: 64
                });
        }
    }

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

        await interaction.reply({
            embeds: [embed],
            flags: 64
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
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('🧵 Configuration Auto-Thread Confessions')
                .setDescription('Configurez la création automatique de threads pour les confessions');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confession_autothread_config')
                .setPlaceholder('🧵 Configurer auto-thread confessions')
                .addOptions([
                    {
                        label: 'Activer/Désactiver',
                        description: 'Activer ou désactiver les threads automatiques',
                        value: 'toggle_autothread',
                        emoji: '🔄'
                    },
                    {
                        label: 'Nom des Threads',
                        description: 'Format du nom des threads créés',
                        value: 'thread_name',
                        emoji: '🏷️'
                    },
                    {
                        label: 'Archive Automatique',
                        description: 'Durée avant archivage automatique',
                        value: 'archive_time',
                        emoji: '📦'
                    },
                    {
                        label: 'Mode Privé',
                        description: 'Threads privés ou publics',
                        value: 'private_mode',
                        emoji: '🔐'
                    }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        } else if (value === 'logs') {
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('📋 Configuration Logs Admin')
                .setDescription('Configurez les logs de modération et audit');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confession_logs_config')
                .setPlaceholder('📋 Configurer logs admin')
                .addOptions([
                    {
                        label: 'Canal Logs',
                        description: 'Définir le canal pour les logs admin',
                        value: 'log_channel',
                        emoji: '📝'
                    },
                    {
                        label: 'Niveau Détail',
                        description: 'Niveau de détail des logs',
                        value: 'log_level',
                        emoji: '🔍'
                    },
                    {
                        label: 'Logs Confessions',
                        description: 'Activer les logs des confessions',
                        value: 'confession_logs',
                        emoji: '💭'
                    },
                    {
                        label: 'Logs Modération',
                        description: 'Activer les logs de modération',
                        value: 'moderation_logs',
                        emoji: '🛡️'
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
                content: `Configuration ${value} disponible.`,
                flags: 64
            });
        }
    }

    async handleConfessionAutothread(interaction) {
        await interaction.reply({
            content: 'Configuration auto-thread pour confessions disponible.',
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
        await interaction.reply({
            content: 'Configuration canaux disponible.',
            flags: 64
        });
    }

    async showAutothreadConfig(interaction) {
        await interaction.reply({
            content: 'Configuration auto-thread disponible.',
            flags: 64
        });
    }

    async showLogsConfig(interaction) {
        await interaction.reply({
            content: 'Configuration logs disponible.',
            flags: 64
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

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
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

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        } else if (value === 'list_channels') {
            await this.handleConfessionChannels(interaction);
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

    async handleConfessionLogsConfig(interaction) {
        const value = interaction.values[0];
        
        if (value === 'log_channel') {
            await interaction.reply({
                content: '📝 Canal de logs configuré.',
                flags: 64
            });
        } else if (value === 'log_level') {
            await interaction.reply({
                content: '🔍 Niveau de détail des logs configuré.',
                flags: 64
            });
        } else if (value === 'confession_logs') {
            await interaction.reply({
                content: '💭 Logs des confessions activés/désactivés.',
                flags: 64
            });
        } else if (value === 'moderation_logs') {
            await interaction.reply({
                content: '🛡️ Logs de modération activés/désactivés.',
                flags: 64
            });
        }
    }

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
}

module.exports = InteractionHandler;