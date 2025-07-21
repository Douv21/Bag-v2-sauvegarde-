/**
 * Handler dédié à la configuration de l'économie
 */

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

class EconomyConfigHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    /**
     * Afficher le menu principal de configuration économique
     */
    async showMainConfigMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('💰 Configuration Économique')
            .setDescription('Sélectionnez une section à configurer :')
            .addFields([
                { name: '⚡ Actions', value: 'Configurer travailler, voler, crime, etc.', inline: true },
                { name: '🏪 Boutique', value: 'Gérer les articles et prix', inline: true },
                { name: '⚖️ Karma', value: 'Système de récompenses karma', inline: true },
                { name: '📅 Daily', value: 'Récompenses quotidiennes', inline: true },
                { name: '💬 Messages', value: 'Récompenses par message', inline: true },
                { name: '📊 Statistiques', value: 'Affichage et reset des données', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_config_main')
            .setPlaceholder('Choisissez une section...')
            .addOptions([
                {
                    label: '⚡ Configuration Actions',
                    value: 'actions',
                    description: 'Travailler, voler, crime, pêcher, etc.'
                },
                {
                    label: '🏪 Configuration Boutique',
                    value: 'shop',
                    description: 'Articles, prix, rôles temporaires'
                },
                {
                    label: '⚖️ Configuration Karma',
                    value: 'karma',
                    description: 'Niveaux et récompenses karma'
                },
                {
                    label: '📅 Configuration Daily',
                    value: 'daily',
                    description: 'Récompenses quotidiennes et streaks'
                },
                {
                    label: '💬 Configuration Messages',
                    value: 'messages',
                    description: 'Récompenses par message écrit'
                },
                {
                    label: '📊 Statistiques Système',
                    value: 'stats',
                    description: 'Données et reset du système'
                }
            ]);

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    }

    /**
     * Gérer les interactions du menu principal
     */
    async handleMainMenu(interaction) {
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
                await this.showMessagesConfig(interaction);
                break;
            case 'stats':
                await this.showStatsConfig(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Section non reconnue', flags: 64 });
        }
    }

    /**
     * Gestion des sélections d'actions
     */
    async handleActionSelection(interaction) {
        const action = interaction.values[0];
        // Ici la logique pour chaque action sera implémentée
        await interaction.reply({ content: `Action sélectionnée: ${action} - À implémenter`, flags: 64 });
    }

    /**
     * Gestion des options karma spécifiques
     */
    async handleKarmaOption(interaction) {
        const option = interaction.values[0];
        // Ici la logique pour chaque option sera implémentée
        await interaction.reply({ content: `Option karma: ${option} - À implémenter`, flags: 64 });
    }

    /**
     * Gestion des options boutique spécifiques
     */
    async handleShopOption(interaction) {
        const option = interaction.values[0];
        // Ici la logique pour chaque option sera implémentée
        await interaction.reply({ content: `Option boutique: ${option} - À implémenter`, flags: 64 });
    }

    /**
     * Gestion des options daily spécifiques
     */
    async handleDailyOption(interaction) {
        const option = interaction.values[0];
        // Ici la logique pour chaque option sera implémentée
        await interaction.reply({ content: `Option daily: ${option} - À implémenter`, flags: 64 });
    }

    /**
     * Gestion des options messages spécifiques
     */
    async handleMessagesOption(interaction) {
        const option = interaction.values[0];
        // Ici la logique pour chaque option sera implémentée
        await interaction.reply({ content: `Option messages: ${option} - À implémenter`, flags: 64 });
    }

    /**
     * Gestion des options stats spécifiques
     */
    async handleStatsOption(interaction) {
        const option = interaction.values[0];
        // Ici la logique pour chaque option sera implémentée
        await interaction.reply({ content: `Option stats: ${option} - À implémenter`, flags: 64 });
    }

    /**
     * Configuration des actions économiques
     */
    async showActionsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('⚡ Configuration des Actions')
            .setDescription('Configurez les différentes actions économiques :')
            .addFields([
                { name: '💪 Travailler', value: 'Action positive 😇', inline: true },
                { name: '🎣 Pêcher', value: 'Action positive 😇', inline: true },
                { name: '💝 Donner', value: 'Action très positive 😇', inline: true },
                { name: '🔪 Voler', value: 'Action négative 😈', inline: true },
                { name: '🦹 Crime', value: 'Action très négative 😈', inline: true },
                { name: '🎲 Parier', value: 'Action risquée 😈', inline: true }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'economy_action_select',
                    placeholder: 'Choisissez une action à configurer...',
                    options: [
                        { label: '💪 Travailler', value: 'travailler', description: 'Configurer les récompenses du travail' },
                        { label: '🎣 Pêcher', value: 'pecher', description: 'Configurer les gains de la pêche' },
                        { label: '💝 Donner', value: 'donner', description: 'Configurer les donations' },
                        { label: '🔪 Voler', value: 'voler', description: 'Configurer le système de vol' },
                        { label: '🦹 Crime', value: 'crime', description: 'Configurer les crimes' },
                        { label: '🎲 Parier', value: 'parier', description: 'Configurer les paris' }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Configuration de la boutique
     */
    async showShopConfig(interaction) {
        const guildId = interaction.guild.id;
        const shop = await this.dataManager.loadData('shop.json', {});
        const guildShop = shop[guildId] || [];

        const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('🏪 Configuration Boutique')
            .setDescription(`Articles configurés : **${guildShop.length}**`)
            .addFields([
                {
                    name: '📋 Articles Disponibles',
                    value: guildShop.length > 0 
                        ? guildShop.slice(0, 10).map((item, i) => 
                            `${i + 1}. ${item.name} - ${item.price}€`
                        ).join('\n') + (guildShop.length > 10 ? `\n... et ${guildShop.length - 10} autres` : '')
                        : 'Aucun article configuré',
                    inline: false
                }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'economy_shop_options',
                    placeholder: 'Choisissez une option...',
                    options: [
                        {
                            label: '➕ Ajouter Objet Personnalisé',
                            value: 'add_custom',
                            description: 'Créer un objet avec nom et description'
                        },
                        {
                            label: '⏰ Ajouter Rôle Temporaire',
                            value: 'add_temp_role',
                            description: 'Rôle avec durée limitée'
                        },
                        {
                            label: '⭐ Ajouter Rôle Permanent',
                            value: 'add_perm_role',
                            description: 'Rôle à vie'
                        },
                        {
                            label: '✏️ Modifier Articles',
                            value: 'edit_items',
                            description: 'Modifier articles existants'
                        },
                        {
                            label: '🗑️ Supprimer Articles',
                            value: 'delete_items',
                            description: 'Supprimer des articles'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Configuration du karma
     */
    async showKarmaConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('⚖️ Configuration Karma')
            .setDescription('Système de karma avec récompenses/sanctions automatiques')
            .addFields([
                { name: '🎯 Niveaux Karma', value: 'Créer des niveaux personnalisés', inline: true },
                { name: '🏆 Récompenses Auto', value: 'Distribution automatique', inline: true },
                { name: '🔄 Reset Système', value: 'Remise à zéro du karma', inline: true }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'economy_karma_options',
                    placeholder: 'Choisissez une option...',
                    options: [
                        {
                            label: '🎯 Gérer Niveaux Karma',
                            value: 'karma_levels',
                            description: 'Créer/modifier niveaux personnalisés'
                        },
                        {
                            label: '🏆 Récompenses Automatiques',
                            value: 'karma_rewards',
                            description: 'Configuration distribution auto'
                        },
                        {
                            label: '🔄 Reset Karma',
                            value: 'karma_reset',
                            description: 'Remettre à zéro le système'
                        },
                        {
                            label: '📊 Statistiques Karma',
                            value: 'karma_stats',
                            description: 'Voir les données actuelles'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Configuration du système daily
     */
    async showDailyConfig(interaction) {
        const dailyConfig = await this.dataManager.loadData('daily_config.json', {
            baseAmount: 100,
            streakBonus: 50,
            maxStreak: 30
        });

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('📅 Configuration Daily')
            .setDescription('Configuration des récompenses quotidiennes')
            .addFields([
                { name: '💰 Montant de base', value: `${dailyConfig.baseAmount}€`, inline: true },
                { name: '🔥 Bonus streak', value: `${dailyConfig.streakBonus}€ par jour`, inline: true },
                { name: '🏆 Streak maximum', value: `${dailyConfig.maxStreak} jours`, inline: true }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'economy_daily_options',
                    placeholder: 'Choisissez une option...',
                    options: [
                        {
                            label: '💰 Montant de Base',
                            value: 'daily_amount',
                            description: 'Modifier la récompense de base'
                        },
                        {
                            label: '🔥 Bonus Streak',
                            value: 'streak_bonus',
                            description: 'Bonus par jour de streak'
                        },
                        {
                            label: '🏆 Streak Maximum',
                            value: 'max_streak',
                            description: 'Limite du système de streak'
                        },
                        {
                            label: '🔄 Reset Daily',
                            value: 'reset_daily',
                            description: 'Remettre à zéro les streaks'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Configuration des récompenses par message
     */
    async showMessagesConfig(interaction) {
        const messageConfig = await this.dataManager.loadData('message_rewards.json', {
            enabled: false,
            amountPerMessage: 5,
            cooldownMinutes: 1
        });

        const embed = new EmbedBuilder()
            .setColor('#1abc9c')
            .setTitle('💬 Configuration Messages')
            .setDescription('Récompenses automatiques pour les messages')
            .addFields([
                { 
                    name: '🎯 Statut', 
                    value: messageConfig.enabled ? '✅ Activé' : '❌ Désactivé', 
                    inline: true 
                },
                { 
                    name: '💰 Montant par message', 
                    value: `${messageConfig.amountPerMessage}€`, 
                    inline: true 
                },
                { 
                    name: '⏰ Cooldown', 
                    value: `${messageConfig.cooldownMinutes} minute(s)`, 
                    inline: true 
                }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'economy_messages_options',
                    placeholder: 'Choisissez une option...',
                    options: [
                        {
                            label: messageConfig.enabled ? '❌ Désactiver' : '✅ Activer',
                            value: 'toggle_messages',
                            description: 'Activer/désactiver le système'
                        },
                        {
                            label: '💰 Montant par Message',
                            value: 'message_amount',
                            description: 'Modifier la récompense'
                        },
                        {
                            label: '⏰ Cooldown Messages',
                            value: 'message_cooldown',
                            description: 'Temps entre récompenses'
                        },
                        {
                            label: '📊 Statistiques Messages',
                            value: 'message_stats',
                            description: 'Voir les données actuelles'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Configuration des statistiques
     */
    async showStatsConfig(interaction) {
        const economy = await this.dataManager.loadData('economy.json', {});
        const totalUsers = Object.keys(economy).length;
        const totalBalance = Object.values(economy).reduce((sum, user) => sum + (user.balance || 0), 0);

        const embed = new EmbedBuilder()
            .setColor('#34495e')
            .setTitle('📊 Statistiques du Système')
            .setDescription('Données actuelles du système économique')
            .addFields([
                { name: '👥 Utilisateurs total', value: totalUsers.toString(), inline: true },
                { name: '💰 Argent en circulation', value: `${totalBalance.toLocaleString()}€`, inline: true },
                { name: '📈 Moyenne par utilisateur', value: `${Math.round(totalBalance / Math.max(totalUsers, 1))}€`, inline: true }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'economy_stats_options',
                    placeholder: 'Choisissez une option...',
                    options: [
                        {
                            label: '📊 Voir Statistiques Détaillées',
                            value: 'detailed_stats',
                            description: 'Toutes les données du système'
                        },
                        {
                            label: '💾 Sauvegarder Données',
                            value: 'backup_data',
                            description: 'Créer une sauvegarde manuelle'
                        },
                        {
                            label: '🔄 Reset Économie',
                            value: 'reset_economy',
                            description: 'DANGER: Remettre à zéro tout'
                        },
                        {
                            label: '📥 Importer/Exporter',
                            value: 'import_export',
                            description: 'Gestion des données'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }
}

module.exports = EconomyConfigHandler;