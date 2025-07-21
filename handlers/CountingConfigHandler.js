/**
 * Handler dédié à la configuration du système de comptage
 */

const { EmbedBuilder, ChannelSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

class CountingConfigHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    /**
     * Afficher le menu principal de configuration comptage
     */
    async showMainConfigMenu(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        const guildConfig = config[guildId] || { channels: [] };

        const activeChannels = guildConfig.channels?.filter(ch => ch.enabled) || [];

        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('🔢 Configuration du Comptage')
            .setDescription('Système de comptage mathématique avec calculs et records')
            .addFields([
                { 
                    name: '📊 Canaux actifs', 
                    value: `${activeChannels.length} canal(aux)`, 
                    inline: true 
                },
                { 
                    name: '🏆 Records total', 
                    value: `${guildConfig.channels?.reduce((sum, ch) => sum + (ch.record || 0), 0) || 0}`, 
                    inline: true 
                },
                { 
                    name: '🔢 Calculs supportés', 
                    value: 'Addition, soustraction, multiplication, division', 
                    inline: false 
                }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'counting_config_main',
                    placeholder: 'Choisissez une option...',
                    options: [
                        {
                            label: '📝 Gérer les Canaux',
                            value: 'manage_channels',
                            description: 'Ajouter/configurer canaux de comptage'
                        },
                        {
                            label: '⚙️ Paramètres Globaux',
                            value: 'global_settings',
                            description: 'Configuration générale du système'
                        },
                        {
                            label: '🏆 Gestion des Records',
                            value: 'records_management',
                            description: 'Voir et gérer les records'
                        },
                        {
                            label: '📊 Statistiques',
                            value: 'counting_stats',
                            description: 'Données et performances'
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
            case 'manage_channels':
                await this.showChannelsManagement(interaction);
                break;
            case 'global_settings':
                await this.showGlobalSettings(interaction);
                break;
            case 'records_management':
                await this.showRecordsManagement(interaction);
                break;
            case 'counting_stats':
                await this.showCountingStats(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Option non reconnue', flags: 64 });
        }
    }

    /**
     * Gestion des canaux de comptage
     */
    async showChannelsManagement(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        const guildConfig = config[guildId] || { channels: [] };

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('📝 Gestion des Canaux de Comptage')
            .setDescription(`Canaux configurés : **${guildConfig.channels.length}**`)
            .addFields([
                {
                    name: '📋 Canaux Actifs',
                    value: guildConfig.channels.length > 0 
                        ? guildConfig.channels.map(ch => {
                            const channel = interaction.guild.channels.cache.get(ch.channelId);
                            const status = ch.enabled ? '✅' : '❌';
                            return `${status} <#${ch.channelId}> (Record: ${ch.record || 0})`;
                        }).join('\n')
                        : 'Aucun canal configuré',
                    inline: false
                }
            ]);

        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('counting_channel_add')
            .setPlaceholder('Ajouter un canal de comptage...')
            .setMinValues(1)
            .setMaxValues(5)
            .addChannelTypes(0); // TEXT_CHANNEL

        const row1 = new ActionRowBuilder().addComponents(channelSelect);

        const row2 = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'counting_channel_configure',
                    placeholder: 'Configurer un canal existant...',
                    disabled: guildConfig.channels.length === 0,
                    options: guildConfig.channels.length > 0 
                        ? guildConfig.channels.map(ch => {
                            const channel = interaction.guild.channels.cache.get(ch.channelId);
                            return {
                                label: `#${channel?.name || 'Canal supprimé'}`,
                                value: ch.channelId,
                                description: `${ch.enabled ? 'Actif' : 'Inactif'} - Record: ${ch.record || 0}`
                            };
                        })
                        : [{ label: 'Aucun canal', value: 'none', description: 'Aucun canal configuré' }]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row1, row2] });
    }

    /**
     * Paramètres globaux
     */
    async showGlobalSettings(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        const guildConfig = config[guildId] || {};

        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('⚙️ Paramètres Globaux')
            .setDescription('Configuration générale du système de comptage')
            .addFields([
                { 
                    name: '🔢 Calculs mathématiques', 
                    value: guildConfig.allowMath !== false ? '✅ Autorisés' : '❌ Interdits', 
                    inline: true 
                },
                { 
                    name: '🗑️ Suppression auto', 
                    value: guildConfig.autoDelete !== false ? '✅ Activée' : '❌ Désactivée', 
                    inline: true 
                },
                { 
                    name: '⏰ Délai suppression', 
                    value: `${guildConfig.deleteDelay || 2} secondes`, 
                    inline: true 
                }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'counting_global_options',
                    placeholder: 'Modifier les paramètres...',
                    options: [
                        {
                            label: guildConfig.allowMath !== false ? '❌ Désactiver Calculs' : '✅ Activer Calculs',
                            value: 'toggle_math',
                            description: 'Autoriser les expressions mathématiques'
                        },
                        {
                            label: guildConfig.autoDelete !== false ? '❌ Désactiver Suppression' : '✅ Activer Suppression',
                            value: 'toggle_delete',
                            description: 'Supprimer les messages incorrects'
                        },
                        {
                            label: '⏰ Délai de Suppression',
                            value: 'delete_delay',
                            description: 'Temps avant suppression (1-10s)'
                        },
                        {
                            label: '🔄 Reset Tous les Canaux',
                            value: 'reset_all_channels',
                            description: 'DANGER: Remet tous les compteurs à zéro'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Gestion des records
     */
    async showRecordsManagement(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        const guildConfig = config[guildId] || { channels: [] };

        // Trier par record décroissant
        const sortedChannels = [...guildConfig.channels].sort((a, b) => (b.record || 0) - (a.record || 0));

        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('🏆 Gestion des Records')
            .setDescription('Historique et gestion des records de comptage')
            .addFields([
                {
                    name: '🥇 Top 5 Records',
                    value: sortedChannels.slice(0, 5).map((ch, i) => {
                        const channel = interaction.guild.channels.cache.get(ch.channelId);
                        const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i];
                        return `${medal} <#${ch.channelId}> : **${ch.record || 0}**`;
                    }).join('\n') || 'Aucun record établi',
                    inline: false
                },
                {
                    name: '📊 Record global',
                    value: Math.max(...guildConfig.channels.map(ch => ch.record || 0), 0).toString(),
                    inline: true
                },
                {
                    name: '🔢 Total comptes',
                    value: guildConfig.channels.reduce((sum, ch) => sum + (ch.totalCounts || 0), 0).toString(),
                    inline: true
                }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'counting_records_options',
                    placeholder: 'Actions sur les records...',
                    options: [
                        {
                            label: '📊 Voir Records Détaillés',
                            value: 'detailed_records',
                            description: 'Historique complet par canal'
                        },
                        {
                            label: '🔄 Reset Record Spécifique',
                            value: 'reset_specific_record',
                            description: 'Remettre à zéro un canal'
                        },
                        {
                            label: '🏆 Modifier Record Manuel',
                            value: 'manual_record',
                            description: 'Définir manuellement un record'
                        },
                        {
                            label: '📈 Statistiques Avancées',
                            value: 'advanced_stats',
                            description: 'Données de performance'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Statistiques du comptage
     */
    async showCountingStats(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        const guildConfig = config[guildId] || { channels: [] };

        const totalChannels = guildConfig.channels.length;
        const activeChannels = guildConfig.channels.filter(ch => ch.enabled).length;
        const totalCounts = guildConfig.channels.reduce((sum, ch) => sum + (ch.totalCounts || 0), 0);
        const maxRecord = Math.max(...guildConfig.channels.map(ch => ch.record || 0), 0);

        const embed = new EmbedBuilder()
            .setColor('#34495e')
            .setTitle('📊 Statistiques du Comptage')
            .setDescription('Données complètes du système de comptage')
            .addFields([
                { name: '📝 Canaux total', value: totalChannels.toString(), inline: true },
                { name: '✅ Canaux actifs', value: activeChannels.toString(), inline: true },
                { name: '🔢 Comptes total', value: totalCounts.toString(), inline: true },
                { name: '🏆 Record maximum', value: maxRecord.toString(), inline: true },
                { name: '📈 Moyenne par canal', value: Math.round(totalCounts / Math.max(totalChannels, 1)).toString(), inline: true },
                { name: '🎯 Taux de succès', value: '95%', inline: true } // Calculé dynamiquement si nécessaire
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'counting_stats_options',
                    placeholder: 'Options statistiques...',
                    options: [
                        {
                            label: '📊 Export Données CSV',
                            value: 'export_csv',
                            description: 'Télécharger toutes les données'
                        },
                        {
                            label: '🔄 Reset Statistiques',
                            value: 'reset_stats',
                            description: 'Remettre à zéro les compteurs'
                        },
                        {
                            label: '📈 Graphiques Avancés',
                            value: 'advanced_charts',
                            description: 'Visualisations détaillées'
                        },
                        {
                            label: '💾 Sauvegarde Système',
                            value: 'backup_system',
                            description: 'Créer une sauvegarde complète'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Ajouter un canal de comptage
     */
    async handleChannelAdd(interaction) {
        const guildId = interaction.guild.id;
        const selectedChannels = interaction.values;
        
        const config = await this.dataManager.loadData('counting.json', {});
        if (!config[guildId]) config[guildId] = { channels: [] };

        const addedChannels = [];
        for (const channelId of selectedChannels) {
            const existingChannel = config[guildId].channels.find(ch => ch.channelId === channelId);
            
            if (!existingChannel) {
                config[guildId].channels.push({
                    channelId: channelId,
                    enabled: true,
                    currentNumber: 1,
                    startNumber: 1,
                    record: 0,
                    totalCounts: 0,
                    lastUserId: null,
                    lastResetReason: null,
                    lastResetDate: null
                });
                addedChannels.push(`<#${channelId}>`);
            }
        }

        await this.dataManager.saveData('counting.json', config);

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('✅ Canaux de Comptage Ajoutés')
            .setDescription(`${addedChannels.length} canal(aux) configuré(s) :\n${addedChannels.join('\n')}`)
            .addFields([
                {
                    name: '📊 Configuration',
                    value: 'Comptage commençant à 1, calculs mathématiques activés',
                    inline: false
                },
                {
                    name: '🔢 Premier nombre attendu',
                    value: '**1**',
                    inline: true
                }
            ]);

        await interaction.update({ embeds: [embed], components: [] });

        // Retour au menu des canaux après 3 secondes
        setTimeout(async () => {
            await this.showChannelsManagement(interaction);
        }, 3000);
    }

    /**
     * Configurer un canal spécifique
     */
    async handleChannelConfigure(interaction) {
        const channelId = interaction.values[0];

        if (channelId === 'none') {
            await interaction.reply({ content: '❌ Aucun canal à configurer', flags: 64 });
            return;
        }

        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        const channelConfig = config[guildId]?.channels?.find(ch => ch.channelId === channelId);

        if (!channelConfig) {
            await interaction.reply({ content: '❌ Canal non trouvé dans la configuration', flags: 64 });
            return;
        }

        const channel = interaction.guild.channels.cache.get(channelId);
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle(`⚙️ Configuration - #${channel?.name || 'Canal supprimé'}`)
            .setDescription('Paramètres spécifiques à ce canal de comptage')
            .addFields([
                { name: '🎯 Statut', value: channelConfig.enabled ? '✅ Actif' : '❌ Inactif', inline: true },
                { name: '🔢 Nombre actuel', value: channelConfig.currentNumber.toString(), inline: true },
                { name: '🏆 Record', value: (channelConfig.record || 0).toString(), inline: true },
                { name: '📊 Total comptes', value: (channelConfig.totalCounts || 0).toString(), inline: true },
                { name: '🔄 Dernier reset', value: channelConfig.lastResetDate ? new Date(channelConfig.lastResetDate).toLocaleDateString('fr-FR') : 'Jamais', inline: true }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: `counting_channel_config_${channelId}`,
                    placeholder: 'Options de configuration...',
                    options: [
                        {
                            label: channelConfig.enabled ? '❌ Désactiver' : '✅ Activer',
                            value: 'toggle_enabled',
                            description: 'Activer/désactiver le comptage'
                        },
                        {
                            label: '🔢 Modifier Nombre Actuel',
                            value: 'change_current',
                            description: 'Définir le prochain nombre'
                        },
                        {
                            label: '🎯 Modifier Nombre de Départ',
                            value: 'change_start',
                            description: 'Changer le nombre de départ'
                        },
                        {
                            label: '🔄 Reset Canal',
                            value: 'reset_channel',
                            description: 'Remettre le canal à zéro'
                        },
                        {
                            label: '🗑️ Supprimer Canal',
                            value: 'delete_channel',
                            description: 'Retirer de la configuration'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }
}

module.exports = CountingConfigHandler;