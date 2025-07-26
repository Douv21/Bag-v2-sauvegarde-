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
        await interaction.update({ content: `⚡ Action sélectionnée: **${action}** - À implémenter`, embeds: [], components: [] });
    }

    /**
     * Gestion des options karma spécifiques
     */
    async handleKarmaOption(interaction) {
        const option = interaction.values[0];
        await interaction.update({ content: `⚖️ Option karma: **${option}** - À implémenter`, embeds: [], components: [] });
    }

    /**
     * Gestion des options boutique spécifiques
     */
    async handleShopOption(interaction) {
        const option = interaction.values[0];
        await interaction.update({ content: `🏪 Option boutique: **${option}** - À implémenter`, embeds: [], components: [] });
    }

    /**
     * Gestion des options daily spécifiques
     */
    async handleDailyOption(interaction) {
        const option = interaction.values[0];
        await interaction.update({ content: `📅 Option daily: **${option}** - À implémenter`, embeds: [], components: [] });
    }

    /**
     * Gestion des options messages spécifiques
     */
    async handleMessagesOption(interaction) {
        const option = interaction.values[0];
        await interaction.update({ content: `💬 Option messages: **${option}** - À implémenter`, embeds: [], components: [] });
    }

    /**
     * Gestion des options stats spécifiques
     */
    async handleStatsOption(interaction) {
        const option = interaction.values[0];
        await interaction.update({ content: `📊 Option stats: **${option}** - À implémenter`, embeds: [], components: [] });
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

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_action_select')
            .setPlaceholder('Choisissez une action à configurer...')
            .addOptions([
                { label: '💪 Travailler', value: 'travailler', description: 'Configurer les récompenses du travail' },
                { label: '🎣 Pêcher', value: 'pecher', description: 'Configurer les gains de la pêche' },
                { label: '💝 Donner', value: 'donner', description: 'Configurer les donations' },
                { label: '🔪 Voler', value: 'voler', description: 'Configurer le système de vol' },
                { label: '🦹 Crime', value: 'crime', description: 'Configurer les crimes' },
                { label: '🎲 Parier', value: 'parier', description: 'Configurer les paris' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Configuration de la boutique
     */
    async showShopConfig(interaction) {
        const guildId = interaction.guild.id;
        const fs = require('fs');
        let shop = {};
        try {
            shop = JSON.parse(fs.readFileSync('./render/data/shop.json', 'utf8'));
        } catch (error) {
            shop = {};
        }
        
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

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_shop_options')
            .setPlaceholder('Choisissez une option...')
            .addOptions([
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
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
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

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_options')
            .setPlaceholder('Choisissez une option...')
            .addOptions([
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
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Configuration du système daily
     */
    async showDailyConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('📅 Configuration Daily')
            .setDescription('Configuration des récompenses quotidiennes')
            .addFields([
                { name: '💰 Montant de base', value: '100€ par défaut', inline: true },
                { name: '🔥 Bonus streak', value: '50€ par jour de suite', inline: true },
                { name: '📈 Streak maximum', value: '30 jours maximum', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_daily_options')
            .setPlaceholder('Choisissez une option...')
            .addOptions([
                {
                    label: '💰 Configurer Montant',
                    value: 'daily_amount',
                    description: 'Modifier le montant de base'
                },
                {
                    label: '🔥 Configurer Bonus Streak',
                    value: 'daily_streak',
                    description: 'Modifier le bonus par jour consécutif'
                },
                {
                    label: '📊 Statistiques Daily',
                    value: 'daily_stats',
                    description: 'Voir les statistiques'
                },
                {
                    label: '🔄 Reset Daily',
                    value: 'daily_reset',
                    description: 'Remettre à zéro les streaks'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Configuration des récompenses par message
     */
    async showMessagesConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#34495e')
            .setTitle('💬 Configuration Messages')
            .setDescription('Récompenses automatiques par message écrit')
            .addFields([
                { name: '💰 Récompense', value: '5€ par message', inline: true },
                { name: '⏰ Cooldown', value: '60 secondes entre gains', inline: true },
                { name: '🛡️ Anti-spam', value: 'Protection contre abus', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_messages_options')
            .setPlaceholder('Choisissez une option...')
            .addOptions([
                {
                    label: '💰 Configurer Montant',
                    value: 'messages_amount',
                    description: 'Modifier le gain par message'
                },
                {
                    label: '⏰ Configurer Cooldown',
                    value: 'messages_cooldown',
                    description: 'Modifier le délai entre gains'
                },
                {
                    label: '🔄 Toggle Système',
                    value: 'messages_toggle',
                    description: 'Activer/désactiver les gains'
                },
                {
                    label: '📊 Statistiques Messages',
                    value: 'messages_stats',
                    description: 'Voir les statistiques'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Affichage des statistiques système
     */
    async showStatsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#95a5a6')
            .setTitle('📊 Statistiques Système')
            .setDescription('Données et métriques du système économique')
            .addFields([
                { name: '💹 Économie Globale', value: 'Argent total en circulation', inline: true },
                { name: '⚖️ Répartition Karma', value: 'Distribution bon/mauvais karma', inline: true },
                { name: '📈 Activité Actions', value: 'Fréquence des actions', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_stats_options')
            .setPlaceholder('Choisissez une option...')
            .addOptions([
                {
                    label: '💹 Statistiques Globales',
                    value: 'stats_global',
                    description: 'Vue d\'ensemble du système'
                },
                {
                    label: '👥 Statistiques Utilisateurs',
                    value: 'stats_users',
                    description: 'Données par utilisateur'
                },
                {
                    label: '📊 Export Données',
                    value: 'stats_export',
                    description: 'Exporter les données'
                },
                {
                    label: '🗑️ Reset Complet',
                    value: 'stats_reset',
                    description: 'Remise à zéro totale'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }
}

module.exports = EconomyConfigHandler;