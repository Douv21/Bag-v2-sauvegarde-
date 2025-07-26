/**
 * Handler dédié à la configuration du système économique
 */

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

class EconomyConfigHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    async showMainConfigMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('💰 Configuration Économie')
            .setDescription('Système économique complet avec karma et récompenses')
            .addFields([
                { name: '⚡ Actions', value: '6 actions configurables', inline: true },
                { name: '🏪 Boutique', value: 'Système de vente', inline: true },
                { name: '⚖️ Karma', value: 'Bon vs Mauvais', inline: true },
                { name: '📅 Daily', value: 'Récompenses quotidiennes', inline: true },
                { name: '💬 Messages', value: 'Gains par message', inline: true },
                { name: '📊 Stats', value: 'Données et analyses', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_config_main')
            .setPlaceholder('Choisissez une section...')
            .addOptions([
                { label: '⚡ Actions', value: 'economy_action_select', description: 'Configurer les actions économiques' },
                { label: '🏪 Boutique', value: 'economy_shop_options', description: 'Gestion de la boutique' },
                { label: '⚖️ Karma', value: 'economy_karma_options', description: 'Système de karma' },
                { label: '📅 Daily', value: 'economy_daily_options', description: 'Récompenses quotidiennes' },
                { label: '💬 Messages', value: 'economy_messages_options', description: 'Gains par message' },
                { label: '📊 Stats', value: 'economy_stats_options', description: 'Statistiques économiques' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    }

    async handleMainMenu(interaction) {
        const value = interaction.values[0];
        switch (value) {
            case 'economy_action_select':
                await this.showActionsConfig(interaction);
                break;
            case 'economy_shop_options':
                await this.showShopConfig(interaction);
                break;
            case 'economy_karma_options':
                await this.showKarmaConfig(interaction);
                break;
            case 'economy_daily_options':
                await this.showDailyConfig(interaction);
                break;
            case 'economy_messages_options':
                await this.showMessagesConfig(interaction);
                break;
            case 'economy_stats_options':
                await this.showStatsConfig(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Option non reconnue', flags: 64 });
        }
    }

    async showActionsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('⚔️ Configuration des Actions Économiques')
            .setDescription('Configurez les récompenses, karma et cooldowns pour chaque action')
            .addFields([
                {
                    name: '💼 Actions Positives',
                    value: '• `/travailler` - Travail honnête (+😇)\n• `/pecher` - Pêche relaxante (+😇)\n• `/donner` - Générosité (+😇)',
                    inline: true
                },
                {
                    name: '💀 Actions Négatives', 
                    value: '• `/voler` - Vol risqué (+😈)\n• `/crime` - Crime organisé (+😈)\n• `/parier` - Jeu de hasard (+😈)',
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_actions_select')
            .setPlaceholder('Choisissez une action à configurer...')
            .addOptions([
                {
                    label: '💼 Travailler',
                    value: 'travailler',
                    description: 'Configuration travail honnête',
                    emoji: '💼'
                },
                {
                    label: '🎣 Pêcher',
                    value: 'pecher',
                    description: 'Configuration pêche',
                    emoji: '🎣'
                },
                {
                    label: '💝 Donner',
                    value: 'donner',
                    description: 'Configuration dons',
                    emoji: '💝'
                },
                {
                    label: '💰 Voler',
                    value: 'voler',
                    description: 'Configuration vol',
                    emoji: '💰'
                },
                {
                    label: '🔫 Crime',
                    value: 'crime',
                    description: 'Configuration crime',
                    emoji: '🔫'
                },
                {
                    label: '🎲 Parier',
                    value: 'parier',
                    description: 'Configuration paris',
                    emoji: '🎲'
                },
                {
                    label: '🔄 Retour Menu Principal',
                    value: 'back_main',
                    description: 'Retour au menu principal',
                    emoji: '🔄'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showShopConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('🏪 Configuration Boutique')
            .setDescription('Gestion de la boutique du serveur')
            .addFields([{ name: '🚧 En développement', value: 'Cette section sera bientôt disponible', inline: false }]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_shop_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔄 Retour Menu Principal', value: 'back_main', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showKarmaConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('⚖️ Configuration Karma')
            .setDescription('Système karma positif vs négatif')
            .addFields([{ name: '🚧 En développement', value: 'Cette section sera bientôt disponible', inline: false }]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔄 Retour Menu Principal', value: 'back_main', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showDailyConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('📅 Configuration Daily')
            .setDescription('Récompenses quotidiennes et streaks')
            .addFields([{ name: '🚧 En développement', value: 'Cette section sera bientôt disponible', inline: false }]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_daily_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔄 Retour Menu Principal', value: 'back_main', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showMessagesConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('💬 Configuration Messages')
            .setDescription('Gains automatiques par message')
            .addFields([{ name: '🚧 En développement', value: 'Cette section sera bientôt disponible', inline: false }]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_messages_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔄 Retour Menu Principal', value: 'back_main', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showStatsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#34495e')
            .setTitle('📊 Statistiques Économiques')
            .setDescription('Données et analyses du système')
            .addFields([{ name: '🚧 En développement', value: 'Cette section sera bientôt disponible', inline: false }]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_stats_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔄 Retour Menu Principal', value: 'back_main', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    // Méthodes d'alias pour compatibilité MainRouterHandler
    async handleActionSelected(interaction) {
        const action = interaction.values[0];
        
        if (action === 'back_main') {
            await this.handleMainMenu(interaction);
            return;
        }

        const actionData = {
            travailler: { name: 'Travailler', emoji: '💼', desc: 'Action positive qui génère de l\'argent' },
            pecher: { name: 'Pêcher', emoji: '🎣', desc: 'Action positive avec mécaniques de pêche' },
            donner: { name: 'Donner', emoji: '💝', desc: 'Action très positive de transfert d\'argent' },
            voler: { name: 'Voler', emoji: '💰', desc: 'Action négative avec risque d\'échec' },
            crime: { name: 'Crime', emoji: '🔫', desc: 'Action très négative avec gros gains' },
            parier: { name: 'Parier', emoji: '🎲', desc: 'Action négative avec mécaniques de hasard' }
        };

        const data = actionData[action];
        if (!data) {
            await interaction.reply({ content: '❌ Action non trouvée', flags: 64 });
            return;
        }

        // Charger la configuration actuelle
        const guildId = interaction.guild?.id || 'default';
        const config = await this.dataManager.loadData('economy.json', {});
        const actionConfig = config.actions?.[action] || {
            enabled: true,
            minReward: 10,
            maxReward: 50,
            cooldown: 300000,
            goodKarma: 1,
            badKarma: 0
        };

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle(`${data.emoji} Configuration ${data.name}`)
            .setDescription(data.desc)
            .addFields([
                {
                    name: '💰 Récompenses',
                    value: `${actionConfig.minReward}€ - ${actionConfig.maxReward}€`,
                    inline: true
                },
                {
                    name: '⚖️ Karma',
                    value: `😇 +${actionConfig.goodKarma} | 😈 +${actionConfig.badKarma}`,
                    inline: true
                },
                {
                    name: '⏰ Cooldown',
                    value: `${Math.round(actionConfig.cooldown / 60000)} minutes`,
                    inline: true
                },
                {
                    name: '🔧 Statut',
                    value: actionConfig.enabled ? '✅ Activé' : '❌ Désactivé',
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`action_config_${action}`)
            .setPlaceholder('Choisissez une option à configurer...')
            .addOptions([
                {
                    label: '💰 Récompenses',
                    value: 'rewards',
                    description: 'Modifier les montants gagnés',
                    emoji: '💰'
                },
                {
                    label: '⚖️ Karma',
                    value: 'karma',
                    description: 'Modifier les gains/pertes karma',
                    emoji: '⚖️'
                },
                {
                    label: '⏰ Cooldown',
                    value: 'cooldown',
                    description: 'Modifier le temps d\'attente',
                    emoji: '⏰'
                },
                {
                    label: '🔄 Retour Actions',
                    value: 'back_actions',
                    description: 'Retour au menu actions',
                    emoji: '🔄'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async handleActionSelection(interaction) {
        await this.handleActionSelected(interaction);
    }

    async handleKarmaOption(interaction) {
        const guildId = interaction.guild.id;
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('⚖️ Configuration Karma')
            .setDescription('Système de karma global du serveur')
            .addFields([
                {
                    name: '📈 Actions Positives (😇)',
                    value: 'Travailler, Pêcher, Donner',
                    inline: true
                },
                {
                    name: '📉 Actions Négatives (😈)', 
                    value: 'Voler, Crime, Parier',
                    inline: true
                },
                {
                    name: '🔄 Auto-Reset Karma',
                    value: economyConfig.karma?.autoReset ? 'Activé' : 'Désactivé',
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_karma_config')
            .setPlaceholder('Configuration karma...')
            .addOptions([
                {
                    label: '📝 Modifier Auto-Reset',
                    value: 'karma_autoreset',
                    description: 'Activer/désactiver reset automatique',
                    emoji: '🔄'
                },
                {
                    label: '↩️ Retour Menu Principal',
                    value: 'back_main',
                    description: 'Retour au menu économie'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async handleShopOption(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('🛒 Configuration Boutique')
            .setDescription('Gestion de la boutique du serveur')
            .addFields([
                {
                    name: '💼 Accès Boutique',
                    value: 'Commande /boutique disponible',
                    inline: true
                },
                {
                    name: '🎨 Articles Personnalisés',
                    value: 'Via /configeconomie → Boutique',
                    inline: true
                },
                {
                    name: '👑 Rôles Premium',
                    value: 'Configuration dans /boutique',
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_shop_config')
            .setPlaceholder('Configuration boutique...')
            .addOptions([
                {
                    label: '↩️ Retour Menu Principal',
                    value: 'back_main',
                    description: 'Retour au menu économie'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async handleDailyOption(interaction) {
        const guildId = interaction.guild.id;
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const dailyConfig = economyConfig.daily || { amount: 100, enabled: true };
        
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('📅 Configuration Daily')
            .setDescription('Récompenses quotidiennes pour les membres')
            .addFields([
                {
                    name: '💰 Montant Daily',
                    value: `${dailyConfig.amount}€`,
                    inline: true
                },
                {
                    name: '✅ Status',
                    value: dailyConfig.enabled ? 'Activé' : 'Désactivé',
                    inline: true
                },
                {
                    name: '🔥 Streak',
                    value: 'Bonus de série disponible',
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_daily_config')
            .setPlaceholder('Configuration daily...')
            .addOptions([
                {
                    label: '📝 Modifier Montant',
                    value: 'daily_amount',
                    description: 'Changer le montant daily (1-1000€)',
                    emoji: '💰'
                },
                {
                    label: '🔄 Toggle Activation',
                    value: 'daily_toggle',
                    description: dailyConfig.enabled ? 'Désactiver daily' : 'Activer daily',
                    emoji: '🔄'
                },
                {
                    label: '↩️ Retour Menu Principal',
                    value: 'back_main',
                    description: 'Retour au menu économie'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async handleMessagesOption(interaction) {
        const guildId = interaction.guild.id;
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const messageConfig = economyConfig.messages || { enabled: false, amount: 5, cooldown: 60000 };
        
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('💬 Configuration Messages')
            .setDescription('Récompenses automatiques par message')
            .addFields([
                {
                    name: '💰 Montant par Message',
                    value: `${messageConfig.amount}€`,
                    inline: true
                },
                {
                    name: '⏰ Cooldown',
                    value: `${Math.round(messageConfig.cooldown / 1000)}s`,
                    inline: true
                },
                {
                    name: '✅ Status',
                    value: messageConfig.enabled ? 'Activé' : 'Désactivé',
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_messages_config')
            .setPlaceholder('Configuration messages...')
            .addOptions([
                {
                    label: '📝 Modifier Montant',
                    value: 'messages_amount',
                    description: 'Changer le montant par message (1-50€)',
                    emoji: '💰'
                },
                {
                    label: '⏰ Modifier Cooldown',
                    value: 'messages_cooldown',
                    description: 'Changer le cooldown (10-300s)',
                    emoji: '⏰'
                },
                {
                    label: '🔄 Toggle Activation',
                    value: 'messages_toggle',
                    description: messageConfig.enabled ? 'Désactiver système' : 'Activer système',
                    emoji: '🔄'
                },
                {
                    label: '↩️ Retour Menu Principal',
                    value: 'back_main',
                    description: 'Retour au menu économie'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    async handleStatsOption(interaction) {
        const guildId = interaction.guild.id;
        const economyData = await this.dataManager.loadData('users.json', {});
        const guildUsers = economyData[guildId] || {};
        
        let totalBalance = 0;
        let totalGoodKarma = 0;
        let totalBadKarma = 0;
        let userCount = 0;
        
        Object.values(guildUsers).forEach(user => {
            if (typeof user === 'object' && user.balance !== undefined) {
                totalBalance += user.balance || 0;
                totalGoodKarma += user.karmaGood || 0;
                totalBadKarma += user.karmaBad || 0;
                userCount++;
            }
        });
        
        const embed = new EmbedBuilder()
            .setColor('#95a5a6')
            .setTitle('📊 Statistiques Économiques')
            .setDescription('Données globales du serveur')
            .addFields([
                {
                    name: '👥 Utilisateurs Actifs',
                    value: `${userCount} membres`,
                    inline: true
                },
                {
                    name: '💰 Argent Total',
                    value: `${totalBalance.toLocaleString()}€`,
                    inline: true
                },
                {
                    name: '📊 Karma Total',
                    value: `😇 ${totalGoodKarma} | 😈 ${totalBadKarma}`,
                    inline: true
                },
                {
                    name: '💵 Moyenne Solde',
                    value: userCount > 0 ? `${Math.round(totalBalance / userCount)}€` : '0€',
                    inline: true
                },
                {
                    name: '⚖️ Karma Net Moyen',
                    value: userCount > 0 ? `${Math.round((totalGoodKarma - totalBadKarma) / userCount)}` : '0',
                    inline: true
                },
                {
                    name: '🏆 Richesse Serveur',
                    value: totalBalance > 100000 ? 'Serveur Riche 💎' : totalBalance > 50000 ? 'Serveur Prospère 🌟' : 'Serveur en Développement 🌱',
                    inline: true
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_stats_config')
            .setPlaceholder('Options statistiques...')
            .addOptions([
                {
                    label: '↩️ Retour Menu Principal',
                    value: 'back_main',
                    description: 'Retour au menu économie'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        if (interaction.update) {
            await interaction.update({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }

    // Nouvelle méthode pour gérer les configurations d'actions dynamiques
    async handleActionConfig(interaction) {
        const customId = interaction.customId;
        const action = customId.replace('action_config_', '');
        const option = interaction.values[0];

        if (option === 'back_actions') {
            await this.showActionsConfig(interaction);
            return;
        }

        const actionData = {
            travailler: { name: 'Travailler', emoji: '💼' },
            pecher: { name: 'Pêcher', emoji: '🎣' },
            donner: { name: 'Donner', emoji: '💝' },
            voler: { name: 'Voler', emoji: '💰' },
            crime: { name: 'Crime', emoji: '🔫' },
            parier: { name: 'Parier', emoji: '🎲' }
        };

        const optionNames = {
            rewards: 'Récompenses',
            karma: 'Karma', 
            cooldown: 'Cooldown'
        };

        const data = actionData[action];
        const optionName = optionNames[option];

        if (!data || !optionName) {
            await interaction.reply({ content: '❌ Configuration non trouvée', flags: 64 });
            return;
        }

        // Charger la configuration actuelle
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('economy.json', {});
        const actionConfig = config.actions?.[action] || {
            enabled: true,
            minReward: 10,
            maxReward: 50,
            cooldown: 300000,
            goodKarma: 1,
            badKarma: 0
        };

        let embed, selectMenu;

        if (option === 'rewards') {
            embed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle(`${data.emoji} ${data.name} - Récompenses`)
                .setDescription(`Configuration des montants d'argent pour **${data.name}**`)
                .addFields([
                    {
                        name: '💰 Montant Minimum',
                        value: `${actionConfig.minReward}€`,
                        inline: true
                    },
                    {
                        name: '💰 Montant Maximum', 
                        value: `${actionConfig.maxReward}€`,
                        inline: true
                    },
                    {
                        name: '📊 Gain Moyen',
                        value: `${Math.round((actionConfig.minReward + actionConfig.maxReward) / 2)}€`,
                        inline: true
                    }
                ]);

            selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`action_rewards_config_${action}`)
                .setPlaceholder('Modifier les récompenses...')
                .addOptions([
                    {
                        label: '📝 Définir Min Personnalisé',
                        value: 'custom_min',
                        description: `Saisir valeur exacte minimum (1€ à 999,999€)`,
                        emoji: '💰'
                    },
                    {
                        label: '📝 Définir Max Personnalisé',
                        value: 'custom_max',
                        description: `Saisir valeur exacte maximum (1€ à 999,999€)`,
                        emoji: '💰'
                    },
                    {
                        label: '↩️ Retour',
                        value: 'back_action',
                        description: `Retour à ${data.name}`
                    }
                ]);

        } else if (option === 'karma') {
            const goodKarmaDisplay = actionConfig.goodKarma >= 0 ? `+${actionConfig.goodKarma}` : `${actionConfig.goodKarma}`;
            const badKarmaDisplay = actionConfig.badKarma >= 0 ? `+${actionConfig.badKarma}` : `${actionConfig.badKarma}`;
            
            embed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle(`${data.emoji} ${data.name} - Karma`)
                .setDescription(`Configuration des points karma pour **${data.name}**`)
                .addFields([
                    {
                        name: '😇 Karma Positif',
                        value: `${goodKarmaDisplay} points`,
                        inline: true
                    },
                    {
                        name: '😈 Karma Négatif',
                        value: `${badKarmaDisplay} points`,
                        inline: true
                    },
                    {
                        name: '⚖️ Impact Net',
                        value: `${actionConfig.goodKarma - actionConfig.badKarma > 0 ? '+' : ''}${actionConfig.goodKarma - actionConfig.badKarma}`,
                        inline: true
                    }
                ]);

            selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`action_karma_config_${action}`)
                .setPlaceholder('Modifier le karma...')
                .addOptions([
                    {
                        label: '📝 Définir Karma Positif',
                        value: 'custom_good',
                        description: `Saisir valeur exacte karma 😇 (-999 à +999)`,
                        emoji: '😇'
                    },
                    {
                        label: '📝 Définir Karma Négatif',
                        value: 'custom_bad',
                        description: `Saisir valeur exacte karma 😈 (-999 à +999)`,
                        emoji: '😈'
                    },
                    {
                        label: '↩️ Retour',
                        value: 'back_action',
                        description: `Retour à ${data.name}`
                    }
                ]);

        } else if (option === 'cooldown') {
            embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle(`${data.emoji} ${data.name} - Cooldown`)
                .setDescription(`Configuration du délai d'attente pour **${data.name}**`)
                .addFields([
                    {
                        name: '⏰ Délai Actuel',
                        value: `${Math.round(actionConfig.cooldown / 60000)} minutes`,
                        inline: true
                    },
                    {
                        name: '🕐 En Secondes',
                        value: `${Math.round(actionConfig.cooldown / 1000)} secondes`,
                        inline: true
                    },
                    {
                        name: '📊 Utilisations/Heure',
                        value: `~${Math.round(3600000 / actionConfig.cooldown)} fois`,
                        inline: true
                    }
                ]);

            selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`action_cooldown_config_${action}`)
                .setPlaceholder('Modifier le cooldown...')
                .addOptions([
                    {
                        label: '📝 Définir Délai Personnalisé',
                        value: 'custom_cooldown',
                        description: `Saisir valeur exacte cooldown (1 à 1440 minutes)`,
                        emoji: '⏰'
                    },
                    {
                        label: '↩️ Retour',
                        value: 'back_action',
                        description: `Retour à ${data.name}`
                    }
                ]);

        } else {
            embed = new EmbedBuilder()
                .setColor('#95a5a6')
                .setTitle(`${data.emoji} ${data.name} - ${optionName}`)
                .setDescription(`Configuration ${optionName.toLowerCase()} pour **${data.name}**`)
                .addFields([{
                    name: '🚧 En développement',
                    value: `Cette option sera bientôt disponible`,
                    inline: false
                }]);

            selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`action_${option}_back_${action}`)
                .setPlaceholder('Actions...')
                .addOptions([{
                    label: `🔄 Retour ${data.name}`,
                    value: 'back_action',
                    description: `Retour à la configuration ${data.name}`
                }]);
        }

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    // Méthode pour gérer les retours d'actions spécifiques  
    async handleActionReturn(interaction) {
        const customId = interaction.customId;
        const parts = customId.split('_');
        const action = parts[parts.length - 1]; // Dernière partie = nom de l'action
        
        // Simuler une sélection d'action pour revenir au menu de l'action
        const fakeInteraction = {
            ...interaction,
            values: [action],
            customId: `action_config_${action}`
        };
        
        await this.handleActionSelected(fakeInteraction);
    }

    // Méthode pour gérer les configurations spécifiques (rewards, karma, cooldown)
    async handleActionSpecificConfig(interaction) {
        const customId = interaction.customId;
        const selection = interaction.values[0];
        
        // Extraire le type de config et l'action
        let configType, action;
        if (customId.startsWith('action_rewards_config_')) {
            configType = 'rewards';
            action = customId.replace('action_rewards_config_', '');
        } else if (customId.startsWith('action_karma_config_')) {
            configType = 'karma';
            action = customId.replace('action_karma_config_', '');
        } else if (customId.startsWith('action_cooldown_config_')) {
            configType = 'cooldown';
            action = customId.replace('action_cooldown_config_', '');
        }

        if (selection === 'back_action') {
            // Retour au menu de configuration de l'action
            const fakeInteraction = {
                ...interaction,
                values: [action],
                customId: `action_config_${action}`,
                guild: interaction.guild,
                user: interaction.user
            };
            await this.handleActionSelected(fakeInteraction);
            return;
        }

        // Gérer les actions personnalisées (modals)
        if (selection.startsWith('custom_')) {
            await this.showCustomConfigModal(interaction, configType, action, selection);
            return;
        }

        // Gérer les modifications rapides
        await this.handleQuickConfigChange(interaction, configType, action, selection);
    }

    // Afficher modal pour saisie personnalisée
    async showCustomConfigModal(interaction, configType, action, customType) {
        const { ModalBuilder, TextInputBuilder, ActionRowBuilder } = require('discord.js');
        const { TextInputStyle } = require('discord.js');

        const actionData = {
            travailler: { name: 'Travailler', emoji: '💼' },
            pecher: { name: 'Pêcher', emoji: '🎣' },
            donner: { name: 'Donner', emoji: '💝' },
            voler: { name: 'Voler', emoji: '💰' },
            crime: { name: 'Crime', emoji: '🔫' },
            parier: { name: 'Parier', emoji: '🎲' }
        };

        const data = actionData[action];
        if (!data) return;

        let modal, textInput;

        if (customType === 'custom_min') {
            modal = new ModalBuilder()
                .setCustomId(`economy_custom_min_${action}`)
                .setTitle(`${data.emoji} ${data.name} - Montant Minimum`);

            textInput = new TextInputBuilder()
                .setCustomId('min_amount')
                .setLabel('Montant Minimum (€)')
                .setPlaceholder('Ex: 25')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(6);

        } else if (customType === 'custom_max') {
            modal = new ModalBuilder()
                .setCustomId(`economy_custom_max_${action}`)
                .setTitle(`${data.emoji} ${data.name} - Montant Maximum`);

            textInput = new TextInputBuilder()
                .setCustomId('max_amount')
                .setLabel('Montant Maximum (€)')
                .setPlaceholder('Ex: 100')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(6);

        } else if (customType === 'custom_good') {
            modal = new ModalBuilder()
                .setCustomId(`economy_custom_good_karma_${action}`)
                .setTitle(`${data.emoji} ${data.name} - Karma Positif`);

            textInput = new TextInputBuilder()
                .setCustomId('good_karma')
                .setLabel('Karma Positif (peut être négatif)')
                .setPlaceholder('Ex: 2 ou -1')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(4);

        } else if (customType === 'custom_bad') {
            modal = new ModalBuilder()
                .setCustomId(`economy_custom_bad_karma_${action}`)
                .setTitle(`${data.emoji} ${data.name} - Karma Négatif`);

            textInput = new TextInputBuilder()
                .setCustomId('bad_karma')
                .setLabel('Karma Négatif (peut être négatif)')
                .setPlaceholder('Ex: 1 ou -2')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(4);

        } else if (customType === 'custom_cooldown') {
            modal = new ModalBuilder()
                .setCustomId(`economy_custom_cooldown_${action}`)
                .setTitle(`${data.emoji} ${data.name} - Délai`);

            textInput = new TextInputBuilder()
                .setCustomId('cooldown_minutes')
                .setLabel('Délai en minutes')
                .setPlaceholder('Ex: 15')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(4);
        }

        const row = new ActionRowBuilder().addComponents(textInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    // Gérer les modifications rapides (+/- boutons)
    async handleQuickConfigChange(interaction, configType, action, changeType) {
        const guildId = interaction.guild?.id || 'default';
        const config = await this.dataManager.loadData('economy.json', {});
        
        if (!config.actions) config.actions = {};
        if (!config.actions[action]) {
            config.actions[action] = {
                enabled: true,
                minReward: 10,
                maxReward: 50,
                cooldown: 300000,
                goodKarma: 1,
                badKarma: 0
            };
        }

        const actionConfig = config.actions[action];
        let changed = false;

        if (configType === 'rewards') {
            switch (changeType) {
                case 'increase_min':
                    actionConfig.minReward += 10;
                    changed = true;
                    break;
                case 'decrease_min':
                    actionConfig.minReward = Math.max(1, actionConfig.minReward - 10);
                    changed = true;
                    break;
                case 'increase_max':
                    actionConfig.maxReward += 20;
                    changed = true;
                    break;
                case 'decrease_max':
                    actionConfig.maxReward = Math.max(actionConfig.minReward, actionConfig.maxReward - 20);
                    changed = true;
                    break;
            }
        } else if (configType === 'karma') {
            switch (changeType) {
                case 'increase_good':
                    actionConfig.goodKarma += 1;
                    changed = true;
                    break;
                case 'decrease_good':
                    actionConfig.goodKarma -= 1;
                    changed = true;
                    break;
                case 'increase_bad':
                    actionConfig.badKarma += 1;
                    changed = true;
                    break;
                case 'decrease_bad':
                    actionConfig.badKarma -= 1;
                    changed = true;
                    break;
            }
        } else if (configType === 'cooldown') {
            switch (changeType) {
                case 'increase_1min':
                    actionConfig.cooldown += 60000;
                    changed = true;
                    break;
                case 'decrease_1min':
                    actionConfig.cooldown = Math.max(60000, actionConfig.cooldown - 60000);
                    changed = true;
                    break;
                case 'increase_5min':
                    actionConfig.cooldown += 300000;
                    changed = true;
                    break;
                case 'decrease_5min':
                    actionConfig.cooldown = Math.max(60000, actionConfig.cooldown - 300000);
                    changed = true;
                    break;
            }
        }

        if (changed) {
            await this.dataManager.saveData('economy.json', config);
            
            // Re-afficher le menu de configuration avec les nouvelles valeurs
            const fakeInteraction = {
                ...interaction,
                values: [configType],
                customId: `action_config_${action}`,
                guild: interaction.guild,
                user: interaction.user
            };
            await this.handleActionConfig(fakeInteraction);
        }
    }

    // Gérer les modals personnalisés pour saisies exactes
    async handleCustomModal(interaction) {
        const customId = interaction.customId;
        
        let configType, action, fieldType;
        
        if (customId.startsWith('economy_custom_min_')) {
            configType = 'rewards';
            fieldType = 'min';
            action = customId.replace('economy_custom_min_', '');
        } else if (customId.startsWith('economy_custom_max_')) {
            configType = 'rewards';
            fieldType = 'max';
            action = customId.replace('economy_custom_max_', '');
        } else if (customId.startsWith('economy_custom_good_karma_')) {
            configType = 'karma';
            fieldType = 'good';
            action = customId.replace('economy_custom_good_karma_', '');
        } else if (customId.startsWith('economy_custom_bad_karma_')) {
            configType = 'karma';
            fieldType = 'bad';
            action = customId.replace('economy_custom_bad_karma_', '');
        } else if (customId.startsWith('economy_custom_cooldown_')) {
            configType = 'cooldown';
            fieldType = 'cooldown';
            action = customId.replace('economy_custom_cooldown_', '');
        }

        if (!action || !configType) {
            await interaction.reply({ content: '❌ Configuration non trouvée', flags: 64 });
            return;
        }

        const actionData = {
            travailler: { name: 'Travailler', emoji: '💼' },
            pecher: { name: 'Pêcher', emoji: '🎣' },
            donner: { name: 'Donner', emoji: '💝' },
            voler: { name: 'Voler', emoji: '💰' },
            crime: { name: 'Crime', emoji: '🔫' },
            parier: { name: 'Parier', emoji: '🎲' }
        };

        const data = actionData[action];
        if (!data) {
            await interaction.reply({ content: '❌ Action non trouvée', flags: 64 });
            return;
        }

        // Récupérer la valeur saisie
        let inputValue;
        if (configType === 'rewards') {
            inputValue = fieldType === 'min' ? interaction.fields.getTextInputValue('min_amount') : interaction.fields.getTextInputValue('max_amount');
        } else if (configType === 'karma') {
            inputValue = fieldType === 'good' ? interaction.fields.getTextInputValue('good_karma') : interaction.fields.getTextInputValue('bad_karma');
        } else if (configType === 'cooldown') {
            inputValue = interaction.fields.getTextInputValue('cooldown_minutes');
        }

        // Valider et convertir la valeur
        let numValue = parseInt(inputValue);
        if (isNaN(numValue)) {
            await interaction.reply({ 
                content: '❌ Valeur invalide. Veuillez entrer un nombre valide.', 
                flags: 64 
            });
            return;
        }

        // Appliquer des limites de sécurité
        if (configType === 'rewards') {
            numValue = Math.max(1, Math.min(999999, numValue));
        } else if (configType === 'karma') {
            numValue = Math.max(-999, Math.min(999, numValue));
        } else if (configType === 'cooldown') {
            numValue = Math.max(1, Math.min(1440, numValue)); // 1 minute à 24h
        }

        // Sauvegarder la configuration
        const guildId = interaction.guild?.id || 'default';
        const config = await this.dataManager.loadData('economy.json', {});
        
        if (!config.actions) config.actions = {};
        if (!config.actions[action]) {
            config.actions[action] = {
                enabled: true,
                minReward: 10,
                maxReward: 50,
                cooldown: 300000,
                goodKarma: 1,
                badKarma: 0
            };
        }

        const actionConfig = config.actions[action];

        if (configType === 'rewards') {
            if (fieldType === 'min') {
                actionConfig.minReward = numValue;
                // Ajuster le max si nécessaire
                if (actionConfig.maxReward < numValue) {
                    actionConfig.maxReward = numValue;
                }
            } else {
                actionConfig.maxReward = numValue;
                // Ajuster le min si nécessaire
                if (actionConfig.minReward > numValue) {
                    actionConfig.minReward = numValue;
                }
            }
        } else if (configType === 'karma') {
            if (fieldType === 'good') {
                actionConfig.goodKarma = numValue;
            } else {
                actionConfig.badKarma = numValue;
            }
        } else if (configType === 'cooldown') {
            actionConfig.cooldown = numValue * 60000; // Convertir en millisecondes
        }

        await this.dataManager.saveData('economy.json', config);

        // Afficher confirmation et retourner au menu de configuration
        const { EmbedBuilder } = require('discord.js');
        
        let confirmMessage;
        if (configType === 'rewards') {
            confirmMessage = `${data.emoji} **${data.name}**: ${fieldType === 'min' ? 'Minimum' : 'Maximum'} défini à **${numValue}€**`;
        } else if (configType === 'karma') {
            const karmaType = fieldType === 'good' ? '😇 Karma Positif' : '😈 Karma Négatif';
            const sign = numValue >= 0 ? '+' : '';
            confirmMessage = `${data.emoji} **${data.name}**: ${karmaType} défini à **${sign}${numValue}**`;
        } else if (configType === 'cooldown') {
            confirmMessage = `${data.emoji} **${data.name}**: Délai défini à **${numValue} minute(s)**`;
        }

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('✅ Configuration Mise à Jour')
            .setDescription(confirmMessage)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });

        // Petit délai puis retourner au menu de configuration
        setTimeout(async () => {
            try {
                const fakeInteraction = {
                    ...interaction,
                    values: [configType],
                    customId: `action_config_${action}`,
                    replied: false,
                    deferred: false,
                    update: interaction.editReply.bind(interaction)
                };
                await this.handleActionConfig(fakeInteraction);
            } catch (error) {
                console.log('Retour automatique non disponible');
            }
        }, 2000);
    }
    // Handlers pour les sous-menus
    async handleEconomyKarmaConfig(interaction) {
        const option = interaction.values[0];
        
        if (option === 'back_main') {
            await this.handleMainMenu(interaction);
            return;
        }

        if (option === 'karma_autoreset') {
            const guildId = interaction.guild.id;
            const economyConfig = await this.dataManager.loadData('economy.json', {});
            
            // Toggle auto-reset
            if (!economyConfig.karma) economyConfig.karma = {};
            economyConfig.karma.autoReset = !economyConfig.karma.autoReset;
            
            await this.dataManager.saveData('economy.json', economyConfig);
            
            await interaction.update({
                content: `✅ Auto-reset karma ${economyConfig.karma.autoReset ? 'activé' : 'désactivé'}`,
                embeds: [],
                components: []
            });
            
            setTimeout(async () => {
                await this.handleKarmaOption(interaction);
            }, 2000);
        }
    }

    async handleEconomyShopConfig(interaction) {
        const option = interaction.values[0];
        
        if (option === 'back_main') {
            await this.handleMainMenu(interaction);
            return;
        }
        
        await interaction.update({
            content: '✅ Configuration boutique mise à jour',
            embeds: [],
            components: []
        });
    }

    async handleEconomyDailyConfig(interaction) {
        const option = interaction.values[0];
        
        if (option === 'back_main') {
            await this.handleMainMenu(interaction);
            return;
        }

        const guildId = interaction.guild.id;
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        
        if (option === 'daily_toggle') {
            if (!economyConfig.daily) economyConfig.daily = { amount: 100, enabled: true };
            economyConfig.daily.enabled = !economyConfig.daily.enabled;
            
            await this.dataManager.saveData('economy.json', economyConfig);
            
            await interaction.update({
                content: `✅ Daily ${economyConfig.daily.enabled ? 'activé' : 'désactivé'}`,
                embeds: [],
                components: []
            });
            
            setTimeout(async () => {
                await this.handleDailyOption(interaction);
            }, 2000);
            
        } else if (option === 'daily_amount') {
            const modal = new ModalBuilder()
                .setCustomId('economy_daily_amount_modal')
                .setTitle('💰 Montant Daily');

            const amountInput = new TextInputBuilder()
                .setCustomId('amount')
                .setLabel('Montant Daily (1-1000€)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('100')
                .setValue(`${economyConfig.daily?.amount || 100}`)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(amountInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
        }
    }

    async handleEconomyMessagesConfig(interaction) {
        const option = interaction.values[0];
        
        if (option === 'back_main') {
            await this.handleMainMenu(interaction);
            return;
        }

        const guildId = interaction.guild.id;
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        
        if (option === 'messages_toggle') {
            if (!economyConfig.messages) economyConfig.messages = { enabled: false, amount: 5, cooldown: 60000 };
            economyConfig.messages.enabled = !economyConfig.messages.enabled;
            
            await this.dataManager.saveData('economy.json', economyConfig);
            
            await interaction.update({
                content: `✅ Système de récompenses par message ${economyConfig.messages.enabled ? 'activé' : 'désactivé'}`,
                embeds: [],
                components: []
            });
            
            setTimeout(async () => {
                await this.handleMessagesOption(interaction);
            }, 2000);
            
        } else if (option === 'messages_amount') {
            const modal = new ModalBuilder()
                .setCustomId('economy_messages_amount_modal')
                .setTitle('💰 Montant par Message');

            const amountInput = new TextInputBuilder()
                .setCustomId('amount')
                .setLabel('Montant par message (1-50€)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('5')
                .setValue(`${economyConfig.messages?.amount || 5}`)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(amountInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
            
        } else if (option === 'messages_cooldown') {
            const modal = new ModalBuilder()
                .setCustomId('economy_messages_cooldown_modal')
                .setTitle('⏰ Cooldown Messages');

            const cooldownInput = new TextInputBuilder()
                .setCustomId('cooldown')
                .setLabel('Cooldown en secondes (10-300s)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('60')
                .setValue(`${Math.round((economyConfig.messages?.cooldown || 60000) / 1000)}`)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(cooldownInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
        }
    }

    async handleEconomyStatsConfig(interaction) {
        const option = interaction.values[0];
        
        if (option === 'back_main') {
            await this.handleMainMenu(interaction);
            return;
        }
    }
}

module.exports = EconomyConfigHandler;