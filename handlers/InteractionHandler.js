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
        
        await interaction.reply({
            content: `Configuration ${value} en cours de développement.`,
            flags: 64
        });
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