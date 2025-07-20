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
        const configCommand = this.client.commands.get('config-confession');
        
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
    
    async handleAutoThreadConfig(interaction) {
        const value = interaction.values[0];
        await interaction.reply({
            content: `Auto-thread: ${value} (En développement)`,
            flags: 64
        });
    }
    
    async showChannelsConfig(interaction) {
        await interaction.reply({
            content: 'Configuration des canaux en cours de développement.',
            flags: 64
        });
    }
    
    async showAutoThreadConfig(interaction) {
        await interaction.reply({
            content: 'Configuration auto-thread en cours de développement.',
            flags: 64
        });
    }
    
    async showLogsConfig(interaction) {
        await interaction.reply({
            content: 'Configuration des logs en cours de développement.',
            flags: 64
        });
    }
    
    async handleShopPurchase(interaction) {
        const itemId = interaction.values[0];
        
        await interaction.reply({
            content: `Achat d'objet ${itemId} en cours de développement.`,
            flags: 64
        });
    }

    // === MÉTHODES D'AFFICHAGE ===

    async showActionsConfig(interaction) {
        const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('💼 Configuration Actions Économiques')
            .setDescription('Configurez toutes les actions économiques avec leurs récompenses et karma')
            .addFields([
                {
                    name: '😇 Actions Positives',
                    value: '**Travailler** - Gain argent + karma bon\n**Pêcher** - Gain variable + karma bon\n**Donner** - Transfert + gros karma bon',
                    inline: true
                },
                {
                    name: '😈 Actions Négatives',
                    value: '**Voler** - Gain/risque + karma mauvais\n**Crime** - Gros gain/risque + gros karma mauvais\n**Parier** - Gambling + karma mauvais',
                    inline: true
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

    async showKarmaConfig(interaction) {
        const { EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('⚖️ Configuration Système Karma')
            .setDescription('Configurez les effets du karma sur l\'économie')
            .addFields([
                {
                    name: '😇 Karma Positif',
                    value: '• Bonus daily rewards\n• Accès objets spéciaux\n• Réduction cooldowns',
                    inline: true
                },
                {
                    name: '😈 Karma Négatif',
                    value: '• Malus sur gains\n• Cooldowns prolongés\n• Restrictions boutique',
                    inline: true
                },
                {
                    name: '⚖️ Statuts Moraux',
                    value: '**😇 Saint** (+10+)\n**😇 Bon** (+1 à +9)\n**😐 Neutre** (0)\n**😈 Mauvais** (-1 à -9)\n**😈 Diabolique** (-10-)',
                    inline: false
                }
            ]);

        await interaction.reply({
            embeds: [embed],
            content: 'Configuration karma en cours de développement.',
            flags: 64
        });
    }

    async showShopConfig(interaction) {
        const { EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor('#00AAFF')
            .setTitle('🛒 Configuration Boutique')
            .setDescription('Gérez les objets et rôles en vente');

        await interaction.reply({
            embeds: [embed],
            content: 'Configuration boutique en cours de développement.',
            flags: 64
        });
    }

    async showDailyConfig(interaction) {
        const { EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('🎁 Configuration Daily')
            .setDescription('Configurez les récompenses quotidiennes');

        await interaction.reply({
            embeds: [embed],
            content: 'Configuration daily en cours de développement.',
            flags: 64
        });
    }

    async showMessageRewardsConfig(interaction) {
        const { EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor('#32cd32')
            .setTitle('💬 Configuration Récompenses Messages')
            .setDescription('Configurez les gains automatiques par message');

        await interaction.reply({
            embeds: [embed],
            content: 'Configuration messages en cours de développement.',
            flags: 64
        });
    }

    async showActionSettings(interaction, action) {
        const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
        
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

    async sendNotImplemented(interaction, feature) {
        await interaction.reply({
            content: `La fonctionnalité ${feature} sera bientôt disponible.`,
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

    // === AFFICHAGES SPÉCIFIQUES ===

    async showActionsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#4CAF50')
            .setTitle('💼 Configuration Actions Économiques')
            .setDescription('Configurez les paramètres de chaque action économique');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_action_config')
            .setPlaceholder('🎯 Sélectionner une action à configurer')
            .addOptions([
                {
                    label: 'Travail',
                    description: 'Configurer les paramètres du travail',
                    value: 'work',
                    emoji: '👷'
                },
                {
                    label: 'Pêche',
                    description: 'Configurer les paramètres de la pêche',
                    value: 'fish',
                    emoji: '🎣'
                },
                {
                    label: 'Vol',
                    description: 'Configurer les paramètres du vol',
                    value: 'steal',
                    emoji: '🦹'
                },
                {
                    label: 'Crime',
                    description: 'Configurer les paramètres du crime',
                    value: 'crime',
                    emoji: '🔪'
                }
            ]);

        const backButton = new ButtonBuilder()
            .setCustomId('economy_back_main')
            .setLabel('← Retour')
            .setStyle(ButtonStyle.Secondary);

        const components = [
            new ActionRowBuilder().addComponents(selectMenu),
            new ActionRowBuilder().addComponents(backButton)
        ];

        await this.safeReply(interaction, {
            embeds: [embed],
            components: components,
            ephemeral: true
        });
    }

    async showActionSettings(interaction, action) {
        const actions = await this.dataManager.getData('actions');
        const guildId = interaction.guild.id;
        const actionKey = `${action}_${guildId}`;
        
        const actionData = actions[actionKey] || {
            name: action,
            enabled: true,
            baseReward: 100,
            cooldown: 3600,
            karmaGood: 0,
            karmaBad: 0,
            guildId: guildId
        };

        const embed = new EmbedBuilder()
            .setColor('#FF9800')
            .setTitle(`⚙️ Configuration: ${this.getActionName(action)}`)
            .addFields([
                {
                    name: '💰 Récompense de base',
                    value: `${actionData.baseReward}€`,
                    inline: true
                },
                {
                    name: '⏰ Cooldown',
                    value: `${Math.floor(actionData.cooldown/60)} minutes`,
                    inline: true
                },
                {
                    name: '📊 État',
                    value: actionData.enabled ? '🟢 Activé' : '🔴 Désactivé',
                    inline: true
                }
            ]);

        const components = [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`edit_reward_${action}`)
                    .setLabel('💰 Modifier Récompense')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`edit_cooldown_${action}`)
                    .setLabel('⏰ Modifier Cooldown')
                    .setStyle(ButtonStyle.Primary)
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`toggle_action_${action}`)
                    .setLabel(actionData.enabled ? '🔴 Désactiver' : '🟢 Activer')
                    .setStyle(actionData.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('economy_back_actions')
                    .setLabel('← Retour Actions')
                    .setStyle(ButtonStyle.Secondary)
            )
        ];

        await this.safeReply(interaction, {
            embeds: [embed],
            components: components,
            ephemeral: true
        });
    }

    async showMessageRewardsConfig(interaction) {
        const rewards = await this.dataManager.getData('message_rewards');
        
        const embed = new EmbedBuilder()
            .setColor('#2196F3')
            .setTitle('💬 Configuration Récompenses Messages')
            .setDescription('Configuration des gains automatiques par message')
            .addFields([
                {
                    name: '📊 État',
                    value: rewards.enabled ? '🟢 Activé' : '🔴 Désactivé',
                    inline: true
                },
                {
                    name: '💰 Montant par message',
                    value: `${rewards.amount}€`,
                    inline: true
                },
                {
                    name: '⏰ Cooldown',
                    value: `${rewards.cooldown} secondes`,
                    inline: true
                }
            ]);

        const components = [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('toggle_message_rewards')
                    .setLabel(rewards.enabled ? '🔴 Désactiver' : '🟢 Activer')
                    .setStyle(rewards.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('edit_message_amount')
                    .setLabel('💰 Modifier Montant')
                    .setStyle(ButtonStyle.Primary)
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('edit_message_cooldown')
                    .setLabel('⏰ Modifier Cooldown')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('economy_back_main')
                    .setLabel('← Retour')
                    .setStyle(ButtonStyle.Secondary)
            )
        ];

        await this.safeReply(interaction, {
            embeds: [embed],
            components: components,
            ephemeral: true
        });
    }

    // === UTILITAIRES ===

    async safeReply(interaction, options) {
        try {
            if (interaction.deferred) {
                await interaction.editReply(options);
            } else if (!interaction.replied) {
                await interaction.reply({...options, ephemeral: true});
            } else {
                await interaction.followUp({...options, ephemeral: true});
            }
        } catch (error) {
            console.error('❌ Erreur réponse interaction:', error);
        }
    }

    async sendErrorResponse(interaction, error) {
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Erreur')
            .setDescription('Une erreur est survenue lors du traitement de votre demande.')
            .addFields([
                {
                    name: 'Détails',
                    value: `\`\`\`${error.message || 'Erreur inconnue'}\`\`\``,
                    inline: false
                }
            ])
            .setTimestamp();

        await this.safeReply(interaction, {
            embeds: [embed],
            ephemeral: true
        });
    }

    async sendNotImplemented(interaction, feature) {
        const embed = new EmbedBuilder()
            .setColor('#FF9800')
            .setTitle('🚧 Fonctionnalité en développement')
            .setDescription(`La fonctionnalité "${feature}" sera bientôt disponible !`)
            .setTimestamp();

        await this.safeReply(interaction, {
            embeds: [embed],
            ephemeral: true
        });
    }

    getActionName(action) {
        const names = {
            'work': 'Travail',
            'fish': 'Pêche', 
            'steal': 'Vol',
            'crime': 'Crime',
            'gamble': 'Pari',
            'donate': 'Don'
        };
        return names[action] || action;
    }
}

module.exports = InteractionHandler;