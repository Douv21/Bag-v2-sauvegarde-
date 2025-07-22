const { Client, Collection, GatewayIntentBits, Routes, REST, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');

class RenderSolutionBot {
    constructor() {
        this.initializeWebServer();
    }

    async initializeWebServer() {
        // 1. Serveur web d'abord (port 5000 pour Render.com)
        const app = express();
        const PORT = process.env.PORT || 5000;

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

        // Démarrer le serveur web AVANT Discord
        app.listen(PORT, '0.0.0.0', () => {
            console.log('🌐 Serveur Web actif sur port', PORT);
            console.log('📊 Status: http://localhost:5000/commands-status');
            console.log('✅ Port 5000 ouvert pour Render.com');
            
            // 2. Ensuite initialiser Discord
            setTimeout(() => this.initializeDiscord(), 1000);
        });
    }

    async initializeDiscord() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
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
            console.log('📂 Chargement de 25 commandes...');
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
                const countingHandled = await this.handleCounting(message);
                
                if (!countingHandled) {
                    await this.handleMessageReward(message);
                }
                
                await this.handleAutoThread(message);
                
            } catch (error) {
                console.error('❌ Erreur messageCreate:', error);
            }
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
            else if (interaction.isStringSelectMenu() || interaction.isUserSelectMenu() || interaction.isChannelSelectMenu() || interaction.isButton() || interaction.isModalSubmit()) {
                const customId = interaction.customId;
                console.log(`🔄 MainRouter traite: ${customId}`);
                
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

    async handleMessageReward(message) {
        try {
            const dataManager = require('./utils/simpleDataManager');
            const economyConfig = await dataManager.loadData('economy.json', {});
            const guildId = message.guild.id;
            
            const guildConfig = economyConfig[guildId]?.messageRewards;
            if (!guildConfig || !guildConfig.enabled) return;
            
            const userId = message.author.id;
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
