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
            ]
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
                commands: this.client.commands.size
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
            // Gérer les commandes slash
            if (interaction.isChatInputCommand()) {
                const command = this.client.commands.get(interaction.commandName);
                if (!command) {
                    console.log(`❓ Commande inconnue: ${interaction.commandName}`);
                    return;
                }

                try {
                    console.log(`🔧 /${interaction.commandName} par ${interaction.user.tag}`);
                    
                    // Initialiser DataManager pour toutes les commandes
                    const dataManager = require('./utils/dataManager');
                    
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
                return;
            }

            // Gérer les interactions de menu
            if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu() || interaction.isRoleSelectMenu()) {
                try {
                    const dataManager = require('./utils/dataManager');
                    const InteractionHandler = require('./handlers/InteractionHandler');
                    const handler = new InteractionHandler(dataManager);
                    
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
        });

        // Système de récompenses pour les messages
        this.client.on('messageCreate', async (message) => {
            // Ignorer les bots et les messages de commande
            if (message.author.bot || message.content.startsWith('/')) return;
            
            // Ignorer les DM
            if (!message.guild) return;
            
            // Gérer le système de comptage d'abord
            await this.handleCounting(message);
            
            // Puis gérer les récompenses de messages
            await this.handleMessageReward(message);
        });

        this.client.on('error', error => {
            console.error('❌ Erreur Discord:', error);
        });
    }

    async handleMessageReward(message) {
        try {
            const dataManager = require('./utils/dataManager');
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
            const dataManager = require('./utils/dataManager');
            const countingConfig = await dataManager.getData('counting') || {};
            const guildConfig = countingConfig[message.guild.id];
            
            // Vérifier si le comptage est activé et dans le bon canal
            if (!guildConfig || !guildConfig.enabled || message.channel.id !== guildConfig.channelId) {
                return;
            }
            
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
            
            // Si ce n'est pas un nombre valide, ignorer
            if (numberValue === null || numberValue < 0) return;
            
            const isCorrect = numberValue === guildConfig.currentNumber;
            const isSameUser = message.author.id === guildConfig.lastUserId;
            const { EmbedBuilder } = require('discord.js');
            
            if (!isCorrect || isSameUser) {
                // Reset nécessaire
                let resetReason = '';
                if (!isCorrect) {
                    resetReason = `Mauvais nombre: attendu ${guildConfig.currentNumber}, reçu ${numberValue}`;
                } else if (isSameUser) {
                    resetReason = `${message.author.displayName} a compté deux fois de suite`;
                }
                
                // Sauvegarder le record si atteint
                const previousNumber = guildConfig.currentNumber - 1;
                if (previousNumber > guildConfig.record) {
                    guildConfig.record = previousNumber;
                }
                
                // Reset la configuration
                guildConfig.currentNumber = guildConfig.startNumber;
                guildConfig.lastUserId = null;
                guildConfig.lastResetReason = resetReason;
                guildConfig.lastResetDate = new Date().toISOString();
                
                // Sauvegarder
                countingConfig[message.guild.id] = guildConfig;
                await dataManager.setData('counting', countingConfig);
                
                // Supprimer le message incorrect
                try {
                    await message.delete();
                } catch (error) {
                    console.error('Impossible de supprimer le message de comptage:', error);
                }
                
                // Envoyer message de reset
                const resetEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🔄 Comptage Remis à Zéro')
                    .setDescription(`**Raison:** ${resetReason}\n\nProchain numéro: **${guildConfig.currentNumber}**`)
                    .addFields([
                        { name: '📊 Nombre atteint', value: previousNumber.toString(), inline: true },
                        { name: '🏆 Record', value: guildConfig.record.toString(), inline: true }
                    ])
                    .setFooter({ text: `Erreur de ${message.author.displayName}` });
                
                await message.channel.send({ embeds: [resetEmbed] });
                
                console.log(`🔄 Comptage reset: ${resetReason} (Record: ${guildConfig.record})`);
                
            } else {
                // Nombre correct !
                guildConfig.currentNumber++;
                guildConfig.lastUserId = message.author.id;
                guildConfig.totalCounts = (guildConfig.totalCounts || 0) + 1;
                
                // Sauvegarder
                countingConfig[message.guild.id] = guildConfig;
                await dataManager.setData('counting', countingConfig);
                
                // Réaction de validation
                try {
                    await message.react('✅');
                } catch (error) {
                    console.error('Impossible d\'ajouter la réaction:', error);
                }
                
                // Messages de félicitations aux paliers
                const milestones = [10, 25, 50, 100, 250, 500, 1000];
                const currentCount = numberValue;
                
                if (milestones.includes(currentCount)) {
                    const milestoneEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('🎉 Palier Atteint!')
                        .setDescription(`Félicitations ! Vous avez atteint le nombre **${currentCount}** !`)
                        .addFields([
                            { name: '👤 Compteur', value: message.author.displayName, inline: true },
                            { name: '🎯 Prochain nombre', value: guildConfig.currentNumber.toString(), inline: true }
                        ])
                        .setFooter({ text: `Total de comptages: ${guildConfig.totalCounts}` });
                    
                    await message.channel.send({ embeds: [milestoneEmbed] });
                }
                
                console.log(`🔢 ${message.author.tag} a compté: ${numberValue} (prochain: ${guildConfig.currentNumber})`);
            }
            
        } catch (error) {
            console.error('❌ Erreur système comptage:', error);
        }
    }
}

// Démarrage
console.log('🚀 BAG BOT V2 - Solution Render.com Finale');
new RenderSolutionBot();