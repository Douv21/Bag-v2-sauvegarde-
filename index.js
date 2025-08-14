/**
 * BAG BOT V2 - RENDER.COM WEB SERVICE
 * Architecture modulaire pour déploiement Web Service
 */

const ensureFileAndBlobPolyfills = () => {
  try {
    if (typeof globalThis.Blob === 'undefined') {
      const { Blob } = require('buffer');
      globalThis.Blob = Blob;
    }
  } catch {}

  try {
    if (typeof globalThis.File === 'undefined') {
      try {
        const { File } = require('undici');
        if (File) {
          globalThis.File = File;
          return;
        }
      } catch {}
      const BlobImpl = globalThis.Blob || require('buffer').Blob;
      globalThis.File = class File extends BlobImpl {
        constructor(parts = [], name = 'file', options = {}) {
          super(parts, options);
          this.name = String(name);
          this.lastModified = options.lastModified ?? Date.now();
        }
        get [Symbol.toStringTag]() {
          return 'File';
        }
      };
    }
  } catch {}
};

ensureFileAndBlobPolyfills();

const { Client, Collection, GatewayIntentBits, Partials, REST, Routes, MessageFlags } = require('discord.js');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Gestionnaires centralisés
const DataManager = require('./managers/DataManager');
const KarmaManager = require('./managers/KarmaManager');
const MainRouterHandler = require('./handlers/MainRouterHandler');
const CommandHandler = require('./handlers/CommandHandler');
const ReminderManager = require('./managers/ReminderManager');
const ReminderInteractionHandler = require('./handlers/ReminderInteractionHandler');
const ModerationManager = require('./managers/ModerationManager');

class BagBotRender {
    constructor() {
        // Configuration Discord
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates
            ],
            partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
        });

        // Gestionnaires
        this.dataManager = new DataManager();
        this.karmaManager = new KarmaManager(this.dataManager);
        this.interactionHandler = new InteractionHandler(this.dataManager);
        this.reminderManager = new ReminderManager(this.dataManager, this.client);
        this.reminderInteractionHandler = new ReminderInteractionHandler(this.reminderManager);
                this.moderationManager = new ModerationManager(this.dataManager, this.client);
        const LogManager = require('./managers/LogManager');
        this.logManager = new LogManager(this.dataManager, this.client);
        // Optionnel: conserver config-bump uniquement pour UI? On va retirer bump complet; pas d'UI bump.
        this.mainRouterHandler = new MainRouterHandler(this.dataManager);
        this.commandHandler = new CommandHandler(this.client, this.dataManager);

        // Attache reminderManager
        this.client.reminderManager = this.reminderManager;
        this.client.moderationManager = this.moderationManager;
        this.client.logManager = this.logManager;

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

        // Dashboard temporairement désactivé
        this.app.get('/api/dashboard/overview', (req, res) => {
            res.status(503).json({ error: 'dashboard_disabled' });
        });

        this.app.get('/api/dashboard/servers', (req, res) => {
            res.status(503).json({ error: 'dashboard_disabled' });
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

        // Generic config endpoints for dashboard sections (economy, levels, karma, confessions, counting, autothread, shop, logs, bump, music)
        this.app.get('/api/config/:name', async (req, res) => {
            try {
                const { name } = req.params;
                const fs = require('fs');
                const path = require('path');
                const configPath = path.join(__dirname, 'data', 'configs', `${name}.json`);
                if (!fs.existsSync(configPath)) {
                    return res.json({ success: true, data: {} });
                }
                const raw = fs.readFileSync(configPath, 'utf8');
                const data = JSON.parse(raw);
                res.json({ success: true, data });
            } catch (error) {
                console.error('GET /api/config error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/config/:name', async (req, res) => {
            try {
                const { name } = req.params;
                const payload = req.body || {};
                const fs = require('fs');
                const path = require('path');
                const dirPath = path.join(__dirname, 'data', 'configs');
                const filePath = path.join(dirPath, `${name}.json`);
                if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
                const tmp = filePath + '.tmp';
                fs.writeFileSync(tmp, JSON.stringify(payload, null, 2));
                fs.renameSync(tmp, filePath);
                res.json({ success: true });
            } catch (error) {
                console.error('POST /api/config error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Moderation endpoints per guild
        this.app.get('/api/moderation/:guildId', async (req, res) => {
            try {
                const { guildId } = req.params;
                const modAll = await this.dataManager.getData('moderation_config');
                const cfg = modAll[guildId] || {};
                res.json({ success: true, data: cfg });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/moderation/:guildId', async (req, res) => {
            try {
                const { guildId } = req.params;
                const body = req.body || {};
                const all = await this.dataManager.getData('moderation_config');
                all[guildId] = body;
                await this.dataManager.saveData('moderation_config', all);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Guild roles listing for UI selectors
        this.app.get('/api/guilds/:guildId/roles', async (req, res) => {
            try {
                const { guildId } = req.params;
                const guild = this.client.guilds.cache.get(guildId);
                if (!guild) return res.json({ success: true, data: [] });
                await guild.roles.fetch();
                const roles = guild.roles.cache
                    .filter(r => r.editable || true)
                    .map(r => ({ id: r.id, name: r.name, color: r.hexColor }))
                    .sort((a, b) => a.name.localeCompare(b.name));
                res.json({ success: true, data: roles });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Admin quick-actions from dashboard
        this.app.post('/api/admin/clear-test-objects', async (req, res) => {
            try {
                console.log('🧹 clear-test-objects requested from dashboard');
                // Optionally integrate with scripts/cleaners later
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/admin/reset-commands', async (req, res) => {
            try {
                console.log('🔁 reset-commands requested from dashboard');
                // A implémenter si nécessaire: purge et re-register
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/admin/force-backup', async (req, res) => {
            try {
                const ts = await this.dataManager.createBackup();
                res.json({ success: !!ts, timestamp: ts });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Dashboard routes (placeholder)
        this.app.get('/dashboard', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
        });

        this.app.get('/dashboard/:guildId', (req, res) => {
            res.redirect('/dashboard');
        });

        // Static files for dashboard
        this.app.use(express.static(path.join(__dirname, 'public')));
    }

    // Méthodes pour récupérer les statistiques
    async getEconomyStats() {
        try {
            const users = await this.dataManager.getAllUsers();
            const totalMoney = users.reduce((sum, user) => sum + (user.argent || 0), 0);
            const richestUser = users.sort((a, b) => (b.argent || 0) - (a.argent || 0))[0];
            
            return {
                totalMoney,
                totalUsers: users.length,
                richestUser: richestUser ? {
                    id: richestUser.userId,
                    amount: richestUser.argent || 0
                } : null,
                dailyTransactions: 0 // TODO: Implementer le tracking des transactions
            };
        } catch (error) {
            console.error('Error getting economy stats:', error);
            return { totalMoney: 0, totalUsers: 0, richestUser: null, dailyTransactions: 0 };
        }
    }

    async getConfessionStats() {
        try {
            // TODO: Implémenter le système de confessions
            return {
                total: 0,
                daily: 0,
                pending: 0
            };
        } catch (error) {
            console.error('Error getting confession stats:', error);
            return { total: 0, daily: 0, pending: 0 };
        }
    }

    async getKarmaStats() {
        try {
            const users = await this.dataManager.getAllUsers();
            const totalKarma = users.reduce((sum, user) => sum + (user.karma || 0), 0);
            const topKarmaUser = users.sort((a, b) => (b.karma || 0) - (a.karma || 0))[0];
            const activeUsers = users.filter(user => (user.karma || 0) > 0).length;
            
            return {
                total: totalKarma,
                activeUsers,
                topUser: topKarmaUser ? {
                    id: topKarmaUser.userId,
                    karma: topKarmaUser.karma || 0
                } : null
            };
        } catch (error) {
            console.error('Error getting karma stats:', error);
            return { total: 0, activeUsers: 0, topUser: null };
        }
    }

    async getRecentActivity() {
        try {
            // TODO: Implémenter un système de logs d'activité
            return [
                {
                    type: 'economy',
                    message: 'Nouvel utilisateur inscrit au système économique',
                    timestamp: new Date(),
                    icon: 'fas fa-coins'
                },
                {
                    type: 'level',
                    message: 'Utilisateur a atteint le niveau 10',
                    timestamp: new Date(Date.now() - 3600000),
                    icon: 'fas fa-star'
                },
                {
                    type: 'karma',
                    message: '+5 karma distribué',
                    timestamp: new Date(Date.now() - 7200000),
                    icon: 'fas fa-heart'
                }
            ];
        } catch (error) {
            console.error('Error getting recent activity:', error);
            return [];
        }
    }

    setupDiscordEvents() {
        this.client.once('ready', async () => {
            console.log(`✅ ${this.client.user.tag} connecté`);
            
            // Enregistrement des commandes slash
            await this.registerSlashCommands();

            // Attendre l'initialisation MongoDB
            try {
                await this.dataManager.initializeMongoDB();
            } catch (mongoError) {
                console.error('❌ Erreur initialisation MongoDB:', mongoError);
            }

            // Initialisation des rappels de bump
            try {
                await this.reminderManager.initialize();
            } catch (remError) {
                console.error('❌ Erreur initialisation ReminderManager:', remError);
            }

            // Planification des vérifications de modération (inactivité / roles)
            try {
                this.moderationManager.startScheduler(60 * 60 * 1000); // hourly
                console.log('🕒 Planification des vérifications de modération activée (check hourly)');
            } catch (modErr) {
                console.error('❌ Erreur initialisation scheduler moderation:', modErr);
            }

            // Scheduler reset hebdomadaire du karma (vérification horaire)
            try {
                // Vérification immédiate au démarrage
                await this.karmaManager.checkWeeklyReset();
                // Puis toutes les heures
                setInterval(async () => {
                    try {
                        await this.karmaManager.checkWeeklyReset();
                    } catch (err) {
                        console.error('❌ Erreur checkWeeklyReset:', err);
                    }
                }, 60 * 60 * 1000);
                console.log('🕒 Planification du reset hebdomadaire du karma activée (check hourly)');
            } catch (schedulerError) {
                console.error('❌ Erreur initialisation scheduler karma:', schedulerError);
            }
        });

        // Gestion des interactions (boutons, menus, modals, commandes slash)
        this.client.on('interactionCreate', async (interaction) => {
            try {
                // Les commandes slash sont gérées par CommandHandler
                if (interaction.isChatInputCommand()) {
                    return;
                }
                
                // Gestion des autres interactions (boutons, menus, modals)
                if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu() || 
                    interaction.isRoleSelectMenu() || interaction.isButton() || interaction.isModalSubmit()) {
                    
                    // Vérifier si l'interaction a déjà été répondue
                    if (interaction.replied || interaction.deferred) {
                        console.log(`⚠️ Interaction déjà traitée: ${interaction.customId}`);
                        return;
                    }
                    
                    console.log(`🔄 Traitement interaction: ${interaction.customId}`);
                    // Rappels bump
                    const reminderHandled = await this.reminderInteractionHandler.handleInteraction(interaction);
                    if (reminderHandled) return;
                    // Router vers le MainRouterHandler
                    const handled = await this.mainRouterHandler.handleInteraction(interaction);
                    
                    if (!handled) {
                        console.log(`❌ Interaction non gérée: ${interaction.customId}`);
                        
                        // Répondre uniquement si pas encore répondu
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({
                                content: '❌ Cette interaction n\'est pas encore implémentée.',
                                flags: MessageFlags.Ephemeral
                            });
                        }
                    }
                }
                
            } catch (error) {
                console.error('❌ Erreur interaction:', error);
                
                // Répondre avec une erreur uniquement si pas encore répondu
                if (!interaction.replied && !interaction.deferred) {
                    try {
                        await interaction.reply({ 
                            content: 'Une erreur est survenue lors du traitement de cette interaction.', 
                            flags: MessageFlags.Ephemeral 
                        });
                    } catch (replyError) {
                        console.error('❌ Erreur lors de la réponse d\'erreur:', replyError);
                    }
                }
            }
        });

                // Messages pour économie et auto-thread
        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            
            // Gestion récompenses économiques
            await this.dataManager.handleMessageReward(message);
            
            // Gestion auto-thread
            await this.handleAutoThread(message);

            // Marquer activité pour l'anti-inactivité
            try {
                await this.moderationManager.markActive(message.guild.id, message.author.id);
            } catch {}
        });

        // Logs message edits/deletes
        this.client.on('messageUpdate', async (oldMessage, newMessage) => {
            try { await this.logManager.logMessageEdit(oldMessage, newMessage); } catch {}
        });
        this.client.on('messageDelete', async (message) => {
            try { await this.logManager.logMessageDelete(message); } catch {}
        });

                // Enregistrer la date d'arrivée pour l'application des rôles obligatoires
        this.client.on('guildMemberAdd', async (member) => {
            try {
                await this.moderationManager.recordJoin(member.guild.id, member.id);
            } catch {}
            try { await this.logManager.logMemberJoin(member); } catch {}
        });

                // Départ membre
        this.client.on('guildMemberRemove', async (member) => {
            try { await this.logManager.logMemberLeave(member); } catch {}
        });

        // Changement de pseudo
        this.client.on('guildMemberUpdate', async (oldMember, newMember) => {
            try { await this.logManager.logNicknameChange(oldMember, newMember); } catch {}
        });

        // Ban/Unban
        this.client.on('guildBanAdd', async (ban) => {
            try { await this.logManager.logBan(ban.guild, ban.user, ban.reason); } catch {}
        });
        this.client.on('guildBanRemove', async (ban) => {
            try { await this.logManager.logUnban(ban.guild, ban.user); } catch {}
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
            
            // Charger éventuellement une configuration dédiée autothread.json
            const autoThreadFile = await this.dataManager.loadData('autothread.json', {});
            const mergedAutoThread = autoThreadFile[guildId] || autoThreadConfig;
            if (!mergedAutoThread || !mergedAutoThread.enabled) return;

            // Si mode NSFW activé et canal non NSFW, on évite de créer le thread
            if (mergedAutoThread.nsfw === true && message.channel.nsfw !== true) {
                return;
            }

            // Générer le nom du thread
            let threadNameTemplate = mergedAutoThread.threadName || 'Discussion - {user}';
            if (threadNameTemplate === '__RANDOM_NSFW_BG__') {
                const randomNames = [
                    'Suite privée de {user} 18+',
                    'Boudoir de {user} 18+ 💋',
                    'Chambre rouge de {user} 18+ 🔥',
                    'Salon interdit de {channel} 18+ 🖤',
                    'Secrets d\'oreiller de {user} 18+ 🌙',
                    'Rendez-vous secret de {channel} 18+ 🍷',
                    'Jeux de nuit de {user} 18+ 😈',
                    'Nocturne avec {user} 18+ 🌌',
                    'Ambiance chaude de {channel} 18+ 🔥',
                    'Après-minuit dans #{channel} 18+ 🌙',
                    'Coin câlin de {user} 18+ 🤍',
                    'Tentations de {user} 18+ 🔥',
                    'Pièce secrète de {user} 18+ 🗝️',
                    'Velours noir de {user} 18+ 🖤',
                    'Murmures de {user} 18+ 🕯️',
                    'Journal intime de {user} 18+ ✒️',
                    'Chambre des plaisirs de {user} 18+ 😈',
                    'Entre deux draps avec {user} 18+ 💫',
                    'Confidences nocturnes de {user} 18+ 🌙',
                    'Salle privée de {channel} 18+ 🚪',
                    'Lueur pourpre de {user} 18+ 🌹',
                    'Suite interdite de {user} 18+ 🔒',
                    'Loge des voyeurs #{channel} 18+ 👀',
                    'Œil indiscret sur {user} 18+ 👁️',
                    'Rôleplay avec {user} 18+ 🎭',
                    'Maître & Muse : {user} 18+ ⛓️',
                    'Domination de {user} 18+ ⛓️',
                    'Soubrette & Maître de {user} 18+ 🥀',
                    'Baiser volé de {user} 18+ 💋',
                    'Chuchotis sucrés de {user} 18+ 🍯'
                ];
                threadNameTemplate = randomNames[Math.floor(Math.random() * randomNames.length)];
            }

            // Remplacer les variables
            let threadName = threadNameTemplate
                .replace('{user}', message.member?.displayName || message.author.username)
                .replace('{channel}', message.channel.name)
                .replace('{date}', new Date().toLocaleDateString('fr-FR'))
                .replace('{time}', new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

            // Limiter le nom à 100 caractères (limite Discord)
            threadName = threadName.substring(0, 100);
            
            // Créer le thread
            const thread = await message.startThread({
                name: threadName,
                autoArchiveDuration: mergedAutoThread.archiveTime || 60,
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