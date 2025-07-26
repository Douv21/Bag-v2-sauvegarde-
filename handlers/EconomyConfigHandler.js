/**
 * Handler dédié à la configuration du système économique - Version Corrigée
 */

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, RoleSelectMenuBuilder } = require('discord.js');

console.log('📁 EconomyConfigHandler chargé avec imports:', { EmbedBuilder, ModalBuilder, TextInputBuilder });

class EconomyConfigHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    async showMainConfigMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('💰 Configuration Économie')
            .setDescription('Système économique complet avec karma et récompenses')
            .addFields([
                { name: '⚡ Actions', value: '6 actions configurables', inline: true },
                { name: '🏪 Boutique', value: 'Système de vente', inline: true },
                { name: '⚖️ Karma', value: 'Bon vs Mauvais', inline: true },
                { name: '📅 Daily', value: 'Récompenses quotidiennes', inline: true },
                { name: '💬 Messages', value: 'Gains par message', inline: true },
                { name: '📊 Stats', value: 'Données et analyses', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_config_select')
            .setPlaceholder('Choisissez une section...')
            .addOptions([
                { label: '⚡ Actions', value: 'economy_action_select', description: 'Configurer les actions économiques' },
                { label: '🏪 Boutique', value: 'economy_shop_options', description: 'Gestion de la boutique' },
                { label: '⚖️ Karma', value: 'economy_karma_options', description: 'Système de karma' },
                { label: '📅 Daily', value: 'economy_daily_options', description: 'Configuration daily rewards' },
                { label: '💬 Messages', value: 'economy_messages_options', description: 'Configuration gains par message' },
                { label: '📊 Stats', value: 'economy_stats_options', description: 'Statistiques économiques' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    // Handler principal pour router les interactions
    async handleInteraction(interaction) {
        const option = interaction.values[0];
        console.log(`🔍 EconomyHandler: Option sélectionnée = ${option}`);
        
        switch (option) {
            case 'economy_action_select':
                await this.showActionsConfig(interaction);
                break;
            case 'economy_shop_options':
                await this.showShopConfig(interaction);
                break;
            case 'economy_karma_options':
                await this.showKarmaConfig(interaction);
                break;
            case 'economy_daily_options':
                await this.showDailyConfig(interaction);
                break;
            case 'economy_messages_options':
                await this.showMessagesConfig(interaction);
                break;
            case 'economy_stats_options':
                await this.showStatsConfig(interaction);
                break;
            // Karma sous-menus
            case 'karma_rewards':
            case 'economy_karma_rewards_config':
                await this.showKarmaRewardsConfig(interaction);
                break;
            case 'karma_create_type_select':
                await this.showKarmaTypeSelector(interaction);
                break;
            case 'karma_add_temp_role':
                await this.showRoleSelector(interaction);
                break;
            case 'karma_create_reward':
                await this.showKarmaLevelModal(interaction, 'reward');
                break;
            case 'karma_create_sanction':
                await this.showKarmaLevelModal(interaction, 'sanction');
                break;
            case 'karma_create_level':
                await this.showKarmaLevelModal(interaction);
                break;
            case 'karma_edit_level':
                await this.showKarmaEditMenu(interaction);
                break;
            case 'karma_delete_level':
                await this.showKarmaDeleteMenu(interaction);
                break;
            case 'karma_test_system':
                await this.testKarmaRewardSystem(interaction);
                break;
            case 'back_karma':
                await this.showKarmaConfig(interaction);
                break;
            case 'back_karma_rewards':
                await this.showKarmaRewardsConfig(interaction);
                break;
            // Daily sous-menus
            case 'daily_amounts':
                await this.showDailyAmountModal(interaction);
                break;
            case 'daily_cooldown':
                await this.showDailyCooldownModal(interaction);
                break;
            case 'daily_toggle':
                await this.toggleDailySystem(interaction);
                break;
            // Retour au menu principal
            case 'economy_main_menu':
                await this.showMainConfigMenu(interaction);
                break;
            default:
                // Gestion des IDs dynamiques pour édition/suppression karma
                if (option.startsWith('edit_karma_')) {
                    const karmaId = option.replace('edit_karma_', '');
                    await this.showKarmaEditModal(interaction, karmaId);
                } else if (option.startsWith('delete_karma_')) {
                    const karmaId = option.replace('delete_karma_', '');
                    await this.confirmKarmaDelete(interaction, karmaId);
                } else if (option.startsWith('select_level_')) {
                    const levelId = option.replace('select_level_', '');
                    await this.showRoleSelector(interaction, levelId);
                } else if (option === 'karma_test_system') {
                    await this.testKarmaRewardSystem(interaction);
                } else {
                    console.log(`❌ EconomyHandler: Option non reconnue = ${option}`);
                    await interaction.reply({ content: `❌ Option non reconnue: ${option}`, flags: 64 });
                }
                break;
        }
    }

    // Handler pour action config manquant
    async handleActionConfig(interaction) {
        const actionName = interaction.customId.replace('action_config_', '');
        await this.showActionConfig(interaction, actionName);
    }

    async showActionConfig(interaction, actionName) {
        console.log(`⚡ Configuration action: ${actionName}`);
        
        const actionEmojis = {
            travailler: '💼',
            pecher: '🎣', 
            donner: '🎁',
            voler: '💰',
            crime: '🔫',
            parier: '🎰'
        };

        // Retour au menu actions avec embed spécifique
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle(`${actionEmojis[actionName] || '⚡'} Configuration - ${actionName.charAt(0).toUpperCase() + actionName.slice(1)}`)
            .setDescription('Configurez cette action via modal unique')
            .addFields([
                { name: '💰 Récompenses', value: 'Min/Max gains configurables', inline: true },
                { name: '⚖️ Karma', value: 'Karma bon/mauvais', inline: true },
                { name: '⏰ Cooldown', value: 'Temps d\'attente', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`action_${actionName}_config`)
            .setPlaceholder('Configurer...')
            .addOptions([
                { label: '⚙️ Configuration Complète', value: `${actionName}_modal_config`, description: 'Modal avec tous les paramètres' },
                { label: '🔙 Retour Actions', value: 'back_to_actions', description: 'Retour au menu actions' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }



    // Modals pour Daily
    async showDailyAmountModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('daily_amount_modal')
            .setTitle('💰 Montants Daily');

        const baseAmountInput = new TextInputBuilder()
            .setCustomId('daily_base_amount')
            .setLabel('Montant de base (€)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('50')
            .setValue('50')
            .setRequired(true);

        const streakBonusInput = new TextInputBuilder()
            .setCustomId('daily_streak_bonus')
            .setLabel('Bonus par jour de streak (€)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('5')
            .setValue('5')
            .setRequired(true);

        const rows = [
            new ActionRowBuilder().addComponents(baseAmountInput),
            new ActionRowBuilder().addComponents(streakBonusInput)
        ];

        modal.addComponents(...rows);
        await interaction.showModal(modal);
    }

    async showDailyCooldownModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('daily_cooldown_modal')
            .setTitle('⏰ Cooldown Daily');

        const cooldownInput = new TextInputBuilder()
            .setCustomId('daily_cooldown_hours')
            .setLabel('Cooldown en heures')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('24')
            .setValue('24')
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(cooldownInput);
        modal.addComponents(row);
        await interaction.showModal(modal);
    }

    // Modals pour Messages
    async showMessagesAmountModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('messages_amount_modal')
            .setTitle('💰 Montant par Message');

        const amountInput = new TextInputBuilder()
            .setCustomId('messages_amount_value')
            .setLabel('Argent par message (€)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('1')
            .setValue('1')
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(amountInput);
        modal.addComponents(row);
        await interaction.showModal(modal);
    }

    async showMessagesCooldownModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('messages_cooldown_modal')
            .setTitle('⏰ Cooldown Messages');

        const cooldownInput = new TextInputBuilder()
            .setCustomId('messages_cooldown_seconds')
            .setLabel('Cooldown en secondes')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('60')
            .setValue('60')
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(cooldownInput);
        modal.addComponents(row);
        await interaction.showModal(modal);
    }

    // Toggles
    async toggleDailySystem(interaction) {
        // Logique toggle daily
        await interaction.reply({ content: '📅 Toggle daily implémenté !', flags: 64 });
    }

    async toggleMessagesSystem(interaction) {
        // Logique toggle messages
        await interaction.reply({ content: '💬 Toggle messages implémenté !', flags: 64 });
    }

    // Méthodes d'alias pour compatibilité
    async handleMainMenu(interaction) {
        await this.showMainConfigMenu(interaction);
    }

    // Gestion des sélections d'actions spécifiques
    async handleActionSelection(interaction) {
        const action = interaction.values[0];
        
        if (action === 'back_main') {
            await this.showMainConfigMenu(interaction);
            return;
        }
        
        // Afficher la configuration spécifique de l'action
        await this.showActionSpecificConfig(interaction, action);
    }

    // Configuration détaillée d'une action spécifique
    async showActionSpecificConfig(interaction, actionName) {
        const actionEmojis = {
            'travailler': '💼',
            'pecher': '🎣',
            'donner': '💝',
            'voler': '💰',
            'crime': '🔫',
            'parier': '🎲'
        };
        
        const actionTitles = {
            'travailler': 'Travailler',
            'pecher': 'Pêcher',
            'donner': 'Donner',
            'voler': 'Voler',
            'crime': 'Crime',
            'parier': 'Parier'
        };

        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const actionConfig = economyConfig.actions?.[actionName] || {
            enabled: true,
            minReward: 10,
            maxReward: 50,
            cooldown: 60,
            goodKarma: actionName === 'travailler' || actionName === 'pecher' || actionName === 'donner' ? 1 : 0,
            badKarma: actionName === 'voler' || actionName === 'crime' || actionName === 'parier' ? 1 : 0
        };

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle(`${actionEmojis[actionName]} Configuration ${actionTitles[actionName]}`)
            .setDescription(`Configurez les paramètres de l'action ${actionTitles[actionName]}`)
            .addFields([
                {
                    name: '💰 Récompenses',
                    value: `${actionConfig.minReward}€ - ${actionConfig.maxReward}€`,
                    inline: true
                },
                {
                    name: '⏱️ Cooldown',
                    value: `${actionConfig.cooldown} secondes`,
                    inline: true
                },
                {
                    name: '✅ Status',
                    value: actionConfig.enabled ? 'Activé' : 'Désactivé',
                    inline: true
                },
                {
                    name: '😇 Karma Positif',
                    value: `+${actionConfig.goodKarma}`,
                    inline: true
                },
                {
                    name: '😈 Karma Négatif',
                    value: `+${actionConfig.badKarma}`,
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`action_config_${actionName}`)
            .setPlaceholder('Modifier les paramètres...')
            .addOptions([
                {
                    label: '💰 Récompenses',
                    value: `rewards_${actionName}`,
                    description: 'Modifier min/max récompenses',
                    emoji: '💰'
                },
                {
                    label: '⏱️ Cooldown',
                    value: `cooldown_${actionName}`,
                    description: 'Modifier le temps d\'attente',
                    emoji: '⏱️'
                },
                {
                    label: '⚖️ Karma',
                    value: `karma_${actionName}`,
                    description: 'Modifier les effets karma',
                    emoji: '⚖️'
                },
                {
                    label: '🔄 Toggle',
                    value: `toggle_${actionName}`,
                    description: 'Activer/désactiver cette action',
                    emoji: '🔄'
                },
                {
                    label: '↩️ Retour Actions',
                    value: 'back_actions',
                    description: 'Retour au menu actions'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        await interaction.update({ embeds: [embed], components: [row] });
    }

    // Handlers pour les sous-menus de configuration
    async handleKarmaConfig(interaction) {
        const option = interaction.values[0];
        
        switch (option) {
            case 'karma_rewards':
                await this.showKarmaRewardsConfig(interaction);
                break;
            case 'karma_autoreset':
                await this.toggleKarmaAutoReset(interaction);
                break;
            case 'karma_resetday':
                await this.showKarmaResetDaySelector(interaction);
                break;
            case 'karma_stats':
                await this.showKarmaStats(interaction);
                break;
            case 'karma_reset_all':
                await this.showKarmaResetConfirmation(interaction);
                break;
            case 'back_main':
                await this.showMainConfigMenu(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Option karma non reconnue', flags: 64 });
        }
    }

    async handleShopConfig(interaction) {
        const option = interaction.values[0];
        
        switch (option) {
            case 'shop_list':
                await this.showShopList(interaction);
                break;
            case 'shop_create_custom':
                await this.showCustomObjectModal(interaction);
                break;
            case 'shop_create_temp_role':
                await this.showTempRoleSelector(interaction);
                break;
            case 'shop_create_perm_role':
                await this.showPermRoleSelector(interaction);
                break;
            case 'shop_manage_items':
                await this.showShopManagement(interaction);
                break;

            case 'shop_karma_discounts':
                await this.showKarmaDiscountsConfig(interaction);
                break;
            case 'shop_access':
                await interaction.reply({ content: '🔧 Configuration accès boutique en développement', flags: 64 });
                break;
            case 'back_main':
                await this.showMainConfigMenu(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Option boutique non reconnue', flags: 64 });
        }
    }

    async showDailyConfig(interaction) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const dailyConfig = economyConfig.daily || { amount: 100, enabled: true };

        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('📅 Configuration Daily Rewards')
            .setDescription('Système de récompenses quotidiennes')
            .addFields([
                {
                    name: '💰 Montant Actuel',
                    value: `${dailyConfig.amount}€`,
                    inline: true
                },
                {
                    name: '🔄 Statut',
                    value: dailyConfig.enabled ? '✅ Activé' : '❌ Désactivé',
                    inline: true
                },
                {
                    name: '📝 Configuration',
                    value: 'Utilisez les options ci-dessous pour modifier les paramètres',
                    inline: false
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_daily_config')
            .setPlaceholder('Configuration daily...')
            .addOptions([
                {
                    label: '💰 Modifier Montant',
                    value: 'daily_amount',
                    description: `Changer le montant daily (actuellement ${dailyConfig.amount}€)`,
                    emoji: '💰'
                },
                {
                    label: '🔄 Toggle Activation',
                    value: 'daily_toggle',
                    description: dailyConfig.enabled ? 'Désactiver daily rewards' : 'Activer daily rewards',
                    emoji: '🔄'
                },
                {
                    label: '↩️ Retour Menu Principal',
                    value: 'back_main',
                    description: 'Retour au menu économie'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async handleDailyConfig(interaction) {
        const option = interaction.values[0];
        
        switch (option) {
            case 'daily_amount':
                await this.showDailyAmountModal(interaction);
                break;
            case 'daily_toggle':
                await this.toggleDailySystem(interaction);
                break;
            case 'back_main':
                await this.showMainConfigMenu(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Option daily non reconnue', flags: 64 });
        }
    }

    async showDailyAmountModal(interaction) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const currentAmount = economyConfig.daily?.amount || 100;

        const modal = new ModalBuilder()
            .setCustomId('economy_daily_amount_modal')
            .setTitle('💰 Configurer Montant Daily');

        const amountInput = new TextInputBuilder()
            .setCustomId('daily_amount')
            .setLabel('Montant Daily (1-1000€)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('100')
            .setValue(`${currentAmount}`)
            .setMinLength(1)
            .setMaxLength(4)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(amountInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    async toggleDailySystem(interaction) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        
        if (!economyConfig.daily) {
            economyConfig.daily = { amount: 100, enabled: true };
        }
        
        economyConfig.daily.enabled = !economyConfig.daily.enabled;
        await this.dataManager.saveData('economy.json', economyConfig);

        await interaction.update({
            content: `✅ Daily rewards ${economyConfig.daily.enabled ? 'activé' : 'désactivé'}`,
            embeds: [],
            components: []
        });

        // Ne pas retourner automatiquement au menu pour éviter les erreurs d'interaction
    }

    async handleDailyAmountModal(interaction) {
        const amountStr = interaction.fields.getTextInputValue('daily_amount');
        const amount = parseInt(amountStr);
        
        if (isNaN(amount) || amount < 1 || amount > 1000) {
            await interaction.reply({ 
                content: '❌ Montant invalide. Veuillez entrer un nombre entre 1 et 1000€.', 
                flags: 64 
            });
            return;
        }

        const economyConfig = await this.dataManager.loadData('economy.json', {});
        
        if (!economyConfig.daily) {
            economyConfig.daily = { amount: 100, enabled: true };
        }
        
        economyConfig.daily.amount = amount;
        await this.dataManager.saveData('economy.json', economyConfig);

        await interaction.reply({
            content: `✅ Montant daily mis à jour : **${amount}€**`,
            flags: 64
        });

        // Ne pas retourner automatiquement au menu pour éviter les erreurs d'interaction
    }

    async showKarmaRewardsConfig(interaction) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const karmaRewards = economyConfig.karmaRewards || [];

        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('🎁 Récompenses/Sanctions Karma')
            .setDescription('Système automatique de récompenses basé sur le karma')
            .addFields([
                {
                    name: '📊 Niveaux Configurés',
                    value: karmaRewards.length > 0 ? `${karmaRewards.length} niveaux` : 'Aucun niveau configuré',
                    inline: true
                },
                {
                    name: '⚡ Déclenchement',
                    value: 'Automatique à chaque action',
                    inline: true
                },
                {
                    name: '🔧 Configuration',
                    value: 'Utilisez les options ci-dessous pour gérer les récompenses',
                    inline: false
                }
            ]);

        if (karmaRewards.length > 0) {
            const rewardsList = karmaRewards
                .sort((a, b) => b.karmaThreshold - a.karmaThreshold)
                .slice(0, 5) // Afficher seulement les 5 premiers
                .map(reward => {
                    const type = reward.karmaThreshold >= 0 ? '😇' : '😈';
                    const money = reward.moneyReward > 0 ? `+${reward.moneyReward}€` : reward.moneyReward < 0 ? `${reward.moneyReward}€` : '';
                    const role = reward.roleId ? `Rôle ${reward.roleDuration ? `(${reward.roleDuration}h)` : '(permanent)'}` : '';
                    const description = money && role ? `${money}, ${role}` : money || role || 'Aucune action';
                    return `${type} **${reward.name}** (${reward.karmaThreshold} karma)\n└ ${description}`;
                })
                .join('\n\n');
            
            embed.addFields([{
                name: '📋 Niveaux Actuels',
                value: rewardsList,
                inline: false
            }]);
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_rewards_config')
            .setPlaceholder('Gestion récompenses karma...')
            .addOptions([
                {
                    label: '➕ Créer Niveau',
                    value: 'karma_create_type_select',
                    description: 'Créer un nouveau niveau de récompense/sanction',
                    emoji: '➕'
                },
                {
                    label: '✏️ Modifier Niveau',
                    value: 'karma_edit_level',
                    description: 'Modifier un niveau existant',
                    emoji: '✏️'
                },
                {
                    label: '🗑️ Supprimer Niveau',
                    value: 'karma_delete_level',
                    description: 'Supprimer un niveau existant',
                    emoji: '🗑️'
                },
                {
                    label: '🧪 Tester Système',
                    value: 'karma_test_system',
                    description: 'Tester les récompenses automatiques',
                    emoji: '🧪'
                },
                {
                    label: '↩️ Retour Karma',
                    value: 'back_karma',
                    description: 'Retour au menu karma'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }



    async showKarmaTypeSelector(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('⚖️ Type de Niveau Karma')
            .setDescription('Choisissez le type d\'action à effectuer')
            .addFields([
                { 
                    name: '😇 Récompense (Karma Positif)', 
                    value: 'Pour les actions bonnes\n• Gains d\'argent\n• Rôles privilégiés\n• Avantages', 
                    inline: true 
                },
                { 
                    name: '😈 Sanction (Karma Négatif)', 
                    value: 'Pour les actions mauvaises\n• Pertes d\'argent\n• Rôles de punition\n• Désavantages', 
                    inline: true 
                },
                { 
                    name: '🎭 Rôle Temporaire', 
                    value: 'Ajouter rôle à niveau existant\n• Sélection niveau karma\n• Choix rôle Discord\n• Durée 1-7 jours', 
                    inline: false 
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_type_select')
            .setPlaceholder('Choisir le type de niveau...')
            .addOptions([
                {
                    label: '😇 Créer Récompense',
                    value: 'karma_create_reward',
                    description: 'Niveau pour karma positif (actions bonnes)',
                    emoji: '😇'
                },
                {
                    label: '😈 Créer Sanction',
                    value: 'karma_create_sanction',
                    description: 'Niveau pour karma négatif (actions mauvaises)',
                    emoji: '😈'
                },
                {
                    label: '🎭 Ajouter Rôle Temporaire',
                    value: 'karma_add_temp_role',
                    description: 'Ajouter un rôle temporaire à un niveau existant',
                    emoji: '🎭'
                },
                {
                    label: '🧪 Tester Système',
                    value: 'karma_test_system',
                    description: 'Tester l\'application automatique des récompenses'
                },
                {
                    label: '↩️ Retour Récompenses',
                    value: 'back_karma_rewards',
                    description: 'Retour au menu récompenses'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async showKarmaLevelModal(interaction, type = null) {
        const isReward = type === 'reward';
        const isSanction = type === 'sanction';
        
        let title = '🎁 Créer Niveau Karma';
        let thresholdLabel = 'Seuil Karma Net (-999 à +999)';
        let thresholdPlaceholder = 'Ex: 10, -5, 0...';
        let moneyLabel = 'Gain/Perte Argent (-999999 à +999999€)';
        let moneyPlaceholder = 'Ex: 100, -50, 0...';
        
        if (isReward) {
            title = '😇 Créer Récompense Karma';
            thresholdLabel = 'Seuil Karma Positif (1 à 999)';
            thresholdPlaceholder = 'Ex: 10, 50, 100...';
        } else if (isSanction) {
            title = '😈 Créer Sanction Karma';
            thresholdLabel = 'Seuil Karma Négatif (-999 à -1)';
            thresholdPlaceholder = 'Ex: -10, -50, -100...';
        }
        
        // Argent flexible pour tous les types
        moneyLabel = 'Argent (-999,999€ à 999,999€)';
        moneyPlaceholder = 'Ex: 100, -500, 1000, -2000...';

        const modal = new ModalBuilder()
            .setCustomId(`economy_karma_level_modal_${type || 'general'}`)
            .setTitle(title);

        const nameInput = new TextInputBuilder()
            .setCustomId('karma_name')
            .setLabel('Nom du Niveau')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(isReward ? 'Ex: Champion, Saint, Héros...' : isSanction ? 'Ex: Voyou, Demon, Banni...' : 'Ex: Saint, Demon, Neutre...')
            .setMinLength(3)
            .setMaxLength(30)
            .setRequired(true);

        const thresholdInput = new TextInputBuilder()
            .setCustomId('karma_threshold')
            .setLabel(thresholdLabel)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(thresholdPlaceholder)
            .setMinLength(1)
            .setMaxLength(4)
            .setRequired(true);

        const moneyInput = new TextInputBuilder()
            .setCustomId('karma_money')
            .setLabel('Argent (-999,999€ à 999,999€)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 100, -500, 1000, -2000...')
            .setMinLength(1)
            .setMaxLength(8)
            .setRequired(false);

        const rows = [
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(thresholdInput),
            new ActionRowBuilder().addComponents(moneyInput)
        ];

        modal.addComponents(...rows);
        await interaction.showModal(modal);
    }

    async handleKarmaLevelModal(interaction) {
        const name = interaction.fields.getTextInputValue('karma_name');
        const thresholdStr = interaction.fields.getTextInputValue('karma_threshold');
        const moneyStr = interaction.fields.getTextInputValue('karma_money') || '0';

        // Déterminer le type depuis l'ID du modal
        const modalType = interaction.customId.split('_').pop();
        const isReward = modalType === 'reward';
        const isSanction = modalType === 'sanction';

        // Validation seuil karma
        const threshold = parseInt(thresholdStr);
        if (isNaN(threshold)) {
            await interaction.reply({ 
                content: '❌ Seuil karma invalide. Entrez un nombre valide.', 
                flags: 64 
            });
            return;
        }

        // Validation spécifique selon le type
        if (isReward && threshold <= 0) {
            await interaction.reply({ 
                content: '❌ Pour une récompense, le seuil karma doit être positif (1 à 999).', 
                flags: 64 
            });
            return;
        }

        if (isSanction && threshold >= 0) {
            await interaction.reply({ 
                content: '❌ Pour une sanction, le seuil karma doit être négatif (-999 à -1).', 
                flags: 64 
            });
            return;
        }

        if (!isReward && !isSanction && (threshold < -999 || threshold > 999)) {
            await interaction.reply({ 
                content: '❌ Seuil karma invalide. Entrez un nombre entre -999 et +999.', 
                flags: 64 
            });
            return;
        }

        // Validation montant argent
        const money = parseInt(moneyStr);
        if (isNaN(money)) {
            await interaction.reply({ 
                content: '❌ Montant argent invalide. Entrez un nombre valide.', 
                flags: 64 
            });
            return;
        }

        if (Math.abs(money) > 999999) {
            await interaction.reply({ 
                content: '❌ Le montant ne peut pas dépasser 999,999€ en valeur absolue.', 
                flags: 64 
            });
            return;
        }

        // Sauvegarder le niveau
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        if (!economyConfig.karmaRewards) {
            economyConfig.karmaRewards = [];
        }

        const newLevel = {
            id: Date.now(),
            name: name,
            karmaThreshold: threshold,
            moneyReward: money,
            roleId: null,
            roleDuration: null,
            createdAt: new Date().toISOString()
        };

        economyConfig.karmaRewards.push(newLevel);
        await this.dataManager.saveData('economy.json', economyConfig);

        const type = threshold >= 0 ? '😇' : '😈';
        const moneyDisplay = money > 0 ? `+${money}€` : money < 0 ? `${money}€` : 'Aucun gain';

        await interaction.reply({
            content: `✅ Niveau karma créé !\n\n${type} **${name}** (${threshold} karma)\n💰 ${moneyDisplay}\n\n💡 Vous pouvez maintenant ajouter un rôle temporaire via le menu suivant.`,
            flags: 64
        });
    }

    async showKarmaEditMenu(interaction) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const karmaRewards = economyConfig.karmaRewards || [];

        if (karmaRewards.length === 0) {
            await interaction.reply({ 
                content: '❌ Aucun niveau karma configuré à modifier. Créez d\'abord un niveau.', 
                flags: 64 
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('✏️ Modifier Niveau Karma')
            .setDescription('Sélectionnez le niveau à modifier');

        const options = karmaRewards
            .sort((a, b) => b.karmaThreshold - a.karmaThreshold)
            .slice(0, 25) // Limite Discord
            .map(reward => {
                const type = reward.karmaThreshold >= 0 ? '😇' : '😈';
                const money = reward.moneyReward > 0 ? `+${reward.moneyReward}€` : reward.moneyReward < 0 ? `${reward.moneyReward}€` : '';
                const role = reward.roleId ? `Rôle` : '';
                const description = money && role ? `${money}, ${role}` : money || role || 'Aucune action';
                
                return {
                    label: `${type} ${reward.name}`,
                    value: `edit_karma_${reward.id}`,
                    description: `Seuil: ${reward.karmaThreshold} - ${description}`
                };
            });

        options.push({
            label: '↩️ Retour Récompenses',
            value: 'back_karma_rewards',
            description: 'Retour au menu récompenses karma'
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_edit_select')
            .setPlaceholder('Choisir niveau à modifier...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    }

    async showKarmaDeleteMenu(interaction) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const karmaRewards = economyConfig.karmaRewards || [];

        if (karmaRewards.length === 0) {
            await interaction.reply({ 
                content: '❌ Aucun niveau karma configuré à supprimer. Créez d\'abord un niveau.', 
                flags: 64 
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🗑️ Supprimer Niveau Karma')
            .setDescription('⚠️ Sélectionnez le niveau à supprimer définitivement');

        const options = karmaRewards
            .sort((a, b) => b.karmaThreshold - a.karmaThreshold)
            .slice(0, 25) // Limite Discord
            .map(reward => {
                const type = reward.karmaThreshold >= 0 ? '😇' : '😈';
                const money = reward.moneyReward > 0 ? `+${reward.moneyReward}€` : reward.moneyReward < 0 ? `${reward.moneyReward}€` : '';
                const role = reward.roleId ? `Rôle` : '';
                const description = money && role ? `${money}, ${role}` : money || role || 'Aucune action';
                
                return {
                    label: `${type} ${reward.name}`,
                    value: `delete_karma_${reward.id}`,
                    description: `Seuil: ${reward.karmaThreshold} - ${description}`
                };
            });

        options.push({
            label: '↩️ Retour Récompenses',
            value: 'back_karma_rewards',
            description: 'Retour au menu récompenses karma'
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_delete_select')
            .setPlaceholder('Choisir niveau à supprimer...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    }

    async testKarmaSystem(interaction) {
        await interaction.reply({ content: '🔧 Test système karma en développement', flags: 64 });
    }

    async showKarmaEditModal(interaction, karmaId) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const karmaRewards = economyConfig.karmaRewards || [];
        const reward = karmaRewards.find(r => r.id == karmaId);

        if (!reward) {
            await interaction.reply({ content: '❌ Niveau karma introuvable', flags: 64 });
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId(`economy_karma_edit_modal_${karmaId}`)
            .setTitle(`✏️ Modifier: ${reward.name}`);

        const nameInput = new TextInputBuilder()
            .setCustomId('karma_name')
            .setLabel('Nom du Niveau')
            .setStyle(TextInputStyle.Short)
            .setValue(reward.name)
            .setMinLength(3)
            .setMaxLength(30)
            .setRequired(true);

        const thresholdInput = new TextInputBuilder()
            .setCustomId('karma_threshold')
            .setLabel('Seuil Karma Net (-999 à +999)')
            .setStyle(TextInputStyle.Short)
            .setValue(reward.karmaThreshold.toString())
            .setMinLength(1)
            .setMaxLength(4)
            .setRequired(true);

        const moneyInput = new TextInputBuilder()
            .setCustomId('karma_money')
            .setLabel('Gain/Perte Argent (-999999 à +999999€)')
            .setStyle(TextInputStyle.Short)
            .setValue(reward.moneyReward?.toString() || '0')
            .setMinLength(1)
            .setMaxLength(7)
            .setRequired(false);

        const roleInput = new TextInputBuilder()
            .setCustomId('karma_role')
            .setLabel('ID Rôle (optionnel)')
            .setStyle(TextInputStyle.Short)
            .setValue(reward.roleId || '')
            .setMinLength(0)
            .setMaxLength(25)
            .setRequired(false);

        const durationInput = new TextInputBuilder()
            .setCustomId('karma_duration')
            .setLabel('Durée Rôle en Heures (vide = permanent)')
            .setStyle(TextInputStyle.Short)
            .setValue(reward.roleDuration?.toString() || '')
            .setMinLength(0)
            .setMaxLength(4)
            .setRequired(false);

        const rows = [
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(thresholdInput),
            new ActionRowBuilder().addComponents(moneyInput),
            new ActionRowBuilder().addComponents(roleInput),
            new ActionRowBuilder().addComponents(durationInput)
        ];

        modal.addComponents(...rows);
        await interaction.showModal(modal);
    }

    async confirmKarmaDelete(interaction, karmaId) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const karmaRewards = economyConfig.karmaRewards || [];
        const reward = karmaRewards.find(r => r.id == karmaId);

        if (!reward) {
            await interaction.reply({ content: '❌ Niveau karma introuvable', flags: 64 });
            return;
        }

        const type = reward.karmaThreshold >= 0 ? '😇' : '😈';
        const money = reward.moneyReward > 0 ? `+${reward.moneyReward}€` : reward.moneyReward < 0 ? `${reward.moneyReward}€` : 'Aucun gain';
        const role = reward.roleId ? `Rôle ${reward.roleDuration ? `(${reward.roleDuration}h)` : '(permanent)'}` : 'Aucun rôle';

        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🗑️ Confirmer Suppression')
            .setDescription(`⚠️ **Suppression définitive**\n\n${type} **${reward.name}** (${reward.karmaThreshold} karma)\n💰 ${money}\n🎭 ${role}`)
            .setFooter({ text: 'Cette action est irréversible' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_delete_confirm')
            .setPlaceholder('Confirmer la suppression...')
            .addOptions([
                {
                    label: '✅ Confirmer Suppression',
                    value: `confirm_delete_${karmaId}`,
                    description: 'Supprimer définitivement ce niveau',
                    emoji: '⚠️'
                },
                {
                    label: '❌ Annuler',
                    value: 'back_karma_rewards',
                    description: 'Retour sans supprimer'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    }

    async handleKarmaEditModal(interaction) {
        const karmaId = interaction.customId.split('_').pop();
        const name = interaction.fields.getTextInputValue('karma_name');
        const thresholdStr = interaction.fields.getTextInputValue('karma_threshold');
        const moneyStr = interaction.fields.getTextInputValue('karma_money') || '0';
        const roleIdStr = interaction.fields.getTextInputValue('karma_role') || '';
        const durationStr = interaction.fields.getTextInputValue('karma_duration') || '';

        // Validation (même logique que création)
        const threshold = parseInt(thresholdStr);
        if (isNaN(threshold) || threshold < -999 || threshold > 999) {
            await interaction.reply({ 
                content: '❌ Seuil karma invalide. Entrez un nombre entre -999 et +999.', 
                flags: 64 
            });
            return;
        }

        const money = parseInt(moneyStr);
        if (isNaN(money) || money < -999999 || money > 999999) {
            await interaction.reply({ 
                content: '❌ Montant argent invalide. Entrez un nombre entre -999999 et +999999.', 
                flags: 64 
            });
            return;
        }



        // Mise à jour du niveau
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const karmaRewards = economyConfig.karmaRewards || [];
        const rewardIndex = karmaRewards.findIndex(r => r.id == karmaId);

        if (rewardIndex === -1) {
            await interaction.reply({ content: '❌ Niveau karma introuvable', flags: 64 });
            return;
        }

        karmaRewards[rewardIndex] = {
            ...karmaRewards[rewardIndex],
            name: name,
            karmaThreshold: threshold,
            moneyReward: money,
            roleId: roleIdStr || null,
            roleDuration: duration,
            updatedAt: new Date().toISOString()
        };

        economyConfig.karmaRewards = karmaRewards;
        await this.dataManager.saveData('economy.json', economyConfig);

        const type = threshold >= 0 ? '😇' : '😈';
        const moneyDisplay = money > 0 ? `+${money}€` : money < 0 ? `${money}€` : 'Aucun gain';
        const roleDisplay = roleIdStr ? `Rôle ${duration ? `(${duration}h)` : '(permanent)'}` : 'Aucun rôle';

        await interaction.reply({
            content: `✅ Niveau karma modifié !\n\n${type} **${name}** (${threshold} karma)\n💰 ${moneyDisplay}\n🎭 ${roleDisplay}`,
            flags: 64
        });
    }

    async showKarmaLevelSelector(interaction, purpose = 'temp_role') {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const karmaRewards = economyConfig.karmaRewards || [];

        if (karmaRewards.length === 0) {
            await interaction.reply({
                content: '❌ Aucun niveau karma configuré. Veuillez d\'abord créer des niveaux karma.',
                flags: 64
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('🎭 Sélection Niveau Karma')
            .setDescription('Choisissez le niveau karma pour ajouter un rôle temporaire')
            .addFields([
                {
                    name: '📝 Étapes',
                    value: '1️⃣ Sélectionner le niveau karma\n2️⃣ Choisir le rôle Discord\n3️⃣ Définir la durée (1-7 jours)',
                    inline: false
                }
            ]);

        const options = karmaRewards
            .sort((a, b) => b.karmaThreshold - a.karmaThreshold)
            .slice(0, 25) // Discord limit
            .map(reward => {
                const type = reward.karmaThreshold >= 0 ? '😇' : '😈';
                const money = reward.moneyReward > 0 ? `+${reward.moneyReward}€` : reward.moneyReward < 0 ? `${reward.moneyReward}€` : '';
                const hasRole = reward.roleId ? '🎭' : '❌';
                return {
                    label: `${type} ${reward.name} (${reward.karmaThreshold} karma)`,
                    value: `select_level_${reward.id}`,
                    description: `${money} ${hasRole} Rôle: ${reward.roleId ? 'Configuré' : 'Aucun'}`,
                    emoji: type
                };
            });

        options.push({
            label: '↩️ Retour Récompenses',
            value: 'back_karma_rewards',
            description: 'Retour au menu récompenses',
            emoji: '↩️'
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_level_select')
            .setPlaceholder('Choisir un niveau karma...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async showRoleSelector(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('🎭 Créer Rôle Temporaire')
            .setDescription('Choisissez le rôle Discord à utiliser pour les récompenses karma')
            .addFields([
                {
                    name: '📝 Étape 1/2',
                    value: '🎭 Sélectionner le rôle Discord',
                    inline: false
                },
                {
                    name: '📋 Instructions',
                    value: '• Sélectionnez un rôle existant du serveur\n• Le rôle sera attribué temporairement\n• Durée configurable ensuite (1-7 jours)',
                    inline: false
                }
            ]);

        // Utiliser RoleSelectMenuBuilder pour sélectionner un rôle
        const roleSelectMenu = new RoleSelectMenuBuilder()
            .setCustomId('karma_temp_role_select')
            .setPlaceholder('Choisir un rôle Discord...')
            .setMinValues(1)
            .setMaxValues(1);

        const backButton = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_type_select')
            .setPlaceholder('↩️ Retour menu type')
            .addOptions([{
                label: '↩️ Retour Type Karma',
                value: 'back_karma_type',
                description: 'Retour au sélecteur de type'
            }]);

        const rows = [
            new ActionRowBuilder().addComponents(roleSelectMenu),
            new ActionRowBuilder().addComponents(backButton)
        ];
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: rows });
        } else {
            await interaction.reply({ embeds: [embed], components: rows, flags: 64 });
        }
    }

    async showTempRoleTypeSelector(interaction, roleId) {
        const role = interaction.guild.roles.cache.get(roleId);
        const roleName = role ? role.name : 'Rôle inconnu';

        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('⚖️ Type de Rôle Temporaire')
            .setDescription(`**Rôle:** 🎭 ${roleName}\n\nChoisissez le type de karma pour ce rôle`)
            .addFields([
                {
                    name: '📝 Étape 2/3',
                    value: '⚖️ Définir le type de karma',
                    inline: false
                },
                {
                    name: '😇 Récompense',
                    value: 'Pour karma positif (actions bonnes)',
                    inline: true
                },
                {
                    name: '😈 Sanction',
                    value: 'Pour karma négatif (actions mauvaises)',
                    inline: true
                }
            ]);

        const typeSelectMenu = new StringSelectMenuBuilder()
            .setCustomId(`karma_temp_type_select_${roleId}`)
            .setPlaceholder('Choisir le type de karma...')
            .addOptions([
                {
                    label: '😇 Récompense',
                    value: 'reward',
                    description: 'Rôle pour karma positif (actions bonnes)',
                    emoji: '😇'
                },
                {
                    label: '😈 Sanction',
                    value: 'sanction',
                    description: 'Rôle pour karma négatif (actions mauvaises)',
                    emoji: '😈'
                },
                {
                    label: '↩️ Retour Rôle',
                    value: 'back_role_select',
                    description: 'Retour sélection rôle'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(typeSelectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async showTempRoleModal(interaction, roleId, type) {
        if (type === 'back_role_select') {
            await this.showRoleSelector(interaction);
            return;
        }

        const role = interaction.guild.roles.cache.get(roleId);
        const roleName = role ? role.name : 'Rôle inconnu';
        const isReward = type === 'reward';

        const title = isReward ? '😇 Rôle Temporaire Récompense' : '😈 Rôle Temporaire Sanction';
        const thresholdLabel = isReward ? 'Seuil Karma Positif (1 à 999)' : 'Seuil Karma Négatif (-999 à -1)';
        const thresholdPlaceholder = isReward ? 'Ex: 10, 50, 100...' : 'Ex: -10, -50, -100...';

        const modal = new ModalBuilder()
            .setCustomId(`temp_role_modal_${roleId}_${type}`)
            .setTitle(title);

        const thresholdInput = new TextInputBuilder()
            .setCustomId('karma_threshold')
            .setLabel(thresholdLabel)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(thresholdPlaceholder)
            .setMinLength(1)
            .setMaxLength(4)
            .setRequired(true);

        const moneyInput = new TextInputBuilder()
            .setCustomId('money_reward')
            .setLabel('Argent (-999,999€ à 999,999€)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(`Ex: ${isReward ? '100, 500, 1000' : '-100, -500, -1000'}`)
            .setMinLength(1)
            .setMaxLength(8)
            .setRequired(true);

        const durationInput = new TextInputBuilder()
            .setCustomId('role_duration')
            .setLabel('Durée en Heures (1-168)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 24 (1 jour), 72 (3 jours), 168 (7 jours)')
            .setMinLength(1)
            .setMaxLength(3)
            .setRequired(true);

        const nameInput = new TextInputBuilder()
            .setCustomId('level_name')
            .setLabel('Nom du Niveau (optionnel)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(`Ex: ${isReward ? 'Champion, Saint, Héros' : 'Voyou, Demon, Banni'}`)
            .setMinLength(0)
            .setMaxLength(30)
            .setRequired(false);

        const rows = [
            new ActionRowBuilder().addComponents(thresholdInput),
            new ActionRowBuilder().addComponents(moneyInput),
            new ActionRowBuilder().addComponents(durationInput),
            new ActionRowBuilder().addComponents(nameInput)
        ];

        modal.addComponents(...rows);
        await interaction.showModal(modal);
    }

    async handleTempRoleModal(interaction) {
        const [, , modalType, roleId, type] = interaction.customId.split('_');
        const threshold = interaction.fields.getTextInputValue('karma_threshold');
        const moneyReward = interaction.fields.getTextInputValue('money_reward');
        const duration = interaction.fields.getTextInputValue('role_duration');
        const levelName = interaction.fields.getTextInputValue('level_name') || `Rôle ${type === 'reward' ? 'Récompense' : 'Sanction'}`;

        const role = interaction.guild.roles.cache.get(roleId);
        const roleName = role ? role.name : 'Rôle inconnu';
        const isReward = type === 'reward';

        // Validation seuil karma
        const karmaThreshold = parseInt(threshold);
        if (isNaN(karmaThreshold)) {
            await interaction.reply({ 
                content: '❌ Seuil karma invalide. Entrez un nombre valide.', 
                flags: 64 
            });
            return;
        }

        if (isReward && karmaThreshold <= 0) {
            await interaction.reply({ 
                content: '❌ Pour une récompense, le seuil karma doit être positif (1 à 999).', 
                flags: 64 
            });
            return;
        }

        if (!isReward && karmaThreshold >= 0) {
            await interaction.reply({ 
                content: '❌ Pour une sanction, le seuil karma doit être négatif (-999 à -1).', 
                flags: 64 
            });
            return;
        }

        // Validation argent
        const moneyAmount = parseInt(moneyReward);
        if (isNaN(moneyAmount)) {
            await interaction.reply({ 
                content: '❌ Montant argent invalide. Entrez un nombre valide.', 
                flags: 64 
            });
            return;
        }

        if (Math.abs(moneyAmount) > 999999) {
            await interaction.reply({ 
                content: '❌ Le montant ne peut pas dépasser 999,999€ en valeur absolue.', 
                flags: 64 
            });
            return;
        }

        if (moneyAmount === 0) {
            await interaction.reply({ 
                content: '❌ Le montant ne peut pas être 0. Entrez un montant entre -999,999€ et 999,999€.', 
                flags: 64 
            });
            return;
        }

        // Validation durée
        const roleDuration = parseInt(duration);
        if (isNaN(roleDuration) || roleDuration < 1 || roleDuration > 168) {
            await interaction.reply({ 
                content: '❌ Durée invalide. Entrez un nombre entre 1 et 168 heures.', 
                flags: 64 
            });
            return;
        }

        // Créer le niveau karma avec rôle temporaire
        const tempRole = {
            id: Date.now(),
            name: levelName,
            karmaThreshold: karmaThreshold,
            roleId: roleId,
            roleName: roleName,
            duration: roleDuration,
            moneyReward: moneyAmount,
            type: isReward ? 'reward' : 'sanction',
            isTemporary: true,
            createdAt: new Date().toISOString()
        };

        // Sauvegarder dans la configuration
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        if (!economyConfig.karmaRewards) {
            economyConfig.karmaRewards = [];
        }
        economyConfig.karmaRewards.push(tempRole);
        await this.dataManager.saveData('economy.json', economyConfig);

        const durationDays = Math.round(roleDuration / 24 * 10) / 10;
        const typeIcon = isReward ? '😇' : '😈';
        const moneySign = moneyAmount >= 0 ? '+' : '';

        await interaction.reply({
            content: `✅ **Rôle temporaire créé !**\n${typeIcon} **Niveau:** ${levelName}\n🎭 **Rôle:** ${roleName}\n⚖️ **Seuil:** ${karmaThreshold} karma\n💰 **Argent:** ${moneySign}${moneyAmount}€\n⏰ **Durée:** ${durationDays} jour${durationDays > 1 ? 's' : ''}\n\n*Le rôle sera attribué automatiquement quand les membres atteignent ce niveau de karma.*`,
            flags: 64
        });
    }

    async showDurationSelector(interaction, levelId, roleId) {
        // Récupérer les informations du niveau
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const karmaRewards = economyConfig.karmaRewards || [];
        const level = karmaRewards.find(r => r.id == levelId);

        if (!level) {
            await interaction.reply({
                content: '❌ Niveau karma introuvable.',
                flags: 64
            });
            return;
        }

        const type = level.karmaThreshold >= 0 ? '😇' : '😈';
        const role = interaction.guild.roles.cache.get(roleId);
        const roleName = role ? role.name : 'Rôle inconnu';

        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('⏰ Durée du Rôle')
            .setDescription(`**Niveau:** ${type} ${level.name} (${level.karmaThreshold} karma)\n**Rôle:** 🎭 ${roleName}\n\nChoisissez la durée d'attribution du rôle`)
            .addFields([
                {
                    name: '📝 Étape 3/3',
                    value: '⏰ Définir la durée d\'attribution',
                    inline: false
                }
            ]);

        const durationSelectMenu = new StringSelectMenuBuilder()
            .setCustomId(`karma_duration_select_${levelId}_${roleId}`)
            .setPlaceholder('Choisir la durée...')
            .addOptions([
                {
                    label: '1 jour',
                    value: '24',
                    description: '24 heures d\'attribution',
                    emoji: '1️⃣'
                },
                {
                    label: '2 jours',
                    value: '48',
                    description: '48 heures d\'attribution',
                    emoji: '2️⃣'
                },
                {
                    label: '3 jours',
                    value: '72',
                    description: '3 jours d\'attribution',
                    emoji: '3️⃣'
                },
                {
                    label: '4 jours',
                    value: '96',
                    description: '4 jours d\'attribution',
                    emoji: '4️⃣'
                },
                {
                    label: '5 jours',
                    value: '120',
                    description: '5 jours d\'attribution',
                    emoji: '5️⃣'
                },
                {
                    label: '6 jours',
                    value: '144',
                    description: '6 jours d\'attribution',
                    emoji: '6️⃣'
                },
                {
                    label: '7 jours',
                    value: '168',
                    description: '1 semaine d\'attribution',
                    emoji: '7️⃣'
                },
                {
                    label: '↩️ Retour Rôle',
                    value: `back_role_select_${levelId}`,
                    description: 'Retour sélection rôle'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(durationSelectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async handleKarmaDeleteConfirm(interaction) {
        const option = interaction.values[0];
        
        if (option === 'back_karma_rewards') {
            await this.showKarmaRewardsConfig(interaction);
            return;
        }

        if (option.startsWith('confirm_delete_')) {
            const karmaId = option.replace('confirm_delete_', '');
            
            const economyConfig = await this.dataManager.loadData('economy.json', {});
            const karmaRewards = economyConfig.karmaRewards || [];
            const rewardIndex = karmaRewards.findIndex(r => r.id == karmaId);

            if (rewardIndex === -1) {
                await interaction.reply({ content: '❌ Niveau karma introuvable', flags: 64 });
                return;
            }

            const deletedReward = karmaRewards[rewardIndex];
            karmaRewards.splice(rewardIndex, 1);
            
            economyConfig.karmaRewards = karmaRewards;
            await this.dataManager.saveData('economy.json', economyConfig);

            await interaction.reply({
                content: `✅ Niveau karma **${deletedReward.name}** supprimé définitivement.`,
                flags: 64
            });
        }
    }

    async showMessagesAmountModal(interaction) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const currentAmount = economyConfig.messages?.amount || 5;

        const modal = new ModalBuilder()
            .setCustomId('economy_messages_amount_modal')
            .setTitle('💰 Configurer Montant Messages');

        const amountInput = new TextInputBuilder()
            .setCustomId('messages_amount')
            .setLabel('Montant par Message (1-50€)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('5')
            .setValue(`${currentAmount}`)
            .setMinLength(1)
            .setMaxLength(2)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(amountInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    async showMessagesCooldownModal(interaction) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const currentCooldown = Math.round((economyConfig.messages?.cooldown || 60000) / 1000);

        const modal = new ModalBuilder()
            .setCustomId('economy_messages_cooldown_modal')
            .setTitle('⏰ Configurer Cooldown Messages');

        const cooldownInput = new TextInputBuilder()
            .setCustomId('messages_cooldown')
            .setLabel('Cooldown en Secondes (10-60s)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('60')
            .setValue(`${currentCooldown}`)
            .setMinLength(2)
            .setMaxLength(3)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(cooldownInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    async toggleMessagesSystem(interaction) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        
        if (!economyConfig.messages) {
            economyConfig.messages = { enabled: false, amount: 5, cooldown: 60000 };
        }
        
        economyConfig.messages.enabled = !economyConfig.messages.enabled;
        await this.dataManager.saveData('economy.json', economyConfig);

        await interaction.update({
            content: `✅ Gains par message ${economyConfig.messages.enabled ? 'activés' : 'désactivés'}`,
            embeds: [],
            components: []
        });
    }

    async handleMessagesAmountModal(interaction) {
        const amountStr = interaction.fields.getTextInputValue('messages_amount');
        const amount = parseInt(amountStr);
        
        if (isNaN(amount) || amount < 1 || amount > 50) {
            await interaction.reply({ 
                content: '❌ Montant invalide. Veuillez entrer un nombre entre 1 et 50€.', 
                flags: 64 
            });
            return;
        }

        const economyConfig = await this.dataManager.loadData('economy.json', {});
        
        if (!economyConfig.messages) {
            economyConfig.messages = { enabled: false, amount: 5, cooldown: 60000 };
        }
        
        economyConfig.messages.amount = amount;
        await this.dataManager.saveData('economy.json', economyConfig);

        await interaction.reply({
            content: `✅ Montant par message mis à jour : **${amount}€**`,
            flags: 64
        });
    }

    async handleMessagesCooldownModal(interaction) {
        const cooldownStr = interaction.fields.getTextInputValue('messages_cooldown');
        const cooldownSeconds = parseInt(cooldownStr);
        
        if (isNaN(cooldownSeconds) || cooldownSeconds < 10 || cooldownSeconds > 60) {
            await interaction.reply({ 
                content: '❌ Cooldown invalide. Veuillez entrer un nombre entre 10 et 60 secondes.', 
                flags: 64 
            });
            return;
        }

        const economyConfig = await this.dataManager.loadData('economy.json', {});
        
        if (!economyConfig.messages) {
            economyConfig.messages = { enabled: false, amount: 5, cooldown: 60000 };
        }
        
        economyConfig.messages.cooldown = cooldownSeconds * 1000; // Convertir en millisecondes
        await this.dataManager.saveData('economy.json', economyConfig);

        await interaction.reply({
            content: `✅ Cooldown messages mis à jour : **${cooldownSeconds}s**`,
            flags: 64
        });
    }

    async handleMessagesConfig(interaction) {
        const option = interaction.values[0];
        
        switch (option) {
            case 'messages_amount':
                await this.showMessagesAmountModal(interaction);
                break;
            case 'messages_cooldown':
                await this.showMessagesCooldownModal(interaction);
                break;
            case 'messages_toggle':
                await this.toggleMessagesSystem(interaction);
                break;
            case 'back_main':
                await this.showMainConfigMenu(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Option messages non reconnue', flags: 64 });
        }
    }

    async handleStatsConfig(interaction) {
        const option = interaction.values[0];
        
        switch (option) {
            case 'detailed_stats':
                await this.showDetailedStats(interaction);
                break;
            case 'backup_data':
                await interaction.reply({ content: '🔧 Backup données en développement', flags: 64 });
                break;
            case 'back_main':
                await this.showMainConfigMenu(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Option stats non reconnue', flags: 64 });
        }
    }

    // Méthodes utilitaires pour les actions de configuration
    async toggleKarmaAutoReset(interaction) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        if (!economyConfig.karma) economyConfig.karma = {};
        
        economyConfig.karma.autoReset = !economyConfig.karma.autoReset;
        await this.dataManager.saveData('economy.json', economyConfig);
        
        await interaction.reply({ 
            content: `✅ Auto-reset karma ${economyConfig.karma.autoReset ? 'activé' : 'désactivé'}`, 
            flags: 64 
        });
    }

    async showKarmaResetDaySelector(interaction) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const karmaConfig = economyConfig.karma || { resetDay: 'dimanche' };
        
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('📅 Jour de Reset Karma')
            .setDescription(`Choisissez le jour de reset hebdomadaire automatique du karma`)
            .addFields([
                {
                    name: '📅 Jour Actuel',
                    value: `**${karmaConfig.resetDay || 'dimanche'}**`,
                    inline: true
                },
                {
                    name: '🔄 Auto-Reset',
                    value: karmaConfig.autoReset ? '✅ Activé' : '❌ Désactivé',
                    inline: true
                },
                {
                    name: 'ℹ️ Information',
                    value: 'Le reset automatique remet à zéro le karma bon et mauvais de tous les membres chaque semaine.',
                    inline: false
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('karma_reset_day_select')
            .setPlaceholder('Sélectionnez le jour de reset...')
            .addOptions([
                {
                    label: '📅 Lundi',
                    value: 'lundi',
                    description: 'Reset chaque lundi à minuit',
                    emoji: '1️⃣'
                },
                {
                    label: '📅 Mardi',
                    value: 'mardi',
                    description: 'Reset chaque mardi à minuit',
                    emoji: '2️⃣'
                },
                {
                    label: '📅 Mercredi',
                    value: 'mercredi',
                    description: 'Reset chaque mercredi à minuit',
                    emoji: '3️⃣'
                },
                {
                    label: '📅 Jeudi',
                    value: 'jeudi',
                    description: 'Reset chaque jeudi à minuit',
                    emoji: '4️⃣'
                },
                {
                    label: '📅 Vendredi',
                    value: 'vendredi',
                    description: 'Reset chaque vendredi à minuit',
                    emoji: '5️⃣'
                },
                {
                    label: '📅 Samedi',
                    value: 'samedi',
                    description: 'Reset chaque samedi à minuit',
                    emoji: '6️⃣'
                },
                {
                    label: '📅 Dimanche',
                    value: 'dimanche',
                    description: 'Reset chaque dimanche à minuit',
                    emoji: '7️⃣'
                },
                {
                    label: '↩️ Retour Karma',
                    value: 'back_karma',
                    description: 'Retour au menu karma'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async handleKarmaResetDaySelection(interaction) {
        const selectedDay = interaction.values[0];
        
        if (selectedDay === 'back_karma') {
            await this.showKarmaConfig(interaction);
            return;
        }
        
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        if (!economyConfig.karma) economyConfig.karma = {};
        
        economyConfig.karma.resetDay = selectedDay;
        await this.dataManager.saveData('economy.json', economyConfig);
        
        const dayNames = {
            'lundi': 'Lundi',
            'mardi': 'Mardi', 
            'mercredi': 'Mercredi',
            'jeudi': 'Jeudi',
            'vendredi': 'Vendredi',
            'samedi': 'Samedi',
            'dimanche': 'Dimanche'
        };
        
        await interaction.reply({
            content: `✅ **Jour de reset karma défini !**\n📅 Nouveau jour : **${dayNames[selectedDay]}**\n⏰ Le reset aura lieu chaque ${dayNames[selectedDay].toLowerCase()} à minuit`,
            flags: 64
        });
    }

    async showShopList(interaction) {
        const guildId = interaction.guild.id;
        const shopData = await this.dataManager.loadData('shop.json', {});
        const guildShop = shopData[guildId] || [];
        
        if (guildShop.length === 0) {
            await interaction.reply({ 
                content: '📦 Aucun article dans la boutique. Utilisez `/boutique` pour ajouter des articles.', 
                flags: 64 
            });
            return;
        }
        
        const itemsList = guildShop.map((item, index) => 
            `${index + 1}. ${item.name} - ${item.price}€`
        ).join('\n');
        
        await interaction.reply({ 
            content: `📦 **Articles de la boutique:**\n\`\`\`${itemsList}\`\`\``, 
            flags: 64 
        });
    }

    // Méthodes pour la création d'articles boutique
    async showCustomObjectModal(interaction) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId('custom_object_modal')
            .setTitle('🎨 Créer Objet Personnalisé');

        const nameInput = new TextInputBuilder()
            .setCustomId('object_name')
            .setLabel('Nom de l\'objet')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(50)
            .setPlaceholder('Ex: Épée légendaire')
            .setRequired(true);

        const priceInput = new TextInputBuilder()
            .setCustomId('object_price')
            .setLabel('Prix (en €)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(10)
            .setPlaceholder('Ex: 500')
            .setRequired(true);

        const descInput = new TextInputBuilder()
            .setCustomId('object_description')
            .setLabel('Description (optionnelle)')
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(0)
            .setMaxLength(200)
            .setPlaceholder('Description de l\'objet...')
            .setRequired(false);

        const nameRow = new ActionRowBuilder().addComponents(nameInput);
        const priceRow = new ActionRowBuilder().addComponents(priceInput);
        const descRow = new ActionRowBuilder().addComponents(descInput);

        modal.addComponents(nameRow, priceRow, descRow);
        await interaction.showModal(modal);
    }

    async showTempRoleSelector(interaction) {
        const { RoleSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('⌛ Créer Rôle Temporaire')
            .setDescription('Sélectionnez le rôle à vendre temporairement');

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('temp_role_select')
            .setPlaceholder('Choisissez un rôle...')
            .setMinValues(1)
            .setMaxValues(1);

        const row = new ActionRowBuilder().addComponents(roleSelect);
        
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showPermRoleSelector(interaction) {
        const { RoleSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('⭐ Créer Rôle Permanent')
            .setDescription('Sélectionnez le rôle à vendre définitivement');

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('perm_role_select')
            .setPlaceholder('Choisissez un rôle...')
            .setMinValues(1)
            .setMaxValues(1);

        const row = new ActionRowBuilder().addComponents(roleSelect);
        
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showDetailedStats(interaction) {
        const guildId = interaction.guild.id;
        const economyData = await this.dataManager.loadData('economy.json', {});
        const userData = economyData.users || {};
        
        const userCount = Object.keys(userData).length;
        const totalBalance = Object.values(userData).reduce((sum, user) => sum + (user.balance || 0), 0);
        
        await interaction.reply({ 
            content: `📊 **Statistiques Économiques:**\n👥 Utilisateurs: ${userCount}\n💰 Argent total: ${totalBalance}€`, 
            flags: 64 
        });
    }

    async showShopManagement(interaction) {
        const guildId = interaction.guild.id;
        const shopData = await this.dataManager.loadData('shop.json', {});
        const guildShop = shopData[guildId] || [];
        
        if (guildShop.length === 0) {
            await interaction.update({
                content: '📦 Aucun article dans la boutique à modifier ou supprimer.',
                embeds: [],
                components: []
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('✏️ Gestion Articles Boutique')
            .setDescription('Sélectionnez un article à modifier ou supprimer')
            .addFields([
                {
                    name: '📊 Articles Disponibles',
                    value: `${guildShop.length} article(s) configuré(s)`,
                    inline: true
                },
                {
                    name: '⚠️ Actions Disponibles',
                    value: '• Modifier nom, prix, description\n• Supprimer définitivement',
                    inline: false
                }
            ]);

        const options = guildShop.slice(0, 20).map((item, index) => {
            const typeIcon = item.type === 'temporary_role' ? '⌛' : 
                            item.type === 'permanent_role' ? '⭐' : '🎨';
            const typeName = item.type === 'temporary_role' ? 'Rôle Temp' : 
                           item.type === 'permanent_role' ? 'Rôle Perm' : 'Objet';
            
            return {
                label: `${typeIcon} ${item.name}`,
                value: `manage_item_${item.id}`,
                description: `${typeName} - ${item.price}€`,
                emoji: typeIcon
            };
        });

        options.push({
            label: '↩️ Retour Boutique',
            value: 'back_shop',
            description: 'Retour au menu boutique'
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('shop_item_management')
            .setPlaceholder('Choisir un article à gérer...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async handleShopItemManagement(interaction) {
        const selectedValue = interaction.values[0];
        
        if (selectedValue === 'back_shop') {
            await this.showShopConfig(interaction);
            return;
        }

        const itemId = selectedValue.replace('manage_item_', '');
        const guildId = interaction.guild.id;
        const shopData = await this.dataManager.loadData('shop.json', {});
        const guildShop = shopData[guildId] || [];
        
        // Conversion pour gérer les IDs string et number
        const item = guildShop.find(i => i.id.toString() === itemId.toString());
        if (!item) {
            await interaction.update({
                content: '❌ Article introuvable.',
                embeds: [],
                components: []
            });
            return;
        }

        const typeIcon = item.type === 'temporary_role' ? '⌛' : 
                        item.type === 'permanent_role' ? '⭐' : '🎨';
        const typeName = item.type === 'temporary_role' ? 'Rôle Temporaire' : 
                       item.type === 'permanent_role' ? 'Rôle Permanent' : 'Objet Personnalisé';

        const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle(`${typeIcon} Gestion Article`)
            .setDescription(`**${item.name}**\n${typeName} - ${item.price}€`)
            .addFields([
                {
                    name: '💰 Prix',
                    value: `${item.price}€`,
                    inline: true
                },
                {
                    name: '📝 Description',
                    value: item.description || 'Aucune description',
                    inline: true
                },
                {
                    name: '🕒 Créé le',
                    value: new Date(item.createdAt).toLocaleDateString('fr-FR'),
                    inline: true
                }
            ]);

        if (item.type === 'temporary_role' && item.duration) {
            embed.addFields([{
                name: '⏱️ Durée',
                value: `${item.duration} jours`,
                inline: true
            }]);
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`shop_item_actions_${itemId}`)
            .setPlaceholder('Action à effectuer...')
            .addOptions([
                {
                    label: '✏️ Modifier',
                    value: `edit_item_${itemId}`,
                    description: 'Modifier nom, prix ou description',
                    emoji: '✏️'
                },
                {
                    label: '🗑️ Supprimer',
                    value: `delete_item_${itemId}`,
                    description: 'Supprimer définitivement cet article',
                    emoji: '🗑️'
                },
                {
                    label: '↩️ Retour Liste',
                    value: 'back_management',
                    description: 'Retour à la liste des articles'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showKarmaStats(interaction) {
        const guildId = interaction.guild.id;
        const economyData = await this.dataManager.loadData('economy.json', {});
        const userData = economyData.users || {};
        
        let totalGoodKarma = 0;
        let totalBadKarma = 0;
        let userCount = 0;
        
        Object.values(userData).forEach(user => {
            if (user.goodKarma || user.badKarma) {
                totalGoodKarma += user.goodKarma || 0;
                totalBadKarma += user.badKarma || 0;
                userCount++;
            }
        });
        
        await interaction.reply({ 
            content: `⚖️ **Statistiques Karma:**\n👥 Utilisateurs actifs: ${userCount}\n😇 Karma positif total: ${totalGoodKarma}\n😈 Karma négatif total: ${totalBadKarma}`, 
            flags: 64 
        });
    }

    async showActionsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('⚡ Configuration Actions Économiques')
            .setDescription('Configurez les 6 actions économiques disponibles')
            .addFields([
                { name: '💼 Travailler', value: 'Action positive (+😇)', inline: true },
                { name: '🎣 Pêcher', value: 'Action positive (+😇)', inline: true },
                { name: '💝 Donner', value: 'Action très positive (+😇)', inline: true },
                { name: '💰 Voler', value: 'Action négative (+😈)', inline: true },
                { name: '🔫 Crime', value: 'Action très négative (+😈)', inline: true },
                { name: '🎲 Parier', value: 'Action négative (+😈)', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_actions_select')
            .setPlaceholder('Choisissez une action à configurer...')
            .addOptions([
                { label: '💼 Travailler', value: 'travailler', description: 'Configurer le travail' },
                { label: '🎣 Pêcher', value: 'pecher', description: 'Configurer la pêche' },
                { label: '💝 Donner', value: 'donner', description: 'Configurer les dons' },
                { label: '💰 Voler', value: 'voler', description: 'Configurer le vol' },
                { label: '🔫 Crime', value: 'crime', description: 'Configurer les crimes' },
                { label: '🎲 Parier', value: 'parier', description: 'Configurer les paris' },
                { label: '↩️ Retour Menu Principal', value: 'back_main', description: 'Retour au menu économie' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async showShopConfig(interaction) {
        const guildId = interaction.guild.id;
        const shopData = await this.dataManager.loadData('shop.json', {});
        const guildShop = shopData[guildId] || [];

        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('🛒 Configuration Boutique')
            .setDescription('Gestion de la boutique du serveur')
            .addFields([
                {
                    name: '📦 Articles Actuels',
                    value: guildShop.length > 0 ? `${guildShop.length} articles configurés` : 'Aucun article',
                    inline: true
                },
                {
                    name: '💼 Accès',
                    value: 'Commande `/boutique` disponible',
                    inline: true
                },
                {
                    name: '🎨 Types',
                    value: 'Objets personnalisés + Rôles',
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_shop_config')
            .setPlaceholder('Configuration boutique...')
            .addOptions([
                {
                    label: '📦 Voir Articles',
                    value: 'shop_list',
                    description: 'Afficher tous les articles de la boutique',
                    emoji: '📦'
                },
                {
                    label: '🎨 Créer Objet Personnalisé',
                    value: 'shop_create_custom',
                    description: 'Créer un objet avec nom, prix et description',
                    emoji: '🎨'
                },
                {
                    label: '⌛ Créer Rôle Temporaire',
                    value: 'shop_create_temp_role',
                    description: 'Créer un rôle temporaire payant',
                    emoji: '⌛'
                },
                {
                    label: '⭐ Créer Rôle Permanent',
                    value: 'shop_create_perm_role',
                    description: 'Créer un rôle permanent payant',
                    emoji: '⭐'
                },
                {
                    label: '✏️ Modifier/Supprimer Article',
                    value: 'shop_manage_items',
                    description: 'Modifier ou supprimer un objet/rôle existant',
                    emoji: '✏️'
                },
                {
                    label: '💸 Remises Karma',
                    value: 'shop_karma_discounts',
                    description: 'Configurer les remises en % selon karma net',
                    emoji: '💸'
                },
                {
                    label: '🛒 Accès Boutique',
                    value: 'shop_access',
                    description: 'Utiliser /boutique pour configuration complète',
                    emoji: '🛒'
                },
                {
                    label: '↩️ Retour Menu Principal',
                    value: 'back_main',
                    description: 'Retour au menu économie'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async showKarmaConfig(interaction) {
        const guildId = interaction.guild.id;
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const karmaConfig = economyConfig.karma || { autoReset: false, resetDay: 'sunday' };

        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('⚖️ Configuration Karma')
            .setDescription('Gérez le système de karma positif/négatif')
            .addFields([
                {
                    name: '🔄 Auto-Reset',
                    value: karmaConfig.autoReset ? '✅ Activé' : '❌ Désactivé',
                    inline: true
                },
                {
                    name: '📅 Jour Reset',
                    value: karmaConfig.resetDay || 'sunday',
                    inline: true
                },
                {
                    name: '⚖️ Équilibre',
                    value: 'Actions configurables individuellement',
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_config')
            .setPlaceholder('Options karma...')
            .addOptions([
                {
                    label: '🎁 Récompenses/Sanctions',
                    value: 'karma_rewards',
                    description: 'Configurer les récompenses automatiques par karma',
                    emoji: '🎁'
                },
                {
                    label: '🔄 Toggle Auto-Reset',
                    value: 'karma_autoreset',
                    description: 'Activer/désactiver le reset automatique',
                    emoji: '🔄'
                },
                {
                    label: '📅 Jour de Reset',
                    value: 'karma_resetday',
                    description: 'Définir le jour de reset hebdomadaire',
                    emoji: '📅'
                },
                {
                    label: '📊 Voir Statistiques',
                    value: 'karma_stats',
                    description: 'Statistiques karma du serveur',
                    emoji: '📊'
                },
                {
                    label: '🗑️ Reset Karma Total',
                    value: 'karma_reset_all',
                    description: 'Remettre à zéro TOUT le karma du serveur',
                    emoji: '🗑️'
                },
                {
                    label: '↩️ Retour Menu Principal',
                    value: 'back_main',
                    description: 'Retour au menu économie'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async showDailyConfig(interaction) {
        const guildId = interaction.guild.id;
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const dailyConfig = economyConfig.daily || { amount: 100, enabled: true };
        
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('📅 Configuration Daily')
            .setDescription('Récompenses quotidiennes pour les membres')
            .addFields([
                {
                    name: '💰 Montant Daily',
                    value: `${dailyConfig.amount}€`,
                    inline: true
                },
                {
                    name: '✅ Status',
                    value: dailyConfig.enabled ? 'Activé' : 'Désactivé',
                    inline: true
                },
                {
                    name: '🔥 Streak',
                    value: 'Bonus de série disponible',
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_daily_config')
            .setPlaceholder('Configuration daily...')
            .addOptions([
                {
                    label: '📝 Modifier Montant',
                    value: 'daily_amount',
                    description: 'Changer le montant daily (1-1000€)',
                    emoji: '💰'
                },
                {
                    label: '🔄 Toggle Activation',
                    value: 'daily_toggle',
                    description: dailyConfig.enabled ? 'Désactiver daily' : 'Activer daily',
                    emoji: '🔄'
                },
                {
                    label: '↩️ Retour Menu Principal',
                    value: 'back_main',
                    description: 'Retour au menu économie'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async showMessagesConfig(interaction) {
        const guildId = interaction.guild.id;
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const messagesConfig = economyConfig.messages || { enabled: false, amount: 5, cooldown: 60000 };
        
        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('💬 Configuration Messages')
            .setDescription('Gains automatiques par message')
            .addFields([
                {
                    name: '💰 Montant par Message',
                    value: `${messagesConfig.amount}€`,
                    inline: true
                },
                {
                    name: '✅ Status',
                    value: messagesConfig.enabled ? 'Activé' : 'Désactivé',
                    inline: true
                },
                {
                    name: '⏰ Cooldown',
                    value: `${Math.round(messagesConfig.cooldown / 1000)}s`,
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_messages_config')
            .setPlaceholder('Configuration messages...')
            .addOptions([
                {
                    label: '📝 Modifier Montant',
                    value: 'messages_amount',
                    description: 'Changer le montant par message (1-50€)',
                    emoji: '💰'
                },
                {
                    label: '⏰ Modifier Cooldown',
                    value: 'messages_cooldown',
                    description: 'Changer le délai entre gains',
                    emoji: '⏰'
                },
                {
                    label: '🔄 Toggle Activation',
                    value: 'messages_toggle',
                    description: messagesConfig.enabled ? 'Désactiver gains' : 'Activer gains',
                    emoji: '🔄'
                },
                {
                    label: '↩️ Retour Menu Principal',
                    value: 'back_main',
                    description: 'Retour au menu économie'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async showStatsConfig(interaction) {
        // Calculer les statistiques économiques du serveur
        const guildId = interaction.guild.id;
        const allUsers = await this.dataManager.getAllUsers(guildId);
        
        let totalBalance = 0;
        let totalGoodKarma = 0;
        let totalBadKarma = 0;
        let userCount = allUsers.length;
        
        allUsers.forEach(user => {
            totalBalance += user.balance || 1000;
            totalGoodKarma += user.karmaGood || 0;
            totalBadKarma += user.karmaBad || 0;
        });

        const embed = new EmbedBuilder()
            .setColor('#34495e')
            .setTitle('📊 Statistiques Économiques')
            .setDescription(`Données économiques du serveur`)
            .addFields([
                {
                    name: '👥 Utilisateurs Actifs',
                    value: `${userCount} membres`,
                    inline: true
                },
                {
                    name: '💰 Richesse Totale',
                    value: `${totalBalance.toLocaleString()}€`,
                    inline: true
                },
                {
                    name: '💰 Richesse Moyenne',
                    value: userCount > 0 ? `${Math.round(totalBalance / userCount).toLocaleString()}€` : '0€',
                    inline: true
                },
                {
                    name: '😇 Karma Positif Total',
                    value: `${totalGoodKarma}`,
                    inline: true
                },
                {
                    name: '😈 Karma Négatif Total',
                    value: `${totalBadKarma}`,
                    inline: true
                },
                {
                    name: '⚖️ Karma Net Moyen',
                    value: userCount > 0 ? `${Math.round((totalGoodKarma - totalBadKarma) / userCount)}` : '0',
                    inline: true
                },
                {
                    name: '🏆 Richesse Serveur',
                    value: totalBalance > 100000 ? 'Serveur Riche 💎' : totalBalance > 50000 ? 'Serveur Prospère 🌟' : 'Serveur en Développement 🌱',
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_stats_config')
            .setPlaceholder('Options statistiques...')
            .addOptions([
                {
                    label: '↩️ Retour Menu Principal',
                    value: 'back_main',
                    description: 'Retour au menu économie'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    // Handlers pour les sous-menus
    async handleEconomyKarmaConfig(interaction) {
        const option = interaction.values[0];
        
        if (option === 'back_main') {
            await this.handleMainMenu(interaction);
            return;
        }

        if (option === 'karma_autoreset') {
            const guildId = interaction.guild.id;
            const economyConfig = await this.dataManager.loadData('economy.json', {});
            
            if (!economyConfig.karma) economyConfig.karma = {};
            economyConfig.karma.autoReset = !economyConfig.karma.autoReset;
            
            await this.dataManager.saveData('economy.json', economyConfig);
            
            await interaction.update({
                content: `✅ Auto-reset karma ${economyConfig.karma.autoReset ? 'activé' : 'désactivé'}`,
                embeds: [],
                components: []
            });
            
            setTimeout(async () => {
                await this.showKarmaConfig(interaction);
            }, 2000);
        }
    }

    async handleEconomyShopConfig(interaction) {
        const option = interaction.values[0];
        
        if (option === 'back_main') {
            await this.handleMainMenu(interaction);
            return;
        }

        if (option === 'shop_access') {
            await interaction.update({
                content: '💡 **Information Boutique**\n\nUtilisez la commande `/boutique` pour configurer complètement votre boutique :\n• Créer objets personnalisés\n• Ajouter rôles temporaires/permanents\n• Gérer les prix et descriptions\n\nLa boutique est accessible aux utilisateurs via `/boutique`',
                embeds: [],
                components: []
            });
            
            setTimeout(async () => {
                await this.showShopConfig(interaction);
            }, 4000);
        } else {
            await interaction.update({
                content: '✅ Configuration boutique mise à jour',
                embeds: [],
                components: []
            });
        }
    }

    async handleEconomyDailyConfig(interaction) {
        const option = interaction.values[0];
        
        if (option === 'back_main') {
            await this.handleMainMenu(interaction);
            return;
        }

        const guildId = interaction.guild.id;
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        
        if (option === 'daily_toggle') {
            if (!economyConfig.daily) economyConfig.daily = { amount: 100, enabled: true };
            economyConfig.daily.enabled = !economyConfig.daily.enabled;
            
            await this.dataManager.saveData('economy.json', economyConfig);
            
            await interaction.update({
                content: `✅ Daily ${economyConfig.daily.enabled ? 'activé' : 'désactivé'}`,
                embeds: [],
                components: []
            });
            
            setTimeout(async () => {
                await this.showDailyConfig(interaction);
            }, 2000);
            
        } else if (option === 'daily_amount') {
            const modal = new ModalBuilder()
                .setCustomId('economy_daily_amount_modal')
                .setTitle('💰 Montant Daily');

            const amountInput = new TextInputBuilder()
                .setCustomId('amount')
                .setLabel('Montant Daily (1-1000€)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('100')
                .setValue(`${economyConfig.daily?.amount || 100}`)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(amountInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
        }
    }

    async handleEconomyMessagesConfig(interaction) {
        const option = interaction.values[0];
        
        if (option === 'back_main') {
            await this.handleMainMenu(interaction);
            return;
        }

        const guildId = interaction.guild.id;
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        
        if (option === 'messages_toggle') {
            if (!economyConfig.messages) economyConfig.messages = { enabled: false, amount: 5, cooldown: 60000 };
            economyConfig.messages.enabled = !economyConfig.messages.enabled;
            
            await this.dataManager.saveData('economy.json', economyConfig);
            
            await interaction.update({
                content: `✅ Système de récompenses par message ${economyConfig.messages.enabled ? 'activé' : 'désactivé'}`,
                embeds: [],
                components: []
            });
            
            setTimeout(async () => {
                await this.showMessagesConfig(interaction);
            }, 2000);
            
        } else if (option === 'messages_amount') {
            const modal = new ModalBuilder()
                .setCustomId('economy_messages_amount_modal')
                .setTitle('💰 Montant par Message');

            const amountInput = new TextInputBuilder()
                .setCustomId('amount')
                .setLabel('Montant par message (1-50€)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('5')
                .setValue(`${economyConfig.messages?.amount || 5}`)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(amountInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
            
        } else if (option === 'messages_cooldown') {
            const modal = new ModalBuilder()
                .setCustomId('economy_messages_cooldown_modal')
                .setTitle('⏰ Cooldown Messages');

            const cooldownInput = new TextInputBuilder()
                .setCustomId('cooldown')
                .setLabel('Cooldown en secondes (10-60s)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('60')
                .setValue(`${Math.round((economyConfig.messages?.cooldown || 60000) / 1000)}`)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(cooldownInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
        }
    }

    async handleEconomyStatsConfig(interaction) {
        const option = interaction.values[0];
        
        if (option === 'back_main') {
            await this.handleMainMenu(interaction);
            return;
        }
    }

    // Compatibilité avec les anciennes méthodes
    async handleActionSelected(interaction) {
        const action = interaction.values[0];
        
        if (action === 'back_main') {
            await this.handleMainMenu(interaction);
            return;
        }

        await interaction.reply({ 
            content: `⚙️ Configuration ${action} : Cette fonctionnalité avancée sera disponible prochainement. Utilisez les commandes directement pour tester les modifications.`,
            flags: 64 
        });
    }
    // Handlers pour les modals de la boutique
    async handleCustomObjectModal(interaction) {
        const name = interaction.fields.getTextInputValue('object_name');
        const priceStr = interaction.fields.getTextInputValue('object_price');
        const description = interaction.fields.getTextInputValue('object_description') || 'Objet personnalisé';
        const karmaDiscountStr = interaction.fields.getTextInputValue('karma_discount') || '0';
        
        const price = parseInt(priceStr);
        const karmaDiscount = parseInt(karmaDiscountStr) || 0;
        
        if (isNaN(price) || price < 1 || price > 999999) {
            await interaction.reply({ content: '❌ Prix invalide (1-999999€)', flags: 64 });
            return;
        }

        if (karmaDiscount < 0 || karmaDiscount > 99) {
            await interaction.reply({ content: '❌ Remise karma invalide (0-99%)', flags: 64 });
            return;
        }

        await this.saveShopItem(interaction, {
            type: 'custom',
            name: name,
            price: price,
            description: description,
            karmaDiscount: karmaDiscount
        });
    }

    async handleTempRolePriceModal(interaction, roleId) {
        const priceStr = interaction.fields.getTextInputValue('role_price');
        const durationStr = interaction.fields.getTextInputValue('role_duration');
        const karmaDiscountStr = interaction.fields.getTextInputValue('karma_discount') || '0';
        
        const price = parseInt(priceStr);
        const duration = parseInt(durationStr);
        const karmaDiscount = parseInt(karmaDiscountStr) || 0;
        
        if (isNaN(price) || price < 1 || price > 999999) {
            await interaction.reply({ content: '❌ Prix invalide (1-999999€)', flags: 64 });
            return;
        }
        
        if (isNaN(duration) || duration < 1 || duration > 36500) {
            await interaction.reply({ content: '❌ Durée invalide (1-36500 jours)', flags: 64 });
            return;
        }

        if (karmaDiscount < 0 || karmaDiscount > 99) {
            await interaction.reply({ content: '❌ Remise karma invalide (0-99%)', flags: 64 });
            return;
        }

        const role = interaction.guild.roles.cache.get(roleId);
        await this.saveShopItem(interaction, {
            type: 'temp_role',
            roleId: roleId,
            name: `Rôle ${role?.name || 'Inconnu'}`,
            price: price,
            duration: duration,
            karmaDiscount: karmaDiscount
        });
    }

    async handlePermRolePriceModal(interaction, roleId) {
        const priceStr = interaction.fields.getTextInputValue('role_price');
        const karmaDiscountStr = interaction.fields.getTextInputValue('karma_discount') || '0';
        
        const price = parseInt(priceStr);
        const karmaDiscount = parseInt(karmaDiscountStr) || 0;
        
        if (isNaN(price) || price < 1 || price > 999999) {
            await interaction.reply({ content: '❌ Prix invalide (1-999999€)', flags: 64 });
            return;
        }

        if (karmaDiscount < 0 || karmaDiscount > 99) {
            await interaction.reply({ content: '❌ Remise karma invalide (0-99%)', flags: 64 });
            return;
        }

        const role = interaction.guild.roles.cache.get(roleId);
        await this.saveShopItem(interaction, {
            type: 'perm_role',
            roleId: roleId,
            name: `Rôle ${role?.name || 'Inconnu'}`,
            price: price,
            karmaDiscount: karmaDiscount
        });
    }

    async saveShopItem(interaction, item) {
        const guildId = interaction.guild.id;
        const shopData = await this.dataManager.loadData('shop.json', {});
        
        if (!shopData[guildId]) shopData[guildId] = [];
        
        const newItem = {
            id: Date.now(),
            ...item,
            createdAt: new Date().toISOString(),
            createdBy: interaction.user.id
        };
        
        shopData[guildId].push(newItem);
        await this.dataManager.saveData('shop.json', shopData);
        
        const typeEmojis = {
            'custom': '🎨',
            'temp_role': '⌛',
            'perm_role': '⭐'
        };
        
        await interaction.reply({ 
            content: `✅ ${typeEmojis[item.type]} **${item.name}** ajouté à la boutique pour **${item.price}€**`, 
            flags: 64 
        });
    }

    // Gestion de la sélection de rôle
    async handleRoleSelection(interaction, customId) {
        console.log(`Traitement sélection rôle: ${customId}`);
        const selectedRoleId = interaction.values[0];
        const role = interaction.guild.roles.cache.get(selectedRoleId);
        
        if (!role) {
            await interaction.reply({ content: '❌ Rôle introuvable', flags: 64 });
            return;
        }

        console.log(`Rôle sélectionné: ${role.name} (${selectedRoleId})`);

        if (customId === 'temp_role_select') {
            console.log('Affichage modal prix rôle temporaire');
            await this.showTempRolePriceModal(interaction, selectedRoleId, role.name);
        } else if (customId === 'perm_role_select') {
            console.log('Affichage modal prix rôle permanent');
            await this.showPermRolePriceModal(interaction, selectedRoleId, role.name);
        }
    }

    async showTempRolePriceModal(interaction, roleId, roleName) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId(`temp_role_price_modal_${roleId}`)
            .setTitle(`⌛ Prix Rôle: ${roleName}`);

        const priceInput = new TextInputBuilder()
            .setCustomId('role_price')
            .setLabel('Prix (en €)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(10)
            .setPlaceholder('Ex: 1000')
            .setRequired(true);

        const durationInput = new TextInputBuilder()
            .setCustomId('role_duration')
            .setLabel('Durée (en jours)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(5)
            .setPlaceholder('Ex: 30')
            .setRequired(true);

        const karmaDiscountInput = new TextInputBuilder()
            .setCustomId('karma_discount')
            .setLabel('Remise karma net (% optionnel)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(0)
            .setMaxLength(3)
            .setPlaceholder('0-99')
            .setRequired(false);

        const priceRow = new ActionRowBuilder().addComponents(priceInput);
        const durationRow = new ActionRowBuilder().addComponents(durationInput);
        const karmaRow = new ActionRowBuilder().addComponents(karmaDiscountInput);

        modal.addComponents(priceRow, durationRow, karmaRow);
        await interaction.showModal(modal);
    }

    async showPermRolePriceModal(interaction, roleId, roleName) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId(`perm_role_price_modal_${roleId}`)
            .setTitle(`⭐ Prix Rôle: ${roleName}`);

        const priceInput = new TextInputBuilder()
            .setCustomId('role_price')
            .setLabel('Prix (en €)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(10)
            .setPlaceholder('Ex: 2000')
            .setRequired(true);

        const karmaDiscountInput = new TextInputBuilder()
            .setCustomId('karma_discount')
            .setLabel('Remise karma net (% optionnel)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(0)
            .setMaxLength(3)
            .setPlaceholder('0-99')
            .setRequired(false);

        const priceRow = new ActionRowBuilder().addComponents(priceInput);
        const karmaRow = new ActionRowBuilder().addComponents(karmaDiscountInput);
        modal.addComponents(priceRow, karmaRow);
        await interaction.showModal(modal);
    }
    async handleDurationSelection(interaction, levelId, roleId) {
        const option = interaction.values[0];
        
        if (option.startsWith('back_role_select_')) {
            await this.showRoleSelector(interaction, levelId);
            return;
        }

        const duration = parseInt(option);
        
        if (isNaN(duration) || duration < 24 || duration > 168) {
            await interaction.reply({
                content: '❌ Durée invalide. Veuillez choisir entre 1 et 7 jours.',
                flags: 64
            });
            return;
        }

        // Sauvegarder la configuration
        await this.saveTempRoleConfiguration(interaction, levelId, roleId, duration);
    }

    async saveTempRoleConfiguration(interaction, levelId, roleId, duration) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const karmaRewards = economyConfig.karmaRewards || [];
        const rewardIndex = karmaRewards.findIndex(r => r.id == levelId);

        if (rewardIndex === -1) {
            await interaction.reply({
                content: '❌ Niveau karma introuvable.',
                flags: 64
            });
            return;
        }

        // Mettre à jour le niveau avec le rôle temporaire
        karmaRewards[rewardIndex].roleId = roleId;
        karmaRewards[rewardIndex].roleDuration = duration;
        
        economyConfig.karmaRewards = karmaRewards;
        await this.dataManager.saveData('economy.json', economyConfig);

        // Récupérer les informations pour confirmation
        const level = karmaRewards[rewardIndex];
        const role = interaction.guild.roles.cache.get(roleId);
        const roleName = role ? role.name : 'Rôle inconnu';
        const type = level.karmaThreshold >= 0 ? '😇' : '😈';
        const durationText = duration === 24 ? '1 jour' : 
                            duration === 168 ? '1 semaine' : 
                            `${duration / 24} jours`;

        await interaction.reply({
            content: `✅ **Rôle temporaire configuré !**\n\n${type} **${level.name}** (${level.karmaThreshold} karma)\n🎭 Rôle: **${roleName}**\n⏰ Durée: **${durationText}**\n\nLe rôle sera automatiquement attribué aux membres atteignant ce niveau karma.`,
            flags: 64
        });
    }

    async testKarmaRewardSystem(interaction) {
        try {
            const KarmaRewardManager = require('../utils/karmaRewardManager');
            const karmaManager = new KarmaRewardManager(this.dataManager);
            await karmaManager.testKarmaSystem(interaction.user, interaction.guild, interaction.channel);
            
            // Déclencher aussi la vérification automatique
            await karmaManager.checkAndApplyKarmaRewards(interaction.user, interaction.guild, interaction.channel);
            
            await interaction.update({
                content: '🧪 **Test du système karma effectué !**\n\n✅ Les messages de test ont été envoyés dans ce canal.\n✅ Si vous remplissez les critères, les récompenses ont été appliquées automatiquement.',
                embeds: [],
                components: []
            });
        } catch (error) {
            console.error('Erreur test système karma:', error);
            await interaction.update({
                content: '❌ Erreur lors du test du système karma.',
                embeds: [],
                components: []
            });
        }
    }

    // Méthodes pour la configuration des actions économiques
    async handleActionConfigSelection(interaction) {
        const customId = interaction.customId;
        const actionName = customId.replace('action_config_', '');
        
        console.log(`⚙️ Configuration action: ${actionName}`);
        
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const actionConfig = economyConfig.actions?.[actionName] || {
            enabled: true,
            minReward: 10,
            maxReward: 50,
            cooldown: 60000,
            goodKarma: 1,
            badKarma: 0
        };
        
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle(`⚙️ Configuration Action: ${actionName.charAt(0).toUpperCase() + actionName.slice(1)}`)
            .setDescription('Configurez les paramètres de cette action économique')
            .addFields([
                {
                    name: '💰 Récompenses',
                    value: `Min: **${actionConfig.minReward}€**\nMax: **${actionConfig.maxReward}€**`,
                    inline: true
                },
                {
                    name: '⚖️ Karma',
                    value: `😇 Bon: **+${actionConfig.goodKarma}**\n😈 Mauvais: **${Math.abs(actionConfig.badKarma)}**`,
                    inline: true
                },
                {
                    name: '⏰ Cooldown',
                    value: `**${Math.round(actionConfig.cooldown / 1000)}s**`,
                    inline: true
                },
                {
                    name: '🔧 État',
                    value: actionConfig.enabled ? '✅ Activé' : '❌ Désactivé',
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`action_${actionName}_config`)
            .setPlaceholder('Sélectionnez un paramètre à modifier...')
            .addOptions([
                {
                    label: '💰 Récompenses Min/Max',
                    value: 'rewards',
                    description: 'Modifier les montants minimum et maximum'
                },
                {
                    label: '⚖️ Karma Bon/Mauvais',
                    value: 'karma',
                    description: 'Configurer les gains de karma'
                },
                {
                    label: '⏰ Cooldown',
                    value: 'cooldown',
                    description: 'Temps d\'attente entre les utilisations'
                },
                {
                    label: '🔧 Activer/Désactiver',
                    value: 'toggle',
                    description: 'Activer ou désactiver cette action'
                },
                {
                    label: '↩️ Retour Actions',
                    value: 'back_actions',
                    description: 'Retour au menu des actions'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async handleActionSettings(interaction) {
        const customId = interaction.customId;
        const actionName = customId.replace('action_', '').replace('_config', '');
        const setting = interaction.values[0];
        
        console.log(`⚙️ Paramètre ${setting} pour action ${actionName}`);
        
        if (setting === 'back_actions') {
            await this.showActionsConfig(interaction);
            return;
        }
        
        switch (setting) {
            case 'rewards':
                await this.showActionRewardsModal(interaction, actionName);
                break;
            case 'karma':
                await this.showActionKarmaModal(interaction, actionName);
                break;
            case 'cooldown':
                await this.showActionCooldownModal(interaction, actionName);
                break;
            case 'toggle':
                await this.toggleAction(interaction, actionName);
                break;
            default:
                await interaction.reply({ 
                    content: '❌ Paramètre non reconnu', 
                    flags: 64 
                });
        }
    }

    async showActionRewardsModal(interaction, actionName) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const actionConfig = economyConfig.actions?.[actionName] || { minReward: 10, maxReward: 50 };
        
        const modal = new ModalBuilder()
            .setCustomId(`action_rewards_modal_${actionName}`)
            .setTitle(`💰 Récompenses - ${actionName.charAt(0).toUpperCase() + actionName.slice(1)}`);

        const minInput = new TextInputBuilder()
            .setCustomId('min_reward')
            .setLabel('Récompense Minimum (1-1000€)')
            .setStyle(TextInputStyle.Short)
            .setValue(`${actionConfig.minReward}`)
            .setMinLength(1)
            .setMaxLength(4)
            .setRequired(true);

        const maxInput = new TextInputBuilder()
            .setCustomId('max_reward')
            .setLabel('Récompense Maximum (1-1000€)')
            .setStyle(TextInputStyle.Short)
            .setValue(`${actionConfig.maxReward}`)
            .setMinLength(1)
            .setMaxLength(4)
            .setRequired(true);

        const minRow = new ActionRowBuilder().addComponents(minInput);
        const maxRow = new ActionRowBuilder().addComponents(maxInput);
        
        modal.addComponents(minRow, maxRow);
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.showModal(modal);
            } else {
                console.log('❌ Interaction déjà traitée, impossible d\'afficher modal récompenses');
            }
        } catch (error) {
            console.error('❌ Erreur affichage modal récompenses:', error);
        }
    }

    async showActionKarmaModal(interaction, actionName) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const actionConfig = economyConfig.actions?.[actionName] || { goodKarma: 1, badKarma: 0 };
        
        const modal = new ModalBuilder()
            .setCustomId(`action_karma_modal_${actionName}`)
            .setTitle(`⚖️ Karma - ${actionName.charAt(0).toUpperCase() + actionName.slice(1)}`);

        const goodInput = new TextInputBuilder()
            .setCustomId('good_karma')
            .setLabel('Karma Bon (0-10)')
            .setStyle(TextInputStyle.Short)
            .setValue(`${actionConfig.goodKarma}`)
            .setMinLength(1)
            .setMaxLength(2)
            .setRequired(true);

        const badInput = new TextInputBuilder()
            .setCustomId('bad_karma')
            .setLabel('Karma Mauvais (0-10)')
            .setStyle(TextInputStyle.Short)
            .setValue(`${Math.abs(actionConfig.badKarma)}`)
            .setMinLength(1)
            .setMaxLength(2)
            .setRequired(true);

        const goodRow = new ActionRowBuilder().addComponents(goodInput);
        const badRow = new ActionRowBuilder().addComponents(badInput);
        
        modal.addComponents(goodRow, badRow);
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.showModal(modal);
            } else {
                console.log('❌ Interaction déjà traitée, impossible d\'afficher modal karma');
            }
        } catch (error) {
            console.error('❌ Erreur affichage modal karma:', error);
        }
    }

    async showActionCooldownModal(interaction, actionName) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const actionConfig = economyConfig.actions?.[actionName] || { cooldown: 60000 };
        
        const modal = new ModalBuilder()
            .setCustomId(`action_cooldown_modal_${actionName}`)
            .setTitle(`⏰ Cooldown - ${actionName.charAt(0).toUpperCase() + actionName.slice(1)}`);

        const cooldownInput = new TextInputBuilder()
            .setCustomId('cooldown')
            .setLabel('Cooldown en secondes (10-300s)')
            .setStyle(TextInputStyle.Short)
            .setValue(`${Math.round(actionConfig.cooldown / 1000)}`)
            .setMinLength(2)
            .setMaxLength(3)
            .setRequired(true);

        const cooldownRow = new ActionRowBuilder().addComponents(cooldownInput);
        
        modal.addComponents(cooldownRow);
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.showModal(modal);
            } else {
                console.log('❌ Interaction déjà traitée, impossible d\'afficher modal cooldown');
            }
        } catch (error) {
            console.error('❌ Erreur affichage modal cooldown:', error);
        }
    }

    async toggleAction(interaction, actionName) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        if (!economyConfig.actions) economyConfig.actions = {};
        if (!economyConfig.actions[actionName]) {
            economyConfig.actions[actionName] = { enabled: true };
        }
        
        economyConfig.actions[actionName].enabled = !economyConfig.actions[actionName].enabled;
        await this.dataManager.saveData('economy.json', economyConfig);
        
        await interaction.reply({
            content: `✅ Action **${actionName}** ${economyConfig.actions[actionName].enabled ? 'activée' : 'désactivée'}`,
            flags: 64
        });
    }

    // Handlers pour les modals de configuration des actions
    async handleActionRewardsModal(interaction, actionName) {
        console.log(`💰 Modal récompenses pour: ${actionName}`);
        
        const minReward = parseInt(interaction.fields.getTextInputValue('min_reward'));
        const maxReward = parseInt(interaction.fields.getTextInputValue('max_reward'));
        
        if (isNaN(minReward) || minReward < 1 || minReward > 1000) {
            await interaction.reply({ content: '❌ Récompense minimum invalide (1-1000€)', flags: 64 });
            return;
        }
        
        if (isNaN(maxReward) || maxReward < 1 || maxReward > 1000) {
            await interaction.reply({ content: '❌ Récompense maximum invalide (1-1000€)', flags: 64 });
            return;
        }
        
        if (minReward > maxReward) {
            await interaction.reply({ content: '❌ Le minimum ne peut pas être supérieur au maximum', flags: 64 });
            return;
        }
        
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        if (!economyConfig.actions) economyConfig.actions = {};
        if (!economyConfig.actions[actionName]) economyConfig.actions[actionName] = {};
        
        economyConfig.actions[actionName].minReward = minReward;
        economyConfig.actions[actionName].maxReward = maxReward;
        
        await this.dataManager.saveData('economy.json', economyConfig);
        
        await interaction.reply({
            content: `✅ Récompenses **${actionName}** configurées :\n💰 Min: **${minReward}€** | Max: **${maxReward}€**`,
            flags: 64
        });
    }

    async handleActionKarmaModal(interaction, actionName) {
        try {
            console.log(`⚖️ Modal karma pour: ${actionName}`);
            
            const goodKarma = parseInt(interaction.fields.getTextInputValue('good_karma'));
            const badKarma = parseInt(interaction.fields.getTextInputValue('bad_karma'));
            
            if (isNaN(goodKarma) || goodKarma < 0 || goodKarma > 10) {
                await interaction.reply({ content: '❌ Karma bon invalide (0-10)', flags: 64 });
                return;
            }
            
            if (isNaN(badKarma) || badKarma < 0 || badKarma > 10) {
                await interaction.reply({ content: '❌ Karma mauvais invalide (0-10)', flags: 64 });
                return;
            }
            
            const economyConfig = await this.dataManager.loadData('economy.json', {});
            if (!economyConfig.actions) economyConfig.actions = {};
            if (!economyConfig.actions[actionName]) economyConfig.actions[actionName] = {};
            
            economyConfig.actions[actionName].goodKarma = goodKarma;
            economyConfig.actions[actionName].badKarma = -badKarma; // Négatif pour bad karma
            
            await this.dataManager.saveData('economy.json', economyConfig);
            
            console.log(`✅ Config karma sauvée pour ${actionName}:`, economyConfig.actions[actionName]);
            
            await interaction.reply({
                content: `✅ Karma **${actionName}** configuré :\n😇 Bon: **+${goodKarma}** | 😈 Mauvais: **${badKarma}**`,
                flags: 64
            });
        } catch (error) {
            console.error('❌ Erreur handleActionKarmaModal:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ Erreur lors de la configuration du karma.',
                    flags: 64
                });
            }
        }
    }

    async handleActionCooldownModal(interaction, actionName) {
        console.log(`⏰ Modal cooldown pour: ${actionName}`);
        
        const cooldownSeconds = parseInt(interaction.fields.getTextInputValue('cooldown'));
        
        if (isNaN(cooldownSeconds) || cooldownSeconds < 10 || cooldownSeconds > 300) {
            await interaction.reply({ content: '❌ Cooldown invalide (10-300 secondes)', flags: 64 });
            return;
        }
        
        const cooldownMs = cooldownSeconds * 1000;
        
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        if (!economyConfig.actions) economyConfig.actions = {};
        if (!economyConfig.actions[actionName]) economyConfig.actions[actionName] = {};
        
        economyConfig.actions[actionName].cooldown = cooldownMs;
        
        await this.dataManager.saveData('economy.json', economyConfig);
        
        await interaction.reply({
            content: `✅ Cooldown **${actionName}** configuré :\n⏰ Temps d'attente: **${cooldownSeconds}s**`,
            flags: 64
        });
    }

    // Nouvelle méthode pour reset karma uniquement
    async showKarmaResetConfirmation(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff4444')
            .setTitle('🗑️ Reset Karma Total - ATTENTION')
            .setDescription('**⚠️ CETTE ACTION EST IRRÉVERSIBLE !**\n\nVous êtes sur le point de remettre à zéro TOUT le karma (positif et négatif) de TOUS les membres du serveur.')
            .addFields([
                {
                    name: '❌ Sera supprimé :',
                    value: '• Tout le karma positif 😇\n• Tout le karma négatif 😈\n• Karma net (calculé)',
                    inline: false
                },
                {
                    name: '✅ Sera conservé :',
                    value: '• Soldes des membres 💰\n• Daily streaks 🔥\n• Autres données économiques',
                    inline: false
                }
            ])
            .setFooter({ text: 'Cette action ne peut pas être annulée !' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('karma_reset_confirm')
            .setPlaceholder('Confirmer l\'action...')
            .addOptions([
                {
                    label: '🗑️ CONFIRMER LE RESET KARMA',
                    value: 'confirm_reset',
                    description: 'EFFACER DÉFINITIVEMENT tout le karma du serveur',
                    emoji: '🗑️'
                },
                {
                    label: '❌ Annuler',
                    value: 'cancel_reset',
                    description: 'Annuler et retourner au menu karma',
                    emoji: '❌'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async handleKarmaReset(interaction) {
        const option = interaction.values[0];
        const guildId = interaction.guild.id;
        
        if (option === 'confirm_reset') {
            try {
                const economyData = await this.dataManager.loadData('economy.json', {});
                
                console.log('🔄 Reset karma complet - suppression de toutes les données karma...');
                
                // Remettre à zéro SEULEMENT le karma de tous les utilisateurs
                let resetCount = 0;
                for (const userKey in economyData) {
                    if (userKey.includes('_') && economyData[userKey].goodKarma !== undefined) {
                        economyData[userKey].goodKarma = 0;
                        economyData[userKey].badKarma = 0;
                        // Garder les autres propriétés (karmaGood, karmaBad pour compatibilité)
                        if (economyData[userKey].karmaGood !== undefined) economyData[userKey].karmaGood = 0;
                        if (economyData[userKey].karmaBad !== undefined) economyData[userKey].karmaBad = 0;
                        // CONSERVER l'argent, daily streaks et autres données
                        resetCount++;
                    }
                }
                
                // Supprimer aussi les données manuelles ajoutées (format différent)
                const keysToRemove = [];
                for (const key in economyData) {
                    if (!key.includes('_') && typeof economyData[key] === 'object' && 
                        (economyData[key].goodKarma !== undefined || economyData[key].badKarma !== undefined)) {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => {
                    console.log(`🗑️ Suppression données karma manuelles: ${key}`);
                    delete economyData[key];
                });
                
                // Supprimer également les données du fichier economy (format alternatif)
                const economyAlt = await this.dataManager.loadData('economy', {});
                if (economyAlt[guildId]) {
                    let altRemoved = 0;
                    for (const userId in economyAlt[guildId]) {
                        if (economyAlt[guildId][userId].goodKarma !== undefined || 
                            economyAlt[guildId][userId].badKarma !== undefined) {
                            economyAlt[guildId][userId].goodKarma = 0;
                            economyAlt[guildId][userId].badKarma = 0;
                            altRemoved++;
                        }
                    }
                    await this.dataManager.saveData('economy', economyAlt);
                    console.log(`🗑️ Reset karma fichier economy alternatif: ${altRemoved} membres`);
                }
                
                console.log(`✅ Reset effectué: ${resetCount} membres + ${keysToRemove.length} données manuelles supprimées`);
                
                await this.dataManager.saveData('economy.json', economyData);
                
                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ Reset Karma Terminé')
                    .setDescription(`**${resetCount} membres** ont eu leur karma remis à zéro.`)
                    .addFields([
                        {
                            name: '🗑️ Données effacées',
                            value: '• Karma positif : 0\n• Karma négatif : 0\n• Karma net : 0',
                            inline: false
                        },
                        {
                            name: '✅ Données conservées',
                            value: '• Argent des membres 💰\n• Daily streaks 🔥\n• Autres données économiques',
                            inline: false
                        }
                    ])
                    .setTimestamp();

                await interaction.update({ embeds: [embed], components: [] });
                
            } catch (error) {
                console.error('Erreur reset karma:', error);
                await interaction.update({
                    content: '❌ Erreur lors du reset karma.',
                    embeds: [],
                    components: []
                });
            }
        } else {
            // Annuler - retourner au menu karma
            await this.showKarmaConfig(interaction);
        }
    }

    async handleShopItemActions(interaction) {
        const customId = interaction.customId;
        const selectedValue = interaction.values[0];
        
        if (selectedValue === 'back_management') {
            await this.showShopManagement(interaction);
            return;
        }

        const itemId = customId.replace('shop_item_actions_', '');
        
        if (selectedValue.startsWith('edit_item_')) {
            await this.showEditItemModal(interaction, itemId);
        } else if (selectedValue.startsWith('delete_item_')) {
            await this.confirmDeleteItem(interaction, itemId);
        }
    }

    async showEditItemModal(interaction, itemId) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        
        const guildId = interaction.guild.id;
        const shopData = await this.dataManager.loadData('shop.json', {});
        const guildShop = shopData[guildId] || [];
        
        const item = guildShop.find(i => i.id.toString() === itemId.toString());
        if (!item) {
            await interaction.reply({ content: '❌ Article introuvable.', flags: 64 });
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId(`edit_item_modal_${itemId}`)
            .setTitle('✏️ Modifier Article');

        const nameInput = new TextInputBuilder()
            .setCustomId('item_name')
            .setLabel('Nom de l\'article')
            .setStyle(TextInputStyle.Short)
            .setValue(item.name)
            .setMinLength(1)
            .setMaxLength(50)
            .setRequired(true);

        const priceInput = new TextInputBuilder()
            .setCustomId('item_price')
            .setLabel('Prix (en €)')
            .setStyle(TextInputStyle.Short)
            .setValue(item.price.toString())
            .setMinLength(1)
            .setMaxLength(10)
            .setRequired(true);

        const descInput = new TextInputBuilder()
            .setCustomId('item_description')
            .setLabel('Description')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(item.description || '')
            .setMinLength(0)
            .setMaxLength(200)
            .setRequired(false);

        const nameRow = new ActionRowBuilder().addComponents(nameInput);
        const priceRow = new ActionRowBuilder().addComponents(priceInput);
        const descRow = new ActionRowBuilder().addComponents(descInput);

        modal.addComponents(nameRow, priceRow, descRow);
        await interaction.showModal(modal);
    }

    async confirmDeleteItem(interaction, itemId) {
        const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
        
        const guildId = interaction.guild.id;
        const shopData = await this.dataManager.loadData('shop.json', {});
        const guildShop = shopData[guildId] || [];
        
        const item = guildShop.find(i => i.id.toString() === itemId.toString());
        if (!item) {
            await interaction.update({
                content: '❌ Article introuvable.',
                embeds: [],
                components: []
            });
            return;
        }

        const typeIcon = item.type === 'temporary_role' ? '⌛' : 
                        item.type === 'permanent_role' ? '⭐' : '🎨';

        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🗑️ Confirmation Suppression')
            .setDescription(`**⚠️ Êtes-vous sûr de vouloir supprimer cet article ?**\n\n${typeIcon} **${item.name}**\nPrix: ${item.price}€`)
            .addFields([
                {
                    name: '⚠️ Attention',
                    value: 'Cette action est **irréversible**',
                    inline: false
                }
            ]);

        const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm_delete_${itemId}`)
            .setLabel('🗑️ Supprimer')
            .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
            .setCustomId(`cancel_delete_${itemId}`)
            .setLabel('❌ Annuler')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async handleItemDeletion(interaction) {
        const customId = interaction.customId;
        
        if (customId.startsWith('cancel_delete_')) {
            const itemId = customId.replace('cancel_delete_', '');
            // Retour au menu de gestion de l'article
            await this.handleShopItemManagement(interaction);
            return;
        }

        if (customId.startsWith('confirm_delete_')) {
            const itemId = customId.replace('confirm_delete_', '');
            await this.deleteShopItem(interaction, itemId);
        }
    }

    async deleteShopItem(interaction, itemId) {
        const guildId = interaction.guild.id;
        const shopData = await this.dataManager.loadData('shop.json', {});
        
        if (!shopData[guildId]) {
            await interaction.update({
                content: '❌ Aucun article trouvé.',
                embeds: [],
                components: []
            });
            return;
        }

        const item = shopData[guildId].find(i => i.id.toString() === itemId.toString());
        if (!item) {
            await interaction.update({
                content: '❌ Article introuvable.',
                embeds: [],
                components: []
            });
            return;
        }

        // Supprimer l'article
        shopData[guildId] = shopData[guildId].filter(i => i.id.toString() !== itemId.toString());
        await this.dataManager.saveData('shop.json', shopData);

        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor('#27ae60')
            .setTitle('✅ Article Supprimé')
            .setDescription(`L'article **${item.name}** a été supprimé avec succès de la boutique.`)
            .addFields([
                {
                    name: '📊 Articles Restants',
                    value: `${shopData[guildId].length} article(s)`,
                    inline: true
                }
            ]);

        const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
        const backButton = new ButtonBuilder()
            .setCustomId('back_to_shop_management')
            .setLabel('↩️ Retour Gestion')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(backButton);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async handleEditItemModal(interaction) {
        const customId = interaction.customId;
        const itemId = customId.replace('edit_item_modal_', '');
        
        const newName = interaction.fields.getTextInputValue('item_name');
        const newPrice = parseInt(interaction.fields.getTextInputValue('item_price'));
        const newDescription = interaction.fields.getTextInputValue('item_description');

        // Validation du prix
        if (isNaN(newPrice) || newPrice < 1 || newPrice > 999999) {
            await interaction.reply({
                content: '❌ Le prix doit être un nombre entre 1 et 999,999€.',
                flags: 64
            });
            return;
        }

        const guildId = interaction.guild.id;
        const shopData = await this.dataManager.loadData('shop.json', {});
        
        if (!shopData[guildId]) {
            await interaction.reply({
                content: '❌ Aucun article trouvé.',
                flags: 64
            });
            return;
        }

        const itemIndex = shopData[guildId].findIndex(i => i.id.toString() === itemId.toString());
        if (itemIndex === -1) {
            await interaction.reply({
                content: '❌ Article introuvable.',
                flags: 64
            });
            return;
        }

        // Mettre à jour l'article
        shopData[guildId][itemIndex].name = newName;
        shopData[guildId][itemIndex].price = newPrice;
        shopData[guildId][itemIndex].description = newDescription;
        shopData[guildId][itemIndex].updatedAt = Date.now();

        await this.dataManager.saveData('shop.json', shopData);

        const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
        const item = shopData[guildId][itemIndex];
        const typeIcon = item.type === 'temporary_role' ? '⌛' : 
                        item.type === 'permanent_role' ? '⭐' : '🎨';

        const embed = new EmbedBuilder()
            .setColor('#27ae60')
            .setTitle('✅ Article Modifié')
            .setDescription(`${typeIcon} **${item.name}** a été mis à jour avec succès !`)
            .addFields([
                {
                    name: '💰 Nouveau Prix',
                    value: `${item.price}€`,
                    inline: true
                },
                {
                    name: '📝 Description',
                    value: item.description || 'Aucune description',
                    inline: true
                }
            ]);

        const backButton = new ButtonBuilder()
            .setCustomId('back_to_shop_management')
            .setLabel('↩️ Retour Gestion')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(backButton);
        await interaction.reply({ embeds: [embed], components: [row] });
    }

    async showKarmaDiscountsConfig(interaction) {
        const guildId = interaction.guild.id;
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const karmaDiscounts = economyConfig.karmaDiscounts || {
            enabled: false,
            ranges: []
        };

        const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

        let discountsList = 'Aucune remise configurée';
        if (karmaDiscounts.ranges && karmaDiscounts.ranges.length > 0) {
            discountsList = karmaDiscounts.ranges
                .sort((a, b) => b.minKarma - a.minKarma)
                .map(range => {
                    const karmaIcon = range.minKarma >= 0 ? '😇' : '😈';
                    return `${karmaIcon} **${range.minKarma}+ karma net** → -${range.discount}%`;
                })
                .join('\n');
        }

        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('💸 Remises Karma Boutique')
            .setDescription('Système de remises automatiques basé sur le karma net')
            .addFields([
                {
                    name: '🔄 Status',
                    value: karmaDiscounts.enabled ? '✅ Activé' : '❌ Désactivé',
                    inline: true
                },
                {
                    name: '📊 Tranches Configurées',
                    value: `${karmaDiscounts.ranges?.length || 0}`,
                    inline: true
                },
                {
                    name: '💰 Remises Actuelles',
                    value: discountsList,
                    inline: false
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('karma_discounts_actions')
            .setPlaceholder('Configuration remises karma...')
            .addOptions([
                {
                    label: '🔄 Toggle Activation',
                    value: 'toggle_karma_discounts',
                    description: karmaDiscounts.enabled ? 'Désactiver les remises' : 'Activer les remises',
                    emoji: '🔄'
                },
                {
                    label: '➕ Créer Remise',
                    value: 'create_karma_discount',
                    description: 'Créer une nouvelle remise karma',
                    emoji: '➕'
                },
                {
                    label: '✏️ Modifier Remise',
                    value: 'modify_karma_discount',
                    description: 'Modifier une remise existante',
                    emoji: '✏️'
                },
                {
                    label: '🗑️ Supprimer Remise',
                    value: 'delete_karma_discount',
                    description: 'Supprimer une remise',
                    emoji: '🗑️'
                },
                {
                    label: '↩️ Retour Boutique',
                    value: 'economy_shop_config',
                    description: 'Retour configuration boutique'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async showAddKarmaDiscountModal(interaction) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

        const modal = new ModalBuilder()
            .setCustomId('add_karma_discount_modal')
            .setTitle('➕ Nouvelle Tranche Remise');

        const karmaInput = new TextInputBuilder()
            .setCustomId('min_karma')
            .setLabel('Karma Net Minimum')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 10 ou -5')
            .setMinLength(1)
            .setMaxLength(4)
            .setRequired(true);

        const discountInput = new TextInputBuilder()
            .setCustomId('discount_percent')
            .setLabel('Pourcentage de Remise (1-50%)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 15')
            .setMinLength(1)
            .setMaxLength(2)
            .setRequired(true);

        const nameInput = new TextInputBuilder()
            .setCustomId('range_name')
            .setLabel('Nom de la Tranche (optionnel)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: Remise Héros')
            .setMinLength(0)
            .setMaxLength(30)
            .setRequired(false);

        const karmaRow = new ActionRowBuilder().addComponents(karmaInput);
        const discountRow = new ActionRowBuilder().addComponents(discountInput);
        const nameRow = new ActionRowBuilder().addComponents(nameInput);

        modal.addComponents(karmaRow, discountRow, nameRow);
        await interaction.showModal(modal);
    }

    async handleAddKarmaDiscountModal(interaction) {
        const minKarma = parseInt(interaction.fields.getTextInputValue('min_karma'));
        const discountPercent = parseInt(interaction.fields.getTextInputValue('discount_percent'));
        const rangeName = interaction.fields.getTextInputValue('range_name') || null;

        // Validation
        if (isNaN(minKarma) || minKarma < -999 || minKarma > 999) {
            await interaction.reply({
                content: '❌ Le karma minimum doit être un nombre entre -999 et +999.',
                flags: 64
            });
            return;
        }

        if (isNaN(discountPercent) || discountPercent < 1 || discountPercent > 50) {
            await interaction.reply({
                content: '❌ Le pourcentage de remise doit être entre 1% et 50%.',
                flags: 64
            });
            return;
        }

        const guildId = interaction.guild.id;
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        
        if (!economyConfig.karmaDiscounts) {
            economyConfig.karmaDiscounts = { enabled: false, ranges: [] };
        }

        // Vérifier si cette tranche existe déjà
        const existingRange = economyConfig.karmaDiscounts.ranges.find(r => r.minKarma === minKarma);
        if (existingRange) {
            await interaction.reply({
                content: `❌ Une tranche pour ${minKarma} karma net existe déjà (${existingRange.discount}% de remise).`,
                flags: 64
            });
            return;
        }

        // Ajouter la nouvelle tranche
        const newRange = {
            id: Date.now(),
            minKarma: minKarma,
            discount: discountPercent,
            name: rangeName,
            createdAt: new Date().toISOString()
        };

        economyConfig.karmaDiscounts.ranges.push(newRange);
        await this.dataManager.saveData('economy.json', economyConfig);

        const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
        const karmaIcon = minKarma >= 0 ? '😇' : '😈';

        const embed = new EmbedBuilder()
            .setColor('#27ae60')
            .setTitle('✅ Tranche Remise Ajoutée')
            .setDescription(`${karmaIcon} **Nouvelle tranche créée avec succès !**`)
            .addFields([
                {
                    name: '⚖️ Karma Net Minimum',
                    value: `${minKarma}`,
                    inline: true
                },
                {
                    name: '💸 Remise',
                    value: `${discountPercent}%`,
                    inline: true
                },
                {
                    name: '🏷️ Nom',
                    value: rangeName || 'Sans nom',
                    inline: true
                },
                {
                    name: '📊 Total Tranches',
                    value: `${economyConfig.karmaDiscounts.ranges.length} configurées`,
                    inline: false
                }
            ]);

        const backButton = new ButtonBuilder()
            .setCustomId('back_karma_discounts')
            .setLabel('↩️ Retour Remises')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(backButton);
        await interaction.reply({ embeds: [embed], components: [row] });
    }

    async toggleKarmaDiscounts(interaction) {
        const guildId = interaction.guild.id;
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        
        if (!economyConfig.karmaDiscounts) {
            economyConfig.karmaDiscounts = { enabled: false, ranges: [] };
        }

        economyConfig.karmaDiscounts.enabled = !economyConfig.karmaDiscounts.enabled;
        await this.dataManager.saveData('economy.json', economyConfig);

        const status = economyConfig.karmaDiscounts.enabled ? 'activées' : 'désactivées';
        const icon = economyConfig.karmaDiscounts.enabled ? '✅' : '❌';

        await interaction.update({
            content: `${icon} Les remises karma ont été **${status}** !`,
            embeds: [],
            components: []
        });

        // Retour automatique au menu remises après 2 secondes
        setTimeout(async () => {
            try {
                await this.showKarmaDiscountsConfig(interaction);
            } catch (error) {
                console.log('Timeout retour menu remises:', error.message);
            }
        }, 2000);
    }

    async handleKarmaDiscountsInteraction(interaction) {
        const selectedValue = interaction.values[0];
        
        switch (selectedValue) {
            case 'toggle_karma_discounts':
                await this.toggleKarmaDiscounts(interaction);
                break;
                
            case 'add_karma_discount_range':
                await this.showAddKarmaDiscountModal(interaction);
                break;
                
            case 'back_shop_config':
                await this.showShopConfig(interaction);
                break;
                
            default:
                await interaction.reply({ 
                    content: '❌ Option de remise karma non reconnue.', 
                    flags: 64 
                });
        }
    }

    async handleKarmaDiscountsAction(interaction) {
        const selectedValue = interaction.values[0];
        
        console.log('🎯 Action remise karma sélectionnée:', selectedValue);
        
        switch (selectedValue) {
            case 'toggle_karma_discounts':
                await this.toggleKarmaDiscounts(interaction);
                break;
                
            case 'create_karma_discount':
                await this.showCreateKarmaDiscountModal(interaction);
                break;
                
            case 'modify_karma_discount':
                await this.showModifyKarmaDiscountSelector(interaction);
                break;
                
            case 'delete_karma_discount':
                await this.showDeleteKarmaDiscountSelector(interaction);
                break;
                
            case 'economy_shop_config':
                await this.showShopConfig(interaction);
                break;
                
            default:
                await interaction.reply({ 
                    content: '❌ Option de remise karma non reconnue.', 
                    flags: 64 
                });
        }
    }

    // Nouvelles méthodes pour la gestion complète des remises karma

    async showCreateKarmaDiscountModal(interaction) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

        const modal = new ModalBuilder()
            .setCustomId('create_karma_discount_modal')
            .setTitle('➕ Créer Remise Karma');

        const nameInput = new TextInputBuilder()
            .setCustomId('discount_name')
            .setLabel('Nom de la remise')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(30)
            .setPlaceholder('Ex: Membres Exemplaires')
            .setRequired(true);

        const karmaInput = new TextInputBuilder()
            .setCustomId('discount_karma')
            .setLabel('Karma net minimum requis')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(5)
            .setPlaceholder('Ex: 10 (pour karma net ≥ 10)')
            .setRequired(true);

        const percentInput = new TextInputBuilder()
            .setCustomId('discount_percent')
            .setLabel('Pourcentage de remise (1-99)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(2)
            .setPlaceholder('Ex: 15 (pour 15% de remise)')
            .setRequired(true);

        const nameRow = new ActionRowBuilder().addComponents(nameInput);
        const karmaRow = new ActionRowBuilder().addComponents(karmaInput);
        const percentRow = new ActionRowBuilder().addComponents(percentInput);

        modal.addComponents(nameRow, karmaRow, percentRow);
        await interaction.showModal(modal);
    }

    async showModifyKarmaDiscountSelector(interaction) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const discounts = economyConfig.karmaDiscounts?.ranges || [];

        if (discounts.length === 0) {
            await interaction.update({
                content: '❌ Aucune remise karma configurée à modifier.',
                components: []
            });
            return;
        }

        const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('✏️ Modifier Remise Karma')
            .setDescription('Sélectionnez la remise à modifier');

        const options = discounts.slice(0, 20).map(discount => ({
            label: `${discount.name || 'Remise sans nom'}`,
            value: `modify_discount_${discount.id}`,
            description: `Karma ≥ ${discount.minKarma} → ${discount.discount}% de remise`,
            emoji: discount.minKarma >= 0 ? '😇' : '😈'
        }));

        options.push({
            label: '↩️ Retour aux remises',
            value: 'back_karma_discounts',
            description: 'Retour au menu des remises karma'
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('modify_karma_discount_select')
            .setPlaceholder('Choisir une remise à modifier...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showDeleteKarmaDiscountSelector(interaction) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const discounts = economyConfig.karmaDiscounts?.ranges || [];

        if (discounts.length === 0) {
            await interaction.update({
                content: '❌ Aucune remise karma configurée à supprimer.',
                components: []
            });
            return;
        }

        const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🗑️ Supprimer Remise Karma')
            .setDescription('⚠️ Sélectionnez la remise à supprimer définitivement');

        const options = discounts.slice(0, 20).map(discount => ({
            label: `${discount.name || 'Remise sans nom'}`,
            value: `delete_discount_${discount.id}`,
            description: `Karma ≥ ${discount.minKarma} → ${discount.discount}% de remise`,
            emoji: '🗑️'
        }));

        options.push({
            label: '↩️ Retour aux remises',
            value: 'back_karma_discounts',
            description: 'Retour au menu des remises karma'
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('delete_karma_discount_select')
            .setPlaceholder('Choisir une remise à supprimer...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showModifyKarmaDiscountModal(interaction, discountId) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const discount = economyConfig.karmaDiscounts?.ranges?.find(d => d.id == discountId);

        if (!discount) {
            await interaction.reply({
                content: '❌ Remise introuvable.',
                flags: 64
            });
            return;
        }

        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

        const modal = new ModalBuilder()
            .setCustomId(`modify_karma_discount_modal_${discountId}`)
            .setTitle('✏️ Modifier Remise Karma');

        const nameInput = new TextInputBuilder()
            .setCustomId('discount_name')
            .setLabel('Nom de la remise')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(30)
            .setValue(discount.name || '')
            .setPlaceholder('Ex: Membres Exemplaires')
            .setRequired(true);

        const karmaInput = new TextInputBuilder()
            .setCustomId('discount_karma')
            .setLabel('Karma net minimum requis')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(5)
            .setValue(discount.minKarma.toString())
            .setPlaceholder('Ex: 10 (pour karma net ≥ 10)')
            .setRequired(true);

        const percentInput = new TextInputBuilder()
            .setCustomId('discount_percent')
            .setLabel('Pourcentage de remise (1-99)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(2)
            .setValue(discount.discount.toString())
            .setPlaceholder('Ex: 15 (pour 15% de remise)')
            .setRequired(true);

        const nameRow = new ActionRowBuilder().addComponents(nameInput);
        const karmaRow = new ActionRowBuilder().addComponents(karmaInput);
        const percentRow = new ActionRowBuilder().addComponents(percentInput);

        modal.addComponents(nameRow, karmaRow, percentRow);
        await interaction.showModal(modal);
    }

    async handleDeleteKarmaDiscount(interaction, discountId) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const discountIndex = economyConfig.karmaDiscounts?.ranges?.findIndex(d => d.id == discountId);

        if (discountIndex === -1 || discountIndex === undefined) {
            await interaction.reply({
                content: '❌ Remise introuvable.',
                flags: 64
            });
            return;
        }

        const discount = economyConfig.karmaDiscounts.ranges[discountIndex];
        
        // Supprimer la remise
        economyConfig.karmaDiscounts.ranges.splice(discountIndex, 1);
        await this.dataManager.saveData('economy.json', economyConfig);

        await interaction.reply({
            content: `✅ Remise supprimée !\n\n🗑️ **${discount.name}** (${discount.minKarma}+ karma → ${discount.discount}% remise) a été supprimée définitivement.`,
            flags: 64
        });
    }

    async handleModifyKarmaDiscountModal(interaction) {
        const discountId = interaction.customId.split('_').pop();
        const name = interaction.fields.getTextInputValue('discount_name');
        const karmaStr = interaction.fields.getTextInputValue('discount_karma');
        const percentStr = interaction.fields.getTextInputValue('discount_percent');

        // Validation
        const karmaValue = parseInt(karmaStr);
        const percentage = parseInt(percentStr);

        if (isNaN(karmaValue) || karmaValue < -999 || karmaValue > 999) {
            await interaction.reply({
                content: '❌ Valeur karma invalide. Entrez un nombre entre -999 et +999.',
                flags: 64
            });
            return;
        }

        if (isNaN(percentage) || percentage < 1 || percentage > 99) {
            await interaction.reply({
                content: '❌ Pourcentage invalide. Entrez un nombre entre 1 et 99.',
                flags: 64
            });
            return;
        }

        // Modifier la remise
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const discount = economyConfig.karmaDiscounts?.ranges?.find(d => d.id == discountId);

        if (!discount) {
            await interaction.reply({
                content: '❌ Remise introuvable.',
                flags: 64
            });
            return;
        }

        discount.name = name;
        discount.minKarma = karmaValue;
        discount.discount = percentage;
        discount.modifiedAt = new Date().toISOString();

        await this.dataManager.saveData('economy.json', economyConfig);

        await interaction.reply({
            content: `✅ Remise modifiée !\n\n💸 **${name}**\n⚖️ Karma net ≥ ${karmaValue}\n📊 Remise: **${percentage}%**`,
            flags: 64
        });
    }

    async handleCreateKarmaDiscountModal(interaction) {
        const name = interaction.fields.getTextInputValue('discount_name');
        const karmaStr = interaction.fields.getTextInputValue('discount_karma');
        const percentStr = interaction.fields.getTextInputValue('discount_percent');

        // Validation
        const karmaValue = parseInt(karmaStr);
        const percentage = parseInt(percentStr);

        if (isNaN(karmaValue) || karmaValue < -999 || karmaValue > 999) {
            await interaction.reply({
                content: '❌ Valeur karma invalide. Entrez un nombre entre -999 et +999.',
                flags: 64
            });
            return;
        }

        if (isNaN(percentage) || percentage < 1 || percentage > 99) {
            await interaction.reply({
                content: '❌ Pourcentage invalide. Entrez un nombre entre 1 et 99.',
                flags: 64
            });
            return;
        }

        // Sauvegarder
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        if (!economyConfig.karmaDiscounts) {
            economyConfig.karmaDiscounts = { enabled: false, ranges: [] };
        }

        const newRange = {
            id: Date.now(),
            name: name,
            minKarma: karmaValue,
            discount: percentage,
            createdAt: new Date().toISOString()
        };

        economyConfig.karmaDiscounts.ranges.push(newRange);
        await this.dataManager.saveData('economy.json', economyConfig);

        await interaction.reply({
            content: `✅ Remise karma créée !\n\n💸 **${name}**\n⚖️ Karma net ≥ ${karmaValue}\n📊 Remise: **${percentage}%**`,
            flags: 64
        });
    }

    async handleToggleKarmaDiscounts(interaction) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        
        if (!economyConfig.karmaDiscounts) {
            economyConfig.karmaDiscounts = { enabled: false, ranges: [] };
        }

        economyConfig.karmaDiscounts.enabled = !economyConfig.karmaDiscounts.enabled;
        await this.dataManager.saveData('economy.json', economyConfig);

        const status = economyConfig.karmaDiscounts.enabled ? '✅ Activé' : '❌ Désactivé';
        
        await interaction.reply({
            content: `🔄 **Remises Karma ${status}**\n\n${economyConfig.karmaDiscounts.enabled ? '💸 Les remises karma sont maintenant appliquées lors des achats.' : '⚠️ Les remises karma sont désactivées.'}`,
            flags: 64
        });
    }
}

module.exports = EconomyConfigHandler;
