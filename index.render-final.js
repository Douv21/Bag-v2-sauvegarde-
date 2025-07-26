const { Client, Collection, GatewayIntentBits, Routes, REST, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const deploymentManager = require('./utils/deploymentManager');
const mongoBackup = require('./utils/mongoBackupManager');
const levelManager = require('./utils/levelManager');

class RenderSolutionBot {
    constructor() {
        this.initializeWebServer();
    }

    async initializeWebServer() {
        // 1. Serveur web d'abord (port 5000 pour Render.com)
        const app = express();
        const PORT = process.env.PORT || 3000;

        app.use(express.json());

        app.get('/', (req, res) => {
            res.json({
                status: 'running',
                version: '3.0',
                deployment: 'render.com',
                message: 'BAG v2 Discord Bot - Serveur Web Actif'
            });
        });

        app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });

        app.get('/commands-status', async (req, res) => {
            try {
                const commandsDir = path.join(__dirname, 'commands');
                const commandFiles = await fs.readdir(commandsDir);
                const commands = commandFiles.filter(file => file.endsWith('.js')).map(file => file.replace('.js', ''));
                
                res.json({
                    status: 'success',
                    commands: commands,
                    count: commands.length
                });
            } catch (error) {
                res.json({ status: 'error', message: error.message });
            }
        });

        // Endpoint status système de sauvegarde
        app.get('/backup-status', async (req, res) => {
            try {
                const status = await deploymentManager.getSystemStatus();
                const integrity = await mongoBackup.verifyBackupIntegrity();
                
                res.json({
                    deployment: status,
                    backup: {
                        mongoConnected: status.mongoConnected,
                        integrityCheck: integrity
                    },
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.json({ status: 'error', message: error.message });
            }
        });

        // Endpoint sauvegarde manuelle
        app.post('/force-backup', async (req, res) => {
            try {
                const success = await deploymentManager.emergencyBackup();
                res.json({
                    success: success,
                    message: success ? 'Sauvegarde réussie' : 'Échec de la sauvegarde',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.json({ status: 'error', message: error.message });
            }
        });

        // Démarrer le serveur web AVANT Discord
        app.listen(PORT, '0.0.0.0', () => {
            console.log('🌐 Serveur Web actif sur port', PORT);
            console.log('📊 Status: http://localhost:5000/commands-status');
            console.log('✅ Port 5000 ouvert pour Render.com');
            
            // 2. Initialiser le système de sauvegarde et Discord
            setTimeout(() => this.initializeSystemsAndDiscord(), 1000);
        });
    }

    async initializeSystemsAndDiscord() {
        // 1. Initialiser le système de sauvegarde et restauration
        console.log('🛡️ Initialisation du système de sauvegarde MongoDB...');
        try {
            const isNewDeployment = await deploymentManager.initializeDeployment();
            if (isNewDeployment) {
                console.log('📥 Premier déploiement - données restaurées depuis MongoDB');
            } else {
                console.log('🔄 Redémarrage - données vérifiées');
            }
        } catch (error) {
            console.error('⚠️ Erreur système de sauvegarde:', error.message);
            console.log('📁 Continuation avec fichiers locaux uniquement');
        }

        // 2. Initialiser Discord
        await this.initializeDiscord();
    }

    async initializeDiscord() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates
            ]
        });

        this.commands = new Collection();
        await this.loadCommands();
        await this.setupEventHandlers();

        try {
            await this.client.login(process.env.DISCORD_TOKEN);
        } catch (error) {
            console.error('❌ Erreur connexion Discord:', error);
            process.exit(1);
        }
    }

    async loadCommands() {
        try {
            console.log('📂 Chargement des commandes...');
            const commandsPath = path.join(__dirname, 'commands');
            const commandFiles = await fs.readdir(commandsPath);

            for (const file of commandFiles.filter(file => file.endsWith('.js'))) {
                try {
                    const filePath = path.join(commandsPath, file);
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);

                    if ('data' in command && 'execute' in command) {
                        this.commands.set(command.data.name, command);
                        console.log(`✅ ${command.data.name}`);
                    } else {
                        console.log(`❌ ${file} manque data ou execute`);
                    }
                } catch (error) {
                    console.error(`❌ Erreur ${file}:`, error.message);
                }
            }

            console.log(`✅ ${this.commands.size} commandes chargées`);
        } catch (error) {
            console.error('❌ Erreur chargement commandes:', error);
        }
    }

    async setupEventHandlers() {
        this.client.once('ready', async () => {
            console.log(`✅ ${this.client.user.tag} connecté`);
            console.log(`🏰 ${this.client.guilds.cache.size} serveur(s)`);
            console.log(`📋 Commandes disponibles: ${this.commands.size}`);
            
            this.commands.forEach(command => {
                console.log(`  - ${command.data.name}`);
            });

            await this.deployCommands();
        });

        this.client.on('interactionCreate', async interaction => {
            await this.handleInteraction(interaction);
        });

        this.client.on('messageCreate', async message => {
            if (message.author.bot) return;
            
            try {
                // TOUJOURS incrémenter le compteur de messages d'abord
                await this.incrementMessageCount(message);
                
                const countingHandled = await this.handleCounting(message);
                
                if (!countingHandled) {
                    await this.handleMessageReward(message);
                }
                
                // Ajouter de l'XP pour les messages
                await this.handleLevelXP(message);
                
                await this.handleAutoThread(message);
                
            } catch (error) {
                console.error('❌ Erreur messageCreate:', error);
            }
        });

        this.client.on('voiceStateUpdate', async (oldState, newState) => {
            await this.handleVoiceXP(oldState, newState);
        });

        this.client.on('error', error => {
            console.error('❌ Erreur Discord:', error);
        });
    }

    async deployCommands() {
        try {
            for (const guild of this.client.guilds.cache.values()) {
                console.log(`🎯 Serveur: ${guild.name} (${guild.id})`);
                console.log(`🔄 Enregistrement serveur spécifique: ${guild.id}...`);
                
                const commands = Array.from(this.commands.values()).map(command => command.data.toJSON());
                console.log(`📝 Préparation de ${commands.length} commandes pour enregistrement`);
                
                commands.forEach(cmd => {
                    console.log(`   • ${cmd.name} (${cmd.description})`);
                });

                const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
                
                await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
                    { body: commands }
                );
                
                console.log(`✅ ${commands.length} commandes enregistrées sur serveur ${guild.id}`);
            }
        } catch (error) {
            console.error('❌ Erreur déploiement commandes:', error);
        }
    }

    async handleInteraction(interaction) {
        try {
            const MainRouterHandler = require('./handlers/MainRouterHandler');
            const dataManager = require('./utils/simpleDataManager');
            const router = new MainRouterHandler(dataManager);

            if (interaction.isChatInputCommand()) {
                const command = this.commands.get(interaction.commandName);
                if (!command) {
                    console.error(`❌ Commande non trouvée: ${interaction.commandName}`);
                    return;
                }

                console.log(`🔧 /${interaction.commandName} par ${interaction.user.tag}`);
                await command.execute(interaction, dataManager);
            } 
            else if (interaction.isModalSubmit()) {
                console.log(`📝 Modal: ${interaction.customId}`);
                
                try {
                    // Gestion des modals de configuration level
                    if (interaction.customId === 'text_xp_modal') {
                        const LevelConfigHandler = require('./handlers/LevelConfigHandler');
                        const levelHandler = new LevelConfigHandler();
                        await levelHandler.handleTextXPModal(interaction);
                        return;
                    }
                    
                    if (interaction.customId === 'voice_xp_modal') {
                        const LevelConfigHandler = require('./handlers/LevelConfigHandler');
                        const levelHandler = new LevelConfigHandler();
                        await levelHandler.handleVoiceXPModal(interaction);
                        return;
                    }
                    
                    // Gestion des nouveaux modals de configuration niveau
                    if (interaction.customId === 'add_role_reward_modal' ||
                        interaction.customId === 'base_xp_modal' ||
                        interaction.customId === 'multiplier_modal' ||
                        interaction.customId.startsWith('level_for_role_')) {
                        
                        console.log('🎯 Modal niveau:', interaction.customId);
                        const levelManager = require('./utils/levelManager');
                        
                        if (interaction.customId === 'add_role_reward_modal') {
                            const level = parseInt(interaction.fields.getTextInputValue('level'));
                            const roleId = interaction.fields.getTextInputValue('role_id');
                            
                            if (isNaN(level) || level < 1) {
                                await interaction.reply({
                                    content: '❌ Le niveau doit être un nombre entier positif.',
                                    flags: 64
                                });
                                return;
                            }
                            
                            const config = levelManager.loadConfig();
                            if (!config.roleRewards) config.roleRewards = {};
                            config.roleRewards[level] = roleId;
                            levelManager.saveConfig(config);
                            
                            await interaction.reply({
                                content: `✅ Récompense ajoutée: Niveau ${level} → <@&${roleId}>`,
                                flags: 64
                            });
                            
                        } else if (interaction.customId === 'base_xp_modal') {
                            const baseXP = parseInt(interaction.fields.getTextInputValue('base_xp'));
                            
                            if (isNaN(baseXP) || baseXP < 1) {
                                await interaction.reply({
                                    content: '❌ L\'XP de base doit être un nombre entier positif.',
                                    flags: 64
                                });
                                return;
                            }
                            
                            const config = levelManager.loadConfig();
                            config.levelFormula.baseXP = baseXP;
                            levelManager.saveConfig(config);
                            
                            await interaction.reply({
                                content: `✅ XP de base défini à ${baseXP} XP.`,
                                flags: 64
                            });
                            
                        } else if (interaction.customId === 'multiplier_modal') {
                            const multiplier = parseFloat(interaction.fields.getTextInputValue('multiplier'));
                            
                            if (isNaN(multiplier) || multiplier <= 1) {
                                await interaction.reply({
                                    content: '❌ Le multiplicateur doit être un nombre supérieur à 1.',
                                    flags: 64
                                });
                                return;
                            }
                            
                            const config = levelManager.loadConfig();
                            config.levelFormula.multiplier = multiplier;
                            levelManager.saveConfig(config);
                            
                            await interaction.reply({
                                content: `✅ Multiplicateur défini à ${multiplier}.`,
                                flags: 64
                            });
                            
                        } else if (interaction.customId.startsWith('level_for_role_')) {
                            // Modal pour définir le niveau requis pour un rôle
                            const roleId = interaction.customId.replace('level_for_role_', '');
                            const level = parseInt(interaction.fields.getTextInputValue('level_required'));
                            
                            if (isNaN(level) || level < 1 || level > 999) {
                                await interaction.reply({
                                    content: '❌ Le niveau doit être un nombre entre 1 et 999.',
                                    flags: 64
                                });
                                return;
                            }
                            
                            const config = levelManager.loadConfig();
                            if (!config.roleRewards) config.roleRewards = {};
                            config.roleRewards[level] = roleId;
                            levelManager.saveConfig(config);
                            
                            await interaction.reply({
                                content: `✅ Récompense configurée: Niveau **${level}** → <@&${roleId}>`,
                                flags: 64
                            });
                        }
                        
                        return;
                    }
                    
                    // Autres modals...
                    const dataManager = require('./utils/simpleDataManager');
                    const MainRouterHandler = require('./handlers/MainRouterHandler');
                    const router = new MainRouterHandler(dataManager);
                    
                    const handled = await router.handleInteraction(interaction);
                    
                    if (!handled && !interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Cette modal n\'est pas encore implémentée.',
                            flags: 64
                        });
                    }
                    
                } catch (error) {
                    console.error(`❌ Erreur modal ${interaction.customId}:`, error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Erreur lors du traitement du formulaire.',
                            flags: 64
                        });
                    }
                }
            }
            
            else if (interaction.isStringSelectMenu() || interaction.isUserSelectMenu() || interaction.isChannelSelectMenu() || interaction.isRoleSelectMenu() || interaction.isButton()) {
                const customId = interaction.customId;
                console.log(`🔄 MainRouter traite: ${customId}`);
                

                
                // Routage level config menu - priorité haute
                if (customId === 'level_config_menu') {
                    console.log('🎯 Menu level_config_menu détecté, valeur:', interaction.values[0]);
                    const LevelConfigHandler = require('./handlers/LevelConfigHandler');
                    const levelHandler = new LevelConfigHandler();
                    const selectedValue = interaction.values[0];
                    
                    try {
                        if (selectedValue === 'text_xp') {
                            console.log('🔧 Appel handleTextXPConfig...');
                            await levelHandler.handleTextXPConfig(interaction);
                        } else if (selectedValue === 'voice_xp') {
                            console.log('🔧 Appel handleVoiceXPConfig...');
                            await levelHandler.handleVoiceXPConfig(interaction);
                        } else if (selectedValue === 'notifications') {
                            console.log('🔧 Appel handleNotificationsConfig...');
                            await levelHandler.handleNotificationsConfig(interaction);
                        } else if (selectedValue === 'role_rewards') {
                            console.log('🔧 Appel handleRoleRewardsConfig...');
                            await levelHandler.handleRoleRewardsConfig(interaction);
                        } else if (selectedValue === 'level_formula') {
                            console.log('🔧 Appel handleLevelFormulaConfig...');
                            await levelHandler.handleLevelFormulaConfig(interaction);
                        } else if (selectedValue === 'leaderboard') {
                            console.log('🔧 Appel handleLeaderboardActions...');
                            await levelHandler.handleLeaderboardActions(interaction);
                        } else {
                            console.log('❌ Valeur non reconnue:', selectedValue);
                            await interaction.reply({
                                content: `❌ Option non reconnue: ${selectedValue}`,
                                flags: 64
                            });
                        }
                    } catch (error) {
                        console.error('❌ Erreur level config menu:', error);
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({
                                content: '❌ Erreur lors du traitement de la configuration.',
                                flags: 64
                            });
                        }
                    }
                    return;
                }

                // Routage pour les sous-menus de configuration des niveaux
                if (customId === 'notifications_config_menu' || 
                    customId === 'role_rewards_config_menu' || 
                    customId === 'level_formula_config_menu' ||
                    customId === 'level_notification_channel' ||
                    customId === 'level_card_style' ||
                    customId === 'remove_role_reward' ||
                    customId === 'add_role_reward_select') {
                    
                    console.log('🎯 Routage sous-menu niveau:', customId);
                    const LevelConfigHandler = require('./handlers/LevelConfigHandler');
                    const levelHandler = new LevelConfigHandler();
                    
                    try {
                        if (customId === 'level_notification_channel') {
                            const channelId = interaction.values[0];
                            const levelManager = require('./utils/levelManager');
                            const config = levelManager.loadConfig();
                                                        
                            // Mettre à jour les deux propriétés pour assurer la compatibilité
                            config.notifications.channel = channelId;
                                                        config.notifications.channelId = channelId;
                            levelManager.saveConfig(config);
                                                        
                            const channel = await interaction.guild.channels.fetch(channelId);
                            
                            await interaction.update({
                              content: `✅ Canal de notification défini sur   ${channel.name}`,
                                embeds: [],
                                components: []
                            });
                            
                      
                                content: `✅ Canal de notification défini sur <#${channelId}>.`,
                                embeds: [],
                                components: []
                            });
                              // Retour automatique au menu après 2 secondes
                                    setTimeout(async () => {
                                try {
                                const LevelConfigHandler = require('./handlers/LevelConfigHandler');
                                    const levelHandler = new LevelConfigHandler();
                                            await levelHandler.showNotificationsConfig(interaction);
                                } catch (error) {
                               console.error('Erreur retour menu notifications:', error);
                                }
                            }, 2000);
                                 
                            // Pas de setTimeout - retour au menu sera fait manuellement
                            
                        } else if (customId === 'level_card_style') {
                            const style = interaction.values[0];
                            const levelManager = require('./utils/levelManager');
                            const config = levelManager.loadConfig();
                            config.notifications.cardStyle = style;
                            levelManager.saveConfig(config);
                            
                            await interaction.update({
                                content: `✅ Style de carte changé en **${style}**.`,
                                embeds: [],
                                components: []
                            });
                            // Pas de setTimeout - retour au menu sera fait manuellement
                            
                        } else if (customId === 'remove_role_reward') {
                            const level = interaction.values[0];
                            const levelManager = require('./utils/levelManager');
                            const config = levelManager.loadConfig();
                            
                            if (config.roleRewards && config.roleRewards[level]) {
                                delete config.roleRewards[level];
                                levelManager.saveConfig(config);
                                
                                await interaction.update({
                                    content: `✅ Récompense du niveau ${level} supprimée.`,
                                    embeds: [],
                                    components: []
                                });
                                // Pas de setTimeout - retour au menu sera fait manuellement
                            } else {
                                await interaction.update({
                                    content: '❌ Récompense introuvable.',
                                    embeds: [],
                                    components: []
                                });
                            }
                            
                        } else if (customId === 'add_role_reward_select') {
                            // Sélection de rôle pour récompense
                            const roleId = interaction.values[0];
                            console.log('🎯 Rôle sélectionné pour récompense:', roleId);
                            
                            // Créer modal pour saisir le niveau
                            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
                            const modal = new ModalBuilder()
                                .setCustomId(`level_for_role_${roleId}`)
                                .setTitle('Niveau requis pour ce rôle');

                            const levelInput = new TextInputBuilder()
                                .setCustomId('level_required')
                                .setLabel('Niveau requis')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('Ex: 5, 10, 20...')
                                .setMinLength(1)
                                .setMaxLength(3)
                                .setRequired(true);

                            modal.addComponents(new ActionRowBuilder().addComponents(levelInput));
                            await interaction.showModal(modal);
                            
                        } else {
                            const selectedValue = interaction.values[0];
                            
                            if (selectedValue === 'back_main') {
                                await levelHandler.handleLevelConfigMenu(interaction);
                            } else if (customId === 'notifications_config_menu') {
                                await this.handleNotificationConfigAction(interaction, selectedValue, levelHandler);
                            } else if (customId === 'role_rewards_config_menu') {
                                await this.handleRoleRewardsConfigAction(interaction, selectedValue, levelHandler);
                            } else if (customId === 'level_formula_config_menu') {
                                await this.handleLevelFormulaConfigAction(interaction, selectedValue, levelHandler);
                            }
                        }
                    } catch (error) {
                        console.error('❌ Erreur sous-menu niveau:', error);
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({
                                content: '❌ Erreur lors du traitement de la configuration.',
                                flags: 64
                            });
                        }
                    }
                    return;
                }
                
                // Routage spécial pour les remises karma
                if (customId === 'karma_discounts_menu' ||
                    customId === 'karma_discounts_actions' ||
                    customId.startsWith('create_karma_discount_modal') || 
                    customId.startsWith('edit_karma_discount_modal') || 
                    customId.startsWith('modify_karma_discount_') || 
                    customId.startsWith('delete_karma_discount_')) {
                    
                    console.log('🎯 Routage remises karma:', customId);
                    const economyHandler = router.handlers.economy;
                    
                    if (customId === 'karma_discounts_menu') {
                        console.log('🔍 Appel showKarmaDiscountsConfig...');
                        try {
                            await economyHandler.showKarmaDiscountsConfig(interaction);
                            console.log('✅ showKarmaDiscountsConfig exécuté avec succès');
                        } catch (error) {
                            console.error('❌ Erreur showKarmaDiscountsConfig:', error);
                            await interaction.reply({ content: '❌ Erreur lors de l\'affichage des remises karma', flags: 64 });
                        }
                    } else if (customId === 'karma_discounts_actions') {
                        console.log('🔍 Traitement actions remises karma');
                        await economyHandler.handleKarmaDiscountsAction(interaction);
                    } else if (customId.startsWith('create_karma_discount_modal')) {
                        await economyHandler.handleCreateKarmaDiscountModal(interaction);
                    } else if (customId.startsWith('edit_karma_discount_modal')) {
                        await economyHandler.handleEditKarmaDiscountModal(interaction);
                    } else if (customId.startsWith('modify_karma_discount_')) {
                        await economyHandler.handleModifyKarmaDiscountSelect(interaction);
                    } else if (customId.startsWith('delete_karma_discount_')) {
                        await economyHandler.handleDeleteKarmaDiscountSelect(interaction);
                    }
                    return;
                }

                // Routage pour achats boutique avec remises automatiques
                if (customId === 'shop_purchase') {
                    console.log('🎯 Routage achat boutique avec remises karma: shop_purchase');
                    await handleShopPurchase(interaction, dataManager);
                    return;
                }

                // Routage pour la commande /objet
                if (customId === 'object_selection' || 
                    customId === 'object_action_menu' ||
                    customId.startsWith('object_offer_') ||
                    customId.startsWith('object_delete_') ||
                    customId.startsWith('object_custom_') ||
                    customId.startsWith('offer_user_select_') ||
                    customId.startsWith('custom_user_select_') ||
                    customId.startsWith('custom_message_modal_') ||
                    customId.startsWith('confirm_delete_') ||
                    customId === 'cancel_delete') {
                    
                    console.log('🎯 Routage objet:', customId);
                    await handleObjectInteraction(interaction, dataManager);
                    return;
                }

                // Routage spécial pour les sélecteurs de canal comptage
                if (interaction.isChannelSelectMenu() && customId === 'counting_add_channel') {
                    console.log('🎯 Routage sélection canal comptage:', customId);
                    const countingHandler = router.handlers.counting;
                    await countingHandler.handleAddChannel(interaction);
                    return;
                }

                // Gestion des modals d'actions économiques
                if (customId.startsWith('action_karma_modal_') || 
                    customId.startsWith('action_cooldown_modal_') || 
                    customId.startsWith('action_rewards_modal_')) {
                    try {
                        const actionName = customId.split('_').pop();
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const handler = new EconomyConfigHandler(dataManager);
                        
                        if (customId.startsWith('action_karma_modal_')) {
                            await handler.handleActionKarmaModal(interaction, actionName);
                        } else if (customId.startsWith('action_cooldown_modal_')) {
                            await handler.handleActionCooldownModal(interaction, actionName);
                        } else if (customId.startsWith('action_rewards_modal_')) {
                            await handler.handleActionRewardsModal(interaction, actionName);
                        }
                    } catch (error) {
                        console.error('❌ Erreur modal action:', error);
                        if (!interaction.replied) {
                            await interaction.reply({
                                content: '❌ Erreur lors du traitement de la configuration.',
                                flags: 64
                            });
                        }
                    }
                    return;
                }

                // Ce routage est géré plus haut dans le code - supprimé pour éviter la duplication

                // Routage via MainRouter pour le reste
                const handled = await router.handleInteraction(interaction);
                
                if (!handled && !interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: '❌ Cette interaction n\'est pas encore implémentée.', 
                        flags: 64 
                    });
                }
            }

        } catch (error) {
            console.error('❌ Erreur interaction:', error);
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({
                        content: '❌ Erreur lors du traitement de l\'interaction.',
                        flags: 64
                    });
                } catch (replyError) {
                    console.error('❌ Erreur envoi réponse:', replyError);
                }
            }
        }
    }

    async incrementMessageCount(message) {
        try {
            const dataManager = require('./utils/simpleDataManager');
            const userId = message.author.id;
            const guildId = message.guild.id;
            
            // Incrémenter dans economy.json (format principal)
            const economyData = await dataManager.loadData('economy.json', {});
            const userKey = `${userId}_${guildId}`;
            
            if (!economyData[userKey]) {
                economyData[userKey] = {
                    balance: 0,
                    goodKarma: 0,
                    badKarma: 0,
                    dailyStreak: 0,
                    lastDaily: 0,
                    messageCount: 0
                };
            }
            
            economyData[userKey].messageCount = (economyData[userKey].messageCount || 0) + 1;
            await dataManager.saveData('economy.json', economyData);
            
            // Aussi incrémenter dans level_users.json pour cohérence
            const levelData = await dataManager.loadData('level_users.json', {});
            const levelKey = `${guildId}_${userId}`;
            
            if (!levelData[levelKey]) {
                levelData[levelKey] = {
                    userId: userId,
                    guildId: guildId,
                    xp: 0,
                    level: 1,
                    totalMessages: 0,
                    totalVoiceTime: 0,
                    lastMessageTime: 0,
                    lastVoiceTime: 0
                };
            }
            
            levelData[levelKey].totalMessages = (levelData[levelKey].totalMessages || 0) + 1;
            levelData[levelKey].lastMessageTime = Date.now();
            await dataManager.saveData('level_users.json', levelData);
            
            console.log(`📊 ${message.author.tag} - Messages: ${economyData[userKey].messageCount} (Economy), ${levelData[levelKey].totalMessages} (Level)`);
            
        } catch (error) {
            console.error('❌ Erreur comptage messages:', error);
        }
    }

    async handleMessageReward(message) {
        try {
            const dataManager = require('./utils/simpleDataManager');
            const messageRewards = dataManager.getData('message_rewards.json');
            const cooldowns = dataManager.getData('message_cooldowns.json');
            
            const guildConfig = messageRewards[message.guild.id];
            if (!guildConfig || !guildConfig.enabled) return;
            
            const userId = message.author.id;
            const guildId = message.guild.id;
            const cooldownKey = `${userId}_${guildId}`;
            const now = Date.now();
            
            if (cooldowns[cooldownKey] && (now - cooldowns[cooldownKey]) < (guildConfig.cooldown * 1000)) {
                return;
            }
            
            cooldowns[cooldownKey] = now;
            dataManager.setData('message_cooldowns.json', cooldowns);
            
            const user = await dataManager.getUser(userId, guildId);
            user.balance = (user.balance || 1000) + guildConfig.amount;
            user.messageCount = (user.messageCount || 0) + 1;
            
            await dataManager.updateUser(userId, guildId, user);
            
            console.log(`💰 ${message.author.tag} a gagné ${guildConfig.amount}€ en envoyant un message`);
            
        } catch (error) {
            console.error('❌ Erreur récompense message:', error);
        }
    }

    async handleAutoThread(message) {
        try {
            const dataManager = require('./utils/simpleDataManager');
            const config = await dataManager.loadData('autothread.json', {});
            const guildId = message.guild.id;
            const channelId = message.channel.id;
            
            const autoThreadConfig = config[guildId];
            if (!autoThreadConfig || !autoThreadConfig.enabled) return;
            
            const isChannelConfigured = autoThreadConfig.channels?.some(c => 
                (typeof c === 'string' ? c : c.channelId) === channelId
            );
            if (!isChannelConfigured) return;
            
            if (message.channel.isThread() || message.channel.type !== 0) return;
            
            let threadName = autoThreadConfig.threadName || 'Discussion - {user}';
            threadName = threadName
                .replace('{user}', message.author.displayName || message.author.username)
                .replace('{channel}', message.channel.name)
                .replace('{date}', new Date().toLocaleDateString('fr-FR'))
                .replace('{time}', new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
            
            threadName = threadName.substring(0, 100);
            
            const thread = await message.startThread({
                name: threadName,
                autoArchiveDuration: parseInt(autoThreadConfig.archiveTime) || 60,
                reason: `Auto-thread créé par ${message.author.tag}`
            });
            
            if (autoThreadConfig.slowMode && autoThreadConfig.slowMode > 0) {
                await thread.setRateLimitPerUser(parseInt(autoThreadConfig.slowMode));
            }
            
            if (!config[guildId].stats) {
                config[guildId].stats = { threadsCreated: 0, lastCreated: null };
            }
            config[guildId].stats.threadsCreated += 1;
            config[guildId].stats.lastCreated = new Date().toISOString();
            
            await dataManager.saveData('autothread.json', config);
            
            console.log(`🧵 Thread créé: "${threadName}" dans #${message.channel.name} par ${message.author.tag}`);
            
        } catch (error) {
            console.error('❌ Erreur création auto-thread:', error);
        }
    }

    async handleCounting(message) {
        try {
            // Utiliser le CountingManager complet au lieu de la logique simplifiée
            const countingManager = require('./utils/countingManager');
            
            const guildConfig = countingManager.getCountingConfig(message.guild.id);
            if (!guildConfig || !guildConfig.channels || guildConfig.channels.length === 0) {
                return false;
            }
            
            const channelConfig = guildConfig.channels.find(c => c.channelId === message.channel.id);
            if (!channelConfig || !channelConfig.enabled) {
                return false;
            }
            
            console.log(`🔍 Traitement comptage: "${message.content}" dans canal ${message.channel.id}`);
            console.log(`📊 État actuel: currentNumber=${channelConfig.currentNumber}, attendu=${channelConfig.currentNumber + 1}`);
            
            // Utiliser la validation complète du CountingManager
            const validationResult = await countingManager.validateCountingMessage(message);
            
            console.log(`✅ Résultat validation complet:`, validationResult);
            
            if (validationResult.valid) {
                // Message valide - traiter avec CountingManager
                await countingManager.processCountingMessage(message, validationResult);
                console.log(`🎯 ${message.author.tag} a compté correctement: ${validationResult.number} (prochain: ${validationResult.number + 1})`);
                return true;
            } else {
                // Message invalide - RESET IMMÉDIAT SILENCIEUX
                if (!validationResult.ignore && validationResult.shouldReset) {
                    // Reset immédiat SANS embed
                    const config = countingManager.getCountingConfig(message.guild.id);
                    const channelConfig = config.channels.find(c => c.channelId === message.channel.id);
                    
                    if (channelConfig) {
                        channelConfig.currentNumber = 0;
                        channelConfig.lastUserId = null;
                        channelConfig.lastMessageId = null;
                        channelConfig.lastTimestamp = new Date().toISOString();
                        countingManager.saveCountingConfig(message.guild.id, config);
                        console.log(`🔄 Reset silencieux effectué - ${message.author.tag}`);
                    }
                    
                    await countingManager.processInvalidMessage(message, validationResult);
                }
                console.log(`❌ ${message.author.tag} a échoué silencieusement: "${message.content}" - ${validationResult.reason || 'Invalide'}`);
                return true; // Toujours retourner true car c'est un canal de comptage actif
            }
            
        } catch (error) {
            console.error('❌ Erreur handleCounting:', error);
            return false;
        }
    }

    async handleLevelXP(message) {
        try {
            // Ajouter de l'XP pour les messages
            const result = await levelManager.addTextXP(message.author.id, message.guild.id, {
                user: message.author,
                guild: message.guild,
                channel: message.channel
            });
            
            if (result && result.leveledUp) {
                console.log(`🎉 ${message.author.tag} a atteint le niveau ${result.newLevel} !`);
            }
            
        } catch (error) {
            console.error('❌ Erreur XP message:', error);
        }
    }

    async handleVoiceXP(oldState, newState) {
        try {
            const userId = newState.id;
            const guild = newState.guild;
            
            // Utilisateur rejoint un canal vocal (n'était pas en vocal avant)
            if (!oldState.channel && newState.channel) {
                this.startVoiceXPTracking(userId, guild);
            }
            // Utilisateur quitte le vocal (était en vocal, plus maintenant)
            else if (oldState.channel && !newState.channel) {
                this.stopVoiceXPTracking(userId);
            }
            
        } catch (error) {
            console.error('❌ Erreur voice state update:', error);
        }
    }

    startVoiceXPTracking(userId, guild) {
        if (!this.voiceIntervals) {
            this.voiceIntervals = new Map();
        }
        
        // Si déjà en cours, arrêter l'ancien
        if (this.voiceIntervals.has(userId)) {
            clearInterval(this.voiceIntervals.get(userId));
        }
        
        const config = levelManager.loadConfig();
        const interval = setInterval(async () => {
            try {
                const result = await levelManager.addVoiceXP(userId, guild.id, {
                    user: { username: `User${userId}` },
                    guild: guild
                });
                
                if (result && result.leveledUp) {
                    console.log(`🎉 ${userId} a atteint le niveau ${result.newLevel} en vocal !`);
                }
            } catch (error) {
                console.error('❌ Erreur XP vocal interval:', error);
            }
        }, config.voiceXP.interval);
        
        this.voiceIntervals.set(userId, interval);
        console.log(`🎤 Suivi XP vocal démarré pour ${userId}`);
    }

    stopVoiceXPTracking(userId) {
        if (this.voiceIntervals && this.voiceIntervals.has(userId)) {
            clearInterval(this.voiceIntervals.get(userId));
            this.voiceIntervals.delete(userId);
            console.log(`🎤 Suivi XP vocal arrêté pour ${userId}`);
        }
    }

    async handleNotificationConfigAction(interaction, selectedValue, levelHandler) {
        const { ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder } = require('discord.js');
        const levelManager = require('./utils/levelManager');
        const config = levelManager.loadConfig();

        switch (selectedValue) {
            case 'toggle_notifications':
                config.notifications.enabled = !config.notifications.enabled;
                levelManager.saveConfig(config);
                await interaction.update({
                    content: `✅ Notifications ${config.notifications.enabled ? 'activées' : 'désactivées'}.`,
                    embeds: [],
                    components: []
                });
                // Retour automatique au menu après 2 secondes
                setTimeout(async () => {
                    try {
                        await levelHandler.showNotificationsConfig({ 
                            ...interaction, 
                            update: (options) => interaction.editReply(options) 
                        });
                    } catch (error) {
                        console.log('Timeout notification config - interaction expirée');
                    }
                }, 2000);
                break;

            case 'set_channel':
                const channelRow = new ActionRowBuilder()
                    .addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId('level_notification_channel')
                            .setPlaceholder('Sélectionnez un canal pour les notifications')
                            .addChannelTypes([0]) // Text channels only
                    );
                
                await interaction.update({
                    content: 'Sélectionnez le canal pour les notifications de niveau:',
                    embeds: [],
                    components: [channelRow]
                });
                break;

            case 'card_style':
                const styleRow = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('level_card_style')
                            .setPlaceholder('Choisissez un style de carte...')
                            .addOptions([
                                { label: '🚀 Futuristic', value: 'futuristic' },
                                { label: '✨ Elegant', value: 'elegant' },
                                { label: '🎮 Gaming', value: 'gaming' },
                                { label: '🎯 Minimal', value: 'minimal' },
                                { label: '🌈 Holographic', value: 'holographic' },
                                { label: '🎮 Gamer Néon', value: 'gamer' },
                                { label: '💖 Amour', value: 'amour' },
                                { label: '✨ Sensuel', value: 'sensuel' }
                            ])
                    );
                
                await interaction.update({
                    content: 'Choisissez le style des cartes de niveau:',
                    embeds: [],
                    components: [styleRow]
                });
                break;

            default:
                await interaction.reply({
                    content: '❌ Action non reconnue.',
                    flags: 64
                });
        }
    }

    async handleRoleRewardsConfigAction(interaction, selectedValue, levelHandler) {
        const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, RoleSelectMenuBuilder } = require('discord.js');
        const levelManager = require('./utils/levelManager');
        const config = levelManager.loadConfig();

        switch (selectedValue) {
            case 'add_role_reward':
                // Nouveau système: sélecteur de rôle d'abord
                const roleRow = new ActionRowBuilder()
                    .addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId('add_role_reward_select')
                            .setPlaceholder('Choisissez le rôle à attribuer comme récompense...')
                            .setMaxValues(1)
                    );
                
                await interaction.update({
                    content: '🎁 **Étape 1/2**: Sélectionnez le rôle que vous voulez attribuer en récompense:',
                    embeds: [],
                    components: [roleRow]
                });
                break;

            case 'list_rewards':
                const rewards = config.roleRewards || {};
                const rewardsList = Object.keys(rewards).length > 0 
                    ? Object.entries(rewards).map(([level, roleId]) => 
                        `Niveau ${level}: <@&${roleId}>`).join('\n')
                    : 'Aucune récompense configurée';

                await interaction.update({
                    content: `📋 **Récompenses configurées:**\n\n${rewardsList}`,
                    embeds: [],
                    components: []
                });
                // Retour automatique au menu après 5 secondes
                setTimeout(async () => {
                    try {
                        await levelHandler.showRoleRewardsConfig({ 
                            ...interaction, 
                            update: (options) => interaction.editReply(options) 
                        });
                    } catch (error) {
                        console.log('Timeout role rewards config - interaction expirée');
                    }
                }, 5000);
                break;

            case 'remove_reward':
                const rewardsToRemove = config.roleRewards || {};
                if (Object.keys(rewardsToRemove).length === 0) {
                    await interaction.update({
                        content: '❌ Aucune récompense à supprimer.',
                        embeds: [],
                        components: []
                    });
                    setTimeout(() => levelHandler.showRoleRewardsConfig(interaction), 3000);
                    return;
                }

                const removeRow = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('remove_role_reward')
                            .setPlaceholder('Choisissez une récompense à supprimer...')
                            .addOptions(
                                Object.entries(rewardsToRemove).map(([level, roleId]) => ({
                                    label: `Niveau ${level}`,
                                    description: `Supprime la récompense du niveau ${level}`,
                                    value: level
                                }))
                            )
                    );

                await interaction.update({
                    content: 'Sélectionnez la récompense à supprimer:',
                    embeds: [],
                    components: [removeRow]
                });
                break;

            default:
                await interaction.reply({
                    content: '❌ Action non reconnue.',
                    flags: 64
                });
        }
    }

    async handleLevelFormulaConfigAction(interaction, selectedValue, levelHandler) {
        const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
        const levelManager = require('./utils/levelManager');
        const config = levelManager.loadConfig();

        switch (selectedValue) {
            case 'base_xp':
                const baseXPModal = new ModalBuilder()
                    .setCustomId('base_xp_modal')
                    .setTitle('Modifier l\'XP de base');

                const baseXPInput = new TextInputBuilder()
                    .setCustomId('base_xp')
                    .setLabel('XP requis pour le niveau 1')
                    .setStyle(TextInputStyle.Short)
                    .setValue(config.levelFormula.baseXP.toString())
                    .setPlaceholder('Ex: 100')
                    .setRequired(true);

                baseXPModal.addComponents(new ActionRowBuilder().addComponents(baseXPInput));
                await interaction.showModal(baseXPModal);
                break;

            case 'multiplier':
                const multiplierModal = new ModalBuilder()
                    .setCustomId('multiplier_modal')
                    .setTitle('Modifier le multiplicateur');

                const multiplierInput = new TextInputBuilder()
                    .setCustomId('multiplier')
                    .setLabel('Multiplicateur de difficulté')
                    .setStyle(TextInputStyle.Short)
                    .setValue(config.levelFormula.multiplier.toString())
                    .setPlaceholder('Ex: 1.5')
                    .setRequired(true);

                multiplierModal.addComponents(new ActionRowBuilder().addComponents(multiplierInput));
                await interaction.showModal(multiplierModal);
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
                        await levelHandler.showLevelFormulaConfig({ 
                            ...interaction, 
                            update: (options) => interaction.editReply(options) 
                        });
                    } catch (error) {
                        console.log('Timeout level formula config - interaction expirée');
                    }
                }, 3000);
                break;

            default:
                await interaction.reply({
                    content: '❌ Action non reconnue.',
                    flags: 64
                });
        }
    }
}

// Variables globales pour les cooldowns des messages
const cooldowns = {};

// Fonction pour gérer les achats avec remises karma automatiques
async function handleShopPurchase(interaction, dataManager) {
    try {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const itemId = interaction.values[0];

        // Charger les données
        const userData = await dataManager.getUser(userId, guildId);
        const shopData = await dataManager.loadData('shop.json', {});
        const economyConfig = await dataManager.loadData('economy.json', {});
        const shopItems = shopData[guildId] || [];

        // Trouver l'objet sélectionné
        const item = shopItems.find(i => (i.id || shopItems.indexOf(i)).toString() === itemId);
        if (!item) {
            return await interaction.reply({
                content: '❌ Objet introuvable dans la boutique.',
                flags: 64
            });
        }

        // Calculer le karma net et la remise
        const userKarmaNet = (userData.goodKarma || 0) + (userData.badKarma || 0);
        let discountPercent = 0;
        
        if (economyConfig.karmaDiscounts?.enabled && economyConfig.karmaDiscounts?.ranges) {
            const applicableRanges = economyConfig.karmaDiscounts.ranges.filter(range => userKarmaNet >= range.minKarma);
            const bestRange = applicableRanges.sort((a, b) => b.minKarma - a.minKarma)[0];
            discountPercent = bestRange ? bestRange.discount : 0;
        }

        // Calculer le prix final avec remise
        const originalPrice = item.price;
        const finalPrice = discountPercent > 0 ? 
            Math.floor(originalPrice * (100 - discountPercent) / 100) : originalPrice;

        // Vérifier si l'utilisateur a assez d'argent
        if (userData.balance < finalPrice) {
            const missingAmount = finalPrice - userData.balance;
            return await interaction.reply({
                content: `❌ **Solde insuffisant !**\n\n💰 Prix: ${finalPrice}€ ${discountPercent > 0 ? `(remise ${discountPercent}% appliquée)` : ''}\n💳 Votre solde: ${userData.balance}€\n❌ Manque: ${missingAmount}€`,
                flags: 64
            });
        }

        // Déduire l'argent
        userData.balance -= finalPrice;

        // Ajouter l'objet à l'inventaire
        if (!userData.inventory) userData.inventory = [];
        
        const inventoryItem = {
            id: item.id || Date.now().toString(),
            name: item.name,
            description: item.description || 'Objet de la boutique',
            type: item.type || 'custom',
            price: finalPrice,
            purchaseDate: new Date().toISOString(),
            from: 'shop'
        };

        if (item.type === 'temporary_role' && item.roleId && item.duration) {
            inventoryItem.roleId = item.roleId;
            inventoryItem.duration = item.duration;
            inventoryItem.expiresAt = new Date(Date.now() + (item.duration * 24 * 60 * 60 * 1000)).toISOString();
        } else if (item.type === 'permanent_role' && item.roleId) {
            inventoryItem.roleId = item.roleId;
        }

        userData.inventory.push(inventoryItem);
        await dataManager.updateUser(userId, guildId, userData);

        let effectMessage = '';
        if (item.type === 'temporary_role' && item.roleId) {
            try {
                const role = await interaction.guild.roles.fetch(item.roleId);
                if (role) {
                    await interaction.member.roles.add(role);
                    effectMessage = `\n👤 Rôle **${role.name}** attribué pour ${item.duration} jour${item.duration > 1 ? 's' : ''} !`;
                    
                    setTimeout(async () => {
                        try {
                            await interaction.member.roles.remove(role);
                        } catch (error) {
                            console.error('Erreur suppression rôle temporaire:', error);
                        }
                    }, item.duration * 24 * 60 * 60 * 1000);
                } else {
                    effectMessage = '\n⚠️ Rôle introuvable.';
                }
            } catch (error) {
                effectMessage = '\n⚠️ Erreur lors de l\'attribution du rôle.';
            }
        } else if (item.type === 'permanent_role' && item.roleId) {
            try {
                const role = await interaction.guild.roles.fetch(item.roleId);
                if (role) {
                    await interaction.member.roles.add(role);
                    effectMessage = `\n👤 Rôle **${role.name}** attribué de façon permanente !`;
                } else {
                    effectMessage = '\n⚠️ Rôle introuvable.';
                }
            } catch (error) {
                effectMessage = '\n⚠️ Erreur lors de l\'attribution du rôle.';
            }
        } else if (item.type === 'custom') {
            effectMessage = '\n🎁 Objet personnalisé acheté !';
        } else {
            effectMessage = '\n📦 Objet ajouté à votre inventaire !';
        }

        // Message de confirmation avec détails de la remise
        let confirmMessage = `✅ **Achat réussi !**\n\n🛒 **${item.name}**\n💰 Prix payé: **${finalPrice}€**`;
        
        if (discountPercent > 0) {
            const savedAmount = originalPrice - finalPrice;
            confirmMessage += `\n💸 Prix original: ~~${originalPrice}€~~\n🎯 Remise karma (${discountPercent}%): **-${savedAmount}€**\n⚖️ Votre karma net: ${userKarmaNet}`;
        }
        
        confirmMessage += `\n💳 Nouveau solde: **${userData.balance}€**${effectMessage}`;

        await interaction.reply({
            content: confirmMessage,
            flags: 64
        });

        console.log(`🛒 ${interaction.user.tag} a acheté "${item.name}" pour ${finalPrice}€ (remise: ${discountPercent}%)`);

    } catch (error) {
        console.error('❌ Erreur handleShopPurchase:', error);
        await interaction.reply({
            content: '❌ Erreur lors de l\'achat.',
            flags: 64
        });
    }
}

const app = new RenderSolutionBot();

module.exports = { RenderSolutionBot, handleShopPurchase };
