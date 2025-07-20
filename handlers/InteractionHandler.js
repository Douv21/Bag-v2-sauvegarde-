/**
 * GESTIONNAIRE D'INTERACTIONS CENTRALISÉ
 * Gestion unifiée des menus déroulants, boutons et modals
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle } = require('discord.js');

class InteractionHandler {
    constructor(client, dataManager) {
        this.client = client;
        this.dataManager = dataManager;
        
        // Handlers par type d'interaction
        this.handlers = {
            // Menus déroulants
            selectMenu: new Map(),
            
            // Boutons
            button: new Map(),
            
            // Modals
            modal: new Map()
        };
        
        this.registerHandlers();
    }

    registerHandlers() {
        // === CONFIGURATION ÉCONOMIE ===
        this.handlers.selectMenu.set('economy_main_config', this.handleEconomyMainConfig.bind(this));
        this.handlers.selectMenu.set('economy_action_config', this.handleEconomyActionConfig.bind(this));
        this.handlers.selectMenu.set('karma_config_menu', this.handleKarmaConfigMenu.bind(this));
        this.handlers.selectMenu.set('shop_purchase', this.handleShopPurchase.bind(this));
        
        // === CONFESSION SYSTEM ===
        this.handlers.selectMenu.set('config_main_menu', this.handleConfigMainMenu.bind(this));
        
        // === BOUTONS ===
        this.handlers.button.set('economy_back_main', this.handleBackToMain.bind(this));
        this.handlers.button.set('config_back_main', this.handleBackToMain.bind(this));
        this.handlers.button.set('edit_reward_work', this.handleEditReward.bind(this));
        this.handlers.button.set('edit_karma_work', this.handleEditKarma.bind(this));
        this.handlers.button.set('edit_cooldown_work', this.handleEditCooldown.bind(this));
        this.handlers.button.set('edit_reward_fish', this.handleEditReward.bind(this));
        this.handlers.button.set('edit_karma_fish', this.handleEditKarma.bind(this));
        this.handlers.button.set('edit_cooldown_fish', this.handleEditCooldown.bind(this));
        this.handlers.button.set('edit_reward_donate', this.handleEditReward.bind(this));
        this.handlers.button.set('edit_karma_donate', this.handleEditKarma.bind(this));
        this.handlers.button.set('edit_cooldown_donate', this.handleEditCooldown.bind(this));
        this.handlers.button.set('edit_reward_steal', this.handleEditReward.bind(this));
        this.handlers.button.set('edit_karma_steal', this.handleEditKarma.bind(this));
        this.handlers.button.set('edit_cooldown_steal', this.handleEditCooldown.bind(this));
        this.handlers.button.set('edit_reward_crime', this.handleEditReward.bind(this));
        this.handlers.button.set('edit_karma_crime', this.handleEditKarma.bind(this));
        this.handlers.button.set('edit_cooldown_crime', this.handleEditCooldown.bind(this));
        this.handlers.button.set('edit_reward_bet', this.handleEditReward.bind(this));
        this.handlers.button.set('edit_karma_bet', this.handleEditKarma.bind(this));
        this.handlers.button.set('edit_cooldown_bet', this.handleEditCooldown.bind(this));
        this.handlers.button.set('economy_back_actions', this.handleBackToActions.bind(this));
        this.handlers.button.set('toggle_message_rewards', this.handleToggleMessageRewards.bind(this));
        this.handlers.button.set('karma_force_reset', this.handleKarmaForceReset.bind(this));
    }

    async handle(interaction) {
        try {
            // Commandes slash
            if (interaction.isChatInputCommand()) {
                await this.handleCommand(interaction);
                return;
            }

            // Menus déroulants
            if (interaction.isStringSelectMenu()) {
                await this.handleSelectMenu(interaction);
                return;
            }

            // Boutons
            if (interaction.isButton()) {
                await this.handleButton(interaction);
                return;
            }

            // Modals
            if (interaction.isModalSubmit()) {
                await this.handleModal(interaction);
                return;
            }

        } catch (error) {
            console.error('❌ Erreur interaction:', error);
            await this.sendErrorResponse(interaction, error);
        }
    }

    async handleCommand(interaction) {
        const command = this.client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, this.dataManager);
        } catch (error) {
            console.error(`❌ Erreur commande ${interaction.commandName}:`, error);
            await this.sendErrorResponse(interaction, error);
        }
    }

    async handleSelectMenu(interaction) {
        const handler = this.handlers.selectMenu.get(interaction.customId);
        if (handler) {
            await handler(interaction);
        } else {
            console.log(`⚠️ Menu non géré: ${interaction.customId}`);
        }
    }

    async handleButton(interaction) {
        const handler = this.handlers.button.get(interaction.customId);
        if (handler) {
            await handler(interaction);
        } else {
            console.log(`⚠️ Bouton non géré: ${interaction.customId}`);
        }
    }

    async handleModal(interaction) {
        const handler = this.handlers.modal.get(interaction.customId);
        if (handler) {
            await handler(interaction);
        } else {
            console.log(`⚠️ Modal non géré: ${interaction.customId}`);
        }
    }

    // === HANDLERS SPÉCIFIQUES ===

    async handleEconomyMainConfig(interaction) {
        const value = interaction.values[0];
        
        switch (value) {
            case 'actions':
                await this.showActionsConfig(interaction);
                break;
            case 'shop':
                await this.showShopConfig(interaction);
                break;
            case 'karma':
                await this.showKarmaConfig(interaction);
                break;
            case 'daily':
                await this.showDailyConfig(interaction);
                break;
            case 'messages':
                await this.showMessageRewardsConfig(interaction);
                break;
            default:
                await this.sendNotImplemented(interaction, value);
        }
    }

    async handleEconomyActionConfig(interaction) {
        const action = interaction.values[0];
        await this.showActionSettings(interaction, action);
    }

    async handleConfigMainMenu(interaction) {
        const value = interaction.values[0];
        
        switch(value) {
            case 'channels':
                await this.showChannelsConfig(interaction);
                break;
            case 'autothread':
                await this.showAutoThreadConfig(interaction);
                break;
            case 'logs':
                await this.showLogsConfig(interaction);
                break;
            default:
                await interaction.reply({
                    content: `Configuration ${value} disponible bientôt.`,
                    flags: 64
                });
        }
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
                    content: `Configuration ${value} en cours de développement.`,
                    flags: 64
                });
        }
    }

    async handleShopPurchase(interaction) {
        const itemId = interaction.values[0];
        
        await interaction.reply({
            content: `Achat d'objet ${itemId} en cours de développement.`,
            flags: 64
        });
    }

    // === HANDLERS BOUTONS ===

    async handleEditReward(interaction) {
        const action = interaction.customId.split('_')[2]; // extract action from button id
        await interaction.reply({
            content: `💰 Modification des récompenses pour l'action ${action} en cours de développement.\n\nProchainement vous pourrez configurer:\n• Montant minimum\n• Montant maximum\n• Bonus selon le karma`,
            flags: 64
        });
    }

    async handleEditKarma(interaction) {
        const action = interaction.customId.split('_')[2]; // extract action from button id
        await interaction.reply({
            content: `⚖️ Configuration karma pour l'action ${action} en cours de développement.\n\nProchainement vous pourrez configurer:\n• Karma bon gagné (😇)\n• Karma mauvais gagné (😈)\n• Multiplicateurs selon le niveau`,
            flags: 64
        });
    }

    async handleEditCooldown(interaction) {
        const action = interaction.customId.split('_')[2]; // extract action from button id
        await interaction.reply({
            content: `⏰ Configuration cooldown pour l'action ${action} en cours de développement.\n\nProchainement vous pourrez configurer:\n• Durée du cooldown\n• Réduction selon le karma\n• Cooldown global ou par utilisateur`,
            flags: 64
        });
    }

    async handleBackToActions(interaction) {
        await this.showActionsConfig(interaction);
    }

    async handleToggleMessageRewards(interaction) {
        await interaction.reply({
            content: 'Toggle récompenses messages en cours de développement.',
            flags: 64
        });
    }

    async handleKarmaForceReset(interaction) {
        await interaction.reply({
            content: '🔄 Reset karma forcé en cours de développement.\n\nCette action va :\n• Distribuer les récompenses actuelles\n• Remettre tous les karma à 0\n• Logger l\'action dans les statistiques',
            flags: 64
        });
    }

    async handleBackToMain(interaction) {
        // Retour au menu principal selon le contexte
        if (interaction.customId.includes('economy')) {
            // Recharger config économie
            const command = this.client.commands.get('configeconomie');
            if (command) {
                await command.showMainEconomyConfig(interaction);
            }
        } else {
            // Recharger config générale
            const command = this.client.commands.get('config');
            if (command) {
                await command.showMainConfig(interaction);
            }
        }
    }

    // === MÉTHODES D'AFFICHAGE ===

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

        await this.safeReply(interaction, {
            embeds: [embed],
            components: components
        });
    }

    async showActionSettings(interaction, action) {
        const actionConfig = {
            work: {
                name: 'Travailler 💼',
                description: 'Action positive qui génère de l\'argent et du karma bon',
                currentSettings: {
                    minReward: 100,
                    maxReward: 150,
                    karmaGood: 1,
                    karmaBad: 0,
                    cooldown: 3600000 // 1h en ms
                }
            },
            fish: {
                name: 'Pêcher 🎣',
                description: 'Action positive avec gains variables selon la chance',
                currentSettings: {
                    minReward: 50,
                    maxReward: 200,
                    karmaGood: 1,
                    karmaBad: 0,
                    cooldown: 5400000 // 1h30 en ms
                }
            },
            donate: {
                name: 'Donner 💝',
                description: 'Action très positive qui transfère de l\'argent',
                currentSettings: {
                    minReward: 0,
                    maxReward: 0,
                    karmaGood: 3,
                    karmaBad: 0,
                    cooldown: 3600000 // 1h en ms
                }
            },
            steal: {
                name: 'Voler 💸',
                description: 'Action négative avec risques et récompenses',
                currentSettings: {
                    minReward: 50,
                    maxReward: 100,
                    karmaGood: 0,
                    karmaBad: 1,
                    cooldown: 7200000 // 2h en ms
                }
            },
            crime: {
                name: 'Crime 🔫',
                description: 'Action très négative avec gros gains mais gros risques',
                currentSettings: {
                    minReward: 200,
                    maxReward: 500,
                    karmaGood: 0,
                    karmaBad: 3,
                    cooldown: 14400000 // 4h en ms
                }
            },
            bet: {
                name: 'Parier 🎰',
                description: 'Action négative de gambling avec 45% de chance',
                currentSettings: {
                    minReward: 0,
                    maxReward: 200,
                    karmaGood: 0,
                    karmaBad: 1,
                    cooldown: 1800000 // 30min en ms
                }
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

        const cooldownHours = Math.floor(config.currentSettings.cooldown / 3600000);
        const cooldownMins = Math.floor((config.currentSettings.cooldown % 3600000) / 60000);
        const cooldownText = cooldownHours > 0 ? `${cooldownHours}h${cooldownMins > 0 ? cooldownMins + 'min' : ''}` : `${cooldownMins}min`;

        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle(`⚙️ Configuration: ${config.name}`)
            .setDescription(config.description)
            .addFields([
                {
                    name: '💰 Récompenses',
                    value: config.currentSettings.minReward === config.currentSettings.maxReward 
                        ? `**${config.currentSettings.minReward}€**`
                        : `**${config.currentSettings.minReward}€** - **${config.currentSettings.maxReward}€**`,
                    inline: true
                },
                {
                    name: '⚖️ Karma',
                    value: `😇 +${config.currentSettings.karmaGood} | 😈 +${config.currentSettings.karmaBad}`,
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
                .setEmoji('⏰'),
            new ButtonBuilder()
                .setCustomId('economy_back_actions')
                .setLabel('Retour')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('↩️')
        ];

        const components = [new ActionRowBuilder().addComponents(buttons)];

        await this.safeReply(interaction, {
            embeds: [embed],
            components: components
        });
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
            .setP
