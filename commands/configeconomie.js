const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configeconomie')
        .setDescription('Configuration du système économique (Admin uniquement)')
        .setDefaultMemberPermissions('0'),

    async execute(interaction, dataManager) {
        try {
            await this.showMainEconomyConfig(interaction, dataManager);
        } catch (error) {
            console.error('❌ Erreur configeconomie:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la configuration économique.',
                flags: 64
            });
        }
    },

    async showMainEconomyConfig(interaction, dataManager) {
        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('💰 Configuration Économique')
            .setDescription('Configurez tous les aspects du système économique du serveur')
            .addFields([
                {
                    name: '💼 Actions Économiques',
                    value: 'Gérer les actions (travail, vol, crime, etc.)',
                    inline: true
                },
                {
                    name: '🛒 Boutique',
                    value: 'Configurer les objets et rôles à vendre',
                    inline: true
                },
                {
                    name: '⚖️ Système Karma',
                    value: 'Sanctions et récompenses automatiques',
                    inline: true
                },
                {
                    name: '🎁 Daily/Récompenses',
                    value: 'Configuration des récompenses quotidiennes',
                    inline: true
                },
                {
                    name: '💬 Messages',
                    value: 'Récompenses automatiques par message',
                    inline: true
                },
                {
                    name: '📊 Statistiques',
                    value: 'Données et métriques du système',
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_main_config')
            .setPlaceholder('💰 Sélectionner une section économique')
            .addOptions([
                {
                    label: 'Actions Économiques',
                    description: 'Gérer les actions (travail, vol, etc.)',
                    value: 'actions',
                    emoji: '💼'
                },
                {
                    label: 'Boutique',
                    description: 'Configurer la boutique et les objets',
                    value: 'shop',
                    emoji: '🛒'
                },
                {
                    label: 'Système Karma',
                    description: 'Configuration sanctions et récompenses',
                    value: 'karma',
                    emoji: '⚖️'
                },
                {
                    label: 'Daily/Récompenses',
                    description: 'Récompenses quotidiennes et streaks',
                    value: 'daily',
                    emoji: '🎁'
                },
                {
                    label: 'Messages',
                    description: 'Gains automatiques par message',
                    value: 'messages',
                    emoji: '💬'
                },
                {
                    label: 'Statistiques',
                    description: 'Données du système économique',
                    value: 'stats',
                    emoji: '📊'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        if (interaction.deferred) {
            await interaction.editReply({
                embeds: [embed],
                components: components
            });
        } else {
            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        }
    }
};