/**
 * BUMP INTERACTION HANDLER
 * Gestionnaire des interactions (boutons, menus) pour le système de bump
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

class BumpInteractionHandler {
    constructor(bumpManager) {
        this.bumpManager = bumpManager;
        this.pendingConfigurations = new Map(); // Store temporary configurations
    }

    /**
     * Gère toutes les interactions liées au bump
     */
    async handleInteraction(interaction) {
        if (!interaction.isButton() && !interaction.isStringSelectMenu()) return false;

        const customId = interaction.customId;

        // Vérifier si c'est une interaction bump
        if (!customId.startsWith('bump_')) return false;

        try {
            // Vérifier les permissions pour les interactions de configuration
            if (customId.includes('config') && !interaction.member.permissions.has('ManageGuild')) {
                return await interaction.reply({
                    content: '❌ Vous devez avoir la permission "Gérer le serveur" pour utiliser cette fonctionnalité.',
                    ephemeral: true
                });
            }

            await interaction.deferUpdate();

            switch (customId) {
                case 'bump_platform_select':
                    await this.handlePlatformSelect(interaction);
                    break;

                case 'bump_all':
                    await this.handleBumpAll(interaction);
                    break;

                case 'bump_refresh':
                    await this.handleRefresh(interaction);
                    break;

                case 'bump_config':
                    await this.handleConfigButton(interaction);
                    break;

                case 'bump_config_platforms':
                    await this.handleConfigPlatformsSelect(interaction);
                    break;

                case 'bump_config_save':
                    await this.handleConfigSave(interaction);
                    break;

                case 'bump_config_cancel':
                    await this.handleConfigCancel(interaction);
                    break;

                default:
                    // Gestion des boutons de confirmation dynamiques
                    if (customId.startsWith('bump_confirm_')) {
                        const platforms = customId.replace('bump_confirm_', '').split(',');
                        await this.performBumpAction(interaction, platforms);
                        return true;
                    }
                    
                    if (customId === 'bump_cancel_action') {
                        await this.handleRefresh(interaction);
                        return true;
                    }
                    
                    return false;
            }

            return true;

        } catch (error) {
            console.error('❌ Error handling bump interaction:', error);
            
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ Une erreur est survenue lors du traitement de l\'interaction.',
                        components: []
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors du traitement de l\'interaction.',
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
     * Gère la sélection de plateformes pour le bump
     */
    async handlePlatformSelect(interaction) {
        const selectedPlatforms = interaction.values;
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        if (selectedPlatforms.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Aucune plateforme sélectionnée')
                .setDescription('Veuillez sélectionner au moins une plateforme à bump.')
                .setColor('#ff6b6b');

            return await interaction.editReply({ 
                embeds: [embed],
                components: []
            });
        }

        // Créer l'embed de confirmation
        const platformsList = selectedPlatforms
            .map(platform => `${this.bumpManager.platforms[platform].emoji} ${this.bumpManager.platforms[platform].name}`)
            .join('\n');

        const embed = new EmbedBuilder()
            .setTitle('🚀 Confirmation de Bump')
            .setDescription('Êtes-vous sûr de vouloir bumper le serveur sur les plateformes suivantes ?')
            .addFields({ name: 'Plateformes sélectionnées', value: platformsList })
            .setColor('#ffcc00');

        const confirmButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`bump_confirm_${selectedPlatforms.join(',')}`)
                    .setLabel('Confirmer le Bump')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId('bump_cancel_action')
                    .setLabel('Annuler')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('❌')
            );

        await interaction.editReply({
            embeds: [embed],
            components: [confirmButtons]
        });
    }

    /**
     * Gère le bump de toutes les plateformes disponibles
     */
    async handleBumpAll(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const cooldownInfo = await this.bumpManager.checkCooldowns(guildId, userId);
        
        if (cooldownInfo.canBump.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('⏰ Aucune plateforme disponible')
                .setDescription('Toutes les plateformes sont actuellement en cooldown.')
                .setColor('#ff6b6b');

            return await interaction.editReply({ 
                embeds: [embed],
                components: []
            });
        }

        await this.performBumpAction(interaction, cooldownInfo.canBump);
    }

    /**
     * Actualise le statut des bumps
     */
    async handleRefresh(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const cooldownInfo = await this.bumpManager.checkCooldowns(guildId, userId);
        const embed = this.bumpManager.createBumpStatusEmbed(guildId, cooldownInfo);

        const components = [];

        // Menu de sélection si des plateformes sont disponibles
        if (cooldownInfo.canBump.length > 0) {
            const selectMenu = this.bumpManager.createPlatformSelectMenu(cooldownInfo.canBump);
            components.push(selectMenu);
        }

        // Boutons d'action
        const actionButtons = this.bumpManager.createActionButtons(cooldownInfo.canBump.length > 0);
        components.push(actionButtons);

        await interaction.editReply({
            embeds: [embed],
            components: components
        });
    }

    /**
     * Affiche la configuration rapide
     */
    async handleConfigButton(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.bumpManager.getBumpConfig(guildId);

        const embed = new EmbedBuilder()
            .setTitle('⚙️ Configuration Rapide')
            .setDescription('Sélectionnez les plateformes que vous souhaitez activer.')
            .setColor('#5865F2');

        // Créer le menu de sélection des plateformes
        const platforms = Object.keys(this.bumpManager.platforms);
        const options = platforms.map(platform => {
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
                    .setLabel('Retour')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔙')
            );

        await interaction.editReply({
            embeds: [embed],
            components: [selectMenu, saveButton]
        });
    }

    /**
     * Gère la sélection des plateformes dans la configuration
     */
    async handleConfigPlatformsSelect(interaction) {
        const selectedPlatforms = interaction.values;
        const guildId = interaction.guild.id;

        // Stocker temporairement la sélection
        this.pendingConfigurations.set(`${guildId}_${interaction.user.id}`, selectedPlatforms);

        // Mettre à jour l'embed pour montrer la sélection
        const embed = new EmbedBuilder()
            .setTitle('⚙️ Configuration des Plateformes')
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

        // Réafficher le menu avec les nouveaux defaults
        const platforms = Object.keys(this.bumpManager.platforms);
        const options = platforms.map(platform => {
            const platformInfo = this.bumpManager.platforms[platform];
            const isSelected = selectedPlatforms.includes(platform);
            
            return {
                label: platformInfo.name,
                value: platform,
                description: `Cooldown: ${platformInfo.cooldown / (1000 * 60 * 60)}h ${isSelected ? '• SÉLECTIONNÉ' : ''}`,
                emoji: platformInfo.emoji,
                default: isSelected
            };
        });

        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('bump_config_platforms')
                    .setPlaceholder('Plateformes sélectionnées')
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

        await interaction.editReply({
            embeds: [embed],
            components: [selectMenu, saveButton]
        });
    }

    /**
     * Sauvegarde la configuration
     */
    async handleConfigSave(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const configKey = `${guildId}_${userId}`;

        const selectedPlatforms = this.pendingConfigurations.get(configKey) || [];
        this.pendingConfigurations.delete(configKey);

        const config = await this.bumpManager.getBumpConfig(guildId);
        config.enabledPlatforms = selectedPlatforms;

        const success = await this.bumpManager.updateBumpConfig(guildId, config);

        if (success) {
            const embed = new EmbedBuilder()
                .setTitle('✅ Configuration sauvegardée')
                .setDescription('La configuration des plateformes a été mise à jour avec succès.')
                .setColor('#00ff00');

            if (selectedPlatforms.length > 0) {
                const platformsList = selectedPlatforms
                    .map(platform => `${this.bumpManager.platforms[platform].emoji} ${this.bumpManager.platforms[platform].name}`)
                    .join('\n');
                embed.addFields({ name: 'Plateformes activées', value: platformsList });
            } else {
                embed.addFields({ name: 'Plateformes activées', value: 'Aucune' });
            }

            const backButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('bump_refresh')
                        .setLabel('Retour au Bump')
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
     * Annule la configuration
     */
    async handleConfigCancel(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const configKey = `${guildId}_${userId}`;

        // Nettoyer la configuration temporaire
        this.pendingConfigurations.delete(configKey);

        // Retourner au statut des bumps
        await this.handleRefresh(interaction);
    }

    /**
     * Effectue l'action de bump sur les plateformes sélectionnées
     */
    async performBumpAction(interaction, platforms) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        // Embed de progression
        const progressEmbed = new EmbedBuilder()
            .setTitle('🚀 Bump en cours...')
            .setDescription('Envoi en cours sur les plateformes sélectionnées.')
            .setColor('#ffcc00');

        await interaction.editReply({
            embeds: [progressEmbed],
            components: []
        });

        // Effectuer le bump
        const results = await this.bumpManager.performBump(guildId, userId, platforms);

        // Créer l'embed de résultats
        const resultsEmbed = new EmbedBuilder()
            .setTitle('📊 Résultats du Bump')
            .setTimestamp();

        const successPlatforms = results.filter(r => r.success);
        const failedPlatforms = results.filter(r => !r.success);

        if (successPlatforms.length > 0) {
            const successText = successPlatforms
                .map(r => `${this.bumpManager.platforms[r.platform].emoji} ${this.bumpManager.platforms[r.platform].name}`)
                .join('\n');
            resultsEmbed.addFields({ name: '✅ Succès', value: successText, inline: true });
        }

        if (failedPlatforms.length > 0) {
            const failedText = failedPlatforms
                .map(r => `${this.bumpManager.platforms[r.platform].emoji} ${this.bumpManager.platforms[r.platform].name}`)
                .join('\n');
            resultsEmbed.addFields({ name: '❌ Échecs', value: failedText, inline: true });
        }

        // Définir la couleur en fonction des résultats
        if (failedPlatforms.length === 0) {
            resultsEmbed.setColor('#00ff00').setDescription('Tous les bumps ont été effectués avec succès !');
        } else if (successPlatforms.length === 0) {
            resultsEmbed.setColor('#ff0000').setDescription('Tous les bumps ont échoué.');
        } else {
            resultsEmbed.setColor('#ffcc00').setDescription('Certains bumps ont réussi, d\'autres ont échoué.');
        }

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('bump_refresh')
                    .setLabel('Nouveau Bump')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔄')
            );

        await interaction.editReply({
            embeds: [resultsEmbed],
            components: [backButton]
        });
    }
}

module.exports = BumpInteractionHandler;