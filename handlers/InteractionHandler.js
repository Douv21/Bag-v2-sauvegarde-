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
            selectMenu: new Map(),
            button: new Map(),
            modal: new Map()
        };
        
        this.registerHandlers();
    }

    registerHandlers() {
        // === MENUS DÉROULANTS ===
        this.handlers.selectMenu.set('economy_main_config', this.handleEconomyMainConfig.bind(this));
        this.handlers.selectMenu.set('economy_action_config', this.handleEconomyActionConfig.bind(this));
        this.handlers.selectMenu.set('karma_config_menu', this.handleKarmaConfigMenu.bind(this));
        this.handlers.selectMenu.set('shop_purchase', this.handleShopPurchase.bind(this));
        this.handlers.selectMenu.set('config_main_menu', this.handleConfigMainMenu.bind(this));
        
        // === BOUTONS ===
        this.handlers.button.set('economy_back_main', this.handleBackToMain.bind(this));
        this.handlers.button.set('config_back_main', this.handleBackToMain.bind(this));
        this.handlers.button.set('economy_back_actions', this.handleBackToActions.bind(this));
        this.handlers.button.set('toggle_message_rewards', this.handleToggleMessageRewards.bind(this));
        this.handlers.button.set('karma_force_reset', this.handleKarmaForceReset.bind(this));
        
        // Boutons d'édition (pattern dynamique)
        ['work', 'fish', 'donate', 'steal', 'crime', 'bet'].forEach(action => {
            this.handlers.button.set(`edit_reward_${action}`, this.handleEditReward.bind(this));
            this.handlers.button.set(`edit_karma_${action}`, this.handleEditKarma.bind(this));
            this.handlers.button.set(`edit_cooldown_${action}`, this.handleEditCooldown.bind(this));
            this.handlers.button.set(`toggle_action_${action}`, this.handleToggleAction.bind(this));
        });
    }

    async handle(interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                await this.handleCommand(interaction);
            } else if (interaction.isStringSelectMenu()) {
                await this.handleSelectMenu(interaction);
            } else if (interaction.isButton()) {
                await this.handleButton(interaction);
            } else if (interaction.isModalSubmit()) {
                await this.handleModal(interaction);
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
            await this.sendNotImplemented(interaction, interaction.customId);
        }
    }

    async handleButton(interaction) {
        const handler = this.handlers.button.get(interaction.customId);
        if (handler) {
            await handler(interaction);
        } else {
            console.log(`⚠️ Bouton non géré: ${interaction.customId}`);
            await this.sendNotImplemented(interaction, interaction.customId);
        }
    }

    async handleModal(interaction) {
        const handler = this.handlers.modal.get(interaction.customId);
        if (handler) {
            await handler(interaction);
        } else {
            console.log(`⚠️ Modal non géré: ${interaction.customId}`);
            await this.sendNotImplemented(interaction, interaction.customId);
        }
    }

    // === HANDLERS DE MENUS DÉROULANTS ===

    async handleEconomyMainConfig(interaction) {
        const value = interaction.values[0];
        
        const handlers = {
            'actions': () => this.showActionsConfig(interaction),
            'shop': () => this.showShopConfig(interaction),
            'karma': () => this.showKarmaConfig(interaction),
            'daily': () => this.showDailyConfig(interaction),
            'messages': () => this.showMessageRewardsConfig(interaction)
        };

        const handler = handlers[value];
        if (handler) {
            await handler();
        } else {
            await this.sendNotImplemented(interaction, value);
        }
    }

    async handleEconomyActionConfig(interaction) {
        const action = interaction.values[0];
        await this.showActionSettings(interaction, action);
    }

    async handleConfigMainMenu(interaction) {
        const value = interaction.values[0];
        
        const handlers = {
            'channels': () => this.showChannelsConfig(interaction),
            'autothread': () => this.showAutoThreadConfig(interaction),
            'logs': () => this.showLogsConfig(interaction)
        };

        const handler = handlers[value];
        if (handler) {
            await handler();
        } else {
            await this.sendNotImplemented(interaction, value);
        }
    }

    async handleKarmaConfigMenu(interaction) {
        const value = interaction.values[0];
        
        const handlers = {
            'levels': () => this.showKarmaLevelsConfig(interaction),
            'reset': () => this.showKarmaResetConfig(interaction),
            'actions': () => this.showKarmaActionsConfig(interaction)
        };

        const handler = handlers[value];
        if (handler) {
            await handler();
        } else {
            await this.sendNotImplemented(interaction, value);
        }
    }

    async handleShopPurchase(interaction) {
        const itemId = interaction.values[0];
        await this.sendNotImplemented(interaction, `Achat d'objet ${itemId}`);
    }

    // === HANDLERS DE BOUTONS ===

    async handleEditReward(interaction) {
        const action = interaction.customId.split('_')[2];
        await this.sendNotImplemented(interaction, `Modification des récompenses pour ${this.getActionName(action)}`);
    }

    async handleEditKarma(interaction) {
        const action = interaction.customId.split('_')[2];
        await this.sendNotImplemented(interaction, `Configuration karma pour ${this.getActionName(action)}`);
    }

    async handleEditCooldown(interaction) {
        const action = interaction.customId.split('_')[2];
        await this.sendNotImplemented(interaction, `Configuration cooldown pour ${this.getActionName(action)}`);
    }

    async handleToggleAction(interaction) {
        const action = interaction.customId.split('_')[2];
        await this.sendNotImplemented(interaction, `Activation/désactivation de ${this.getActionName(action)}`);
    }

    async handleBackToActions(interaction) {
        await this.showActionsConfig(interaction);
    }

    async handleToggleMessageRewards(interaction) {
        await this.sendNotImplemented(interaction, 'Toggle récompenses messages');
    }

    async handleKarmaForceReset(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('🔄 Reset Karma Forcé')
            .setDescription('⚠️ Cette action va réinitialiser tout le karma du serveur')
            .addFields([
                {
                    name: '🎁 Actions effectuées',
                    value: '• Distribution des récompenses actuelles\n• Remise à zéro de tous les karma\n• Enregistrement dans les logs',
                    inline: false
                }
            ]);

        await this.safeReply(interaction, {
            embeds: [embed],
            content: '🔄 Reset karma forcé en cours de développement.',
            ephemeral: true
        });
    }

    async handleBackToMain(interaction) {
        if (interaction.customId.includes('economy')) {
            const command = this.client.commands.get('configeconomie');
            if (command && typeof command.showMainEconomyConfig === 'function') {
                await command.showMainEconomyConfig(interaction);
            } else {
                await this.sendNotImplemented(interaction, 'Menu principal économie');
            }
        } else {
            const command = this.client.commands.get('config');
            if (command && typeof command.showMainConfig === 'function') {
                await command.showMainConfig(interaction);
            } else {
                await this.sendNotImplemented(interaction, 'Menu principal config');
            }
        }
    }

    // === MÉTHODES D'AFFICHAGE ===

    async showActionsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9932CC')
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
                { label: 'Travailler 💼', description: 'Gains: 100-150€ | Karma: +1😇 | Cooldown: 1h', value: 'work', emoji: '💼' },
                { label: 'Pêcher 🎣', description: 'Gains variables | Karma: +1😇 | Cooldown: 1h30', value: 'fish', emoji: '🎣' },
                { label: 'Donner 💝', description: 'Transfert argent | Karma: +3😇 | Cooldown: 1h', value: 'donate', emoji: '💝' },
                { label: 'Voler 💸', description: 'Vol avec risque | Karma: +1😈 | Cooldown: 2h', value: 'steal', emoji: '💸' },
                { label: 'Crime 🔫', description: 'Gros gains/risques | Karma: +3😈 | Cooldown: 4h', value: 'crime', emoji: '🔫' },
                { label: 'Parier 🎰', description: 'Gambling 45% | Karma: +1😈 | Cooldown: 30min', value: 'bet', emoji: '🎰' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await this.safeReply(interaction, {
            embeds: [embed],
            components: components,
            ephemeral: true
        });
    }

    async showActionSettings(interaction, action) {
        const actionConfigs = {
            work: { name: 'Travailler 💼', desc: 'Action positive qui génère de l\'argent et du karma bon', minReward: 100, maxReward: 150, karmaGood: 1, karmaBad: 0, cooldown: 3600000 },
            fish: { name: 'Pêcher 🎣', desc: 'Action positive avec gains variables selon la chance', minReward: 50, maxReward: 200, karmaGood: 1, karmaBad: 0, cooldown: 5400000 },
            donate: { name: 'Donner 💝', desc: 'Action très positive qui transfère de l\'argent', minReward: 0, maxReward: 0, karmaGood: 3, karmaBad: 0, cooldown: 3600000 },
            steal: { name: 'Voler 💸', desc: 'Action négative avec risques et récompenses', minReward: 50, maxReward: 100, karmaGood: 0, karmaBad: 1, cooldown: 7200000 },
            crime: { name: 'Crime 🔫', desc: 'Action très négative avec gros gains mais gros risques', minReward: 200, maxReward: 500, karmaGood: 0, karmaBad: 3, cooldown: 14400000 },
            bet: { name: 'Parier 🎰', desc: 'Action négative de gambling avec 45% de chance', minReward: 0, maxReward: 200, karmaGood: 0, karmaBad: 1, cooldown: 1800000 }
        };

        const config = actionConfigs[action];
        if (!config) {
            await this.sendNotImplemented(interaction, 'Action non trouvée');
            return;
        }

        const cooldownHours = Math.floor(config.cooldown / 3600000);
        const cooldownMins = Math.floor((config.cooldown % 3600000) / 60000);
        const cooldownText = cooldownHours > 0 ? `${cooldownHours}h${cooldownMins > 0 ? cooldownMins + 'min' : ''}` : `${cooldownMins}min`;

        const embed = new EmbedBuilder()
            .setColor('#9932CC')
            .setTitle(`⚙️ Configuration: ${config.name}`)
            .setDescription(config.desc)
            .addFields([
                {
                    name: '💰 Récompenses',
                    value: config.minReward === config.maxReward 
                        ? `**${config.minReward}€**`
                        : `**${config.minReward}€** - **${config.maxReward}€**`,
                    inline: true
                },
                {
                    name: '⚖️ Karma',
                    value: `😇 +${config.karmaGood} | 😈 +${config.karmaBad}`,
                    inline: true
                },
                {
                    name: '⏰ Cooldown',
                    value: `**${cooldownText}**`,
                    inline: true
                }
            ]);

        const buttons = [
            new ButtonBuilder().setCustomId(`edit_reward_${action}`).setLabel('Modifier Récompenses').setStyle(ButtonStyle.Primary).setEmoji('💰'),
            new ButtonBuilder().setCustomId(`edit_karma_${action}`).setLabel('Modifier Karma').setStyle(ButtonStyle.Secondary).setEmoji('⚖️'),
            new ButtonBuilder().setCustomId(`edit_cooldown_${action}`).setLabel('Modifier Cooldown').setStyle(ButtonStyle.Secondary).setEmoji('⏰'),
            new ButtonBuilder().setCustomId('economy_back_actions').setLabel('Retour').setStyle(ButtonStyle.Danger).setEmoji('↩️')
        ];

        const components = [new ActionRowBuilder().addComponents(buttons)];

        await this.safeReply(interaction, {
            embeds: [embed],
            components: components,
            ephemeral: true
        });
    }

    async showKarmaConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9932CC')
            .setTitle('⚖️ Configuration Système Karma Avancé')
            .setDescription('Système automatique avec récompenses/sanctions et reset hebdomadaire')
            .addFields([
                {
                    name: '🏆 Niveaux et Récompenses',
                    value: '**😇 Saint** (+10+): +500€, x1.5 daily, -30% cooldown\n**😇 Bon** (+1/+9): +200€, x1.2 daily, -10% cooldown\n**😐 Neutre** (0): Aucun effet\n**😈 Mauvais** (-1/-9): -100€, x0.8 daily, +20% cooldown\n**😈 Diabolique** (-10-): -300€, x0.5 daily, +50% cooldown',
                    inline: false
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('karma_config_menu')
            .setPlaceholder('⚖️ Configurer le système karma')
            .addOptions([
                { label: 'Niveaux et Récompenses', description: 'Configurer les récompenses par niveau karma', value: 'levels', emoji: '🏆' },
                { label: 'Reset Hebdomadaire', description: 'Jour et fréquence de réinitialisation', value: 'reset', emoji: '📅' },
                { label: 'Karma par Action', description: 'Configurer karma gagné/perdu par action', value: 'actions', emoji: '⚙️' }
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

        await this.safeReply(interaction, {
            embeds: [embed],
            components: components,
            ephemeral: true
        });
    }

    async showShopConfig(interaction) {
        await this.sendNotImplemented(interaction, 'Configuration boutique');
    }

    async showDailyConfig(interaction) {
        await this.sendNotImplemented(interaction, 'Configuration daily');
    }

    async showMessageRewardsConfig(interaction) {
        await this.sendNotImplemented(interaction, 'Configuration récompenses messages');
    }

    async showChannelsConfig(interaction) {
        await this.sendNotImplemented(interaction, 'Configuration des canaux');
    }

    async showAutoThreadConfig(interaction) {
        await this.sendNotImplemented(interaction, 'Configuration auto-thread');
    }

    async showLogsConfig(interaction) {
        await this.sendNotImplemented(interaction, 'Configuration des logs');
    }

    async showKarmaLevelsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 Configuration Niveaux Karma')
            .setDescription('Récompenses automatiques selon le niveau de karma')
            .addFields([
                { name: '😇 Saint (+10 karma+)', value: '💰 +500€ | 🎁 x1.5 daily | ⏰ -30% cooldown', inline: true },
                { name: '😇 Bon (+1 à +9 karma)', value: '💰 +200€ | 🎁 x1.2 daily | ⏰ -10% cooldown', inline: true },
                { name: '😐 Neutre (0 karma)', value: '💰 Aucun effet | 🎁 Normal | ⏰ Normal', inline: true },
                { name: '😈 Mauvais (-1 à -9 karma)', value: '💰 -100€ | 🎁 x0.8 daily | ⏰ +20% cooldown', inline: true },
                { name: '😈 Diabolique (-10 karma-)', value: '💰 -300€ | 🎁 x0.5 daily | ⏰ +50% cooldown', inline: true }
            ]);

        await this.safeReply(interaction, {
            embeds: [embed],
            content: '⚙️ Configuration des récompenses par niveau en cours de développement.',
            ephemeral: true
        });
    }

    async showKarmaResetConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('📅 Configuration Reset Hebdomadaire')
            .setDescription('Paramètres de réinitialisation automatique du karma')
            .addFields([
                { name: 'Jour actuel', value: 'Lundi (configurable)', inline: true },
                { name: 'Prochain reset', value: 'Dans 5 jours', inline: true },
                { name: 'Actions du reset', value: '1. Distribution récompenses\n2. Reset karma à 0\n3. Log des statistiques', inline: false }
            ]);

        await this.safeReply(interaction, {
            embeds: [embed],
            content: '📅 Configuration du jour de reset en cours de développement.',
            ephemeral: true
        });
    }

    async showKarmaActionsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9932CC')
            .setTitle('⚙️ Configuration Karma par Action')
            .setDescription('Paramètres karma gagnés/perdus pour chaque action économique')
            .addFields([
                { name: '💼 Travailler', value: '😇 +1 karma bon | 😈 -1 karma mauvais', inline: true },
                { name: '🎣 Pêcher', value: '😇 +1 karma bon | 😈 -1 karma mauvais', inline: true },
                { name: '💝 Donner', value: '😇 +3 karma bon | 😈 -2 karma mauvais',
