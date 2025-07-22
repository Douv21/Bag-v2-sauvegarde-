const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder } = require('discord.js');

class ConfessionHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    async handleConfessionMainConfig(interaction) {
        const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
        
        // Si c'est la première fois (pas de values), afficher le menu principal
        if (!interaction.values || interaction.values.length === 0) {
            return await this.showMainConfigMenu(interaction);
        }
        
        const value = interaction.values[0];
        
        if (value === 'manage_channels') {
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('💭 Configuration Canaux Confessions')
                .setDescription('Gérez les canaux où les confessions sont envoyées');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confession_channel_config')
                .setPlaceholder('💭 Configurer les canaux confessions')
                .addOptions([
                    {
                        label: 'Ajouter Canal',
                        description: 'Ajouter un nouveau canal de confessions',
                        value: 'add_channel',
                        emoji: '➕'
                    },
                    {
                        label: 'Retirer Canal',
                        description: 'Retirer un canal de confessions',
                        value: 'remove_channel',
                        emoji: '➖'
                    },
                    {
                        label: 'Voir Canaux',
                        description: 'Afficher tous les canaux configurés',
                        value: 'list_channels',
                        emoji: '📋'
                    }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.update({
                embeds: [embed],
                components: components
            });

        } else if (value === 'admin_logs') {
            return await this.handleLogsConfig(interaction);
            
        } else if (value === 'autothread_config') {
            return await this.handleAutoThreadConfig(interaction);
        } else {
            await interaction.reply({ content: '❌ Option non reconnue', flags: 64 });
        }
    }

    async handleAutoThreadConfig(interaction) {
        const config = await this.dataManager.getData('config');
        const guildId = interaction.guild.id;
        
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}',
                archiveTime: 1440
            };
        }

        const currentStatus = config.confessions[guildId].autoThread ? '🟢 Activé' : '🔴 Désactivé';
        const threadFormat = config.confessions[guildId].threadName || 'Confession #{number}';
        const archiveTime = config.confessions[guildId].archiveTime || 1440;
        
        const archiveDurations = {
            60: '1 heure',
            1440: '1 jour',  
            4320: '3 jours',
            10080: '7 jours'
        };

        const embed = new EmbedBuilder()
            .setColor('#2196F3')
            .setTitle('🧵 Configuration Auto-Thread Confessions')
            .setDescription('Configurez la création automatique de threads pour les confessions')
            .addFields([
                {
                    name: '📊 Status Actuel',
                    value: `**Auto-Thread :** ${currentStatus}\n**Format :** \`${threadFormat}\`\n**Archive :** ${archiveDurations[archiveTime] || `${archiveTime} minutes`}`,
                    inline: false
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_autothread_config')
            .setPlaceholder('🧵 Configurer auto-thread confessions')
            .addOptions([
                {
                    label: 'Activer/Désactiver',
                    description: `Actuellement ${config.confessions[guildId].autoThread ? 'activé' : 'désactivé'}`,
                    value: 'toggle_autothread',
                    emoji: config.confessions[guildId].autoThread ? '🔴' : '🟢'
                },
                {
                    label: 'Format Nom Threads',
                    description: `Actuel: ${threadFormat.substring(0, 40)}${threadFormat.length > 40 ? '...' : ''}`,
                    value: 'thread_name',
                    emoji: '🏷️'
                },
                {
                    label: 'Durée Archive',
                    description: `Actuellement: ${archiveDurations[archiveTime] || `${archiveTime}min`}`,
                    value: 'archive_time',
                    emoji: '📦'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async handleLogsConfig(interaction) {
            const config = await this.dataManager.getData('config');
            const guildId = interaction.guild.id;
            
            if (!config.confessions) config.confessions = {};
            if (!config.confessions[guildId]) {
                config.confessions[guildId] = {
                    channels: [],
                    logChannel: null,
                    autoThread: false,
                    threadName: 'Confession #{number}',
                    logLevel: 'basic',
                    logImages: true
                };
            }

            const logChannel = config.confessions[guildId].logChannel;
            const logLevel = config.confessions[guildId].logLevel || 'basic';
            const logImages = config.confessions[guildId].logImages !== false;
            
            const levels = {
                'basic': '📄 Basique',
                'detailed': '📋 Détaillé', 
                'full': '🔍 Complet'
            };

            const channelName = logChannel ? 
                (interaction.guild.channels.cache.get(logChannel)?.name || 'Canal supprimé') : 
                'Aucun configuré';

            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('📊 Configuration Logs Admin')
                .setDescription('Configurez les logs détaillés pour les confessions')
                .addFields([
                    {
                        name: '📊 Status Actuel',
                        value: `**Canal :** ${channelName}\n**Niveau :** ${levels[logLevel]}\n**Images :** ${logImages ? '🟢 Incluses' : '🔴 Masquées'}`,
                        inline: false
                    }
                ]);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confession_logs_config')
                .setPlaceholder('📊 Configurer logs admin')
                .addOptions([
                    {
                        label: 'Canal Logs',
                        description: `Actuel: ${channelName}`,
                        value: 'log_channel',
                        emoji: '📝'
                    },
                    {
                        label: 'Niveau Détail',
                        description: `Actuel: ${levels[logLevel]}`,
                        value: 'log_level',
                        emoji: '🔍'
                    },
                    {
                        label: 'Images',
                        description: `Actuellement ${logImages ? 'incluses' : 'masquées'}`,
                        value: 'log_images',
                        emoji: logImages ? '🔴' : '🟢'
                    },
                    {
                        label: 'Ping Rôles Logs',
                        description: 'Rôles à mentionner dans les logs',
                        value: 'log_ping_roles',
                        emoji: '🔔'
                    },
                    {
                        label: 'Ping Rôles Confessions',
                        description: 'Rôles à mentionner sur nouvelles confessions',
                        value: 'confession_ping_roles',
                        emoji: '📢'
                    }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.update({
                embeds: [embed],
                components: components
            });
        }
    }

    async handleConfessionChannelsConfig(interaction) {
        const { ChannelSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
        const value = interaction.values[0];
        const guildId = interaction.guild.id;
        
        if (value === 'add_channel') {
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('➕ Ajouter Canal Confession')
                .setDescription('Sélectionnez le canal à ajouter pour les confessions');

            const channelSelect = new ChannelSelectMenuBuilder()
                .setCustomId('confession_add_channel')
                .setPlaceholder('📝 Sélectionnez le canal à ajouter')
                .setChannelTypes([0]); // Text channels

            const components = [new ActionRowBuilder().addComponents(channelSelect)];

            await interaction.update({
                embeds: [embed],
                components: components
            });
            
        } else if (value === 'remove_channel') {
            const config = await this.dataManager.getData('config');
            const channels = config.confessions?.[guildId]?.channels || [];
            
            if (channels.length === 0) {
                await interaction.update({
                    content: '❌ Aucun canal de confession configuré.',
                    components: []
                });
                return;
            }
            
            const embed = new EmbedBuilder()
                .setColor('#ff5722')
                .setTitle('➖ Retirer Canal Confession')
                .setDescription('Sélectionnez le canal à retirer');

            const channelSelect = new ChannelSelectMenuBuilder()
                .setCustomId('confession_remove_channel')
                .setPlaceholder('🗑️ Sélectionnez le canal à retirer')
                .setChannelTypes([0]);

            const components = [new ActionRowBuilder().addComponents(channelSelect)];

            await interaction.update({
                embeds: [embed],
                components: components
            });
            
        } else if (value === 'list_channels') {
            const config = await this.dataManager.getData('config');
            const channels = config.confessions?.[guildId]?.channels || [];
            
            if (channels.length === 0) {
                await interaction.update({
                    content: '📋 Aucun canal de confession configuré.',
                    components: []
                });
                return;
            }
            
            const channelList = channels.map(channelId => {
                const channel = interaction.guild.channels.cache.get(channelId);
                return channel ? `• ${channel.name}` : `• Canal supprimé (${channelId})`;
            }).join('\n');
            
            const embed = new EmbedBuilder()
                .setColor('#4caf50')
                .setTitle('📋 Canaux de Confession Configurés')
                .setDescription(channelList);
            
            await interaction.update({
                embeds: [embed],
                components: []
            });
        }
    }

    async handleConfessionAutothreadConfig(interaction) {
        const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
        const value = interaction.values[0];
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}',
                archiveTime: 1440
            };
        }
        
        if (value === 'toggle_autothread') {
            config.confessions[guildId].autoThread = !config.confessions[guildId].autoThread;
            await this.dataManager.saveData('config', config);
            
            const status = config.confessions[guildId].autoThread ? '🟢 Activé' : '🔴 Désactivé';
            await interaction.update({
                content: `🧵 Auto-Thread Confessions : ${status}`,
                components: []
            });
            
        } else if (value === 'thread_name') {
            await interaction.update({
                content: '🏷️ Format actuel: `' + (config.confessions[guildId].threadName || 'Confession #{number}') + '`\n\n**Variables disponibles:**\n• `{number}` - Numéro de confession\n• `{user}` - Nom utilisateur\n• `{date}` - Date\n\n*Cette fonctionnalité nécessite un modal personnalisé.*',
                components: []
            });
            
        } else if (value === 'archive_time') {
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('📦 Durée Archive Threads')
                .setDescription('Choisissez après combien de temps archiver les threads');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confession_archive_time')
                .setPlaceholder('📦 Choisir durée archive')
                .addOptions([
                    { label: '1 heure', value: '60', emoji: '⏰' },
                    { label: '1 jour', value: '1440', emoji: '📅' },
                    { label: '3 jours', value: '4320', emoji: '📆' },
                    { label: '7 jours', value: '10080', emoji: '🗓️' }
                ]);

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            await interaction.update({
                embeds: [embed],
                components: components
            });
        }
    }

    async handleConfessionAddChannel(interaction) {
        const channelId = interaction.values[0];
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}'
            };
        }
        
        const channels = config.confessions[guildId].channels || [];
        if (!channels.includes(channelId)) {
            channels.push(channelId);
            config.confessions[guildId].channels = channels;
            await this.dataManager.saveData('config', config);
        }
        
        const channel = interaction.guild.channels.cache.get(channelId);
        await interaction.update({
            content: `✅ Canal ajouté: ${channel ? channel.name : 'Canal inconnu'}`,
            components: []
        });
    }

    async handleConfessionRemoveChannel(interaction) {
        const channelId = interaction.values[0];
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (config.confessions && config.confessions[guildId]) {
            const channels = config.confessions[guildId].channels || [];
            const index = channels.indexOf(channelId);
            if (index > -1) {
                channels.splice(index, 1);
                config.confessions[guildId].channels = channels;
                await this.dataManager.saveData('config', config);
            }
        }
        
        const channel = interaction.guild.channels.cache.get(channelId);
        await interaction.update({
            content: `✅ Canal retiré: ${channel ? channel.name : 'Canal inconnu'}`,
            components: []
        });
    }

    async handleConfessionArchiveTime(interaction) {
        const archiveTime = parseInt(interaction.values[0]);
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) {
            config.confessions[guildId] = {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}',
                archiveTime: 1440
            };
        }
        
        config.confessions[guildId].archiveTime = archiveTime;
        await this.dataManager.saveData('config', config);
        
        const durations = {
            60: '1 heure',
            1440: '1 jour',
            4320: '3 jours',
            10080: '7 jours'
        };
        
        await interaction.update({
            content: `✅ Durée d'archive configurée: ${durations[archiveTime] || `${archiveTime} minutes`}`,
            components: []
        });
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

        } else if (value === 'log_ping_roles') {
            const { EmbedBuilder, ActionRowBuilder, RoleSelectMenuBuilder } = require('discord.js');
            
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('🔔 Ping Rôles Logs')
                .setDescription('Sélectionnez les rôles à mentionner dans les logs admin');

            const roleSelect = new RoleSelectMenuBuilder()
                .setCustomId('confession_log_ping_roles')
                .setPlaceholder('🔔 Sélectionnez les rôles à ping')
                .setMaxValues(5);

            const components = [new ActionRowBuilder().addComponents(roleSelect)];

            await interaction.update({
                embeds: [embed],
                components: components
            });

        } else if (value === 'confession_ping_roles') {
            const { EmbedBuilder, ActionRowBuilder, RoleSelectMenuBuilder } = require('discord.js');
            
            const embed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('📢 Ping Rôles Confessions')
                .setDescription('Sélectionnez les rôles à mentionner lors de nouvelles confessions');

            const roleSelect = new RoleSelectMenuBuilder()
                .setCustomId('confession_ping_roles')
                .setPlaceholder('📢 Sélectionnez les rôles à ping')
                .setMaxValues(5);

            const components = [new ActionRowBuilder().addComponents(roleSelect)];

            await interaction.update({
                embeds: [embed],
                components: components
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

    async handleConfessionLogPingRoles(interaction) {
        const roleIds = interaction.values;
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

        config.confessions[guildId].logPingRoles = roleIds;
        await this.dataManager.saveData('config', config);

        const roles = roleIds.map(id => `<@&${id}>`).join(', ');
        await interaction.update({
            content: `✅ Rôles ping logs configurés: ${roles || 'Aucun'}`,
            components: []
        });
    }

    async handleConfessionPingRoles(interaction) {
        const roleIds = interaction.values;
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

        config.confessions[guildId].confessionPingRoles = roleIds;
        await this.dataManager.saveData('config', config);

        const roles = roleIds.map(id => `<@&${id}>`).join(', ');
        await interaction.update({
            content: `✅ Rôles ping confessions configurés: ${roles || 'Aucun'}`,
            components: []
        });
    }
    // Méthodes d'alias pour compatibilité MainRouterHandler
    async handleChannelAdd(interaction) {
        const { ChannelSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor('#2196F3')
            .setTitle('➕ Ajouter Canal Confession')
            .setDescription('Sélectionnez le canal à ajouter pour les confessions');

        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('confession_add_channel')
            .setPlaceholder('📝 Sélectionnez le canal à ajouter')
            .setChannelTypes([0]); // Text channels

        const components = [new ActionRowBuilder().addComponents(channelSelect)];

        await interaction.reply({
            embeds: [embed],
            components: components,
            flags: 64
        });
    }

    async handleChannelConfigure(interaction) {
        await interaction.reply({ content: '🚧 Configuration canal confession en développement', flags: 64 });
    }

    async handleLogsOption(interaction) {
        await interaction.reply({ content: '🚧 Option logs en développement', flags: 64 });
    }

    async handleAutothreadOption(interaction) {
        await interaction.reply({ content: '🚧 Option autothread en développement', flags: 64 });
    }
}

module.exports = ConfessionHandler;