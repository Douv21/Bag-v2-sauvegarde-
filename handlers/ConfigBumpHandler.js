/**
 * CONFIG BUMP HANDLER
 * Gestionnaire des interactions pour le menu centralisé config-bump
 */

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

class ConfigBumpHandler {
    constructor(bumpManager) {
        this.bumpManager = bumpManager;
        this.tempConfigs = new Map(); // Stockage temporaire des configurations
    }

    /**
     * Gère toutes les interactions du menu config-bump
     */
    async handleInteraction(interaction) {
        if (!interaction.customId.startsWith('config_bump_')) return false;

        try {
            // Vérifier les permissions
            if (!interaction.member.permissions.has('ManageGuild')) {
                return await interaction.reply({
                    content: '❌ Vous devez avoir la permission "Gérer le serveur" pour utiliser cette fonctionnalité.',
                    ephemeral: true
                });
            }

            const customId = interaction.customId;
            const guildId = interaction.guild.id;

            // Gestion des différentes interactions
            if (interaction.isStringSelectMenu()) {
                await interaction.deferUpdate();
                
                switch (customId) {
                    case 'config_bump_main_menu':
                        await this.handleMainMenuSelect(interaction);
                        break;
                    case 'config_bump_general_platforms':
                        await this.handleGeneralPlatformsSelect(interaction);
                        break;
                    case 'config_bump_nsfw_platforms':
                        await this.handleNSFWPlatformsSelect(interaction);
                        break;
                    case 'config_bump_auto_interval':
                        await this.handleAutoIntervalSelect(interaction);
                        break;
                    case 'config_bump_auto_platforms':
                        await this.handleAutoPlatformsSelect(interaction);
                        break;
                    default:
                        return false;
                }
            } else if (interaction.isButton()) {
                await interaction.deferUpdate();
                
                switch (customId) {
                    case 'config_bump_back':
                        await this.showMainMenu(interaction);
                        break;
                    case 'config_bump_save':
                        await this.saveConfiguration(interaction);
                        break;
                    case 'config_bump_test':
                        await this.handleTestBump(interaction);
                        break;
                    case 'config_bump_status':
                        await this.showDetailedStatus(interaction);
                        break;
                    case 'config_bump_export':
                        await this.exportConfiguration(interaction);
                        break;
                    case 'config_bump_auto_enable':
                        await this.toggleAutoBump(interaction, true);
                        break;
                    case 'config_bump_auto_disable':
                        await this.toggleAutoBump(interaction, false);
                        break;
                    default:
                        return false;
                }
            } else if (interaction.isModalSubmit()) {
                await interaction.deferUpdate();
                
                switch (customId) {
                    case 'config_bump_custom_message_modal':
                        await this.handleCustomMessageModal(interaction);
                        break;
                    default:
                        return false;
                }
            }

            return true;

        } catch (error) {
            console.error('❌ Error in ConfigBumpHandler:', error);
            
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ Une erreur est survenue lors du traitement de la configuration.',
                        components: []
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors du traitement de la configuration.',
                        ephemeral: true
                    });
                }
            } catch (e) {
                console.error('❌ Error sending error message:', e);
            }

            return true;
        }
    }

    /**
     * Gestion du menu principal
     */
    async handleMainMenuSelect(interaction) {
        const selectedValue = interaction.values[0];
        const config = await this.bumpManager.getBumpConfig(interaction.guild.id);

        switch (selectedValue) {
            case 'general_platforms':
                await this.showGeneralPlatformsConfig(interaction, config);
                break;
            case 'nsfw_platforms':
                await this.showNSFWPlatformsConfig(interaction, config);
                break;
            case 'auto_bump':
                await this.showAutoBumpConfig(interaction, config);
                break;
            case 'notification_channel':
                await this.showChannelConfig(interaction, config);
                break;
            case 'custom_message':
                await this.showCustomMessageConfig(interaction, config);
                break;
            case 'auto_reminders':
                await this.showRemindersConfig(interaction, config);
                break;
        }
    }

    /**
     * Configuration des plateformes générales
     */
    async showGeneralPlatformsConfig(interaction, config) {
        const embed = new EmbedBuilder()
            .setTitle('🌐 Plateformes Générales')
            .setDescription('Sélectionnez les plateformes générales à activer pour le bump')
            .setColor('#5865F2');

        const generalPlatforms = this.bumpManager.getPlatformsByCategory('general');
        const options = generalPlatforms.map(platform => {
            const platformInfo = this.bumpManager.platforms[platform];
            const isEnabled = config.enabledPlatforms.includes(platform);
            
            return {
                label: platformInfo.name,
                value: platform,
                description: `Cooldown: ${platformInfo.cooldown / (1000 * 60 * 60)}h ${isEnabled ? '• ACTIVÉ' : ''}`,
                emoji: platformInfo.emoji,
                default: isEnabled
            };
        });

        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('config_bump_general_platforms')
                    .setPlaceholder('Sélectionnez les plateformes générales')
                    .setMinValues(0)
                    .setMaxValues(options.length)
                    .addOptions(options)
            );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_bump_save')
                    .setLabel('Sauvegarder')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💾'),
                new ButtonBuilder()
                    .setCustomId('config_bump_back')
                    .setLabel('Retour')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔙')
            );

        await interaction.editReply({
            embeds: [embed],
            components: [selectMenu, buttons]
        });
    }

    /**
     * Configuration des plateformes NSFW
     */
    async showNSFWPlatformsConfig(interaction, config) {
        const hasNSFWChannels = interaction.guild.channels.cache.some(channel => channel.nsfw);
        
        if (!hasNSFWChannels) {
            const embed = new EmbedBuilder()
                .setTitle('🔞 Plateformes NSFW Non Disponibles')
                .setDescription('Ce serveur ne possède aucun canal NSFW. Les plateformes NSFW ne sont pas disponibles.')
                .setColor('#ff6b6b');

            const backButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('config_bump_back')
                        .setLabel('Retour')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🔙')
                );

            return await interaction.editReply({
                embeds: [embed],
                components: [backButton]
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🔞 Plateformes NSFW')
            .setDescription('Sélectionnez les plateformes NSFW à activer pour le bump\n⚠️ Ces plateformes sont réservées aux serveurs avec contenu pour adultes')
            .setColor('#e91e63');

        const nsfwPlatforms = this.bumpManager.getPlatformsByCategory('nsfw');
        const options = nsfwPlatforms.map(platform => {
            const platformInfo = this.bumpManager.platforms[platform];
            const isEnabled = config.enabledNSFWPlatforms?.includes(platform) || false;
            
            return {
                label: platformInfo.name,
                value: platform,
                description: `Cooldown: ${platformInfo.cooldown / (1000 * 60 * 60)}h ${isEnabled ? '• ACTIVÉ' : ''}`,
                emoji: platformInfo.emoji,
                default: isEnabled
            };
        });

        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('config_bump_nsfw_platforms')
                    .setPlaceholder('Sélectionnez les plateformes NSFW')
                    .setMinValues(0)
                    .setMaxValues(options.length)
                    .addOptions(options)
            );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_bump_save')
                    .setLabel('Sauvegarder')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💾'),
                new ButtonBuilder()
                    .setCustomId('config_bump_back')
                    .setLabel('Retour')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔙')
            );

        await interaction.editReply({
            embeds: [embed],
            components: [selectMenu, buttons]
        });
    }

    /**
     * Configuration du bump automatique
     */
    async showAutoBumpConfig(interaction, config) {
        const autoBump = config.autoBump || { enabled: false, interval: 24 * 60 * 60 * 1000, platforms: 'all' };
        
        const embed = new EmbedBuilder()
            .setTitle('🤖 Configuration du Bump Automatique')
            .setDescription('Configurez le système de bump automatique pour promouvoir votre serveur sans intervention manuelle')
            .setColor('#7289da')
            .addFields(
                {
                    name: 'Statut Actuel',
                    value: autoBump.enabled ? '✅ Activé' : '❌ Désactivé',
                    inline: true
                },
                {
                    name: 'Intervalle',
                    value: `${autoBump.interval / (1000 * 60 * 60)}h`,
                    inline: true
                },
                {
                    name: 'Plateformes Cibles',
                    value: this.getAutoPlatformsLabel(autoBump.platforms),
                    inline: true
                }
            );

        if (autoBump.lastRun) {
            embed.addFields({
                name: 'Dernier Bump Auto',
                value: `<t:${Math.floor(autoBump.lastRun / 1000)}:R>`,
                inline: true
            });
        }

        const intervalMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('config_bump_auto_interval')
                    .setPlaceholder('Sélectionnez l\'intervalle de bump automatique')
                    .addOptions([
                        { label: '6 heures', value: '6', description: 'Bump toutes les 6 heures', default: autoBump.interval === 6 * 60 * 60 * 1000 },
                        { label: '12 heures', value: '12', description: 'Bump toutes les 12 heures', default: autoBump.interval === 12 * 60 * 60 * 1000 },
                        { label: '24 heures', value: '24', description: 'Bump toutes les 24 heures (recommandé)', default: autoBump.interval === 24 * 60 * 60 * 1000 },
                        { label: '48 heures', value: '48', description: 'Bump toutes les 48 heures', default: autoBump.interval === 48 * 60 * 60 * 1000 }
                    ])
            );

        const platformsMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('config_bump_auto_platforms')
                    .setPlaceholder('Sélectionnez les plateformes pour l\'auto-bump')
                    .addOptions([
                        { label: 'Toutes les plateformes', value: 'all', description: 'Bumper sur toutes les plateformes activées', default: autoBump.platforms === 'all' },
                        { label: 'Plateformes générales uniquement', value: 'general', description: 'Bumper uniquement sur les plateformes générales', default: autoBump.platforms === 'general' },
                        { label: 'Plateformes NSFW uniquement', value: 'nsfw', description: 'Bumper uniquement sur les plateformes NSFW', default: autoBump.platforms === 'nsfw' }
                    ])
            );

        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_bump_auto_enable')
                    .setLabel('Activer')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅')
                    .setDisabled(autoBump.enabled),
                new ButtonBuilder()
                    .setCustomId('config_bump_auto_disable')
                    .setLabel('Désactiver')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
                    .setDisabled(!autoBump.enabled),
                new ButtonBuilder()
                    .setCustomId('config_bump_save')
                    .setLabel('Sauvegarder')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('💾'),
                new ButtonBuilder()
                    .setCustomId('config_bump_back')
                    .setLabel('Retour')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔙')
            );

        await interaction.editReply({
            embeds: [embed],
            components: [intervalMenu, platformsMenu, actionButtons]
        });
    }

    /**
     * Affiche le menu principal
     */
    async showMainMenu(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.bumpManager.getBumpConfig(guildId);
        
        // Utilise la méthode de la commande config-bump
        const configBumpCommand = require('../commands/config-bump');
        await configBumpCommand.showMainConfigMenu(interaction, this.bumpManager, config);
    }

    /**
     * Gestion de la sélection des plateformes générales
     */
    async handleGeneralPlatformsSelect(interaction) {
        const selectedPlatforms = interaction.values;
        const configKey = `${interaction.guild.id}_${interaction.user.id}`;
        
        // Stocker temporairement la sélection
        let tempConfig = this.tempConfigs.get(configKey) || {};
        tempConfig.enabledPlatforms = selectedPlatforms;
        this.tempConfigs.set(configKey, tempConfig);

        // Mise à jour de l'embed pour refléter la sélection
        const embed = new EmbedBuilder()
            .setTitle('🌐 Plateformes Générales')
            .setDescription('Plateformes sélectionnées. Cliquez sur "Sauvegarder" pour confirmer.')
            .setColor('#ffcc00');

        if (selectedPlatforms.length > 0) {
            const platformsList = selectedPlatforms
                .map(platform => `${this.bumpManager.platforms[platform].emoji} ${this.bumpManager.platforms[platform].name}`)
                .join('\n');
            embed.addFields({ name: 'Plateformes à activer', value: platformsList });
        } else {
            embed.addFields({ name: 'Plateformes à activer', value: 'Aucune' });
        }

        await interaction.editReply({ embeds: [embed] });
    }

    /**
     * Gestion de la sélection des plateformes NSFW
     */
    async handleNSFWPlatformsSelect(interaction) {
        const selectedPlatforms = interaction.values;
        const configKey = `${interaction.guild.id}_${interaction.user.id}`;
        
        // Stocker temporairement la sélection
        let tempConfig = this.tempConfigs.get(configKey) || {};
        tempConfig.enabledNSFWPlatforms = selectedPlatforms;
        this.tempConfigs.set(configKey, tempConfig);

        // Mise à jour de l'embed pour refléter la sélection
        const embed = new EmbedBuilder()
            .setTitle('🔞 Plateformes NSFW')
            .setDescription('Plateformes NSFW sélectionnées. Cliquez sur "Sauvegarder" pour confirmer.')
            .setColor('#e91e63');

        if (selectedPlatforms.length > 0) {
            const platformsList = selectedPlatforms
                .map(platform => `${this.bumpManager.platforms[platform].emoji} ${this.bumpManager.platforms[platform].name}`)
                .join('\n');
            embed.addFields({ name: 'Plateformes NSFW à activer', value: platformsList });
        } else {
            embed.addFields({ name: 'Plateformes NSFW à activer', value: 'Aucune' });
        }

        await interaction.editReply({ embeds: [embed] });
    }

    /**
     * Sauvegarde la configuration
     */
    async saveConfiguration(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const configKey = `${guildId}_${userId}`;

        const tempConfig = this.tempConfigs.get(configKey);
        if (!tempConfig) {
            return await interaction.editReply({
                content: '❌ Aucune modification à sauvegarder.',
                components: []
            });
        }

        // Récupérer la configuration actuelle et la mettre à jour
        const currentConfig = await this.bumpManager.getBumpConfig(guildId);
        const updatedConfig = { ...currentConfig, ...tempConfig };

        const success = await this.bumpManager.updateBumpConfig(guildId, updatedConfig);

        // Nettoyer la configuration temporaire
        this.tempConfigs.delete(configKey);

        if (success) {
            // Gérer l'auto-bump
            if (updatedConfig.autoBump?.enabled) {
                await this.bumpManager.startAutoBump(guildId, interaction.guild);
            } else {
                this.bumpManager.stopAutoBump(guildId);
            }

            const embed = new EmbedBuilder()
                .setTitle('✅ Configuration sauvegardée')
                .setDescription('La configuration du système de bump a été mise à jour avec succès.')
                .setColor('#00ff00');

            const backButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('config_bump_back')
                        .setLabel('Retour au menu')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🔙')
                );

            await interaction.editReply({
                embeds: [embed],
                components: [backButton]
            });
        } else {
            await interaction.editReply({
                content: '❌ Erreur lors de la sauvegarde de la configuration.',
                components: []
            });
        }
    }

    /**
     * Active/désactive l'auto-bump
     */
    async toggleAutoBump(interaction, enable) {
        const guildId = interaction.guild.id;
        const configKey = `${guildId}_${interaction.user.id}`;
        
        let tempConfig = this.tempConfigs.get(configKey) || {};
        if (!tempConfig.autoBump) {
            const currentConfig = await this.bumpManager.getBumpConfig(guildId);
            tempConfig.autoBump = { ...currentConfig.autoBump };
        }
        
        tempConfig.autoBump.enabled = enable;
        this.tempConfigs.set(configKey, tempConfig);

        // Réafficher la configuration auto-bump
        const config = await this.bumpManager.getBumpConfig(guildId);
        config.autoBump = tempConfig.autoBump;
        await this.showAutoBumpConfig(interaction, config);
    }

    /**
     * Helper pour obtenir le label des plateformes auto
     */
    getAutoPlatformsLabel(platforms) {
        switch (platforms) {
            case 'all': return 'Toutes les plateformes';
            case 'general': return 'Plateformes générales';
            case 'nsfw': return 'Plateformes NSFW';
            default: return Array.isArray(platforms) ? 'Plateformes personnalisées' : 'Toutes les plateformes';
        }
    }

    /**
     * Gestion de la sélection d'intervalle pour l'auto-bump
     */
    async handleAutoIntervalSelect(interaction) {
        const selectedInterval = parseInt(interaction.values[0]);
        const configKey = `${interaction.guild.id}_${interaction.user.id}`;
        
        let tempConfig = this.tempConfigs.get(configKey) || {};
        if (!tempConfig.autoBump) {
            const currentConfig = await this.bumpManager.getBumpConfig(interaction.guild.id);
            tempConfig.autoBump = { ...currentConfig.autoBump };
        }
        
        tempConfig.autoBump.interval = selectedInterval * 60 * 60 * 1000; // Convertir en ms
        this.tempConfigs.set(configKey, tempConfig);

        // Réafficher la configuration auto-bump
        const config = await this.bumpManager.getBumpConfig(interaction.guild.id);
        config.autoBump = tempConfig.autoBump;
        await this.showAutoBumpConfig(interaction, config);
    }

    /**
     * Gestion de la sélection des plateformes pour l'auto-bump
     */
    async handleAutoPlatformsSelect(interaction) {
        const selectedPlatforms = interaction.values[0];
        const configKey = `${interaction.guild.id}_${interaction.user.id}`;
        
        let tempConfig = this.tempConfigs.get(configKey) || {};
        if (!tempConfig.autoBump) {
            const currentConfig = await this.bumpManager.getBumpConfig(interaction.guild.id);
            tempConfig.autoBump = { ...currentConfig.autoBump };
        }
        
        tempConfig.autoBump.platforms = selectedPlatforms;
        this.tempConfigs.set(configKey, tempConfig);

        // Réafficher la configuration auto-bump
        const config = await this.bumpManager.getBumpConfig(interaction.guild.id);
        config.autoBump = tempConfig.autoBump;
        await this.showAutoBumpConfig(interaction, config);
    }

    /**
     * Configuration du canal de notification
     */
    async showChannelConfig(interaction, config) {
        const embed = new EmbedBuilder()
            .setTitle('📢 Canal de Notification')
            .setDescription('Configurez le canal par défaut pour les notifications de bump')
            .setColor('#5865F2');

        if (config.bumpChannelId) {
            const channel = interaction.guild.channels.cache.get(config.bumpChannelId);
            embed.addFields({
                name: 'Canal Actuel',
                value: channel ? channel.toString() : 'Canal introuvable',
                inline: true
            });
        }

        // Menu de sélection des canaux
        const textChannels = interaction.guild.channels.cache
            .filter(channel => channel.type === ChannelType.GuildText)
            .first(25); // Limite Discord

        if (textChannels.length === 0) {
            embed.setDescription('❌ Aucun canal textuel disponible dans ce serveur.');
        } else {
            const channelOptions = textChannels.map(channel => ({
                label: `#${channel.name}`,
                value: channel.id,
                description: channel.topic ? channel.topic.substring(0, 50) : 'Aucune description',
                default: channel.id === config.bumpChannelId
            }));

            const selectMenu = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('config_bump_select_channel')
                        .setPlaceholder('Sélectionnez un canal de notification')
                        .addOptions(channelOptions)
                );

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('config_bump_save')
                        .setLabel('Sauvegarder')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('💾'),
                    new ButtonBuilder()
                        .setCustomId('config_bump_back')
                        .setLabel('Retour')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🔙')
                );

            return await interaction.editReply({
                embeds: [embed],
                components: [selectMenu, buttons]
            });
        }

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_bump_back')
                    .setLabel('Retour')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔙')
            );

        await interaction.editReply({
            embeds: [embed],
            components: [backButton]
        });
    }

    /**
     * Configuration du message personnalisé
     */
    async showCustomMessageConfig(interaction, config) {
        const embed = new EmbedBuilder()
            .setTitle('💬 Message Personnalisé')
            .setDescription('Configurez un message personnalisé pour les bumps')
            .setColor('#5865F2');

        if (config.customMessage) {
            embed.addFields({
                name: 'Message Actuel',
                value: config.customMessage,
                inline: false
            });
        } else {
            embed.addFields({
                name: 'Message Actuel',
                value: '*Message par défaut*',
                inline: false
            });
        }

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_bump_edit_message')
                    .setLabel('Modifier le Message')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✏️'),
                new ButtonBuilder()
                    .setCustomId('config_bump_reset_message')
                    .setLabel('Réinitialiser')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔄'),
                new ButtonBuilder()
                    .setCustomId('config_bump_back')
                    .setLabel('Retour')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔙')
            );

        await interaction.editReply({
            embeds: [embed],
            components: [buttons]
        });
    }

    /**
     * Configuration des rappels automatiques
     */
    async showRemindersConfig(interaction, config) {
        const embed = new EmbedBuilder()
            .setTitle('🔔 Rappels Automatiques')
            .setDescription('Configurez les rappels automatiques pour ne jamais oublier de bumper')
            .setColor('#5865F2')
            .addFields({
                name: 'Statut Actuel',
                value: config.autoReminder ? '✅ Activés' : '❌ Désactivés',
                inline: true
            });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_bump_reminders_enable')
                    .setLabel('Activer')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅')
                    .setDisabled(config.autoReminder),
                new ButtonBuilder()
                    .setCustomId('config_bump_reminders_disable')
                    .setLabel('Désactiver')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
                    .setDisabled(!config.autoReminder),
                new ButtonBuilder()
                    .setCustomId('config_bump_back')
                    .setLabel('Retour')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔙')
            );

        await interaction.editReply({
            embeds: [embed],
            components: [buttons]
        });
    }

    /**
     * Test de bump
     */
    async handleTestBump(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🧪 Test de Bump')
            .setDescription('Fonction de test en cours de développement...')
            .setColor('#ffcc00');

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_bump_back')
                    .setLabel('Retour')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔙')
            );

        await interaction.editReply({
            embeds: [embed],
            components: [backButton]
        });
    }

    /**
     * Statut détaillé
     */
    async showDetailedStatus(interaction) {
        const config = await this.bumpManager.getBumpConfig(interaction.guild.id);
        const cooldownInfo = await this.bumpManager.checkCooldowns(interaction.guild.id, interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle('📊 Statut Détaillé du Système de Bump')
            .setColor('#5865F2')
            .setTimestamp();

        // Plateformes configurées
        const generalPlatforms = config.enabledPlatforms;
        const nsfwPlatforms = config.enabledNSFWPlatforms || [];
        const allPlatforms = [...generalPlatforms, ...nsfwPlatforms];

        if (allPlatforms.length > 0) {
            const platformStatus = allPlatforms.map(platform => {
                const platformInfo = this.bumpManager.platforms[platform];
                const onCooldown = cooldownInfo.onCooldown.find(cd => cd.platform === platform);
                
                if (onCooldown) {
                    return `${platformInfo.emoji} ${platformInfo.name}: ⏰ ${this.bumpManager.formatTimeLeft(onCooldown.timeLeft)}`;
                } else {
                    return `${platformInfo.emoji} ${platformInfo.name}: ✅ Disponible`;
                }
            }).join('\n');

            embed.addFields({ name: 'État des Plateformes', value: platformStatus, inline: false });
        }

        // Auto-bump
        if (config.autoBump?.enabled) {
            const nextBump = config.autoBump.lastRun ? 
                new Date(config.autoBump.lastRun + config.autoBump.interval) : 
                new Date(Date.now() + config.autoBump.interval);
            
            embed.addFields({
                name: '🤖 Auto-Bump',
                value: `**Prochain bump:** <t:${Math.floor(nextBump.getTime() / 1000)}:R>`,
                inline: true
            });
        }

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_bump_back')
                    .setLabel('Retour')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔙')
            );

        await interaction.editReply({
            embeds: [embed],
            components: [backButton]
        });
    }

    /**
     * Export de configuration
     */
    async exportConfiguration(interaction) {
        const config = await this.bumpManager.getBumpConfig(interaction.guild.id);
        
        const exportData = {
            guildId: config.guildId,
            enabledPlatforms: config.enabledPlatforms,
            enabledNSFWPlatforms: config.enabledNSFWPlatforms,
            autoBump: {
                enabled: config.autoBump?.enabled || false,
                interval: config.autoBump?.interval || 24 * 60 * 60 * 1000,
                platforms: config.autoBump?.platforms || 'all'
            },
            autoReminder: config.autoReminder,
            exportedAt: new Date().toISOString()
        };

        const embed = new EmbedBuilder()
            .setTitle('📤 Export de Configuration')
            .setDescription('Configuration exportée avec succès')
            .setColor('#5865F2')
            .addFields({
                name: 'Données de Configuration',
                value: `\`\`\`json\n${JSON.stringify(exportData, null, 2)}\`\`\``,
                inline: false
            });

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_bump_back')
                    .setLabel('Retour')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔙')
            );

        await interaction.editReply({
            embeds: [embed],
            components: [backButton]
        });
    }
}

module.exports = ConfigBumpHandler;