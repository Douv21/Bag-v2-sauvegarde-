/**

Handler dédié à la configuration de l'économie */


const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

class EconomyConfigHandler { constructor(dataManager) { this.dataManager = dataManager; }

async showMainConfigMenu(interaction) {
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

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async handleMainMenu(interaction) {
    const value = interaction.values[0];
    switch (value) {
        case 'actions': await this.showActionsConfig(interaction); break;
        case 'shop': await this.showShopConfig(interaction); break;
        case 'karma': await this.showKarmaConfig(interaction); break;
        case 'daily': await this.showDailyConfig(interaction); break;
        case 'messages': await this.showMessagesConfig(interaction); break;
        case 'stats': await this.showStatsConfig(interaction); break;
        default: await interaction.reply({ content: '❌ Section non reconnue', ephemeral: true });
    }
}

async handleActionSelection(interaction) {
    const action = interaction.values[0];
    await interaction.reply({ content: `Action sélectionnée: ${action} - À implémenter`, ephemeral: true });
}

async handleKarmaOption(interaction) {
    const option = interaction.values[0];
    await interaction.reply({ content: `Option karma: ${option} - À implémenter`, ephemeral: true });
}

async handleShopOption(interaction) {
    const option = interaction.values[0];
    await interaction.reply({ content: `Option boutique: ${option} - À implémenter`, ephemeral: true });
}

async handleDailyOption(interaction) {
    const option = interaction.values[0];
    await interaction.reply({ content: `Option daily: ${option} - À implémenter`, ephemeral: true });
}

async handleMessagesOption(interaction) {
    const option = interaction.values[0];
    await interaction.reply({ content: `Option messages: ${option} - À implémenter`, ephemeral: true });
}

async handleStatsOption(interaction) {
    const option = interaction.values[0];
    await interaction.reply({ content: `Option stats: ${option} - À implémenter`, ephemeral: true });
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
            { label: '🎣 Pêcher', value: 'pecher', description: 'Configurer les gains de la p

             
