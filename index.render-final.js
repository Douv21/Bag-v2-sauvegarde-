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
                uptime: Math.floor(process.uptime())
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
            await this.loadCommands();
            this.setupDiscordEvents();
            await this.client.login(process.env.DISCORD_TOKEN);
            
            this.app.listen(this.port, '0.0.0.0', () => {
                console.log(`🌐 Serveur Web actif sur port ${this.port}`);
                console.log(`📊 Status: http://localhost:${this.port}/commands-status`);
            });
            
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
                    
                    // Si le router n'a pas géré l'interaction, utiliser l'ancien système en fallback
                    if (!handled) {
                        const InteractionHandler = require('./handlers/InteractionHandler');
                        const handler = new InteractionHandler(dataManager);
                        await handler.handleInteraction(interaction);
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
                        await handler.handleDeleteCustomReward(interaction);
                    } else if (customId.startsWith('custom_karma_reward_modal_')) {
                        await handler.handleCustomKarmaRewardModal(interaction);
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
                try {
                    const dataManager = require('./utils/simpleDataManager');
                    const InteractionHandler = require('./handlers/InteractionHandler');
                    const handler = new InteractionHandler(dataManager);
                    
                    await handler.handleModalSubmit(interaction);
                    
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
}

// Démarrage
console.log('🚀 BAG BOT V2 - Solution Render.com Finale');
new RenderSolutionBot();