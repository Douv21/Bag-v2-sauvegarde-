/**
 * Handler dédié à la configuration des confessions
 */

const { EmbedBuilder, ChannelSelectMenuBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

class ConfessionConfigHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    /**
     * Afficher le menu principal de configuration des confessions
     */
    async showMainConfigMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('🛠️ Configuration des Confessions')
            .setDescription('Sélectionnez une option à configurer :')
            .addFields([
                { name: '📝 Canaux', value: 'Gérer les canaux de confessions', inline: true },
                { name: '📋 Logs Admin', value: 'Configuration des logs administrateur', inline: true },
                { name: '🧵 Auto-Thread', value: 'Configuration des threads automatiques', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_config_main')
            .setPlaceholder('Choisissez une option...')
            .addOptions([
                {
                    label: '📝 Gestion des Canaux',
                    value: 'channels',
                    description: 'Ajouter/supprimer canaux de confessions'
                },
                {
                    label: '📋 Configuration Logs Admin',
                    value: 'admin_logs',
                    description: 'Configurer les logs administrateur'
                },
                {
                    label: '🧵 Configuration Auto-Thread',
                    value: 'auto_thread',
                    description: 'Gérer les threads automatiques'
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
            case 'channels':
                await this.showChannelsConfig(interaction);
                break;
            case 'admin_logs':
                await this.showAdminLogsConfig(interaction);
                break;
            case 'auto_thread':
                await this.showAutoThreadConfig(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Option non reconnue', flags: 64 });
        }
    }

    /**
     * Configuration des canaux de confession
     */
    async showChannelsConfig(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('confessions.json', {});
        const guildConfig = config[guildId] || { channels: [] };

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('📝 Configuration des Canaux')
            .setDescription(`Canaux configurés : **${guildConfig.channels.length}**`)
            .addFields([
                {
                    name: '📋 Canaux Actifs',
                    value: guildConfig.channels.length > 0 
                        ? guildConfig.channels.map(ch => `<#${ch}>`).join('\n')
                        : 'Aucun canal configuré',
                    inline: false
                }
            ]);

        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('confession_channel_add')
            .setPlaceholder('Sélectionnez un canal à ajouter...')
            .setMinValues(1)
            .setMaxValues(5)
            .addChannelTypes(0); // TEXT_CHANNEL

        const row1 = new ActionRowBuilder().addComponents(channelSelect);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_channel_remove')
            .setPlaceholder('Retirer un canal...')
            .setDisabled(guildConfig.channels.length === 0)
            .addOptions(guildConfig.channels.length > 0 
                ? guildConfig.channels.map(chId => ({
                    label: `#${interaction.guild.channels.cache.get(chId)?.name || 'Canal supprimé'}`,
                    value: chId,
                    description: `ID: ${chId}`
                }))
                : [{ label: 'Aucun canal', value: 'none', description: 'Aucun canal configuré' }]
            );

        const row2 = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.update({ embeds: [embed], components: [row1, row2] });
    }

    /**
     * Gestion des options logs (alias pour compatibility)
     */
    async handleLogsOptions(interaction) {
        return await this.showAdminLogsConfig(interaction);
    }

    /**
     * Gestion des options auto-thread (alias pour compatibility)
     */
    async handleAutoThreadOptions(interaction) {
        return await this.showAutoThreadConfig(interaction);
    }

    /**
     * Gestion des options log spécifiques
     */
    async handleLogOption(interaction) {
        const option = interaction.values[0];
        // Ici la logique pour chaque option sera implémentée
        await interaction.reply({ content: `Option logs: ${option} - À implémenter`, flags: 64 });
    }

    /**
     * Gestion des options auto-thread spécifiques
     */
    async handleAutoThreadOption(interaction) {
        const option = interaction.values[0];
        // Ici la logique pour chaque option sera implémentée
        await interaction.reply({ content: `Option auto-thread: ${option} - À implémenter`, flags: 64 });
    }

    /**
     * Configuration des logs administrateur
     */
    async showAdminLogsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('📋 Configuration Logs Admin')
            .setDescription('Configuration des logs administrateur pour les confessions')
            .addFields([
                { name: '🏠 Canal Logs', value: 'Définir le canal des logs admin', inline: true },
                { name: '📊 Niveau de détail', value: 'Basic, Detailed ou Full', inline: true },
                { name: '🖼️ Inclure images', value: 'Afficher les images dans les logs', inline: true },
                { name: '🔔 Ping Rôles', value: 'Mentionner des rôles spécifiques', inline: true }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    
                    .setCustomId( 'confession_logs_options',
                    .setPlaceholder( 'Choisissez une option...',
                    .addOptions( [
                        {
                            label: '🏠 Canal Logs Admin',
                            value: 'log_channel',
                            description: 'Définir le canal pour les logs'
                        },
                        {
                            label: '📊 Niveau de Détail',
                            value: 'log_level',
                            description: 'Basic, Detailed ou Full'
                        },
                        {
                            label: '🖼️ Images dans Logs',
                            value: 'log_images',
                            description: 'Activer/désactiver les images'
                        },
                        {
                            label: '🔔 Ping Rôles Logs',
                            value: 'ping_roles_logs',
                            description: 'Mentionner des rôles dans les logs'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Configuration des threads automatiques
     */
    async showAutoThreadConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('🧵 Configuration Auto-Thread')
            .setDescription('Configuration des threads automatiques pour les confessions')
            .addFields([
                { name: '🎯 Activation', value: 'Activer/désactiver le système', inline: true },
                { name: '📝 Nom des threads', value: 'Format du nom des threads', inline: true },
                { name: '📦 Archivage auto', value: 'Durée avant archivage', inline: true },
                { name: '🐌 Mode lent', value: 'Délai entre les messages', inline: true }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    
                    .setCustomId( 'confession_autothread_options',
                    .setPlaceholder( 'Choisissez une option...',
                    .addOptions( [
                        {
                            label: '🎯 Activer/Désactiver',
                            value: 'toggle_autothread',
                            description: 'Activer ou désactiver les threads auto'
                        },
                        {
                            label: '📝 Format Nom Thread',
                            value: 'thread_name',
                            description: 'Personnaliser le nom des threads'
                        },
                        {
                            label: '📦 Durée Archivage',
                            value: 'archive_duration',
                            description: '60min, 24h, 3j, 7j'
                        },
                        {
                            label: '🐌 Mode Lent',
                            value: 'slowmode',
                            description: 'Délai entre messages (0-21600s)'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Ajouter des canaux de confession
     */
    async handleChannelAdd(interaction) {
        const guildId = interaction.guild.id;
        const selectedChannels = interaction.values;
        
        const config = await this.dataManager.loadData('confessions.json', {});
        if (!config[guildId]) config[guildId] = { channels: [] };

        const addedChannels = [];
        for (const channelId of selectedChannels) {
            if (!config[guildId].channels.includes(channelId)) {
                config[guildId].channels.push(channelId);
                addedChannels.push(`<#${channelId}>`);
            }
        }

        await this.dataManager.saveData('confessions.json', config);

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('✅ Canaux Ajoutés')
            .setDescription(`${addedChannels.length} canal(aux) ajouté(s) :\n${addedChannels.join('\n')}`)
            .addFields([
                {
                    name: '📊 Total',
                    value: `${config[guildId].channels.length} canal(aux) configuré(s)`,
                    inline: true
                }
            ]);

        await interaction.update({ embeds: [embed], components: [] });

        // Retour au menu des canaux après 3 secondes
        setTimeout(async () => {
            await this.showChannelsConfig(interaction);
        }, 3000);
    }

    /**
     * Supprimer un canal de confession
     */
    async handleChannelRemove(interaction) {
        const guildId = interaction.guild.id;
        const channelId = interaction.values[0];

        if (channelId === 'none') {
            await interaction.reply({ content: '❌ Aucun canal à supprimer', flags: 64 });
            return;
        }

        const config = await this.dataManager.loadData('confessions.json', {});
        if (config[guildId] && config[guildId].channels) {
            config[guildId].channels = config[guildId].channels.filter(id => id !== channelId);
            await this.dataManager.saveData('confessions.json', config);
        }

        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🗑️ Canal Supprimé')
            .setDescription(`Canal <#${channelId}> retiré de la configuration`)
            .addFields([
                {
                    name: '📊 Restant',
                    value: `${config[guildId]?.channels?.length || 0} canal(aux)`,
                    inline: true
                }
            ]);

        await interaction.update({ embeds: [embed], components: [] });

        // Retour au menu des canaux après 2 secondes
        setTimeout(async () => {
            await this.showChannelsConfig(interaction);
        }, 2000);
    }
}

module.exports = ConfessionConfigHandler;