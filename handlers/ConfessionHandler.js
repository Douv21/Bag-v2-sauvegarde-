const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder } = require('discord.js');

class ConfessionHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    async handleConfessionMainConfig(interaction) {
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

    async showMainConfigMenu(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        // Récupérer les données de configuration actuelles
        const confessionConfig = config.confessions?.[guildId] || {};
        const channels = confessionConfig.channels || [];
        const logChannel = confessionConfig.logChannel;
        const autoThread = confessionConfig.autoThread || false;
        const logLevel = confessionConfig.logLevel || 'basic';
        const logImages = confessionConfig.logImages !== false;
        const logPingRoles = confessionConfig.logPingRoles || [];
        const confessionPingRoles = confessionConfig.confessionPingRoles || [];

        const embed = new EmbedBuilder()
            .setColor('#2196F3')
            .setTitle('💭 Configuration Confessions')
            .setDescription('Configuration complète du système de confessions anonymes')
            .addFields([
                { 
                    name: '📝 Canaux Confessions', 
                    value: channels.length > 0 ? 
                        `✅ ${channels.length} canal(aux) configuré(s)` : 
                        '❌ Aucun canal configuré', 
                    inline: true 
                },
                { 
                    name: '📋 Logs Admin', 
                    value: logChannel ? 
                        `✅ Canal configuré\n📊 Niveau: ${logLevel}\n🖼️ Images: ${logImages ? 'Oui' : 'Non'}\n🔔 Ping: ${logPingRoles.length} rôle(s)` : 
                        '❌ Non configuré', 
                    inline: true 
                },
                { 
                    name: '🧵 Auto-Thread', 
                    value: autoThread ? 
                        `✅ Activé\n🏷️ Format: ${confessionConfig.threadName || 'Confession #{number}'}\n📦 Archive: ${confessionConfig.archiveTime || 1440}min` : 
                        '❌ Désactivé', 
                    inline: true 
                },
                {
                    name: '📢 Notifications',
                    value: `🔔 Ping logs: ${logPingRoles.length} rôle(s)\n📢 Ping confessions: ${confessionPingRoles.length} rôle(s)`,
                    inline: false
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_config_main')
            .setPlaceholder('💭 Choisissez une section à configurer')
            .addOptions([
                {
                    label: '📝 Gérer les Canaux',
                    value: 'manage_channels',
                    description: `${channels.length} canal(aux) - Ajouter/retirer canaux`
                },
                {
                    label: '📊 Configuration Logs Admin',
                    value: 'admin_logs',
                    description: logChannel ? `Configuré - ${logLevel}` : 'Non configuré'
                },
                {
                    label: '🧵 Auto-Thread Confessions',
                    value: 'autothread_config',
                    description: autoThread ? 'Activé - Configurer' : 'Désactivé - Activer'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];
        
        await interaction.update({
            embeds: [embed],
            components: components
        });
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
            .setCustomId('confession_autothread_options')
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
                },
                {
                    label: '🔙 Retour Menu Principal',
                    description: 'Retour au menu principal des confessions',
                    value: 'back_main_confession',
                    emoji: '🔙'
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
            .setCustomId('confession_logs_options')
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
                },
                {
                    label: '🔙 Retour Menu Principal',
                    description: 'Retour au menu principal des confessions',
                    value: 'back_main_confession',
                    emoji: '🔙'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async handleConfessionChannelsConfig(interaction) {
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
            await this.showRemoveChannelMenu(interaction);
        } else if (value === 'list_channels') {
            await this.showChannelsList(interaction);
        }
    }

    async handleConfessionAddChannel(interaction) {
        const selectedChannelId = interaction.values[0];
        const guildId = interaction.guild.id;
        const channel = interaction.guild.channels.cache.get(selectedChannelId);

        if (!channel) {
            await interaction.reply({ 
                content: '❌ Canal introuvable', 
                flags: 64 
            });
            return;
        }

        // Charger la configuration
        const config = await this.dataManager.getData('config');
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

        // Vérifier si le canal est déjà ajouté
        if (config.confessions[guildId].channels.includes(selectedChannelId)) {
            await interaction.reply({ 
                content: `❌ Le canal ${channel.name} est déjà configuré pour les confessions`, 
                flags: 64 
            });
            return;
        }

        // Ajouter le canal
        config.confessions[guildId].channels.push(selectedChannelId);
        await this.dataManager.saveData('config', config);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Canal Ajouté')
            .setDescription(`Le canal ${channel.name} a été ajouté avec succès aux canaux de confessions`)
            .addFields([
                {
                    name: '📝 Canal Configuré',
                    value: `<#${selectedChannelId}>`,
                    inline: true
                },
                {
                    name: '📊 Total Canaux',
                    value: `${config.confessions[guildId].channels.length} canal(aux)`,
                    inline: true
                }
            ]);

        await interaction.update({
            embeds: [embed],
            components: []
        });
    }

    async handleLogOption(interaction, option) {
        const guildId = interaction.guild.id;
        
        switch (option) {
            case 'log_channel':
                const channelSelect = new ChannelSelectMenuBuilder()
                    .setCustomId('confession_log_channel_select')
                    .setPlaceholder('📝 Sélectionnez le canal pour les logs')
                    .setChannelTypes([0]); // Text channels

                const embed = new EmbedBuilder()
                    .setColor('#2196F3')
                    .setTitle('📝 Sélection Canal Logs')
                    .setDescription('Choisissez le canal où seront envoyés les logs des confessions');

                await interaction.update({
                    embeds: [embed],
                    components: [new ActionRowBuilder().addComponents(channelSelect)]
                });
                break;
                
            case 'log_level':
                await this.showLogLevelMenu(interaction);
                break;
                
            case 'log_images':
                const config = await this.dataManager.getData('config');
                if (!config.confessions) config.confessions = {};
                if (!config.confessions[guildId]) config.confessions[guildId] = {};
                
                config.confessions[guildId].logImages = !config.confessions[guildId].logImages;
                await this.dataManager.saveData('config', config);
                
                // Retourner au menu logs avec confirmation
                await this.handleLogsConfig(interaction);
                break;
                
            case 'log_ping_roles':
                await this.showLogPingRolesMenu(interaction);
                break;
                
            case 'confession_ping_roles':
                await this.showConfessionPingRolesMenu(interaction);
                break;
                
            default:
                await interaction.reply({ content: '🚧 Fonctionnalité en développement', flags: 64 });
        }
    }

    async handleAutoThreadOption(interaction, option) {
        const guildId = interaction.guild.id;
        
        switch (option) {
            case 'toggle_autothread':
                const config = await this.dataManager.getData('config');
                if (!config.confessions) config.confessions = {};
                if (!config.confessions[guildId]) config.confessions[guildId] = {};
                
                config.confessions[guildId].autoThread = !config.confessions[guildId].autoThread;
                await this.dataManager.saveData('config', config);
                
                // Retourner au menu auto-thread avec confirmation
                await this.handleAutoThreadConfig(interaction);
                break;
                
            case 'thread_name':
                await this.showThreadNameConfig(interaction);
                break;
                
            case 'archive_time':
                await this.showArchiveTimeMenu(interaction);
                break;
                
            default:
                await interaction.reply({ content: '🚧 Fonctionnalité en développement', flags: 64 });
        }
    }

    async showLogPingRolesMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#2196F3')
            .setTitle('🔔 Rôles Ping Logs Admin')
            .setDescription('Sélectionnez les rôles à mentionner dans les logs admin des confessions');

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('confession_log_ping_roles_select')
            .setPlaceholder('🔔 Sélectionnez les rôles à ping dans les logs')
            .setMinValues(0)
            .setMaxValues(5);

        const backMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_logs_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔙 Retour Logs Admin', value: 'back_logs', description: 'Retour au menu logs', emoji: '🔙' }
            ]);

        const rows = [
            new ActionRowBuilder().addComponents(roleSelect),
            new ActionRowBuilder().addComponents(backMenu)
        ];

        await interaction.update({
            embeds: [embed],
            components: rows
        });
    }

    async showConfessionPingRolesMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#2196F3')
            .setTitle('📢 Rôles Ping Confessions')
            .setDescription('Sélectionnez les rôles à mentionner lors de nouvelles confessions');

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('confession_ping_roles_select')
            .setPlaceholder('📢 Sélectionnez les rôles à ping sur confessions')
            .setMinValues(0)
            .setMaxValues(5);

        const backMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_logs_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔙 Retour Logs Admin', value: 'back_logs', description: 'Retour au menu logs', emoji: '🔙' }
            ]);

        const rows = [
            new ActionRowBuilder().addComponents(roleSelect),
            new ActionRowBuilder().addComponents(backMenu)
        ];

        await interaction.update({
            embeds: [embed],
            components: rows
        });
    }

    async showRemoveChannelMenu(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (!config.confessions?.[guildId]?.channels?.length) {
            await interaction.update({
                embeds: [new EmbedBuilder()
                    .setColor('#ff9800')
                    .setTitle('⚠️ Aucun Canal Configuré')
                    .setDescription('Aucun canal de confessions n\'est actuellement configuré sur ce serveur.')],
                components: []
            });
            return;
        }

        const options = config.confessions[guildId].channels.map(channelId => {
            const channel = interaction.guild.channels.cache.get(channelId);
            return {
                label: channel?.name || 'Canal supprimé',
                value: channelId,
                description: `Retirer ce canal des confessions`,
                emoji: '🗑️'
            };
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_remove_channel_select')
            .setPlaceholder('🗑️ Sélectionnez le canal à retirer')
            .addOptions(options);

        const backMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_channels_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔙 Retour Gestion Canaux', value: 'back_channels', description: 'Retour au menu canaux', emoji: '🔙' }
            ]);

        const rows = [
            new ActionRowBuilder().addComponents(selectMenu),
            new ActionRowBuilder().addComponents(backMenu)
        ];

        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor('#f44336')
                .setTitle('🗑️ Retirer Canal Confession')
                .setDescription('Sélectionnez le canal à retirer de la configuration des confessions')],
            components: rows
        });
    }

    async showChannelsList(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (!config.confessions?.[guildId]?.channels?.length) {
            await interaction.update({
                embeds: [new EmbedBuilder()
                    .setColor('#ff9800')
                    .setTitle('📋 Aucun Canal Configuré')
                    .setDescription('Aucun canal de confessions n\'est actuellement configuré sur ce serveur.')],
                components: []
            });
            return;
        }

        const channelsList = config.confessions[guildId].channels
            .map(channelId => {
                const channel = interaction.guild.channels.cache.get(channelId);
                return channel ? `• <#${channelId}>` : `• Canal supprimé (${channelId})`;
            })
            .join('\n');

        const backMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_channels_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔙 Retour Gestion Canaux', value: 'back_channels', description: 'Retour au menu canaux', emoji: '🔙' }
            ]);

        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor('#2196f3')
                .setTitle('📋 Canaux Confessions Configurés')
                .setDescription(channelsList)
                .addFields([{
                    name: '📊 Total',
                    value: `${config.confessions[guildId].channels.length} canal(aux)`,
                    inline: true
                }])],
            components: [new ActionRowBuilder().addComponents(backMenu)]
        });
    }

    async showLogLevelMenu(interaction) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_log_level_select')
            .setPlaceholder('🔍 Choisissez le niveau de détail')
            .addOptions([
                {
                    label: 'Basique',
                    value: 'basic',
                    description: 'Informations minimales (utilisateur, contenu)',
                    emoji: '📄'
                },
                {
                    label: 'Détaillé',
                    value: 'detailed',
                    description: 'Informations + canal, timestamp',
                    emoji: '📋'
                },
                {
                    label: 'Complet',
                    value: 'full',
                    description: 'Toutes les informations + métadonnées',
                    emoji: '🔍'
                }
            ]);

        const backMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_logs_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔙 Retour Logs Admin', value: 'back_logs', description: 'Retour au menu logs', emoji: '🔙' }
            ]);

        const rows = [
            new ActionRowBuilder().addComponents(selectMenu),
            new ActionRowBuilder().addComponents(backMenu)
        ];

        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor('#2196f3')
                .setTitle('🔍 Niveau de Détail des Logs')
                .setDescription('Choisissez le niveau de détail pour les logs des confessions')],
            components: rows
        });
    }

    async showThreadNameConfig(interaction) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_thread_name_select')
            .setPlaceholder('🏷️ Choisissez le format du nom des threads')
            .addOptions([
                {
                    label: 'Confession #{number}',
                    value: 'Confession #{number}',
                    description: 'Format par défaut avec numérotation',
                    emoji: '🏷️'
                },
                {
                    label: 'Thread Confession #{number}',
                    value: 'Thread Confession #{number}',
                    description: 'Format étendu avec "Thread"',
                    emoji: '📝'
                },
                {
                    label: 'Confession Anonyme #{number}',
                    value: 'Confession Anonyme #{number}',
                    description: 'Format détaillé avec "Anonyme"',
                    emoji: '🔒'
                },
                {
                    label: 'Discussion #{number}',
                    value: 'Discussion #{number}',
                    description: 'Format simple pour discussions',
                    emoji: '💬'
                },
                {
                    label: 'Format personnalisé',
                    value: 'custom_format',
                    description: 'Contactez un admin pour format spécial',
                    emoji: '⚙️'
                }
            ]);

        const backMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_autothread_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔙 Retour Auto-Thread', value: 'back_autothread', description: 'Retour au menu auto-thread', emoji: '🔙' }
            ]);

        const rows = [
            new ActionRowBuilder().addComponents(selectMenu),
            new ActionRowBuilder().addComponents(backMenu)
        ];

        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor('#2196f3')
                .setTitle('🏷️ Format Nom des Threads')
                .setDescription('Choisissez le format pour les noms des threads créés automatiquement')],
            components: rows
        });
    }

    async showArchiveTimeMenu(interaction) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_archive_time_select')
            .setPlaceholder('📦 Choisissez la durée d\'archivage')
            .addOptions([
                {
                    label: '1 heure',
                    value: '60',
                    description: 'Archive après 1 heure d\'inactivité',
                    emoji: '⏰'
                },
                {
                    label: '1 jour',
                    value: '1440',
                    description: 'Archive après 1 jour d\'inactivité',
                    emoji: '📅'
                },
                {
                    label: '3 jours',
                    value: '4320',
                    description: 'Archive après 3 jours d\'inactivité',
                    emoji: '📆'
                },
                {
                    label: '1 semaine',
                    value: '10080',
                    description: 'Archive après 1 semaine d\'inactivité',
                    emoji: '🗓️'
                }
            ]);

        const backMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_autothread_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔙 Retour Auto-Thread', value: 'back_autothread', description: 'Retour au menu auto-thread', emoji: '🔙' }
            ]);

        const rows = [
            new ActionRowBuilder().addComponents(selectMenu),
            new ActionRowBuilder().addComponents(backMenu)
        ];

        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor('#2196f3')
                .setTitle('📦 Durée d\'Archivage des Threads')
                .setDescription('Choisissez après combien de temps les threads sont automatiquement archivés')],
            components: rows
        });
    }

    async handleSpecializedSelector(interaction, selectorType) {
        const guildId = interaction.guild.id;
        const selectedValue = interaction.values[0];

        switch (selectorType) {
            case 'confession_log_channel_select':
                await this.saveLogChannel(interaction, selectedValue);
                break;
                
            case 'confession_log_level_select':
                await this.saveLogLevel(interaction, selectedValue);
                break;
                
            case 'confession_archive_time_select':
                await this.saveArchiveTime(interaction, selectedValue);
                break;
                
            case 'confession_thread_name_select':
                await this.saveThreadName(interaction, selectedValue);
                break;
                
            case 'confession_remove_channel_select':
                await this.removeChannel(interaction, selectedValue);
                break;
                
            case 'confession_log_ping_roles_select':
                await this.saveLogPingRoles(interaction, interaction.values);
                break;
                
            case 'confession_ping_roles_select':
                await this.saveConfessionPingRoles(interaction, interaction.values);
                break;
                
            case 'confession_log_level_select':
                await this.saveLogLevel(interaction, selectedValue);
                break;
                
            case 'confession_archive_time_select':
                await this.saveArchiveTime(interaction, selectedValue);
                break;
                
            case 'confession_remove_channel_select':
                await this.removeConfessionChannel(interaction, selectedValue);
                break;
                
            default:
                await interaction.reply({ content: '❌ Sélecteur non reconnu', flags: 64 });
        }
    }

    async saveLogChannel(interaction, channelId) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) config.confessions[guildId] = {};
        
        config.confessions[guildId].logChannel = channelId;
        await this.dataManager.saveData('config', config);
        
        const channel = interaction.guild.channels.cache.get(channelId);
        await this.handleLogsConfig(interaction);
    }

    async saveLogLevel(interaction, level) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) config.confessions[guildId] = {};
        
        config.confessions[guildId].logLevel = level;
        await this.dataManager.saveData('config', config);
        
        await this.handleLogsConfig(interaction);
    }

    async saveArchiveTime(interaction, minutes) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) config.confessions[guildId] = {};
        
        config.confessions[guildId].archiveTime = parseInt(minutes);
        await this.dataManager.saveData('config', config);
        
        await this.handleAutoThreadConfig(interaction);
    }

    async saveThreadName(interaction, format) {
        const guildId = interaction.guild.id;
        
        if (format === 'custom_format') {
            await interaction.update({
                embeds: [new EmbedBuilder()
                    .setColor('#ff9800')
                    .setTitle('⚙️ Format Personnalisé')
                    .setDescription('Pour un format personnalisé, contactez un administrateur.\n\nVous pouvez utiliser :\n• `#{number}` pour la numérotation\n• `#{user}` pour le nom d\'utilisateur\n• `#{date}` pour la date')],
                components: []
            });
            return;
        }
        
        const config = await this.dataManager.getData('config');
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) config.confessions[guildId] = {};
        
        config.confessions[guildId].threadName = format;
        await this.dataManager.saveData('config', config);
        
        await this.handleAutoThreadConfig(interaction);
    }

    async removeChannel(interaction, channelId) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (config.confessions?.[guildId]?.channels) {
            config.confessions[guildId].channels = config.confessions[guildId].channels.filter(id => id !== channelId);
            await this.dataManager.saveData('config', config);
            
            const channel = interaction.guild.channels.cache.get(channelId);
            await interaction.update({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🗑️ Canal Retiré')
                    .setDescription(`Le canal ${channel?.name || 'supprimé'} a été retiré des confessions`)],
                components: []
            });
        }
    }

    async saveLogPingRoles(interaction, roleIds) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) config.confessions[guildId] = {};
        
        config.confessions[guildId].logPingRoles = roleIds;
        await this.dataManager.saveData('config', config);
        
        const roleNames = roleIds.map(roleId => {
            const role = interaction.guild.roles.cache.get(roleId);
            return role ? role.name : 'Rôle supprimé';
        }).join(', ');
        
        await this.handleLogsConfig(interaction);
    }

    async saveConfessionPingRoles(interaction, roleIds) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) config.confessions[guildId] = {};
        
        config.confessions[guildId].confessionPingRoles = roleIds;
        await this.dataManager.saveData('config', config);
        
        const roleNames = roleIds.map(roleId => {
            const role = interaction.guild.roles.cache.get(roleId);
            return role ? role.name : 'Rôle supprimé';
        }).join(', ');
        
        await this.handleLogsConfig(interaction);
    }

    async saveLogChannel(interaction, channelId) {
        const guildId = interaction.guild.id;
        const channel = interaction.guild.channels.cache.get(channelId);
        
        if (!channel) {
            await interaction.reply({ content: '❌ Canal introuvable', flags: 64 });
            return;
        }

        const config = await this.dataManager.getData('config');
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) config.confessions[guildId] = {};
        
        config.confessions[guildId].logChannel = channelId;
        await this.dataManager.saveData('config', config);

        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Canal Logs Configuré')
                .setDescription(`Canal logs défini sur <#${channelId}>`)],
            components: []
        });
    }

    async saveLogLevel(interaction, level) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) config.confessions[guildId] = {};
        
        config.confessions[guildId].logLevel = level;
        await this.dataManager.saveData('config', config);

        const levelNames = {
            'basic': 'Basique',
            'detailed': 'Détaillé', 
            'full': 'Complet'
        };

        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Niveau de Logs Configuré')
                .setDescription(`Niveau de détail défini sur **${levelNames[level]}**`)],
            components: []
        });
    }

    async saveArchiveTime(interaction, minutes) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (!config.confessions) config.confessions = {};
        if (!config.confessions[guildId]) config.confessions[guildId] = {};
        
        config.confessions[guildId].archiveTime = parseInt(minutes);
        await this.dataManager.saveData('config', config);

        const timeLabels = {
            '60': '1 heure',
            '1440': '1 jour',
            '4320': '3 jours',
            '10080': '1 semaine'
        };

        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Durée d\'Archive Configurée')
                .setDescription(`Les threads seront archivés après **${timeLabels[minutes]}** d'inactivité`)],
            components: []
        });
    }

    async removeConfessionChannel(interaction, channelId) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        if (!config.confessions?.[guildId]?.channels) {
            await interaction.reply({ content: '❌ Aucune configuration trouvée', flags: 64 });
            return;
        }

        const channelIndex = config.confessions[guildId].channels.indexOf(channelId);
        if (channelIndex === -1) {
            await interaction.reply({ content: '❌ Canal non trouvé dans la configuration', flags: 64 });
            return;
        }

        const channel = interaction.guild.channels.cache.get(channelId);
        const channelName = channel?.name || 'Canal supprimé';
        
        config.confessions[guildId].channels.splice(channelIndex, 1);
        await this.dataManager.saveData('config', config);

        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Canal Retiré')
                .setDescription(`Le canal **${channelName}** a été retiré des confessions`)
                .addFields([{
                    name: '📊 Canaux Restants',
                    value: `${config.confessions[guildId].channels.length} canal(aux)`,
                    inline: true
                }])],
            components: []
        });
    }
}

module.exports = ConfessionHandler;