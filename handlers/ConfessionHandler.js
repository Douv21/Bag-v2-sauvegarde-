const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder } = require('discord.js');

class ConfessionHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    async handleConfessionLogsConfig(interaction) {
        const value = interaction.values[0];
        const config = await this.dataManager.getData('config');
        const guildId = interaction.guild.id;

        if (value === 'log_channel') {
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('📝 Canal Logs Admin')
                .setDescription('Sélectionnez le canal où envoyer les logs de confessions');

            const channelSelect = new ChannelSelectMenuBuilder()
                .setCustomId('confession_log_channel')
                .setPlaceholder('📝 Sélectionnez le canal logs')
                .setChannelTypes([0]); // Text channels

            const components = [new ActionRowBuilder().addComponents(channelSelect)];

            await interaction.update({
                embeds: [embed],
                components: components
            });

        } else if (value === 'log_level') {
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('🔍 Niveau de Détail')
                .setDescription('Choisissez le niveau d\'information dans les logs');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confession_log_level')
                .setPlaceholder('🔍 Choisir niveau de détail')
                .addOptions([
                    { label: 'Basique', description: 'Contenu et utilisateur seulement', value: 'basic', emoji: '📄' },
                    { label: 'Détaillé', description: 'Toutes les informations', value: 'detailed', emoji: '📋' },
                    { label: 'Complet', description: 'Inclut métadonnées et traces', value: 'full', emoji: '🔍' }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.update({
                embeds: [embed],
                components: components
            });

        } else if (value === 'log_images') {
            if (!config.confessions) config.confessions = {};
            if (!config.confessions[guildId]) config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}',
                logImages: true
            };

            config.confessions[guildId].logImages = !config.confessions[guildId].logImages;
            await this.dataManager.saveData('config', config);

            const status = config.confessions[guildId].logImages ? '🟢 Activé' : '🔴 Désactivé';
            await interaction.update({
                content: `🖼️ Images dans logs : ${status}`,
                components: []
            });
        }
    }

    async handleConfessionLogLevel(interaction) {
        const value = interaction.values[0];
        const config = await this.dataManager.getData('config');
        const guildId = interaction.guild.id;

        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}',
                logLevel: 'basic'
            };
        }

        config.confessions[guildId].logLevel = value;
        await this.dataManager.saveData('config', config);

        const levels = {
            'basic': '📄 Basique - Contenu et utilisateur seulement',
            'detailed': '📋 Détaillé - Toutes les informations',
            'full': '🔍 Complet - Inclut métadonnées et traces'
        };

        await interaction.update({
            content: `✅ Niveau de détail mis à jour: ${levels[value]}`,
            components: []
        });
    }

    async handleConfessionLogChannel(interaction) {
        const channelId = interaction.values[0];
        const config = await this.dataManager.getData('config');
        const guildId = interaction.guild.id;

        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}'
            };
        }

        config.confessions[guildId].logChannel = channelId;
        await this.dataManager.saveData('config', config);

        const channel = interaction.guild.channels.cache.get(channelId);
        await interaction.update({
            content: `✅ Canal logs configuré: ${channel ? channel.name : 'Canal inconnu'}`,
            components: []
        });
    }
}

module.exports = ConfessionHandler;