/**
 * Handler dédié à la configuration du système de comptage
 */

const { EmbedBuilder, ChannelSelectMenuBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

class CountingConfigHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    // Normalise le schéma des canaux vers currentNumber/lastUserId et ajoute les champs manquants
    async normalizeGuildConfig(interaction, config, guildId) {
        const guildConfig = config[guildId] || { channels: [] };
        let changed = false;

        if (!Array.isArray(guildConfig.channels)) {
            guildConfig.channels = [];
            changed = true;
        }

        for (const channel of guildConfig.channels) {
            // currentNumber
            if (typeof channel.currentNumber !== 'number') {
                channel.currentNumber = typeof channel.current === 'number' ? channel.current : 0;
                changed = true;
            }
            // lastUserId
            if (typeof channel.lastUserId !== 'string' && channel.lastUserId !== null) {
                channel.lastUserId = typeof channel.lastUser === 'string' ? channel.lastUser : null;
                changed = true;
            }
            // lastMessageId
            if (typeof channel.lastMessageId !== 'string' && channel.lastMessageId !== null) {
                channel.lastMessageId = channel.lastMessageId || null;
                changed = true;
            }
            // lastTimestamp
            if (typeof channel.lastTimestamp !== 'string') {
                channel.lastTimestamp = new Date().toISOString();
                changed = true;
            }
            // enabled
            if (typeof channel.enabled !== 'boolean') {
                channel.enabled = true;
                changed = true;
            }
            // record/recordUserId/recordDate
            if (typeof channel.record !== 'number') {
                channel.record = Number(channel.record) || 0;
                changed = true;
            }
            if (channel.record > 0) {
                if (channel.recordUserId && typeof channel.recordUserId !== 'string') {
                    channel.recordUserId = String(channel.recordUserId);
                    changed = true;
                }
                if (channel.recordDate && typeof channel.recordDate !== 'string') {
                    channel.recordDate = String(channel.recordDate);
                    changed = true;
                }
            }
            // Nettoyage des anciennes clés (laisser en lecture seule si présent != nécessaire mais évite confusions UI)
            if (Object.prototype.hasOwnProperty.call(channel, 'current')) {
                delete channel.current;
                changed = true;
            }
            if (Object.prototype.hasOwnProperty.call(channel, 'lastUser')) {
                delete channel.lastUser;
                changed = true;
            }
            if (Object.prototype.hasOwnProperty.call(channel, 'lastNumber')) {
                delete channel.lastNumber;
                changed = true;
            }
        }

        // Valeurs globales par défaut
        if (typeof guildConfig.mathEnabled !== 'boolean') { guildConfig.mathEnabled = true; changed = true; }
        if (typeof guildConfig.reactionsEnabled !== 'boolean') { guildConfig.reactionsEnabled = true; changed = true; }

        if (changed) {
            config[guildId] = guildConfig;
            await this.dataManager.saveData('counting.json', config);
        }

        return guildConfig;
    }

    async showMainConfigMenu(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        const guildConfig = await this.normalizeGuildConfig(interaction, config, guildId);

        // Nettoyer automatiquement les canaux supprimés au chargement
        const validChannels = [];
        if (guildConfig.channels) {
            for (const channel of guildConfig.channels) {
                try {
                    const discordChannel = await interaction.guild.channels.fetch(channel.channelId);
                    if (discordChannel) {
                        validChannels.push(channel);
                    }
                } catch (error) {
                    console.log(`🧹 Canal supprimé nettoyé: ${channel.channelId}`);
                }
            }
            
            // Mettre à jour si nécessaire
            if (validChannels.length !== guildConfig.channels.length) {
                guildConfig.channels = validChannels;
                config[guildId] = guildConfig;
                await this.dataManager.saveData('counting.json', config);
            }
        }

        const activeChannels = validChannels.filter(ch => ch.enabled) || [];

        const embed = new EmbedBuilder()
            .setColor('#ff1744')
            .setTitle('💋 Configuration du Jeu Coquin')
            .setDescription('Le jeu des boys & girls - Comptez ensemble et atteignez des sommets! 🔥')
            .addFields([
                { 
                    name: '🔥 Salons actifs', 
                    value: `${activeChannels.length} salon(s) de jeu`, 
                    inline: true 
                },
                { 
                    name: '🧮 Mode calcul sexy', 
                    value: guildConfig.mathEnabled ? '✅ Activé' : '❌ Désactivé', 
                    inline: true 
                },
                { 
                    name: '💦 Réactions hot', 
                    value: guildConfig.reactionsEnabled ? '✅ Activées' : '❌ Désactivées', 
                    inline: true 
                },
                {
                    name: '🏆 Records totaux',
                    value: `${guildConfig.channels?.reduce((sum, ch) => sum + (ch.record || 0), 0) || 0} points de plaisir`,
                    inline: false
                }
            ])
            .setFooter({ text: 'Choisissez une option pour configurer votre jeu 😈' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_config_main')
            .setPlaceholder('Que voulez-vous faire? 😏')
            .addOptions([
                {
                    label: '➕ Ajouter un salon de jeu',
                    value: 'add_channel',
                    description: 'Choisir un nouveau salon pour jouer',
                    emoji: '🍑'
                },
                {
                    label: '📋 Gérer les salons',
                    value: 'manage_channels',
                    description: 'Activer/désactiver vos salons de jeu',
                    emoji: '💋'
                },
                {
                    label: '🏆 Voir les champions',
                    value: 'records_management',
                    description: 'Consulter les records et statistiques hot',
                    emoji: '🔥'
                },
                {
                    label: '⚙️ Options du jeu',
                    value: 'game_settings',
                    description: 'Configurer les règles du jeu coquin',
                    emoji: '😈'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    }

    async handleMainMenu(interaction) {
        const value = interaction.values[0];
        switch (value) {
            case 'add_channel':
                await this.showAddChannelSelector(interaction);
                break;
            case 'manage_channels':
                await this.showChannelsManagement(interaction);
                break;
            case 'records_management':
                await this.showRecordsManagement(interaction);
                break;
            case 'game_settings':
                await this.showGlobalSettings(interaction);
                break;
            case 'global_settings':
                await this.showGlobalSettings(interaction);
                break;
            case 'counting_stats':
                await this.showCountingStats(interaction);
                break;
            default:
                console.log(`⚠️ Option de comptage non reconnue: ${value}`);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Option non reconnue', flags: 64 });
                }
        }
    }

    async showChannelsManagement(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        const guildConfig = await this.normalizeGuildConfig(interaction, config, guildId);

        // Nettoyer automatiquement les canaux supprimés et afficher seulement les valides
        let validChannels = [];
        if (guildConfig.channels && guildConfig.channels.length > 0) {
            for (const channel of guildConfig.channels) {
                try {
                    const discordChannel = await interaction.guild.channels.fetch(channel.channelId);
                    if (discordChannel) {
                        validChannels.push(channel);
                    }
                } catch (error) {
                    // Canal supprimé, on l'ignore
                    console.log(`🧹 Canal supprimé ignoré: ${channel.channelId}`);
                }
            }
            
            // Mettre à jour la configuration pour supprimer les canaux invalides
            if (validChannels.length !== guildConfig.channels.length) {
                guildConfig.channels = validChannels;
                await this.dataManager.saveData('counting.json', { ...await this.dataManager.loadData('counting.json', {}), [guildId]: guildConfig });
                console.log(`🧹 ${guildConfig.channels.length - validChannels.length} canaux supprimés nettoyés`);
            }
        }

        let channelsList = 'Aucun salon de jeu configuré 😢';
        if (validChannels.length > 0) {
            const channelMentions = [];
            for (const channel of validChannels) {
                const status = channel.enabled ? '🔥' : '❄️';
                const record = channel.record || 0;
                channelMentions.push(`${status} <#${channel.channelId}> (Record sexy: ${record} 🍑)`);
            }
            channelsList = channelMentions.join('\n');
        }

        const embed = new EmbedBuilder()
            .setColor('#e91e63')
            .setTitle('💋 Gestion des Salons de Jeu')
            .setDescription('Choisissez où les boys & girls peuvent s\'amuser ensemble! 😈')
            .addFields([
                { 
                    name: '🔥 Salons Actuels', 
                    value: channelsList, 
                    inline: false 
                }
            ])
            .setFooter({ text: 'Les salons actifs sont marqués avec 🔥' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_channels_menu')
            .setPlaceholder('Que voulez-vous faire? 😏')
            .addOptions([
                {
                    label: '➕ Ajouter un salon hot',
                    value: 'add_channel',
                    description: 'Créer un nouveau terrain de jeu',
                    emoji: '🍑'
                },
                {
                    label: '⚙️ Configurer un salon',
                    value: 'configure_channel',
                    description: 'Ajuster les règles du jeu',
                    emoji: '💦'
                },
                {
                    label: '🗑️ Retirer un salon',
                    value: 'remove_channel',
                    description: 'Fermer un salon de jeu',
                    emoji: '🚫'
                },
                {
                    label: '🔙 Retour',
                    value: 'back_main',
                    description: 'Retour au menu principal',
                    emoji: '😘'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showAddChannelSelector(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('➕ Ajouter Canal de Comptage')
            .setDescription('Sélectionnez un canal à ajouter au système de comptage');

        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('counting_add_channel')
            .setPlaceholder('Sélectionnez un canal...')
            .setChannelTypes([0]);

        const backMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_add_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔙 Retour Gestion Canaux', value: 'back_channels', description: 'Retour au menu canaux', emoji: '🔙' }
            ]);

        const rows = [
            new ActionRowBuilder().addComponents(channelSelect),
            new ActionRowBuilder().addComponents(backMenu)
        ];
        
        await interaction.update({ embeds: [embed], components: rows });
    }

    async showChannelConfigSelector(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        const guildConfig = await this.normalizeGuildConfig(interaction, config, guildId);
        const channels = guildConfig.channels || [];

        if (channels.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Aucun Canal')
                .setDescription('Aucun canal configuré à modifier');

            await interaction.update({ embeds: [embed], components: [] });
            
            setTimeout(() => {
                this.showChannelsManagement(interaction).catch(console.error);
            }, 2000);
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('⚙️ Configurer Canal')
            .setDescription('Sélectionnez un canal à configurer');

        const options = [];
        for (const channel of channels) {
            try {
                const discordChannel = await interaction.guild.channels.fetch(channel.channelId);
                if (discordChannel) {
                    const status = channel.enabled ? '🟢' : '🔴';
                    options.push({
                        label: `${status} #${discordChannel.name}`,
                        description: `Record: ${channel.record || 0} | Actuel: ${channel.currentNumber || 0}`,
                        value: channel.channelId,
                        emoji: '⚙️'
                    });
                } else {
                    // Exclure automatiquement les canaux supprimés de la configuration
                    continue;
                }
            } catch (error) {
                // Exclure automatiquement les canaux supprimés de la configuration
                continue;
            }
        }

        const channelSelect = new StringSelectMenuBuilder()
            .setCustomId('counting_configure_channel')
            .setPlaceholder('Sélectionnez un canal à configurer...')
            .addOptions(options);

        const backMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_config_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔙 Retour Gestion Canaux', value: 'back_channels', description: 'Retour au menu canaux', emoji: '🔙' }
            ]);

        const rows = [
            new ActionRowBuilder().addComponents(channelSelect),
            new ActionRowBuilder().addComponents(backMenu)
        ];
        
        await interaction.update({ embeds: [embed], components: rows });
    }

    async showGlobalSettings(interaction) {
        const config = await this.dataManager.loadData('counting.json', {});
        const globalConfig = config.global || { 
            autoReset: true, 
            allowCalculations: true, 
            maxNumber: 1000000,
            resetOnError: true 
        };

        const embed = new EmbedBuilder()
            .setColor('#9c27b0')
            .setTitle('⚙️ Règles du Jeu Coquin')
            .setDescription('Personnalisez votre expérience boys & girls! 🔥')
            .addFields([
                { 
                    name: '🔄 Punition automatique', 
                    value: globalConfig.autoReset ? '✅ Les coquins sont punis' : '❌ Mode clément', 
                    inline: true 
                },
                { 
                    name: '🧮 Calculs sexy', 
                    value: globalConfig.allowCalculations ? '✅ 69+420 = ? 😏' : '❌ Nombres simples seulement', 
                    inline: true 
                },
                { 
                    name: '💋 Limite du plaisir', 
                    value: (globalConfig.maxNumber || 1000000) === 999999999 ? '♾️ Sans limites! 🥵' : `${(globalConfig.maxNumber || 1000000).toLocaleString()} max`, 
                    inline: true 
                },
                { 
                    name: '⚠️ Tolérance zéro', 
                    value: globalConfig.resetOnError ? '✅ Les erreurs sont punies' : '❌ Mode doux', 
                    inline: true 
                }
            ])
            .setFooter({ text: 'Ajustez les règles pour plus de fun! 😈' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_global_options')
            .setPlaceholder('Quelle règle modifier? 😏')
            .addOptions([
                {
                    label: 'Punition Auto',
                    value: 'toggle_auto_reset',
                    description: 'Punir automatiquement les erreurs',
                    emoji: '🔥'
                },
                {
                    label: 'Calculs Coquins',
                    value: 'toggle_calculations',
                    description: 'Autoriser les maths sexy',
                    emoji: '🧮'
                },
                {
                    label: 'Limite Maximum',
                    value: 'set_max_number',
                    description: 'Jusqu\'où peuvent-ils aller?',
                    emoji: '💦'
                },
                {
                    label: 'Mode Strict',
                    value: 'toggle_reset_error',
                    description: 'Punir toutes les erreurs',
                    emoji: '😈'
                },
                {
                    label: '🔙 Retour',
                    value: 'back_main',
                    description: 'Retour au menu principal',
                    emoji: '😘'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showRecordsManagement(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        const channels = config[guildId]?.channels || [];

        // Calculer les records
        let totalRecord = 0;
        let recordsList = 'Aucun champion encore... Soyez le premier! 🔥';
        
        if (channels.length > 0) {
            const records = [];
            for (const channel of channels) {
                if (channel.record > 0) {
                    try {
                        const discordChannel = await interaction.guild.channels.fetch(channel.channelId);
                        if (discordChannel) {
                            const recordUser = channel.recordUserId ? `<@${channel.recordUserId}>` : 'Anonyme';
                            records.push(`💋 **#${discordChannel.name}**: ${channel.record} points (Champion: ${recordUser})`);
                            totalRecord += channel.record;
                        }
                    } catch (error) {
                        records.push(`💔 Salon supprimé: **${channel.record}** points`);
                        totalRecord += channel.record;
                    }
                }
            }
            if (records.length > 0) {
                recordsList = records.join('\n');
            }
        }

        const embed = new EmbedBuilder()
            .setColor('#ff006e')
            .setTitle('🏆 Hall of Fame des Boys & Girls')
            .setDescription('Les champions du jeu coquin! Qui battra ces records? 😈')
            .addFields([
                { 
                    name: '🔥 Score Total Combiné', 
                    value: `${totalRecord.toLocaleString()} points de plaisir`, 
                    inline: true 
                },
                { 
                    name: '💋 Records par Salon', 
                    value: recordsList, 
                    inline: false 
                }
            ])
            .setFooter({ text: 'Les vrais champions jouent ensemble! 🍑' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_records_options')
            .setPlaceholder('Gérer les records... 😏')
            .addOptions([
                {
                    label: '🗑️ Reset un record',
                    value: 'reset_specific_record',
                    description: 'Effacer le record d\'un salon',
                    emoji: '💦'
                },
                {
                    label: '🔥 Reset TOUS les records',
                    value: 'reset_all_records',
                    description: 'Tout remettre à zéro (danger!)',
                    emoji: '😱'
                },
                {
                    label: '📋 Sauvegarder les champions',
                    value: 'export_records',
                    description: 'Exporter la liste des records',
                    emoji: '📸'
                },
                {
                    label: '🔙 Retour',
                    value: 'back_main',
                    description: 'Retour au menu principal',
                    emoji: '😘'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showCountingStats(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        const channels = config[guildId]?.channels || [];

        // Statistiques
        const activeChannels = channels.filter(ch => ch.enabled).length;
        const totalChannels = channels.length;
        const totalRecord = channels.reduce((sum, ch) => sum + (ch.record || 0), 0);
        const avgRecord = totalChannels > 0 ? Math.round(totalRecord / totalChannels) : 0;

        const embed = new EmbedBuilder()
            .setColor('#1abc9c')
            .setTitle('📊 Statistiques du Comptage')
            .setDescription('Données et performances du système')
            .addFields([
                { 
                    name: '📱 Canaux Actifs', 
                    value: `${activeChannels}/${totalChannels}`, 
                    inline: true 
                },
                { 
                    name: '🏆 Record Total', 
                    value: totalRecord.toLocaleString(), 
                    inline: true 
                },
                { 
                    name: '📈 Moyenne Records', 
                    value: avgRecord.toLocaleString(), 
                    inline: true 
                },
                { 
                    name: '🧮 Calculs Autorisés', 
                    value: config.global?.allowCalculations ? 'Oui' : 'Non', 
                    inline: true 
                },
                { 
                    name: '🔄 Auto-Reset', 
                    value: config.global?.autoReset ? 'Activé' : 'Désactivé', 
                    inline: true 
                },
                { 
                    name: '🔢 Limite Max', 
                    value: (config.global?.maxNumber || 1000000).toLocaleString(), 
                    inline: true 
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_stats_back')
            .setPlaceholder('Retour au menu principal')
            .addOptions([
                {
                    label: '🔙 Retour Menu Principal',
                    value: 'back_main',
                    description: 'Retour au menu principal',
                    emoji: '🔙'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async handleChannelsMenu(interaction) {
        const value = interaction.values[0];
        switch (value) {
            case 'add_channel':
                await this.showAddChannelSelector(interaction);
                break;
            case 'configure_channel':
                await this.showChannelConfigSelector(interaction);
                break;
            case 'remove_channel':
                await this.showRemoveChannelSelector(interaction);
                break;
            case 'back_main':
                await this.showMainConfigMenu(interaction);
                break;
        }
    }

    async handleAddChannel(interaction) {
        const guildId = interaction.guild.id;
        const channelId = interaction.values[0];
        const config = await this.dataManager.loadData('counting.json', {});
        
        if (!config[guildId]) {
            config[guildId] = { channels: [] };
        }

        // Vérifier si le canal n'est pas déjà ajouté
        const existingChannel = config[guildId].channels.find(ch => ch.channelId === channelId);
        if (existingChannel) {
            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Canal Déjà Ajouté')
                .setDescription(`<#${channelId}> est déjà configuré pour le comptage`);

            await interaction.update({ embeds: [embed], components: [] });
            return;
        }

        // Ajouter le nouveau canal (schéma normalisé)
        config[guildId].channels.push({
            channelId: channelId,
            enabled: true,
            currentNumber: 0,
            record: 0,
            lastUserId: null,
            lastMessageId: null,
            lastTimestamp: new Date().toISOString()
        });

        await this.dataManager.saveData('counting.json', config);

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('✅ Canal Ajouté')
            .setDescription(`<#${channelId}> ajouté au système de comptage avec succès !`);

        await interaction.update({ embeds: [embed], components: [] });
    }

    async showRemoveChannelSelector(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        const channels = config[guildId]?.channels || [];

        if (channels.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Aucun Canal')
                .setDescription('Aucun canal configuré à supprimer');

            await interaction.update({ embeds: [embed], components: [] });
            
            setTimeout(() => {
                this.showChannelsManagement(interaction).catch(console.error);
            }, 2000);
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🗑️ Retirer Canal')
            .setDescription('Sélectionnez un canal à supprimer du système');

        const options = [];
        for (const channel of channels) {
            try {
                const discordChannel = await interaction.guild.channels.fetch(channel.channelId);
                if (discordChannel) {
                    options.push({
                        label: `#${discordChannel.name}`,
                        description: `Record: ${channel.record || 0}`,
                        value: channel.channelId,
                        emoji: '🗑️'
                    });
                } else {
                    // Canal existe en cache mais pas sur Discord
                    options.push({
                        label: `Canal supprimé (ID: ${channel.channelId.slice(-4)})`,
                        description: `Nettoyer ce canal de la configuration`,
                        value: channel.channelId,
                        emoji: '🚫'
                    });
                }
            } catch (error) {
                // Canal n'existe plus sur Discord
                options.push({
                    label: `Canal supprimé (ID: ${channel.channelId.slice(-4)})`,
                    description: `Nettoyer ce canal de la configuration`,
                    value: channel.channelId,
                    emoji: '🚫'
                });
            }
        }

        const channelSelect = new StringSelectMenuBuilder()
            .setCustomId('counting_remove_channel')
            .setPlaceholder('Sélectionnez un canal à supprimer...')
            .addOptions(options);

        const backMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_remove_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔙 Retour Gestion Canaux', value: 'back_channels', description: 'Retour au menu canaux', emoji: '🔙' }
            ]);

        const rows = [
            new ActionRowBuilder().addComponents(channelSelect),
            new ActionRowBuilder().addComponents(backMenu)
        ];
        
        await interaction.update({ embeds: [embed], components: rows });
    }

    // Handlers pour les options globales
    async handleGlobalOptions(interaction) {
        const value = interaction.values[0];
        switch (value) {
            case 'toggle_auto_reset':
                await this.toggleAutoReset(interaction);
                break;
            case 'toggle_calculations':
                await this.toggleCalculations(interaction);
                break;
            case 'set_max_number':
                await this.setMaxNumber(interaction);
                break;
            case 'toggle_reset_error':
                await this.toggleResetError(interaction);
                break;
            case 'back_main':
                await this.showMainConfigMenu(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Option non reconnue', flags: 64 });
        }
    }

    async handleRecordsMenu(interaction) {
        const value = interaction.values[0];
        switch (value) {
            case 'reset_specific_record':
                await this.resetSpecificRecord(interaction);
                break;
            case 'reset_all_records':
                await this.resetAllRecords(interaction);
                break;
            case 'export_records':
                await this.exportRecords(interaction);
                break;
            case 'back_main':
                await this.showMainConfigMenu(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Option non reconnue', flags: 64 });
        }
    }

    async toggleAutoReset(interaction) {
        const config = await this.dataManager.loadData('counting.json', {});
        if (!config.global) config.global = {};
        
        config.global.autoReset = !config.global.autoReset;
        await this.dataManager.saveData('counting.json', config);

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('✅ Auto-Reset Modifié')
            .setDescription(`Auto-reset ${config.global.autoReset ? 'activé' : 'désactivé'}`);

        await interaction.update({ embeds: [embed], components: [] });
        
        setTimeout(() => {
            this.showGlobalSettings(interaction).catch(console.error);
        }, 2000);
    }

    async toggleCalculations(interaction) {
        const config = await this.dataManager.loadData('counting.json', {});
        if (!config.global) config.global = {};
        
        config.global.allowCalculations = !config.global.allowCalculations;
        await this.dataManager.saveData('counting.json', config);

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('✅ Calculs Modifiés')
            .setDescription(`Calculs ${config.global.allowCalculations ? 'autorisés' : 'interdits'}`);

        await interaction.update({ embeds: [embed], components: [] });
        
        setTimeout(() => {
            this.showGlobalSettings(interaction).catch(console.error);
        }, 2000);
    }

    async setMaxNumber(interaction) {
        const config = await this.dataManager.loadData('counting.json', {});
        if (!config.global) config.global = {};
        
        const currentMax = config.global.maxNumber || 1000000;

        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('🔢 Nombre Maximum')
            .setDescription('Sélectionnez la limite maximale pour le comptage')
            .addFields([
                { 
                    name: '📊 Limite Actuelle', 
                    value: currentMax === 999999999 ? '♾️ Illimité' : currentMax.toLocaleString(), 
                    inline: true 
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_set_max_number')
            .setPlaceholder('Choisissez une limite...')
            .addOptions([
                {
                    label: '1,000',
                    value: '1000',
                    description: 'Limite basse pour petits serveurs'
                },
                {
                    label: '10,000',
                    value: '10000',
                    description: 'Limite modérée'
                },
                {
                    label: '100,000',
                    value: '100000',
                    description: 'Limite élevée'
                },
                {
                    label: '1,000,000',
                    value: '1000000',
                    description: 'Limite très élevée (défaut)'
                },
                {
                    label: '♾️ Illimité',
                    value: '999999999',
                    description: 'Aucune limite de comptage',
                    emoji: '♾️'
                },
                {
                    label: '🔙 Retour',
                    value: 'back_global',
                    description: 'Retour aux paramètres globaux'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async toggleResetError(interaction) {
        const config = await this.dataManager.loadData('counting.json', {});
        if (!config.global) config.global = {};
        
        config.global.resetOnError = !config.global.resetOnError;
        await this.dataManager.saveData('counting.json', config);

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('✅ Reset sur Erreur Modifié')
            .setDescription(`Reset sur erreur ${config.global.resetOnError ? 'activé' : 'désactivé'}`);

        await interaction.update({ embeds: [embed], components: [] });
        
        setTimeout(() => {
            this.showGlobalSettings(interaction).catch(console.error);
        }, 2000);
    }

    async resetSpecificRecord(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('🗑️ Reset Record Spécifique')
            .setDescription('Sélectionnez le canal dont vous voulez remettre le record à zéro');

        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        const channels = config[guildId]?.channels || [];

        if (channels.length === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Aucun Canal')
                .setDescription('Aucun canal configuré');

            await interaction.update({ embeds: [errorEmbed], components: [] });
            
            setTimeout(() => {
                this.showRecordsManagement(interaction).catch(console.error);
            }, 2000);
            return;
        }

        const options = [];
        for (const channel of channels) {
            try {
                const discordChannel = await interaction.guild.channels.fetch(channel.channelId);
                if (discordChannel && channel.record > 0) {
                    options.push({
                        label: `#${discordChannel.name}`,
                        description: `Record actuel: ${channel.record}`,
                        value: channel.channelId,
                        emoji: '🗑️'
                    });
                }
            } catch (error) {
                // Canal supprimé, ignorer
            }
        }

        if (options.length === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Aucun Record')
                .setDescription('Aucun canal n\'a de record à reset');

            await interaction.update({ embeds: [errorEmbed], components: [] });
            
            setTimeout(() => {
                this.showRecordsManagement(interaction).catch(console.error);
            }, 2000);
            return;
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_reset_specific')
            .setPlaceholder('Choisissez un canal...')
            .addOptions(options);

        const backMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_reset_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔙 Retour Gestion Records', value: 'back_records', description: 'Retour au menu records', emoji: '🔙' }
            ]);

        const rows = [
            new ActionRowBuilder().addComponents(selectMenu),
            new ActionRowBuilder().addComponents(backMenu)
        ];
        
        await interaction.update({ embeds: [embed], components: rows });
    }

    async resetAllRecords(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        
        if (config[guildId]?.channels) {
            config[guildId].channels.forEach(channel => {
                channel.record = 0;
                channel.currentNumber = 0;
            });
            await this.dataManager.saveData('counting.json', config);
        }

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('✅ Records Reset')
            .setDescription('Tous les records ont été remis à zéro');

        await interaction.update({ embeds: [embed], components: [] });
        
        setTimeout(() => {
            this.showRecordsManagement(interaction).catch(console.error);
        }, 2000);
    }

    async exportRecords(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        const channels = config[guildId]?.channels || [];

        let exportData = `📊 Records de Comptage - ${interaction.guild.name}\n`;
        exportData += `Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;

        if (channels.length === 0) {
            exportData += 'Aucun canal configuré';
        } else {
            for (const channel of channels) {
                try {
                    const discordChannel = await interaction.guild.channels.fetch(channel.channelId);
                    if (discordChannel) {
                        exportData += `#${discordChannel.name}: ${channel.record || 0}\n`;
                    }
                } catch (error) {
                    exportData += `Canal supprimé (${channel.channelId}): ${channel.record || 0}\n`;
                }
            }
        }

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('📋 Export des Records')
            .setDescription('```\n' + exportData + '```');

        await interaction.update({ embeds: [embed], components: [] });
        
        setTimeout(() => {
            this.showRecordsManagement(interaction).catch(console.error);
        }, 2000);
    }

    // Méthodes d'alias pour compatibilité avec le router
    async handleChannelsOptions(interaction) {
        return await this.handleChannelsMenu(interaction);
    }

    async handleGlobalSettings(interaction) {
        return await this.showGlobalSettings(interaction);
    }

    async handleConfigureChannel(interaction) {
        return await this.showChannelConfigSelector(interaction);
    }

    async handleRecordsOptions(interaction) {
        return await this.handleRecordsMenu(interaction);
    }

    async handleResetSpecific(interaction) {
        const guildId = interaction.guild.id;
        const channelId = interaction.values[0];
        const config = await this.dataManager.loadData('counting.json', {});
        
        if (config[guildId]?.channels) {
            const channel = config[guildId].channels.find(ch => ch.channelId === channelId);
            if (channel) {
                const oldRecord = channel.record;
                channel.record = 0;
                channel.currentNumber = 0;
                await this.dataManager.saveData('counting.json', config);

                const embed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('✅ Record Reset')
                    .setDescription(`Record de <#${channelId}> remis à zéro (ancien: ${oldRecord})`);

                await interaction.update({ embeds: [embed], components: [] });
                
                setTimeout(async () => {
                    try {
                        await this.showRecordsManagement(interaction);
                    } catch (error) {
                        console.error('Erreur retour records:', error);
                    }
                }, 2000);
                return;
            }
        }

        const errorEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('❌ Erreur')
            .setDescription('Canal non trouvé dans la configuration');

        await interaction.update({ embeds: [errorEmbed], components: [] });
        
        setTimeout(async () => {
            try {
                await this.showRecordsManagement(interaction);
            } catch (error) {
                console.error('Erreur retour records:', error);
            }
        }, 2000);
    }

    async handleSetMaxNumber(interaction) {
        const value = interaction.values[0];
        
        if (value === 'back_global') {
            await this.showGlobalSettings(interaction);
            return;
        }

        const config = await this.dataManager.loadData('counting.json', {});
        if (!config.global) config.global = {};
        
        const newMax = parseInt(value);
        config.global.maxNumber = newMax;
        await this.dataManager.saveData('counting.json', config);

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('✅ Limite Modifiée')
            .setDescription(`Nombre maximum défini à: ${newMax === 999999999 ? '♾️ Illimité' : newMax.toLocaleString()}`);

        await interaction.update({ embeds: [embed], components: [] });
        
        setTimeout(async () => {
            try {
                await this.showGlobalSettings(interaction);
            } catch (error) {
                console.error('Erreur retour global settings:', error);
            }
        }, 2000);
    }
    async handleConfigureChannel(interaction) {
        const guildId = interaction.guild.id;
        const channelId = interaction.values[0];
        const config = await this.dataManager.loadData('counting.json', {});
        
        const channel = config[guildId]?.channels?.find(ch => ch.channelId === channelId);
        
        if (!channel) {
            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Canal Introuvable')
                .setDescription(`Canal non trouvé dans la configuration`);

            await interaction.update({ embeds: [embed], components: [] });
            return;
        }

        // Afficher le menu de configuration du canal
        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle(`⚙️ Configuration de <#${channelId}>`)
            .setDescription(`Gérez les paramètres de ce canal de comptage`)
            .addFields([
                { name: '📊 État', value: channel.enabled ? '🟢 Activé' : '🔴 Désactivé', inline: true },
                { name: '🏆 Record', value: `${channel.record || 0}`, inline: true },
                { name: '🔢 Actuel', value: `${channel.current || 0}`, inline: true }
            ]);

        const configMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_channel_settings')
            .setPlaceholder('Choisissez une option...')
            .addOptions([
                { label: '🔄 Activer/Désactiver', value: `toggle_${channelId}`, description: 'Basculer l\'état du canal', emoji: '🔄' },
                { label: '📈 Reset Compteur', value: `reset_current_${channelId}`, description: 'Remettre le compteur à 0', emoji: '📈' },
                { label: '🏆 Reset Record', value: `reset_record_${channelId}`, description: 'Remettre le record à 0', emoji: '🏆' },
                { label: '🔙 Retour', value: 'back_channels', description: 'Retour à la gestion des canaux', emoji: '🔙' }
            ]);

        const row = new ActionRowBuilder().addComponents(configMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async handleRemoveChannel(interaction) {
        const guildId = interaction.guild.id;
        const channelId = interaction.values[0];
        const config = await this.dataManager.loadData('counting.json', {});
        
        console.log(`🗑️ Tentative suppression canal: ${channelId}`);
        
        if (!config[guildId]) {
            config[guildId] = { channels: [] };
        }

        // Supprimer le canal de la configuration
        const initialCount = config[guildId].channels.length;
        config[guildId].channels = config[guildId].channels.filter(ch => ch.channelId !== channelId);
        
        if (config[guildId].channels.length < initialCount) {
            await this.dataManager.saveData('counting.json', config);
            
            console.log(`✅ Canal ${channelId} supprimé avec succès`);
            
            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ Canal Supprimé')
                .setDescription(`Le canal a été retiré du système de comptage avec succès !`);

            // Utiliser reply au lieu d'update pour éviter les erreurs d'interaction
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed], components: [] });
            } else {
                await interaction.reply({ embeds: [embed], components: [], flags: 64 });
            }
            
            // Retourner au menu après 2 secondes
            setTimeout(async () => {
                try {
                    await this.showChannelsManagement(interaction);
                } catch (error) {
                    console.error('Erreur retour menu:', error);
                }
            }, 2000);
            
        } else {
            console.log(`❌ Canal ${channelId} non trouvé dans la configuration`);
            
            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Canal Introuvable')
                .setDescription(`Canal non trouvé dans la configuration`);

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed], components: [] });
            } else {
                await interaction.reply({ embeds: [embed], components: [], flags: 64 });
            }
        }
    }

    /**
     * Méthode principale pour gérer toutes les interactions de comptage
     * Appelée par MainRouterHandler
     */
    async handleCountingSelect(interaction) {
        const customId = interaction.customId;
        
        try {
            // Router selon le customId
            switch (customId) {
                case 'counting_config_main':
                    await this.handleMainMenu(interaction);
                    break;
                    
                case 'counting_channels_menu':
                    await this.handleChannelsMenu(interaction);
                    break;
                    
                case 'counting_add_channel':
                    await this.handleAddChannel(interaction);
                    break;
                    
                case 'counting_configure_channel':
                    await this.handleConfigureChannel(interaction);
                    break;
                    
                case 'counting_remove_channel':
                    await this.handleRemoveChannel(interaction);
                    break;
                    
                case 'counting_global_options':
                    await this.handleGlobalSettings(interaction);
                    break;
                    
                case 'counting_records_options':
                    await this.handleRecordsOptions(interaction);
                    break;
                    
                case 'counting_set_max_number':
                    await this.handleSetMaxNumber(interaction);
                    break;
                    
                case 'counting_reset_specific':
                    await this.handleResetSpecific(interaction);
                    break;
                    
                case 'counting_channel_settings':
                    await this.handleChannelsOptions(interaction);
                    break;
                    
                // Boutons de retour
                case 'counting_add_back':
                case 'counting_config_back':
                case 'counting_stats_back':
                case 'counting_remove_back':
                case 'counting_reset_back':
                    await this.showMainConfigMenu(interaction);
                    break;
                    
                default:
                    console.log(`⚠️ Interaction de comptage non gérée: ${customId}`);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Interaction de comptage non reconnue.',
                            flags: 64
                        });
                    }
                    break;
            }
        } catch (error) {
            console.error('❌ Erreur handleCountingSelect:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Erreur lors du traitement de l\'interaction de comptage.',
                    flags: 64
                });
            }
        }
    }
}

module.exports = CountingConfigHandler;