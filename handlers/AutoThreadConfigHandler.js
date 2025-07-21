/**
 * Handler dédié à la configuration des auto-threads
 */

const { EmbedBuilder, ChannelSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

class AutoThreadConfigHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    /**
     * Afficher le menu principal de configuration auto-thread
     */
    async showMainConfigMenu(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('autothread.json', {});
        const guildConfig = config[guildId] || { enabled: false, channels: [] };

        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('🧵 Configuration Auto-Thread Global')
            .setDescription('Système de création automatique de threads pour tous les messages')
            .addFields([
                { 
                    name: '🎯 Statut', 
                    value: guildConfig.enabled ? '✅ Activé' : '❌ Désactivé', 
                    inline: true 
                },
                { 
                    name: '📝 Canaux actifs', 
                    value: `${guildConfig.channels?.length || 0} canal(aux)`, 
                    inline: true 
                },
                { 
                    name: '🏷️ Format nom', 
                    value: guildConfig.threadNameFormat || 'Thread #{number}', 
                    inline: true 
                }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'autothread_config_main',
                    placeholder: 'Choisissez une option...',
                    options: [
                        {
                            label: guildConfig.enabled ? '❌ Désactiver' : '✅ Activer',
                            value: 'toggle_system',
                            description: 'Activer/désactiver le système'
                        },
                        {
                            label: '📝 Canaux Auto-Thread',
                            value: 'manage_channels',
                            description: 'Ajouter/supprimer des canaux'
                        },
                        {
                            label: '🏷️ Format des Noms',
                            value: 'thread_naming',
                            description: 'Personnaliser le nom des threads'
                        },
                        {
                            label: '⚙️ Paramètres Avancés',
                            value: 'advanced_settings',
                            description: 'Archive, mode lent, permissions'
                        }
                    ]
                }
            ]);

        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    }

    /**
     * Gérer les interactions du menu principal
     */
    async handleMainMenu(interaction) {
        const value = interaction.values[0];

        switch (value) {
            case 'toggle_system':
                await this.toggleSystem(interaction);
                break;
            case 'manage_channels':
                await this.showChannelsConfig(interaction);
                break;
            case 'thread_naming':
                await this.showNamingConfig(interaction);
                break;
            case 'advanced_settings':
                await this.showAdvancedSettings(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Option non reconnue', flags: 64 });
        }
    }

    /**
     * Activer/désactiver le système
     */
    async toggleSystem(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('autothread.json', {});
        
        if (!config[guildId]) config[guildId] = { enabled: false, channels: [] };
        
        config[guildId].enabled = !config[guildId].enabled;
        await this.dataManager.saveData('autothread.json', config);

        const embed = new EmbedBuilder()
            .setColor(config[guildId].enabled ? '#2ecc71' : '#e74c3c')
            .setTitle(`${config[guildId].enabled ? '✅' : '❌'} Système Auto-Thread`)
            .setDescription(`Le système a été **${config[guildId].enabled ? 'activé' : 'désactivé'}**`)
            .addFields([
                {
                    name: '📊 Statut',
                    value: config[guildId].enabled ? 'Création automatique de threads active' : 'Aucun thread automatique',
                    inline: false
                }
            ]);

        await interaction.update({ embeds: [embed], components: [] });

        // Retour au menu principal après 2 secondes
        setTimeout(async () => {
            await this.showMainConfigMenu(interaction);
        }, 2000);
    }

    /**
     * Configuration des canaux
     */
    async showChannelsConfig(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('autothread.json', {});
        const guildConfig = config[guildId] || { channels: [] };

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('📝 Gestion des Canaux')
            .setDescription(`Canaux avec auto-thread : **${guildConfig.channels.length}**`)
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
            .setCustomId('autothread_channel_add')
            .setPlaceholder('Sélectionnez des canaux à ajouter...')
            .setMinValues(1)
            .setMaxValues(10)
            .addChannelTypes(0); // TEXT_CHANNEL

        const row1 = new ActionRowBuilder().addComponents(channelSelect);

        const row2 = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'autothread_channel_remove',
                    placeholder: 'Retirer un canal...',
                    disabled: guildConfig.channels.length === 0,
                    options: guildConfig.channels.length > 0 
                        ? guildConfig.channels.map(chId => ({
                            label: `#${interaction.guild.channels.cache.get(chId)?.name || 'Canal supprimé'}`,
                            value: chId,
                            description: `ID: ${chId}`
                        }))
                        : [{ label: 'Aucun canal', value: 'none', description: 'Aucun canal configuré' }]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row1, row2] });
    }

    /**
     * Configuration du format des noms
     */
    async showNamingConfig(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('autothread.json', {});
        const guildConfig = config[guildId] || {};

        const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('🏷️ Format des Noms de Thread')
            .setDescription('Personnalisez le nom des threads automatiques')
            .addFields([
                { 
                    name: '📝 Format actuel', 
                    value: guildConfig.threadNameFormat || 'Thread #{number}', 
                    inline: false 
                },
                {
                    name: '🎯 Variables disponibles',
                    value: `\`{number}\` - Numéro du thread\n\`{author}\` - Nom de l'auteur\n\`{channel}\` - Nom du canal\n\`{date}\` - Date du jour\n\`{time}\` - Heure actuelle`,
                    inline: false
                },
                {
                    name: '💡 Exemples',
                    value: `\`Discussion #{number}\`\n\`Thread de {author}\`\n\`{channel} - {date}\`\n\`Conversation {number} par {author}\``,
                    inline: false
                }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'autothread_naming_presets',
                    placeholder: 'Formats prédéfinis...',
                    options: [
                        {
                            label: 'Thread #{number}',
                            value: 'Thread #{number}',
                            description: 'Format simple avec numéro'
                        },
                        {
                            label: 'Discussion #{number}',
                            value: 'Discussion #{number}',
                            description: 'Format formel'
                        },
                        {
                            label: 'Thread de {author}',
                            value: 'Thread de {author}',
                            description: 'Inclut le nom de l\'auteur'
                        },
                        {
                            label: '{channel} - Thread #{number}',
                            value: '{channel} - Thread #{number}',
                            description: 'Inclut le nom du canal'
                        },
                        {
                            label: 'Conversation {date}',
                            value: 'Conversation {date}',
                            description: 'Basé sur la date'
                        },
                        {
                            label: '💬 Format personnalisé',
                            value: 'custom_format',
                            description: 'Créer un format sur mesure'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Paramètres avancés
     */
    async showAdvancedSettings(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('autothread.json', {});
        const guildConfig = config[guildId] || {};

        const embed = new EmbedBuilder()
            .setColor('#34495e')
            .setTitle('⚙️ Paramètres Avancés')
            .setDescription('Configuration technique du système auto-thread')
            .addFields([
                { 
                    name: '📦 Archivage automatique', 
                    value: this.getArchiveDurationText(guildConfig.autoArchiveDuration) || '24 heures', 
                    inline: true 
                },
                { 
                    name: '🐌 Mode lent', 
                    value: guildConfig.slowModeDelay ? `${guildConfig.slowModeDelay}s` : 'Désactivé', 
                    inline: true 
                },
                { 
                    name: '👥 Auto-invitation', 
                    value: guildConfig.autoInviteAuthor ? 'Activée' : 'Désactivée', 
                    inline: true 
                }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'autothread_advanced_options',
                    placeholder: 'Paramètres avancés...',
                    options: [
                        {
                            label: '📦 Durée d\'Archivage',
                            value: 'archive_duration',
                            description: '1h, 24h, 3j, 7j'
                        },
                        {
                            label: '🐌 Mode Lent',
                            value: 'slowmode_delay',
                            description: 'Délai entre messages (0-21600s)'
                        },
                        {
                            label: '👥 Auto-invitation Auteur',
                            value: 'auto_invite',
                            description: 'Inviter automatiquement l\'auteur'
                        },
                        {
                            label: '🔒 Permissions Thread',
                            value: 'thread_permissions',
                            description: 'Configurer les permissions'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Ajouter des canaux
     */
    async handleChannelAdd(interaction) {
        const guildId = interaction.guild.id;
        const selectedChannels = interaction.values;
        
        const config = await this.dataManager.loadData('autothread.json', {});
        if (!config[guildId]) config[guildId] = { enabled: false, channels: [] };

        const addedChannels = [];
        for (const channelId of selectedChannels) {
            if (!config[guildId].channels.includes(channelId)) {
                config[guildId].channels.push(channelId);
                addedChannels.push(`<#${channelId}>`);
            }
        }

        await this.dataManager.saveData('autothread.json', config);

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
     * Supprimer un canal
     */
    async handleChannelRemove(interaction) {
        const guildId = interaction.guild.id;
        const channelId = interaction.values[0];

        if (channelId === 'none') {
            await interaction.reply({ content: '❌ Aucun canal à supprimer', flags: 64 });
            return;
        }

        const config = await this.dataManager.loadData('autothread.json', {});
        if (config[guildId] && config[guildId].channels) {
            config[guildId].channels = config[guildId].channels.filter(id => id !== channelId);
            await this.dataManager.saveData('autothread.json', config);
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

    /**
     * Obtenir le texte de la durée d'archivage
     */
    getArchiveDurationText(duration) {
        switch (duration) {
            case 60: return '1 heure';
            case 1440: return '24 heures';
            case 4320: return '3 jours';
            case 10080: return '7 jours';
            default: return '24 heures';
        }
    }
}

module.exports = AutoThreadConfigHandler;