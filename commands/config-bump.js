/**
 * COMMANDE CONFIG-BUMP
 * Menu centralisé pour toute la configuration du système de bump
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-bump')
        .setDescription('Menu de configuration centralisé pour le système de bump multi-plateforme'),

    async execute(interaction, client) {
        try {
            const bumpManager = client.bumpManager;
            if (!bumpManager) {
                return await interaction.reply({
                    content: '❌ Le système de bump n\'est pas disponible.',
                    ephemeral: true
                });
            }

            // Vérifier les permissions
            if (!interaction.member.permissions.has('ManageGuild')) {
                return await interaction.reply({
                    content: '❌ Vous devez avoir la permission "Gérer le serveur" pour utiliser cette commande.',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            const guildId = interaction.guild.id;
            const config = await bumpManager.getBumpConfig(guildId);

            await this.showMainConfigMenu(interaction, bumpManager, config);

        } catch (error) {
            console.error('❌ Error in config-bump command:', error);
            
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors de l\'ouverture du menu de configuration.',
                });
            } else {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors de l\'ouverture du menu de configuration.',
                    ephemeral: true
                });
            }
        }
    },

    async showMainConfigMenu(interaction, bumpManager, config) {
        const guild = interaction.guild;
        const hasNSFWChannels = guild.channels.cache.some(channel => channel.nsfw);

        const embed = new EmbedBuilder()
            .setTitle('⚙️ Configuration du Système de Bump')
            .setDescription('Menu centralisé pour configurer toutes les options de bump')
            .setColor('#5865F2')
            .setThumbnail(guild.iconURL())
            .setTimestamp();

        // Statut général
        const generalPlatforms = config.enabledPlatforms.length;
        const nsfwPlatforms = config.enabledNSFWPlatforms?.length || 0;
        const autoBumpStatus = config.autoBump?.enabled ? '✅ Activé' : '❌ Désactivé';
        const channelStatus = config.bumpChannelId ? `<#${config.bumpChannelId}>` : 'Non défini';

        embed.addFields(
            { 
                name: '📊 Statut Actuel', 
                value: `**Plateformes générales:** ${generalPlatforms}\n**Plateformes NSFW:** ${nsfwPlatforms}\n**Bump automatique:** ${autoBumpStatus}\n**Canal:** ${channelStatus}`, 
                inline: false 
            }
        );

        if (config.autoBump?.enabled) {
            const intervalHours = config.autoBump.interval / (1000 * 60 * 60);
            const lastRun = config.autoBump.lastRun ? 
                `<t:${Math.floor(config.autoBump.lastRun / 1000)}:R>` : 'Jamais';
            
            embed.addFields({
                name: '🤖 Auto-Bump',
                value: `**Intervalle:** ${intervalHours}h\n**Dernier bump:** ${lastRun}`,
                inline: true
            });
        }

        // Menu de sélection principal
        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('config_bump_main_menu')
                    .setPlaceholder('Sélectionnez une option à configurer')
                    .addOptions([
                        {
                            label: 'Plateformes Générales',
                            value: 'general_platforms',
                            description: `${generalPlatforms} plateformes activées`,
                            emoji: '🌐'
                        },
                        {
                            label: 'Plateformes NSFW',
                            value: 'nsfw_platforms',
                            description: hasNSFWChannels ? `${nsfwPlatforms} plateformes NSFW activées` : 'Serveur sans canaux NSFW',
                            emoji: '🔞'
                        },
                        {
                            label: 'Bump Automatique',
                            value: 'auto_bump',
                            description: `Actuellement ${config.autoBump?.enabled ? 'activé' : 'désactivé'}`,
                            emoji: '🤖'
                        },
                        {
                            label: 'Canal de Notification',
                            value: 'notification_channel',
                            description: config.bumpChannelId ? 'Canal configuré' : 'Aucun canal défini',
                            emoji: '📢'
                        },
                        {
                            label: 'Message Personnalisé',
                            value: 'custom_message',
                            description: config.customMessage ? 'Message défini' : 'Message par défaut',
                            emoji: '💬'
                        },
                        {
                            label: 'Rappels Automatiques',
                            value: 'auto_reminders',
                            description: config.autoReminder ? 'Activés' : 'Désactivés',
                            emoji: '🔔'
                        }
                    ])
            );

        // Boutons d'action
        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_bump_test')
                    .setLabel('Test de Bump')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🧪'),
                new ButtonBuilder()
                    .setCustomId('config_bump_status')
                    .setLabel('Statut Détaillé')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊'),
                new ButtonBuilder()
                    .setCustomId('config_bump_export')
                    .setLabel('Exporter Config')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📤')
            );

        await interaction.editReply({
            embeds: [embed],
            components: [selectMenu, actionButtons]
        });
    }
};