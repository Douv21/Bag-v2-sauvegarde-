const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

class EconomyConfigHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

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
                { label: '⚡ Configuration Actions', value: 'actions', description: 'Travailler, voler, crime, pêcher, etc.' },
                { label: '🏪 Configuration Boutique', value: 'shop', description: 'Articles, prix, rôles temporaires' },
                { label: '⚖️ Configuration Karma', value: 'karma', description: 'Niveaux et récompenses karma' },
                { label: '📅 Configuration Daily', value: 'daily', description: 'Récompenses quotidiennes et streaks' },
                { label: '💬 Configuration Messages', value: 'messages', description: 'Récompenses par message écrit' },
                { label: '📊 Statistiques Système', value: 'stats', description: 'Données et reset du système' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    }

    async handleMainMenu(interaction) {
        const value = interaction.values[0];
        switch (value) {
            case 'actions': return this.showActionsConfig(interaction);
            case 'shop': return this.showShopConfig(interaction);
            case 'karma': return this.showKarmaConfig(interaction);
            case 'daily': return this.showDailyConfig(interaction);
            case 'messages': return this.showMessagesConfig(interaction);
            case 'stats': return this.showStatsConfig(interaction);
            default:
                await interaction.reply({ content: '❌ Section non reconnue', flags: 64 });
        }
    }

    async handleActionSelection(interaction) {
        const action = interaction.values[0];
        await interaction.reply({ content: `Action sélectionnée: ${action} - À implémenter`, flags: 64 });
    }

    async handleKarmaOption(interaction) {
        const option = interaction.values[0];
        await interaction.reply({ content: `Option karma: ${option} - À implémenter`, flags: 64 });
    }

    async handleShopOption(interaction) {
        const option = interaction.values[0];
        await interaction.reply({ content: `Option boutique: ${option} - À implémenter`, flags: 64 });
    }

    async handleDailyOption(interaction) {
        const option = interaction.values[0];
        await interaction.reply({ content: `Option daily: ${option} - À implémenter`, flags: 64 });
    }

    async handleMessagesOption(interaction) {
        const option = interaction.values[0];
        await interaction.reply({ content: `Option messages: ${option} - À implémenter`, flags: 64 });
    }

    async handleStatsOption(interaction) {
        const option = interaction.values[0];
        await interaction.reply({ content: `Option stats: ${option} - À implémenter`, flags: 64 });
    }

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

    async showShopConfig(interaction) {
        const shop = await this.dataManager.loadData('shop.json', {});
        const guildShop = shop[interaction.guild.id] || [];

        const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('🏪 Configuration Boutique')
            .setDescription(`Articles configurés : **${guildShop.length}**`)
            .addFields([
                {
                    name: '📋 Articles Disponibles',
                    value: guildShop.length > 0
                        ? guildShop.map((item, i) => `${i + 1}. ${item.name} - ${item.price}€`).join('\n')
                        : 'Aucun article configuré'
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_shop_options')
            .setPlaceholder('Choisissez une option...')
            .addOptions([
                { label: '➕ Ajouter Objet Personnalisé', value: 'add_custom', description: 'Créer un objet' },
                { label: '⏰ Ajouter Rôle Temporaire', value: 'add_temp_role', description: 'Rôle avec durée limitée' },
                { label: '⭐ Ajouter Rôle Permanent', value: 'add_perm_role', description: 'Rôle à vie' },
                { label: '✏️ Modifier Articles', value: 'edit_items', description: 'Modifier les articles existants' },
                { label: '🗑️ Supprimer Articles', value: 'delete_items', description: 'Supprimer des articles' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

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
                { label: '🎯 Gérer Niveaux Karma', value: 'karma_levels', description: 'Créer/modifier les niveaux' },
                { label: '🏆 Récompenses Automatiques', value: 'karma_rewards', description: 'Récompenses automatiques' },
                { label: '🔄 Reset Karma', value: 'karma_reset', description: 'Remise à zéro' },
                { label: '📊 Statistiques Karma', value: 'karma_stats', description: 'Voir les données actuelles' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

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
                { name: '🔥 Bonus streak', value: `${dailyConfig.streakBonus}€`, inline: true },
                { name: '🏆 Streak max', value: `${dailyConfig.maxStreak} jours`, inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_daily_options')
            .setPlaceholder('Choisissez une option...')
            .addOptions([
                { label: '💰 Montant de Base', value: 'daily_amount', description: 'Modifier la récompense de base' },
                { label: '🔥 Bonus Streak', value: 'streak_bonus', description: 'Modifier le bonus de streak' },
                { label: '🏆 Streak Maximum', value: 'max_streak', description: 'Limite du streak' },
                { label: '🔄 Reset Daily', value: 'reset_daily', description: 'Remise à zéro des streaks' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

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
                { name: '🎯 Statut', value: messageConfig.enabled ? '✅ Activé' : '❌ Désactivé', inline: true },
                { name: '💰 Montant', value: `${messageConfig.amountPerMessage}€`, inline: true },
                { name: '⏰ Cooldown', value: `${messageConfig.cooldownMinutes} min`, inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_messages_options')
            .setPlaceholder('Choisissez une option...')
            .addOptions([
                { label: messageConfig.enabled ? '❌ Désactiver' : '✅ Activer', value: 'toggle_messages', description: 'Activer/Désactiver le système' },
                { label: '💰 Montant', value: 'message_amount', description: 'Modifier la récompense' },
                { label: '⏰ Cooldown', value: 'message_cooldown', description: 'Temps entre récompenses' },
                { label: '📊 Statistiques', value: 'message_stats', description: 'Voir les données actuelles' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showStatsConfig(interaction) {
        const economy = await this.dataManager.loadData('economy.json', {});
        const totalUsers = Object.keys(economy).length;
        const totalBalance = Object.values(economy).reduce((sum, u) => sum + (u.balance || 0), 0);

        const embed = new EmbedBuilder()
            .setColor('#34495e')
            .setTitle('📊 Statistiques du Système')
            .setDescription('Données actuelles du système économique')
            .addFields([
                { name: '👥 Utilisateurs', value: `${totalUsers}`, inline: true },
                { name: '💰 Total en circulation', value: `${totalBalance.toLocaleString()}€`, inline: true },
                { name: '📈 Moyenne par utilisateur', value: `${Math.round(totalBalance / Math.max(totalUsers, 1))}€`, inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_stats_options')
            .setPlaceholder('Choisissez une option...')
            .addOptions([
                { label: '📊 Voir Statistiques Détaillées', value: 'detailed_stats', description: 'Toutes les données du système' },
                { label: '💾 Sauvegarder Données', value: 'backup_data', description: 'Créer une sauvegarde' },
                { label: '🔄 Reset Économie', value: 'reset_economy', description: 'Remise à zéro totale' },
                { label: '📥 Importer/Exporter', value: 'import_export', description: 'Gérer les données' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }
}

module.exports = EconomyConfigHandler;
