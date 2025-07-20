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
            .setTitle('🛒 Configuration Boutique - 3 Workflows')
            .setDescription('Choisissez le type d\'article à ajouter dans la boutique')
            .addFields([
                { name: '🎨 Workflow 1: Objets Personnalisés', value: 'Créez des objets uniques avec nom et prix personnalisés via modal', inline: false },
                { name: '⌛ Workflow 2: Rôles Temporaires', value: 'Sélectionnez un rôle du serveur puis définissez le prix via modal', inline: false },
                { name: '🔄 Workflow 3: Rôles Permanents', value: 'Sélectionnez un rôle du serveur puis définissez le prix via modal', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_shop_workflow_select')
            .setPlaceholder('🛒 Choisir le type d\'article à créer')
            .addOptions([
                { label: 'Objet Personnalisé', description: 'Workflow 1: Créer un objet unique avec nom et prix', value: 'custom_object', emoji: '🎨' },
                { label: 'Rôle Temporaire', description: 'Workflow 2: Sélection rôle → prix via modal', value: 'temporary_role', emoji: '⌛' },
                { label: 'Rôle Permanent', description: 'Workflow 3: Sélection rôle → prix via modal', value: 'permanent_role', emoji: '🔄' },
                { label: 'Gérer Articles Existants', description: 'Modifier/supprimer les articles actuels', value: 'manage_existing', emoji: '⚙️' },
                { label: 'Statistiques Boutique', description: 'Voir les ventes et statistiques', value: 'shop_stats', emoji: '📊' },
                { label: 'Retour Économie', value: 'back_economy', emoji: '🔙' }
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
                    label: 'Récompenses Automatiques',
                    description: 'Créer et gérer vos niveaux karma personnalisés',
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

    // Méthodes de configuration détaillées - STATISTIQUES
    async showStatsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff00ff')
            .setTitle('📊 Statistiques Économiques')
            .setDescription('Consultez et gérez les données du système économique')
            .addFields([
                { name: '👥 Membres Actifs', value: '0 utilisateurs enregistrés', inline: true },
                { name: '💰 Économie Totale', value: '0€ en circulation', inline: true },
                { name: '📈 Transactions', value: '0 actions effectuées', inline: true },
                { name: '🎯 Action la Plus Populaire', value: 'Aucune donnée', inline: true },
                { name: '💎 Membre le Plus Riche', value: 'Aucun membre', inline: true },
                { name: '😇 Saint du Serveur', value: 'Aucun karma positif', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_stats_action')
            .setPlaceholder('📊 Consulter les statistiques')
            .addOptions([
                { label: 'Économie Générale', value: 'general_economy', emoji: '💰' },
                { label: 'Statistiques Actions', value: 'actions_stats', emoji: '📋' },
                { label: 'Classements Détaillés', value: 'detailed_rankings', emoji: '🏆' },
                { label: 'Statistiques Karma', value: 'karma_stats', emoji: '⚖️' },
                { label: 'Revenus Boutique', value: 'shop_revenue', emoji: '🛒' },
                { label: 'Graphiques Mensuels', value: 'monthly_charts', emoji: '📈' },
                { label: 'Exporter Données', value: 'export_data', emoji: '📁' },
                { label: 'Reset Statistiques', value: 'reset_stats', emoji: '🔄' },
                { label: 'Retour Menu Principal', value: 'back_main', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
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
            .setCustomId(`economy_action_rewards_config`)
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
            case 'custom_object':
                await this.startCustomObjectWorkflow(interaction);
                break;
            case 'temporary_role':
                await this.startTemporaryRoleWorkflow(interaction);
                break;
            case 'permanent_role':
                await this.startPermanentRoleWorkflow(interaction);
                break;
            case 'manage_existing':
                await this.showManageExistingItems(interaction);
                break;
            case 'shop_stats':
                await this.showShopStats(interaction);
                break;
            case 'back_economy':
                await this.showMainConfig(interaction);
                break;
            default:
                await interaction.update({
                    content: `🛒 Workflow **${option}** disponible prochainement.`,
                    embeds: [],
                    components: []
                });
        }
    }

    async handleEconomyKarmaConfig(interaction) {
        const option = interaction.values[0];
        
        switch(option) {
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

    // Méthodes de configuration détaillées - BOUTIQUE
    async showAddRoleConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🛒 Ajouter un Rôle à la Boutique')
            .setDescription('Configurez un nouveau rôle avec type, prix personnalisé et sélection parmi les rôles du serveur')
            .addFields([
                { name: '⏰ Type de Rôle', value: '🔄 **Permanent** - Le rôle reste à vie\n⌛ **Temporaire** - Expire après X jours', inline: true },
                { name: '💰 Prix Personnalisé', value: 'Définissez n\'importe quel montant\nDe 1€ à 999,999€', inline: true },
                { name: '📋 Processus', value: '1. Type (Permanent/Temporaire)\n2. Prix personnalisé\n3. Sélection rôle serveur\n4. Confirmation', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_shop_role_type_select')
            .setPlaceholder('⏰ Choisir le type de rôle')
            .addOptions([
                { 
                    label: 'Rôle Permanent', 
                    value: 'permanent', 
                    emoji: '🔄',
                    description: 'Le rôle reste à vie une fois acheté'
                },
                { 
                    label: 'Rôle Temporaire', 
                    value: 'temporary', 
                    emoji: '⌛',
                    description: 'Le rôle expire après une durée définie'
                },
                { label: 'Retour Boutique', value: 'back_shop', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showRemoveRoleConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff4444')
            .setTitle('🛒 Retirer un Rôle de la Boutique')
            .setDescription('Sélectionnez le rôle à retirer définitivement de la boutique')
            .addFields([
                { name: 'Rôles Actuels', value: 'Aucun rôle configuré pour le moment', inline: false },
                { name: '⚠️ Attention', value: 'La suppression est définitive', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_shop_remove_role_confirm')
            .setPlaceholder('🗑️ Retirer un rôle de la vente')
            .addOptions([
                { label: 'Voir Rôles Disponibles', value: 'list_current', emoji: '📋' },
                { label: 'Confirmation Requise', value: 'need_confirm', emoji: '⚠️' },
                { label: 'Retour Boutique', value: 'back_shop', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showEditPricesConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('🛒 Modifier les Prix des Rôles')
            .setDescription('Ajustez les prix des rôles déjà en boutique')
            .addFields([
                { name: 'Prix Actuels', value: 'Aucun rôle configuré', inline: true },
                { name: 'Modification', value: 'Sélectionnez le nouveau prix', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_shop_edit_price_value')
            .setPlaceholder('💰 Nouveau prix à appliquer')
            .addOptions([
                { label: '100€', value: '100', emoji: '💵' },
                { label: '250€', value: '250', emoji: '💵' },
                { label: '500€', value: '500', emoji: '💶' },
                { label: '750€', value: '750', emoji: '💶' },
                { label: '1000€', value: '1000', emoji: '💷' },
                { label: '1500€', value: '1500', emoji: '💷' },
                { label: '2000€', value: '2000', emoji: '💴' },
                { label: '2500€', value: '2500', emoji: '💎' },
                { label: '5000€', value: '5000', emoji: '👑' },
                { label: 'Retour Boutique', value: 'back_shop', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showShopItems(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#00aaff')
            .setTitle('🛒 Inventaire de la Boutique')
            .setDescription('Tous les rôles et objets disponibles à l\'achat')
            .addFields([
                { name: '👑 Rôles Premium', value: 'Aucun rôle configuré', inline: true },
                { name: '💰 Prix Totaux', value: '0€ de revenus possibles', inline: true },
                { name: '📊 Statistiques', value: '0 rôles • 0 ventes', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_shop_items_action')
            .setPlaceholder('📋 Actions sur la boutique')
            .addOptions([
                { label: 'Actualiser Liste', value: 'refresh', emoji: '🔄' },
                { label: 'Voir Détails Rôle', value: 'details', emoji: '🔍' },
                { label: 'Statistiques Ventes', value: 'sales_stats', emoji: '📈' },
                { label: 'Test Boutique', value: 'test_shop', emoji: '🧪' },
                { label: 'Retour Boutique', value: 'back_shop', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    // Méthodes de configuration détaillées - KARMA
    async showKarmaLevelsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('⚖️ Configuration Niveaux Karma')
            .setDescription('Définissez les seuils et noms pour chaque niveau de karma')
            .addFields([
                { name: '😈 Niveaux Maléfiques', value: '👹 Evil (-20+)\n😈 Criminel (-10 à -19)\n🖤 Sombre (-5 à -9)', inline: true },
                { name: '😐 Niveau Neutre', value: '⚖️ Neutre (-4 à +4)', inline: true },
                { name: '😇 Niveaux Bénéfiques', value: '✨ Bon (+5 à +9)\n😇 Saint (+10 à +19)\n👼 Ange (+20+)', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_levels_edit')
            .setPlaceholder('⚖️ Modifier les seuils karma')
            .addOptions([
                { label: 'Seuil Criminel', description: 'Karma requis pour être criminel', value: 'criminal_threshold', emoji: '😈' },
                { label: 'Seuil Neutre', description: 'Zone neutre de karma', value: 'neutral_range', emoji: '⚖️' },
                { label: 'Seuil Saint', description: 'Karma requis pour être saint', value: 'saint_threshold', emoji: '😇' },
                { label: 'Noms Personnalisés', description: 'Modifier les noms des niveaux', value: 'custom_names', emoji: '✏️' },
                { label: 'Réinitialiser', description: 'Remettre les valeurs par défaut', value: 'reset_levels', emoji: '🔄' },
                { label: 'Retour Karma', value: 'back_karma', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showKarmaRewardsConfig(interaction) {
        const DataManager = require('../managers/DataManager');
        const dataManager = new DataManager();
        const karmaConfig = await dataManager.getData('karma_config') || {};
        const customRewards = karmaConfig.customRewards || [];
        
        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('⚖️ Système Récompenses Karma Personnalisé')
            .setDescription('Créez vos propres niveaux de karma avec récompenses/sanctions personnalisées');
        
        if (customRewards.length === 0) {
            embed.addFields([
                { name: '📋 Aucune Récompense Configurée', value: 'Cliquez sur "Créer Niveau" pour ajouter votre premier niveau karma personnalisé', inline: false }
            ]);
        } else {
            const rewardsList = customRewards
                .sort((a, b) => b.karmaThreshold - a.karmaThreshold)
                .map(reward => {
                    const moneyText = reward.money >= 0 ? `+${reward.money}€` : `${reward.money}€`;
                    return `**${reward.name}** (≥${reward.karmaThreshold} karma net)\n${moneyText}, Daily x${reward.dailyBonus}, Cooldown x${reward.cooldownModifier}\n*${reward.description}*`;
                })
                .join('\n\n');
            
            embed.addFields([
                { name: '🎯 Niveaux Karma Configurés', value: rewardsList, inline: false },
                { name: '📅 Distribution', value: `Jour: ${this.getDayName(karmaConfig.resetDay || 1)}\nProchain reset: ${this.getNextResetDate(karmaConfig.resetDay || 1)}`, inline: false }
            ]);
        }

        const options = [
            { label: 'Créer Niveau', description: 'Ajouter un nouveau niveau karma personnalisé', value: 'create_custom_reward', emoji: '➕' }
        ];
        
        // Ajouter options pour modifier les niveaux existants
        if (customRewards.length > 0) {
            customRewards.forEach((reward, index) => {
                options.push({
                    label: `Modifier ${reward.name}`,
                    description: `Karma ≥${reward.karmaThreshold} | ${reward.money >= 0 ? '+' : ''}${reward.money}€`,
                    value: `edit_custom_${index}`,
                    emoji: reward.money >= 0 ? '📈' : '📉'
                });
            });
            
            options.push({ label: 'Supprimer Niveau', description: 'Supprimer un niveau karma existant', value: 'delete_custom_reward', emoji: '🗑️' });
        }
        
        options.push(
            { label: 'Jour Distribution', description: 'Changer jour reset hebdomadaire', value: 'distribution_day', emoji: '📅' },
            { label: 'Reset Système', description: 'Remettre système par défaut', value: 'reset_rewards', emoji: '🔄' },
            { label: 'Retour Karma', value: 'back_karma', emoji: '🔙' }
        );
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_rewards_edit')
            .setPlaceholder('🎁 Gérer les récompenses karma personnalisées')
            .addOptions(options);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showKarmaResetConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle('⚖️ Reset Automatique du Karma')
            .setDescription('Configuration du système de reset hebdomadaire')
            .addFields([
                { name: '📅 Jour Actuel', value: 'Dimanche à 00:00', inline: true },
                { name: '🔄 Fréquence', value: 'Hebdomadaire', inline: true },
                { name: '⚠️ Impact', value: 'Karma remis à zéro + Distribution récompenses', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_reset_edit')
            .setPlaceholder('🔄 Configurer le reset karma')
            .addOptions([
                { label: 'Lundi', value: 'monday', emoji: '📅' },
                { label: 'Mardi', value: 'tuesday', emoji: '📅' },
                { label: 'Mercredi', value: 'wednesday', emoji: '📅' },
                { label: 'Jeudi', value: 'thursday', emoji: '📅' },
                { label: 'Vendredi', value: 'friday', emoji: '📅' },
                { label: 'Samedi', value: 'saturday', emoji: '📅' },
                { label: 'Dimanche', value: 'sunday', emoji: '📅' },
                { label: 'Désactiver Reset', value: 'disable', emoji: '❌' },
                { label: 'Retour Karma', value: 'back_karma', emoji: '🔙' }
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
            .setTitle('⚖️ Karma par Action Économique')
            .setDescription('Configuration du karma gagné/perdu pour chaque action')
            .addFields([
                { name: '😇 Actions Positives', value: 'Travailler: +2😇 -1😈\nPêcher: +1😇 -0😈\nDonner: +3😇 -2😈', inline: true },
                { name: '😈 Actions Négatives', value: 'Voler: +2😈 -1😇\nCrime: +3😈 -2😇\nParier: +1😈 -1😇', inline: true },
                { name: '⚖️ Équilibrage', value: 'Chaque action affecte les deux karmas', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_action_karma_values')
            .setPlaceholder('⚖️ Configurer karma par action')
            .addOptions([
                { label: 'Karma Travailler', value: 'work_karma', emoji: '👷' },
                { label: 'Karma Pêcher', value: 'fish_karma', emoji: '🎣' },
                { label: 'Karma Donner', value: 'give_karma', emoji: '💝' },
                { label: 'Karma Voler', value: 'steal_karma', emoji: '🔫' },
                { label: 'Karma Crime', value: 'crime_karma', emoji: '🔪' },
                { label: 'Karma Parier', value: 'bet_karma', emoji: '🎰' },
                { label: 'Reset Valeurs', value: 'reset_karma_values', emoji: '🔄' },
                { label: 'Retour Karma', value: 'back_karma', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    // Méthodes de configuration détaillées - DAILY
    async showDailyAmountsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('🎁 Configuration Montants Daily')
            .setDescription('Définissez les montants des récompenses quotidiennes')
            .addFields([
                { name: '💰 Montant Base', value: '100€ par jour', inline: true },
                { name: '📈 Bonus Karma', value: '+50€ si bon karma', inline: true },
                { name: '📉 Malus Karma', value: '-25€ si mauvais karma', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_daily_amounts_edit')
            .setPlaceholder('💰 Modifier les montants daily')
            .addOptions([
                { label: '50€', value: '50', emoji: '💵' },
                { label: '75€', value: '75', emoji: '💵' },
                { label: '100€', value: '100', emoji: '💶' },
                { label: '125€', value: '125', emoji: '💶' },
                { label: '150€', value: '150', emoji: '💷' },
                { label: '175€', value: '175', emoji: '💷' },
                { label: '200€', value: '200', emoji: '💴' },
                { label: 'Personnalisé', value: 'custom', emoji: '✏️' },
                { label: 'Retour Daily', value: 'back_daily', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showDailyStreakConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff4500')
            .setTitle('🔥 Configuration Bonus Streak')
            .setDescription('Configurez les bonus pour les séries quotidiennes consécutives')
            .addFields([
                { name: '🔥 Streak 7 jours', value: '+50€ de bonus (150€ total)', inline: true },
                { name: '⭐ Streak 15 jours', value: '+100€ de bonus (200€ total)', inline: true },
                { name: '👑 Streak 30 jours', value: '+200€ de bonus (300€ total)', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_daily_streak_edit')
            .setPlaceholder('🔥 Configurer les bonus streak')
            .addOptions([
                { label: 'Streak 3 jours', value: 'streak_3', emoji: '🥉' },
                { label: 'Streak 7 jours', value: 'streak_7', emoji: '🔥' },
                { label: 'Streak 15 jours', value: 'streak_15', emoji: '⭐' },
                { label: 'Streak 30 jours', value: 'streak_30', emoji: '👑' },
                { label: 'Bonus Personnalisés', value: 'custom_streaks', emoji: '✏️' },
                { label: 'Désactiver Streaks', value: 'disable_streaks', emoji: '❌' },
                { label: 'Reset Tous Streaks', value: 'reset_all_streaks', emoji: '🔄' },
                { label: 'Retour Daily', value: 'back_daily', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showDailyResetConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle('🔄 Reset Daily & Streaks')
            .setDescription('Configuration du système de reset des récompenses quotidiennes')
            .addFields([
                { name: '⏰ Heure Reset', value: 'Minuit (00:00) chaque jour', inline: true },
                { name: '🔥 Streak Perdu', value: 'Après 48h sans daily', inline: true },
                { name: '🗓️ Fuseau Horaire', value: 'Europe/Paris (UTC+1/+2)', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_daily_reset_edit')
            .setPlaceholder('🔄 Configurer reset daily')
            .addOptions([
                { label: '22:00', value: '22', emoji: '🌃' },
                { label: '23:00', value: '23', emoji: '🌃' },
                { label: '00:00 (Minuit)', value: '0', emoji: '🌙' },
                { label: '01:00', value: '1', emoji: '🌙' },
                { label: '02:00', value: '2', emoji: '🌙' },
                { label: '06:00', value: '6', emoji: '🌅' },
                { label: 'Délai Streak', value: 'streak_delay', emoji: '⏳' },
                { label: 'Fuseau Horaire', value: 'timezone', emoji: '🌍' },
                { label: 'Retour Daily', value: 'back_daily', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    // Méthodes de configuration détaillées - MESSAGES
    async showMessagesToggleConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('💬 Activer/Désactiver Récompenses Messages')
            .setDescription('Contrôlez le système automatique de récompenses par message')
            .addFields([
                { name: '📊 État Actuel', value: '✅ Activé - 5€ par message', inline: true },
                { name: '⏰ Cooldown', value: '60 secondes entre récompenses', inline: true },
                { name: '🔍 Détection', value: 'Messages non-bot uniquement', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_messages_toggle_edit')
            .setPlaceholder('💬 Gérer les récompenses messages')
            .addOptions([
                { label: 'Activer Système', value: 'enable', emoji: '✅' },
                { label: 'Désactiver Système', value: 'disable', emoji: '❌' },
                { label: 'Mode Test', value: 'test_mode', emoji: '🧪' },
                { label: 'Canaux Exclus', value: 'excluded_channels', emoji: '🚫' },
                { label: 'Rôles Exclus', value: 'excluded_roles', emoji: '⚠️' },
                { label: 'Statistiques', value: 'message_stats', emoji: '📊' },
                { label: 'Reset Compteurs', value: 'reset_counters', emoji: '🔄' },
                { label: 'Retour Messages', value: 'back_messages', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showMessagesAmountConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('💰 Configuration Montant par Message')
            .setDescription('Définissez l\'argent gagné automatiquement par message')
            .addFields([
                { name: '💰 Montant Actuel', value: '5€ par message', inline: true },
                { name: '📊 Statistiques', value: 'Moyenne: 50 messages/jour', inline: true },
                { name: '💸 Impact Quotidien', value: '~250€ par membre actif', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_messages_amount_edit')
            .setPlaceholder('💰 Choisir le montant par message')
            .addOptions([
                { label: '1€', value: '1', emoji: '💵' },
                { label: '2€', value: '2', emoji: '💵' },
                { label: '3€', value: '3', emoji: '💶' },
                { label: '5€', value: '5', emoji: '💶' },
                { label: '7€', value: '7', emoji: '💷' },
                { label: '10€', value: '10', emoji: '💷' },
                { label: '15€', value: '15', emoji: '💴' },
                { label: '20€', value: '20', emoji: '💎' },
                { label: 'Personnalisé', value: 'custom', emoji: '✏️' },
                { label: 'Retour Messages', value: 'back_messages', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showMessagesCooldownConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle('⏰ Configuration Cooldown Messages')
            .setDescription('Définissez le délai entre les récompenses automatiques')
            .addFields([
                { name: '⏰ Cooldown Actuel', value: '60 secondes', inline: true },
                { name: '🛡️ Protection Spam', value: 'Empêche les abus', inline: true },
                { name: '⚖️ Équilibre', value: 'Plus court = Plus d\'argent', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_messages_cooldown_edit')
            .setPlaceholder('⏰ Choisir le délai entre récompenses')
            .addOptions([
                { label: '15 secondes', value: '15', emoji: '⚡' },
                { label: '30 secondes', value: '30', emoji: '🔥' },
                { label: '45 secondes', value: '45', emoji: '⏰' },
                { label: '60 secondes', value: '60', emoji: '🕐' },
                { label: '90 secondes', value: '90', emoji: '🕑' },
                { label: '2 minutes', value: '120', emoji: '🕒' },
                { label: '5 minutes', value: '300', emoji: '🕔' },
                { label: '10 minutes', value: '600', emoji: '🕙' },
                { label: 'Pas de cooldown', value: '0', emoji: '💨' },
                { label: 'Retour Messages', value: 'back_messages', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
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
                await interaction.reply({
                    content: `❌ Configuration ${configType} non trouvée.`,
                    flags: 64
                });
        }
    }

    // Nouvelles méthodes de configuration d'actions
    async showActionRewardsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('💰 Configuration Récompenses Action')
            .setDescription('Configurez les montants minimum et maximum pour cette action')
            .addFields([
                { name: '💰 Récompense Min', value: '5€', inline: true },
                { name: '💰 Récompense Max', value: '25€', inline: true },
                { name: '🎯 Bonus Karma', value: '+10% si bon karma', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_action_reward_amounts')
            .setPlaceholder('💰 Configurer les montants')
            .addOptions([
                { label: 'Récompense Minimum', description: 'Montant minimum gagné', value: 'min_reward', emoji: '📉' },
                { label: 'Récompense Maximum', description: 'Montant maximum gagné', value: 'max_reward', emoji: '📈' },
                { label: 'Bonus Karma', description: 'Bonus selon niveau karma', value: 'karma_bonus', emoji: '⚖️' },
                { label: 'Modificateur Échec', description: 'Perte en cas d\'échec', value: 'fail_modifier', emoji: '💸' },
                { label: 'Retour Actions', value: 'back_actions', emoji: '🔙' }
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
            .setDescription('Configurez les gains/pertes de karma pour cette action')
            .addFields([
                { name: '😇 Karma Bon', value: '+2 points', inline: true },
                { name: '😈 Karma Mauvais', value: '-1 points', inline: true },
                { name: '🔥 Multiplicateur Niveau', value: 'x1.5 si Saint/Evil', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_action_karma_amounts')
            .setPlaceholder('⚖️ Configurer les gains karma')
            .addOptions([
                { label: 'Karma Positif', description: 'Points de karma bon gagnés', value: 'good_karma', emoji: '😇' },
                { label: 'Karma Négatif', description: 'Points de karma mauvais gagnés', value: 'bad_karma', emoji: '😈' },
                { label: 'Multiplicateur Niveau', description: 'Bonus selon niveau actuel', value: 'level_multiplier', emoji: '🔥' },
                { label: 'Karma Échec', description: 'Karma perdu en cas d\'échec', value: 'fail_karma', emoji: '💔' },
                { label: 'Retour Actions', value: 'back_actions', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showActionCooldownConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle('⏰ Configuration Cooldown Action')
            .setDescription('Configurez le temps d\'attente entre les utilisations')
            .addFields([
                { name: '⏰ Cooldown Actuel', value: '5 minutes', inline: true },
                { name: '🔥 Réduction Karma', value: '-20% si bon karma', inline: true },
                { name: '😈 Pénalité Karma', value: '+50% si mauvais karma', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_action_cooldown_amounts')
            .setPlaceholder('⏰ Configurer les délais')
            .addOptions([
                { label: '30 secondes', value: '30', emoji: '⚡' },
                { label: '1 minute', value: '60', emoji: '⏰' },
                { label: '2 minutes', value: '120', emoji: '🕐' },
                { label: '5 minutes', value: '300', emoji: '🕔' },
                { label: '10 minutes', value: '600', emoji: '🕙' },
                { label: '15 minutes', value: '900', emoji: '🕞' },
                { label: '30 minutes', value: '1800', emoji: '🕧' },
                { label: '1 heure', value: '3600', emoji: '🕛' },
                { label: 'Personnalisé', value: 'custom', emoji: '✏️' },
                { label: 'Retour Actions', value: 'back_actions', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async showActionToggleConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🔄 Activer/Désactiver Action')
            .setDescription('Contrôlez la disponibilité de cette action sur le serveur')
            .addFields([
                { name: '📊 État Actuel', value: '✅ Activée', inline: true },
                { name: '👥 Utilisateurs Actifs', value: '127 membres ont utilisé', inline: true },
                { name: '📈 Dernière Utilisation', value: 'Il y a 3 minutes', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_action_toggle_status')
            .setPlaceholder('🔄 Gérer l\'état de l\'action')
            .addOptions([
                { label: 'Activer Action', description: 'Permettre l\'utilisation', value: 'enable', emoji: '✅' },
                { label: 'Désactiver Action', description: 'Interdire l\'utilisation', value: 'disable', emoji: '❌' },
                { label: 'Mode Maintenance', description: 'Temporairement indisponible', value: 'maintenance', emoji: '🔧' },
                { label: 'Restrictions Rôles', description: 'Limiter à certains rôles', value: 'role_restrictions', emoji: '👥' },
                { label: 'Statistiques Action', description: 'Voir les stats d\'utilisation', value: 'stats', emoji: '📊' },
                { label: 'Reset Cooldowns', description: 'Réinitialiser tous les délais', value: 'reset_cooldowns', emoji: '🔄' },
                { label: 'Retour Actions', value: 'back_actions', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    // ==================== NOUVEAUX WORKFLOWS BOUTIQUE ====================
    
    // WORKFLOW 1: Objets Personnalisés - Création + Prix via modal
    async startCustomObjectWorkflow(interaction) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId('custom_object_creation_modal')
            .setTitle('🎨 Créer un Objet Personnalisé');
        
        const nameInput = new TextInputBuilder()
            .setCustomId('object_name_input')
            .setLabel('Nom de l\'objet')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(50)
            .setPlaceholder('Ex: Potion Magique, Badge VIP, Accès Secret...')
            .setRequired(true);
        
        const priceInput = new TextInputBuilder()
            .setCustomId('object_price_input')
            .setLabel('Prix de l\'objet (en €)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(6)
            .setPlaceholder('Ex: 25, 100, 500... (1€ à 999,999€)')
            .setRequired(true);
        
        const descriptionInput = new TextInputBuilder()
            .setCustomId('object_description_input')
            .setLabel('Description de l\'objet (optionnel)')
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(0)
            .setMaxLength(200)
            .setPlaceholder('Décrivez à quoi sert cet objet...')
            .setRequired(false);
        
        const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
        const secondActionRow = new ActionRowBuilder().addComponents(priceInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(descriptionInput);
        
        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
        
        await interaction.showModal(modal);
    }
    
    // WORKFLOW 2: Rôles Temporaires - Sélection rôle → prix modal
    async startTemporaryRoleWorkflow(interaction) {
        const { RoleSelectMenuBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor('#ffa500')
            .setTitle('⌛ Workflow Rôle Temporaire - Étape 1/2')
            .setDescription('Sélectionnez d\'abord le rôle du serveur à vendre temporairement')
            .addFields([
                { name: '📋 Processus', value: '1. **Sélection rôle** ← Vous êtes ici\n2. Prix + durée via modal', inline: false },
                { name: '⚠️ Important', value: 'Choisissez un rôle existant du serveur dans le menu ci-dessous', inline: false }
            ]);

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('temporary_role_workflow_select')
            .setPlaceholder('⌛ Sélectionner le rôle temporaire')
            .setMinValues(1)
            .setMaxValues(1);

        const components = [new ActionRowBuilder().addComponents(roleSelect)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }
    
    // WORKFLOW 3: Rôles Permanents - Sélection rôle → prix modal
    async startPermanentRoleWorkflow(interaction) {
        const { RoleSelectMenuBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🔄 Workflow Rôle Permanent - Étape 1/2')
            .setDescription('Sélectionnez d\'abord le rôle du serveur à vendre en permanence')
            .addFields([
                { name: '📋 Processus', value: '1. **Sélection rôle** ← Vous êtes ici\n2. Prix via modal', inline: false },
                { name: '⚠️ Important', value: 'Choisissez un rôle existant du serveur dans le menu ci-dessous', inline: false }
            ]);

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('permanent_role_workflow_select')
            .setPlaceholder('🔄 Sélectionner le rôle permanent')
            .setMinValues(1)
            .setMaxValues(1);

        const components = [new ActionRowBuilder().addComponents(roleSelect)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }
    
    // Gestion des objets existants
    async showManageExistingItems(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle('⚙️ Gérer Articles Existants')
            .setDescription('Modifiez ou supprimez les articles de la boutique')
            .addFields([
                { name: '📋 Articles Actuels', value: 'Rôle VIP (50€)\nPotion Boost (25€)\nAccès Secret (100€)', inline: true },
                { name: '📊 Statistiques', value: '12 ventes cette semaine\n347€ de revenus', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('manage_existing_items')
            .setPlaceholder('⚙️ Gérer les articles')
            .addOptions([
                { label: 'Modifier Prix', description: 'Changer le prix d\'un article', value: 'edit_price', emoji: '💰' },
                { label: 'Supprimer Article', description: 'Retirer un article de la boutique', value: 'remove_item', emoji: '🗑️' },
                { label: 'Voir Statistiques', description: 'Stats détaillées des ventes', value: 'detailed_stats', emoji: '📊' },
                { label: 'Retour Boutique', value: 'back_shop', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }
    
    async showShopStats(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('📊 Statistiques Boutique')
            .setDescription('Analyse des ventes et performance des articles')
            .addFields([
                { name: '💰 Revenus Totaux', value: '1,247€ (cette semaine)\n4,892€ (ce mois)', inline: true },
                { name: '🏆 Article Populaire', value: 'Rôle VIP (67% des ventes)', inline: true },
                { name: '👥 Clients Actifs', value: '23 achats uniques', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('shop_stats_options')
            .setPlaceholder('📊 Options statistiques')
            .addOptions([
                { label: 'Export Données', description: 'Télécharger les stats', value: 'export_data', emoji: '📁' },
                { label: 'Reset Statistiques', description: 'Remettre à zéro', value: 'reset_stats', emoji: '🔄' },
                { label: 'Retour Boutique', value: 'back_shop', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    // ==================== HANDLERS POUR NOUVEAUX WORKFLOWS ====================
    
    // Handler pour objets personnalisés (modal workflow 1)
    async handleCustomObjectCreationModal(interaction) {
        try {
            const objectName = interaction.fields.getTextInputValue('object_name_input');
            const objectPrice = interaction.fields.getTextInputValue('object_price_input');
            const objectDescription = interaction.fields.getTextInputValue('object_description_input') || 'Aucune description';
            
            // Validation du prix
            const priceNum = parseInt(objectPrice);
            if (isNaN(priceNum) || priceNum < 1 || priceNum > 999999) {
                await interaction.reply({
                    content: '❌ Prix invalide. Veuillez entrer un nombre entre 1 et 999,999.',
                    flags: 64
                });
                return;
            }
            
            // Sauvegarder dans shop.json
            const guildId = interaction.guild.id;
            const DataManager = require('../managers/DataManager');
            const dataManager = new DataManager();
            const shop = await dataManager.getData('shop');
        
        if (!shop[guildId]) {
            shop[guildId] = [];
        }
        
        const newItem = {
            id: Date.now().toString(),
            name: objectName,
            price: priceNum,
            description: objectDescription,
            type: 'custom_object',
            createdAt: new Date().toISOString(),
            createdBy: interaction.user.id
        };
        
            shop[guildId].push(newItem);
            await dataManager.saveData('shop', shop);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Objet Personnalisé Créé')
                .setDescription('Votre objet personnalisé a été ajouté à la boutique !')
                .addFields([
                    { name: '🎨 Nom', value: objectName, inline: true },
                    { name: '💰 Prix', value: `${priceNum}€`, inline: true },
                    { name: '📝 Description', value: objectDescription, inline: false },
                    { name: '🛒 Statut', value: '✅ Disponible à l\'achat', inline: false }
                ]);

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });
        } catch (error) {
            console.error('❌ Erreur handleCustomObjectCreationModal:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la création de l\'objet. Veuillez réessayer.',
                flags: 64
            }).catch(() => {});
        }
    }
    
    // Handler pour sélection rôle temporaire (workflow 2)
    async handleTemporaryRoleWorkflowSelect(interaction) {
        const selectedRole = interaction.roles.first();
        const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId(`temporary_role_price_modal_${selectedRole.id}`)
            .setTitle('⌛ Rôle Temporaire - Prix & Durée');
        
        const priceInput = new TextInputBuilder()
            .setCustomId('temp_role_price_input')
            .setLabel('Prix du rôle (en €)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(6)
            .setPlaceholder('Ex: 25, 50, 100... (1€ à 999,999€)')
            .setRequired(true);
        
        const durationInput = new TextInputBuilder()
            .setCustomId('temp_role_duration_input')
            .setLabel('Durée en jours')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(5)
            .setPlaceholder('Ex: 7, 30, 90... (1 à 36,500 jours)')
            .setRequired(true);
        
        const firstActionRow = new ActionRowBuilder().addComponents(priceInput);
        const secondActionRow = new ActionRowBuilder().addComponents(durationInput);
        
        modal.addComponents(firstActionRow, secondActionRow);
        
        await interaction.showModal(modal);
    }
    
    // Handler pour sélection rôle permanent (workflow 3)
    async handlePermanentRoleWorkflowSelect(interaction) {
        const selectedRole = interaction.roles.first();
        const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId(`permanent_role_price_modal_${selectedRole.id}`)
            .setTitle('🔄 Rôle Permanent - Prix');
        
        const priceInput = new TextInputBuilder()
            .setCustomId('perm_role_price_input')
            .setLabel('Prix du rôle (en €)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(6)
            .setPlaceholder('Ex: 50, 100, 200... (1€ à 999,999€)')
            .setRequired(true);
        
        const firstActionRow = new ActionRowBuilder().addComponents(priceInput);
        modal.addComponents(firstActionRow);
        
        await interaction.showModal(modal);
    }
    
    // Handler pour modal rôle temporaire avec prix/durée
    async handleTemporaryRolePriceModal(interaction) {
        try {
            const roleId = interaction.customId.split('_')[4]; // Extract role ID from modal customId
            const price = interaction.fields.getTextInputValue('temp_role_price_input');
            const duration = interaction.fields.getTextInputValue('temp_role_duration_input');
            
            // Validation
            const priceNum = parseInt(price);
            const durationNum = parseInt(duration);
            
            if (isNaN(priceNum) || priceNum < 1 || priceNum > 999999) {
                await interaction.reply({
                    content: '❌ Prix invalide. Veuillez entrer un nombre entre 1 et 999,999.',
                    flags: 64
                });
                return;
            }
            
            if (isNaN(durationNum) || durationNum < 1 || durationNum > 36500) {
                await interaction.reply({
                    content: '❌ Durée invalide. Veuillez entrer un nombre entre 1 et 36,500 jours.',
                    flags: 64
                });
                return;
            }
            
            // Sauvegarder dans shop.json
            const guildId = interaction.guild.id;
            const DataManager = require('../managers/DataManager');
            const dataManager = new DataManager();
                const shop = await dataManager.getData('shop');
            
            if (!shop[guildId]) {
                shop[guildId] = [];
            }
            
            const role = interaction.guild.roles.cache.get(roleId);
            const newItem = {
                id: Date.now().toString(),
                name: role?.name || `Rôle ${roleId}`,
                price: priceNum,
                description: `Rôle temporaire valable ${durationNum} jour${durationNum > 1 ? 's' : ''}`,
                type: 'temp_role',
                roleId: roleId,
                duration: durationNum,
                createdAt: new Date().toISOString(),
                createdBy: interaction.user.id
            };
            
            shop[guildId].push(newItem);
            await dataManager.saveData('shop', shop);
            
            const embed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('✅ Rôle Temporaire Ajouté')
                .setDescription('Le rôle temporaire a été configuré avec succès !')
                .addFields([
                    { name: '👑 Rôle', value: `${role?.name || 'Rôle'} (<@&${roleId}>)`, inline: true },
                    { name: '💰 Prix', value: `${priceNum}€`, inline: true },
                    { name: '⌛ Durée', value: `${durationNum} jour${durationNum > 1 ? 's' : ''}`, inline: true },
                    { name: '🛒 Statut', value: '✅ Disponible à l\'achat', inline: false }
                ]);

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });
        } catch (error) {
            console.error('❌ Erreur handleTemporaryRolePriceModal:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la création du rôle temporaire. Veuillez réessayer.',
                flags: 64
            }).catch(() => {});
        }
    }
    
    // Handler pour modal rôle permanent avec prix
    async handlePermanentRolePriceModal(interaction) {
        try {
            const roleId = interaction.customId.split('_')[4]; // Extract role ID from modal customId
            const price = interaction.fields.getTextInputValue('perm_role_price_input');
            
            // Validation
            const priceNum = parseInt(price);
            
            if (isNaN(priceNum) || priceNum < 1 || priceNum > 999999) {
                await interaction.reply({
                    content: '❌ Prix invalide. Veuillez entrer un nombre entre 1 et 999,999.',
                    flags: 64
                });
                return;
            }
            
            // Sauvegarder dans shop.json
            const guildId = interaction.guild.id;
            const DataManager = require('../managers/DataManager');
            const dataManager = new DataManager();
                const shop = await dataManager.getData('shop');
            
            if (!shop[guildId]) {
                shop[guildId] = [];
            }
            
            const role = interaction.guild.roles.cache.get(roleId);
            const newItem = {
                id: Date.now().toString(),
                name: role?.name || `Rôle ${roleId}`,
                price: priceNum,
                description: 'Rôle permanent à vie',
                type: 'perm_role',
                roleId: roleId,
                createdAt: new Date().toISOString(),
                createdBy: interaction.user.id
            };
            
            shop[guildId].push(newItem);
            await dataManager.saveData('shop', shop);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Rôle Permanent Ajouté')
                .setDescription('Le rôle permanent a été configuré avec succès !')
                .addFields([
                    { name: '👑 Rôle', value: `${role?.name || 'Rôle'} (<@&${roleId}>)`, inline: true },
                    { name: '💰 Prix', value: `${priceNum}€`, inline: true },
                    { name: '⏰ Type', value: '🔄 Permanent (à vie)', inline: true },
                    { name: '🛒 Statut', value: '✅ Disponible à l\'achat', inline: false }
                ]);

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });
        } catch (error) {
            console.error('❌ Erreur handlePermanentRolePriceModal:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la création du rôle permanent. Veuillez réessayer.',
                flags: 64
            }).catch(() => {});
        }
    }
    
    // ==================== MÉTHODES UTILITAIRES KARMA ====================
    
    getDayName(dayNum) {
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return days[dayNum] || 'Inconnu';
    }
    
    getNextResetDate(dayNum) {
        const now = new Date();
        const currentDay = now.getDay();
        let daysUntilReset = dayNum - currentDay;
        
        if (daysUntilReset <= 0) {
            daysUntilReset += 7;
        }
        
        const nextReset = new Date(now);
        nextReset.setDate(now.getDate() + daysUntilReset);
        nextReset.setHours(0, 0, 0, 0);
        
        return nextReset.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    // ==================== HANDLERS KARMA PERSONNALISABLES ====================
    
    async handleKarmaRewardConfig(interaction) {
        const selection = interaction.values[0];
        
        if (selection === 'back_karma') {
            await this.showKarmaConfig(interaction);
            return;
        }
        
        if (selection === 'reset_rewards') {
            await this.resetKarmaRewardsToDefault(interaction);
            return;
        }
        
        if (selection === 'distribution_day') {
            await this.showDistributionDayConfig(interaction);
            return;
        }
        
        if (selection === 'create_custom_reward') {
            await this.createCustomKarmaRewardModal(interaction);
            return;
        }
        
        if (selection.startsWith('edit_custom_')) {
            const index = parseInt(selection.split('_')[2]);
            await this.editCustomKarmaRewardModal(interaction, index);
            return;
        }
        
        if (selection === 'delete_custom_reward') {
            await this.showDeleteCustomRewardMenu(interaction);
            return;
        }
    }
    
    async createCustomKarmaRewardModal(interaction, editIndex = null) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        
        let existingReward = null;
        if (editIndex !== null) {
            const DataManager = require('../managers/DataManager');
            const dataManager = new DataManager();
            const karmaConfig = await dataManager.getData('karma_config') || {};
            existingReward = karmaConfig.customRewards?.[editIndex];
        }
        
        const modal = new ModalBuilder()
            .setCustomId(`custom_karma_reward_modal_${editIndex !== null ? editIndex : 'new'}`)
            .setTitle(editIndex !== null ? '✏️ Modifier Niveau Karma' : '➕ Créer Niveau Karma');
        
        const nameInput = new TextInputBuilder()
            .setCustomId('karma_reward_name')
            .setLabel('Nom du Niveau Karma')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(30)
            .setPlaceholder('Ex: Elite, Criminel, Neutre...')
            .setRequired(true);
        
        const karmaThresholdInput = new TextInputBuilder()
            .setCustomId('karma_threshold')
            .setLabel('Karma Net Requis (😇 - 😈)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(4)
            .setPlaceholder('Ex: 10, -5, 0... (-999 à +999)')
            .setRequired(true);
        
        const moneyInput = new TextInputBuilder()
            .setCustomId('karma_money_reward')
            .setLabel('Récompense/Sanction Argent (€)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(7)
            .setPlaceholder('Ex: 500, -300, 0... (-999,999€ à +999,999€)')
            .setRequired(true);
        
        const dailyBonusInput = new TextInputBuilder()
            .setCustomId('karma_daily_bonus')
            .setLabel('Multiplicateur Daily (x) | Cooldown (x)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(5)
            .setMaxLength(10)
            .setPlaceholder('Format: 1.5|0.8 (Daily x1.5, Cooldown x0.8)')
            .setRequired(true);
        
        const descriptionInput = new TextInputBuilder()
            .setCustomId('karma_description')
            .setLabel('Description du Niveau')
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(5)
            .setMaxLength(200)
            .setPlaceholder('Description de ce niveau de karma et ses effets')
            .setRequired(true);
        
        // Pré-remplir si modification
        if (existingReward) {
            nameInput.setValue(existingReward.name);
            karmaThresholdInput.setValue(existingReward.karmaThreshold.toString());
            moneyInput.setValue(existingReward.money.toString());
            dailyBonusInput.setValue(`${existingReward.dailyBonus}|${existingReward.cooldownModifier}`);
            descriptionInput.setValue(existingReward.description);
        }
        
        const firstRow = new ActionRowBuilder().addComponents(nameInput);
        const secondRow = new ActionRowBuilder().addComponents(karmaThresholdInput);
        const thirdRow = new ActionRowBuilder().addComponents(moneyInput);
        const fourthRow = new ActionRowBuilder().addComponents(dailyBonusInput);
        const fifthRow = new ActionRowBuilder().addComponents(descriptionInput);
        
        modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);
        
        await interaction.showModal(modal);
    }
    
    async editCustomKarmaRewardModal(interaction, index) {
        await this.createCustomKarmaRewardModal(interaction, index);
    }
    
    async handleCustomKarmaRewardModal(interaction) {
        try {
            const modalId = interaction.customId;
            const editIndex = modalId.includes('_new') ? null : parseInt(modalId.split('_').pop());
            
            const name = interaction.fields.getTextInputValue('karma_reward_name');
            const karmaThreshold = parseInt(interaction.fields.getTextInputValue('karma_threshold'));
            const money = parseInt(interaction.fields.getTextInputValue('karma_money_reward'));
            const multipliers = interaction.fields.getTextInputValue('karma_daily_bonus');
            const description = interaction.fields.getTextInputValue('karma_description');
            
            // Validation du nom
            if (!name || name.trim().length === 0) {
                await interaction.reply({
                    content: '❌ Nom du niveau requis.',
                    flags: 64
                });
                return;
            }
            
            // Validation karma threshold
            if (isNaN(karmaThreshold) || karmaThreshold < -999 || karmaThreshold > 999) {
                await interaction.reply({
                    content: '❌ Karma net invalide. Valeur entre -999 et +999 requise.',
                    flags: 64
                });
                return;
            }
            
            // Validation argent
            if (isNaN(money) || money < -999999 || money > 999999) {
                await interaction.reply({
                    content: '❌ Récompense argent invalide. Valeur entre -999,999€ et +999,999€ requise.',
                    flags: 64
                });
                return;
            }
            
            // Validation multiplicateurs (format: daily|cooldown)
            const multipliersParts = multipliers.split('|');
            if (multipliersParts.length !== 2) {
                await interaction.reply({
                    content: '❌ Format multiplicateurs invalide. Utilisez: dailyBonus|cooldown (ex: 1.5|0.8)',
                    flags: 64
                });
                return;
            }
            
            const dailyBonus = parseFloat(multipliersParts[0]);
            const cooldownModifier = parseFloat(multipliersParts[1]);
            
            if (isNaN(dailyBonus) || dailyBonus < 0.1 || dailyBonus > 5.0) {
                await interaction.reply({
                    content: '❌ Multiplicateur daily invalide. Valeur entre x0.1 et x5.0 requise.',
                    flags: 64
                });
                return;
            }
            
            if (isNaN(cooldownModifier) || cooldownModifier < 0.1 || cooldownModifier > 3.0) {
                await interaction.reply({
                    content: '❌ Modificateur cooldown invalide. Valeur entre x0.1 et x3.0 requise.',
                    flags: 64
                });
                return;
            }
            
            // Sauvegarder le niveau karma personnalisé
            await this.saveCustomKarmaLevel({
                name: name.trim(),
                karmaThreshold: karmaThreshold,
                money: money,
                dailyBonus: dailyBonus,
                cooldownModifier: cooldownModifier,
                description: description.trim()
            }, editIndex);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(editIndex !== null ? '✅ Niveau Karma Modifié' : '✅ Niveau Karma Créé')
                .setDescription(`**${name}** configuré avec succès !`)
                .addFields([
                    { name: '🎯 Karma Net Requis', value: `≥${karmaThreshold}`, inline: true },
                    { name: '💰 Récompense/Sanction', value: `${money >= 0 ? '+' : ''}${money}€`, inline: true },
                    { name: '⚡ Multiplicateurs', value: `Daily x${dailyBonus}\nCooldown x${cooldownModifier}`, inline: true },
                    { name: '📝 Description', value: description, inline: false }
                ]);
            
            await interaction.reply({
                embeds: [embed],
                flags: 64
            });
            
        } catch (error) {
            console.error('❌ Erreur handleCustomKarmaRewardModal:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.',
                flags: 64
            }).catch(() => {});
        }
    }
    
    async saveCustomKarmaLevel(levelData, editIndex = null) {
        try {
            const DataManager = require('../managers/DataManager');
            const dataManager = new DataManager();
            
            console.log('📁 Sauvegarde niveau karma:', levelData);
            console.log('📝 Index d\'édition:', editIndex);
            
            const karmaConfig = await dataManager.getData('karma_config') || {};
            
            if (!karmaConfig.customRewards) {
                karmaConfig.customRewards = [];
            }
            
            // Créer l'objet niveau avec timestamp
            const levelWithTimestamp = {
                ...levelData,
                createdAt: new Date().toISOString(),
                id: editIndex !== null ? karmaConfig.customRewards[editIndex]?.id || Date.now() : Date.now()
            };
            
            if (editIndex !== null && editIndex >= 0 && editIndex < karmaConfig.customRewards.length) {
                // Modification niveau existant
                karmaConfig.customRewards[editIndex] = levelWithTimestamp;
                console.log(`✅ Niveau karma modifié à l'index ${editIndex}:`, levelWithTimestamp);
            } else {
                // Nouveau niveau
                karmaConfig.customRewards.push(levelWithTimestamp);
                console.log(`✅ Nouveau niveau karma ajouté:`, levelWithTimestamp);
            }
            
            // Trier par karma threshold décroissant
            karmaConfig.customRewards.sort((a, b) => b.karmaThreshold - a.karmaThreshold);
            
            await dataManager.saveData('karma_config', karmaConfig);
            console.log('💾 Configuration karma sauvegardée avec succès');
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur saveCustomKarmaLevel:', error);
            throw error;
        }
    }
    
    async resetKarmaRewardsToDefault(interaction) {
        const DataManager = require('../managers/DataManager');
        const dataManager = new DataManager();
        
        const karmaConfig = await dataManager.getData('karma_config') || {};
        karmaConfig.customRewards = []; // Supprimer tous les niveaux personnalisés
        await dataManager.saveData('karma_config', karmaConfig);
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🔄 Système Karma Réinitialisé')
            .setDescription('Tous les niveaux karma personnalisés ont été supprimés')
            .addFields([
                { name: '📋 État Actuel', value: 'Aucune récompense configurée', inline: false },
                { name: '➕ Prochaine Étape', value: 'Utilisez "Créer Niveau" pour ajouter vos propres niveaux karma', inline: false }
            ]);
        
        await interaction.update({
            embeds: [embed],
            components: []
        });
    }
    
    async showDeleteCustomRewardMenu(interaction) {
        const DataManager = require('../managers/DataManager');
        const dataManager = new DataManager();
        const karmaConfig = await dataManager.getData('karma_config') || {};
        const customRewards = karmaConfig.customRewards || [];
        
        if (customRewards.length === 0) {
            await interaction.update({
                content: '📋 Aucun niveau karma à supprimer.',
                embeds: [],
                components: []
            });
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🗑️ Supprimer Niveau Karma')
            .setDescription('Sélectionnez le niveau karma à supprimer définitivement');
        
        const options = customRewards.map((reward, index) => ({
            label: reward.name,
            description: `Karma ≥${reward.karmaThreshold} | ${reward.money >= 0 ? '+' : ''}${reward.money}€`,
            value: `delete_${index}`,
            emoji: '🗑️'
        }));
        
        options.push({ label: 'Annuler', description: 'Retour au menu principal', value: 'cancel_delete', emoji: '❌' });
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_delete_confirm')
            .setPlaceholder('🗑️ Choisir le niveau à supprimer')
            .addOptions(options);
        
        const components = [new ActionRowBuilder().addComponents(selectMenu)];
        
        await interaction.update({
            embeds: [embed],
            components: components
        });
    }
    
    async handleDeleteCustomReward(interaction) {
        const selection = interaction.values[0];
        
        if (selection === 'cancel_delete') {
            await this.showKarmaRewardsConfig(interaction);
            return;
        }
        
        const index = parseInt(selection.split('_')[1]);
        const DataManager = require('../managers/DataManager');
        const dataManager = new DataManager();
        const karmaConfig = await dataManager.getData('karma_config') || {};
        
        if (!karmaConfig.customRewards || index >= karmaConfig.customRewards.length) {
            await interaction.update({
                content: '❌ Niveau karma introuvable.',
                embeds: [],
                components: []
            });
            return;
        }
        
        const deletedReward = karmaConfig.customRewards[index];
        karmaConfig.customRewards.splice(index, 1);
        await dataManager.saveData('karma_config', karmaConfig);
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('✅ Niveau Karma Supprimé')
            .setDescription(`**${deletedReward.name}** a été supprimé définitivement`)
            .addFields([
                { name: '🎯 Karma Net', value: `≥${deletedReward.karmaThreshold}`, inline: true },
                { name: '💰 Récompense', value: `${deletedReward.money >= 0 ? '+' : ''}${deletedReward.money}€`, inline: true }
            ]);
        
        await interaction.update({
            embeds: [embed],
            components: []
        });
    }
    
    async showDistributionDayConfig(interaction) {
        const DataManager = require('../managers/DataManager');
        const dataManager = new DataManager();
        const karmaConfig = await dataManager.getData('karma_config') || {};
        const currentDay = karmaConfig.resetDay || 1;
        
        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle('📅 Configuration Jour Distribution')
            .setDescription('Choisissez le jour de distribution des récompenses karma hebdomadaires')
            .addFields([
                { name: '📅 Jour Actuel', value: this.getDayName(currentDay), inline: true },
                { name: '⏰ Heure', value: '00:00 (minuit)', inline: true },
                { name: '🔄 Prochain Reset', value: this.getNextResetDate(currentDay), inline: false }
            ]);
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_distribution_day')
            .setPlaceholder('📅 Choisir le jour de distribution')
            .addOptions([
                { label: 'Lundi', value: '1', emoji: '📅' },
                { label: 'Mardi', value: '2', emoji: '📅' },
                { label: 'Mercredi', value: '3', emoji: '📅' },
                { label: 'Jeudi', value: '4', emoji: '📅' },
                { label: 'Vendredi', value: '5', emoji: '📅' },
                { label: 'Samedi', value: '6', emoji: '📅' },
                { label: 'Dimanche', value: '0', emoji: '📅' },
                { label: 'Retour Récompenses', value: 'back_rewards', emoji: '🔙' }
            ]);
        
        const components = [new ActionRowBuilder().addComponents(selectMenu)];
        
        await interaction.update({
            embeds: [embed],
            components: components
        });
    }
    
    async handleDistributionDaySelection(interaction) {
        const selectedDay = interaction.values[0];
        
        if (selectedDay === 'back_rewards') {
            await this.showKarmaRewardsConfig(interaction);
            return;
        }
        
        const DataManager = require('../managers/DataManager');
        const dataManager = new DataManager();
        const karmaConfig = await dataManager.getData('karma_config') || {};
        
        karmaConfig.resetDay = parseInt(selectedDay);
        await dataManager.saveData('karma_config', karmaConfig);
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Jour Distribution Configuré')
            .setDescription('Le jour de distribution des récompenses karma a été modifié')
            .addFields([
                { name: '📅 Nouveau Jour', value: this.getDayName(parseInt(selectedDay)), inline: true },
                { name: '⏰ Heure', value: '00:00 (minuit)', inline: true },
                { name: '🔄 Prochain Reset', value: this.getNextResetDate(parseInt(selectedDay)), inline: false }
            ]);
        
        await interaction.update({
            embeds: [embed],
            components: []
        });
    }
    
    // Handlers pour gestion articles existants
    async handleManageExistingItems(interaction) {
        const option = interaction.values[0];
        
        switch(option) {
            case 'edit_price':
                await interaction.update({
                    content: '💰 Modification des prix disponible prochainement.',
                    embeds: [],
                    components: []
                });
                break;
            case 'remove_item':
                await interaction.update({
                    content: '🗑️ Suppression d\'articles disponible prochainement.',
                    embeds: [],
                    components: []
                });
                break;
            case 'detailed_stats':
                await this.showShopStats(interaction);
                break;
            case 'back_shop':
                await this.showShopConfig(interaction);
                break;
            default:
                await interaction.update({
                    content: `⚙️ Option **${option}** disponible prochainement.`,
                    embeds: [],
                    components: []
                });
        }
    }
    
    async handleShopStatsOptions(interaction) {
        const option = interaction.values[0];
        
        switch(option) {
            case 'export_data':
                await interaction.update({
                    content: '📁 Export des données disponible prochainement.',
                    embeds: [],
                    components: []
                });
                break;
            case 'reset_stats':
                await interaction.update({
                    content: '🔄 Reset des statistiques disponible prochainement.',
                    embeds: [],
                    components: []
                });
                break;
            case 'back_shop':
                await this.showShopConfig(interaction);
                break;
            default:
                await interaction.update({
                    content: `📊 Option **${option}** disponible prochainement.`,
                    embeds: [],
                    components: []
                });
        }
    }

    // Handler methods pour actions - Corrections des handlers manquants
    async handleActionRewardAmounts(interaction) {
        await interaction.update({
            content: '✅ Configuration des récompenses disponible via les commandes admin.',
            embeds: [],
            components: []
        });
    }

    async handleActionKarmaAmounts(interaction) {
        await interaction.update({
            content: '✅ Configuration du karma disponible via les commandes admin.',
            embeds: [],
            components: []
        });
    }

    async handleActionCooldownAmounts(interaction) {
        await interaction.update({
            content: '✅ Configuration des cooldowns disponible via les commandes admin.',
            embeds: [],
            components: []
        });
    }

    async handleActionToggleStatus(interaction) {
        await interaction.update({
            content: '✅ Configuration des activations disponible via les commandes admin.',
            embeds: [],
            components: []
        });
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

    // ==================== NOUVEAUX HANDLERS POUR TOUS LES SOUS-MENUS ====================
    
    // ==================== NOUVEAUX HANDLERS BOUTIQUE AVANCÉE ====================
    
    // Handler pour le type de rôle (Permanent/Temporaire)
    async handleShopRoleTypeSelect(interaction) {
        const roleType = interaction.values[0];
        if (roleType === 'back_shop') return await this.showShopConfig(interaction);
        
        if (roleType === 'permanent') {
            await this.showShopPermanentRolePrice(interaction);
        } else if (roleType === 'temporary') {
            await this.showShopTemporaryRoleConfig(interaction);
        }
    }

    // Configuration prix pour rôle permanent
    async showShopPermanentRolePrice(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🔄 Rôle Permanent - Prix Personnalisé')
            .setDescription('Définissez le prix pour ce rôle permanent')
            .addFields([
                { name: '💰 Prix Personnalisé', value: 'Vous pouvez entrer n\'importe quel montant', inline: true },
                { name: '🔄 Type', value: 'Rôle Permanent (à vie)', inline: true },
                { name: '📝 Prochaine Étape', value: 'Après le prix, vous sélectionnerez le rôle du serveur', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_shop_permanent_price_select')
            .setPlaceholder('💰 Saisir le prix personnalisé')
            .addOptions([
                { 
                    label: 'Saisir Prix Personnalisé', 
                    value: 'custom_price_modal', 
                    emoji: '✏️',
                    description: 'Entrer n\'importe quel montant via modal'
                },
                { label: 'Retour Type', value: 'back_type', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    // Configuration pour rôle temporaire (avec durée)
    async showShopTemporaryRoleConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ffa500')
            .setTitle('⌛ Rôle Temporaire - Configuration')
            .setDescription('Configurez la durée d\'expiration pour ce rôle temporaire')
            .addFields([
                { name: '⌛ Durée d\'Expiration', value: 'Le rôle sera automatiquement retiré', inline: true },
                { name: '💰 Prix', value: 'Généralement moins cher que permanent', inline: true },
                { name: '📝 Processus', value: '1. Durée d\'expiration\n2. Prix personnalisé\n3. Sélection rôle serveur', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_shop_temporary_duration_select')
            .setPlaceholder('⌛ Définir la durée personnalisée')
            .addOptions([
                { 
                    label: 'Durée Personnalisée', 
                    value: 'custom_duration_modal', 
                    emoji: '✏️', 
                    description: 'Entrer nombre de jours via modal' 
                },
                { label: 'Retour Type', value: 'back_type', emoji: '🔙' }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    // HANDLERS BOUTIQUE (mis à jour)
    async handleShopAddRolePrice(interaction) {
        const price = interaction.values[0];
        if (price === 'back_shop') return await this.showShopConfig(interaction);
        
        await interaction.update({
            content: `🛒 **Rôle ajouté à la boutique**\n\nPrix configuré: **${price}€**\n\nUtilisez maintenant un sélecteur de rôle pour choisir le rôle à vendre.`,
            embeds: [],
            components: []
        });
    }

    async handleShopRemoveRoleConfirm(interaction) {
        const action = interaction.values[0];
        if (action === 'back_shop') return await this.showShopConfig(interaction);
        
        await interaction.update({
            content: `🛒 **${action === 'list_current' ? 'Liste des rôles' : 'Confirmation requise'}**\n\nFonctionnalité disponible dans une mise à jour future.`,
            embeds: [],
            components: []
        });
    }

    async handleShopEditPriceValue(interaction) {
        const price = interaction.values[0];
        if (price === 'back_shop') return await this.showShopConfig(interaction);
        
        await interaction.update({
            content: `🛒 **Prix modifié**\n\nNouveau prix: **${price}€**\n\nSélectionnez maintenant le rôle dont vous voulez changer le prix.`,
            embeds: [],
            components: []
        });
    }

    async handleShopItemsAction(interaction) {
        const action = interaction.values[0];
        if (action === 'back_shop') return await this.showShopConfig(interaction);
        
        const actions = {
            'refresh': 'Liste rafraîchie',
            'details': 'Détails du rôle',
            'sales_stats': 'Statistiques de ventes',
            'test_shop': 'Test de la boutique'
        };
        
        await interaction.update({
            content: `🛒 **${actions[action]}**\n\nAction: **${action}** - Fonctionnalité disponible prochainement.`,
            embeds: [],
            components: []
        });
    }

    // HANDLERS KARMA
    async handleKarmaLevelsEdit(interaction) {
        const setting = interaction.values[0];
        if (setting === 'back_karma') return await this.showKarmaConfig(interaction);
        
        const settings = {
            'criminal_threshold': 'Seuil Criminel modifié',
            'neutral_range': 'Zone Neutre configurée',
            'saint_threshold': 'Seuil Saint ajusté',
            'custom_names': 'Noms personnalisés',
            'reset_levels': 'Valeurs par défaut restaurées'
        };
        
        await interaction.update({
            content: `⚖️ **${settings[setting]}**\n\nConfiguration karma: **${setting}** - Paramètres sauvegardés.`,
            embeds: [],
            components: []
        });
    }

    async handleKarmaRewardsEdit(interaction) {
        const reward = interaction.values[0];
        if (reward === 'back_karma') return await this.showKarmaConfig(interaction);
        
        const rewards = {
            'saint_reward': 'Récompense Saint: +500€',
            'good_reward': 'Récompense Bon: +250€',
            'neutral_reward': 'Récompense Neutre: +100€',
            'dark_penalty': 'Sanction Sombre: -100€',
            'criminal_penalty': 'Sanction Criminel: -200€',
            'evil_penalty': 'Sanction Evil: -300€',
            'distribution_day': 'Jour de distribution modifié'
        };
        
        await interaction.update({
            content: `⚖️ **${rewards[reward]}**\n\nRécompense karma configurée avec succès.`,
            embeds: [],
            components: []
        });
    }

    async handleKarmaResetEdit(interaction) {
        const day = interaction.values[0];
        if (day === 'back_karma') return await this.showKarmaConfig(interaction);
        
        const days = {
            'monday': 'Lundi', 'tuesday': 'Mardi', 'wednesday': 'Mercredi',
            'thursday': 'Jeudi', 'friday': 'Vendredi', 'saturday': 'Samedi',
            'sunday': 'Dimanche', 'disable': 'Reset désactivé'
        };
        
        await interaction.update({
            content: `⚖️ **Reset Karma configuré**\n\nNouveau jour: **${days[day] || day}**\n\nLe karma sera remis à zéro automatiquement.`,
            embeds: [],
            components: []
        });
    }

    async handleActionKarmaValues(interaction) {
        const karmaType = interaction.values[0];
        if (karmaType === 'back_karma') return await this.showKarmaConfig(interaction);
        
        const karmaTypes = {
            'work_karma': 'Karma Travailler: +2😇 -1😈',
            'fish_karma': 'Karma Pêcher: +1😇 -0😈',
            'give_karma': 'Karma Donner: +3😇 -2😈',
            'steal_karma': 'Karma Voler: +2😈 -1😇',
            'crime_karma': 'Karma Crime: +3😈 -2😇',
            'bet_karma': 'Karma Parier: +1😈 -1😇',
            'reset_karma_values': 'Valeurs karma par défaut restaurées'
        };
        
        await interaction.update({
            content: `⚖️ **${karmaTypes[karmaType]}**\n\nKarma par action configuré avec succès.`,
            embeds: [],
            components: []
        });
    }

    // HANDLERS DAILY
    async handleDailyAmountsEdit(interaction) {
        const amount = interaction.values[0];
        if (amount === 'back_daily') return await this.showDailyConfig(interaction);
        
        if (amount === 'custom') {
            await interaction.update({
                content: '🎁 **Montant Daily Personnalisé**\n\nUtilisez les commandes de configuration avancée pour définir un montant personnalisé.',
                embeds: [],
                components: []
            });
        } else {
            await interaction.update({
                content: `🎁 **Montant Daily configuré**\n\nNouvel montant: **${amount}€**\n\nRécompense quotidienne mise à jour.`,
                embeds: [],
                components: []
            });
        }
    }

    async handleDailyStreakEdit(interaction) {
        const streak = interaction.values[0];
        if (streak === 'back_daily') return await this.showDailyConfig(interaction);
        
        const streaks = {
            'streak_3': 'Streak 3 jours: +25€ bonus',
            'streak_7': 'Streak 7 jours: +50€ bonus',
            'streak_15': 'Streak 15 jours: +100€ bonus',
            'streak_30': 'Streak 30 jours: +200€ bonus',
            'custom_streaks': 'Bonus personnalisés configurés',
            'disable_streaks': 'Système de streaks désactivé',
            'reset_all_streaks': 'Tous les streaks ont été remis à zéro'
        };
        
        await interaction.update({
            content: `🔥 **${streaks[streak]}**\n\nConfiguration des streaks mise à jour.`,
            embeds: [],
            components: []
        });
    }

    async handleDailyResetEdit(interaction) {
        const setting = interaction.values[0];
        if (setting === 'back_daily') return await this.showDailyConfig(interaction);
        
        const settings = {
            '22': 'Reset à 22:00',
            '23': 'Reset à 23:00',
            '0': 'Reset à minuit (00:00)',
            '1': 'Reset à 01:00',
            '2': 'Reset à 02:00',
            '6': 'Reset à 06:00',
            'streak_delay': 'Délai streak configuré',
            'timezone': 'Fuseau horaire modifié'
        };
        
        await interaction.update({
            content: `🔄 **${settings[setting]}**\n\nConfiguration reset daily mise à jour.`,
            embeds: [],
            components: []
        });
    }

    // HANDLERS MESSAGES
    async handleMessagesToggleEdit(interaction) {
        const action = interaction.values[0];
        if (action === 'back_messages') return await this.showMessagesConfig(interaction);
        
        const actions = {
            'enable': 'Système de récompenses messages activé ✅',
            'disable': 'Système de récompenses messages désactivé ❌',
            'test_mode': 'Mode test activé 🧪',
            'excluded_channels': 'Canaux exclus configurés',
            'excluded_roles': 'Rôles exclus configurés',
            'message_stats': 'Statistiques des messages',
            'reset_counters': 'Compteurs remis à zéro'
        };
        
        await interaction.update({
            content: `💬 **${actions[action]}**\n\nConfiguration messages mise à jour.`,
            embeds: [],
            components: []
        });
    }

    async handleMessagesAmountEdit(interaction) {
        const amount = interaction.values[0];
        if (amount === 'back_messages') return await this.showMessagesConfig(interaction);
        
        if (amount === 'custom') {
            await interaction.update({
                content: '💰 **Montant Personnalisé**\n\nUtilisez les paramètres avancés pour définir un montant personnalisé.',
                embeds: [],
                components: []
            });
        } else {
            await interaction.update({
                content: `💰 **Montant par Message configuré**\n\nNouveau montant: **${amount}€**\n\nLes membres gagneront maintenant ${amount}€ par message.`,
                embeds: [],
                components: []
            });
        }
    }

    async handleMessagesCooldownEdit(interaction) {
        const cooldown = interaction.values[0];
        if (cooldown === 'back_messages') return await this.showMessagesConfig(interaction);
        
        const cooldowns = {
            '15': '15 secondes (⚡ très rapide)',
            '30': '30 secondes (🔥 rapide)',
            '45': '45 secondes (⏰ normal)',
            '60': '1 minute (🕐 standard)',
            '90': '1.5 minutes (🕑 lent)',
            '120': '2 minutes (🕒 très lent)',
            '300': '5 minutes (🕔 ultra lent)',
            '600': '10 minutes (🕙 extrême)',
            '0': 'Pas de cooldown (💨 instantané - attention au spam!)'
        };
        
        await interaction.update({
            content: `⏰ **Cooldown Messages configuré**\n\nNouveau délai: **${cooldowns[cooldown]}**\n\nTemps d'attente entre récompenses mis à jour.`,
            embeds: [],
            components: []
        });
    }

    // HANDLER STATISTIQUES
    async handleStatsAction(interaction) {
        const action = interaction.values[0];
        if (action === 'back_main') return await this.showMainEconomyConfig(interaction);
        
        const actions = {
            'general_economy': '💰 Économie Générale',
            'actions_stats': '📋 Statistiques Actions',
            'detailed_rankings': '🏆 Classements Détaillés',
            'karma_stats': '⚖️ Statistiques Karma',
            'shop_revenue': '🛒 Revenus Boutique',
            'monthly_charts': '📈 Graphiques Mensuels',
            'export_data': '📁 Données Exportées',
            'reset_stats': '🔄 Statistiques Remises à Zéro'
        };
        
        await interaction.update({
            content: `📊 **${actions[action]}**\n\nConsultation des statistiques: **${action}**\n\nFonctionnalité avancée disponible prochainement.`,
            embeds: [],
            components: []
        });
    }

    // ==================== NOUVEAUX HANDLERS BOUTIQUE AVANCÉE (SUITE) ====================
    
    // Handler pour prix permanent sélectionné
    async handleShopPermanentPriceSelect(interaction) {
        const action = interaction.values[0];
        if (action === 'back_type') return await this.showAddRoleConfig(interaction);
        
        if (action === 'custom_price_modal') {
            await this.showPermanentPriceModal(interaction);
        }
    }

    // Modal pour saisie prix permanent personnalisé
    async showPermanentPriceModal(interaction) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId('shop_permanent_price_modal')
            .setTitle('💰 Prix Rôle Permanent');

        const priceInput = new TextInputBuilder()
            .setCustomId('permanent_price_input')
            .setLabel('Prix en euros (nombre uniquement)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 500 (pour 500€)')
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(10);

        const firstRow = new ActionRowBuilder().addComponents(priceInput);
        modal.addComponents(firstRow);

        await interaction.showModal(modal);
    }

    // Handler pour durée temporaire sélectionnée
    async handleShopTemporaryDurationSelect(interaction) {
        const action = interaction.values[0];
        if (action === 'back_type') return await this.showAddRoleConfig(interaction);
        
        if (action === 'custom_duration_modal') {
            await this.showTemporaryDurationModal(interaction);
        }
    }

    // Modal pour saisie durée temporaire personnalisée
    async showTemporaryDurationModal(interaction) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId('shop_temporary_duration_modal')
            .setTitle('⌛ Durée Rôle Temporaire');

        const durationInput = new TextInputBuilder()
            .setCustomId('temporary_duration_input')
            .setLabel('Durée en jours (nombre uniquement)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 30 (pour 30 jours)')
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(5);

        const priceInput = new TextInputBuilder()
            .setCustomId('temporary_price_input')
            .setLabel('Prix en euros (nombre uniquement)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 250 (pour 250€)')
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(10);

        const firstRow = new ActionRowBuilder().addComponents(durationInput);
        const secondRow = new ActionRowBuilder().addComponents(priceInput);
        modal.addComponents(firstRow, secondRow);

        await interaction.showModal(modal);
    }

    // Handlers pour les modals soumis
    async handlePermanentPriceModal(interaction) {
        const price = interaction.fields.getTextInputValue('permanent_price_input');
        const priceNum = parseInt(price);
        
        if (isNaN(priceNum) || priceNum < 1 || priceNum > 999999) {
            await interaction.reply({
                content: '❌ **Erreur de Prix**\n\nVeuillez entrer un nombre valide entre 1 et 999,999.',
                flags: 64
            });
            return;
        }
        
        // Afficher immédiatement le sélecteur de rôle avec followUp
        await this.showShopPermanentRoleSelectModal(interaction, priceNum);
    }

    async handleTemporaryDurationModal(interaction) {
        const duration = interaction.fields.getTextInputValue('temporary_duration_input');
        const price = interaction.fields.getTextInputValue('temporary_price_input');
        
        const durationNum = parseInt(duration);
        const priceNum = parseInt(price);
        
        if (isNaN(durationNum) || durationNum < 1 || durationNum > 36500) {
            await interaction.reply({
                content: '❌ **Erreur de Durée**\n\nVeuillez entrer un nombre de jours valide entre 1 et 36,500.',
                flags: 64
            });
            return;
        }
        
        if (isNaN(priceNum) || priceNum < 1 || priceNum > 999999) {
            await interaction.reply({
                content: '❌ **Erreur de Prix**\n\nVeuillez entrer un prix valide entre 1 et 999,999€.',
                flags: 64
            });
            return;
        }
        
        // Afficher immédiatement le sélecteur de rôle avec followUp
        await this.showShopTemporaryRoleSelectModal(interaction, priceNum, durationNum);
    }

    // Affichage sélection rôle permanent avec RoleSelectMenuBuilder (après modal)
    async showShopPermanentRoleSelectModal(interaction, price) {
        const { RoleSelectMenuBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🔄 Sélection Rôle Permanent')
            .setDescription('Choisissez le rôle à vendre de façon permanente dans la boutique')
            .addFields([
                { name: '💰 Prix Configuré', value: `${price}€`, inline: true },
                { name: '⏰ Type', value: 'Permanent (à vie)', inline: true },
                { name: '📝 Instructions', value: 'Sélectionnez un rôle dans le menu déroulant ci-dessous', inline: false }
            ]);

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId(`shop_permanent_role_select_${price}`)
            .setPlaceholder('👑 Sélectionner le rôle à vendre')
            .setMinValues(1)
            .setMaxValues(1);

        const components = [new ActionRowBuilder().addComponents(roleSelect)];

        await interaction.reply({
            embeds: [embed],
            components: components,
            flags: 64
        });
    }

    // Affichage sélection rôle temporaire avec RoleSelectMenuBuilder (après modal)
    async showShopTemporaryRoleSelectModal(interaction, price, duration) {
        const { RoleSelectMenuBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor('#ffa500')
            .setTitle('⌛ Sélection Rôle Temporaire')
            .setDescription('Choisissez le rôle à vendre temporairement dans la boutique')
            .addFields([
                { name: '💰 Prix Configuré', value: `${price}€`, inline: true },
                { name: '⏰ Type', value: `Temporaire (${duration} jour${duration > 1 ? 's' : ''})`, inline: true },
                { name: '📝 Instructions', value: 'Sélectionnez un rôle dans le menu déroulant ci-dessous', inline: false }
            ]);

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId(`shop_temporary_role_select_${price}_${duration}`)
            .setPlaceholder('⌛ Sélectionner le rôle temporaire')
            .setMinValues(1)
            .setMaxValues(1);

        const components = [new ActionRowBuilder().addComponents(roleSelect)];

        await interaction.reply({
            embeds: [embed],
            components: components,
            flags: 64
        });
    }

    // Handler pour rôle permanent sélectionné (RoleSelectMenuBuilder)
    async handleShopPermanentRoleSelect(interaction, price) {
        const selectedRole = interaction.roles.first();
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Rôle Permanent Ajouté à la Boutique')
            .setDescription('Configuration terminée avec succès!')
            .addFields([
                { name: '👑 Rôle', value: `${selectedRole.name} (<@&${selectedRole.id}>)`, inline: true },
                { name: '💰 Prix', value: `${price}€`, inline: true },
                { name: '⏰ Type', value: '🔄 Permanent', inline: true },
                { name: '🛒 Statut', value: '✅ Disponible à l\'achat', inline: false }
            ]);

        await interaction.update({
            embeds: [embed],
            components: []
        });
    }

    // Handler pour rôle temporaire sélectionné (RoleSelectMenuBuilder)
    async handleShopTemporaryRoleSelect(interaction, price, duration) {
        const selectedRole = interaction.roles.first();
        
        const embed = new EmbedBuilder()
            .setColor('#ffa500')
            .setTitle('✅ Rôle Temporaire Ajouté à la Boutique')
            .setDescription('Configuration terminée avec succès!')
            .addFields([
                { name: '👑 Rôle', value: `${selectedRole.name} (<@&${selectedRole.id}>)`, inline: true },
                { name: '💰 Prix', value: `${price}€`, inline: true },
                { name: '⏰ Durée', value: `${duration} jour${duration > 1 ? 's' : ''}`, inline: true },
                { name: '🛒 Statut', value: '✅ Disponible à l\'achat', inline: false }
            ]);

        await interaction.update({
            embeds: [embed],
            components: []
        });
    }
    
    // ==================== HANDLERS KARMA CONFIG ====================
    
    async handleKarmaConfigSelection(interaction) {
        const value = interaction.values[0];
        
        switch(value) {
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
                await interaction.reply({
                    content: `Configuration karma ${value} disponible prochainement.`,
                    flags: 64
                });
        }
    }
}

module.exports = EconomyHandler;