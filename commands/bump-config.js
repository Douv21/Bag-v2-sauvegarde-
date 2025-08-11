/**
 * COMMANDE BUMP-CONFIG
 * Configuration du système de bump multi-plateforme
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bump-config')
        .setDescription('Configurer le système de bump multi-plateforme')
        .addSubcommand(subcommand =>
            subcommand
                .setName('plateformes')
                .setDescription('Activer/désactiver les plateformes de bump')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('channel')
                .setDescription('Définir le channel par défaut pour les bumps')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel pour les notifications de bump')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('message')
                .setDescription('Configurer le message personnalisé de bump')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Message personnalisé (laisser vide pour réinitialiser)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reminder')
                .setDescription('Activer/désactiver les rappels automatiques')
                .addBooleanOption(option =>
                    option.setName('activer')
                        .setDescription('Activer les rappels automatiques')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Afficher la configuration actuelle')
        ),

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

            const subcommand = interaction.options.getSubcommand();
            const guildId = interaction.guild.id;

            await interaction.deferReply();

            switch (subcommand) {
                case 'plateformes':
                    await this.handlePlatformsConfig(interaction, bumpManager, guildId);
                    break;

                case 'channel':
                    await this.handleChannelConfig(interaction, bumpManager, guildId);
                    break;

                case 'message':
                    await this.handleMessageConfig(interaction, bumpManager, guildId);
                    break;

                case 'reminder':
                    await this.handleReminderConfig(interaction, bumpManager, guildId);
                    break;

                case 'status':
                    await this.handleStatusConfig(interaction, bumpManager, guildId);
                    break;
            }

        } catch (error) {
            console.error('❌ Error in bump-config command:', error);
            
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors de la configuration.',
                });
            } else {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors de la configuration.',
                    ephemeral: true
                });
            }
        }
    },

    async handlePlatformsConfig(interaction, bumpManager, guildId) {
        const config = await bumpManager.getBumpConfig(guildId);
        
        const embed = new EmbedBuilder()
            .setTitle('⚙️ Configuration des Plateformes')
            .setDescription('Sélectionnez les plateformes que vous souhaitez activer pour le bump automatique.')
            .setColor('#5865F2');

        // Créer le menu de sélection des plateformes
        const platforms = Object.keys(bumpManager.platforms);
        const options = platforms.map(platform => {
            const platformInfo = bumpManager.platforms[platform];
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
                    .setCustomId('bump_config_platforms')
                    .setPlaceholder('Sélectionnez les plateformes à activer')
                    .setMinValues(0)
                    .setMaxValues(options.length)
                    .addOptions(options)
            );

        const saveButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('bump_config_save')
                    .setLabel('Sauvegarder')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💾'),
                new ButtonBuilder()
                    .setCustomId('bump_config_cancel')
                    .setLabel('Annuler')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('❌')
            );

        // Afficher les plateformes actuellement activées
        if (config.enabledPlatforms.length > 0) {
            const enabledText = config.enabledPlatforms
                .map(platform => `${bumpManager.platforms[platform].emoji} ${bumpManager.platforms[platform].name}`)
                .join('\n');
            embed.addFields({ name: 'Plateformes actuelles', value: enabledText, inline: true });
        } else {
            embed.addFields({ name: 'Plateformes actuelles', value: 'Aucune', inline: true });
        }

        await interaction.editReply({
            embeds: [embed],
            components: [selectMenu, saveButton]
        });
    },

    async handleChannelConfig(interaction, bumpManager, guildId) {
        const channel = interaction.options.getChannel('channel');
        const config = await bumpManager.getBumpConfig(guildId);

        config.bumpChannelId = channel.id;
        const success = await bumpManager.updateBumpConfig(guildId, config);

        if (success) {
            const embed = new EmbedBuilder()
                .setTitle('✅ Channel configuré')
                .setDescription(`Le channel ${channel} a été défini comme channel par défaut pour les bumps.`)
                .setColor('#00ff00');

            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply({
                content: '❌ Erreur lors de la sauvegarde de la configuration.'
            });
        }
    },

    async handleMessageConfig(interaction, bumpManager, guildId) {
        const message = interaction.options.getString('message');
        const config = await bumpManager.getBumpConfig(guildId);

        config.customMessage = message || null;
        const success = await bumpManager.updateBumpConfig(guildId, config);

        if (success) {
            const embed = new EmbedBuilder()
                .setTitle('✅ Message configuré')
                .setColor('#00ff00');

            if (message) {
                embed.setDescription('Message personnalisé défini avec succès.')
                    .addFields({ name: 'Nouveau message', value: message });
            } else {
                embed.setDescription('Message personnalisé réinitialisé. Le message par défaut sera utilisé.');
            }

            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply({
                content: '❌ Erreur lors de la sauvegarde de la configuration.'
            });
        }
    },

    async handleReminderConfig(interaction, bumpManager, guildId) {
        const enable = interaction.options.getBoolean('activer');
        const config = await bumpManager.getBumpConfig(guildId);

        config.autoReminder = enable;
        const success = await bumpManager.updateBumpConfig(guildId, config);

        if (success) {
            const embed = new EmbedBuilder()
                .setTitle('✅ Rappels configurés')
                .setDescription(`Les rappels automatiques ont été ${enable ? 'activés' : 'désactivés'}.`)
                .setColor('#00ff00');

            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply({
                content: '❌ Erreur lors de la sauvegarde de la configuration.'
            });
        }
    },

    async handleStatusConfig(interaction, bumpManager, guildId) {
        const config = await bumpManager.getBumpConfig(guildId);
        const guild = interaction.guild;

        const embed = new EmbedBuilder()
            .setTitle('📊 Configuration actuelle')
            .setColor('#5865F2')
            .setTimestamp();

        // Plateformes activées
        if (config.enabledPlatforms.length > 0) {
            const platformsText = config.enabledPlatforms
                .map(platform => `${bumpManager.platforms[platform].emoji} ${bumpManager.platforms[platform].name}`)
                .join('\n');
            embed.addFields({ name: 'Plateformes activées', value: platformsText, inline: true });
        } else {
            embed.addFields({ name: 'Plateformes activées', value: 'Aucune', inline: true });
        }

        // Channel de bump
        if (config.bumpChannelId) {
            const channel = guild.channels.cache.get(config.bumpChannelId);
            embed.addFields({ 
                name: 'Channel par défaut', 
                value: channel ? channel.toString() : 'Channel introuvable', 
                inline: true 
            });
        } else {
            embed.addFields({ name: 'Channel par défaut', value: 'Non défini', inline: true });
        }

        // Rappels automatiques
        embed.addFields({ 
            name: 'Rappels automatiques', 
            value: config.autoReminder ? '✅ Activés' : '❌ Désactivés', 
            inline: true 
        });

        // Message personnalisé
        if (config.customMessage) {
            embed.addFields({ name: 'Message personnalisé', value: config.customMessage });
        }

        // Vérifier les cooldowns actuels
        const cooldownInfo = await bumpManager.checkCooldowns(guildId, interaction.user.id);
        if (cooldownInfo.onCooldown.length > 0) {
            const cooldownText = cooldownInfo.onCooldown
                .map(cd => `${bumpManager.platforms[cd.platform].emoji} ${bumpManager.platforms[cd.platform].name}: ${bumpManager.formatTimeLeft(cd.timeLeft)}`)
                .join('\n');
            embed.addFields({ name: '⏰ Cooldowns actifs', value: cooldownText });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};