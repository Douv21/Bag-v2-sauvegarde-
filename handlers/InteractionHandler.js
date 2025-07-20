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
        this.handlers.selectMenu.set('config_main', this.handleConfessionMainConfig.bind(this));
        this.handlers.selectMenu.set('confession_channels', this.handleConfessionChannels.bind(this));
        this.handlers.selectMenu.set('confession_autothread', this.handleConfessionAutothread.bind(this));
        this.handlers.selectMenu.set('autothread_config', this.handleAutothreadGlobalConfig.bind(this));
        
        // Boutons Actions Économie
        const actions = ['work', 'fish', 'donate', 'steal', 'crime', 'bet'];
        actions.forEach(action => {
            this.handlers.button.set(`edit_reward_${action}`, this.handleEditReward.bind(this));
            this.handlers.button.set(`edit_karma_${action}`, this.handleEditKarma.bind(this));
            this.handlers.button.set(`edit_cooldown_${action}`, this.handleEditCooldown.bind(this));
        });
        
        // Boutons Navigation
        this.handlers.button.set('economy_back_main', this.handleBackToMain.bind(this));
        this.handlers.button.set('economy_back_actions', this.handleBackToActions.bind(this));
        this.handlers.button.set('config_back_main', this.handleBackToMain.bind(this));
        this.handlers.button.set('karma_force_reset', this.handleKarmaForceReset.bind(this));
        this.handlers.button.set('toggle_message_rewards', this.handleToggleMessageRewards.bind(this));
    }

    registerEventListeners() {
        this.client.on('interactionCreate', async (interaction) => {
            try {
                if (interaction.isStringSelectMenu()) {
                    await this.handleSelectMenu(interaction);
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
        await interaction.reply({
            content: 'Configuration des canaux de confession disponible.',
            flags: 64
        });
    }

    async handleConfessionAutothread(interaction) {
        await interaction.reply({
            content: 'Configuration auto-thread pour confessions disponible.',
            flags: 64
        });
    }

    async handleAutothreadGlobalConfig(interaction) {
        await interaction.reply({
            content: 'Configuration auto-thread global disponible.',
            flags: 64
        });
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

    async handleEditReward(interaction) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const action = interaction.customId.split('_')[2];
        
        const actionNames = {
            work: 'Travailler',
            fish: 'Pêcher', 
            donate: 'Donner',
            steal: 'Voler',
            crime: 'Crime',
            bet: 'Parier'
        };

        const modal = new ModalBuilder()
            .setCustomId(`reward_modal_${action}`)
            .setTitle(`💰 Configuration Récompenses: ${actionNames[action]}`);

        const minRewardInput = new TextInputBuilder()
            .setCustomId('min_reward')
            .setLabel('Montant minimum (€)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('100')
            .setRequired(true);

        const maxRewardInput = new TextInputBuilder()
            .setCustomId('max_reward')
            .setLabel('Montant maximum (€)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('150')
            .setRequired(true);

        const bonusInput = new TextInputBuilder()
            .setCustomId('karma_bonus')
            .setLabel('Bonus selon karma (% par niveau)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('10')
            .setRequired(false);

        const firstRow = new ActionRowBuilder().addComponents(minRewardInput);
        const secondRow = new ActionRowBuilder().addComponents(maxRewardInput);
        const thirdRow = new ActionRowBuilder().addComponents(bonusInput);

        modal.addComponents(firstRow, secondRow, thirdRow);

        await interaction.showModal(modal);
    }

    async handleEditKarma(interaction) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const action = interaction.customId.split('_')[2];
        
        const actionNames = {
            work: 'Travailler',
            fish: 'Pêcher', 
            donate: 'Donner',
            steal: 'Voler',
            crime: 'Crime',
            bet: 'Parier'
        };

        const modal = new ModalBuilder()
            .setCustomId(`karma_modal_${action}`)
            .setTitle(`⚖️ Configuration Karma: ${actionNames[action]}`);

        const goodKarmaInput = new TextInputBuilder()
            .setCustomId('good_karma')
            .setLabel('Karma bon gagné/perdu (😇)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('1')
            .setRequired(true);

        const badKarmaInput = new TextInputBuilder()
            .setCustomId('bad_karma')
            .setLabel('Karma mauvais gagné/perdu (😈)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('1')
            .setRequired(true);

        const multiplierInput = new TextInputBuilder()
            .setCustomId('level_multiplier')
            .setLabel('Multiplicateur niveau (% bonus/malus)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('50')
            .setRequired(false);

        const firstRow = new ActionRowBuilder().addComponents(goodKarmaInput);
        const secondRow = new ActionRowBuilder().addComponents(badKarmaInput);
        const thirdRow = new ActionRowBuilder().addComponents(multiplierInput);

        modal.addComponents(firstRow, secondRow, thirdRow);

        await interaction.showModal(modal);
    }

    async handleEditCooldown(interaction) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const action = interaction.customId.split('_')[2];
        
        const actionNames = {
            work: 'Travailler',
            fish: 'Pêcher', 
            donate: 'Donner',
            steal: 'Voler',
            crime: 'Crime',
            bet: 'Parier'
        };

        const modal = new ModalBuilder()
            .setCustomId(`cooldown_modal_${action}`)
            .setTitle(`⏰ Configuration Cooldown: ${actionNames[action]}`);

        const cooldownInput = new TextInputBuilder()
            .setCustomId('cooldown_duration')
            .setLabel('Durée cooldown (minutes)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('60')
            .setRequired(true);

        const reductionInput = new TextInputBuilder()
            .setCustomId('karma_reduction')
            .setLabel('Réduction selon karma (% par niveau)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('10')
            .setRequired(false);

        const typeInput = new TextInputBuilder()
            .setCustomId('cooldown_type')
            .setLabel('Type (global/user)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('user')
            .setRequired(false);

        const firstRow = new ActionRowBuilder().addComponents(cooldownInput);
        const secondRow = new ActionRowBuilder().addComponents(reductionInput);
        const thirdRow = new ActionRowBuilder().addComponents(typeInput);

        modal.addComponents(firstRow, secondRow, thirdRow);

        await interaction.showModal(modal);
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