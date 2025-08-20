/**
 * Handler AutoThread - Recréé Complètement
 */

const { EmbedBuilder, ChannelSelectMenuBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

class AutoThreadConfigHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    async handleMainConfig(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('autothread.json', {});
        const guildConfig = config[guildId] || { enabled: false, channels: [], threadName: 'Thread automatique', archiveTime: 1440, slowMode: 0 };

        // Générer la liste des canaux configurés
        let channelsList = 'Aucun canal configuré';
        if (guildConfig.channels && guildConfig.channels.length > 0) {
            const channelMentions = [];
            for (const channel of guildConfig.channels) {
                const channelId = typeof channel === 'string' ? channel : channel.channelId;
                channelMentions.push(`<#${channelId}>`);
            }
            channelsList = channelMentions.join('\n');
        }

        const embed = new EmbedBuilder()
            .setColor('#36393f')
            .setTitle('Choisissez une action...')
            .setDescription('**Configuration Auto-Thread Actuelle**')
            .addFields([
                { 
                    name: '⚡ Statut du Système', 
                    value: guildConfig.enabled ? '🟢 **Activé**' : '🔴 **Désactivé**', 
                    inline: true 
                },
                { 
                    name: '🏷️ Nom des Threads', 
                    value: `\`${guildConfig.threadName === '__RANDOM_NSFW_BG__' ? 'Aléatoire NSFW (Boys & Girls)' : (guildConfig.threadName || 'Thread automatique')}\``, 
                    inline: true 
                },
                { 
                    name: '🗃️ Archivage Auto', 
                    value: guildConfig.permanentThreads ? '♾️ Permanent (Jamais)' : `${guildConfig.archiveTime || 1440} minutes`, 
                    inline: true 
                },
                { 
                    name: '🐌 Mode Lent', 
                    value: guildConfig.slowMode > 0 ? `${guildConfig.slowMode} secondes` : 'Désactivé', 
                    inline: true 
                },
                { 
                    name: '📊 Threads Créés', 
                    value: `${guildConfig.stats?.threadsCreated || 0}`, 
                    inline: true 
                },
                { 
                    name: '📅 Dernier Thread', 
                    value: guildConfig.stats?.lastCreated ? new Date(guildConfig.stats.lastCreated).toLocaleDateString('fr-FR') : 'Jamais', 
                    inline: true 
                },
                { 
                    name: '📝 Canaux Configurés', 
                    value: channelsList, 
                    inline: false 
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('autothread_action')
            .setPlaceholder('Choisissez une action...')
            .addOptions([
                {
                    label: '🔧 Activer/Désactiver',
                    value: 'toggle',
                    description: 'Basculer le système on/off'
                },
                {
                    label: '➕ Ajouter Canal',
                    value: 'add_channel',
                    description: 'Ajouter un canal au système'
                },
                {
                    label: '🗑️ Retirer Canal',
                    value: 'remove_channel',
                    description: 'Retirer un canal'
                },
                {
                    label: '🏷️ Nom des Threads',
                    value: 'thread_name',
                    description: 'Configurer le nom des threads'
                },
                {
                    label: '🗃️ Durée Archivage',
                    value: 'archive_time',
                    description: 'Régler l\'archivage automatique'
                },
                {
                    label: '🐌 Slow Mode',
                    value: 'slow_mode',
                    description: 'Configurer le délai entre messages'
                },
                {
                    label: '📊 Voir Statistiques',
                    value: 'stats',
                    description: 'Afficher les performances'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async handleAction(interaction) {
        const action = interaction.values[0];
        
        switch (action) {
            case 'toggle':
                await this.toggleSystem(interaction);
                break;
            case 'add_channel':
                await this.showAddChannel(interaction);
                break;
            case 'remove_channel':
                await this.showRemoveChannel(interaction);
                break;
            case 'thread_name':
                await this.showThreadNameSelector(interaction);
                break;
            case 'archive_time':
                await this.showArchiveMenu(interaction);
                break;
            case 'slow_mode':
                await this.showSlowModeMenu(interaction);
                break;
            case 'stats':
                await this.showStats(interaction);
                break;
        }
    }

    async toggleSystem(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('autothread.json', {});
        
        if (!config[guildId]) {
            config[guildId] = { enabled: false, channels: [], threadName: 'Thread automatique', archiveTime: 1440, slowMode: 0 };
        }
        
        config[guildId].enabled = !config[guildId].enabled;
        await this.dataManager.saveData('autothread.json', config);

        const embed = new EmbedBuilder()
            .setColor(config[guildId].enabled ? '#00ff00' : '#ff0000')
            .setTitle(config[guildId].enabled ? '✅ Système Activé' : '❌ Système Désactivé')
            .setDescription(`Le système auto-thread est maintenant ${config[guildId].enabled ? 'activé' : 'désactivé'}`);

        await interaction.update({ embeds: [embed], components: [] });
        
        setTimeout(() => {
            this.handleMainConfig(interaction).catch(console.error);
        }, 2000);
    }

    async showAddChannel(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('➕ Ajouter Canal')
            .setDescription('Sélectionnez un canal à ajouter au système auto-thread');

        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('autothread_add_channel')
            .setPlaceholder('Sélectionnez un canal...')
            .setChannelTypes([0]);

        const row = new ActionRowBuilder().addComponents(channelSelect);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showRemoveChannel(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('autothread.json', {});
        const channels = config[guildId]?.channels || [];

        if (channels.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Aucun Canal')
                .setDescription('Aucun canal configuré à retirer');

            await interaction.update({ embeds: [embed], components: [] });
            
            setTimeout(() => {
                this.handleMainConfig(interaction).catch(console.error);
            }, 2000);
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#ff4444')
            .setTitle('🗑️ Retirer Canal')
            .setDescription('Sélectionnez un canal à retirer du système auto-thread');

        // Créer les options seulement pour les canaux configurés
        const options = [];
        for (const channel of channels) {
            const channelId = typeof channel === 'string' ? channel : channel.channelId;
            try {
                const discordChannel = await interaction.guild.channels.fetch(channelId);
                if (discordChannel) {
                    options.push({
                        label: `#${discordChannel.name}`,
                        description: `Retirer ce canal de l'auto-thread`,
                        value: channelId,
                        emoji: '🗑️'
                    });
                }
            } catch (error) {
                // Canal supprimé ou inaccessible, l'ajouter quand même pour nettoyage
                options.push({
                    label: `Canal supprimé (${channelId})`,
                    description: `Nettoyer ce canal de la configuration`,
                    value: channelId,
                    emoji: '🚫'
                });
            }
        }

        const channelSelect = new StringSelectMenuBuilder()
            .setCustomId('autothread_remove_channel')
            .setPlaceholder('Sélectionnez un canal à retirer...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(channelSelect);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async handleAddChannel(interaction) {
        const guildId = interaction.guild.id;
        const channelId = interaction.values[0];
        const config = await this.dataManager.loadData('autothread.json', {});
        
        if (!config[guildId]) {
            config[guildId] = { enabled: false, channels: [], threadName: 'Thread automatique', archiveTime: 1440, slowMode: 0 };
        }

        if (!config[guildId].channels.includes(channelId)) {
            config[guildId].channels.push(channelId);
            await this.dataManager.saveData('autothread.json', config);
        }

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Canal Ajouté')
            .setDescription(`<#${channelId}> ajouté au système auto-thread`);

        await interaction.update({ embeds: [embed], components: [] });
        
        setTimeout(() => {
            this.handleMainConfig(interaction).catch(console.error);
        }, 2000);
    }

    async handleRemoveChannel(interaction) {
        const guildId = interaction.guild.id;
        const channelId = interaction.values[0];
        const config = await this.dataManager.loadData('autothread.json', {});
        
        if (config[guildId]?.channels) {
            config[guildId].channels = config[guildId].channels.filter(id => id !== channelId);
            await this.dataManager.saveData('autothread.json', config);
        }

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🗑️ Canal Retiré')
            .setDescription(`<#${channelId}> retiré du système auto-thread`);

        await interaction.update({ embeds: [embed], components: [] });
        
        setTimeout(() => {
            this.handleMainConfig(interaction).catch(console.error);
        }, 2000);
    }

    async showThreadNameSelector(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle('🏷️ Nom des Threads')
            .setDescription('Choisissez un format pour le nom des threads automatiques')
            .addFields([
                { name: 'Variables disponibles:', value: '• `{user}` - Nom de l\'utilisateur\n• `{channel}` - Nom du canal\n• `{date}` - Date actuelle\n• `{time}` - Heure actuelle', inline: false }
            ]);

        const nameSelect = new StringSelectMenuBuilder()
            .setCustomId('autothread_name_select')
            .setPlaceholder('Sélectionnez un format de nom...')
            .addOptions([
                {
                    label: 'Fil de {user}',
                    description: 'Exemple: Fil de Jormungand',
                    value: 'Fil de {user}',
                    emoji: '👤'
                },
                {
                    label: 'Discussion - {user}',
                    description: 'Exemple: Discussion - Jormungand',
                    value: 'Discussion - {user}',
                    emoji: '💬'
                },
                {
                    label: 'Thread #{channel}',
                    description: 'Exemple: Thread #general',
                    value: 'Thread #{channel}',
                    emoji: '📱'
                },
                {
                    label: '{user} | {date}',
                    description: 'Exemple: Jormungand | 22/07/2025',
                    value: '{user} | {date}',
                    emoji: '📅'
                },
                {
                    label: '💭 {user} à {time}',
                    description: 'Exemple: 💭 Jormungand à 15:30',
                    value: '💭 {user} à {time}',
                    emoji: '🕐'
                },
                {
                    label: 'Thread automatique',
                    description: 'Nom simple sans variables',
                    value: 'Thread automatique',
                    emoji: '🤖'
                },
                {
                    label: 'Nom personnalisé...',
                    description: 'Ouvrir un modal pour saisir un nom custom',
                    value: 'custom_modal',
                    emoji: '✏️'
                },
                {
                    label: 'Nom aléatoire (NSFW 18+)',
                    description: 'Thème « Boys & Girls » 18+ (≈10 noms aléatoires)',
                    value: 'random_nsfw_bg',
                    emoji: '🔞'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(nameSelect);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async handleThreadNameSelection(interaction) {
        const selectedValue = interaction.values[0];
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('autothread.json', {});
        
        if (!config[guildId]) {
            config[guildId] = { enabled: false, channels: [], threadName: 'Thread automatique', archiveTime: 1440, slowMode: 0 };
        }

        if (selectedValue === 'custom_modal') {
            // Ouvrir le modal pour nom personnalisé
            const modal = new ModalBuilder()
                .setCustomId('autothread_name_modal')
                .setTitle('🏷️ Nom des Threads Personnalisé');

            const nameInput = new TextInputBuilder()
                .setCustomId('thread_name')
                .setLabel('Nom des threads automatiques')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Entrez un nom personnalisé...')
                .setRequired(true)
                .setMaxLength(100);

            const row = new ActionRowBuilder().addComponents(nameInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
        } else {
            if (selectedValue === 'random_nsfw_bg') {
                config[guildId].threadName = '__RANDOM_NSFW_BG__';
                config[guildId].nsfw = true;
                await this.dataManager.saveData('autothread.json', config);

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ Mode aléatoire NSFW activé')
                    .setDescription('Les threads auront un nom aléatoire (thème 18+). Utilisez cela dans des canaux NSFW uniquement.');

                await interaction.update({ embeds: [embed], components: [] });
                
                setTimeout(() => {
                    this.handleMainConfig(interaction).catch(console.error);
                }, 2000);
                return;
            }
            // Utiliser la valeur sélectionnée directement
            config[guildId].threadName = selectedValue;
            config[guildId].nsfw = false;
            await this.dataManager.saveData('autothread.json', config);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Nom Configuré')
                .setDescription(`Nom des threads : **${selectedValue}**`)
                .addFields([
                    { name: 'Aperçu avec variables:', value: this.previewThreadName(selectedValue), inline: false }
                ]);

            await interaction.update({ embeds: [embed], components: [] });
            
            setTimeout(() => {
                this.handleMainConfig(interaction).catch(console.error);
            }, 2000);
        }
    }

    previewThreadName(template) {
        return template
            .replace('{user}', 'Jormungand')
            .replace('{channel}', 'general')
            .replace('{date}', new Date().toLocaleDateString('fr-FR'))
            .replace('{time}', new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    }

    async handleThreadNameModal(interaction) {
        const guildId = interaction.guild.id;
        const threadName = interaction.fields.getTextInputValue('thread_name');
        const config = await this.dataManager.loadData('autothread.json', {});
        
        if (!config[guildId]) {
            config[guildId] = { enabled: false, channels: [], threadName: 'Thread automatique', archiveTime: 1440, slowMode: 0 };
        }
        
        config[guildId].threadName = threadName;
        config[guildId].nsfw = false;
        await this.dataManager.saveData('autothread.json', config);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Nom Configuré')
            .setDescription(`Nom des threads : **${threadName}**`);

        await interaction.reply({ embeds: [embed], flags: 64 });
        
        setTimeout(() => {
            this.handleMainConfig(interaction).catch(console.error);
        }, 2000);
    }

    async showArchiveMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ffa500')
            .setTitle('🗃️ Durée d\'Archivage')
            .setDescription('Choisissez la durée avant archivage automatique\n\n⚠️ **Permanent** : Garde les threads actifs indéfiniment');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('autothread_archive')
            .setPlaceholder('Sélectionnez une durée...')
            .addOptions([
                { label: '🚫 Permanent (Jamais archivé)', value: 'never', description: 'Les threads restent actifs en permanence', emoji: '♾️' },
                { label: '1 heure', value: '60', description: 'Archive après 1 heure d\'inactivité' },
                { label: '24 heures', value: '1440', description: 'Archive après 1 jour d\'inactivité' },
                { label: '3 jours', value: '4320', description: 'Archive après 3 jours d\'inactivité' },
                { label: '7 jours', value: '10080', description: 'Archive après 1 semaine d\'inactivité' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async handleArchive(interaction) {
        const guildId = interaction.guild.id;
        const selectedValue = interaction.values[0];
        const config = await this.dataManager.loadData('autothread.json', {});
        
        if (!config[guildId]) {
            config[guildId] = { enabled: false, channels: [], threadName: 'Thread automatique', archiveTime: 1440, slowMode: 0 };
        }
        
        let archiveDescription;
        
        if (selectedValue === 'never') {
            // Mode permanent : utiliser 10080 (7 jours) mais avec un flag spécial
            config[guildId].archiveTime = 10080; // Maximum Discord
            config[guildId].permanentThreads = true;
            archiveDescription = '♾️ **Permanent** (Jamais archivé)';
        } else {
            const archiveTime = parseInt(selectedValue);
            config[guildId].archiveTime = archiveTime;
            config[guildId].permanentThreads = false;
            
            const labels = { 60: '1 heure', 1440: '24 heures', 4320: '3 jours', 10080: '7 jours' };
            archiveDescription = `**${labels[archiveTime]}**`;
        }
        
        await this.dataManager.saveData('autothread.json', config);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Archivage Configuré')
            .setDescription(`Durée d'archivage : ${archiveDescription}`);

        if (selectedValue === 'never') {
            embed.addFields({
                name: '⚠️ Mode Permanent Activé',
                value: 'Les threads seront gardés actifs indéfiniment.\nLe bot réactivera automatiquement les threads archivés.',
                inline: false
            });
        }

        await interaction.update({ embeds: [embed], components: [] });
        
        setTimeout(() => {
            this.handleMainConfig(interaction).catch(console.error);
        }, 2000);
    }

    async showSlowModeMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('🐌 Slow Mode')
            .setDescription('Choisissez le délai entre les messages');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('autothread_slowmode')
            .setPlaceholder('Sélectionnez un délai...')
            .addOptions([
                { label: 'Désactivé', value: '0', description: 'Aucun délai' },
                { label: '5 secondes', value: '5', description: '5 secondes entre messages' },
                { label: '10 secondes', value: '10', description: '10 secondes entre messages' },
                { label: '30 secondes', value: '30', description: '30 secondes entre messages' },
                { label: '1 minute', value: '60', description: '1 minute entre messages' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async handleSlowMode(interaction) {
        const guildId = interaction.guild.id;
        const slowMode = parseInt(interaction.values[0]);
        const config = await this.dataManager.loadData('autothread.json', {});
        
        if (!config[guildId]) {
            config[guildId] = { enabled: false, channels: [], threadName: 'Thread automatique', archiveTime: 1440, slowMode: 0 };
        }
        
        config[guildId].slowMode = slowMode;
        await this.dataManager.saveData('autothread.json', config);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Slow Mode Configuré')
            .setDescription(`Délai entre messages : **${slowMode === 0 ? 'Désactivé' : slowMode + ' secondes'}**`);

        await interaction.update({ embeds: [embed], components: [] });
        
        setTimeout(() => {
            this.handleMainConfig(interaction).catch(console.error);
        }, 2000);
    }

    async showStats(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('autothread.json', {});
        const guildConfig = config[guildId] || { enabled: false, channels: [], threadName: 'Thread automatique', archiveTime: 1440, slowMode: 0 };

        const embed = new EmbedBuilder()
            .setColor('#00aaff')
            .setTitle('📊 Statistiques Auto-Thread')
            .addFields([
                { name: '⚡ Statut', value: guildConfig.enabled ? '✅ Activé' : '❌ Désactivé', inline: true },
                { name: '📝 Canaux', value: `${guildConfig.channels.length}`, inline: true },
                { name: '🏷️ Nom Thread', value: (guildConfig.threadName === '__RANDOM_NSFW_BG__' ? 'Aléatoire NSFW (Boys & Girls)' : guildConfig.threadName), inline: true },
                { name: '🗃️ Archivage', value: `${guildConfig.archiveTime} min`, inline: true },
                { name: '🐌 Slow Mode', value: guildConfig.slowMode === 0 ? 'Désactivé' : `${guildConfig.slowMode}s`, inline: true }
            ]);

        await interaction.update({ embeds: [embed], components: [] });
        
        setTimeout(() => {
            this.handleMainConfig(interaction).catch(console.error);
        }, 2000);
    }

    /**
     * Méthode principale pour gérer toutes les interactions autothread
     * Appelée par MainRouterHandler
     */
    async handleAutothreadSelect(interaction) {
        const customId = interaction.customId;
        
        try {
            // Router selon le customId
            switch (customId) {
                case 'autothread_action':
                case 'autothread_config':
                    await this.handleAction(interaction);
                    break;
                    
                case 'autothread_add_channel':
                    await this.handleAddChannel(interaction);
                    break;
                    
                case 'autothread_remove_channel':
                    await this.handleRemoveChannel(interaction);
                    break;
                    
                case 'autothread_name_select':
                    await this.handleThreadNameSelection(interaction);
                    break;
                    
                case 'autothread_archive':
                    await this.handleArchive(interaction);
                    break;
                    
                case 'autothread_slowmode':
                    await this.handleSlowMode(interaction);
                    break;
                    
                default:
                    console.log(`⚠️ Interaction autothread non gérée: ${customId}`);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Interaction autothread non reconnue.',
                            flags: 64
                        });
                    }
                    break;
            }
        } catch (error) {
            console.error('❌ Erreur handleAutothreadSelect:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Erreur lors du traitement de l\'interaction autothread.',
                    flags: 64
                });
            }
        }
    }
}

module.exports = AutoThreadConfigHandler;