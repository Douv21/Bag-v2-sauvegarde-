/**
 * BAG BOT V2 - RENDER.COM WEB SERVICE
 * Architecture modulaire pour déploiement Web Service
 */

const { Client, Collection, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Gestionnaires centralisés
const DataManager = require('./managers/DataManager');
const KarmaManager = require('./managers/KarmaManager');
const InteractionHandler = require('./handlers/InteractionHandler');
const CommandHandler = require('./handlers/CommandHandler');

class BagBotRender {
    constructor() {
        // Configuration Discord
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ],
            partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
        });

        // Gestionnaires
        this.dataManager = new DataManager();
        this.karmaManager = new KarmaManager(this.dataManager);
        this.interactionHandler = new InteractionHandler(this.client, this.dataManager);
        this.commandHandler = new CommandHandler(this.client, this.dataManager);

        // Collections
        this.client.commands = new Collection();
        this.client.cooldowns = new Collection();

        // Serveur Express pour Web Service
        this.app = express();
        this.port = process.env.PORT || 5000;

        this.init();
    }

    async init() {
        try {
            // Configuration Express
            this.setupExpress();

            // Chargement des commandes
            await this.commandHandler.loadCommands();

            // Configuration des événements Discord
            this.setupDiscordEvents();

            // Connexion Discord
            await this.client.login(process.env.DISCORD_TOKEN);

            // Démarrage serveur Web
            this.startWebServer();

            console.log('🚀 BAG BOT V2 - Render.com Web Service démarré');
        } catch (error) {
            console.error('❌ Erreur démarrage:', error);
            process.exit(1);
        }
    }

    setupExpress() {
        // Middleware
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));

        // Routes essentielles pour Render.com Web Service
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                discord: this.client.readyAt ? 'connected' : 'connecting',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                service: 'BAG Bot V2 Render',
                commands: this.client.commands?.size || 0
            });
        });

        this.app.get('/', (req, res) => {
            res.status(200).json({
                message: 'BAG Bot V2 Web Service',
                status: 'running',
                version: '2.0.0',
                bot: this.client.user?.tag || 'Démarrage...'
            });
        });

        // Routes de santé (obligatoires pour Render.com Web Service)
        this.app.get('/', (req, res) => {
            res.json({
                status: 'online',
                bot: this.client.user?.tag || 'Démarrage...',
                uptime: process.uptime(),
                timestamp: Date.now(),
                service: 'BAG BOT V2 - Web Service'
            });
        });

        this.app.get('/health', (req, res) => {
            const health = {
                status: 'healthy',
                discord: this.client.readyAt ? 'connected' : 'connecting',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                commands: this.client.commands.size,
                guilds: this.client.guilds.cache.size
            };
            res.json(health);
        });

        // API endpoints pour data
        this.app.get('/api/stats', async (req, res) => {
            try {
                const stats = await this.dataManager.getStats();
                res.json(stats);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/data/:type', async (req, res) => {
            try {
                const { type } = req.params;
                const data = await this.dataManager.getData(type);
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupDiscordEvents() {
        this.client.once('ready', async () => {
            console.log(`✅ ${this.client.user.tag} connecté`);

            // Enregistrement des commandes slash
            await this.registerSlashCommands();
        });

        // Les interactions sont gérées automatiquement dans InteractionHandler

        // Messages pour économie et auto-thread
        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;

            // Gestion récompenses économiques
            await this.dataManager.handleMessageReward(message);

            // Gestion auto-thread
            await this.handleAutoThread(message);

            // Gestion des messages pour les statistiques avec système unifié
            if (message.author && !message.author.bot) {
                try {
                    const dataManager = require('./managers/DataManager.js');
                    dataManager.incrementMessageCount(message.author.id, message.guild.id);
                } catch (error) {
                    console.error('Erreur gestion statistiques messages:', error);
                }
            }
        });

        // Gestion des erreurs
        this.client.on('error', (error) => {
            console.error('❌ Erreur Discord:', error);
        });

        process.on('unhandledRejection', (error) => {
            console.error('❌ Erreur non gérée:', error);
        });
    }

    async registerSlashCommands() {
        try {
            const rest = new REST().setToken(process.env.DISCORD_TOKEN);
            const commands = Array.from(this.client.commands.values()).map(cmd => cmd.data);

            console.log(`🔄 Enregistrement de ${commands.length} commandes...`);

            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );

            console.log(`✅ ${commands.length} commandes enregistrées`);
        } catch (error) {
            console.error('❌ Erreur enregistrement commandes:', error);
        }
    }

    async handleAutoThread(message) {
        try {
            // Charger configuration auto-thread
            const config = await this.dataManager.getData('config');
            const guildId = message.guild.id;
            const channelId = message.channel.id;

            // Vérifier si l'auto-thread est configuré pour cette guilde et ce canal
            const autoThreadConfig = config.autoThread?.[guildId];
            if (!autoThreadConfig || !autoThreadConfig.enabled) return;
            if (!autoThreadConfig.channels.includes(channelId)) return;

            // Vérifier que c'est un canal texte et pas déjà un thread
            if (message.channel.isThread() || message.channel.type !== 0) return;

            // Créer le nom du thread en remplaçant les variables
            let threadName = autoThreadConfig.threadName || 'Discussion - {user}';
            threadName = threadName
                .replace('{user}', message.author.displayName || message.author.username)
                .replace('{channel}', message.channel.name)
                .replace('{date}', new Date().toLocaleDateString('fr-FR'));

            // Limiter le nom à 100 caractères (limite Discord)
            threadName = threadName.substring(0, 100);

            // Créer le thread
            const thread = await message.startThread({
                name: threadName,
                autoArchiveDuration: autoThreadConfig.archiveTime || 60,
                reason: `Auto-thread créé par ${message.author.tag}`
            });

            // Appliquer le mode lent si configuré
            if (autoThreadConfig.slowMode > 0) {
                await thread.setRateLimitPerUser(autoThreadConfig.slowMode);
            }

            console.log(`🧵 Thread créé: "${threadName}" dans #${message.channel.name} par ${message.author.tag}`);

        } catch (error) {
            console.error('❌ Erreur création auto-thread:', error);
        }
    }

    startWebServer() {
        this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`🌐 Serveur Web actif sur port ${this.port}`);
            console.log(`📊 Health check: http://localhost:${this.port}/health`);
        });
    }
}

// Démarrage pour Render.com Web Service
if (require.main === module) {
    new BagBotRender();
}

module.exports = BagBotRender;