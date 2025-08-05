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
}

module.exports = LevelConfigHandler;