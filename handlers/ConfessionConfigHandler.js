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
        const config = await this.dataManager.loadData('confessions.json', {});
        const guildConfig = config[guildId] || { channels: [], autoThread: false };

        const embed = new EmbedBuilder()
            .setColor('#e91e63')
            .setTitle('🛠️ Configuration Confessions')
            .setDescription('Configuration complète du système de confessions anonymes')
            .addFields([
                { 
                    name: '📝 Canaux actifs', 
                    value: `${guildConfig.channels?.length || 0} canal(aux)`, 
                    inline: true 
                },
                { 
                    name: '🧵 Auto-thread', 
                    value: guildConfig.autoThread ? '✅ Activé' : '❌ Désactivé', 
                    inline: true 
                },
                { 
                    name: '📊 Logs admin', 
                    value: guildConfig.logChannelId ? '✅ Configuré' : '❌ Non configuré', 
                    inline: true 
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confession_config_main')
            .setPlaceholder('Choisissez une option...')
            .addOptions([
                {
                    label: '📝 Gérer les Canaux',
                    value: 'manage_channels',
                    description: 'Ajouter/retirer canaux de confessions'
                },
                {
                    label: '📊 Configuration Logs Admin',
                    value: 'admin_logs',
                    description: 'Paramètres des logs administrateur'
                },
                {
                    label: '🧵 Auto-Thread Confessions',
                    value: 'autothread_config',
                    description: 'Configuration threads automatiques'
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
}

module.exports = ConfessionConfigHandler;