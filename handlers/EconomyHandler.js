const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

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
        
        await interaction.update({
            content: `⚙️ Configuration de l'action **${action}** disponible prochainement.`,
            embeds: [],
            components: []
        });
    }

    async handleEconomyShopConfig(interaction) {
        const option = interaction.values[0];
        
        await interaction.update({
            content: `🛒 Configuration boutique **${option}** disponible prochainement.`,
            embeds: [],
            components: []
        });
    }

    async handleEconomyKarmaConfig(interaction) {
        const option = interaction.values[0];
        
        await interaction.update({
            content: `⚖️ Configuration karma **${option}** disponible prochainement.`,
            embeds: [],
            components: []
        });
    }

    async handleEconomyDailyConfig(interaction) {
        const option = interaction.values[0];
        
        await interaction.update({
            content: `🎁 Configuration daily **${option}** disponible prochainement.`,
            embeds: [],
            components: []
        });
    }

    async handleEconomyMessagesConfig(interaction) {
        const option = interaction.values[0];
        
        await interaction.update({
            content: `💬 Configuration messages **${option}** disponible prochainement.`,
            embeds: [],
            components: []
        });
    }
}

module.exports = EconomyHandler;