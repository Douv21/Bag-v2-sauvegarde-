/**
 * BAG BOT V2 - SOLUTION RENDER.COM FINALE
 * Contourne les problèmes de rate limiting Discord
 */

const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

class RenderSolutionBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ],
            restRequestTimeout: 30000,
            restGlobalRateLimit: 50,
            restSweepInterval: 60,
            failIfNotExists: false
        });

        this.client.commands = new Collection();
        this.app = express();
        this.port = process.env.PORT || 5000;
        this.commandsLoaded = false;
        this.registrationInProgress = false;

        this.setupExpress();
        this.init();
    }

    setupExpress() {
        this.app.use(express.json());
        
        this.app.get('/', (req, res) => {
            res.json({
                status: 'online',
                bot: this.client.user?.tag || 'connecting',
                commands_loaded: this.commandsLoaded,
                guild_commands: this.client.commands.size,
                uptime: Math.floor(process.uptime()),
                port: this.port,
                render_compatible: true
            });
        });

        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                discord_ready: !!this.client.readyAt,
                commands: this.client.commands.size,
                storage: 'local_files'
            });
        });

        // Route de diagnostic spéciale
        this.app.get('/commands-status', async (req, res) => {
            try {
                if (!this.client.readyAt) {
                    return res.json({ error: 'Bot not ready' });
                }

                const guild = this.client.guilds.cache.first();
                if (!guild) {
                    return res.json({ error: 'No guild found' });
                }

                const guildCommands = await guild.commands.fetch();
                const globalCommands = await this.client.application.commands.fetch();

                res.json({
                    guild_commands: guildCommands.size,
                    global_commands: globalCommands.size,
                    loaded_commands: this.client.commands.size,
                    guild_command_list: guildCommands.map(c => c.name),
                    global_command_list: globalCommands.map(c => c.name)
                });
            } catch (error) {
                res.json({ error: error.message });
            }
        });

        // Route pour enregistrement direct sur un serveur spécifique
        this.app.post('/register-guild/:guildId', async (req, res) => {
            try {
                await this.registerGuildCommands(req.params.guildId);
                res.json({ success: true, message: 'Guild commands registered' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    async init() {
        try {
            console.log('🚀 BAG BOT V2 - Solution Render.com Finale');
            
            // Lancer le serveur web EN PREMIER - CRITIQUE pour Render.com
            const server = this.app.listen(this.port, '0.0.0.0', () => {
                console.log(`🌐 Serveur Web actif sur port ${this.port}`);
                console.log(`📊 Status: http://localhost:${this.port}/commands-status`);
                console.log(`✅ Port ${this.port} ouvert pour Render.com`);
            });

            // Vérifier que le serveur est bien démarré
            server.on('error', (error) => {
                console.error('❌ Erreur serveur Web:', error);
                process.exit(1);
            });

            // Attendre un peu pour s'assurer que le serveur est prêt
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await this.loadCommands();
            this.setupDiscordEvents();
            await this.client.login(process.env.DISCORD_TOKEN);
            
        } catch (error) {
            console.error('❌ Erreur init:', error);
            process.exit(1);
        }
    }

    async loadCommands() {
        try {
            const commandsPath = path.join(__dirname, 'commands');
            const commandFiles = await fs.readdir(commandsPath);
            const jsFiles = commandFiles.filter(file => file.endsWith('.js'));
            
            console.log(`📂 Chargement de ${jsFiles.length} commandes...`);
            
            for (const file of jsFiles) {
                try {
                    const filePath = path.join(commandsPath, file);
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);
                    
                    if (command.data && command.execute) {
                        this.client.commands.set(command.data.name, command);
                        console.log(`✅ ${command.data.name}`);
                    }
                } catch (error) {
                    console.error(`❌ ${file}:`, error.message);
                }
            }
            
            this.commandsLoaded = true;
            console.log(`✅ ${this.client.commands.size} commandes chargées`);
            
        } catch (error) {
            console.error('❌ Erreur chargement:', error);
        }
    }

    async registerGuildCommands(guildId) {
        if (this.registrationInProgress) {
            console.log('⏳ Enregistrement déjà en cours...');
            return;
        }

        this.registrationInProgress = true;
        console.log(`🔄 Enregistrement serveur spécifique: ${guildId}...`);

        try {
            if (this.client.commands.size === 0) {
                console.log('❌ Aucune commande chargée, rechargement...');
                await this.loadCommands();
            }

            const commands = Array.from(this.client.commands.values()).map(cmd => cmd.data.toJSON());
            console.log(`📝 Préparation de ${commands.length} commandes pour enregistrement`);
            
            // Log des noms des commandes à enregistrer
            commands.forEach(cmd => {
                console.log(`   • ${cmd.name} (${cmd.description})`);
            });

            const rest = new REST({ version: '10', timeout: 30000 }).setToken(process.env.DISCORD_TOKEN);
            
            // Enregistrement direct sur le serveur avec timeout plus long
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
                { body: commands }
            );
            
            console.log(`✅ ${commands.length} commandes enregistrées sur serveur ${guildId}`);
            
        } catch (error) {
            console.error('❌ Erreur enregistrement serveur:', error.message);
            
            // Tentative de récupération avec enregistrement global en fallback
            if (error.message.includes('timeout') || error.message.includes('rate limit')) {
                console.log('🔄 Tentative d\'enregistrement global en fallback...');
                try {
                    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
                    const commands = Array.from(this.client.commands.values()).map(cmd => cmd.data.toJSON());
                    
                    await rest.put(
                        Routes.applicationCommands(process.env.CLIENT_ID),
                        { body: commands }
                    );
                    
                    console.log(`✅ Fallback: ${commands.length} commandes enregistrées globalement`);
                } catch (fallbackError) {
                    console.error('❌ Échec fallback global:', fallbackError.message);
                }
            }
            
            throw error;
        } finally {
            this.registrationInProgress = false;
        }
    }

    setupDiscordEvents() {
        this.client.once('ready', async () => {
            console.log(`✅ ${this.client.user.tag} connecté`);
            console.log(`🏰 ${this.client.guilds.cache.size} serveur(s)`);
            
            // Attendre un délai pour s'assurer que toutes les commandes sont chargées
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Forcer l'enregistrement des commandes immédiatement
            console.log(`📋 Commandes disponibles: ${this.client.commands.size}`);
            this.client.commands.forEach(cmd => {
                console.log(`  - ${cmd.data.name}`);
            });
            
            // Enregistrer sur chaque serveur individuellement (évite le rate limit global)
            for (const [guildId, guild] of this.client.guilds.cache) {
                console.log(`🎯 Serveur: ${guild.name} (${guildId})`);
                
                try {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Délai réduit
                    await this.registerGuildCommands(guildId);
                    
                    // Vérification immédiate des commandes enregistrées
                    setTimeout(async () => {
                        try {
                            const guildCommands = await guild.commands.fetch();
                            console.log(`🔍 Commandes visibles sur ${guild.name}: ${guildCommands.size}`);
                            const arcEnCielCmd = guildCommands.find(c => c.name === 'arc-en-ciel');
                            if (arcEnCielCmd) {
                                console.log(`✅ /arc-en-ciel confirmée sur ${guild.name}`);
                            } else {
                                console.log(`❌ /arc-en-ciel manquante sur ${guild.name}`);
                            }
                        } catch (error) {
                            console.error(`❌ Erreur vérification ${guild.name}:`, error.message);
                        }
                    }, 3000);
                    
                } catch (error) {
                    console.error(`❌ Échec enregistrement ${guild.name}:`, error.message);
                }
            }
        });

        this.client.on('guildCreate', async (guild) => {
            console.log(`🆕 Nouveau serveur: ${guild.name}`);
            await this.registerGuildCommands(guild.id);
        });

        this.client.on('interactionCreate', async (interaction) => {
            try {
                // Gérer les commandes slash
                if (interaction.isChatInputCommand()) {
                    const command = this.client.commands.get(interaction.commandName);
                    if (!command) {
                        console.log(`❓ Commande inconnue: ${interaction.commandName}`);
                        return;
                    }

                    console.log(`🔧 /${interaction.commandName} par ${interaction.user.tag}`);
                    
                    // Vérifier si l'interaction n'est pas expirée
                    if (interaction.replied || interaction.deferred) {
                        console.log(`⚠️ Interaction déjà répondue pour ${interaction.commandName}`);
                        return;
                    }
                    
                    try {
                        // Initialiser DataManager pour toutes les commandes
                        const dataManager = require('./utils/simpleDataManager');
                        
                        // Exécuter la commande avec dataManager
                        await command.execute(interaction, dataManager);
                        
                    } catch (error) {
                    console.error(`❌ Erreur ${interaction.commandName}:`, error);
                    
                    const errorMsg = {
                        content: 'Erreur lors de l\'exécution de la commande.',
                        flags: 64
                    };

                    try {
                        if (interaction.replied || interaction.deferred) {
                            await interaction.followUp(errorMsg);
                        } else {
                            await interaction.reply(errorMsg);
                        }
                    } catch (e) {
                        console.error('❌ Impossible de répondre:', e);
                    }
                }
            }

            // Gérer les interactions de menu
            else if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu() || interaction.isRoleSelectMenu()) {
                try {
                    const dataManager = require('./utils/simpleDataManager');
                    
                    // Nouveau système de routing modulaire
                    const MainRouterHandler = require('./handlers/MainRouterHandler');
                    const router = new MainRouterHandler(dataManager);
                    
                    const handled = await router.handleInteraction(interaction);
                    
                    // Si le router n'a pas géré l'interaction, essayer le routage d'urgence
                    if (!handled) {
                        const customId = interaction.customId;
                        console.log(`⚠️ CustomId non géré par le router: ${customId}`);
                        
                        // Routage d'urgence pour les interactions critiques
                        if (customId === 'economy_actions_select') {
                            console.log(`🎯 Routage d'urgence: economy_actions_select`);
                            const economyHandler = router.handlers.economy;
                            if (!interaction.replied && !interaction.deferred) {
                                await economyHandler.handleActionSelected(interaction);
                            }
                            return;
                        }
                        
                        if (customId.startsWith('action_config_')) {
                            console.log(`🎯 Routage d'urgence: ${customId}`);
                            const economyHandler = router.handlers.economy;
                            if (!interaction.replied && !interaction.deferred) {
                                await economyHandler.handleActionConfig(interaction);
                            }
                            return;
                        }

                        if (customId.startsWith('action_rewards_config_') || 
                            customId.startsWith('action_karma_config_') || 
                            customId.startsWith('action_cooldown_config_')) {
                            console.log(`🎯 Routage d'urgence config spécifique: ${customId}`);
                            const economyHandler = router.handlers.economy;
                            if (!interaction.replied && !interaction.deferred) {
                                await economyHandler.handleActionSpecificConfig(interaction);
                            }
                            return;
                        }

                        if (customId === 'daily_config_options' || customId === 'messages_config_options' ||
                            customId.includes('daily_') || customId.includes('messages_')) {
                            console.log(`🎯 Routage d'urgence daily/messages: ${customId}`);
                            const economyHandler = router.handlers.economy;
                            if (!interaction.replied && !interaction.deferred) {
                                await economyHandler.handleInteraction(interaction);
                            }
                            return;
                        }

                        if (customId === 'karma_reset_confirm') {
                            console.log(`🎯 Routage d'urgence karma reset: ${customId}`);
                            const economyHandler = router.handlers.economy;
                            if (!interaction.replied && !interaction.deferred) {
                                await economyHandler.handleKarmaReset(interaction);
                            }
                            return;
                        }

                        if (customId.startsWith('edit_item_modal_')) {
                            console.log(`🎯 Routage d'urgence modal modification article: ${customId}`);
                            const economyHandler = router.handlers.economy;
                            if (!interaction.replied && !interaction.deferred) {
                                await economyHandler.handleEditItemModal(interaction);
                            }
                            return;
                        }

                        if (customId === 'add_karma_discount_modal') {
                            console.log(`🎯 Routage d'urgence modal ajout remise karma: ${customId}`);
                            const economyHandler = router.handlers.economy;
                            if (!interaction.replied && !interaction.deferred) {
                                await economyHandler.handleAddKarmaDiscountModal(interaction);
                            }
                            return;
                        }

                        if (customId === 'karma_discounts_config') {
                            console.log(`🎯 Routage d'urgence config remises karma: ${customId}`);
                            const economyHandler = router.handlers.economy;
                            if (!interaction.replied && !interaction.deferred) {
                                await economyHandler.handleKarmaDiscountsInteraction(interaction);
                            }
                            return;
                        }

                        if (customId === 'karma_discounts_menu') {
                            console.log(`🎯 Routage menu remises karma: ${customId}`);
                            const economyHandler = router.handlers.economy;
                            const selectedValue = interaction.values[0];
                            
                            if (!interaction.replied && !interaction.deferred) {
                                if (selectedValue === 'create_karma_discount') {
                                    await economyHandler.showCreateKarmaDiscountModal(interaction);
                                } else if (selectedValue === 'modify_karma_discount') {
                                    await economyHandler.showModifyKarmaDiscountSelector(interaction);
                                } else if (selectedValue === 'delete_karma_discount') {
                                    await economyHandler.showDeleteKarmaDiscountSelector(interaction);
                                } else if (selectedValue === 'toggle_karma_discounts') {
                                    await economyHandler.handleToggleKarmaDiscounts(interaction);
                                } else if (selectedValue === 'economy_shop_config') {
                                    await economyHandler.showShopConfig(interaction);
                                }
                            }
                            return;
                        }

                        if (customId === 'modify_karma_discount_select') {
                            console.log(`🎯 Routage sélection modification remise: ${customId}`);
                            const economyHandler = router.handlers.economy;
                            const selectedValue = interaction.values[0];
                            
                            if (!interaction.replied && !interaction.deferred) {
                                if (selectedValue === 'back_karma_discounts') {
                                    await economyHandler.showKarmaDiscountsConfig(interaction);
                                } else if (selectedValue.startsWith('modify_discount_')) {
                                    const discountId = selectedValue.replace('modify_discount_', '');
                                    await economyHandler.showModifyKarmaDiscountModal(interaction, discountId);
                                }
                            }
                            return;
                        }

                        if (customId === 'delete_karma_discount_select') {
                            console.log(`🎯 Routage sélection suppression remise: ${customId}`);
                            const economyHandler = router.handlers.economy;
                            const selectedValue = interaction.values[0];
                            
                            if (!interaction.replied && !interaction.deferred) {
                                if (selectedValue === 'back_karma_discounts') {
                                    await economyHandler.showKarmaDiscountsConfig(interaction);
                                } else if (selectedValue.startsWith('delete_discount_')) {
                                    const discountId = selectedValue.replace('delete_discount_', '');
                                    await economyHandler.handleDeleteKarmaDiscount(interaction, discountId);
                                }
                            }
                            return;
                        }

                        if (customId === 'back_karma_discounts') {
                            console.log(`🎯 Routage d'urgence retour remises karma: ${customId}`);
                            const economyHandler = router.handlers.economy;
                            if (!interaction.replied && !interaction.deferred) {
                                await economyHandler.showKarmaDiscountsConfig(interaction);
                            }
                            return;
                        }
                        
                        // Routage spécial pour shop_purchase avec remises karma
                        if (customId === 'shop_purchase') {
                            console.log('🎯 Routage achat boutique avec remises karma: shop_purchase');
                            await handleShopPurchase(interaction, dataManager);
                            return;
                        }

                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({ 
                                content: '❌ Cette interaction n\'est pas encore implémentée.', 
                                flags: 64 
                            });
                        }
                    }
                    
                    // Fin du traitement - ne pas continuer avec le routing manuel ci-dessous
                    return;
                    
                    const customId = interaction.customId;
                    
                    // Router vers les handlers appropriés
                    if (customId === 'config_main_menu') {
                        await handler.handleConfessionMainConfig(interaction);
                    } else if (customId === 'confession_main_config') {
                        await handler.handleConfessionMainConfig(interaction);
                    } else if (customId === 'confession_channels_config') {
                        await handler.handleConfessionChannelsConfig(interaction);
                    } else if (customId === 'confession_autothread_config') {
                        await handler.handleConfessionAutothreadConfig(interaction);
                    } else if (customId === 'confession_logs_config') {
                        await handler.handleConfessionLogsConfig(interaction);
                    } else if (customId === 'confession_log_level') {
                        await handler.handleConfessionLogLevel(interaction);
                    } else if (customId === 'confession_log_channel') {
                        await handler.handleConfessionLogChannel(interaction);
                    } else if (customId === 'confession_log_ping_roles') {
                        await handler.handleConfessionLogPingRoles(interaction);
                    } else if (customId === 'confession_ping_roles') {
                        await handler.handleConfessionPingRoles(interaction);
                    } else if (customId === 'confession_add_channel') {
                        await handler.handleConfessionAddChannel(interaction);
                    } else if (customId === 'confession_remove_channel') {
                        await handler.handleConfessionRemoveChannel(interaction);
                    } else if (customId === 'confession_archive_time') {
                        await handler.handleConfessionArchiveTime(interaction);
                    } else if (customId === 'economy_main_config') {
                        await handler.handleEconomyMainConfig(interaction);
                    } else if (customId === 'economy_actions_config') {
                        await handler.handleEconomyActionsConfig(interaction);
                    } else if (customId === 'economy_shop_config') {
                        await handler.handleEconomyShopConfig(interaction);
                    } else if (customId === 'economy_karma_config') {
                        await handler.handleEconomyKarmaConfig(interaction);
                    } else if (customId === 'economy_daily_config') {
                        await handler.handleEconomyDailyConfig(interaction);
                    } else if (customId === 'economy_messages_config') {
                        await handler.handleEconomyMessagesConfig(interaction);
                    } else if (customId === 'economy_action_rewards_config') {
                        await handler.handleActionSubConfig(interaction);
                    } else if (customId === 'economy_action_karma_config') {
                        await handler.handleActionKarmaAmounts(interaction);
                    } else if (customId === 'economy_action_cooldown_config') {
                        await handler.handleActionCooldownAmounts(interaction);
                    } else if (customId === 'economy_action_toggle_config') {
                        await handler.handleActionToggleStatus(interaction);
                    } else if (customId === 'economy_rewards_edit_config') {
                        await handler.handleRewardsEditConfig(interaction);
                    } else if (customId === 'economy_shop_workflow_select') {
                        await handler.handleShopWorkflowSelect(interaction);
                    } else if (customId === 'economy_karma_delete_confirm') {
                        await router.handlers.economy.handleKarmaDeleteConfirm(interaction);
                    } else if (customId === 'economy_karma_rewards_config') {
                        console.log('🎁 Routage economy_karma_rewards_config vers EconomyHandler');
                        await router.handlers.economy.handleInteraction(interaction);
                    } else if (customId === 'economy_karma_edit_select') {
                        await router.handlers.economy.handleInteraction(interaction);
                    } else if (customId === 'economy_karma_delete_select') {
                        await router.handlers.economy.handleInteraction(interaction);
                    } else if (customId === 'economy_karma_type_select') {
                        await router.handlers.economy.handleInteraction(interaction);
                    } else if (customId === 'karma_reset_confirm') {
                        console.log('🗑️ Routage karma_reset_confirm vers EconomyHandler');
                        await router.handlers.economy.handleKarmaReset(interaction);
                    } else if (customId === 'economy_karma_level_select') {
                        console.log('🎭 Routage economy_karma_level_select vers EconomyHandler');
                        await router.handlers.economy.handleInteraction(interaction);
                    } else if (customId.startsWith('karma_role_select_')) {
                        console.log('🎭 Routage karma_role_select vers EconomyHandler');
                        const levelId = customId.replace('karma_role_select_', '');
                        const roleId = interaction.values[0];
                        await router.handlers.economy.showDurationSelector(interaction, levelId, roleId);
                    } else if (customId === 'karma_temp_role_select') {
                        console.log('🎭 Routage karma_temp_role_select vers EconomyHandler');
                        const roleId = interaction.values[0];
                        await router.handlers.economy.showTempRoleTypeSelector(interaction, roleId);
                    } else if (customId.startsWith('karma_temp_type_select_')) {
                        console.log('⚖️ Routage karma_temp_type_select vers EconomyHandler');
                        const roleId = customId.replace('karma_temp_type_select_', '');
                        const type = interaction.values[0];
                        await router.handlers.economy.showTempRoleModal(interaction, roleId, type);
                    } else if (customId.startsWith('karma_duration_select_')) {
                        console.log('⏰ Routage karma_duration_select vers EconomyHandler');
                        const parts = customId.split('_');
                        const levelId = parts[3];
                        const roleId = parts[4];
                        await router.handlers.economy.handleDurationSelection(interaction, levelId, roleId);
                    } else if (customId.startsWith('custom_karma_reward_modal_')) {
                        await handler.handleCustomKarmaRewardModal(interaction);
                    } else if (customId === 'shop_purchase') {
                        console.log('🛒 Traitement achat boutique avec remise karma net');
                        await handleShopPurchaseWithKarmaDiscount(interaction, dataManager);
                    } else if (customId.startsWith('economy_')) {
                        // Router générique pour tous les handlers économie
                        console.log(`🔄 Routing economy handler: ${customId}`);
                        await handler.handleEconomyInteraction(interaction, customId);
                    } else {
                        console.log(`⚠️ Handler non trouvé pour: ${customId}`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Erreur interaction ${interaction.customId}:`, error);
                    
                    try {
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({
                                content: 'Erreur lors du traitement de l\'interaction.',
                                flags: 64
                            });
                        }
                    } catch (e) {
                        console.error('❌ Impossible de répondre interaction:', e);
                    }
                }
            }
            
            // Gestion des modals
            else if (interaction.isModalSubmit()) {
                console.log(`📝 Modal: ${interaction.customId}`);
                
                try {
                    const dataManager = require('./utils/simpleDataManager');
                    
                    // Routage spécifique pour les modals d'économie
                    if (interaction.customId.startsWith('economy_custom_')) {
                        console.log(`🎯 Modal économie personnalisé: ${interaction.customId}`);
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleCustomModal(interaction);
                        return;
                    }
                    
                    // Routage général pour autres modals
                    const MainRouterHandler = require('./handlers/MainRouterHandler');
                    const router = new MainRouterHandler(dataManager);
                    
                    // Router vers le bon handler selon le customId
                    if (interaction.customId === 'autothread_name_modal') {
                        console.log('Modal nom thread autothread détecté');
                        await router.handlers.autothread.handleThreadNameModal(interaction);
                    } else if (interaction.customId === 'custom_object_modal') {
                        console.log('Modal objet personnalisé détecté');
                        await router.handlers.economy.handleCustomObjectModal(interaction);
                    } else if (interaction.customId.startsWith('temp_role_price_modal_')) {
                        console.log('Modal prix rôle temporaire détecté');
                        const roleId = interaction.customId.split('_').pop();
                        await router.handlers.economy.handleTempRolePriceModal(interaction, roleId);
                    } else if (interaction.customId.startsWith('perm_role_price_modal_')) {
                        console.log('Modal prix rôle permanent détecté');
                        const roleId = interaction.customId.split('_').pop();
                        await router.handlers.economy.handlePermRolePriceModal(interaction, roleId);
                    } else if (interaction.customId === 'economy_daily_amount_modal') {
                        console.log('Modal montant daily détecté');
                        await router.handlers.economy.handleDailyAmountModal(interaction);
                    } else if (interaction.customId === 'economy_messages_amount_modal') {
                        console.log('Modal montant messages détecté');
                        await router.handlers.economy.handleMessagesAmountModal(interaction);
                    } else if (interaction.customId === 'economy_messages_cooldown_modal') {
                        console.log('Modal cooldown messages détecté');
                        await router.handlers.economy.handleMessagesCooldownModal(interaction);
                    } else if (interaction.customId === 'economy_karma_level_modal') {
                        console.log('Modal niveau karma détecté');
                        await router.handlers.economy.handleKarmaLevelModal(interaction);
                    } else if (interaction.customId.startsWith('economy_karma_edit_modal_')) {
                        console.log('Modal édition karma détecté');
                        await router.handlers.economy.handleKarmaEditModal(interaction);
                    } else if (interaction.customId.startsWith('economy_karma_level_modal_')) {
                        console.log('Modal création karma typé détecté');
                        await router.handlers.economy.handleKarmaLevelModal(interaction);
                    } else if (interaction.customId.startsWith('temp_role_modal_')) {
                        console.log('Modal rôle temporaire détecté');
                        await router.handlers.economy.handleTempRoleModal(interaction);
                    } else if (interaction.customId.startsWith('action_rewards_modal_')) {
                        console.log('Modal récompenses action détecté');
                        const actionName = interaction.customId.replace('action_rewards_modal_', '');
                        await router.handlers.economy.handleActionRewardsModal(interaction, actionName);
                    } else if (interaction.customId.startsWith('action_karma_modal_')) {
                        console.log('Modal karma action détecté');
                        const actionName = interaction.customId.replace('action_karma_modal_', '');
                        await router.handlers.economy.handleActionKarmaModal(interaction, actionName);
                    } else if (interaction.customId.startsWith('action_cooldown_modal_')) {
                        console.log('Modal cooldown action détecté');
                        const actionName = interaction.customId.replace('action_cooldown_modal_', '');
                        await router.handlers.economy.handleActionCooldownModal(interaction, actionName);
                    } else if (interaction.customId === 'add_karma_discount_modal') {
                        console.log('Modal ajout remise karma détecté');
                        await router.handlers.economy.handleAddKarmaDiscountModal(interaction);
                    } else if (interaction.customId === 'create_karma_discount_modal') {
                        console.log('Modal création remise karma détecté');
                        await router.handlers.economy.handleCreateKarmaDiscountModal(interaction);
                    } else if (interaction.customId.startsWith('modify_karma_discount_modal_')) {
                        console.log('Modal modification remise karma détecté');
                        await router.handlers.economy.handleModifyKarmaDiscountModal(interaction);
                    } else {
                        console.log(`Modal non géré: ${interaction.customId}`);
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({
                                content: '❌ Cette modal n\'est pas encore implémentée.',
                                flags: 64
                            });
                        }
                    }
                    const handled = true;
                    
                    if (!handled) {
                        console.log(`⚠️ Modal non géré: ${interaction.customId}`);
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({
                                content: '❌ Cette modal n\'est pas encore implémentée.',
                                flags: 64
                            });
                        }
                    }
                    
                } catch (error) {
                    console.error(`❌ Erreur modal ${interaction.customId}:`, error);
                    
                    try {
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({
                                content: 'Erreur lors du traitement du modal.',
                                flags: 64
                            });
                        }
                    } catch (e) {
                        console.error('❌ Impossible de répondre modal:', e);
                    }
                }
            }
            
            } catch (mainError) {
                console.error('❌ Erreur principale interactionCreate:', mainError);
            }
        });

        // Système de récompenses pour les messages
        this.client.on('messageCreate', async (message) => {
            // Ignorer les bots et les messages de commande
            if (message.author.bot || message.content.startsWith('/')) return;
            
            // Ignorer les DM
            if (!message.guild) return;
            
            try {
                // Gérer le système de comptage d'abord
                const countingHandled = await this.handleCounting(message);
                
                // Si le message n'était pas du comptage, gérer les récompenses de messages
                if (!countingHandled) {
                    await this.handleMessageReward(message);
                }
                
                // Gérer la création automatique de threads
                await this.handleAutoThread(message);
                
            } catch (error) {
                console.error('❌ Erreur messageCreate:', error);
            }
        });

        this.client.on('error', error => {
            console.error('❌ Erreur Discord:', error);
        });
    }

    async handleMessageReward(message) {
        try {
            const dataManager = require('./utils/simpleDataManager');
            const messageRewards = dataManager.getData('message_rewards.json');
            const cooldowns = dataManager.getData('message_cooldowns.json');
            
            const guildConfig = messageRewards[message.guild.id];
            if (!guildConfig || !guildConfig.enabled) return;
            
            // Vérifier le cooldown
            const userId = message.author.id;
            const guildId = message.guild.id;
            const cooldownKey = `${userId}_${guildId}`;
            const now = Date.now();
            
            if (cooldowns[cooldownKey] && (now - cooldowns[cooldownKey]) < (guildConfig.cooldown * 1000)) {
                return; // Encore en cooldown
            }
            
            // Mettre à jour le cooldown
            cooldowns[cooldownKey] = now;
            dataManager.setData('message_cooldowns.json', cooldowns);
            
            // Récompenser l'utilisateur
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
            // Charger configuration auto-thread
            const dataManager = require('./utils/simpleDataManager');
            const config = await dataManager.loadData('autothread.json', {});
            const guildId = message.guild.id;
            const channelId = message.channel.id;
            
            // Vérifier si l'auto-thread est configuré pour cette guilde et ce canal
            const autoThreadConfig = config[guildId];
            if (!autoThreadConfig || !autoThreadConfig.enabled) return;
            
            // Vérifier si le canal est dans la liste des canaux configurés
            // Support pour structure simple (string) et complexe (objet)
            const isChannelConfigured = autoThreadConfig.channels?.some(c => 
                (typeof c === 'string' ? c : c.channelId) === channelId
            );
            if (!isChannelConfigured) return;
            
            // Vérifier que c'est un canal texte et pas déjà un thread
            if (message.channel.isThread() || message.channel.type !== 0) return;
            
            // Créer le nom du thread en remplaçant les variables
            let threadName = autoThreadConfig.threadName || 'Discussion - {user}';
            threadName = threadName
                .replace('{user}', message.author.displayName || message.author.username)
                .replace('{channel}', message.channel.name)
                .replace('{date}', new Date().toLocaleDateString('fr-FR'))
                .replace('{time}', new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
            
            // Limiter le nom à 100 caractères (limite Discord)
            threadName = threadName.substring(0, 100);
            
            // Créer le thread
            const thread = await message.startThread({
                name: threadName,
                autoArchiveDuration: parseInt(autoThreadConfig.archiveTime) || 60,
                reason: `Auto-thread créé par ${message.author.tag}`
            });
            
            // Appliquer le mode lent si configuré
            if (autoThreadConfig.slowMode && autoThreadConfig.slowMode > 0) {
                await thread.setRateLimitPerUser(parseInt(autoThreadConfig.slowMode));
            }
            
            // Mettre à jour les statistiques
            if (!config[guildId].stats) {
                config[guildId].stats = { threadsCreated: 0, lastCreated: null };
            }
            config[guildId].stats.threadsCreated += 1;
            config[guildId].stats.lastCreated = new Date().toISOString();
            
            // Sauvegarder les statistiques
            await dataManager.saveData('autothread.json', config);
            
            console.log(`🧵 Thread créé: "${threadName}" dans #${message.channel.name} par ${message.author.tag}`);
            
        } catch (error) {
            console.error('❌ Erreur création auto-thread:', error);
        }
    }

    async handleCounting(message) {
        try {
            // Charger directement depuis le fichier (sans persistance PostgreSQL)
            const fs = require('fs').promises;
            const path = require('path');
            
            let countingConfig = {};
            try {
                const data = await fs.readFile(path.join(__dirname, 'data', 'counting.json'), 'utf8');
                countingConfig = JSON.parse(data);
            } catch (error) {
                console.log('📄 Création nouveau fichier counting.json');
                countingConfig = {};
            }
            
            const guildConfig = countingConfig[message.guild.id];
            
            // Vérifier si le comptage est activé pour ce serveur
            if (!guildConfig || !guildConfig.channels || !Array.isArray(guildConfig.channels)) {
                return false;
            }
            
            // Trouver le canal de comptage actif
            const channelConfig = guildConfig.channels.find(c => 
                c.channelId === message.channel.id && c.enabled
            );
            
            if (!channelConfig) {
                return false; // Pas un canal de comptage
            }
            
            console.log(`🔢 Message comptage détecté: "${message.content}" dans #${message.channel.name}`);
            console.log(`📊 État actuel: currentNumber=${channelConfig.currentNumber}, lastUserId=${channelConfig.lastUserId}, enabled=${channelConfig.enabled}`);
            
            const content = message.content.trim();
            
            // Fonction pour évaluer les expressions mathématiques de base
            function evaluateMath(expression) {
                try {
                    // Nettoyer l'expression - autoriser seulement les chiffres, +, -, *, /, (, ), espaces
                    const cleanExpr = expression.replace(/[^0-9+\-*/().\s]/g, '');
                    if (cleanExpr !== expression.replace(/\s/g, '')) return null;
                    
                    // Évaluation sécurisée
                    const result = Function(`"use strict"; return (${cleanExpr})`)();
                    return Number.isInteger(result) && result >= 0 ? result : null;
                } catch {
                    return null;
                }
            }
            
            // Déterminer si c'est un nombre ou calcul valide
            let numberValue = null;
            if (/^\d+$/.test(content)) {
                // Nombre simple
                numberValue = parseInt(content);
            } else if (/^[0-9+\-*/().\s]+$/.test(content)) {
                // Expression mathématique
                numberValue = evaluateMath(content);
            }
            
            // Si ce n'est pas un nombre valide, ignorer silencieusement
            if (numberValue === null || numberValue < 0) {
                console.log(`⚠️ Message ignoré (pas un nombre): "${content}"`);
                return false;
            }
            
            console.log(`🔢 Nombre détecté: ${numberValue}, attendu: ${channelConfig.currentNumber}`);
            
            const isCorrect = numberValue === channelConfig.currentNumber;
            const isSameUser = message.author.id === channelConfig.lastUserId;
            const { EmbedBuilder } = require('discord.js');
            
            if (!isCorrect || isSameUser) {
                // Reset nécessaire
                let resetReason = '';
                if (!isCorrect) {
                    resetReason = `Mauvais nombre: attendu ${channelConfig.currentNumber}, reçu ${numberValue}`;
                } else if (isSameUser) {
                    resetReason = `${message.author.displayName} a compté deux fois de suite`;
                }
                
                // Sauvegarder le record si atteint
                const previousNumber = channelConfig.currentNumber - 1;
                if (previousNumber > channelConfig.record) {
                    channelConfig.record = previousNumber;
                }
                
                // Reset la configuration du canal
                channelConfig.currentNumber = channelConfig.startNumber || 1;
                channelConfig.lastUserId = null;
                channelConfig.lastResetReason = resetReason;
                channelConfig.lastResetDate = new Date().toISOString();
                
                // Mettre à jour la configuration dans le tableau
                const channelIndex = guildConfig.channels.findIndex(c => c.channelId === message.channel.id);
                if (channelIndex >= 0) {
                    guildConfig.channels[channelIndex] = channelConfig;
                }
                
                // Sauvegarder directement dans le fichier (reset)
                countingConfig[message.guild.id] = guildConfig;
                await fs.writeFile(
                    path.join(__dirname, 'data', 'counting.json'), 
                    JSON.stringify(countingConfig, null, 2)
                );
                
                // Réaction d'erreur AVANT suppression
                try {
                    await message.react('❌');
                } catch (error) {
                    console.error('Impossible d\'ajouter la réaction d\'erreur:', error);
                }
                
                // Attendre un peu puis supprimer le message incorrect
                setTimeout(async () => {
                    try {
                        await message.delete();
                    } catch (error) {
                        console.error('Impossible de supprimer le message de comptage:', error);
                    }
                }, 2000);
                
                // Envoyer message de reset
                const resetEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🔄 Comptage Remis à Zéro')
                    .setDescription(`**Raison:** ${resetReason}\n\nProchain numéro: **${channelConfig.currentNumber}**`)
                    .addFields([
                        { name: '📊 Nombre atteint', value: previousNumber.toString(), inline: true },
                        { name: '🏆 Record', value: channelConfig.record.toString(), inline: true }
                    ])
                    .setFooter({ text: `Erreur de ${message.author.displayName}` });
                
                await message.channel.send({ embeds: [resetEmbed] });
                
                console.log(`🔄 Comptage reset: ${resetReason} (Record: ${channelConfig.record})`);
                
            } else {
                // Nombre correct !
                const isNewRecord = numberValue > (channelConfig.record || 0);
                
                channelConfig.currentNumber++;
                channelConfig.lastUserId = message.author.id;
                channelConfig.totalCounts = (channelConfig.totalCounts || 0) + 1;
                
                // Mettre à jour la configuration dans le tableau
                const channelIndex = guildConfig.channels.findIndex(c => c.channelId === message.channel.id);
                if (channelIndex >= 0) {
                    guildConfig.channels[channelIndex] = channelConfig;
                }
                
                // Sauvegarder directement dans le fichier (succès)
                countingConfig[message.guild.id] = guildConfig;
                await fs.writeFile(
                    path.join(__dirname, 'data', 'counting.json'), 
                    JSON.stringify(countingConfig, null, 2)
                );
                
                // Réactions selon le contexte
                try {
                    if (isNewRecord) {
                        // Nouveau record - réaction spéciale
                        await message.react('🏆');
                        await message.react('🎉');
                    } else {
                        // Comptage correct normal
                        await message.react('✅');
                    }
                } catch (error) {
                    console.error('Impossible d\'ajouter la réaction:', error);
                }
                
                // Messages de félicitations aux paliers
                const milestones = [10, 25, 50, 100, 250, 500, 1000];
                const currentCount = numberValue;
                
                if (milestones.includes(currentCount)) {
                    // Réaction palier supplémentaire
                    try {
                        await message.react('🎯');
                    } catch (error) {
                        console.error('Impossible d\'ajouter la réaction palier:', error);
                    }
                    
                    const milestoneEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('🎉 Palier Atteint!')
                        .setDescription(`Félicitations ! Vous avez atteint le nombre **${currentCount}** !`)
                        .addFields([
                            { name: '👤 Compteur', value: message.author.displayName, inline: true },
                            { name: '🎯 Prochain nombre', value: channelConfig.currentNumber.toString(), inline: true }
                        ])
                        .setFooter({ text: `Total de comptages: ${channelConfig.totalCounts}` });
                    
                    await message.channel.send({ embeds: [milestoneEmbed] });
                }
                
                console.log(`🔢 ${message.author.tag} a compté: ${numberValue} (prochain: ${channelConfig.currentNumber})`);
            }
            
            return true; // Message de comptage traité
            
        } catch (error) {
            console.error('❌ Erreur système comptage:', error);
            return false;
        }
    }

    // Nouvelle méthode pour gérer les achats en boutique avec remise karma net
    async handleShopPurchase(interaction) {
        try {
            const dataManager = require('./utils/simpleDataManager');
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
                const applicableRange = economyConfig.karmaDiscounts.ranges
                    .filter(range => userKarmaNet >= range.minKarma)
                    .sort((a, b) => b.minKarma - a.minKarma)[0];
                
                discountPercent = applicableRange ? applicableRange.discount : 0;
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

            // Effectuer l'achat
            userData.balance -= finalPrice;
            await dataManager.updateUser(userId, guildId, userData);

            // Appliquer l'effet de l'objet selon son type
            let effectMessage = '';
            if (item.type === 'temporary_role' && item.roleId) {
                try {
                    const role = await interaction.guild.roles.fetch(item.roleId);
                    if (role) {
                        await interaction.member.roles.add(role);
                        effectMessage = `\n🎭 Rôle **${role.name}** ajouté pour ${item.duration} jour(s) !`;
                        
                        // Programmer la suppression du rôle après la durée
                        setTimeout(async () => {
                            try {
                                await interaction.member.roles.remove(role);
                            } catch (error) {
                                console.error('❌ Erreur suppression rôle temporaire:', error);
                            }
                        }, item.duration * 24 * 60 * 60 * 1000);
                    }
                } catch (error) {
                    effectMessage = '\n⚠️ Erreur lors de l\'attribution du rôle.';
                }
            } else if (item.type === 'permanent_role' && item.roleId) {
                try {
                    const role = await interaction.guild.roles.fetch(item.roleId);
                    if (role) {
                        await interaction.member.roles.add(role);
                        effectMessage = `\n🎭 Rôle permanent **${role.name}** ajouté !`;
                    }
                } catch (error) {
                    effectMessage = '\n⚠️ Erreur lors de l\'attribution du rôle.';
                }
            } else {
                effectMessage = '\n🎁 Objet personnalisé acheté !';
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

            // Log de l'achat
            console.log(`🛒 ${interaction.user.tag} a acheté "${item.name}" pour ${finalPrice}€ ${discountPercent > 0 ? `(remise ${discountPercent}%)` : ''}`);

        } catch (error) {
            console.error('❌ Erreur achat boutique:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'achat.',
                flags: 64
            });
        }
    }
                return;
            }

            // Récupérer les données utilisateur
            const userKey = `${guildId}_${userId}`;
            const userData = economyData[userKey] || { balance: 1000, goodKarma: 0, badKarma: 0 };

            // Calculer le prix avec remise karma net
            let finalPrice = item.price;
            let discountApplied = 0;

            if (item.karmaDiscount && item.karmaDiscount > 0) {
                const karmaNet = userData.goodKarma + Math.abs(userData.badKarma || 0);
                if (karmaNet > 0) {
                    discountApplied = Math.round((finalPrice * item.karmaDiscount) / 100);
                    finalPrice = finalPrice - discountApplied;
                }
            }

            // Vérifier si l'utilisateur a assez d'argent
            if (userData.balance < finalPrice) {
                await interaction.reply({
                    content: `❌ Solde insuffisant !\n💰 Prix: ${finalPrice}€${discountApplied > 0 ? ` (${item.price}€ - ${discountApplied}€ remise karma)` : ''}\n💳 Votre solde: ${userData.balance}€`,
                    flags: 64
                });
                return;
            }

            // Effectuer l'achat
            userData.balance -= finalPrice;
            economyData[userKey] = userData;

            // Traitement spécifique selon le type d'objet
            let purchaseMessage = `✅ **${item.name}** acheté avec succès !\n💰 Prix payé: ${finalPrice}€`;
            
            if (discountApplied > 0) {
                purchaseMessage += `\n🎯 Remise karma net (${item.karmaDiscount}%): -${discountApplied}€`;
            }

            if (item.type === 'temp_role' || item.type === 'perm_role') {
                try {
                    const role = interaction.guild.roles.cache.get(item.roleId);
                    if (role) {
                        await interaction.member.roles.add(role);
                        purchaseMessage += `\n🎭 Rôle **${role.name}** ajouté !`;

                        // Programmer suppression pour rôles temporaires
                        if (item.type === 'temp_role' && item.duration) {
                            setTimeout(async () => {
                                try {
                                    await interaction.member.roles.remove(role);
                                    console.log(`⏰ Rôle temporaire ${role.name} retiré de ${interaction.user.tag}`);
                                } catch (error) {
                                    console.error('❌ Erreur suppression rôle temporaire:', error);
                                }
                            }, item.duration * 24 * 60 * 60 * 1000); // Durée en jours
                            
                            purchaseMessage += `\n⏰ Durée: ${item.duration} jour(s)`;
                        }
                    } else {
                        purchaseMessage += `\n⚠️ Rôle introuvable (peut-être supprimé)`;
                    }
                } catch (error) {
                    console.error('❌ Erreur attribution rôle:', error);
                    purchaseMessage += `\n❌ Erreur lors de l'attribution du rôle`;
                }
            }

            purchaseMessage += `\n💳 Nouveau solde: ${userData.balance}€`;

            await dataManager.saveData('economy.json', economyData);

            await interaction.reply({
                content: purchaseMessage,
                flags: 64
            });

        } catch (error) {
            console.error('❌ Erreur achat boutique:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'achat',
                flags: 64
            });
        }
    }
}

// Fonction pour gérer les achats avec remises karma
async function handleShopPurchaseWithKarmaDiscount(interaction, dataManager) {
    try {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const itemId = interaction.values[0];

        const userData = await dataManager.getUser(userId, guildId);
        const shopData = await dataManager.loadData('shop.json', {});
        const economyConfig = await dataManager.loadData('economy.json', {});
        const shopItems = shopData[guildId] || [];

        // Trouver l'objet sélectionné
        const selectedItem = shopItems.find(item => (item.id || shopItems.indexOf(item)).toString() === itemId);
        if (!selectedItem) {
            await interaction.reply({
                content: '❌ Objet introuvable.',
                flags: 64
            });
            return;
        }

        // Calculer le karma net et la remise
        const userKarmaNet = (userData.goodKarma || 0) + (userData.badKarma || 0);
        let discountPercent = 0;
        
        if (economyConfig.karmaDiscounts && economyConfig.karmaDiscounts.enabled && economyConfig.karmaDiscounts.ranges) {
            const applicableRange = economyConfig.karmaDiscounts.ranges
                .filter(range => userKarmaNet >= range.minKarma)
                .sort((a, b) => b.minKarma - a.minKarma)[0];
            
            discountPercent = applicableRange ? applicableRange.discount : 0;
        }

        // Calculer le prix final
        const originalPrice = selectedItem.price;
        const finalPrice = discountPercent > 0 ? Math.floor(originalPrice * (100 - discountPercent) / 100) : originalPrice;

        // Vérifier si l'utilisateur a assez d'argent
        if (userData.balance < finalPrice) {
            const shortage = finalPrice - userData.balance;
            await interaction.reply({
                content: `❌ Solde insuffisant ! Il vous manque **${shortage}€**.\n\n💰 Votre solde : ${userData.balance}€\n🛒 Prix${discountPercent > 0 ? ' avec remise' : ''} : ${finalPrice}€`,
                flags: 64
            });
            return;
        }

        // Effectuer l'achat
        userData.balance -= finalPrice;
        await dataManager.saveUser(userId, guildId, userData);

        // Créer l'embed de confirmation
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor('#27ae60')
            .setTitle('✅ Achat Réussi !')
            .setDescription(`Vous avez acheté **${selectedItem.name}** avec succès !`)
            .addFields([
                {
                    name: '💰 Prix Payé',
                    value: discountPercent > 0 ? `~~${originalPrice}€~~ **${finalPrice}€** (-${discountPercent}%)` : `${finalPrice}€`,
                    inline: true
                },
                {
                    name: '💳 Nouveau Solde',
                    value: `${userData.balance}€`,
                    inline: true
                },
                {
                    name: '🏷️ Article',
                    value: selectedItem.description || 'Aucune description',
                    inline: false
                }
            ]);

        if (discountPercent > 0) {
            embed.addFields([{
                name: '💸 Remise Karma',
                value: `Vous avez économisé **${originalPrice - finalPrice}€** grâce à votre karma net de ${userKarmaNet} !`,
                inline: false
            }]);
        }

        await interaction.reply({
            embeds: [embed],
            flags: 64
        });

        console.log(`🛒 ${interaction.user.tag} a acheté ${selectedItem.name} pour ${finalPrice}€ (remise: ${discountPercent}%)`);

    } catch (error) {
        console.error('❌ Erreur lors de l\'achat:', error);
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de l\'achat.',
            flags: 64
        });
    }
}

// Démarrage
console.log('🚀 BAG BOT V2 - Solution Render.com Finale');
new RenderSolutionBot();