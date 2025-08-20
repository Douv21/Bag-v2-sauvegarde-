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

// Charger les variables d'environnement
try {
    require('dotenv').config();
} catch (e) {
    console.log('⚠️ dotenv non installé, utilisation des variables d\'environnement système');
}

const { Client, Collection, GatewayIntentBits, Partials, REST, Routes, MessageFlags, AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Gestionnaires centralisés
const DataManager = require('./managers/DataManager');
const KarmaManager = require('./managers/KarmaManager');
const InteractionHandler = require('./handlers/InteractionHandler');
const MainRouterHandler = require('./handlers/MainRouterHandler');
const CommandHandler = require('./handlers/CommandHandler');
const ReminderManager = require('./managers/ReminderManager');
const ReminderInteractionHandler = require('./handlers/ReminderInteractionHandler');
const ModerationManager = require('./managers/ModerationManager');
const MusicManagerRouter = require('./managers/MusicManager');
const SecurityButtonHandler = require('./handlers/SecurityButtonHandler');

class BagBotRender {
    constructor() {
        // Configuration Discord
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildModeration
            ],
            partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
        });

        // Gestionnaires
        this.dataManager = new DataManager();
        this.karmaManager = new KarmaManager(this.dataManager);
        this.interactionHandler = new InteractionHandler(this.dataManager);
        this.reminderManager = new ReminderManager(this.dataManager, this.client);
        this.reminderInteractionHandler = new ReminderInteractionHandler(this.reminderManager); // neutralisé
                this.moderationManager = new ModerationManager(this.dataManager, this.client);
        const LogManager = require('./managers/LogManager');
        this.logManager = new LogManager(this.dataManager, this.client);
        this.securityButtonHandler = new SecurityButtonHandler(this.moderationManager);
        // Optionnel: conserver config-bump uniquement pour UI? On va retirer bump complet; pas d'UI bump.
        this.mainRouterHandler = new MainRouterHandler(this.dataManager);
        this.commandHandler = new CommandHandler(this.client, this.dataManager);

        // Attache reminderManager
        this.client.reminderManager = this.reminderManager;
        this.client.moderationManager = this.moderationManager;
        this.client.logManager = this.logManager;
        
        // Attacher les méthodes de quarantaine au client pour les commandes
        this.client.quarantineMember = this.quarantineMember.bind(this);
        this.client.grantAccess = this.grantAccess.bind(this);
        this.client.getQuarantineInfo = this.getQuarantineInfo.bind(this);
        this.client.ensureQuarantineRole = this.ensureQuarantineRole.bind(this);
        this.client.createQuarantineChannels = this.createQuarantineChannels.bind(this);
        this.client.setupQuarantinePermissions = this.setupQuarantinePermissions.bind(this);
        this.client.recordQuarantineInfo = this.recordQuarantineInfo.bind(this);
        this.client.cleanupQuarantineChannels = this.cleanupQuarantineChannels.bind(this);

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

            // Initialisation Lavalink (après connexion Discord)
            try { MusicManagerRouter.configureLavalink(this.client); } catch {}
            
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

        // Upload images for card styles
        const upload = multer({
            storage: multer.memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
            fileFilter: (req, file, cb) => {
                const ok = /^(image\/png|image\/jpe?g|image\/webp)$/i.test(file.mimetype);
                cb(ok ? null : new Error('TYPE_INVALIDE'), ok);
            }
        });

        this.app.post('/api/upload/style-background', upload.single('image'), async (req, res) => {
            try {
                const style = String(req.body.style || '').trim();
                if (!style) return res.status(400).json({ success: false, error: 'STYLE_REQUIS' });
                if (!req.file) return res.status(400).json({ success: false, error: 'IMAGE_REQUISE' });

                const ext = req.file.mimetype.includes('png') ? 'png' : (req.file.mimetype.includes('webp') ? 'webp' : 'jpg');
                const dir = path.join(__dirname, 'assets', 'styles', style);
                fs.mkdirSync(dir, { recursive: true });
                const filePath = path.join(dir, `default.${ext}`);

                fs.writeFileSync(filePath + '.tmp', req.file.buffer);
                if (fs.existsSync(filePath)) fs.rmSync(filePath);
                fs.renameSync(filePath + '.tmp', filePath);

                // Update data/level_config.json so styleBackgrounds.default points to relative path
                const cfgPath = path.join(__dirname, 'data', 'level_config.json');
                let cfg = {};
                try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch (_) { cfg = {}; }
                cfg.styleBackgrounds = cfg.styleBackgrounds || {};
                cfg.styleBackgrounds[style] = cfg.styleBackgrounds[style] || {};
                // save relative path from project root, utils/styleBackgrounds will resolve it
                const relPath = path.join('assets', 'styles', style, `default.${ext}`);
                cfg.styleBackgrounds[style].default = relPath;
                fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
                fs.writeFileSync(cfgPath + '.tmp', JSON.stringify(cfg, null, 2));
                if (fs.existsSync(cfgPath)) fs.rmSync(cfgPath);
                fs.renameSync(cfgPath + '.tmp', cfgPath);

                res.json({ success: true, path: relPath });
            } catch (error) {
                console.error('POST /api/upload/style-background error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
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
        // (endpoint racine déjà défini ci-dessus)

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
                const guildId = req.query.guildId || null;
                const stats = await this.dataManager.getStats(guildId);
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
                const knownRootFiles = {
                    'economy': 'economy.json',
                    'level_config': 'level_config.json',
                    'karma_config': 'karma_config.json',
                    'confessions': 'confessions.json',
                    'moderation_config': 'moderation_config.json'
                };
                const fs = require('fs');
                const path = require('path');
                let data = {};
                if (knownRootFiles[name]) {
                    // Lire depuis data/<file>.json
                    data = await this.dataManager.loadData(knownRootFiles[name], {});
                } else {
                    // Fallback vers data/configs/<name>.json
                    const configPath = path.join(__dirname, 'data', 'configs', `${name}.json`);
                    if (fs.existsSync(configPath)) {
                        const raw = fs.readFileSync(configPath, 'utf8');
                        data = JSON.parse(raw);
                    } else {
                        data = {};
                    }
                }
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
                const knownRootFiles = {
                    'economy': 'economy.json',
                    'level_config': 'level_config.json',
                    'karma_config': 'karma_config.json',
                    'confessions': 'confessions.json',
                    'moderation_config': 'moderation_config.json'
                };

                if (knownRootFiles[name]) {
                    // Écrire dans data/<file>.json via DataManager (atomique + répertoires)
                    const ok = await this.dataManager.saveRawFile(knownRootFiles[name], payload);
                    if (!ok) throw new Error('WRITE_FAILED');
                    // Nettoyer le cache si pertinent
                    try { this.dataManager.clearCache(name); } catch {}
                    return res.json({ success: true });
                } else {
                    // Fallback: data/configs/<name>.json
                    const dirPath = path.join(__dirname, 'data', 'configs');
                    const filePath = path.join(dirPath, `${name}.json`);
                    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
                    const tmp = filePath + '.tmp';
                    fs.writeFileSync(tmp, JSON.stringify(payload, null, 2));
                    fs.renameSync(tmp, filePath);
                    return res.json({ success: true });
                }
            } catch (error) {
                console.error('POST /api/config error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Aggregated configs for dashboard preload
        this.app.get('/api/configs', async (req, res) => {
            try {
                const economyConfig = await this.dataManager.loadData('economy.json', {});
                const levelConfig = await this.dataManager.loadData('level_config.json', {});
                const karmaConfig = await this.dataManager.loadData('karma_config.json', {});
                const confessionConfig = await this.dataManager.loadData('confessions.json', {});

                const configs = {
                    economy: {
                        dailyReward: economyConfig.dailyReward || 100,
                        workReward: economyConfig.workReward || { min: 50, max: 200 },
                        crimeReward: economyConfig.crimeReward || { min: 100, max: 500 },
                        crimeFail: economyConfig.crimeFail || { min: 20, max: 100 },
                        betLimit: economyConfig.betLimit || 1000,
                        interestRate: economyConfig.interestRate || 0.02
                    },
                    levels: {
                        textXP: levelConfig.textXP || { min: 5, max: 15, cooldown: 60000 },
                        voiceXP: levelConfig.voiceXP || { amount: 10, interval: 60000, perMinute: 10 },
                        notifications: levelConfig.notifications || { enabled: true, channelId: null, cardStyle: 'holographic' },
                        roleRewards: levelConfig.roleRewards || {},
                        levelFormula: levelConfig.levelFormula || { baseXP: 100, multiplier: 1.5 },
                        leaderboard: levelConfig.leaderboard || { limit: 10 }
                    },
                    karma: {
                        dailyBonus: karmaConfig.dailyBonus || 5,
                        messageReward: karmaConfig.messageReward || 1,
                        confessionReward: karmaConfig.confessionReward || 10,
                        maxKarma: karmaConfig.maxKarma || 1000,
                        discounts: karmaConfig.discounts || []
                    },
                    confessions: {
                        channelId: confessionConfig.channelId || null,
                        moderationEnabled: confessionConfig.moderationEnabled !== false,
                        autoDelete: confessionConfig.autoDelete || false,
                        minLength: confessionConfig.minLength || 10,
                        maxLength: confessionConfig.maxLength || 2000
                    }
                };

                res.json({ success: true, data: configs });
            } catch (error) {
                console.error('GET /api/configs error:', error);
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
            const gid = req.params.guildId;
            res.redirect(`/dashboard?guildId=${encodeURIComponent(gid)}`);
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
                    try {
                        // Incrémenter le compteur de commandes utilisées
                        const guildId = interaction.guild?.id || null;
                        await this.dataManager.incrementCommandCount(guildId);
                    } catch {}
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

                    // Gestion des boutons de sécurité
                    if (interaction.isButton() && interaction.customId.startsWith('security_')) {
                        return this.securityButtonHandler.handleSecurityButton(interaction);
                    }

                    // Routage prioritaire: configuration des images par style & rôle
                    try {
                        const id = interaction.customId || '';
                        if (
                            id === 'style_backgrounds_style' ||
                            id.startsWith('style_backgrounds_role_') ||
                            id.startsWith('style_backgrounds_actions_') ||
                            id.startsWith('style_backgrounds_modal_') ||
                            id.startsWith('style_backgrounds_default_modal_')
                        ) {
                            const LevelConfigHandler = require('./handlers/LevelConfigHandler');
                            const levelHandler = new LevelConfigHandler();
                            await levelHandler.handleStyleBackgroundsAction(interaction, id);
                            return;
                        }
                    } catch (styleRouteError) {
                        console.error('❌ Erreur routage style_backgrounds:', styleRouteError);
                    }

                    // Rappels bump désactivés (pas de boutons)
                    // Router vers le MainRouterHandler
                    const handled = await this.mainRouterHandler.handleInteraction(interaction);
                    
                    if (!handled) {
                        console.log(`❌ Interaction non gérée: ${interaction.customId}`);
                        // Gestion rapide du sélecteur color-role si présent (fallback)
                        try {
                            if ((interaction.customId || '').startsWith('color_role_select|')) {
                                const ok = await this.mainRouterHandler.handleColorRoleSelect(interaction, interaction.customId);
                                if (ok) return;
                            }
                        } catch (e) {
                            console.error('Erreur fallback color_role_select:', e);
                        }
                        
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
            // Détection automatique du succès de bump DISBOARD pour relancer le cooldown de 2h
            try {
                const DISBOARD_BOT_ID = '302050872383242240';
                if (message.author?.id === DISBOARD_BOT_ID && message.guild) {
                    const content = (message.content || '').toLowerCase();
                    const embedAggregate = (message.embeds || [])
                        .map(e => {
                            const fieldsStr = (e.fields || []).map(f => [f.name, f.value].filter(Boolean).join(' ')).join(' ');
                            return [e.title, e.description, e.footer?.text, e.author?.name, fieldsStr].filter(Boolean).join(' ');
                        })
                        .join(' ')
                        .toLowerCase();
                    const text = `${content} ${embedAggregate}`;
                    const successIndicators = [
                        'bump done',
                        'bumped this server',
                        'you can bump again',
                        'next bump',
                        'bump effectué',
                        'bump réussi',
                        'a été bumpé',
                        'prochain bump'
                    ];
                    const isSuccess = successIndicators.some(ind => text.includes(ind));
                    if (isSuccess) {
                        try {
                            await this.reminderManager.restartCooldown(message.guild.id, message.channel.id);
                        } catch {}
                        // Synchroniser le cooldown de la plateforme 'disboard' pour l'UI bump
                        try {
                            if (this.dataManager.db) {
                                await this.dataManager.db.collection('bumpCooldowns').updateOne(
                                    { guildId: message.guild.id, platform: 'disboard' },
                                    { $set: { lastBump: Date.now(), updatedAt: new Date(), userId: null } },
                                    { upsert: true }
                                );
                            }
                        } catch {}
                    }
                }
            } catch {}

            if (message.author.bot) return;
            
            // Gestion récompenses économiques
            await this.dataManager.handleMessageReward(message);
            
            // Gestion auto-thread
            await this.handleAutoThread(message);

            // Marquer activité pour l'anti-inactivité
            try {
                await this.moderationManager.markActive(message.guild.id, message.author.id);
            } catch {}

            // Incrémenter le compteur de messages du jour
            try {
                await this.dataManager.incrementMessageCount(message.guild?.id || null);
            } catch {}
        });

        // Logs message edits/deletes
        this.client.on('messageUpdate', async (oldMessage, newMessage) => {
            try { await this.logManager.logMessageEdit(oldMessage, newMessage); } catch {}
        });
        this.client.on('messageDelete', async (message) => {
            try { await this.logManager.logMessageDelete(message); } catch {}
        });

        // Logs voice events
        this.client.on('voiceStateUpdate', async (oldState, newState) => {
            try { await this.logManager.logVoiceState(oldState, newState); } catch {}
            try {
                const guild = newState.guild || oldState.guild;
                if (!guild) return;
                const me = guild.members.me || guild.members.cache.get(this.client.user.id);
                if (!me) return;

                // Determine affected channel (left or joined)
                const leftChannel = oldState.channelId && oldState.channelId !== newState.channelId ? oldState.channel : null;
                const joinedChannel = newState.channelId && oldState.channelId !== newState.channelId ? newState.channel : null;
                const checkChannels = [leftChannel, joinedChannel].filter(Boolean);

                // If nothing changed, also check current channel if any
                if (checkChannels.length === 0 && newState.channel) checkChannels.push(newState.channel);

                const { stop, getQueueInfo } = require('./managers/MusicManager');

                for (const channel of checkChannels) {
                    try {
                        if (!channel || channel.guild.id !== guild.id) continue;
                        // Only act for the channel where the bot is connected
                        const meInThisChannel = channel.members?.has(me.id);
                        if (!meInThisChannel) continue;
                        const nonBotMembers = channel.members.filter(m => !m.user.bot);
                        if (nonBotMembers.size === 0) {
                            // No humans left: clear queue and disconnect
                            try { await stop(guild.id); } catch {}
                        }
                    } catch {}
                }
            } catch {}
        });

                // Enregistrer la date d'arrivée pour l'application des rôles obligatoires
        this.client.on('guildMemberAdd', async (member) => {
            try {
                await this.moderationManager.recordJoin(member.guild.id, member.id);
            } catch {}
            try { await this.logManager.logMemberJoin(member); } catch {}
            try { await this.logManager.updateMemberRolesSnapshot(member); } catch {}
            
            // Vérification de sécurité et contrôle d'accès automatique
            try {
                await this.performSecurityCheck(member);
            } catch (error) {
                console.error('Erreur vérification sécurité nouveau membre:', error);
            }
        });

                // Départ membre
        this.client.on('guildMemberRemove', async (member) => {
            try {
                let isKick = false;
                let moderatorUser = null;
                let reason = null;
                try {
                    const me = member.guild?.members?.me;
                    if (me?.permissions?.has(PermissionFlagsBits.ViewAuditLog)) {
                        const logs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 });
                        const entry = logs?.entries?.first();
                        if (entry && entry.target?.id === member.id && (Date.now() - entry.createdTimestamp) < 10000) {
                            isKick = true;
                            moderatorUser = entry.executor || null;
                            reason = entry.reason || null;
                        }
                    }
                } catch {}

                if (isKick) {
                    try { await this.logManager.logKick(member, moderatorUser, reason); } catch {}
                } else {
                    try { await this.logManager.logMemberLeave(member); } catch {}
                }
            } catch {}
        });

        // Changement de pseudo
        this.client.on('guildMemberUpdate', async (oldMember, newMember) => {
            try {
                const beforeTs = oldMember.communicationDisabledUntilTimestamp || null;
                const afterTs = newMember.communicationDisabledUntilTimestamp || null;

                if (beforeTs !== afterTs) {
                    let moderatorUser = null;
                    let reason = null;
                    try {
                        const me = newMember.guild?.members?.me;
                        if (me?.permissions?.has(PermissionFlagsBits.ViewAuditLog)) {
                            const logs = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 5 });
                            const entry = logs?.entries?.find(e =>
                                e?.target?.id === newMember.id &&
                                (Date.now() - e.createdTimestamp) < 15000 &&
                                Array.isArray(e.changes) &&
                                e.changes.some(ch => ch.key === 'communication_disabled_until')
                            );
                            if (entry) {
                                moderatorUser = entry.executor || null;
                                reason = entry.reason || null;
                            }
                        }
                    } catch {}

                    if (!beforeTs && afterTs) {
                        const durationMs = Math.max(0, afterTs - Date.now());
                        try { await this.logManager.logMute(newMember, moderatorUser, durationMs, reason); } catch {}
                    } else if (beforeTs && !afterTs) {
                        try { await this.logManager.logUnmute(newMember, moderatorUser, reason); } catch {}
                    } else if (beforeTs && afterTs && beforeTs !== afterTs) {
                        const durationMs = Math.max(0, afterTs - Date.now());
                        try { await this.logManager.logMute(newMember, moderatorUser, durationMs, reason); } catch {}
                    }
                }

                try { await this.logManager.logNicknameChange(oldMember, newMember); } catch {}
                try { await this.logManager.logMemberRoleChanges(oldMember, newMember); } catch {}
            } catch {}
        });

        // Ban/Unban
        this.client.on('guildBanAdd', async (ban) => {
            try {
                let moderatorUser = null;
                let reason = ban.reason || null;
                try {
                    const me = ban.guild?.members?.me;
                    if (me?.permissions?.has(PermissionFlagsBits.ViewAuditLog)) {
                        const logs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
                        const entry = logs?.entries?.first();
                        if (entry && entry.target?.id === ban.user.id && (Date.now() - entry.createdTimestamp) < 10000) {
                            moderatorUser = entry.executor || null;
                            if (!reason) reason = entry.reason || null;
                        }
                    }
                } catch {}
                try { await this.logManager.logBan(ban.guild, ban.user, reason, moderatorUser); } catch {}
            } catch {}
        });
        this.client.on('guildBanRemove', async (ban) => {
            try {
                let moderatorUser = null;
                try {
                    const me = ban.guild?.members?.me;
                    if (me?.permissions?.has(PermissionFlagsBits.ViewAuditLog)) {
                        const logs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 });
                        const entry = logs?.entries?.first();
                        if (entry && entry.target?.id === ban.user.id && (Date.now() - entry.createdTimestamp) < 10000) {
                            moderatorUser = entry.executor || null;
                        }
                    }
                } catch {}
                try { await this.logManager.logUnban(ban.guild, ban.user, moderatorUser); } catch {}
            } catch {}
        });

        // Role create/delete/update
        this.client.on('roleCreate', async (role) => {
            try { await this.logManager.logRoleCreate(role); } catch {}
        });
        this.client.on('roleDelete', async (role) => {
            try { await this.logManager.logRoleDelete(role); } catch {}
        });
        this.client.on('roleUpdate', async (oldRole, newRole) => {
            try { await this.logManager.logRoleUpdate(oldRole, newRole); } catch {}
        });

        // Logs channels create/delete/update
		this.client.on('channelCreate', async (channel) => { try { await this.logManager.logChannelCreate(channel); } catch {} });
		this.client.on('channelDelete', async (channel) => { try { await this.logManager.logChannelDelete(channel); } catch {} });
		this.client.on('channelUpdate', async (oldChannel, newChannel) => { try { await this.logManager.logChannelUpdate(oldChannel, newChannel); } catch {} });

		// Logs threads
		this.client.on('threadCreate', async (thread) => { try { await this.logManager.logThreadCreate(thread); } catch {} });
		this.client.on('threadDelete', async (thread) => { try { await this.logManager.logThreadDelete(thread); } catch {} });
		this.client.on('threadUpdate', async (oldThread, newThread) => { try { await this.logManager.logThreadUpdate(oldThread, newThread); } catch {} });

		// Logs emojis
		this.client.on('emojiCreate', async (emoji) => { try { await this.logManager.logEmojiCreate(emoji); } catch {} });
		this.client.on('emojiDelete', async (emoji) => { try { await this.logManager.logEmojiDelete(emoji); } catch {} });
		this.client.on('emojiUpdate', async (oldEmoji, newEmoji) => { try { await this.logManager.logEmojiUpdate(oldEmoji, newEmoji); } catch {} });

		// Logs stickers
		this.client.on('stickerCreate', async (sticker) => { try { await this.logManager.logStickerCreate(sticker); } catch {} });
		this.client.on('stickerDelete', async (sticker) => { try { await this.logManager.logStickerDelete(sticker); } catch {} });
		this.client.on('stickerUpdate', async (oldSticker, newSticker) => { try { await this.logManager.logStickerUpdate(oldSticker, newSticker); } catch {} });

		// Logs invites
		this.client.on('inviteCreate', async (invite) => { try { await this.logManager.logInviteCreate(invite); } catch {} });
		this.client.on('inviteDelete', async (invite) => { try { await this.logManager.logInviteDelete(invite); } catch {} });

		// Logs webhooks (via channel pins)
		this.client.on('webhookUpdate', async (channel) => { try { await this.logManager.logWebhookUpdate(channel); } catch {} });

		// Logs serveur (guild update)
		this.client.on('guildUpdate', async (oldGuild, newGuild) => { try { await this.logManager.logGuildUpdate(oldGuild, newGuild); } catch {} });

		// Logs boosts
		this.client.on('guildMemberUpdate', async (oldMember, newMember) => {
			try {
				const before = oldMember.premiumSinceTimestamp || oldMember.premiumSince || oldMember.premiumSinceWeb || null;
				const after = newMember.premiumSinceTimestamp || newMember.premiumSince || newMember.premiumSinceWeb || null;
				if (!before && after) { try { await this.logManager.logBoostStart(newMember); } catch {} }
				if (before && !after) { try { await this.logManager.logBoostEnd(newMember); } catch {} }
			} catch {}
		});

		// Logs événements planifiés
		this.client.on('guildScheduledEventCreate', async (event) => { try { await this.logManager.logScheduledEventCreate(event); } catch {} });
		this.client.on('guildScheduledEventUpdate', async (oldEvent, newEvent) => { try { await this.logManager.logScheduledEventUpdate(oldEvent, newEvent); } catch {} });
		this.client.on('guildScheduledEventDelete', async (event) => { try { await this.logManager.logScheduledEventDelete(event); } catch {} });

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

    /**
     * Effectuer une vérification de sécurité automatique sur un nouveau membre
     * @param {GuildMember} member - Le nouveau membre
     */
    async performSecurityCheck(member) {
        try {
            const config = await this.moderationManager.getSecurityConfig(member.guild.id);
            
            // Si le système n'est pas activé, ne rien faire
            if (!config.enabled) return;

            // Vérifier si l'utilisateur est whitelisté
            if (await this.moderationManager.isUserWhitelisted(member.guild.id, member.user.id, member)) {
                console.log(`✅ Membre whitelisté: ${member.user.tag}`);
                return;
            }

            // Si le contrôle d'accès est activé, utiliser le nouveau système
            if (config.accessControl?.enabled) {
                return this.processNewMemberAccess(member);
            }

            // Sinon, utiliser le système d'alertes simple
            const [securityAnalysis, raidCheck, multiAccountCheck] = await Promise.all([
                this.moderationManager.analyzeUserSecurity(member.guild, member.user),
                this.moderationManager.checkRaidIndicators(member.guild, member.user),
                this.moderationManager.detectMultiAccounts(member.guild, member.user)
            ]);

            let totalRiskScore = securityAnalysis.riskScore;
            if (multiAccountCheck.confidence >= 70) totalRiskScore += 25;
            else if (multiAccountCheck.confidence >= 50) totalRiskScore += 15;

            // Envoyer alerte si seuil dépassé
            if (totalRiskScore >= config.thresholds.alertThreshold || 
                raidCheck.isRaidSuspect || 
                multiAccountCheck.confidence >= config.thresholds.multiAccountAlert) {
                
                await this.sendSecurityAlert(member, securityAnalysis, {
                    totalScore: totalRiskScore,
                    raidCheck,
                    multiAccountCheck
                });
            }

        } catch (error) {
            console.error('Erreur vérification sécurité automatique:', error);
        }
    }

    async processNewMemberAccess(member) {
        try {
            const config = await this.moderationManager.getSecurityConfig(member.guild.id);
            
            // Effectuer l'analyse complète
            const [securityAnalysis, multiAccountCheck, raidCheck] = await Promise.all([
                this.moderationManager.analyzeUserSecurity(member.guild, member.user),
                this.moderationManager.detectMultiAccounts(member.guild, member.user),
                this.moderationManager.checkRaidIndicators(member.guild, member.user)
            ]);

            let totalScore = securityAnalysis.riskScore;
            if (multiAccountCheck.confidence >= 70) totalScore += 25;
            else if (multiAccountCheck.confidence >= 50) totalScore += 15;

            const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
            
            // Vérifier l'âge du compte
            if (config.accessControl.accountAgeGate?.enabled && 
                accountAge < config.accessControl.accountAgeGate.minimumAgeDays) {
                return this.handleAccessDenied(member, 'AGE_TOO_LOW', {
                    action: config.accessControl.accountAgeGate.action,
                    reason: `Compte trop récent (${accountAge}j < ${config.accessControl.accountAgeGate.minimumAgeDays}j)`,
                    score: totalScore
                });
            }

            // Vérifier le score de risque
            if (config.accessControl.riskGate?.enabled && 
                totalScore > config.accessControl.riskGate.maxAllowedScore) {
                return this.handleAccessDenied(member, 'RISK_TOO_HIGH', {
                    action: config.accessControl.riskGate.action,
                    reason: `Score de risque élevé (${totalScore}/${config.accessControl.riskGate.maxAllowedScore})`,
                    score: totalScore,
                    multiAccounts: multiAccountCheck.totalSuspects,
                    raidSuspect: raidCheck.isRaidSuspect
                });
            }

            // Accès accordé automatiquement
            await this.grantAccess(member, 'Vérifications passées');

        } catch (error) {
            console.error('Erreur traitement accès:', error);
        }
    }

    async handleAccessDenied(member, reason, details) {
        const action = details.action;

        switch (action) {
            case 'QUARANTINE':
                return this.quarantineMember(member, reason, details);
            case 'ADMIN_APPROVAL':
                return this.requestAdminApproval(member, reason, details);
            case 'KICK':
                return this.autoKickMember(member, reason, details);
            case 'BAN':
                return this.autoBanMember(member, reason, details);
            default:
                return this.sendSecurityAlert(member, reason, details);
        }
    }

    async requestAdminApproval(member, reason, details) {
        const alertChannel = await this.findSecurityLogChannel(member.guild);
        if (!alertChannel) return;

        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setTitle('👨‍💼 APPROBATION ADMIN REQUISE')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setColor(0xff922b)
            .setTimestamp();

        embed.addFields({
            name: '👤 Nouveau membre',
            value: `${member.user.tag}\n<@${member.user.id}>`,
            inline: true
        });

        embed.addFields({
            name: '⚠️ Problème',
            value: `**Raison :** ${details.reason}\n**Score :** ${details.score}/100`,
            inline: true
        });

        if (details.multiAccounts > 0) {
            embed.addFields({
                name: '🔍 Multi-comptes',
                value: `${details.multiAccounts} suspect(s)`,
                inline: true
            });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`security_approve_${member.user.id}`)
                    .setLabel('✅ Approuver')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`security_deny_${member.user.id}`)
                    .setLabel('❌ Refuser')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`security_quarantine_${member.user.id}`)
                    .setLabel('🔒 Quarantaine')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`security_details_${member.user.id}`)
                    .setLabel('🔍 Détails')
                    .setStyle(ButtonStyle.Primary)
            );

        const config = await this.moderationManager.getSecurityConfig(member.guild.id);
        let content = '';
        if (config.autoAlerts?.mentionModerators && config.autoAlerts?.moderatorRoleId) {
            content = `<@&${config.autoAlerts.moderatorRoleId}> **Approbation requise**`;
        }

        await alertChannel.send({ content, embeds: [embed], components: [row] });
        console.log(`👨‍💼 Approbation demandée: ${member.user.tag}`);
    }

    async quarantineMember(member, reason, details) {
        const config = await this.moderationManager.getSecurityConfig(member.guild.id);
        
        try {
            // 1. Créer ou obtenir le rôle de quarantaine
            const quarantineRole = await this.ensureQuarantineRole(member.guild, config);
            
            // 2. Créer les canaux de quarantaine personnalisés
            const { textChannel, voiceChannel } = await this.createQuarantineChannels(member, quarantineRole);
            
            // 3. Configurer les permissions pour isoler le membre
            await this.setupQuarantinePermissions(member, quarantineRole, textChannel, voiceChannel);
            
            // 4. Ajouter le rôle de quarantaine au membre
            await member.roles.add(quarantineRole, `Quarantaine auto: ${details.reason}`);
            
            // 5. Enregistrer les informations de quarantaine
            await this.recordQuarantineInfo(member, {
                reason: details.reason,
                score: details.score,
                textChannelId: textChannel.id,
                voiceChannelId: voiceChannel.id,
                timestamp: Date.now()
            });

            // 6. Notifier le membre avec les informations des canaux
            try {
                await member.send(
                    `🔒 **Quarantaine de sécurité - ${member.guild.name}**\n\n` +
                    `Votre accès est temporairement limité à des canaux spécifiques.\n` +
                    `**Raison :** ${details.reason}\n` +
                    `**Score :** ${details.score}/100\n\n` +
                    `**Vos canaux de quarantaine :**\n` +
                    `💬 Texte : <#${textChannel.id}>\n` +
                    `🔊 Vocal : <#${voiceChannel.id}>\n\n` +
                    `Un admin va examiner votre cas. Vous pouvez expliquer votre situation dans le canal texte.`
                );
            } catch {}

            // 7. Envoyer un message de bienvenue dans le canal de quarantaine
            await this.sendQuarantineWelcome(textChannel, member, details);

            // 8. Notifier les admins
            await this.notifyAdminsQuarantine(member, reason, {
                ...details,
                textChannel: textChannel.id,
                voiceChannel: voiceChannel.id
            });

            console.log(`🔒 Quarantaine complète: ${member.user.tag} - Canaux créés: #${textChannel.name}, #${voiceChannel.name}`);
            
        } catch (error) {
            console.error('Erreur lors de la quarantaine:', error);
            // Fallback vers l'ancienne méthode si la nouvelle échoue
            await this.fallbackQuarantine(member, reason, details, config);
        }
    }

    async ensureQuarantineRole(guild, config) {
        // Vérifier si le rôle configuré existe
        if (config.accessControl?.quarantineRoleId) {
            const existingRole = guild.roles.cache.get(config.accessControl.quarantineRoleId);
            if (existingRole) return existingRole;
        }

        // Créer un nouveau rôle de quarantaine
        const role = await guild.roles.create({
            name: 'Quarantaine',
            color: 0xff6b6b,
            reason: 'Rôle de quarantaine automatique',
            permissions: []
        });

        // Mettre à jour la configuration
        await this.moderationManager.updateSecurityConfig(guild.id, {
            accessControl: {
                quarantineRoleId: role.id,
                quarantineRoleName: role.name
            }
        });

        console.log(`🔒 Rôle de quarantaine créé: @${role.name}`);
        return role;
    }

    async createQuarantineChannels(member, quarantineRole) {
        const guild = member.guild;
        const timestamp = Date.now();
        const userName = member.user.username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
        
        // Créer ou obtenir la catégorie de quarantaine
        let category = guild.channels.cache.find(ch => 
            ch.type === 4 && ch.name.toLowerCase().includes('quarantaine')
        );
        
        if (!category) {
            category = await guild.channels.create({
                name: '🔒 QUARANTAINE',
                type: 4, // CategoryChannel
                reason: 'Catégorie de quarantaine automatique'
            });
        }

        // Créer le canal texte
        const textChannel = await guild.channels.create({
            name: `quarantaine-${userName}-${timestamp.toString().slice(-6)}`,
            type: 0, // TextChannel
            parent: category.id,
            reason: `Quarantaine de ${member.user.tag}`,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone
                    deny: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                },
                {
                    id: quarantineRole.id,
                    deny: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                },
                {
                    id: member.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'UseExternalEmojis', 'AddReactions']
                }
            ]
        });

        // Créer le canal vocal
        const voiceChannel = await guild.channels.create({
            name: `🔊 Quarantaine ${member.user.username}`,
            type: 2, // VoiceChannel
            parent: category.id,
            reason: `Quarantaine vocale de ${member.user.tag}`,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone
                    deny: ['ViewChannel', 'Connect']
                },
                {
                    id: quarantineRole.id,
                    deny: ['ViewChannel', 'Connect']
                },
                {
                    id: member.id,
                    allow: ['ViewChannel', 'Connect', 'Speak']
                }
            ]
        });

        console.log(`📁 Canaux de quarantaine créés: #${textChannel.name}, #${voiceChannel.name}`);
        return { textChannel, voiceChannel };
    }

    async setupQuarantinePermissions(member, quarantineRole, textChannel, voiceChannel) {
        const guild = member.guild;

        try {
            // Supprimer l'accès à TOUS les autres canaux du serveur
            const allChannels = guild.channels.cache.filter(ch => 
                ch.id !== textChannel.id && ch.id !== voiceChannel.id && ch.parentId !== textChannel.parentId
            );

            // Traitement par lots pour éviter les rate limits
            const channelBatches = this.chunkArray([...allChannels.values()], 5);
            
            for (const batch of channelBatches) {
                await Promise.all(batch.map(async (channel) => {
                    try {
                        await channel.permissionOverwrites.create(member.id, {
                            ViewChannel: false,
                            Connect: false,
                            SendMessages: false,
                            Speak: false
                        }, { reason: `Quarantaine de ${member.user.tag}` });
                    } catch (error) {
                        // Ignorer les erreurs pour les canaux où on n'a pas les permissions
                        console.warn(`⚠️ Impossible de modifier les permissions pour ${channel.name}: ${error.message}`);
                    }
                }));
                
                // Petit délai entre les lots
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Ajouter les permissions d'accès aux modérateurs dans les canaux de quarantaine
            const moderatorRoles = guild.roles.cache.filter(role => 
                role.permissions.has('ModerateMembers') || 
                role.permissions.has('Administrator')
            );

            for (const role of moderatorRoles.values()) {
                await textChannel.permissionOverwrites.create(role.id, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    ManageMessages: true
                });
                
                await voiceChannel.permissionOverwrites.create(role.id, {
                    ViewChannel: true,
                    Connect: true,
                    MoveMembers: true,
                    MuteMembers: true,
                    DeafenMembers: true
                });
            }

            console.log(`🔐 Permissions de quarantaine configurées pour ${member.user.tag}`);
            
        } catch (error) {
            console.error('Erreur configuration permissions quarantaine:', error);
        }
    }

    async recordQuarantineInfo(member, info) {
        try {
            const quarantineData = await this.dataManager.getData('quarantine_records');
            if (!quarantineData[member.guild.id]) quarantineData[member.guild.id] = {};
            
            quarantineData[member.guild.id][member.id] = {
                ...info,
                guildId: member.guild.id,
                userId: member.id,
                status: 'active'
            };
            
            await this.dataManager.saveData('quarantine_records', quarantineData);
            console.log(`📝 Quarantaine enregistrée: ${member.user.tag}`);
        } catch (error) {
            console.error('Erreur enregistrement quarantaine:', error);
        }
    }

    async sendQuarantineWelcome(textChannel, member, details) {
        const { EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setTitle('🔒 Bienvenue en Quarantaine')
            .setDescription(
                `Bonjour ${member.user.tag},\n\n` +
                `Vous avez été placé en quarantaine de sécurité pour les raisons suivantes :\n\n` +
                `**Raison :** ${details.reason}\n` +
                `**Score de risque :** ${details.score}/100\n\n` +
                `**Que se passe-t-il maintenant ?**\n` +
                `• Vous n'avez accès qu'à ces canaux de quarantaine\n` +
                `• Un administrateur va examiner votre cas\n` +
                `• Vous pouvez expliquer votre situation dans ce canal\n` +
                `• Soyez respectueux et patient\n\n` +
                `**Conseils :**\n` +
                `• Présentez-vous brièvement\n` +
                `• Expliquez pourquoi vous rejoignez le serveur\n` +
                `• Répondez aux questions des modérateurs\n` +
                `• Restez poli et coopératif`
            )
            .setColor(0xff922b)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        await textChannel.send({ 
            content: `👋 ${member.toString()}`,
            embeds: [embed] 
        });
    }

    async fallbackQuarantine(member, reason, details, config) {
        // Méthode de fallback en cas d'échec du système avancé
        try {
            if (config.accessControl?.quarantineRoleId) {
                const role = member.guild.roles.cache.get(config.accessControl.quarantineRoleId);
                if (role) {
                    await member.roles.add(role, `Quarantaine fallback: ${details.reason}`);
                }
            }
            
            await this.notifyAdminsQuarantine(member, reason, details);
            console.log(`🔒 Quarantaine fallback appliquée: ${member.user.tag}`);
        } catch (error) {
            console.error('Erreur quarantaine fallback:', error);
        }
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    async grantAccess(member, reason) {
        const config = await this.moderationManager.getSecurityConfig(member.guild.id);
        
        try {
            // 1. Récupérer les informations de quarantaine
            const quarantineInfo = await this.getQuarantineInfo(member);
            
            // 2. Supprimer le rôle de quarantaine
            const quarantineRole = member.guild.roles.cache.get(config.accessControl?.quarantineRoleId);
            if (quarantineRole && member.roles.cache.has(quarantineRole.id)) {
                await member.roles.remove(quarantineRole, `Libération: ${reason}`);
            }
            
            // 3. Restaurer l'accès à tous les canaux
            await this.restoreChannelAccess(member);
            
            // 4. Nettoyer les canaux de quarantaine
            if (quarantineInfo) {
                await this.cleanupQuarantineChannels(member, quarantineInfo);
            }
            
            // 5. Ajouter rôle vérifié
            if (config.accessControl?.verifiedRoleId) {
                const role = member.guild.roles.cache.get(config.accessControl.verifiedRoleId);
                if (role) {
                    await member.roles.add(role, `Accès accordé: ${reason}`);
                }
            }
            
            // 6. Marquer la quarantaine comme résolue
            if (quarantineInfo) {
                await this.markQuarantineResolved(member, reason);
            }
            
            // 7. Notifier le membre
            try {
                await member.send(
                    `✅ **Accès accordé - ${member.guild.name}**\n\n` +
                    `Votre quarantaine a été levée !\n` +
                    `**Raison :** ${reason}\n\n` +
                    `Vous avez maintenant accès à tous les canaux du serveur.\n` +
                    `Merci de respecter les règles et de profiter de votre séjour ! 🎉`
                );
            } catch {}

            console.log(`✅ Accès accordé et quarantaine nettoyée: ${member.user.tag} - ${reason}`);
            
        } catch (error) {
            console.error('Erreur lors de l\'octroi d\'accès:', error);
            // Fallback simple
            if (config.accessControl?.verifiedRoleId) {
                const role = member.guild.roles.cache.get(config.accessControl.verifiedRoleId);
                if (role) {
                    await member.roles.add(role, `Accès accordé (fallback): ${reason}`);
                }
            }
            console.log(`✅ Accès accordé (fallback): ${member.user.tag} - ${reason}`);
        }
    }

    async getQuarantineInfo(member) {
        try {
            const quarantineData = await this.dataManager.getData('quarantine_records');
            return quarantineData[member.guild.id]?.[member.id] || null;
        } catch (error) {
            console.error('Erreur récupération info quarantaine:', error);
            return null;
        }
    }

    async restoreChannelAccess(member) {
        try {
            const guild = member.guild;
            const allChannels = guild.channels.cache.values();
            
            // Traitement par lots pour éviter les rate limits
            const channelBatches = this.chunkArray([...allChannels], 10);
            
            for (const batch of channelBatches) {
                await Promise.all(batch.map(async (channel) => {
                    try {
                        // Supprimer les overrides spécifiques au membre
                        const memberOverride = channel.permissionOverwrites.cache.get(member.id);
                        if (memberOverride) {
                            await memberOverride.delete(`Libération de quarantaine: ${member.user.tag}`);
                        }
                    } catch (error) {
                        // Ignorer les erreurs pour les canaux où on n'a pas les permissions
                        console.warn(`⚠️ Impossible de restaurer l'accès pour ${channel.name}: ${error.message}`);
                    }
                }));
                
                // Petit délai entre les lots
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            console.log(`🔓 Accès aux canaux restauré pour ${member.user.tag}`);
        } catch (error) {
            console.error('Erreur restauration accès canaux:', error);
        }
    }

    async cleanupQuarantineChannels(member, quarantineInfo) {
        try {
            const guild = member.guild;
            
            // Supprimer le canal texte
            if (quarantineInfo.textChannelId) {
                const textChannel = guild.channels.cache.get(quarantineInfo.textChannelId);
                if (textChannel) {
                    await textChannel.delete(`Quarantaine terminée: ${member.user.tag}`);
                    console.log(`🗑️ Canal texte supprimé: #${textChannel.name}`);
                }
            }
            
            // Supprimer le canal vocal
            if (quarantineInfo.voiceChannelId) {
                const voiceChannel = guild.channels.cache.get(quarantineInfo.voiceChannelId);
                if (voiceChannel) {
                    await voiceChannel.delete(`Quarantaine terminée: ${member.user.tag}`);
                    console.log(`🗑️ Canal vocal supprimé: #${voiceChannel.name}`);
                }
            }
            
            // Vérifier si la catégorie de quarantaine est vide et la supprimer si nécessaire
            const category = guild.channels.cache.find(ch => 
                ch.type === 4 && ch.name.toLowerCase().includes('quarantaine')
            );
            
            if (category) {
                const childChannels = category.children.cache.size;
                if (childChannels === 0) {
                    await category.delete('Catégorie de quarantaine vide');
                    console.log(`🗑️ Catégorie de quarantaine supprimée`);
                }
            }
            
        } catch (error) {
            console.error('Erreur nettoyage canaux quarantaine:', error);
        }
    }

    async markQuarantineResolved(member, reason) {
        try {
            const quarantineData = await this.dataManager.getData('quarantine_records');
            if (quarantineData[member.guild.id]?.[member.id]) {
                quarantineData[member.guild.id][member.id] = {
                    ...quarantineData[member.guild.id][member.id],
                    status: 'resolved',
                    resolvedAt: Date.now(),
                    resolvedReason: reason
                };
                await this.dataManager.saveData('quarantine_records', quarantineData);
            }
        } catch (error) {
            console.error('Erreur marquage quarantaine résolue:', error);
        }
    }

    async sendSecurityAlert(member, securityAnalysis, details) {
        try {
            const alertChannel = await this.findSecurityLogChannel(member.guild);
            if (!alertChannel) {
                console.log(`❌ Aucun canal d'alertes configuré pour ${member.guild.name}`);
                return;
            }

            const { EmbedBuilder } = require('discord.js');
            
            // Déterminer la couleur selon le niveau de risque
            let color = 0x51cf66; // Vert (LOW)
            if (details.totalScore >= 80) color = 0xff6b6b; // Rouge (CRITICAL)
            else if (details.totalScore >= 60) color = 0xff922b; // Orange (HIGH)
            else if (details.totalScore >= 30) color = 0xffd43b; // Jaune (MEDIUM)

            const embed = new EmbedBuilder()
                .setTitle('🚨 ALERTE SÉCURITÉ - Nouveau membre')
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setColor(color)
                .setTimestamp();

            // Informations de base
            const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
            embed.addFields({
                name: '👤 Membre',
                value: `**Nom :** ${member.user.tag}\n**Mention :** <@${member.user.id}>\n**Âge du compte :** ${accountAge} jour(s)`,
                inline: true
            });

            embed.addFields({
                name: '📊 Score de risque',
                value: `**Score total :** ${details.totalScore}/100\n**Niveau :** ${this.getRiskLevelText(details.totalScore)}`,
                inline: true
            });

            // Multi-comptes
            if (details.multiAccountCheck && details.multiAccountCheck.totalSuspects > 0) {
                embed.addFields({
                    name: '🔍 Multi-comptes détectés',
                    value: `**Suspects :** ${details.multiAccountCheck.totalSuspects}\n**Confiance :** ${details.multiAccountCheck.confidence}%`,
                    inline: true
                });
            }

            // Indicateurs de raid
            if (details.raidCheck && details.raidCheck.isRaidSuspect) {
                embed.addFields({
                    name: '🚨 Suspect de raid',
                    value: details.raidCheck.reasons.slice(0, 3).join('\n'),
                    inline: false
                });
            }

            // Drapeaux de sécurité
            if (securityAnalysis.flags && securityAnalysis.flags.length > 0) {
                embed.addFields({
                    name: '🚩 Alertes',
                    value: securityAnalysis.flags.slice(0, 5).join('\n'),
                    inline: false
                });
            }

            // Recommandations
            if (securityAnalysis.recommendations && securityAnalysis.recommendations.length > 0) {
                embed.addFields({
                    name: '💡 Recommandations',
                    value: securityAnalysis.recommendations.slice(0, 3).join('\n'),
                    inline: false
                });
            }

            // Mentionner les modérateurs si configuré
            const config = await this.moderationManager.getSecurityConfig(member.guild.id);
            let content = '';
            if (config.autoAlerts?.mentionModerators && config.autoAlerts?.moderatorRoleId) {
                content = `<@&${config.autoAlerts.moderatorRoleId}> **Alerte sécurité**`;
            }

            await alertChannel.send({ content, embeds: [embed] });
            console.log(`🚨 Alerte sécurité envoyée: ${member.user.tag} (score: ${details.totalScore})`);

        } catch (error) {
            console.error('Erreur envoi alerte sécurité:', error);
        }
    }

    async notifyAdminsQuarantine(member, reason, details) {
        try {
            const alertChannel = await this.findSecurityLogChannel(member.guild);
            if (!alertChannel) return;

            const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            
            const embed = new EmbedBuilder()
                .setTitle('🔒 QUARANTAINE AUTOMATIQUE')
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setColor(0xff922b)
                .setTimestamp();

            embed.addFields({
                name: '👤 Membre en quarantaine',
                value: `${member.user.tag}\n<@${member.user.id}>`,
                inline: true
            });

            embed.addFields({
                name: '⚠️ Raison',
                value: `**Motif :** ${details.reason}\n**Score :** ${details.score}/100`,
                inline: true
            });

            // Ajouter les informations sur les canaux créés
            if (details.textChannel && details.voiceChannel) {
                embed.addFields({
                    name: '📁 Canaux créés',
                    value: `💬 Texte : <#${details.textChannel}>\n🔊 Vocal : <#${details.voiceChannel}>`,
                    inline: true
                });
            }

            embed.addFields({
                name: '🔧 Actions disponibles',
                value: 'Utilisez les boutons ci-dessous ou les commandes :\n' +
                       '• ✅ **Approuver** : Libère le membre et nettoie les canaux\n' +
                       '• ❌ **Refuser** : Bannit le membre et nettoie les canaux\n' +
                       '• 🔍 **Examiner** : Aller dans le canal de quarantaine\n' +
                       '• ⏳ **Reporter** : Laisser en quarantaine pour plus tard',
                inline: false
            });

            // Boutons d'action rapide
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`quarantine_approve_${member.id}`)
                        .setLabel('Approuver')
                        .setEmoji('✅')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`quarantine_reject_${member.id}`)
                        .setLabel('Refuser & Ban')
                        .setEmoji('❌')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`quarantine_examine_${member.id}`)
                        .setLabel('Examiner')
                        .setEmoji('🔍')
                        .setStyle(ButtonStyle.Secondary)
                );

            // Mentionner les modérateurs
            const config = await this.moderationManager.getSecurityConfig(member.guild.id);
            let content = '';
            if (config.autoAlerts?.mentionModerators && config.autoAlerts?.moderatorRoleId) {
                content = `<@&${config.autoAlerts.moderatorRoleId}> **Quarantaine automatique**`;
            }

            await alertChannel.send({ content, embeds: [embed], components: [row] });
            console.log(`🔒 Notification quarantaine envoyée: ${member.user.tag}`);

        } catch (error) {
            console.error('Erreur notification quarantaine:', error);
        }
    }

    getRiskLevelText(score) {
        if (score >= 80) return '🔴 CRITIQUE';
        if (score >= 60) return '🚨 ÉLEVÉ';
        if (score >= 30) return '⚠️ MOYEN';
        return '✅ FAIBLE';
    }

    /**
     * Trouver le canal de logs de sécurité
     * @param {Guild} guild - Le serveur Discord
     * @returns {TextChannel|null} Canal trouvé ou null
     */
    async findSecurityLogChannel(guild) {
        try {
            // Chercher d'abord le canal configuré dans la config de sécurité
            const securityConfig = await this.moderationManager.getSecurityConfig(guild.id);
            if (securityConfig.autoAlerts?.alertChannelId) {
                const alertChannel = guild.channels.cache.get(securityConfig.autoAlerts.alertChannelId);
                if (alertChannel) {
                    console.log(`✅ Canal d'alertes sécurité trouvé: #${alertChannel.name}`);
                    return alertChannel;
                }
            }

            // Fallback sur la config de modération générale
            const moderationConfig = await this.moderationManager.getGuildConfig(guild.id);
            if (moderationConfig.logsChannelId) {
                const logChannel = guild.channels.cache.get(moderationConfig.logsChannelId);
                if (logChannel) {
                    console.log(`⚠️ Utilisation du canal de logs général: #${logChannel.name}`);
                    return logChannel;
                }
            }

            // Chercher des canaux avec des noms typiques
            const logChannelNames = [
                'sécurité', 'security', 'alertes', 'alerts', 
                'modération', 'moderation', 'logs', 'audit'
            ];

            for (const channelName of logChannelNames) {
                const channel = guild.channels.cache.find(ch => 
                    ch.name.toLowerCase().includes(channelName) && ch.isTextBased()
                );
                if (channel) {
                    console.log(`🔍 Canal trouvé par nom: #${channel.name}`);
                    return channel;
                }
            }

            // En dernier recours, chercher le canal système
            console.log(`⚠️ Aucun canal spécialisé trouvé, utilisation du canal système`);
            return guild.systemChannel;
        } catch (error) {
            console.error('Erreur recherche canal logs:', error);
            return null;
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