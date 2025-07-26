/**
 * Handler dédié à la configuration de l'économie
 */

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

class EconomyConfigHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    /**
     * Affiche le menu principal de configuration
     */
    async showMainConfigMenu(interaction) {
        // On différé pour éviter l'erreur "already acknowledged"
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('💰 Configuration Économique')
            .setDescription('Sélectionnez une section à configurer :')
            .addFields([
                { name: '⚡ Actions', value: 'Configurer travailler, voler, crime, etc.', inline: true },
                { name: '🏮 Boutique', value: 'Gérer les articles et prix', inline: true },
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
                { label: '🏮 Configuration Boutique', value: 'shop', description: 'Articles, prix, rôles temporaires' },
                { label: '⚖️ Configuration Karma', value: 'karma', description: 'Niveaux et récompenses karma' },
                { label: '📅 Configuration Daily', value: 'daily', description: 'Récompenses quotidiennes et streaks' },
                { label: '💬 Configuration Messages', value: 'messages', description: 'Récompenses par message écrit' },
                { label: '📊 Statistiques Système', value: 'stats', description: 'Données et reset du système' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.editReply({ embeds: [embed], components: [row] });
    }

    /**
     * Gère la sélection du menu principal
     */
    async handleMainMenu(interaction) {
        await interaction.deferUpdate();

        const value = interaction.values[0];
        switch (value) {
            case 'actions': await this.showActionsConfig(interaction); break;
            case 'shop': await this.showShopConfig(interaction); break;
            case 'karma': await this.showKarmaConfig(interaction); break;
            case 'daily': await this.showDailyConfig(interaction); break;
            case 'messages': await this.showMessagesConfig(interaction); break;
            case 'stats': await this.showStatsConfig(interaction); break;
            default: await interaction.editReply({ content: '❌ Section non reconnue', components: [] });
        }
    }

    /**
     * Sous-menus (à implémenter plus tard)
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
                { label: '💝 Donner', value: 'donner', description: 'Configurer le don entre utilisateurs' },
                { label: '🔪 Voler', value: 'voler', description: 'Configurer les sanctions ou gains du vol' },
                { label: '🦹 Crime', value: 'crime', description: 'Configurer les risques et récompenses du crime' },
                { label: '🎲 Parier', value: 'parier', description: 'Configurer les règles du pari' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.editReply({ embeds: [embed], components: [row] });
    }

    // Fonctions placeholders (implémenter plus tard)
    async showShopConfig(interaction) { await interaction.editReply({ content: '🏮 Configuration Boutique - À implémenter', components: [] }); }
    async showKarmaConfig(interaction) { await interaction.editReply({ content: '⚖️ Configuration Karma - À implémenter', components: [] }); }
    async showDailyConfig(interaction) { await interaction.editReply({ content: '📅 Configuration Daily - À implémenter', components: [] }); }
    async showMessagesConfig(interaction) { await interaction.editReply({ content: '💬 Configuration Messages - À implémenter', components: [] }); }
    async showStatsConfig(interaction) { await interaction.editReply({ content: '📊 Statistiques Système - À implémenter', components: [] }); }
}

module.exports = EconomyConfigHandler;
