/**
 * Handler dédié à la configuration du système de confessions
 */

const { EmbedBuilder, ChannelSelectMenuBuilder, ActionRowBuilder, StringSelectMenuBuilder, RoleSelectMenuBuilder } = require('discord.js');

class ConfessionConfigHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    async showMainConfigMenu(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        
        // Récupérer les données de configuration actuelles depuis config.confessions
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
            .setDescription('Configuration du système de confessions anonymes')
            .addFields([
                { 
                    name: '📝 Canaux Confessions', 
                    value: channels.length > 0 ? 
                        `✅ ${channels.length} canal(aux) configuré(s)` : 
                        '❌ Aucun canal configuré', 
                    inline: true 
                },
                { 
                    name: '📋 Canal Logs Admin', 
                    value: logChannel ? '✅ Configuré' : '❌ Non configuré', 
                    inline: true 
                },
                { 
                    name: '🧵 Auto-Thread', 
                    value: autoThread ? '✅ Activé' : '❌ Désactivé', 
                    inline: true 
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_config_main')
            .setPlaceholder('Choisissez une option...')
            .addOptions([
                {
                    label: '📝 Canaux Confessions',
                    value: 'manage_channels',
                    description: `${channels.length} canal(aux) configuré(s)`
                },
                {
                    label: '📋 Logs Admin',
                    value: 'admin_logs',
                    description: logChannel ? 'Configuré' : 'Non configuré'
                },
                {
                    label: '🧵 Auto-Thread',
                    value: 'autothread_config',
                    description: autoThread ? 'Activé' : 'Désactivé'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    }

    async handleMainMenu(interaction) {
        const value = interaction.values[0];
        switch (value) {
            case 'manage_channels':
                await this.showChannelsConfig(interaction);
                break;
            case 'admin_logs':
                await this.showAdminLogsConfig(interaction);
                break;
            case 'autothread_config':
                await this.showAutoThreadConfig(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Option non reconnue', flags: 64 });
        }
    }

    async showChannelsConfig(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.getData('config');
        const guildConfig = config.confessions?.[guildId] || { channels: [] };

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

    async showAdminLogsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('📊 Configuration Logs Admin')
            .setDescription('Configuration des logs administrateur')
            .addFields([{ name: '🚧 En développement', value: 'Cette section sera bientôt disponible', inline: false }]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_logs_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔄 Retour Menu Principal', value: 'back_main', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showAutoThreadConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('🧵 Auto-Thread Confessions')
            .setDescription('Configuration threads automatiques')
            .addFields([{ name: '🚧 En développement', value: 'Cette section sera bientôt disponible', inline: false }]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_autothread_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔄 Retour Menu Principal', value: 'back_main', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    // Méthodes d'alias pour compatibility
    async handleChannelsOptions(interaction) {
        return await this.showChannelsConfig(interaction);
    }

    async handleLogsOptions(interaction) {
        return await this.showAdminLogsConfig(interaction);
    }

    async handleAutoThreadOptions(interaction) {
        return await this.showAutoThreadConfig(interaction);
    }

    /**
     * Méthode principale pour gérer toutes les interactions confession config
     * Appelée par MainRouterHandler
     */
    async handleConfessionConfigSelect(interaction) {
        const customId = interaction.customId;
        
        try {
            // Router selon le customId
            switch (customId) {
                case 'confession_config_main':
                    await this.handleMainMenu(interaction);
                    break;
                    
                case 'confession_channel_add':
                    await this.handleChannelAdd(interaction);
                    break;
                    
                case 'confession_channel_remove':
                    await this.handleChannelRemove(interaction);
                    break;
                    
                // Boutons de retour
                case 'confession_logs_back':
                case 'confession_autothread_back':
                    await this.showMainConfigMenu(interaction);
                    break;
                    
                default:
                    console.log(`⚠️ Interaction confession config non gérée: ${customId}`);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Interaction confession non reconnue.',
                            flags: 64
                        });
                    }
                    break;
            }
        } catch (error) {
            console.error('❌ Erreur handleConfessionConfigSelect:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Erreur lors du traitement de l\'interaction confession.',
                    flags: 64
                });
            }
        }
    }

    async handleChannelAdd(interaction) {
        const guildId = interaction.guild.id;
        const channelId = interaction.values[0];
        
        try {
            const config = await this.dataManager.getData('config');
            if (!config.confessions) config.confessions = {};
            if (!config.confessions[guildId]) config.confessions[guildId] = { channels: [] };
            
            if (!config.confessions[guildId].channels.includes(channelId)) {
                config.confessions[guildId].channels.push(channelId);
                await this.dataManager.saveData('config', config);
                
                await interaction.update({
                    content: `✅ Canal <#${channelId}> ajouté aux confessions !`,
                    embeds: [],
                    components: []
                });
            } else {
                await interaction.update({
                    content: `⚠️ Canal <#${channelId}> déjà configuré !`,
                    embeds: [],
                    components: []
                });
            }
            
            // Retour au menu après 2 secondes
            setTimeout(() => {
                this.showMainConfigMenu(interaction).catch(console.error);
            }, 2000);
            
        } catch (error) {
            console.error('Erreur handleChannelAdd:', error);
            await interaction.update({
                content: '❌ Erreur lors de l\'ajout du canal.',
                embeds: [],
                components: []
            });
        }
    }

    async handleChannelRemove(interaction) {
        const guildId = interaction.guild.id;
        const channelId = interaction.values[0];
        
        try {
            const config = await this.dataManager.getData('config');
            if (config.confessions?.[guildId]?.channels) {
                const index = config.confessions[guildId].channels.indexOf(channelId);
                if (index > -1) {
                    config.confessions[guildId].channels.splice(index, 1);
                    await this.dataManager.saveData('config', config);
                    
                    await interaction.update({
                        content: `✅ Canal <#${channelId}> retiré des confessions !`,
                        embeds: [],
                        components: []
                    });
                } else {
                    await interaction.update({
                        content: `⚠️ Canal <#${channelId}> n'était pas configuré !`,
                        embeds: [],
                        components: []
                    });
                }
            }
            
            // Retour au menu après 2 secondes
            setTimeout(() => {
                this.showMainConfigMenu(interaction).catch(console.error);
            }, 2000);
            
        } catch (error) {
            console.error('Erreur handleChannelRemove:', error);
            await interaction.update({
                content: '❌ Erreur lors de la suppression du canal.',
                embeds: [],
                components: []
            });
        }
    }
}

module.exports = ConfessionConfigHandler;