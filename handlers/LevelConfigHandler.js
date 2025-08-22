const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const levelManager = require('../utils/levelManager');

class LevelConfigHandler {
    async handleLevelConfigMenu(interaction) {
        const config = levelManager.loadConfig();
        
        // Créer la configuration sécurisée avec des valeurs par défaut
        const safeConfig = {
            textXP: config.textXP || { min: 5, max: 15, cooldown: 60000 },
            voiceXP: config.voiceXP || { amount: 10, interval: 60000, perMinute: 10 },
            notifications: config.notifications || { enabled: true, channelId: null, cardStyle: 'futuristic' },
            roleRewards: config.roleRewards || [],
            levelFormula: config.levelFormula || { baseXP: 100, multiplier: 1.5 },
            leaderboard: config.leaderboard || { limit: 10 }
        };
        
        const embed = new EmbedBuilder()
            .setTitle('⚙️ Configuration Système de Niveaux')
            .setDescription('Gérez tous les aspects du système de niveaux')
            .addFields([
                {
                    name: '💬 XP Messages',
                    value: `Min: ${safeConfig.textXP.min} XP | Max: ${safeConfig.textXP.max} XP\nCooldown: ${safeConfig.textXP.cooldown / 1000}s`,
                    inline: true
                },
                {
                    name: '🎤 XP Vocal',
                    value: `${safeConfig.voiceXP.perMinute || safeConfig.voiceXP.amount || 10} XP/min\nInterval: ${safeConfig.voiceXP.interval / 1000}s`,
                    inline: true
                },
                {
                    name: '📢 Notifications',
                    value: safeConfig.notifications.enabled ? 
                        `✅ Actives\nCanal: ${safeConfig.notifications.channelId ? `<#${safeConfig.notifications.channelId}>` : 'Non défini'}\nStyle: ${safeConfig.notifications.cardStyle}` : 
                        '❌ Désactivées',
                    inline: true
                },
                {
                    name: '🏆 Récompenses Rôles',
                    value: `${safeConfig.roleRewards.length} rôle(s) configuré(s)`,
                    inline: true
                },
                {
                    name: '📊 Formule XP',
                    value: `Base: ${safeConfig.levelFormula.baseXP} XP\nMultiplicateur: ${safeConfig.levelFormula.multiplier}`,
                    inline: true
                },
                {
                    name: '🏅 Classements',
                    value: `Limite affichage: ${safeConfig.leaderboard.limit} utilisateurs`,
                    inline: true
                }
            ])
            .setColor('#5865F2');

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('level_config_menu')
                    .setPlaceholder('Choisissez une section à configurer...')
                    .addOptions([
                        {
                            label: '💬 Configuration XP Messages',
                            description: 'Modifier les gains XP par message',
                            value: 'text_xp'
                        },
                        {
                            label: '🎤 Configuration XP Vocal',
                            description: 'Modifier les gains XP vocal',
                            value: 'voice_xp'
                        },
                        {
                            label: '📢 Configuration Notifications',
                            description: 'Gérer les notifications de niveau',
                            value: 'notifications'
                        },
                        {
                            label: '🏆 Récompenses de Rôles',
                            description: 'Configurer les rôles automatiques',
                            value: 'role_rewards'
                        },
                        {
                            label: '📊 Formule de Niveau',
                            description: 'Ajuster la progression XP',
                            value: 'level_formula'
                        },
                        {
                            label: '🏅 Configuration Classements',
                            description: 'Paramètres des leaderboards',
                            value: 'leaderboard'
                        }
                    ])
            );

        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.update({ embeds: [embed], components: [row] });
            }
        } catch (error) {
            console.error('Erreur update interaction handleLevelConfigMenu:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
            }
        }
    }

    getStyleDescription(style) {
        const descriptions = {
            'futuristic': '🚀 Style futuriste avec effets bleus et technologiques',
            'elegant': '✨ Style élégant avec couleurs violettes et douces',
            'gaming': '🎮 Style gaming avec couleurs orange et énergiques',
            'minimal': '🎯 Style minimal avec design épuré et moderne',
            'holographic': '🌈 Style holographique avec effets glass morphism',
            'gamer': '🎮 Style gamer néon avec circuits et effets lumineux',
            'amour': '💖 Style romantique avec roses et dorés',
            'sensuel': '✨ Style sensuel avec luxe doré et rouge'
        };
        return descriptions[style] || 'Style personnalisé';
    }

    async generatePreviewCard(interaction, style) {
        try {
            const levelCardGenerator = require('../utils/levelCardGenerator');
            
            // Créer des données factices pour l'aperçu
            const fakeUser = {
                displayName: interaction.user.displayName || interaction.user.username,
                displayAvatarURL: () => interaction.user.displayAvatarURL({ format: 'png', size: 128 })
            };
            
            const fakeUserLevel = {
                xp: 1250,
                totalMessages: 45,
                totalVoiceTime: 120000
            };
            
            // Générer la carte avec le nouveau style
            const cardBuffer = await levelCardGenerator.generateCard(
                fakeUser,
                fakeUserLevel,
                4, // oldLevel
                5, // newLevel  
                { name: 'Membre Actif' }, // roleReward
                style
            );
            
            return cardBuffer;
            
        } catch (error) {
            console.error('Erreur génération aperçu carte:', error);
            return null;
        }
    }

    async handleTextXPConfig(interaction) {
        await this.showTextXPConfig(interaction);
    }

    async handleVoiceXPConfig(interaction) {
        await this.showVoiceXPConfig(interaction);
    }

    async showTextXPConfig(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('text_xp_modal')
            .setTitle('Configuration XP Messages');

        const config = levelManager.loadConfig();

        const minXPInput = new TextInputBuilder()
            .setCustomId('min_xp')
            .setLabel('XP Minimum par message')
            .setStyle(TextInputStyle.Short)
            .setValue(config.textXP.min.toString())
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(3);

        const maxXPInput = new TextInputBuilder()
            .setCustomId('max_xp')
            .setLabel('XP Maximum par message')
            .setStyle(TextInputStyle.Short)
            .setValue(config.textXP.max.toString())
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(3);

        const cooldownInput = new TextInputBuilder()
            .setCustomId('cooldown')
            .setLabel('Cooldown (en secondes)')
            .setStyle(TextInputStyle.Short)
            .setValue(((config.textXP.cooldown || config.xpCooldown || 60000) / 1000).toString())
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(4);

        const firstActionRow = new ActionRowBuilder().addComponents(minXPInput);
        const secondActionRow = new ActionRowBuilder().addComponents(maxXPInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(cooldownInput);

        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

        await interaction.showModal(modal);
    }

    async showVoiceXPConfig(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('voice_xp_modal')
            .setTitle('Configuration XP Vocal');

        const config = levelManager.loadConfig();

        const xpAmountInput = new TextInputBuilder()
            .setCustomId('xp_amount')
            .setLabel('XP par minute de vocal')
            .setStyle(TextInputStyle.Short)
            .setValue(config.voiceXP.amount.toString())
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(3);

        const intervalInput = new TextInputBuilder()
            .setCustomId('interval')
            .setLabel('Intervalle de vérification (secondes)')
            .setStyle(TextInputStyle.Short)
            .setValue((config.voiceXP.interval / 1000).toString())
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(4);

        const firstActionRow = new ActionRowBuilder().addComponents(xpAmountInput);
        const secondActionRow = new ActionRowBuilder().addComponents(intervalInput);

        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
    }

    async handleTextXPModal(interaction) {
        const minXP = parseInt(interaction.fields.getTextInputValue('min_xp'));
        const maxXP = parseInt(interaction.fields.getTextInputValue('max_xp'));
        const cooldown = parseInt(interaction.fields.getTextInputValue('cooldown')) * 1000;

        if (minXP < 1 || maxXP < 1 || minXP > maxXP || cooldown < 1000) {
            return await interaction.reply({
                content: '❌ Valeurs invalides. Vérifiez que min ≤ max et cooldown ≥ 1 seconde.',
                flags: 64
            });
        }

        const config = levelManager.loadConfig();
        config.textXP.min = minXP;
        config.textXP.max = maxXP;
        config.textXP.cooldown = cooldown;
        config.xpCooldown = cooldown; // Pour compatibilité

        levelManager.saveConfig(config);

        await interaction.reply({
            content: `✅ Configuration XP messages mise à jour:\n• Min: ${minXP} XP\n• Max: ${maxXP} XP\n• Cooldown: ${cooldown/1000}s`,
            flags: 64
        });
    }

    async handleVoiceXPModal(interaction) {
        const xpAmount = parseInt(interaction.fields.getTextInputValue('xp_amount'));
        const interval = parseInt(interaction.fields.getTextInputValue('interval')) * 1000;

        if (xpAmount < 1 || interval < 10000) {
            return await interaction.reply({
                content: '❌ Valeurs invalides. XP ≥ 1 et intervalle ≥ 10 secondes.',
                flags: 64
            });
        }

        const config = levelManager.loadConfig();
        config.voiceXP.amount = xpAmount;
        config.voiceXP.interval = interval;

        levelManager.saveConfig(config);

        await interaction.reply({
            content: `✅ Configuration XP vocal mise à jour:\n• XP: ${xpAmount} par minute\n• Intervalle: ${interval/1000}s`,
            flags: 64
        });
    }

    async handleNotificationsConfig(interaction) {
        await this.showNotificationsConfig(interaction);
    }

    async handleRoleRewardsConfig(interaction) {
        await this.showRoleRewardsConfig(interaction);
    }

    async handleLevelFormulaConfig(interaction) {
        await this.showLevelFormulaConfig(interaction);
    }

    async handleLeaderboardActions(interaction) {
        await this.showLeaderboard(interaction);
    }

    async showNotificationsConfig(interaction) {
        const config = levelManager.loadConfig();
        
        const embed = new EmbedBuilder()
            .setTitle('📢 Configuration Notifications')
            .setDescription('Configurez les notifications de montée de niveau')
            .addFields([
                {
                    name: 'État',
                    value: config.notifications.enabled ? '✅ Activées' : '❌ Désactivées',
                    inline: true
                },
                {
                    name: 'Canal',
                    value: config.notifications.channel ? `<#${config.notifications.channel}>` : '❌ Non défini',
                    inline: true
                },
                {
                    name: 'Style de carte',
                    value: config.notifications.cardStyle || 'futuristic',
                    inline: true
                }
            ])
            .setColor('#5865F2');

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('notifications_config_menu')
                    .setPlaceholder('Choisissez une option à configurer...')
                    .addOptions([
                        {
                            label: '🔄 Activer/Désactiver',
                            description: 'Basculer l\'état des notifications',
                            value: 'toggle_notifications'
                        },
                        {
                            label: '📺 Choisir le canal',
                            description: 'Définir le canal des notifications',
                            value: 'notification_channel'
                        },
                        {
                            label: '🎨 Style de carte',
                            description: 'Changer le style des cartes',
                            value: 'card_style'
                        },
                        {
                            label: '🖼️ Images par style & rôle',
                            description: 'Associer des images aux rôles pour chaque style',
                            value: 'style_backgrounds'
                        },
                        {
                            label: '↩️ Retour menu principal',
                            description: 'Retourner au menu principal',
                            value: 'back_main'
                        }
                    ])
            );

        try {
            if (interaction.update) {
                await interaction.update({ embeds: [embed], components: [row] });
            } else {
                await interaction.editReply({ embeds: [embed], components: [row] });
            }
        } catch (error) {
            console.error('Erreur showNotificationsConfig:', error);
        }
    }

    async showStyleBackgroundsConfig(interaction) {
        const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, RoleSelectMenuBuilder } = require('discord.js');
        const config = levelManager.loadConfig();
        const styles = ['holographic','gamer','amour','sensuel','futuristic','elegant','minimal','gaming'];
        const embed = new EmbedBuilder()
            .setTitle('🖼️ Images par style & rôle')
            .setDescription('Sélectionnez un style, puis choisissez un rôle et fournissez une image (URL ou chemin local).')
            .setColor('#5865F2');

        const styleRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('style_backgrounds_style')
                .setPlaceholder('Choisir un style...')
                .addOptions(styles.map(s => ({ label: s, value: s })))
        );

        await interaction.update({ embeds: [embed], components: [styleRow] });
    }

    async handleStyleBackgroundsAction(interaction, customId) {
        const { ActionRowBuilder, StringSelectMenuBuilder, RoleSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
        const config = levelManager.loadConfig();

        if (customId === 'style_backgrounds_style') {
            const style = interaction.values?.[0];
            // Afficher sélecteur de rôle + options d\'édition
            const roleRow = new ActionRowBuilder().addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId(`style_backgrounds_role_${style}`)
                    .setPlaceholder('Sélectionner un rôle à mapper...')
                    .setMinValues(1)
                    .setMaxValues(1)
            );

            const editRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`style_backgrounds_actions_${style}`)
                    .setPlaceholder('Choisir une action...')
                    .addOptions([
                        { label: 'Définir image par défaut', value: 'set_default' },
                        { label: 'Supprimer image par défaut', value: 'remove_default' },
                        { label: 'Lister mappings', value: 'list' },
                        { label: 'Retour', value: 'back' }
                    ])
            );

            const embed = new EmbedBuilder().setTitle(`Style: ${style}`).setDescription('Associez une image à un rôle, ou gérez l\'image par défaut.');
            await interaction.update({ embeds: [embed], components: [roleRow, editRow] });
            return;
        }

        if (customId.startsWith('style_backgrounds_role_')) {
            const style = customId.replace('style_backgrounds_role_', '');
            const roleId = interaction.values?.[0];
            const role = interaction.guild.roles.cache.get(roleId);
            const roleName = role?.name || roleId;
            const modal = new ModalBuilder()
                .setCustomId(`style_backgrounds_modal_${style}_${roleId}`)
                .setTitle(`Image pour ${roleName} (${style})`);

            const input = new TextInputBuilder()
                .setCustomId('image_path_or_url')
                .setLabel('URL ou chemin local (ex: assets/styles/.../femme.png)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(512);

            const row = new ActionRowBuilder().addComponents(input);
            modal.addComponents(row);
            await interaction.showModal(modal);
            return;
        }

        if (interaction.isModalSubmit() && customId.startsWith('style_backgrounds_modal_')) {
            const [, , style, roleId] = customId.split('_');
            const imageValue = interaction.fields.getTextInputValue('image_path_or_url');
            const role = interaction.guild.roles.cache.get(roleId);
            const roleKey = require('../utils/styleBackgrounds').normalizeRoleName(role?.name || roleId);
            config.styleBackgrounds = config.styleBackgrounds || {};
            config.styleBackgrounds[style] = config.styleBackgrounds[style] || { default: '', byRole: {} };
            config.styleBackgrounds[style].byRole[roleKey] = imageValue;
            levelManager.saveConfig(config);
            await interaction.reply({ content: `✅ Image associée au rôle ${role?.name || roleId} pour le style ${style}.`, ephemeral: true });
            return;
        }

        if (customId.startsWith('style_backgrounds_actions_')) {
            const style = customId.replace('style_backgrounds_actions_', '');
            const action = interaction.values?.[0];
            if (action === 'set_default') {
                const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
                const modal = new ModalBuilder()
                    .setCustomId(`style_backgrounds_default_modal_${style}`)
                    .setTitle(`Image par défaut (${style})`);
                const input = new TextInputBuilder()
                    .setCustomId('default_image')
                    .setLabel('URL ou chemin local pour l\'image par défaut')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(512);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
                return;
            }
            if (action === 'remove_default') {
                config.styleBackgrounds = config.styleBackgrounds || {};
                config.styleBackgrounds[style] = config.styleBackgrounds[style] || { default: '', byRole: {} };
                config.styleBackgrounds[style].default = '';
                levelManager.saveConfig(config);
                await interaction.update({ content: `🗑️ Image par défaut supprimée pour ${style}.`, embeds: [], components: [] });
                return;
            }
            if (action === 'list') {
                const styleCfg = (config.styleBackgrounds || {})[style] || { default: '', byRole: {} };
                const list = [
                    `Par défaut: ${styleCfg.default || '—'}`,
                    ...Object.entries(styleCfg.byRole || {}).map(([k, v]) => `• ${k} → ${v}`)
                ].join('\n');
                await interaction.update({ content: `📋 Mappings pour ${style} :\n${list}`, embeds: [], components: [] });
                return;
            }
            if (action === 'back') {
                return await this.showNotificationsConfig(interaction);
            }
        }
    }

    async showRoleRewardsConfig(interaction) {
        const config = levelManager.loadConfig();
        
        const embed = new EmbedBuilder()
            .setTitle('🏆 Récompenses de Rôles')
            .setDescription('Configurez les rôles automatiques par niveau')
            .addFields([
                {
                    name: 'Récompenses configurées',
                    value: Object.keys(config.roleRewards || {}).length > 0 
                        ? `${Object.keys(config.roleRewards).length} niveau(x) configuré(s)`
                        : 'Aucune récompense configurée',
                    inline: false
                }
            ])
            .setColor('#5865F2');

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('role_rewards_config_menu')
                    .setPlaceholder('Choisissez une action...')
                    .addOptions([
                        {
                            label: '➕ Ajouter récompense',
                            description: 'Ajouter un rôle pour un niveau',
                            value: 'add_role_reward'
                        },
                        {
                            label: '📋 Voir récompenses',
                            description: 'Afficher toutes les récompenses',
                            value: 'list_rewards'
                        },
                        {
                            label: '🗑️ Supprimer récompense',
                            description: 'Retirer une récompense existante',
                            value: 'remove_reward'
                        },
                        {
                            label: '↩️ Retour menu principal',
                            description: 'Retourner au menu principal',
                            value: 'back_main'
                        }
                    ])
            );

        try {
            if (interaction.update) {
                await interaction.update({ embeds: [embed], components: [row] });
            } else {
                await interaction.editReply({ embeds: [embed], components: [row] });
            }
        } catch (error) {
            console.error('Erreur showRoleRewardsConfig:', error);
        }
    }

    async showLevelFormulaConfig(interaction) {
        const config = levelManager.loadConfig();
        
        const embed = new EmbedBuilder()
            .setTitle('📐 Formule de Niveau')
            .setDescription('Configurez la difficulté de progression')
            .addFields([
                {
                    name: 'XP de base',
                    value: `${config.levelFormula.baseXP} XP`,
                    inline: true
                },
                {
                    name: 'Multiplicateur',
                    value: config.levelFormula.multiplier.toString(),
                    inline: true
                },
                {
                    name: '📊 Aperçu des 5 premiers niveaux',
                    value: (() => {
                        const levelExamples = [];
                        for (let level = 1; level <= 5; level++) {
                            const xpRequired = Math.floor(config.levelFormula.baseXP * Math.pow(level, config.levelFormula.multiplier));
                            levelExamples.push(`**Niveau ${level}**: ${xpRequired.toLocaleString()} XP`);
                        }
                        return levelExamples.join('\n');
                    })(),
                    inline: false
                }
            ])
            .setColor('#5865F2');

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('level_formula_config_menu')
                    .setPlaceholder('Choisissez un paramètre à modifier...')
                    .addOptions([
                        {
                            label: '🎯 XP de base',
                            description: 'Modifier l\'XP requis pour le niveau 1',
                            value: 'base_xp'
                        },
                        {
                            label: '📈 Multiplicateur',
                            description: 'Modifier la difficulté croissante',
                            value: 'multiplier'
                        },
                        {
                            label: '🔄 Réinitialiser',
                            description: 'Remettre aux valeurs par défaut',
                            value: 'reset_formula'
                        },
                        {
                            label: '↩️ Retour menu principal',
                            description: 'Retourner au menu principal',
                            value: 'back_main'
                        }
                    ])
            );

        try {
            if (interaction.update) {
                await interaction.update({ embeds: [embed], components: [row] });
            } else {
                await interaction.editReply({ embeds: [embed], components: [row] });
            }
        } catch (error) {
            console.error('Erreur showLevelFormulaConfig:', error);
        }
    }

    async showLeaderboard(interaction) {
        const stats = levelManager.getGuildStats(interaction.guild.id);
        const topUsers = levelManager.getTopUsers(interaction.guild.id, 10);
        
        const embed = new EmbedBuilder()
            .setTitle('🏆 Classement des Niveaux')
            .setDescription('Top 10 des membres les plus actifs')
            .addFields([
                {
                    name: 'Statistiques générales',
                    value: `👥 **${stats.totalUsers}** membres actifs\n📈 **${Math.round(stats.avgLevel)}** niveau moyen\n⚡ **${stats.totalXP.toLocaleString()}** XP total`,
                    inline: false
                }
            ])
            .setColor('#5865F2');

        if (topUsers.length > 0) {
            const leaderboard = topUsers.map((user, index) => {
                return `${index + 1}. <@${user.userId}> - Niveau ${user.level} (${user.xp.toLocaleString()} XP)`;
            }).join('\n');
            
            embed.addFields([
                {
                    name: '🏅 Top 10',
                    value: leaderboard,
                    inline: false
                }
            ]);
        }

        await interaction.update({ embeds: [embed], components: [] });
    }

    // Nouvelles méthodes pour gérer les modals de formule de niveau
    async handleBaseXPModal(interaction) {
        try {
            const baseXP = parseInt(interaction.fields.getTextInputValue('base_xp'));
            
            if (isNaN(baseXP) || baseXP < 1) {
                return await interaction.reply({
                    content: '❌ L\'XP de base doit être un nombre entier positif.',
                    flags: 64
                });
            }
            
            const config = levelManager.loadConfig();
            config.levelFormula.baseXP = baseXP;
            levelManager.saveConfig(config);
            
            await interaction.reply({
                content: `✅ XP de base défini à ${baseXP} XP.`,
                flags: 64
            });
            
        } catch (error) {
            console.error('Erreur handleBaseXPModal:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la sauvegarde de l\'XP de base.',
                flags: 64
            });
        }
    }

    async handleMultiplierModal(interaction) {
        try {
            const multiplier = parseFloat(interaction.fields.getTextInputValue('multiplier'));
            
            if (isNaN(multiplier) || multiplier <= 1) {
                return await interaction.reply({
                    content: '❌ Le multiplicateur doit être un nombre supérieur à 1.',
                    flags: 64
                });
            }
            
            const config = levelManager.loadConfig();
            config.levelFormula.multiplier = multiplier;
            levelManager.saveConfig(config);
            
            await interaction.reply({
                content: `✅ Multiplicateur défini à ${multiplier}.`,
                flags: 64
            });
            
        } catch (error) {
            console.error('Erreur handleMultiplierModal:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la sauvegarde du multiplicateur.',
                flags: 64
            });
        }
    }

    async showBaseXPModal(interaction) {
        try {
            const config = levelManager.loadConfig();
            
            const modal = new ModalBuilder()
                .setCustomId('base_xp_modal')
                .setTitle('Modifier l\'XP de base');

            const baseXPInput = new TextInputBuilder()
                .setCustomId('base_xp')
                .setLabel('XP requis pour le niveau 1')
                .setStyle(TextInputStyle.Short)
                .setValue(config.levelFormula.baseXP.toString())
                .setPlaceholder('Ex: 100')
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(6);

            modal.addComponents(new ActionRowBuilder().addComponents(baseXPInput));
            await interaction.showModal(modal);
            
        } catch (error) {
            console.error('Erreur showBaseXPModal:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'affichage du modal.',
                flags: 64
            });
        }
    }

    async showMultiplierModal(interaction) {
        try {
            const config = levelManager.loadConfig();
            
            const modal = new ModalBuilder()
                .setCustomId('multiplier_modal')
                .setTitle('Modifier le multiplicateur');

            const multiplierInput = new TextInputBuilder()
                .setCustomId('multiplier')
                .setLabel('Multiplicateur de difficulté')
                .setStyle(TextInputStyle.Short)
                .setValue(config.levelFormula.multiplier.toString())
                .setPlaceholder('Ex: 1.5')
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(5);

            modal.addComponents(new ActionRowBuilder().addComponents(multiplierInput));
            await interaction.showModal(modal);
            
        } catch (error) {
            console.error('Erreur showMultiplierModal:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'affichage du modal.',
                flags: 64
            });
        }
    }

    async handleLevelFormulaConfigAction(interaction, selectedValue) {
        try {
            const config = levelManager.loadConfig();

            switch (selectedValue) {
                case 'base_xp':
                    await this.showBaseXPModal(interaction);
                    break;

                case 'multiplier':
                    await this.showMultiplierModal(interaction);
                    break;

                case 'reset_formula':
                    config.levelFormula = { baseXP: 100, multiplier: 1.5 };
                    levelManager.saveConfig(config);
                    
                    await interaction.update({
                        content: '✅ Formule réinitialisée aux valeurs par défaut (Base: 100 XP, Multiplicateur: 1.5).',
                        embeds: [],
                        components: []
                    });
                    
                    // Retour automatique au menu après 3 secondes
                    setTimeout(async () => {
                        try {
                            await this.showLevelFormulaConfig({ 
                                ...interaction, 
                                update: (options) => interaction.editReply(options) 
                            });
                        } catch (error) {
                            console.log('Timeout level formula config - interaction expirée');
                        }
                    }, 3000);
                    break;

                case 'back_main':
                    await this.handleLevelConfigMenu(interaction);
                    break;

                default:
                    await interaction.reply({
                        content: '❌ Action non reconnue.',
                        flags: 64
                    });
            }
        } catch (error) {
            console.error('Erreur handleLevelFormulaConfigAction:', error);
            await interaction.reply({
                content: '❌ Erreur lors du traitement de l\'action.',
                flags: 64
            });
        }
    }

    async handleLevelButton(interaction, customId) {
        try {
            const selected = (customId || '').replace('level_', '');
            switch (selected) {
                case 'text_xp':
                    return await this.handleTextXPConfig(interaction);
                case 'voice_xp':
                    return await this.handleVoiceXPConfig(interaction);
                case 'notifications':
                    return await this.handleNotificationsConfig(interaction);
                case 'role_rewards':
                    return await this.handleRoleRewardsConfig(interaction);
                case 'level_formula':
                    return await this.handleLevelFormulaConfig(interaction);
                case 'leaderboard':
                    return await this.handleLeaderboardActions(interaction);
                default:
                    return await this.handleLevelConfigMenu(interaction);
            }
        } catch (error) {
            console.error('Erreur handleLevelButton:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erreur lors du traitement du menu.', flags: 64 });
            }
        }
    }

    async handleNotificationsConfigAction(interaction) {
        try {
            const selectedValue = Array.isArray(interaction.values) ? interaction.values[0] : null;
            const { ActionRowBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder } = require('discord.js');
            const config = levelManager.loadConfig();

            switch (selectedValue) {
                case 'toggle_notifications':
                    config.notifications.enabled = !config.notifications.enabled;
                    levelManager.saveConfig(config);
                    return await this.showNotificationsConfig(interaction);

                case 'notification_channel': {
                    const channelRow = new ActionRowBuilder().addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId('level_notification_channel')
                            .setPlaceholder('Sélectionnez un canal pour les notifications')
                            .addChannelTypes(0)
                    );
                    return await interaction.update({ components: [channelRow] });
                }

                case 'card_style': {
                    const styles = ['holographic','gamer','amour','sensuel','futuristic','elegant','minimal','gaming'];
                    const styleRow = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('level_card_style')
                            .setPlaceholder('Choisissez un style de carte...')
                            .addOptions(styles.map(s => ({ label: s, value: s })))
                    );
                    return await interaction.update({ components: [styleRow] });
                }

                case 'style_backgrounds':
                    return await this.showStyleBackgroundsConfig(interaction);

                case 'back_main':
                    return await this.handleLevelConfigMenu(interaction);

                default:
                    return await interaction.reply({ content: '❌ Option non reconnue.', flags: 64 });
            }
        } catch (error) {
            console.error('Erreur handleNotificationsConfigAction:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erreur lors du traitement.', flags: 64 });
            }
        }
    }

    async handleLevelNotificationChannel(interaction) {
        try {
            const channelId = Array.isArray(interaction.values) ? interaction.values[0] : null;
            if (!channelId) {
                return await interaction.reply({ content: '❌ Aucun canal sélectionné.', flags: 64 });
            }
            const config = levelManager.loadConfig();
            config.notifications = config.notifications || {};
            config.notifications.channelId = channelId;
            config.notifications.channel = channelId;
            levelManager.saveConfig(config);
            return await this.showNotificationsConfig(interaction);
        } catch (error) {
            console.error('Erreur handleLevelNotificationChannel:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erreur lors de l’enregistrement du canal.', flags: 64 });
            }
        }
    }

    async handleLevelCardStyle(interaction) {
        try {
            const style = Array.isArray(interaction.values) ? interaction.values[0] : null;
            if (!style) {
                return await interaction.reply({ content: '❌ Aucun style sélectionné.', flags: 64 });
            }
            const config = levelManager.loadConfig();
            config.notifications = config.notifications || {};
            config.notifications.cardStyle = style;
            levelManager.saveConfig(config);

            let files = undefined;
            try {
                const preview = await this.generatePreviewCard(interaction, style);
                if (preview) {
                    files = [{ attachment: preview, name: `preview_${style}.png` }];
                }
            } catch (e) {
                console.log('⚠️ Impossible de générer l’aperçu de la carte:', e.message);
            }

            await interaction.update({ content: `✅ Style mis à jour: ${style}`, embeds: [], components: [], files });
            setTimeout(async () => {
                try {
                    await this.showNotificationsConfig({
                        ...interaction,
                        update: (options) => interaction.editReply(options)
                    });
                } catch {}
            }, 2000);
        } catch (error) {
            console.error('Erreur handleLevelCardStyle:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erreur lors de la mise à jour du style.', flags: 64 });
            }
        }
    }

    async handleStyleBackgroundsStyle(interaction) {
        return this.handleStyleBackgroundsAction(interaction, 'style_backgrounds_style');
    }

    async handleStyleBackgroundsRole(interaction, customId) {
        return this.handleStyleBackgroundsAction(interaction, customId);
    }

    async handleStyleBackgroundsActions(interaction, customId) {
        return this.handleStyleBackgroundsAction(interaction, customId);
    }

    async handleStyleBackgroundsModal(interaction, customId) {
        return this.handleStyleBackgroundsAction(interaction, customId);
    }

    // === Récompenses de rôles ===
    async handleRoleRewardsConfigAction(interaction) {
        try {
            const selectedValue = Array.isArray(interaction.values) ? interaction.values[0] : null;
            if (!selectedValue) {
                return await interaction.reply({ content: '❌ Aucune option sélectionnée.', flags: 64 });
            }

            const { ActionRowBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
            const config = levelManager.loadConfig();

            switch (selectedValue) {
                case 'add_role_reward': {
                    const roleRow = new ActionRowBuilder().addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId('add_role_reward_select')
                            .setPlaceholder('Choisissez le rôle à attribuer...')
                            .setMinValues(1)
                            .setMaxValues(1)
                    );
                    return await interaction.update({ components: [roleRow] });
                }

                case 'list_rewards': {
                    const entries = [];
                    if (Array.isArray(config.roleRewards)) {
                        for (const r of config.roleRewards) {
                            if (r && typeof r.level === 'number' && r.roleId) {
                                entries.push(`• Niveau ${r.level} → <@&${r.roleId}>`);
                            }
                        }
                    } else if (config.roleRewards && typeof config.roleRewards === 'object') {
                        for (const [lvl, rid] of Object.entries(config.roleRewards)) {
                            entries.push(`• Niveau ${lvl} → <@&${rid}>`);
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('🎁 Récompenses configurées')
                        .setDescription(entries.length ? entries.join('\n') : 'Aucune récompense configurée')
                        .setColor('#5865F2');
                    return await interaction.update({ embeds: [embed], components: [] });
                }

                case 'remove_reward': {
                    const options = [];
                    if (Array.isArray(config.roleRewards)) {
                        for (const r of config.roleRewards) {
                            if (r && typeof r.level === 'number') {
                                options.push({ label: `Niveau ${r.level}`, value: String(r.level) });
                            }
                        }
                    } else if (config.roleRewards && typeof config.roleRewards === 'object') {
                        for (const lvl of Object.keys(config.roleRewards)) {
                            options.push({ label: `Niveau ${lvl}`, value: String(lvl) });
                        }
                    }

                    if (options.length === 0) {
                        return await interaction.update({ content: '❌ Aucune récompense à supprimer.', embeds: [], components: [] });
                    }

                    const row = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('remove_role_reward')
                            .setPlaceholder('Choisissez une récompense à supprimer...')
                            .addOptions(options)
                    );
                    return await interaction.update({ components: [row] });
                }

                case 'back_main':
                    return await this.handleLevelConfigMenu(interaction);

                default:
                    return await interaction.reply({ content: '❌ Option non reconnue.', flags: 64 });
            }
        } catch (error) {
            console.error('Erreur handleRoleRewardsConfigAction:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erreur lors du traitement.', flags: 64 });
            }
        }
    }

    async handleAddRoleRewardSelect(interaction) {
        try {
            const roleId = Array.isArray(interaction.values) ? interaction.values[0] : null;
            if (!roleId) {
                return await interaction.reply({ content: '❌ Aucun rôle sélectionné.', flags: 64 });
            }

            const modal = new ModalBuilder()
                .setCustomId(`add_role_reward_modal_${roleId}`)
                .setTitle('Ajouter Récompense de Rôle');

            const levelInput = new TextInputBuilder()
                .setCustomId('level')
                .setLabel('Niveau requis (1-100)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(3);

            modal.addComponents(new ActionRowBuilder().addComponents(levelInput));
            await interaction.showModal(modal);
        } catch (error) {
            console.error('Erreur handleAddRoleRewardSelect:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erreur lors de la préparation du modal.', flags: 64 });
            }
        }
    }

    async handleAddRoleRewardModal(interaction) {
        try {
            const customId = String(interaction.customId || '');
            let roleId = null;
            if (customId.startsWith('add_role_reward_modal_')) {
                roleId = customId.replace('add_role_reward_modal_', '');
            }
            if (!roleId) {
                try { roleId = interaction.fields.getTextInputValue('role_id'); } catch {}
            }

            const levelVal = interaction.fields.getTextInputValue('level');
            const level = parseInt(levelVal, 10);
            if (!roleId || !Number.isFinite(level) || level < 1 || level > 100) {
                return await interaction.reply({ content: '❌ Valeurs invalides. Vérifiez le niveau (1-100) et le rôle.', flags: 64 });
            }

            const config = levelManager.loadConfig();
            // Normaliser roleRewards en objet
            if (!config.roleRewards) config.roleRewards = {};
            if (Array.isArray(config.roleRewards)) {
                const obj = {};
                for (const r of config.roleRewards) {
                    if (r && typeof r.level === 'number' && r.roleId) obj[String(r.level)] = r.roleId;
                }
                config.roleRewards = obj;
            }

            config.roleRewards[String(level)] = roleId;
            levelManager.saveConfig(config);

            await interaction.reply({ content: `✅ Récompense enregistrée: Niveau ${level} → <@&${roleId}>`, flags: 64 });
        } catch (error) {
            console.error('Erreur handleAddRoleRewardModal:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erreur lors de l\'enregistrement de la récompense.', flags: 64 });
            }
        }
    }

    async handleRemoveRoleReward(interaction) {
        try {
            const levelStr = Array.isArray(interaction.values) ? interaction.values[0] : null;
            if (!levelStr) {
                return await interaction.reply({ content: '❌ Aucun niveau sélectionné.', flags: 64 });
            }
            const config = levelManager.loadConfig();

            let removed = false;
            if (Array.isArray(config.roleRewards)) {
                const before = config.roleRewards.length;
                config.roleRewards = config.roleRewards.filter(r => String(r.level) !== String(levelStr));
                removed = config.roleRewards.length < before;
            } else if (config.roleRewards && typeof config.roleRewards === 'object') {
                if (config.roleRewards[levelStr]) {
                    delete config.roleRewards[levelStr];
                    removed = true;
                }
            }

            levelManager.saveConfig(config);
            await interaction.update({ content: removed ? `🗑️ Récompense supprimée pour le niveau ${levelStr}.` : '❌ Rien à supprimer.', embeds: [], components: [] });
        } catch (error) {
            console.error('Erreur handleRemoveRoleReward:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erreur lors de la suppression.', flags: 64 });
            }
        }
    }
}

module.exports = LevelConfigHandler;