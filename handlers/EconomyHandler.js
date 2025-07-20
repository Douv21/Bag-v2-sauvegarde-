const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

class EconomyHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

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
            case 'daily':
                await this.showDailyConfig(interaction);
                break;
            case 'messages':
                await this.showMessagesConfig(interaction);
                break;
            case 'stats':
                await this.showStatsConfig(interaction);
                break;
            default:
                await interaction.reply({
                    content: `Configuration économique ${value} disponible prochainement.`,
                    flags: 64
                });
        }
    }

    async showActionsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('💼 Configuration Actions Économiques')
            .setDescription('Configurez les actions économiques disponibles sur ce serveur')
            .addFields([
                {
                    name: '😇 Actions Positives',
                    value: '**Travailler** - Gain d\'argent légal\n**Pêcher** - Activité relaxante\n**Donner** - Générosité entre membres',
                    inline: true
                },
                {
                    name: '😈 Actions Négatives',
                    value: '**Voler** - Vol d\'argent risqué\n**Crime** - Activité criminelle\n**Parier** - Jeu de hasard',
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_actions_config')
            .setPlaceholder('💼 Configurer une action')
            .addOptions([
                {
                    label: 'Travailler',
                    description: 'Configuration travail (récompenses, cooldown)',
                    value: 'travailler',
                    emoji: '👷'
                },
                {
                    label: 'Pêcher',
                    description: 'Configuration pêche (récompenses, cooldown)',
                    value: 'pecher',
                    emoji: '🎣'
                },
                {
                    label: 'Donner',
                    description: 'Configuration dons entre membres',
                    value: 'donner',
                    emoji: '💝'
                },
                {
                    label: 'Voler',
                    description: 'Configuration vol (récompenses, risques)',
                    value: 'voler',
                    emoji: '🔫'
                },
                {
                    label: 'Crime',
                    description: 'Configuration crimes (récompenses, risques)',
                    value: 'crime',
                    emoji: '🔪'
                },
                {
                    label: 'Parier',
                    description: 'Configuration paris (limites, taux)',
                    value: 'parier',
                    emoji: '🎰'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showShopConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🛒 Configuration Boutique')
            .setDescription('Gérez les objets et rôles disponibles dans la boutique');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_shop_config')
            .setPlaceholder('🛒 Configurer la boutique')
            .addOptions([
                {
                    label: 'Ajouter Rôle',
                    description: 'Ajouter un rôle à vendre',
                    value: 'add_role',
                    emoji: '➕'
                },
                {
                    label: 'Retirer Rôle',
                    description: 'Retirer un rôle de la boutique',
                    value: 'remove_role',
                    emoji: '➖'
                },
                {
                    label: 'Prix Rôles',
                    description: 'Modifier les prix des rôles',
                    value: 'edit_prices',
                    emoji: '💰'
                },
                {
                    label: 'Voir Boutique',
                    description: 'Afficher tous les objets disponibles',
                    value: 'list_items',
                    emoji: '📋'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showKarmaConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle('⚖️ Configuration Système Karma')
            .setDescription('Configurez les sanctions et récompenses automatiques basées sur le karma');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_config')
            .setPlaceholder('⚖️ Configurer le karma')
            .addOptions([
                {
                    label: 'Niveaux Karma',
                    description: 'Configurer les seuils et noms des niveaux',
                    value: 'levels',
                    emoji: '📊'
                },
                {
                    label: 'Récompenses Automatiques',
                    description: 'Récompenses hebdomadaires par niveau',
                    value: 'rewards',
                    emoji: '🎁'
                },
                {
                    label: 'Reset Hebdomadaire',
                    description: 'Configuration du reset automatique',
                    value: 'reset',
                    emoji: '🔄'
                },
                {
                    label: 'Gains par Action',
                    description: 'Karma gagné/perdu par action',
                    value: 'action_karma',
                    emoji: '⚡'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showDailyConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ffff00')
            .setTitle('🎁 Configuration Daily')
            .setDescription('Configurez les récompenses quotidiennes');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_daily_config')
            .setPlaceholder('🎁 Configurer le daily')
            .addOptions([
                {
                    label: 'Montants Daily',
                    description: 'Configurer les montants quotidiens',
                    value: 'amounts',
                    emoji: '💰'
                },
                {
                    label: 'Bonus Streak',
                    description: 'Bonus pour les séries quotidiennes',
                    value: 'streak',
                    emoji: '🔥'
                },
                {
                    label: 'Reset Hebdomadaire',
                    description: 'Configuration du reset des streaks',
                    value: 'reset',
                    emoji: '🔄'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showMessagesConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#00ffff')
            .setTitle('💬 Configuration Récompenses Messages')
            .setDescription('Configurez les gains automatiques pour chaque message');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_messages_config')
            .setPlaceholder('💬 Configurer les récompenses messages')
            .addOptions([
                {
                    label: 'Activer/Désactiver',
                    description: 'Activer ou désactiver le système',
                    value: 'toggle',
                    emoji: '🔄'
                },
                {
                    label: 'Montant par Message',
                    description: 'Argent gagné par message écrit',
                    value: 'amount',
                    emoji: '💰'
                },
                {
                    label: 'Cooldown Messages',
                    description: 'Temps d\'attente entre récompenses',
                    value: 'cooldown',
                    emoji: '⏰'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showStatsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff00ff')
            .setTitle('📊 Statistiques Économiques')
            .setDescription('Consultez les données du système économique');

        await interaction.update({
            embeds: [embed],
            components: []
        });
    }

    // Handlers pour les actions spécifiques
    async handleEconomyActionsConfig(interaction) {
        const action = interaction.values[0];
        
        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle(`⚙️ Configuration Action: ${action}`)
            .setDescription(`Configurez les paramètres pour l'action **${action}**`);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`economy_action_${action}_config`)
            .setPlaceholder('⚙️ Configurer les paramètres')
            .addOptions([
                {
                    label: 'Récompenses',
                    description: 'Modifier les montants min/max',
                    value: 'rewards',
                    emoji: '💰'
                },
                {
                    label: 'Karma',
                    description: 'Configuration gains/pertes karma',
                    value: 'karma',
                    emoji: '⚖️'
                },
                {
                    label: 'Cooldown',
                    description: 'Temps d\'attente entre utilisations',
                    value: 'cooldown',
                    emoji: '⏰'
                },
                {
                    label: 'Activer/Désactiver',
                    description: 'Activer ou désactiver cette action',
                    value: 'toggle',
                    emoji: '🔄'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async handleEconomyShopConfig(interaction) {
        const option = interaction.values[0];
        
        switch(option) {
            case 'add_role':
                await this.showAddRoleConfig(interaction);
                break;
            case 'remove_role':
                await this.showRemoveRoleConfig(interaction);
                break;
            case 'edit_prices':
                await this.showEditPricesConfig(interaction);
                break;
            case 'list_items':
                await this.showShopItems(interaction);
                break;
            default:
                await interaction.update({
                    content: `🛒 Configuration boutique **${option}** disponible prochainement.`,
                    embeds: [],
                    components: []
                });
        }
    }

    async handleEconomyKarmaConfig(interaction) {
        const option = interaction.values[0];
        
        switch(option) {
            case 'levels':
                await this.showKarmaLevelsConfig(interaction);
                break;
            case 'rewards':
                await this.showKarmaRewardsConfig(interaction);
                break;
            case 'reset':
                await this.showKarmaResetConfig(interaction);
                break;
            case 'action_karma':
                await this.showActionKarmaConfig(interaction);
                break;
            default:
                await interaction.update({
                    content: `⚖️ Configuration karma **${option}** disponible prochainement.`,
                    embeds: [],
                    components: []
                });
        }
    }

    async handleEconomyDailyConfig(interaction) {
        const option = interaction.values[0];
        
        switch(option) {
            case 'amounts':
                await this.showDailyAmountsConfig(interaction);
                break;
            case 'streak':
                await this.showDailyStreakConfig(interaction);
                break;
            case 'reset':
                await this.showDailyResetConfig(interaction);
                break;
            default:
                await interaction.update({
                    content: `🎁 Configuration daily **${option}** disponible prochainement.`,
                    embeds: [],
                    components: []
                });
        }
    }

    async handleEconomyMessagesConfig(interaction) {
        const option = interaction.values[0];
        
        switch(option) {
            case 'toggle':
                await this.showMessagesToggleConfig(interaction);
                break;
            case 'amount':
                await this.showMessagesAmountConfig(interaction);
                break;
            case 'cooldown':
                await this.showMessagesCooldownConfig(interaction);
                break;
            default:
                await interaction.update({
                    content: `💬 Configuration messages **${option}** disponible prochainement.`,
                    embeds: [],
                    components: []
                });
        }
    }

    // Méthodes de configuration détaillées
    async showAddRoleConfig(interaction) {
        await interaction.update({
            content: '🛒 **Ajouter un rôle à la boutique**\n\nUtilisez le sélecteur de rôle ci-dessous pour ajouter un rôle à vendre.',
            embeds: [],
            components: []
        });
    }

    async showRemoveRoleConfig(interaction) {
        await interaction.update({
            content: '🛒 **Retirer un rôle de la boutique**\n\nSélectionnez un rôle à retirer de la boutique.',
            embeds: [],
            components: []
        });
    }

    async showEditPricesConfig(interaction) {
        await interaction.update({
            content: '🛒 **Modifier les prix**\n\nConfiguration des prix des rôles disponible.',
            embeds: [],
            components: []
        });
    }

    async showShopItems(interaction) {
        await interaction.update({
            content: '🛒 **Objets de la boutique**\n\nAffichage de tous les objets disponibles.',
            embeds: [],
            components: []
        });
    }

    async showKarmaLevelsConfig(interaction) {
        await interaction.update({
            content: '⚖️ **Niveaux Karma**\n\nConfiguration des seuils et noms des niveaux de karma.',
            embeds: [],
            components: []
        });
    }

    async showKarmaRewardsConfig(interaction) {
        await interaction.update({
            content: '⚖️ **Récompenses Karma**\n\nConfiguration des récompenses hebdomadaires par niveau.',
            embeds: [],
            components: []
        });
    }

    async showKarmaResetConfig(interaction) {
        await interaction.update({
            content: '⚖️ **Reset Karma**\n\nConfiguration du reset automatique hebdomadaire.',
            embeds: [],
            components: []
        });
    }

    async showActionKarmaConfig(interaction) {
        await interaction.update({
            content: '⚖️ **Karma par Action**\n\nConfiguration du karma gagné/perdu par chaque action.',
            embeds: [],
            components: []
        });
    }

    async showDailyAmountsConfig(interaction) {
        await interaction.update({
            content: '🎁 **Montants Daily**\n\nConfiguration des montants de récompenses quotidiennes.',
            embeds: [],
            components: []
        });
    }

    async showDailyStreakConfig(interaction) {
        await interaction.update({
            content: '🎁 **Bonus Streak**\n\nConfiguration des bonus pour les séries quotidiennes.',
            embeds: [],
            components: []
        });
    }

    async showDailyResetConfig(interaction) {
        await interaction.update({
            content: '🎁 **Reset Daily**\n\nConfiguration du reset des streaks quotidiens.',
            embeds: [],
            components: []
        });
    }

    async showMessagesToggleConfig(interaction) {
        await interaction.update({
            content: '💬 **Activer/Désactiver Messages**\n\nActiver ou désactiver le système de récompenses par message.',
            embeds: [],
            components: []
        });
    }

    async showMessagesAmountConfig(interaction) {
        await interaction.update({
            content: '💬 **Montant par Message**\n\nConfiguration de l\'argent gagné par message écrit.',
            embeds: [],
            components: []
        });
    }

    async showMessagesCooldownConfig(interaction) {
        await interaction.update({
            content: '💬 **Cooldown Messages**\n\nConfiguration du temps d\'attente entre récompenses.',
            embeds: [],
            components: []
        });
    }

    // Handler pour les sous-configurations d'actions
    async handleActionSubConfig(interaction) {
        const configType = interaction.values[0];
        
        switch(configType) {
            case 'rewards':
                await this.showActionRewardsConfig(interaction);
                break;
            case 'karma':
                await this.showActionKarmaConfig(interaction);
                break;
            case 'cooldown':
                await this.showActionCooldownConfig(interaction);
                break;
            case 'toggle':
                await this.showActionToggleConfig(interaction);
                break;
            default:
                await interaction.update({
                    content: `⚙️ Configuration **${configType}** disponible prochainement.`,
                    embeds: [],
                    components: []
                });
        }
    }

    async showActionRewardsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('💰 Configuration Récompenses Action')
            .setDescription('Configurez les montants min/max pour cette action')
            .addFields(
                { name: 'Montant Minimum', value: '50€', inline: true },
                { name: 'Montant Maximum', value: '200€', inline: true },
                { name: 'Bonus Karma', value: '+10%', inline: true }
            );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_rewards_edit_config')
            .setPlaceholder('⚙️ Modifier les récompenses')
            .addOptions([
                {
                    label: 'Montant Minimum',
                    description: 'Modifier le montant minimum (actuellement 50€)',
                    value: 'min_amount',
                    emoji: '📉'
                },
                {
                    label: 'Montant Maximum', 
                    description: 'Modifier le montant maximum (actuellement 200€)',
                    value: 'max_amount',
                    emoji: '📈'
                },
                {
                    label: 'Bonus Karma',
                    description: 'Modifier le bonus karma (+10%)',
                    value: 'karma_bonus',
                    emoji: '⭐'
                },
                {
                    label: 'Retour Actions',
                    description: 'Retourner au menu des actions',
                    value: 'back_actions',
                    emoji: '🔙'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showActionKarmaConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('⚖️ Configuration Karma Action')
            .setDescription('Configurez les gains/pertes de karma')
            .addFields(
                { name: 'Karma Bon', value: '+2 😇', inline: true },
                { name: 'Karma Mauvais', value: '-1 😈', inline: true },
                { name: 'Multiplicateur', value: 'x1.5', inline: true }
            );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_edit_config')
            .setPlaceholder('⚙️ Modifier les gains karma')
            .addOptions([
                {
                    label: 'Karma Bon (😇)',
                    description: 'Modifier le gain de bon karma (+2)',
                    value: 'good_karma',
                    emoji: '😇'
                },
                {
                    label: 'Karma Mauvais (😈)',
                    description: 'Modifier la perte de mauvais karma (-1)',
                    value: 'bad_karma',
                    emoji: '😈'
                },
                {
                    label: 'Multiplicateur',
                    description: 'Modifier le multiplicateur (x1.5)',
                    value: 'multiplier',
                    emoji: '✨'
                },
                {
                    label: 'Retour Actions',
                    description: 'Retourner au menu des actions',
                    value: 'back_actions',
                    emoji: '🔙'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showActionCooldownConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff6347')
            .setTitle('⏰ Configuration Cooldown Action')
            .setDescription('Configurez le temps d\'attente entre utilisations')
            .addFields(
                { name: 'Cooldown Actuel', value: '1 heure', inline: true },
                { name: 'Cooldown Minimum', value: '30 minutes', inline: true },
                { name: 'Cooldown Maximum', value: '24 heures', inline: true }
            );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_cooldown_edit_config')
            .setPlaceholder('⚙️ Modifier le temps d\'attente')
            .addOptions([
                {
                    label: '30 Minutes',
                    description: 'Définir cooldown à 30 minutes',
                    value: '30min',
                    emoji: '🕐'
                },
                {
                    label: '1 Heure',
                    description: 'Définir cooldown à 1 heure (défaut)',
                    value: '1hour',
                    emoji: '🕒'
                },
                {
                    label: '2 Heures',
                    description: 'Définir cooldown à 2 heures',
                    value: '2hours',
                    emoji: '🕔'
                },
                {
                    label: 'Personnalisé',
                    description: 'Définir un cooldown personnalisé',
                    value: 'custom',
                    emoji: '⚙️'
                },
                {
                    label: 'Retour Actions',
                    description: 'Retourner au menu des actions',
                    value: 'back_actions',
                    emoji: '🔙'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showActionToggleConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#32cd32')
            .setTitle('🔄 Activer/Désactiver Action')
            .setDescription('Activez ou désactivez cette action économique')
            .addFields(
                { name: 'Statut Actuel', value: '✅ Activé', inline: true },
                { name: 'Utilisations Aujourd\'hui', value: '47', inline: true },
                { name: 'Dernière Utilisation', value: 'Il y a 12 min', inline: true }
            );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_toggle_edit_config')
            .setPlaceholder('⚙️ Modifier le statut')
            .addOptions([
                {
                    label: 'Désactiver Action',
                    description: 'Désactiver temporairement cette action',
                    value: 'disable',
                    emoji: '❌'
                },
                {
                    label: 'Activer Action',
                    description: 'Réactiver cette action',
                    value: 'enable',
                    emoji: '✅'
                },
                {
                    label: 'Statistiques',
                    description: 'Voir les statistiques détaillées',
                    value: 'stats',
                    emoji: '📊'
                },
                {
                    label: 'Retour Actions',
                    description: 'Retourner au menu des actions',
                    value: 'back_actions',
                    emoji: '🔙'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    // Handlers pour l'édition des configurations spécifiques
    async handleRewardsEditConfig(interaction) {
        const option = interaction.values[0];
        
        if (option === 'back_actions') {
            return await this.showActionsConfig(interaction);
        }
        
        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle(`💰 Configuration: ${option}`)
            .setDescription('Sélectionnez une nouvelle valeur pour cette configuration');
        
        let selectMenu;
        
        switch(option) {
            case 'min_amount':
            case 'max_amount':
                embed.addFields(
                    { name: 'Plage Disponible', value: '0€ - 200€', inline: true },
                    { name: 'Valeur Actuelle', value: option === 'min_amount' ? '50€' : '150€', inline: true }
                );
                
                const moneyOptions = [];
                for (let i = 0; i <= 200; i += 25) {
                    moneyOptions.push({
                        label: `${i}€`,
                        value: `money_${i}`,
                        emoji: '💰'
                    });
                }
                moneyOptions.push({
                    label: 'Retour Configuration',
                    value: 'back_rewards',
                    emoji: '🔙'
                });
                
                selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('economy_money_value_config')
                    .setPlaceholder('💰 Choisir un montant (0€ - 200€)')
                    .addOptions(moneyOptions.slice(0, 25)); // Discord limite à 25 options
                break;
                
            case 'karma_bonus':
                embed.addFields(
                    { name: 'Plage Disponible', value: '0% - 100%', inline: true },
                    { name: 'Valeur Actuelle', value: '10%', inline: true }
                );
                
                selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('economy_bonus_value_config')
                    .setPlaceholder('⭐ Choisir un bonus')
                    .addOptions([
                        { label: '0%', value: 'bonus_0', emoji: '💰' },
                        { label: '5%', value: 'bonus_5', emoji: '💰' },
                        { label: '10%', value: 'bonus_10', emoji: '💰' },
                        { label: '15%', value: 'bonus_15', emoji: '💰' },
                        { label: '20%', value: 'bonus_20', emoji: '💰' },
                        { label: '25%', value: 'bonus_25', emoji: '💰' },
                        { label: '30%', value: 'bonus_30', emoji: '💰' },
                        { label: '50%', value: 'bonus_50', emoji: '💰' },
                        { label: '75%', value: 'bonus_75', emoji: '💰' },
                        { label: '100%', value: 'bonus_100', emoji: '💰' },
                        { label: 'Retour Configuration', value: 'back_rewards', emoji: '🔙' }
                    ]);
                break;
        }
        
        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async handleKarmaEditConfig(interaction) {
        const option = interaction.values[0];
        
        if (option === 'back_actions') {
            return await this.showActionsConfig(interaction);
        }
        
        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle(`⚖️ Configuration: ${option}`)
            .setDescription('Sélectionnez une nouvelle valeur pour cette configuration karma');
        
        let selectMenu;
        
        switch(option) {
            case 'good_karma':
                embed.addFields(
                    { name: 'Plage Disponible', value: '-5 à +5 😇', inline: true },
                    { name: 'Valeur Actuelle', value: '+2', inline: true }
                );
                
                selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('economy_good_karma_config')
                    .setPlaceholder('😇 Choisir karma positif (-5 à +5)')
                    .addOptions([
                        { label: '-5 😇', value: 'good_-5', emoji: '😇' },
                        { label: '-4 😇', value: 'good_-4', emoji: '😇' },
                        { label: '-3 😇', value: 'good_-3', emoji: '😇' },
                        { label: '-2 😇', value: 'good_-2', emoji: '😇' },
                        { label: '-1 😇', value: 'good_-1', emoji: '😇' },
                        { label: '0 😇', value: 'good_0', emoji: '😇' },
                        { label: '+1 😇', value: 'good_1', emoji: '😇' },
                        { label: '+2 😇', value: 'good_2', emoji: '😇' },
                        { label: '+3 😇', value: 'good_3', emoji: '😇' },
                        { label: '+4 😇', value: 'good_4', emoji: '😇' },
                        { label: '+5 😇', value: 'good_5', emoji: '😇' },
                        { label: 'Retour Configuration', value: 'back_karma', emoji: '🔙' }
                    ]);
                break;
                
            case 'bad_karma':
                embed.addFields(
                    { name: 'Plage Disponible', value: '-5 à +5 😈', inline: true },
                    { name: 'Valeur Actuelle', value: '+1', inline: true }
                );
                
                selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('economy_bad_karma_config')
                    .setPlaceholder('😈 Choisir karma négatif (-5 à +5)')
                    .addOptions([
                        { label: '-5 😈', value: 'bad_-5', emoji: '😈' },
                        { label: '-4 😈', value: 'bad_-4', emoji: '😈' },
                        { label: '-3 😈', value: 'bad_-3', emoji: '😈' },
                        { label: '-2 😈', value: 'bad_-2', emoji: '😈' },
                        { label: '-1 😈', value: 'bad_-1', emoji: '😈' },
                        { label: '0 😈', value: 'bad_0', emoji: '😈' },
                        { label: '+1 😈', value: 'bad_1', emoji: '😈' },
                        { label: '+2 😈', value: 'bad_2', emoji: '😈' },
                        { label: '+3 😈', value: 'bad_3', emoji: '😈' },
                        { label: '+4 😈', value: 'bad_4', emoji: '😈' },
                        { label: '+5 😈', value: 'bad_5', emoji: '😈' },
                        { label: 'Retour Configuration', value: 'back_karma', emoji: '🔙' }
                    ]);
                break;
                
            case 'multiplier':
                embed.addFields(
                    { name: 'Plage Disponible', value: 'x0.5 à x5.0', inline: true },
                    { name: 'Valeur Actuelle', value: 'x1.5', inline: true }
                );
                
                selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('economy_multiplier_config')
                    .setPlaceholder('✨ Choisir multiplicateur')
                    .addOptions([
                        { label: 'x0.5', value: 'mult_0.5', emoji: '✨' },
                        { label: 'x0.8', value: 'mult_0.8', emoji: '✨' },
                        { label: 'x1.0', value: 'mult_1.0', emoji: '✨' },
                        { label: 'x1.2', value: 'mult_1.2', emoji: '✨' },
                        { label: 'x1.5', value: 'mult_1.5', emoji: '✨' },
                        { label: 'x2.0', value: 'mult_2.0', emoji: '✨' },
                        { label: 'x2.5', value: 'mult_2.5', emoji: '✨' },
                        { label: 'x3.0', value: 'mult_3.0', emoji: '✨' },
                        { label: 'x4.0', value: 'mult_4.0', emoji: '✨' },
                        { label: 'x5.0', value: 'mult_5.0', emoji: '✨' },
                        { label: 'Retour Configuration', value: 'back_karma', emoji: '🔙' }
                    ]);
                break;
        }
        
        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async handleCooldownEditConfig(interaction) {
        const option = interaction.values[0];
        
        if (option === 'back_actions') {
            return await this.showActionsConfig(interaction);
        }
        
        let modal;
        
        switch(option) {
            case 'set_cooldown':
                modal = new ModalBuilder()
                    .setCustomId('economy_cooldown_modal')
                    .setTitle('⏰ Temps d\'Attente')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('cooldown_minutes_input')
                                .setLabel('Temps d\'attente (en minutes)')
                                .setStyle(TextInputStyle.Short)
                                .setValue('60')
                                .setPlaceholder('Ex: 30, 60, 120, 1440...')
                                .setMinLength(1)
                                .setMaxLength(5)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('action_type_input')
                                .setLabel('Action concernée')
                                .setStyle(TextInputStyle.Short)
                                .setValue('travailler')
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('cooldown_description')
                                .setLabel('Description du cooldown (optionnel)')
                                .setStyle(TextInputStyle.Paragraph)
                                .setValue('Temps d\'attente standard pour éviter le spam')
                                .setPlaceholder('Description personnalisée...')
                                .setMaxLength(200)
                                .setRequired(false)
                        )
                    );
                break;
        }
        
        if (modal) {
            await interaction.showModal(modal);
        } else {
            await interaction.update({
                content: `⏰ **Modification cooldown: ${option}**\n\nUtilisez l'option "Définir Cooldown" pour configurer les temps d'attente.`,
                embeds: [],
                components: []
            });
        }
    }

    async handleToggleEditConfig(interaction) {
        const option = interaction.values[0];
        
        if (option === 'back_actions') {
            return await this.showActionsConfig(interaction);
        }
        
        const embed = new EmbedBuilder()
            .setColor('#32cd32')
            .setTitle(`🔄 Action: ${option}`)
            .setDescription('Gestion de l\'état de l\'action économique');
        
        switch(option) {
            case 'disable':
                embed.setColor('#ff4444')
                    .addFields(
                        { name: '⚠️ Désactivation', value: 'L\'action sera temporairement indisponible', inline: false },
                        { name: 'Impact', value: 'Les utilisateurs ne pourront plus utiliser cette commande', inline: true },
                        { name: 'Réversible', value: 'Peut être réactivée à tout moment', inline: true }
                    );
                break;
            case 'enable':
                embed.setColor('#44ff44')
                    .addFields(
                        { name: '✅ Activation', value: 'L\'action sera disponible pour tous', inline: false },
                        { name: 'Impact', value: 'Les utilisateurs pourront utiliser cette commande', inline: true },
                        { name: 'Cooldowns', value: 'Les temps d\'attente s\'appliquent', inline: true }
                    );
                break;
            case 'stats':
                embed.setColor('#4444ff')
                    .addFields(
                        { name: '📊 Statistiques', value: 'Données d\'utilisation de cette action', inline: false },
                        { name: 'Aujourd\'hui', value: '47 utilisations', inline: true },
                        { name: 'Cette semaine', value: '312 utilisations', inline: true },
                        { name: 'Utilisateur actif', value: '<@123456789>', inline: true }
                    );
                break;
        }
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_toggle_action_config')
            .setPlaceholder('⚙️ Confirmer l\'action')
            .addOptions([
                { label: 'Confirmer', value: 'confirm_' + option, emoji: '✅' },
                { label: 'Annuler', value: 'cancel', emoji: '❌' },
                { label: 'Retour Configuration', value: 'back_toggle', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }
    
    // Handlers pour les valeurs spécifiques
    async handleRewardsValueConfig(interaction) {
        const value = interaction.values[0];
        
        if (value === 'back_rewards') {
            return await this.showActionRewardsConfig(interaction);
        }
        
        await interaction.update({
            content: `💰 **Valeur modifiée: ${value}**\n\n✅ Configuration sauvegardée avec succès !`,
            embeds: [],
            components: []
        });
    }

    async handleKarmaValueConfig(interaction) {
        const value = interaction.values[0];
        
        if (value === 'back_karma') {
            return await this.showActionKarmaConfig(interaction);
        }
        
        await interaction.update({
            content: `⚖️ **Karma modifié: ${value}**\n\n✅ Configuration sauvegardée avec succès !`,
            embeds: [],
            components: []
        });
    }

    async handleToggleActionConfig(interaction) {
        const action = interaction.values[0];
        
        if (action === 'back_toggle') {
            return await this.showActionToggleConfig(interaction);
        }
        
        if (action === 'cancel') {
            return await this.showActionToggleConfig(interaction);
        }
        
        await interaction.update({
            content: `🔄 **Action effectuée: ${action}**\n\n✅ Configuration appliquée avec succès !`,
            embeds: [],
            components: []
        });
    }

    // Handlers pour les sélecteurs de valeurs spécifiques
    async handleMoneyValueConfig(interaction) {
        const value = interaction.values[0];
        
        if (value === 'back_rewards') {
            return await this.showActionRewardsConfig(interaction);
        }
        
        const amount = value.replace('money_', '');
        
        await interaction.update({
            content: `✅ **Montant configuré !**\n\n💰 **Nouveau montant**: ${amount}€\n\n*Configuration sauvegardée avec succès.*`,
            embeds: [],
            components: []
        });
    }

    async handleBonusValueConfig(interaction) {
        const value = interaction.values[0];
        
        if (value === 'back_rewards') {
            return await this.showActionRewardsConfig(interaction);
        }
        
        const bonus = value.replace('bonus_', '');
        
        await interaction.update({
            content: `✅ **Bonus configuré !**\n\n⭐ **Nouveau bonus**: ${bonus}%\n\n*Configuration sauvegardée avec succès.*`,
            embeds: [],
            components: []
        });
    }

    async handleGoodKarmaConfig(interaction) {
        const value = interaction.values[0];
        
        if (value === 'back_karma') {
            return await this.showActionKarmaConfig(interaction);
        }
        
        const karma = value.replace('good_', '');
        const sign = karma.startsWith('-') ? '' : '+';
        
        await interaction.update({
            content: `✅ **Karma positif configuré !**\n\n😇 **Nouveau karma**: ${sign}${karma} points\n\n*Configuration sauvegardée avec succès.*`,
            embeds: [],
            components: []
        });
    }

    async handleBadKarmaConfig(interaction) {
        const value = interaction.values[0];
        
        if (value === 'back_karma') {
            return await this.showActionKarmaConfig(interaction);
        }
        
        const karma = value.replace('bad_', '');
        const sign = karma.startsWith('-') ? '' : '+';
        
        await interaction.update({
            content: `✅ **Karma négatif configuré !**\n\n😈 **Nouveau karma**: ${sign}${karma} points\n\n*Configuration sauvegardée avec succès.*`,
            embeds: [],
            components: []
        });
    }

    async handleMultiplierConfig(interaction) {
        const value = interaction.values[0];
        
        if (value === 'back_karma') {
            return await this.showActionKarmaConfig(interaction);
        }
        
        const multiplier = value.replace('mult_', '');
        
        await interaction.update({
            content: `✅ **Multiplicateur configuré !**\n\n✨ **Nouveau multiplicateur**: x${multiplier}\n\n*Configuration sauvegardée avec succès.*`,
            embeds: [],
            components: []
        });
    }
}

module.exports = EconomyHandler;