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
      // Minimal File polyfill compatible with Node 18
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

// Charger les variables d'environnement depuis un fichier .env (si présent)
try {
  require('dotenv').config();
} catch {}

ensureFileAndBlobPolyfills();

const { Client, Collection, GatewayIntentBits, Routes, REST, EmbedBuilder, Partials, AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const multer = require('multer');
const deploymentManager = require('./utils/deploymentManager');
const mongoBackup = require('./utils/mongoBackupManager');
const levelManager = require('./utils/levelManager');
const { handleObjectInteraction } = require('./handlers/ObjectHandler');
const { errorHandler, ErrorLevels } = require('./utils/errorHandler');
const { modalHandler } = require('./utils/modalHandler');
const { wrapInteraction } = require('./utils/interactionWrapper');
const DataManager = require('./managers/DataManager');
const ReminderManager = require('./managers/ReminderManager');
const ReminderInteractionHandler = require('./handlers/ReminderInteractionHandler');
const ModerationManager = require('./managers/ModerationManager');
const dataHooks = require('./utils/dataHooks');


// Handlers pour les nouvelles fonctionnalités karma
async function handleKarmaResetComplete(interaction) {
    try {
        const guildId = interaction.guild.id;
        const dataManager = require('./utils/simpleDataManager');
        
        // Reset karma complet (bon et mauvais)
        const economyData = dataManager.loadData('economy.json', {});
        let resetCount = 0;
        
        Object.keys(economyData).forEach(key => {
            if (key.includes('_') && key.includes(guildId)) {
                if (economyData[key].goodKarma !== undefined || economyData[key].badKarma !== undefined) {
                    economyData[key].goodKarma = 0;
                    economyData[key].badKarma = 0;
                    resetCount++;
                }
            }
        });
        
        dataManager.saveData('economy.json', economyData);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.update({
                content: `✅ **Reset réputation complet terminé !**\n\n🧹 ${resetCount} membre(s) affecté(s)\n⚖️ Charme et perversion remis à zéro`,
                embeds: [],
                components: []
            });
        }
    } catch (error) {
        console.error('Erreur reset karma complet:', error);
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.update({
                    content: '❌ Erreur lors du reset karma complet.',
                    embeds: [],
                    components: []
                });
            }
        } catch (updateError) {
            console.error('Erreur lors de la mise à jour de l\'interaction:', updateError);
        }
    }
}

async function handleKarmaResetGood(interaction) {
    try {
        const guildId = interaction.guild.id;
        const dataManager = require('./utils/simpleDataManager');
        
        // Reset karma positif uniquement
        const economyData = dataManager.loadData('economy.json', {});
        let resetCount = 0;
        
        Object.keys(economyData).forEach(key => {
            if (key.includes('_') && key.includes(guildId)) {
                if (economyData[key].goodKarma !== undefined && economyData[key].goodKarma > 0) {
                    economyData[key].goodKarma = 0;
                    resetCount++;
                }
            }
        });
        
        dataManager.saveData('economy.json', economyData);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.update({
                content: `✅ **Reset karma positif terminé !**\n\n😇 ${resetCount} membre(s) affecté(s)\n⚖️ Karma positif remis à zéro\n🔒 Karma négatif préservé`,
                embeds: [],
                components: []
            });
        }
    } catch (error) {
        console.error('Erreur reset karma bon:', error);
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.update({
                    content: '❌ Erreur lors du reset du charme.',
                    embeds: [],
                    components: []
                });
            }
        } catch (updateError) {
            console.error('Erreur lors de la mise à jour de l\'interaction:', updateError);
        }
    }
}

async function handleKarmaResetBad(interaction) {
    try {
        const guildId = interaction.guild.id;
        const dataManager = require('./utils/simpleDataManager');
        
        // Reset karma négatif uniquement
        const economyData = dataManager.loadData('economy.json', {});
        let resetCount = 0;
        
        Object.keys(economyData).forEach(key => {
            if (key.includes('_') && key.includes(guildId)) {
                if (economyData[key].badKarma !== undefined && economyData[key].badKarma < 0) {
                    economyData[key].badKarma = 0;
                    resetCount++;
                }
            }
        });
        
        dataManager.saveData('economy.json', economyData);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.update({
                content: `✅ **Reset karma négatif terminé !**\n\n😈 ${resetCount} membre(s) affecté(s)\n⚖️ Karma négatif remis à zéro\n🔒 Karma positif préservé`,
                embeds: [],
                components: []
            });
        }
    } catch (error) {
        console.error('Erreur reset karma mauvais:', error);
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.update({
                    content: '❌ Erreur lors du reset de la perversion.',
                    embeds: [],
                    components: []
                });
            }
        } catch (updateError) {
            console.error('Erreur lors de la mise à jour de l\'interaction:', updateError);
        }
    }
}

async function handleKarmaWeeklyDaySelection(interaction, dayValue) {
    try {
        const dataManager = require('./utils/simpleDataManager');
        const guildId = interaction.guild.id;
        
        const dayNames = {
            '0': 'Dimanche',
            '1': 'Lundi', 
            '2': 'Mardi',
            '3': 'Mercredi',
            '4': 'Jeudi',
            '5': 'Vendredi',
            '6': 'Samedi',
            'disable': 'Désactivé'
        };
        
        if (dayValue === 'disable') {
            // Désactiver le reset automatique
            const karmaConfig = dataManager.loadData('karma_config.json', {});
            karmaConfig.weeklyReset = { enabled: false };
            dataManager.saveData('karma_config.json', karmaConfig);
            
            await interaction.update({
                content: `✅ **Reset hebdomadaire désactivé**\n\n❌ Aucun reset automatique\n⚙️ Le karma ne sera plus remis à zéro automatiquement`,
                embeds: [],
                components: []
            });
        } else {
            // Configurer jour de reset
            const dayNum = parseInt(dayValue);
            const karmaConfig = dataManager.loadData('karma_config.json', {});
            karmaConfig.weeklyReset = {
                enabled: true,
                dayOfWeek: dayNum,
                lastReset: null
            };
            dataManager.saveData('karma_config.json', karmaConfig);
            
            await interaction.update({
                content: `✅ **Jour de reset configuré !**\n\n📅 Jour: **${dayNames[dayValue]}**\n⏰ Heure: **00:00 (minuit)**\n🎁 Les récompenses seront distribuées avant le reset\n🔄 Reset automatique du karma chaque semaine`,
                embeds: [],
                components: []
            });
        }
    } catch (error) {
        console.error('Erreur sélection jour reset:', error);
        await interaction.update({
            content: '❌ Erreur lors de la configuration du jour de reset.',
            embeds: [],
            components: []
        });
    }
}

class RenderSolutionBot {
    constructor() {
        this.initializeWebServer();
    }

    async initializeWebServer() {
        // 1. Serveur web d'abord (port 5000 pour Render.com)
        const app = express();
        const PORT = process.env.PORT || 3000;

        app.use(express.json());

        // Upload d'images pour les styles de cartes
        const upload = multer({
            storage: multer.memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 },
            fileFilter: (req, file, cb) => {
                const ok = /^(image\/png|image\/jpe?g|image\/webp)$/i.test(file.mimetype);
                cb(ok ? null : new Error('TYPE_INVALIDE'), ok);
            }
        });

        app.post('/api/upload/style-background', upload.single('image'), async (req, res) => {
            try {
                const fsSync = require('fs');
                const style = String(req.body.style || '').trim();
                if (!style) return res.status(400).json({ success: false, error: 'STYLE_REQUIS' });
                if (!req.file) return res.status(400).json({ success: false, error: 'IMAGE_REQUISE' });

                const ext = req.file.mimetype.includes('png') ? 'png' : (req.file.mimetype.includes('webp') ? 'webp' : 'jpg');
                const dir = path.join(__dirname, 'assets', 'styles', style);
                fsSync.mkdirSync(dir, { recursive: true });
                const filePath = path.join(dir, `default.${ext}`);

                fsSync.writeFileSync(filePath + '.tmp', req.file.buffer);
                if (fsSync.existsSync(filePath)) fsSync.rmSync(filePath);
                fsSync.renameSync(filePath + '.tmp', filePath);

                // MAJ data/level_config.json -> styleBackgrounds[style].default = relPath
                const cfgPath = path.join(__dirname, 'data', 'level_config.json');
                let cfg = {};
                try { cfg = JSON.parse(fsSync.readFileSync(cfgPath, 'utf8')); } catch (_) { cfg = {}; }
                cfg.styleBackgrounds = cfg.styleBackgrounds || {};
                cfg.styleBackgrounds[style] = cfg.styleBackgrounds[style] || {};
                const relPath = path.join('assets', 'styles', style, `default.${ext}`);
                cfg.styleBackgrounds[style].default = relPath;
                fsSync.mkdirSync(path.dirname(cfgPath), { recursive: true });
                fsSync.writeFileSync(cfgPath + '.tmp', JSON.stringify(cfg, null, 2));
                if (fsSync.existsSync(cfgPath)) fsSync.rmSync(cfgPath);
                fsSync.renameSync(cfgPath + '.tmp', cfgPath);

                res.json({ success: true, path: relPath });
            } catch (error) {
                console.error('POST /api/upload/style-background error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.get('/', (req, res) => {
            res.json({
                status: 'running',
                version: '3.0',
                deployment: 'render.com',
                message: 'BAG v2 Discord Bot - Serveur Web Actif'
            });
        });

        app.get('/health', (req, res) => {
            const discordStatus = this.client && this.client.isReady() ? 'connected' : 'disconnected';
            const guildsCount = this.client && this.client.guilds && this.client.guilds.cache ? this.client.guilds.cache.size : 0;
            const commandsCount = this.client && this.client.commands ? this.client.commands.size : 0;
            res.json({
                status: 'healthy',
                discord: discordStatus,
                uptime: process.uptime(),
                guilds: guildsCount,
                commands: commandsCount,
                timestamp: new Date().toISOString()
            });
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

        // Localisation des membres
        const memberLocationManager = require('./utils/memberLocationManager');

        // POST /ajouter-carte
        // body: { userId, guildId, lat, lng, address?, city?, preference? }
        app.post('/ajouter-carte', async (req, res) => {
            try {
                const { userId, guildId, lat, latitude, lng, longitude, address, city, preference } = req.body || {};
                const latValue = latitude ?? lat;
                const lngValue = longitude ?? lng;
                if (!userId || !guildId) return res.status(400).json({ success: false, error: 'USER_AND_GUILD_REQUIRED' });
                const record = memberLocationManager.setLocation(String(userId), String(guildId), Number(latValue), Number(lngValue), address, city, preference);
                res.json({ success: true, location: record });
            } catch (error) {
                const code = error && error.message;
                if (code === 'INVALID_LATITUDE' || code === 'INVALID_LONGITUDE') {
                    return res.status(400).json({ success: false, error: code });
                }
                console.error('POST /ajouter-carte error:', error);
                res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
            }
        });

        // GET /membre-proche
        // query: guildId, lat/lng or userId; radiusKm?, limit?
        app.get('/membre-proche', async (req, res) => {
            try {
                const guildId = String(req.query.guildId || '').trim();
                if (!guildId) return res.status(400).json({ success: false, error: 'GUILD_REQUIRED' });

                const userId = req.query.userId ? String(req.query.userId) : null;
                const radiusKm = req.query.radiusKm ? Number(req.query.radiusKm) : 50;
                const limit = req.query.limit ? Number(req.query.limit) : 50;

                let lat = req.query.lat ?? req.query.latitude;
                let lng = req.query.lng ?? req.query.longitude;

                if ((lat == null || lng == null) && userId) {
                    const selfLoc = memberLocationManager.getLocation(userId, guildId);
                    if (selfLoc) {
                        lat = selfLoc.lat;
                        lng = selfLoc.lng;
                    }
                }

                if (lat == null || lng == null) {
                    return res.status(400).json({ success: false, error: 'COORDINATES_REQUIRED' });
                }

                const results = memberLocationManager.findNearby(guildId, Number(lat), Number(lng), Number.isFinite(radiusKm) ? radiusKm : 50, Number.isFinite(limit) ? limit : 50);
                res.json({ success: true, count: results.length, members: results });
            } catch (error) {
                const code = error && error.message;
                if (code === 'INVALID_LATITUDE' || code === 'INVALID_LONGITUDE') {
                    return res.status(400).json({ success: false, error: code });
                }
                console.error('GET /membre-proche error:', error);
                res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
            }
        });

        // Dashboard routes (placeholder)
        app.get('/dashboard', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
        });

        app.get('/dashboard/:guildId', (req, res) => {
            res.redirect('/dashboard');
        });

        // Static files for dashboard
        app.use(express.static(path.join(__dirname, 'public')));

        // === Dashboard API désactivée temporairement ===
        app.get('/api/dashboard/overview', (req, res) => {
            res.status(503).json({ error: 'dashboard_disabled' });
        });

        app.get('/api/dashboard/servers', (req, res) => {
            res.status(503).json({ error: 'dashboard_disabled' });
        });

        // Config générique (GET/POST)
        app.get('/api/config/:name', (req, res) => {
            try {
                const fs = require('fs');
                const cfgName = req.params.name;
                const cfgPath = path.join(__dirname, 'data', 'configs', `${cfgName}.json`);
                if (!fs.existsSync(cfgPath)) return res.json({ success: true, data: {} });
                const raw = fs.readFileSync(cfgPath, 'utf8');
                const data = JSON.parse(raw);
                res.json({ success: true, data });
            } catch (error) {
                console.error('GET /api/config error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.post('/api/config/:name', (req, res) => {
            try {
                const fs = require('fs');
                const cfgName = req.params.name;
                const dir = path.join(__dirname, 'data', 'configs');
                const file = path.join(dir, `${cfgName}.json`);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(file + '.tmp', JSON.stringify(req.body || {}, null, 2));
                fs.renameSync(file + '.tmp', file);
                res.json({ success: true });
            } catch (error) {
                console.error('POST /api/config error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Actions admin depuis le dashboard
        app.post('/api/admin/clear-test-objects', (req, res) => {
            try {
                console.log('🧹 clear-test-objects (dashboard)');
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.post('/api/admin/reset-commands', async (req, res) => {
            try {
                console.log('🔁 reset-commands (dashboard)');
                // Nettoyer et re-déployer via les méthodes natives du bot
                try { await this.cleanupDisabledCommands(); } catch (e) { console.warn('cleanupDisabledCommands:', e?.message || e); }
                await this.deployCommands();
                res.json({ success: true });
            } catch (error) {
                console.error('❌ reset-commands error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.post('/api/admin/force-backup', async (req, res) => {
            try {
                const success = await deploymentManager.emergencyBackup();
                res.json({ success: !!success });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // === Fin endpoints dashboard ===

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

        // API endpoint pour les statistiques du dashboard
        app.get('/api/stats', async (req, res) => {
            try {
                const dm = require('./utils/simpleDataManager');
                const guildId = req.query.guildId || null;

                const economyData = dm.loadData('economy.json', {});
                const confLogs = dm.loadData('logs/confessions.json', []);
                const levelData = dm.loadData('level_users.json', {});
                const metrics = dm.loadData('metrics.json', { messagesPerDay: {}, commandsPerDay: {}, guilds: {} });

                const today = new Date().toISOString().slice(0,10);

                let activeMembers = 0;
                let totalMoney = 0;
                let totalConfessions = 0;
                let commandsUsed = 0;
                let todayMessages = 0;

                Object.keys(economyData).forEach(key => {
                    if (!key.includes('_')) return;
                    if (guildId && !key.endsWith(`_${guildId}`)) return;
                    const u = economyData[key] || {};
                    totalMoney += Number(u.money ?? u.balance ?? 0);
                    if ((u.goodKarma ?? 0) !== 0 || (u.badKarma ?? 0) !== 0 || (u.messageCount ?? 0) > 0) activeMembers++;
                });

                if (Array.isArray(confLogs)) {
                    totalConfessions = guildId ? confLogs.filter(c => c.guildId === guildId).length : confLogs.length;
                }

                if (guildId && metrics.guilds && metrics.guilds[guildId]) {
                    todayMessages = Number(metrics.guilds[guildId]?.messagesPerDay?.[today] || 0);
                    commandsUsed = Number(metrics.guilds[guildId]?.commandsPerDay?.[today] || 0);
                } else {
                    todayMessages = Number(metrics.messagesPerDay?.[today] || 0);
                    commandsUsed = Number(metrics.commandsPerDay?.[today] || 0);
                }

                const response = {
                    activeMembers,
                    todayMessages,
                    commandsUsed,
                    totalMoney,
                    totalUsers: Object.keys(economyData).filter(k => k.includes('_') && (!guildId || k.endsWith(`_${guildId}`))).length,
                    totalConfessions,
                    totalXP: Object.values(levelData).reduce((s, v) => s + Number(v.xp || 0), 0)
                };

                res.json(response);
            } catch (error) {
                console.error('Erreur chargement stats:', error);
                res.status(500).json({ error: 'stats_failed' });
            }
        });

        // API endpoint pour les configurations du dashboard
        app.get('/api/configs', async (req, res) => {
            try {
                const dataManager = require('./utils/simpleDataManager');
                
                // Charger les configurations depuis les fichiers JSON
                const economyConfig = dataManager.loadData('economy.json', {});
                const levelConfig = dataManager.loadData('level_config.json', {});
                const karmaConfig = dataManager.loadData('karma_config.json', {});
                const confessionConfig = dataManager.loadData('confessions.json', {});
                
                // Structurer les configurations pour le dashboard
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
                        notifications: levelConfig.notifications || { enabled: true, channelId: null, cardStyle: 'futuristic' },
                        roleRewards: levelConfig.roleRewards || [],
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
                    },
                    moderation: {
                        autoMod: true,
                        warnLimit: 3,
                        muteTime: 600,
                        banTime: 86400
                    }
                };

                res.json({ success: true, data: configs });
            } catch (error) {
                console.error('Erreur chargement configs:', error);
                // Retourner des configurations par défaut en cas d'erreur
                res.json({ 
                    success: false, 
                    error: error.message,
                    data: {
                        economy: {
                            dailyReward: 100,
                            workReward: { min: 50, max: 200 },
                            crimeReward: { min: 100, max: 500 },
                            crimeFail: { min: 20, max: 100 },
                            betLimit: 1000,
                            interestRate: 0.02
                        },
                        levels: {
                            textXP: { min: 5, max: 15, cooldown: 60000 },
                            voiceXP: { amount: 10, interval: 60000, perMinute: 10 },
                            notifications: { enabled: true, channelId: null, cardStyle: 'futuristic' },
                            roleRewards: [],
                            levelFormula: { baseXP: 100, multiplier: 1.5 },
                            leaderboard: { limit: 10 }
                        },
                        karma: {
                            dailyBonus: 5,
                            messageReward: 1,
                            confessionReward: 10,
                            maxKarma: 1000,
                            discounts: []
                        },
                        confessions: {
                            channelId: null,
                            moderationEnabled: true,
                            autoDelete: false,
                            minLength: 10,
                            maxLength: 2000
                        }
                    }
                });
            }
        });

        // === Moderation & Rôles endpoints ===
        // Liste des rôles d'un serveur (pour recherche côté UI)
        app.get('/api/guilds/:guildId/roles', async (req, res) => {
            try {
                const guildId = req.params.guildId;
                const guild = this.client?.guilds?.cache?.get(guildId);
                if (!guild) {
                    return res.status(404).json({ success: false, error: 'Guild not found' });
                }
                const fetched = await guild.roles.fetch();
                const roles = Array.from(fetched.values())
                    .map(r => ({ id: r.id, name: r.name, position: r.position, color: r.hexColor }))
                    .sort((a, b) => b.position - a.position);
                return res.json({ success: true, data: roles });
            } catch (error) {
                console.error('Erreur liste rôles:', error);
                return res.status(500).json({ success: false, error: error.message });
            }
        });

        // Récupérer la configuration de modération pour un serveur
        app.get('/api/moderation/:guildId', async (req, res) => {
            try {
                const guildId = req.params.guildId;
                const dataManager = require('./utils/simpleDataManager');
                const allConfigs = dataManager.getData('moderation_config.json');

                const defaultCfg = {
                    guildId,
                    logsChannelId: null,
                    roleEnforcement: {
                        enabled: false,
                        requiredRoleId: null,
                        requiredRoleName: null,
                        gracePeriodMs: 7 * 24 * 60 * 60 * 1000
                    },
                    inactivity: {
                        enabled: false,
                        thresholdMs: 30 * 24 * 60 * 60 * 1000,
                        exemptRoleIds: [],
                        exemptRoleNames: [],
                        autoExemptRoleId: null,
                        autoExemptRoleName: null
                    },
                    mute: { defaultDurationMs: 60 * 60 * 1000 }
                };

                const cfg = allConfigs[guildId] ? { ...defaultCfg, ...allConfigs[guildId] } : defaultCfg;
                return res.json({ success: true, data: cfg });
            } catch (error) {
                console.error('Erreur get moderation config:', error);
                return res.status(500).json({ success: false, error: error.message });
            }
        });

        // Sauvegarder la configuration de modération pour un serveur
        app.post('/api/moderation/:guildId', async (req, res) => {
            try {
                const guildId = req.params.guildId;
                const updates = req.body || {};
                const dataManager = require('./utils/simpleDataManager');
                const allConfigs = dataManager.getData('moderation_config.json');
                const existing = allConfigs[guildId] || {};

                const normalized = {
                    ...existing,
                    logsChannelId: updates.logsChannelId ?? existing.logsChannelId ?? null,
                    roleEnforcement: {
                        enabled: Boolean(updates.roleEnforcement?.enabled),
                        requiredRoleId: updates.roleEnforcement?.requiredRoleId ?? existing.roleEnforcement?.requiredRoleId ?? null,
                        requiredRoleName: updates.roleEnforcement?.requiredRoleName ?? existing.roleEnforcement?.requiredRoleName ?? null,
                        gracePeriodMs: Math.max(0, Number(updates.roleEnforcement?.gracePeriodMs ?? existing.roleEnforcement?.gracePeriodMs ?? 0)) || 0
                    },
                    inactivity: {
                        enabled: Boolean(updates.inactivity?.enabled),
                        thresholdMs: Math.max(0, Number(updates.inactivity?.thresholdMs ?? existing.inactivity?.thresholdMs ?? 0)) || 0,
                        exemptRoleIds: Array.isArray(updates.inactivity?.exemptRoleIds) ? updates.inactivity.exemptRoleIds : (existing.inactivity?.exemptRoleIds || []),
                        exemptRoleNames: Array.isArray(updates.inactivity?.exemptRoleNames) ? updates.inactivity.exemptRoleNames : (existing.inactivity?.exemptRoleNames || []),
                        autoExemptRoleId: updates.inactivity?.autoExemptRoleId ?? existing.inactivity?.autoExemptRoleId ?? null,
                        autoExemptRoleName: updates.inactivity?.autoExemptRoleName ?? existing.inactivity?.autoExemptRoleName ?? null
                    },
                    mute: {
                        defaultDurationMs: Math.max(0, Number(updates.mute?.defaultDurationMs ?? existing.mute?.defaultDurationMs ?? 60 * 60 * 1000))
                    }
                };

                allConfigs[guildId] = normalized;
                dataManager.setData('moderation_config.json', allConfigs);
                try {
                    if (this.moderationManager) {
                        await this.moderationManager.setGuildConfig(guildId, normalized);
                    } else if (this.coreDataManager) {
                        await this.coreDataManager.saveData('moderation_config', allConfigs);
                    }
                } catch (e) {
                    console.warn('⚠️ Sync moderation_config vers cache principal échouée:', e?.message || e);
                }
                return res.json({ success: true, data: normalized });
            } catch (error) {
                console.error('Erreur save moderation config:', error);
                return res.status(500).json({ success: false, error: error.message });
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
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildModeration
            ],
            partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
        });

        // Initialisation DataManager + ReminderManager (rappels de bump)
        this.coreDataManager = new DataManager();
        try { dataHooks.installHooks(require('./utils/simpleDataManager')); } catch {}
        try { dataHooks.installHooks(this.coreDataManager); } catch {}
        this.reminderManager = new ReminderManager(this.coreDataManager, this.client);
        this.client.reminderManager = this.reminderManager;
        this.reminderInteractionHandler = new ReminderInteractionHandler(this.reminderManager);
                // Initialiser et attacher la modération
        try {
            this.moderationManager = new ModerationManager(this.coreDataManager, this.client);
            this.client.moderationManager = this.moderationManager;
        } catch (e) {
            console.warn('⚠️ Échec initialisation ModerationManager:', e?.message || e);
        }

        // Initialiser et attacher le gestionnaire de logs
        try {
            const LogManager = require('./managers/LogManager');
            this.logManager = new LogManager(this.coreDataManager, this.client);
            this.client.logManager = this.logManager;
        } catch (e) {
            console.warn('⚠️ Échec initialisation LogManager:', e?.message || e);
        }

        this.commands = new Collection();
        await this.loadCommands();
        await this.setupEventHandlers();

        // Initialisation Lavalink (obligatoire)
        try {
            await this.client.login(process.env.DISCORD_TOKEN);
            // Initialisation Lavalink (après connexion Discord)
            try { require('./managers/MusicManager').configureLavalink(this.client); } catch {}
        } catch (error) {
            console.error('❌ Erreur connexion Discord:', error);
            console.log('🌐 Le serveur web continue de fonctionner sans Discord');
            // Ne pas arrêter le processus pour permettre au serveur web de continuer
        }
    }

    async loadCommands() {
        try {
            console.log('📂 Chargement des commandes...');
            const commandsPath = path.join(__dirname, 'commands');
            const commandFiles = await fs.readdir(commandsPath);
            const disabledCommands = new Set([
                'apercu-couleur',
                'mongodb-backup',
                'mongodb-diagnostic',
                'reset',
                'test-level-notif'
            ]);

            for (const file of commandFiles.filter(file => file.endsWith('.js'))) {
                try {
                    const filePath = path.join(commandsPath, file);
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);

                    if (command && command.data && disabledCommands.has(command.data.name)) {
                        console.log(`⛔ Commande désactivée (ignorée): ${command.data.name}`);
                        continue;
                    }

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
            
            // Initialiser les rappels de bump
            try {
                await this.reminderManager.initialize();
                console.log('🔔 Rappels de bump initialisés');
            } catch (remError) {
                console.error('❌ Erreur initialisation rappels de bump:', remError);
            }
            
            // Démarrer le scheduler de modération (inactivité / rôle requis)
            try {
                if (this.moderationManager) {
                    this.moderationManager.startScheduler(60 * 60 * 1000);
                    console.log('🕒 Planification des vérifications de modération activée (check hourly)');
                }
            } catch (modErr) {
                console.error('❌ Erreur initialisation scheduler moderation:', modErr);
            }
            
            // Initialiser le moteur musique (DisTube)
            try {
                const { getMusic } = require('./managers/MusicManager');
                getMusic(this.client);
                console.log('🎵 Système musique initialisé');
            } catch (e) {
                console.warn('⚠️ Échec initialisation musique:', e?.message || e);
            }

            // Suites privées: scan et items boutique par défaut
            try {
                const { scanAndRepairSuites, ensurePrivateSuiteShopItems } = require('./utils/privateSuiteManager');
                await scanAndRepairSuites(this.client);
                for (const guild of this.client.guilds.cache.values()) {
                    await ensurePrivateSuiteShopItems(guild);
                }
                console.log('🔒 Suites privées prêtes');
            } catch (e) {
                console.warn('⚠️ Suites privées init:', e?.message || e);
            }

            this.commands.forEach(command => {
                console.log(`  - ${command.data.name}`);
            });

            // Nettoyage des commandes désactivées (globales) avant déploiement guild
            try {
                await this.cleanupDisabledCommands();
            } catch (e) {
                console.warn('⚠️ Cleanup disabled commands (global) échoué:', e?.message || e);
            }

            await this.deployCommands();
        });

        this.client.on('interactionCreate', async interaction => {
            const wrappedInteraction = wrapInteraction(interaction);
            
            try {
                // Traitement spécial pour les modals d'actions économiques AVANT handleInteraction
                if (interaction.isModalSubmit()) {
                    const customId = interaction.customId;
                    console.log(`🎯 Modal submit détecté: ${customId}`);
                    
                    // Vérifier d'abord si le modal est implémenté
                    const modalImplemented = await modalHandler.handleModalSubmission(interaction);
                    if (!modalImplemented) {
                        return; // Modal non implémenté, déjà géré par modalHandler
                    }
                    
                    if (customId.includes('_amounts_modal_') || customId.includes('_cooldown_modal_') || customId.includes('_karma_modal_')) {
                        console.log('🎯 Modal action économique → handleActionModal');
                        const dataManager = require('./utils/simpleDataManager'); // AJOUT: dataManager requis ici
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const handler = new EconomyConfigHandler(dataManager);
                        await handler.handleActionModal(interaction);
                        return; // IMPORTANT: arrêter ici pour éviter le double traitement
                    }
                }

                // Contrôles musique (boutons)
                if (interaction.isButton() && interaction.customId && interaction.customId.startsWith('music_')) {
                    try {
                        const { handleButton } = require('./handlers/MusicControls');
                        await handleButton(interaction);
                    } catch (e) {
                        console.warn('⚠️ Erreur MusicControls:', e?.message || e);
                    }
                    return;
                }

                // Sélecteur radio désactivé (mode Lavalink only)
                if (false && interaction.isStringSelectMenu && interaction.isStringSelectMenu() && interaction.customId === 'radio_select') {
                    try {
                        const { handleRadioSelect } = require('./handlers/RadioHandler');
                        await handleRadioSelect(interaction);
                    } catch (e) {
                        console.warn('⚠️ Erreur RadioHandler:', e?.message || e);
                    }
                    return;
                }

                // Rappels de bump: plus de boutons à gérer (rappel automatique uniquement)
                if (interaction.isButton() && interaction.customId && (interaction.customId.startsWith('bump_reminder_done_') || interaction.customId.startsWith('bump_reminder_info_'))) {
                    // Ignoré: logique désactivée
                    return;
                }

                // Boutons de sécurité (approbation/quarantaine)
                if (interaction.isButton() && interaction.customId && interaction.customId.startsWith('security_')) {
                    try {
                        const SecurityButtonHandler = require('./handlers/SecurityButtonHandler');
                        if (!this.__securityButtons) this.__securityButtons = new SecurityButtonHandler(this.moderationManager);
                        await this.__securityButtons.handleSecurityButton(interaction);
                    } catch (e) { console.warn('⚠️ Erreur SecurityButtonHandler:', e?.message || e); }
                    return;
                }

                await this.handleInteraction(interaction);
            } catch (error) {
                // Gestion spécifique des erreurs Discord d'interaction
                if (error.code === 40060) {
                    console.warn('⚠️ Interaction déjà reconnue (40060) - ignorée silencieusement');
                    return;
                }
                
                // Log de l'erreur pour investigation
                await errorHandler.logError(
                    ErrorLevels.ERROR,
                    'Erreur dans interactionCreate',
                    error,
                    {
                        context: 'interactionCreate event',
                        interactionType: interaction.type,
                        customId: interaction.customId,
                        interactionAge: Date.now() - interaction.createdTimestamp,
                        interactionReplied: interaction.replied,
                        interactionDeferred: interaction.deferred
                    }
                );
                
                // Tentative de réponse sécurisée
                try {
                    if (!interaction.replied && !interaction.deferred && wrappedInteraction.isValid()) {
                        await wrappedInteraction.safeReply({
                            content: '❌ Une erreur inattendue s\'est produite. L\'équipe technique a été notifiée.',
                            flags: 64
                        });
                    }
                } catch (replyError) {
                    console.error('❌ Impossible de répondre à l\'interaction après erreur:', replyError);
                }
            }
        });

        this.client.on('messageCreate', async message => {
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
                        try {
                            if (this.coreDataManager?.db) {
                                await this.coreDataManager.db.collection('bumpCooldowns').updateOne(
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
                await errorHandler.logError(ErrorLevels.ERROR, 'Erreur traitement message', error, {
                    messageId: message.id,
                    authorId: message.author.id,
                    guildId: message.guild?.id,
                    channelId: message.channel.id
                });
            }
        });

        this.client.on('voiceStateUpdate', async (oldState, newState) => {
            try { if (this.logManager) await this.logManager.logVoiceState(oldState, newState); } catch {}
            await this.handleVoiceXP(oldState, newState);
            try {
                const guild = newState.guild || oldState.guild;
                if (!guild) return;
                const me = guild.members.me || guild.members.cache.get(this.client.user.id);
                if (!me) return;

                const leftChannel = oldState.channelId && oldState.channelId !== newState.channelId ? oldState.channel : null;
                const joinedChannel = newState.channelId && oldState.channelId !== newState.channelId ? newState.channel : null;
                const checkChannels = [leftChannel, joinedChannel].filter(Boolean);
                if (checkChannels.length === 0 && newState.channel) checkChannels.push(newState.channel);

                const { stop } = require('./managers/MusicManager');
                for (const channel of checkChannels) {
                    try {
                        if (!channel || channel.guild.id !== guild.id) continue;
                        const meInThisChannel = channel.members?.has(me.id);
                        if (!meInThisChannel) continue;
                        const nonBotMembers = channel.members.filter(m => !m.user.bot);
                        if (nonBotMembers.size === 0) {
                            try { await stop(guild.id); } catch {}
                        }
                    } catch {}
                }
            } catch {}
        });

        // === Système de logs ===
        // Modifications et suppressions de messages
        this.client.on('messageUpdate', async (oldMessage, newMessage) => {
            try { if (this.logManager) await this.logManager.logMessageEdit(oldMessage, newMessage); } catch {}
        });
        this.client.on('messageDelete', async (message) => {
            try { if (this.logManager) await this.logManager.logMessageDelete(message); } catch {}
        });

        // Arrivées / départs
        this.client.on('guildMemberAdd', async (member) => {
            try { if (this.moderationManager) await this.moderationManager.recordJoin(member.guild.id, member.id); } catch {}
            try { if (this.logManager) await this.logManager.logMemberJoin(member); } catch {}
            try { if (this.logManager) await this.logManager.updateMemberRolesSnapshot(member); } catch {}
            // Vérification automatique à l'arrivée
            try {
                const AutoVerificationHandler = require('./handlers/AutoVerificationHandler');
                if (!this.__autoVerif) { this.__autoVerif = new AutoVerificationHandler(this.moderationManager); }
                await this.__autoVerif.verifyNewMember(member);
            } catch {}
        });
        this.client.on('guildMemberRemove', async (member) => {
            try {
                let isKick = false;
                let isBan = false;
                let moderatorUser = null;
                let reason = null;
                try {
                    const me = member.guild?.members?.me;
                    if (me?.permissions?.has(PermissionFlagsBits.ViewAuditLog)) {
                        const kickLogs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 });
                        const kickEntry = kickLogs?.entries?.first();
                        if (kickEntry && kickEntry.target?.id === member.id && (Date.now() - kickEntry.createdTimestamp) < 10000) {
                            isKick = true;
                            moderatorUser = kickEntry.executor || null;
                            reason = kickEntry.reason || null;
                        } else {
                            const banLogs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
                            const banEntry = banLogs?.entries?.first();
                            if (banEntry && banEntry.target?.id === member.id && (Date.now() - banEntry.createdTimestamp) < 10000) {
                                isBan = true;
                            }
                        }
                    }
                } catch {}

                if (isKick) {
                    try { if (this.logManager) await this.logManager.logKick(member, moderatorUser, reason); } catch {}
                } else if (!isBan) {
                    try { if (this.logManager) await this.logManager.logMemberLeave(member); } catch {}
                }

                // Nettoyage canaux de quarantaine si existants
                try {
                    const QuarantineChannelManager = require('./handlers/QuarantineChannelManager');
                    if (!this.__quarantineManager) this.__quarantineManager = new QuarantineChannelManager(this.moderationManager);
                    if (member.guild) await this.__quarantineManager.cleanupOnMemberExit(member.guild, member.id);
                } catch {}
            } catch {}
        });

        // Changement de pseudo
        this.client.on('guildMemberUpdate', async (oldMember, newMember) => {
            try {
                // Détection timeout (mute/unmute)
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
                        try { if (this.logManager) await this.logManager.logMute(newMember, moderatorUser, durationMs, reason); } catch {}
                    } else if (beforeTs && !afterTs) {
                        try { if (this.logManager) await this.logManager.logUnmute(newMember, moderatorUser, reason); } catch {}
                    } else if (beforeTs && afterTs && beforeTs !== afterTs) {
                        const durationMs = Math.max(0, afterTs - Date.now());
                        try { if (this.logManager) await this.logManager.logMute(newMember, moderatorUser, durationMs, reason); } catch {}
                    }
                }

                // Logs de changement de pseudo (existant)
                try { if (this.logManager) await this.logManager.logNicknameChange(oldMember, newMember); } catch {}
                try { if (this.logManager) await this.logManager.logMemberRoleChanges(oldMember, newMember); } catch {}
            } catch {}
        });

        // Rôles (création/suppression/mise à jour)
        this.client.on('roleCreate', async (role) => {
            try { if (this.logManager) await this.logManager.logRoleCreate(role); } catch {}
        });
        this.client.on('roleDelete', async (role) => {
            try { if (this.logManager) await this.logManager.logRoleDelete(role); } catch {}
        });
        this.client.on('roleUpdate', async (oldRole, newRole) => {
            try { if (this.logManager) await this.logManager.logRoleUpdate(oldRole, newRole); } catch {}
        });

        // Ban / Unban
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
                try { if (this.logManager) await this.logManager.logBan(ban.guild, ban.user, reason, moderatorUser); } catch {}

                // Nettoyage canaux de quarantaine si existants (ban)
                try {
                    const QuarantineChannelManager = require('./handlers/QuarantineChannelManager');
                    if (!this.__quarantineManager) this.__quarantineManager = new QuarantineChannelManager(this.moderationManager);
                    if (ban.guild) await this.__quarantineManager.cleanupOnMemberExit(ban.guild, ban.user.id);
                } catch {}
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
                try { if (this.logManager) await this.logManager.logUnban(ban.guild, ban.user, moderatorUser); } catch {}
            } catch {}
        });

        this.client.on('error', async error => {
            await errorHandler.logError(ErrorLevels.CRITICAL, 'Erreur client Discord', error, {
                context: 'Discord client error event'
            });
        });

		// Logs channels create/delete/update
		this.client.on('channelCreate', async (channel) => {
			try {
				if (this.logManager) await this.logManager.logChannelCreate(channel);
			} catch {}
			// Appliquer automatiquement les restrictions de quarantaine sur les nouveaux canaux
			try {
				const QuarantineChannelManager = require('./handlers/QuarantineChannelManager');
				if (!this.__quarantineManager) {
					this.__quarantineManager = new QuarantineChannelManager(this.moderationManager);
				}
				await this.__quarantineManager.applyQuarantineRestrictionsToNewChannel(channel, channel.guild);
			} catch {}
		});
		this.client.on('channelDelete', async (channel) => { try { if (this.logManager) await this.logManager.logChannelDelete(channel); } catch {} });
		this.client.on('channelUpdate', async (oldChannel, newChannel) => { try { if (this.logManager) await this.logManager.logChannelUpdate(oldChannel, newChannel); } catch {} });

		// Logs threads
		this.client.on('threadCreate', async (thread) => { try { if (this.logManager) await this.logManager.logThreadCreate(thread); } catch {} });
		this.client.on('threadDelete', async (thread) => { try { if (this.logManager) await this.logManager.logThreadDelete(thread); } catch {} });
		this.client.on('threadUpdate', async (oldThread, newThread) => { try { if (this.logManager) await this.logManager.logThreadUpdate(oldThread, newThread); } catch {} });

		// Logs emojis
		this.client.on('emojiCreate', async (emoji) => { try { if (this.logManager) await this.logManager.logEmojiCreate(emoji); } catch {} });
		this.client.on('emojiDelete', async (emoji) => { try { if (this.logManager) await this.logManager.logEmojiDelete(emoji); } catch {} });
		this.client.on('emojiUpdate', async (oldEmoji, newEmoji) => { try { if (this.logManager) await this.logManager.logEmojiUpdate(oldEmoji, newEmoji); } catch {} });

		// Logs stickers
		this.client.on('stickerCreate', async (sticker) => { try { if (this.logManager) await this.logManager.logStickerCreate(sticker); } catch {} });
		this.client.on('stickerDelete', async (sticker) => { try { if (this.logManager) await this.logManager.logStickerDelete(sticker); } catch {} });
		this.client.on('stickerUpdate', async (oldSticker, newSticker) => { try { if (this.logManager) await this.logManager.logStickerUpdate(oldSticker, newSticker); } catch {} });

		// Logs invites
		this.client.on('inviteCreate', async (invite) => { try { if (this.logManager) await this.logManager.logInviteCreate(invite); } catch {} });
		this.client.on('inviteDelete', async (invite) => { try { if (this.logManager) await this.logManager.logInviteDelete(invite); } catch {} });

		// Logs webhooks
		this.client.on('webhookUpdate', async (channel) => { try { if (this.logManager) await this.logManager.logWebhookUpdate(channel); } catch {} });

		// Logs serveur
		this.client.on('guildUpdate', async (oldGuild, newGuild) => { try { if (this.logManager) await this.logManager.logGuildUpdate(oldGuild, newGuild); } catch {} });

		// Logs boosts (via guildMemberUpdate)
		this.client.on('guildMemberUpdate', async (oldMember, newMember) => {
			try {
				const before = oldMember.premiumSinceTimestamp || oldMember.premiumSince || oldMember.premiumSinceWeb || null;
				const after = newMember.premiumSinceTimestamp || newMember.premiumSince || newMember.premiumSinceWeb || null;
				if (!before && after) { try { if (this.logManager) await this.logManager.logBoostStart(newMember); } catch {} }
				if (before && !after) { try { if (this.logManager) await this.logManager.logBoostEnd(newMember); } catch {} }
			} catch {}
		});

		// Logs événements planifiés
		this.client.on('guildScheduledEventCreate', async (event) => { try { if (this.logManager) await this.logManager.logScheduledEventCreate(event); } catch {} });
		this.client.on('guildScheduledEventUpdate', async (oldEvent, newEvent) => { try { if (this.logManager) await this.logManager.logScheduledEventUpdate(oldEvent, newEvent); } catch {} });
		this.client.on('guildScheduledEventDelete', async (event) => { try { if (this.logManager) await this.logManager.logScheduledEventDelete(event); } catch {} });
    }

    async cleanupDisabledCommands() {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        const disabled = new Set(['apercu-couleur', 'mongodb-backup', 'mongodb-diagnostic', 'reset', 'test-level-notif']);
        try {
            const existing = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));
            const targets = Array.isArray(existing) ? existing.filter(c => disabled.has(c.name)) : [];
            if (targets.length === 0) return;
            console.log(`🧹 Suppression globale de ${targets.length} commande(s) désactivée(s)`);
            for (const cmd of targets) {
                try {
                    await rest.delete(Routes.applicationCommand(process.env.CLIENT_ID, cmd.id));
                    console.log(`   ❌ Global: ${cmd.name}`);
                } catch (e) {
                    console.warn(`   ⚠️ Échec suppression globale ${cmd.name}:`, e?.message || e);
                }
            }
        } catch (e) {
            console.warn('⚠️ Lecture des commandes globales échouée:', e?.message || e);
        }
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
        // Initialiser dataManager au début pour toutes les sections
        const dataManager = require('./utils/simpleDataManager');
        
        try {
            const MainRouterHandler = require('./handlers/MainRouterHandler');
            const router = new MainRouterHandler(dataManager);
            // Associer le client pour initialiser SecurityConfigHandler (nécessaire pour /config-verif-menu)
            try { router.setClient(this.client); } catch {}

            if (interaction.isChatInputCommand()) {
                const command = this.commands.get(interaction.commandName);
                if (!command) {
                    console.error(`❌ Commande non trouvée: ${interaction.commandName}`);
                    return;
                }

                console.log(`🔧 /${interaction.commandName} par ${interaction.user.tag}`);
                const needsClient = ['bump', 'bump-config', 'config-bump'].includes(interaction.commandName);
                if (needsClient) {
                    await command.execute(interaction, this.client);
                } else {
                    await command.execute(interaction, dataManager);
                }
            } 
            else if (interaction.isModalSubmit()) {
                console.log(`📝 Modal: ${interaction.customId}`);
                
                try {
                    // === MODALS ÉCONOMIQUES NOUVEAUX ===
                    if (interaction.customId.startsWith('action_config_modal_')) {
                        console.log('🎯 Modal configuration action:', interaction.customId);
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleActionConfigModal(interaction);
                        return;
                    }
                    
                    if (interaction.customId === 'objet_perso_modal') {
                        console.log('🎯 Modal objet personnalisé');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleObjetPersoModal(interaction);
                        return;
                    }

                    // Modals Daily
                    if (interaction.customId === 'daily_amount_modal') {
                        console.log('🎯 Modal daily amount');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleDailyAmountModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'daily_streak_modal') {
                        console.log('🎯 Modal daily streak');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleDailyStreakModal(interaction);
                        return;
                    }

                    // Modals Messages
                    if (interaction.customId === 'message_amount_modal') {
                        console.log('🎯 Modal message amount');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleMessageAmountModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'message_cooldown_modal') {
                        console.log('🎯 Modal message cooldown');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleMessageCooldownModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'message_limits_modal') {
                        console.log('🎯 Modal message limits');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleMessageLimitsModal(interaction);
                        return;
                    }

                    // Modals Karma
                    if (interaction.customId === 'karma_levels_modal') {
                        console.log('🎯 Modal karma levels');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleKarmaLevelsModal(interaction);
                        return;
                    }
                    
                    if (interaction.customId === 'remise_karma_modal') {
                        console.log('🎯 Modal remise karma');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleRemiseModal(interaction);
                        return;
                    }
                    
                    if (interaction.customId === 'modify_remises_modal') {
                        console.log('🎯 Modal modification remise karma');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleModifyRemiseModal(interaction);
                        return;
                    }
                    
                    if (interaction.customId === 'delete_remises_modal') {
                        console.log('🎯 Modal suppression remise karma');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleDeleteRemiseModal(interaction);
                        return;
                    }
                    
                    if (interaction.customId.startsWith('edit_discount_modal_')) {
                        console.log('🎯 Modal modification remise karma:', interaction.customId);
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleEditDiscountModal(interaction);
                        return;
                    }
                    
                    if (interaction.customId.startsWith('role_config_modal_')) {
                        console.log('🎯 Modal config rôle:', interaction.customId);
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleRoleConfigModal(interaction);
                        return;
                    }

                    // === AOUV MODALS ===
                    if (interaction.customId === 'aouv_prompt_add_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvPromptAddModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'aouv_prompt_edit_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvPromptEditModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'aouv_prompt_remove_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvPromptRemoveModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'aouv_prompt_disable_base_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvPromptBaseModal(interaction, true);
                        return;
                    }

                    if (interaction.customId === 'aouv_prompt_enable_base_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvPromptBaseModal(interaction, false);
                        return;
                    }

                    if (interaction.customId === 'aouv_prompt_list_base_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvPromptListBaseModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'aouv_prompt_override_base_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvPromptOverrideModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'aouv_prompt_reset_override_base_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvPromptResetOverrideModal(interaction);
                        return;
                    }

                    // === AOUV NSFW MODALS ===
                    if (interaction.customId === 'aouv_nsfw_prompt_add_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvNsfwPromptAddModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'aouv_nsfw_prompt_edit_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvNsfwPromptEditModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'aouv_nsfw_prompt_remove_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvNsfwPromptRemoveModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'aouv_nsfw_prompt_disable_base_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvNsfwPromptBaseModal(interaction, true);
                        return;
                    }

                    if (interaction.customId === 'aouv_nsfw_prompt_enable_base_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvNsfwPromptBaseModal(interaction, false);
                        return;
                    }

                    if (interaction.customId === 'aouv_nsfw_prompt_list_base_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvNsfwPromptListBaseModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'aouv_nsfw_prompt_override_base_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvNsfwPromptOverrideModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'aouv_nsfw_prompt_reset_override_base_modal') {
                        const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                        const aouvHandler = new AouvConfigHandler(dataManager);
                        await aouvHandler.handleAouvNsfwPromptResetOverrideModal(interaction);
                        return;
                    }

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
                            return;
                        } else if (interaction.customId === 'base_xp_modal') {
                            const LevelConfigHandler = require('./handlers/LevelConfigHandler');
                            const levelHandler = new LevelConfigHandler();
                            await levelHandler.handleBaseXPModal(interaction);
                            return;
                            
                        } else if (interaction.customId === 'multiplier_modal') {
                            const LevelConfigHandler = require('./handlers/LevelConfigHandler');
                            const levelHandler = new LevelConfigHandler();
                            await levelHandler.handleMultiplierModal(interaction);
                            return;
                            
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
                    
                    // Handler pour les modals d'actions économiques
                    if (interaction.customId.startsWith('action_config_modal_')) {
                        console.log('🎯 Modal action config submission détecté:', interaction.customId);
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const handler = new EconomyConfigHandler(dataManager);
                        await handler.handleActionModal(interaction);
                        return;
                    }
                    
                    // Gestion des autres modals d'économie
                    if (interaction.customId === 'economy_daily_amount_modal') {
                        const amount = parseInt(interaction.fields.getTextInputValue('daily_amount'));
                        if (amount >= 1 && amount <= 1000) {
                            const economyData = dataManager.loadData('economy') || {};
                            if (!economyData.daily) economyData.daily = {};
                            economyData.daily.amount = amount;
                            dataManager.saveData('economy', economyData);
                            await interaction.reply({ content: `✅ Montant daily configuré à ${amount}€`, flags: 64 });
                        } else {
                            await interaction.reply({ content: '❌ Montant invalide (1-1000€)', flags: 64 });
                        }
                        return;
                    }
                    
                    if (interaction.customId === 'economy_messages_amount_modal') {
                        const amount = parseInt(interaction.fields.getTextInputValue('messages_amount'));
                        if (amount >= 1 && amount <= 50) {
                            const economyData = dataManager.loadData('economy') || {};
                            if (!economyData.messageRewards) economyData.messageRewards = {};
                            economyData.messageRewards.amount = amount;
                            dataManager.saveData('economy', economyData);
                            await interaction.reply({ content: `✅ Montant par message configuré à ${amount}€`, flags: 64 });
                        } else {
                            await interaction.reply({ content: '❌ Montant invalide (1-50€)', flags: 64 });
                        }
                        return;
                    }
                    
                    if (interaction.customId === 'economy_messages_cooldown_modal') {
                        const cooldown = parseInt(interaction.fields.getTextInputValue('messages_cooldown'));
                        if (cooldown >= 30 && cooldown <= 300) {
                            const economyData = dataManager.loadData('economy') || {};
                            if (!economyData.messageRewards) economyData.messageRewards = {};
                            economyData.messageRewards.cooldown = cooldown;
                            dataManager.saveData('economy', economyData);
                            await interaction.reply({ content: `✅ Cooldown messages configuré à ${cooldown}s`, flags: 64 });
                        } else {
                            await interaction.reply({ content: '❌ Cooldown invalide (30-300s)', flags: 64 });
                        }
                        return;
                    }
                    
                    if (interaction.customId === 'economy_daily_amount_modal') {
                        const amount = parseInt(interaction.fields.getTextInputValue('daily_amount'));
                        if (amount >= 1 && amount <= 1000) {
                            const economyData = dataManager.loadData('economy') || {};
                            if (!economyData.daily) economyData.daily = {};
                            economyData.daily.baseAmount = amount;
                            dataManager.saveData('economy', economyData);
                            await interaction.reply({ content: `✅ Montant daily configuré à ${amount}€`, flags: 64 });
                        } else {
                            await interaction.reply({ content: '❌ Montant invalide (1-1000€)', flags: 64 });
                        }
                        return;
                    }
                    
                    if (interaction.customId === 'shop_karma_discount_modal') {
                        const name = interaction.fields.getTextInputValue('discount_name');
                        const karma = parseInt(interaction.fields.getTextInputValue('karma_required'));
                        const percent = parseInt(interaction.fields.getTextInputValue('percentage'));
                        
                        // Validation
                        if (isNaN(karma) || karma < -999 || karma > 999) {
                            await interaction.reply({
                                content: '❌ Le karma requis doit être un nombre entre -999 et 999.',
                                flags: 64
                            });
                            return;
                        }
                        
                        if (isNaN(percent) || percent < 1 || percent > 99) {
                            await interaction.reply({
                                content: '❌ Le pourcentage doit être un nombre entre 1 et 99.',
                                flags: 64
                            });
                            return;
                        }
                        
                        // Sauvegarder dans karma_discounts
                        const guildId = interaction.guild.id;
                        const discountsData = await dataManager.loadData('karma_discounts', {});
                        
                        if (!discountsData[guildId]) discountsData[guildId] = [];
                        
                        discountsData[guildId].push({
                            id: Date.now().toString(),
                            name: name,
                            karmaMin: karma,
                            percentage: percent,
                            created: new Date().toISOString()
                        });
                        
                        await dataManager.saveData('karma_discounts', discountsData);
                        
                        await interaction.reply({
                            content: `✅ Remise **${name}** créée avec succès (${karma} karma → ${percent}% de remise).`,
                            flags: 64
                        });
                        return;
                    }
                    
                    // Handler pour modal d'édition remise karma
                    if (interaction.customId.startsWith('edit_karma_discount_modal_')) {
                        const discountId = interaction.customId.replace('edit_karma_discount_modal_', '');
                        const name = interaction.fields.getTextInputValue('discount_name');
                        const karma = parseInt(interaction.fields.getTextInputValue('karma_required'));
                        const percent = parseInt(interaction.fields.getTextInputValue('percentage'));
                        
                        // Validation
                        if (isNaN(karma) || karma < -999 || karma > 999) {
                            await interaction.reply({
                                content: '❌ Le karma requis doit être un nombre entre -999 et 999.',
                                flags: 64
                            });
                            return;
                        }
                        
                        if (isNaN(percent) || percent < 1 || percent > 99) {
                            await interaction.reply({
                                content: '❌ Le pourcentage doit être un nombre entre 1 et 99.',
                                flags: 64
                            });
                            return;
                        }
                        
                        // Modifier dans karma_discounts
                        const guildId = interaction.guild.id;
                        const discountsData = await dataManager.loadData('karma_discounts', {});
                        
                        if (discountsData[guildId]) {
                            const discountIndex = discountsData[guildId].findIndex(d => d.id.toString() === discountId);
                            if (discountIndex !== -1) {
                                discountsData[guildId][discountIndex] = {
                                    ...discountsData[guildId][discountIndex],
                                    name: name,
                                    karmaMin: karma,
                                    percentage: percent,
                                    updated: new Date().toISOString()
                                };
                                
                                await dataManager.saveData('karma_discounts', discountsData);
                                
                                await interaction.reply({
                                    content: `✅ Remise **${name}** modifiée avec succès (${karma} karma → ${percent}% de remise).`,
                                    flags: 64
                                });
                            } else {
                                await interaction.reply({
                                    content: '❌ Remise introuvable.',
                                    flags: 64
                                });
                            }
                        } else {
                            await interaction.reply({
                                content: '❌ Aucune remise configurée.',
                                flags: 64
                            });
                        }
                        return;
                    }
                    
                    // Handlers pour modals boutique
                    if (interaction.customId === 'create_custom_object_modal') {
                        const name = interaction.fields.getTextInputValue('object_name');
                        const price = parseInt(interaction.fields.getTextInputValue('object_price'));
                        const description = interaction.fields.getTextInputValue('object_description') || 'Objet personnalisé';
                        
                        if (isNaN(price) || price < 1 || price > 999999) {
                            await interaction.reply({
                                content: '❌ Le prix doit être un nombre entre 1 et 999999.',
                                flags: 64
                            });
                            return;
                        }
                        
                        // Sauvegarder dans shop.json
                        const guildId = interaction.guild.id;
                        const fs = require('fs');
                        const path = require('path');
                        const shopPath = path.join(__dirname, 'data', 'shop.json');
                        
                        let shopData = {};
                        try {
                            if (fs.existsSync(shopPath)) {
                                shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
                            }
                        } catch (error) {
                            shopData = {};
                        }
                        
                        if (!shopData[guildId]) shopData[guildId] = [];
                        
                        shopData[guildId].push({
                            id: Date.now(),
                            name: name,
                            price: price,
                            description: description,
                            type: 'custom_object',
                            createdAt: new Date().toISOString()
                        });
                        
                        const dataDir = path.dirname(shopPath);
                        if (!fs.existsSync(dataDir)) {
                            fs.mkdirSync(dataDir, { recursive: true });
                        }
                        
                        fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));
                        
                        await interaction.reply({
                            content: `✅ Objet **${name}** créé avec succès (${price}€).`,
                            flags: 64
                        });
                        return;
                    }
                    
                    if (interaction.customId === 'create_temp_role_modal') {
                        const roleId = interaction.fields.getTextInputValue('role_id');
                        const price = parseInt(interaction.fields.getTextInputValue('role_price'));
                        const duration = parseInt(interaction.fields.getTextInputValue('role_duration'));
                        
                        if (isNaN(price) || price < 1 || price > 999999) {
                            await interaction.reply({
                                content: '❌ Le prix doit être un nombre entre 1 et 999999.',
                                flags: 64
                            });
                            return;
                        }
                        
                        if (isNaN(duration) || duration < 1 || duration > 365) {
                            await interaction.reply({
                                content: '❌ La durée doit être un nombre entre 1 et 365 jours.',
                                flags: 64
                            });
                            return;
                        }
                        
                        // Vérifier que le rôle existe
                        const role = interaction.guild.roles.cache.get(roleId);
                        if (!role) {
                            await interaction.reply({
                                content: '❌ Rôle introuvable. Vérifiez l\'ID du rôle.',
                                flags: 64
                            });
                            return;
                        }
                        
                        // Sauvegarder dans shop.json
                        const guildId = interaction.guild.id;
                        const fs = require('fs');
                        const path = require('path');
                        const shopPath = path.join(__dirname, 'data', 'shop.json');
                        
                        let shopData = {};
                        try {
                            if (fs.existsSync(shopPath)) {
                                shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
                            }
                        } catch (error) {
                            shopData = {};
                        }
                        
                        if (!shopData[guildId]) shopData[guildId] = [];
                        
                        shopData[guildId].push({
                            id: Date.now(),
                            name: role.name,
                            price: price,
                            description: `Rôle temporaire ${role.name} pour ${duration} jours`,
                            type: 'temporary_role',
                            roleId: roleId,
                            duration: duration,
                            createdAt: new Date().toISOString()
                        });
                        
                        const dataDir = path.dirname(shopPath);
                        if (!fs.existsSync(dataDir)) {
                            fs.mkdirSync(dataDir, { recursive: true });
                        }
                        
                        fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));
                        
                        await interaction.reply({
                            content: `✅ Rôle temporaire **${role.name}** ajouté (${price}€, ${duration} jours).`,
                            flags: 64
                        });
                        return;
                    }
                    
                    if (interaction.customId === 'create_perm_role_modal') {
                        const roleId = interaction.fields.getTextInputValue('role_id');
                        const price = parseInt(interaction.fields.getTextInputValue('role_price'));
                        
                        if (isNaN(price) || price < 1 || price > 999999) {
                            await interaction.reply({
                                content: '❌ Le prix doit être un nombre entre 1 et 999999.',
                                flags: 64
                            });
                            return;
                        }
                        
                        // Vérifier que le rôle existe
                        const role = interaction.guild.roles.cache.get(roleId);
                        if (!role) {
                            await interaction.reply({
                                content: '❌ Rôle introuvable. Vérifiez l\'ID du rôle.',
                                flags: 64
                            });
                            return;
                        }
                        
                        // Sauvegarder dans shop.json
                        const guildId = interaction.guild.id;
                        const fs = require('fs');
                        const path = require('path');
                        const shopPath = path.join(__dirname, 'data', 'shop.json');
                        
                        let shopData = {};
                        try {
                            if (fs.existsSync(shopPath)) {
                                shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
                            }
                        } catch (error) {
                            shopData = {};
                        }
                        
                        if (!shopData[guildId]) shopData[guildId] = [];
                        
                        shopData[guildId].push({
                            id: Date.now(),
                            name: role.name,
                            price: price,
                            description: `Rôle permanent ${role.name}`,
                            type: 'permanent_role',
                            roleId: roleId,
                            createdAt: new Date().toISOString()
                        });
                        
                        const dataDir = path.dirname(shopPath);
                        if (!fs.existsSync(dataDir)) {
                            fs.mkdirSync(dataDir, { recursive: true });
                        }
                        
                        fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));
                        
                        await interaction.reply({
                            content: `✅ Rôle permanent **${role.name}** ajouté (${price}€).`,
                            flags: 64
                        });
                        return;
                    }
                    
                    // Handler pour modal création niveau karma
                    if (interaction.customId === 'create_karma_level_modal') {
                        const name = interaction.fields.getTextInputValue('level_name');
                        const karmaNet = parseInt(interaction.fields.getTextInputValue('karma_net'));
                        const reward = parseInt(interaction.fields.getTextInputValue('reward_amount'));
                        
                        // Validation
                        if (isNaN(karmaNet) || karmaNet < -999 || karmaNet > 999) {
                            await interaction.reply({
                                content: '❌ La réputation doit être un nombre entre -999 et 999.',
                                flags: 64
                            });
                            return;
                        }
                        
                        if (isNaN(reward) || reward < -999999 || reward > 999999) {
                            await interaction.reply({
                                content: '❌ La récompense doit être un nombre entre -999999 et 999999.',
                                flags: 64
                            });
                            return;
                        }
                        
                        // Sauvegarder dans economy.json
                        const economyData = dataManager.loadData('economy') || {};
                        if (!economyData.karmaLevels) economyData.karmaLevels = [];
                        
                        economyData.karmaLevels.push({
                            id: Date.now(),
                            name: name,
                            karmaNet: karmaNet,
                            reward: reward,
                            createdAt: new Date().toISOString()
                        });
                        
                        dataManager.saveData('economy', economyData);
                        
                        await interaction.reply({
                            content: `✅ Niveau de réputation **${name}** créé avec succès (${karmaNet} réputation 🥵 → ${reward}€).`,
                            flags: 64
                        });
                        return;
                    }

                    // Handler pour modal modification récompense karma
                    if (interaction.customId.startsWith('modify_reward_modal_')) {
                        try {
                            const rewardIndex = parseInt(interaction.customId.replace('modify_reward_modal_', ''));
                            const name = interaction.fields.getTextInputValue('reward_name').trim();
                            const threshold = parseInt(interaction.fields.getTextInputValue('reward_threshold'));
                            const money = parseInt(interaction.fields.getTextInputValue('reward_money'));
                            
                            // Validation
                            if (!name || name.length > 50) {
                                await interaction.reply({
                                    content: '❌ Le nom doit contenir entre 1 et 50 caractères.',
                                    flags: 64
                                });
                                return;
                            }
                            
                            if (isNaN(threshold) || threshold === 0) {
                                await interaction.reply({
                                    content: '❌ Le seuil de karma doit être un nombre différent de 0.',
                                    flags: 64
                                });
                                return;
                            }
                            
                            if (isNaN(money)) {
                                await interaction.reply({
                                    content: '❌ Le montant d\'argent doit être un nombre valide.',
                                    flags: 64
                                });
                                return;
                            }
                            
                            // Charger les données karma
                            const karmaData = await dataManager.loadData('karma_config.json', {});
                            const customRewards = karmaData.customRewards || [];
                            
                            if (rewardIndex < 0 || rewardIndex >= customRewards.length) {
                                await interaction.reply({
                                    content: '❌ Récompense non trouvée.',
                                    flags: 64
                                });
                                return;
                            }
                            
                            // Vérifier que le seuil n'est pas déjà utilisé par une autre récompense
                            const duplicateIndex = customRewards.findIndex((reward, index) => 
                                index !== rewardIndex && reward.threshold === threshold
                            );
                            
                            if (duplicateIndex !== -1) {
                                await interaction.reply({
                                    content: `❌ Le seuil ${threshold} est déjà utilisé par la récompense "${customRewards[duplicateIndex].name}".`,
                                    flags: 64
                                });
                                return;
                            }
                            
                            const oldReward = { ...customRewards[rewardIndex] };
                            
                            // Modifier la récompense
                            customRewards[rewardIndex] = {
                                name: name,
                                threshold: threshold,
                                money: money,
                                createdAt: oldReward.createdAt || new Date().toISOString(),
                                modifiedAt: new Date().toISOString()
                            };
                            
                            karmaData.customRewards = customRewards;
                            await dataManager.saveData('karma_config.json', karmaData);
                            
                            await interaction.reply({
                                content: `✅ **Récompense modifiée avec succès !**\n\n` +
                                         `📝 **Nom :** ${name}\n` +
                                         `📊 **Seuil :** ${threshold > 0 ? '+' : ''}${threshold} karma\n` +
                                         `💰 **Argent :** ${money}€\n\n` +
                                         `**Anciennes valeurs :**\n` +
                                         `• Nom : ${oldReward.name}\n` +
                                         `• Seuil : ${oldReward.threshold > 0 ? '+' : ''}${oldReward.threshold} karma\n` +
                                         `• Argent : ${oldReward.money}€`,
                                flags: 64
                            });
                            
                        } catch (error) {
                            console.error('Erreur modification récompense karma:', error);
                            await interaction.reply({
                                content: '❌ Erreur lors de la modification de la récompense.',
                                flags: 64
                            });
                        }
                        return;
                    }
                    
                    if (interaction.customId.startsWith('edit_item_modal_')) {
                        const itemId = interaction.customId.replace('edit_item_modal_', '');
                        const fs = require('fs');
                        const path = require('path');
                        
                        try {
                            const shopPath = path.join(__dirname, 'data', 'shop.json');
                            let shop = {};
                            if (fs.existsSync(shopPath)) {
                                shop = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
                            }
                            
                            const guildId = interaction.guild.id;
                            const items = shop[guildId] || [];
                            const itemIndex = items.findIndex(i => String(i.id) === String(itemId));
                            const item = items[itemIndex];
                            
                            if (item) {
                                const price = parseInt(interaction.fields.getTextInputValue('item_price'));
                                
                                if (price >= 1 && price <= 999999) {
                                    item.price = price;
                                    
                                    if (item.type === 'custom_object' || item.type === 'custom' || item.type === 'text') {
                                        item.name = interaction.fields.getTextInputValue('item_name');
                                        item.description = interaction.fields.getTextInputValue('item_description') || '';
                                    } else if (item.type === 'temporary_role' || item.type === 'temp_role') {
                                        const duration = parseInt(interaction.fields.getTextInputValue('item_duration'));
                                        if (duration >= 1 && duration <= 365) {
                                            item.duration = duration;
                                        }
                                    }
                                    
                                    items[itemIndex] = item;
                                    shop[guildId] = items;
                                    fs.writeFileSync(shopPath, JSON.stringify(shop, null, 2));
                                    
                                    await interaction.reply({
                                        content: `✅ **Article modifié !**\n\n✏️ **${item.name}**\n💰 Nouveau prix: ${price}€`,
                                        flags: 64
                                    });
                                } else {
                                    await interaction.reply({ content: '❌ Prix invalide (1-999,999€)', flags: 64 });
                                }
                            } else {
                                await interaction.reply({ content: '❌ Article non trouvé', flags: 64 });
                            }
                        } catch (error) {
                            console.error('Erreur modification article:', error);
                            await interaction.reply({ content: '❌ Erreur lors de la modification', flags: 64 });
                        }
                        return;
                    }
                    

                    
                    if (interaction.customId === 'temp_role_price_modal') {
                        const price = parseInt(interaction.fields.getTextInputValue('role_price'));
                        const duration = parseInt(interaction.fields.getTextInputValue('role_duration'));
                        const roleId = interaction.fields.getTextInputValue('role_id');
                        
                        if (price >= 1 && price <= 999999 && duration >= 1 && duration <= 365) {
                            const fs = require('fs');
                            const path = require('path');
                            
                            const dataDir = path.join(__dirname, 'data');
                            if (!fs.existsSync(dataDir)) {
                                fs.mkdirSync(dataDir, { recursive: true });
                            }
                            
                            const shopPath = path.join(dataDir, 'shop.json');
                            let shopData = {};
                            try {
                                if (fs.existsSync(shopPath)) {
                                    shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
                                }
                            } catch (error) {
                                shopData = {};
                            }
                            
                            const guildId = interaction.guild.id;
                            if (!shopData[guildId]) shopData[guildId] = [];
                            
                            const role = interaction.guild.roles.cache.get(roleId);
                            const newItem = {
                                id: Date.now().toString(),
                                name: `Rôle: ${role?.name || 'Rôle'}`,
                                price: price,
                                duration: duration,
                                roleId: roleId,
                                type: 'temporary_role',
                                createdAt: new Date().toISOString(),
                                createdBy: interaction.user.id
                            };
                            
                            shopData[guildId].push(newItem);
                            fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));
                            
                            await interaction.reply({ 
                                content: `✅ **Rôle temporaire ajouté !**\n\n⏰ **${role?.name}**\n💰 Prix: ${price}€\n📅 Durée: ${duration} jour(s)`, 
                                flags: 64 
                            });
                        } else {
                            await interaction.reply({ content: '❌ Valeurs invalides (prix: 1-999,999€, durée: 1-365 jours)', flags: 64 });
                        }
                        return;
                    }
                    
                    if (interaction.customId === 'perm_role_price_modal') {
                        const price = parseInt(interaction.fields.getTextInputValue('role_price'));
                        const roleId = interaction.fields.getTextInputValue('role_id');
                        
                        if (price >= 1 && price <= 999999) {
                            const fs = require('fs');
                            const path = require('path');
                            
                            const dataDir = path.join(__dirname, 'data');
                            if (!fs.existsSync(dataDir)) {
                                fs.mkdirSync(dataDir, { recursive: true });
                            }
                            
                            const shopPath = path.join(dataDir, 'shop.json');
                            let shopData = {};
                            try {
                                if (fs.existsSync(shopPath)) {
                                    shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
                                }
                            } catch (error) {
                                shopData = {};
                            }
                            
                            const guildId = interaction.guild.id;
                            if (!shopData[guildId]) shopData[guildId] = [];
                            
                            const role = interaction.guild.roles.cache.get(roleId);
                            const newItem = {
                                id: Date.now().toString(),
                                name: `Rôle: ${role?.name || 'Rôle'}`,
                                price: price,
                                roleId: roleId,
                                type: 'permanent_role',
                                createdAt: new Date().toISOString(),
                                createdBy: interaction.user.id
                            };
                            
                            shopData[guildId].push(newItem);
                            fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));
                            
                            await interaction.reply({ 
                                content: `✅ **Rôle permanent ajouté !**\n\n⭐ **${role?.name}**\n💰 Prix: ${price}€\n🔒 Permanent`, 
                                flags: 64 
                            });
                        } else {
                            await interaction.reply({ content: '❌ Prix invalide (1-999,999€)', flags: 64 });
                        }
                        return;
                    }
                    
                    // Modal pour créer un objet personnalisé
                    if (interaction.customId === 'shop_custom_object_modal') {
                        const name = interaction.fields.getTextInputValue('object_name');
                        const price = parseInt(interaction.fields.getTextInputValue('object_price'));
                        const description = interaction.fields.getTextInputValue('object_description') || 'Objet unique';
                        
                        if (price >= 1 && price <= 999999) {
                            const fs = require('fs');
                            const path = require('path');
                            
                            // Assurer que le dossier data existe
                            const dataDir = path.join(__dirname, 'data');
                            if (!fs.existsSync(dataDir)) {
                                fs.mkdirSync(dataDir, { recursive: true });
                            }
                            
                            const shopPath = path.join(dataDir, 'shop.json');
                            let shopData = {};
                            try {
                                if (fs.existsSync(shopPath)) {
                                    shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
                                }
                            } catch (error) {
                                console.log('Erreur lecture shop.json:', error);
                                shopData = {};
                            }
                            
                            const guildId = interaction.guild.id;
                            if (!shopData[guildId]) shopData[guildId] = [];
                            
                            const newItem = {
                                id: Date.now().toString(),
                                name: name,
                                price: price,
                                description: description,
                                type: 'custom_object',
                                createdAt: new Date().toISOString(),
                                createdBy: interaction.user.id
                            };
                            
                            shopData[guildId].push(newItem);
                            fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));
                            
                            await interaction.reply({ 
                                content: `✅ **Objet créé avec succès !**\n\n🎨 **${name}** - ${price}€\n📝 ${description}`, 
                                flags: 64 
                            });
                        } else {
                            await interaction.reply({ content: '❌ Prix invalide (1-999,999€)', flags: 64 });
                        }
                        return;
                    }
                    
                    // Modals style_backgrounds (images par style & rôle)
                    if (interaction.customId.startsWith('style_backgrounds_modal_') || interaction.customId.startsWith('style_backgrounds_default_modal_')) {
                        const LevelConfigHandler = require('./handlers/LevelConfigHandler');
                        const levelHandler = new LevelConfigHandler();
                        await levelHandler.handleStyleBackgroundsAction(interaction, interaction.customId);
                        return;
                    }

                    // Autres modals...
                    const MainRouterHandler = require('./handlers/MainRouterHandler');
                    const router = new MainRouterHandler(dataManager);
                    // Associer le client pour initialiser SecurityConfigHandler (nécessaire pour /config-verif-menu)
                    try { router.setClient(this.client); } catch {}
                    
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
                
                // Gestion des menus d'invitation/expulsion pour suites privées
                if (interaction.isUserSelectMenu() && (customId === 'suite_invite' || customId === 'suite_kick')) {
                    try {
                        const { guild, channel, user, values } = interaction;
                        const suites = require('fs').existsSync(require('path').join(__dirname, 'data', 'private_suites.json'))
                            ? JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'data', 'private_suites.json'), 'utf8'))
                            : {};
                        const guildSuites = suites[guild.id] || {};
                        const suiteRecord = Object.values(guildSuites).find(r => r.textChannelId === channel.id || (r.voiceChannelId && r.voiceChannelId === channel.id));
                        if (!suiteRecord) {
                            await interaction.reply({ content: '❌ Cette action n\'est pas disponible ici.', flags: 64 });
                            return;
                        }
                        if (suiteRecord.userId !== user.id) {
                            await interaction.reply({ content: '❌ Seul le propriétaire de la suite peut gérer les accès.', flags: 64 });
                            return;
                        }
                        const targetIds = values; // array of user IDs
                        const textChannel = await guild.channels.fetch(suiteRecord.textChannelId).catch(() => null);
                        const voiceChannel = suiteRecord.voiceChannelId ? await guild.channels.fetch(suiteRecord.voiceChannelId).catch(() => null) : null;
                        const updates = [];
                        if (customId === 'suite_invite') {
                            for (const uid of targetIds) {
                                try {
                                    if (textChannel) {
                                        await textChannel.permissionOverwrites.edit(uid, {
                                            ViewChannel: true,
                                            SendMessages: true,
                                            ReadMessageHistory: true
                                        });
                                    }
                                    if (voiceChannel) {
                                        await voiceChannel.permissionOverwrites.edit(uid, {
                                            ViewChannel: true,
                                            Connect: true,
                                            Speak: true
                                        });
                                    }
                                    updates.push(`<@${uid}> ✅`);
                                } catch (_) {}
                            }
                            await interaction.reply({ content: `✅ Invités: ${updates.join(', ')}`, flags: 64 });
                        } else {
                            for (const uid of targetIds) {
                                try {
                                    if (textChannel) {
                                        await textChannel.permissionOverwrites.delete(uid).catch(async () => {
                                            await textChannel.permissionOverwrites.edit(uid, { ViewChannel: false, SendMessages: false });
                                        });
                                    }
                                    if (voiceChannel) {
                                        await voiceChannel.permissionOverwrites.delete(uid).catch(async () => {
                                            await voiceChannel.permissionOverwrites.edit(uid, { ViewChannel: false, Connect: false });
                                        });
                                    }
                                    updates.push(`<@${uid}> 🚫`);
                                } catch (_) {}
                            }
                            await interaction.reply({ content: `✅ Expulsés: ${updates.join(', ')}`, flags: 64 });
                        }
                        return;
                    } catch (e) {
                        try { await interaction.reply({ content: '❌ Erreur lors de la gestion des accès.', flags: 64 }); } catch {}
                        return;
                    }
                }

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
                    customId === 'add_role_reward_select' ||
                    customId === 'style_backgrounds_style' ||
                    customId.startsWith('style_backgrounds_role_') ||
                    customId.startsWith('style_backgrounds_actions_')) {
                    
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
                            
                            if (!interaction.replied && !interaction.deferred) {
                                await interaction.update({
                                    content: `✅ Canal de notification défini sur ${channel.name}`,
                                    embeds: [],
                                    components: []
                                });
                            }
                            
                        } else if (customId === 'level_card_style') {
                            const style = interaction.values[0];
                            const levelManager = require('./utils/levelManager');
                            const config = levelManager.loadConfig();
                            config.notifications.cardStyle = style;
                            levelManager.saveConfig(config);
                            
                            if (!interaction.replied && !interaction.deferred) {
                                await interaction.update({
                                    content: `✅ Style de carte changé en **${style}**.`,
                                    embeds: [],
                                    components: []
                                });
                            }
                            // Pas de setTimeout - retour au menu sera fait manuellement
                            
                        } else if (customId === 'remove_role_reward') {
                            const level = interaction.values[0];
                            const levelManager = require('./utils/levelManager');
                            const config = levelManager.loadConfig();
                            
                            if (config.roleRewards && config.roleRewards[level]) {
                                delete config.roleRewards[level];
                                levelManager.saveConfig(config);
                                
                                if (!interaction.replied && !interaction.deferred) {
                                    await interaction.update({
                                        content: `✅ Récompense du niveau ${level} supprimée.`,
                                        embeds: [],
                                        components: []
                                    });
                                }
                                // Pas de setTimeout - retour au menu sera fait manuellement
                            } else {
                                if (!interaction.replied && !interaction.deferred) {
                                    await interaction.update({
                                        content: '❌ Récompense introuvable.',
                                        embeds: [],
                                        components: []
                                    });
                                }
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
                            
                        } else if (customId === 'style_backgrounds_style' || customId.startsWith('style_backgrounds_role_') || customId.startsWith('style_backgrounds_actions_')) {
                            await levelHandler.handleStyleBackgroundsAction(interaction, customId);
                            return;
                        } else {
                            const selectedValue = interaction.values[0];
                            
                            if (selectedValue === 'back_main') {
                                await levelHandler.handleLevelConfigMenu(interaction);
                            } else if (customId === 'notifications_config_menu') {
                                await this.handleNotificationConfigAction(interaction, selectedValue, levelHandler);
                            } else if (customId === 'role_rewards_config_menu') {
                                await this.handleRoleRewardsConfigAction(interaction, selectedValue, levelHandler);
                            } else if (customId === 'level_formula_config_menu') {
                                await levelHandler.handleLevelFormulaConfigAction(interaction, selectedValue);
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
                
                // === NOUVELLE CONFIGURATION ÉCONOMIQUE ===
                if (customId === 'economy_main_config') {
                    console.log('🎯 Menu économie principal');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleMainSelect(interaction);
                    return;
                }
                
                if (customId === 'economy_main_config_submenu') {
                    console.log('🎯 Menu économie submenu');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleMainSelect(interaction);
                    return;
                }
                
                if (customId === 'economy_actions_select') {
                    console.log('🎯 Sélection action économique');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleActionSelect(interaction);
                    return;
                }
                
                if (customId.startsWith('economy_action_config_')) {
                    console.log('🎯 Config paramètre action');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleActionConfigSelect(interaction);
                    return;
                }
                
                if (customId === 'economy_boutique_select') {
                    console.log('🎯 Sélection boutique');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleBoutiqueSelect(interaction);
                    return;
                }

                // Gestion des sélections de rôles pour la boutique (temporaire/permanent)
                if (customId === 'role_temp_select' || customId === 'role_perm_select') {
                    console.log('🎯 Sélection rôle boutique:', customId);
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleRoleSelect(interaction);
                    return;
                }

                if (customId === 'remises_karma_select') {
                    console.log('🎯 Sélection remises karma');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleRemisesSelect(interaction);
                    return;
                }

                // Routage pour achats boutique avec remises automatiques
                if (customId.startsWith('shop_purchase')) {
                    console.log('🎯 Routage achat boutique avec remises karma: shop_purchase');
                    await handleShopPurchase(interaction, dataManager);
                    return;
                }

                // Routage pour la commande /objet
                if (customId.startsWith('object_') ||
                    customId.startsWith('offer_user_select_') ||
                    customId.startsWith('confirm_delete_') ||
                    customId.startsWith('use_user_select_') ||
                    customId.startsWith('custom_message_modal_')) {
                    
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

                // Gestion des modals d'actions économiques (nouvelles versions séparées)
                if (customId.includes('_amounts_modal_') || customId.includes('_cooldown_modal_') || customId.includes('_karma_modal_')) {
                    console.log('🎯 Modal action config détecté:', customId);
                    console.log('🔍 Type interaction:', interaction.type, interaction.isModalSubmit());
                    
                    if (interaction.isModalSubmit()) {
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const handler = new EconomyConfigHandler(dataManager);
                        await handler.handleActionModal(interaction);
                    } else {
                        console.log('⚠️ Modal détecté mais pas de soumission');
                    }
                    return;
                }

                // Gestion des sélecteurs d'actions économiques (nouvelle méthode)
                if (interaction.isStringSelectMenu() && customId.includes('action_config_')) {
                    try {
                        console.log('🎯 Sélecteur action économique détecté:', customId);
                        const actionName = customId.replace('action_config_', '');
                        const selectedValue = interaction.values[0];
                        
                        if (selectedValue.endsWith('_modal_config')) {
                            const action = selectedValue.replace('_modal_config', '');
                            const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                            const handler = new EconomyConfigHandler(dataManager);
                            await handler.showActionModal(interaction, action);
                            return;
                        } else if (selectedValue === 'back_to_actions') {
                            const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                            const handler = new EconomyConfigHandler(dataManager);
                            await handler.showActionsMainMenu(interaction);
                            return;
                        }
                    } catch (error) {
                        console.error('❌ Erreur sélecteur action:', error);
                        if (!interaction.replied) {
                            await interaction.reply({
                                content: '❌ Erreur lors du traitement de la sélection.',
                                flags: 64
                            });
                        }
                    }
                    return;
                }

                // Gestion de la navigation spécifique d'actions
                if (interaction.isStringSelectMenu() && customId === 'action_select') {
                    try {
                        console.log('🎯 Sélection d\'action détectée:', interaction.values[0]);
                        const actionName = interaction.values[0];
                        
                        if (actionName.startsWith('action_config_')) {
                            const action = actionName.replace('action_config_', '');
                            const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                            const handler = new EconomyConfigHandler(dataManager);
                            await handler.showActionSpecificConfig(interaction, action);
                            return;
                        }
                    } catch (error) {
                        console.error('❌ Erreur sélection action:', error);
                        if (!interaction.replied) {
                            await interaction.reply({
                                content: '❌ Erreur lors du traitement de la sélection d\'action.',
                                flags: 64
                            });
                        }
                    }
                    return;
                }

                // Ce routage est géré plus haut dans le code - supprimé pour éviter la duplication

                // Ajouter handlers pour nouvelles fonctionnalités boutique
                if (customId === 'manage_objects_select') {
                    console.log('🎯 Sélection objet à modifier');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleObjetModification(interaction);
                    return;
                }

                if (customId === 'delete_articles_select') {
                    console.log('🎯 Sélection article à supprimer');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleArticleDelete(interaction);
                    return;
                }

                if (customId === 'edit_articles_select') {
                    console.log('🎯 Sélection article à modifier');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleEditArticleSelect(interaction);
                    return;
                }

                // Handlers pour nouvelles sections Daily et Messages
                if (customId === 'economy_daily_select') {
                    console.log('🎯 Sélection daily config');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleDailySelect(interaction);
                    return;
                }

                if (customId === 'economy_messages_select') {
                    console.log('🎯 Sélection messages config');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleMessagesSelect(interaction);
                    return;
                }

                if (customId === 'economy_karma_select') {
                    console.log('🎯 Sélection karma config');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleKarmaSelect(interaction);
                    return;
                }

                // Handlers pour les confirmations de reset karma
                if (customId === 'karma_reset_confirm' || customId === 'karma_reset_good_confirm' || customId === 'karma_reset_bad_confirm') {
                    console.log('🎯 Confirmation reset karma:', customId);
                    const value = interaction.values[0];
                    
                    if (value === 'cancel_reset') {
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.showKarmaMenu(interaction);
                        return;
                    } else if (value === 'confirm_reset') {
                        await handleKarmaResetComplete(interaction);
                        return;
                    } else if (value === 'confirm_reset_good') {
                        await handleKarmaResetGood(interaction);
                        return;
                    } else if (value === 'confirm_reset_bad') {
                        await handleKarmaResetBad(interaction);
                        return;
                    }
                }

                // Handler pour sélection jour reset hebdomadaire
                if (customId === 'karma_weekly_day_select') {
                    console.log('🎯 Sélection jour reset hebdomadaire');
                    const value = interaction.values[0];
                    
                    if (value === 'back_karma') {
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.showKarmaMenu(interaction);
                        return;
                    } else {
                        await handleKarmaWeeklyDaySelection(interaction, value);
                        return;
                    }
                }

                if (customId === 'karma_rewards_select') {
                    console.log('🎯 Sélection karma rewards');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleKarmaRewardsSelect(interaction);
                    return;
                }

                if (customId === 'manage_objects_select' || customId === 'delete_objects_select' || customId === 'modify_rewards_select' || 
                    customId === 'delete_reward_select' || customId === 'confirm_delete_reward' || customId === 'modify_discount_select' || 
                    customId === 'delete_discount_select' || customId === 'confirm_delete_discount') {
                    console.log('🎯 Sélection boutique/karma navigation');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    
                    if (interaction.values[0] === 'back_boutique') {
                        await economyHandler.showBoutiqueMenu(interaction);
                    } else if (interaction.values[0] === 'back_karma') {
                        await economyHandler.showKarmaMenu(interaction);
                    } else if (interaction.values[0] === 'back_remises') {
                        await economyHandler.showRemisesMenu(interaction);
                    } else if (customId === 'delete_objects_select') {
                        // Gérer la suppression d'un objet spécifique
                        await economyHandler.handleArticleDelete(interaction);
                    } else if (customId === 'manage_objects_select') {
                        // Gérer la modification d'un objet spécifique
                        await economyHandler.handleObjetModification(interaction);
                    } else if (customId === 'modify_rewards_select') {
                        // Gérer la modification des récompenses karma
                        await economyHandler.handleModifyRewardsSelect(interaction);
                    } else if (customId === 'delete_reward_select') {
                        // Gérer la sélection de récompense à supprimer
                        await economyHandler.handleDeleteRewardSelect(interaction);
                    } else if (customId === 'confirm_delete_reward') {
                        // Gérer la confirmation de suppression de récompense
                        await economyHandler.handleConfirmDeleteReward(interaction);
                    } else if (customId === 'modify_discount_select') {
                        // Gérer la sélection de remise karma à modifier
                        await economyHandler.handleModifyDiscountSelect(interaction);
                    } else if (customId === 'delete_discount_select') {
                        // Gérer la sélection de remise karma à supprimer
                        await economyHandler.handleDeleteDiscountSelect(interaction);
                    } else if (customId === 'confirm_delete_discount') {
                        // Gérer la confirmation de suppression de remise karma
                        await economyHandler.handleConfirmDeleteDiscount(interaction);
                    }
                    return;
                }

                // Routage via MainRouter pour le reste - UNIQUEMENT si pas déjà traité
                if (!interaction.replied && !interaction.deferred) {
                    // Vérifier si l'interaction a été traitée par le nouveau handler économique
                    const economyHandled = customId === 'economy_main_config' ||
                                         customId === 'economy_actions_select' ||
                                         customId.startsWith('economy_action_config_') ||
                                         customId === 'economy_boutique_select' ||
                                         customId === 'economy_daily_select' ||
                                         customId === 'economy_messages_select' ||
                                         customId === 'remises_karma_select' ||
                                         customId === 'role_temp_select' ||
                                         customId === 'role_perm_select' ||
                                         customId === 'manage_objects_select' ||
                                         customId === 'delete_articles_select' ||
                                         customId.startsWith('aouv_');
                    
                    if (!economyHandled) {
                        console.log('🔄 Routage vers MainRouter pour:', customId);
                        const handled = await router.handleInteraction(interaction);
                        
                        if (!handled && !interaction.replied && !interaction.deferred) {
                            await interaction.reply({ 
                                content: '❌ Cette interaction n\'est pas encore implémentée.', 
                                flags: 64 
                            });
                        }
                    } else {
                        console.log('✅ Interaction économique déjà traitée, ignorée par MainRouter');
                    }
                }

                // === AOUV BUTTONS — Gestion des boutons Action/Vérité ===
                if (customId === 'aouv_btn_action' || customId === 'aouv_btn_verite') {
                    console.log('🎯 Bouton AouV cliqué:', customId);
                    const aouvCommand = require('./commands/aouv');
                    await aouvCommand.handleButton(interaction, dataManager);
                    return;
                }

                // === AOUV CONFIG — indépendant ===
                if (customId === 'aouv_main_select') {
                    console.log('🎯 Sélection AouV');
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvSelect(interaction);
                    return;
                }

                // ==== AOUV — selects de type pour pagination ====
                if (customId === 'aouv_prompt_edit_kind_select') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptEditKindSelect(interaction);
                    return;
                }

                if (customId === 'aouv_prompt_remove_kind_select') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptRemoveKindSelect(interaction);
                    return;
                }

                if (customId === 'aouv_prompt_list_custom_kind_select') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptListCustomKindSelect(interaction);
                    return;
                }

                if (customId === 'aouv_prompt_list_base_kind_select') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptListBaseKindSelect(interaction);
                    return;
                }

                if (customId === 'aouv_prompt_override_kind_select') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptOverrideKindSelect(interaction);
                    return;
                }

                // ==== AOUV — désactivation globale via sélecteur ====
                if (customId === 'aouv_disable_all_select') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvDisableAllSelect(interaction);
                    return;
                }

                // ==== AOUV NSFW — selects de type pour pagination ====
                if (customId === 'aouv_nsfw_prompt_edit_kind_select') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwPromptEditKindSelect(interaction);
                    return;
                }

                if (customId === 'aouv_nsfw_prompt_remove_kind_select') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwPromptRemoveKindSelect(interaction);
                    return;
                }

                if (customId === 'aouv_nsfw_prompt_list_custom_kind_select') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwPromptListCustomKindSelect(interaction);
                    return;
                }

                if (customId === 'aouv_nsfw_disable_all_select') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwDisableAllSelect(interaction);
                    return;
                }

                // ==== AOUV — selects sur listes paginées ====
                if (customId === 'aouv_prompt_remove_select_action') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptRemoveSelect(interaction, 'action');
                    return;
                }

                if (customId === 'aouv_prompt_remove_select_truth') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptRemoveSelect(interaction, 'verite');
                    return;
                }

                if (customId === 'aouv_prompt_override_select_action') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptOverrideSelect(interaction, 'action');
                    return;
                }

                if (customId === 'aouv_prompt_override_select_truth') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptOverrideSelect(interaction, 'verite');
                    return;
                }

                if (customId === 'aouv_nsfw_prompt_remove_select_action') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwPromptRemoveSelect(interaction, 'action');
                    return;
                }

                if (customId === 'aouv_nsfw_prompt_remove_select_truth') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwPromptRemoveSelect(interaction, 'verite');
                    return;
                }

                // ==== AOUV — pagination boutons ====
                if (customId.startsWith('aouv_prompt_edit_list_')) {
                    const parts = String(customId || '').split('_');
                    const kind = parts[parts.length - 3];
                    const page = parseInt(parts[parts.length - 1], 10) || 1;
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.showAouvPromptEditListPaged(interaction, kind, page);
                    return;
                }

                if (customId.startsWith('aouv_prompt_remove_list_')) {
                    const parts = String(customId || '').split('_');
                    const kind = parts[parts.length - 3];
                    const page = parseInt(parts[parts.length - 1], 10) || 1;
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.showAouvPromptRemoveListPaged(interaction, kind, page);
                    return;
                }

                if (customId.startsWith('aouv_prompt_list_custom_')) {
                    const parts = String(customId || '').split('_');
                    const kind = parts[parts.length - 3];
                    const page = parseInt(parts[parts.length - 1], 10) || 1;
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.showAouvPromptListCustomPaged(interaction, kind, page);
                    return;
                }

                if (customId.startsWith('aouv_prompt_list_base_')) {
                    const parts = String(customId || '').split('_');
                    const kind = parts[parts.length - 3];
                    const page = parseInt(parts[parts.length - 1], 10) || 1;
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.showAouvPromptListBasePaged(interaction, kind, page);
                    return;
                }

                if (customId.startsWith('aouv_prompt_override_list_')) {
                    const parts = String(customId || '').split('_');
                    const kind = parts[parts.length - 3];
                    const page = parseInt(parts[parts.length - 1], 10) || 1;
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.showAouvPromptOverrideBaseListPaged(interaction, kind, page);
                    return;
                }

                if (customId.startsWith('aouv_nsfw_prompt_edit_list_')) {
                    const parts = String(customId || '').split('_');
                    const kind = parts[parts.length - 3];
                    const page = parseInt(parts[parts.length - 1], 10) || 1;
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.showAouvNsfwPromptEditListPaged(interaction, kind, page);
                    return;
                }

                if (customId.startsWith('aouv_nsfw_prompt_remove_list_')) {
                    const parts = String(customId || '').split('_');
                    const kind = parts[parts.length - 3];
                    const page = parseInt(parts[parts.length - 1], 10) || 1;
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.showAouvNsfwPromptRemoveListPaged(interaction, kind, page);
                    return;
                }

                if (customId.startsWith('aouv_nsfw_prompt_list_custom_')) {
                    const parts = String(customId || '').split('_');
                    const kind = parts[parts.length - 3];
                    const page = parseInt(parts[parts.length - 1], 10) || 1;
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.showAouvNsfwPromptListCustomPaged(interaction, kind, page);
                    return;
                }

                if (customId === 'aouv_channel_add') {
                    console.log('🎯 AouV ajout salon');
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvChannelAdd(interaction);
                    return;
                }

                if (customId === 'aouv_channel_remove') {
                    console.log('🎯 AouV retrait salon');
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvChannelRemove(interaction);
                    return;
                }

                if (customId === 'aouv_nsfw_channel_add') {
                    console.log('🎯 AouV ajout salon NSFW');
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwChannelAdd(interaction);
                    return;
                }

                if (customId === 'aouv_nsfw_channel_remove') {
                    console.log('🎯 AouV retrait salon NSFW');
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwChannelRemove(interaction);
                    return;
                }

                if (customId === 'aouv_prompt_edit_select_action') {
                    console.log('🎯 AouV edit prompt (Action)');
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptEditSelect(interaction, 'action');
                    return;
                }

                if (customId === 'aouv_prompt_edit_select_truth') {
                    console.log('🎯 AouV edit prompt (Vérité)');
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptEditSelect(interaction, 'verite');
                    return;
                }

                if (customId === 'aouv_nsfw_prompt_edit_select_action') {
                    console.log('🎯 AouV edit prompt NSFW (Action)');
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwPromptEditSelect(interaction, 'action');
                    return;
                }

                if (customId === 'aouv_nsfw_prompt_edit_select_truth') {
                    console.log('🎯 AouV edit prompt NSFW (Vérité)');
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwPromptEditSelect(interaction, 'verite');
                    return;
                }

                // === AOUV MODALS ===
                if (interaction.customId === 'aouv_prompt_add_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptAddModal(interaction);
                    return;
                }

                if (interaction.customId === 'aouv_prompt_edit_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptEditModal(interaction);
                    return;
                }

                if (interaction.customId === 'aouv_prompt_remove_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptRemoveModal(interaction);
                    return;
                }

                if (interaction.customId === 'aouv_prompt_disable_base_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptBaseModal(interaction, true);
                    return;
                }

                if (interaction.customId === 'aouv_prompt_enable_base_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptBaseModal(interaction, false);
                    return;
                }

                if (interaction.customId === 'aouv_prompt_list_base_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptListBaseModal(interaction);
                    return;
                }

                if (interaction.customId === 'aouv_prompt_override_base_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptOverrideModal(interaction);
                    return;
                }

                if (interaction.customId === 'aouv_prompt_reset_override_base_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvPromptResetOverrideModal(interaction);
                    return;
                }

                // === AOUV NSFW MODALS ===
                if (interaction.customId === 'aouv_nsfw_prompt_add_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwPromptAddModal(interaction);
                    return;
                }

                if (interaction.customId === 'aouv_nsfw_prompt_edit_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwPromptEditModal(interaction);
                    return;
                }

                if (interaction.customId === 'aouv_nsfw_prompt_remove_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwPromptRemoveModal(interaction);
                    return;
                }

                if (interaction.customId === 'aouv_nsfw_prompt_disable_base_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwPromptBaseModal(interaction, true);
                    return;
                }

                if (interaction.customId === 'aouv_nsfw_prompt_enable_base_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwPromptBaseModal(interaction, false);
                    return;
                }

                if (interaction.customId === 'aouv_nsfw_prompt_list_base_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwPromptListBaseModal(interaction);
                    return;
                }

                if (interaction.customId === 'aouv_nsfw_prompt_override_base_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwPromptOverrideModal(interaction);
                    return;
                }

                if (interaction.customId === 'aouv_nsfw_prompt_reset_override_base_modal') {
                    const AouvConfigHandler = require('./handlers/AouvConfigHandler');
                    const aouvHandler = new AouvConfigHandler(dataManager);
                    await aouvHandler.handleAouvNsfwPromptResetOverrideModal(interaction);
                    return;
                }

                // Gestion des sélecteurs et modals style_backgrounds_*
                if (interaction.customId === 'style_backgrounds_style' && interaction.values && interaction.values.length) {
                    const style = interaction.values[0];
                    const roleRow = new ActionRowBuilder().addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId(`style_backgrounds_role_${style}`)
                            .setPlaceholder('Sélectionner un rôle à mapper...')
                            .setMinValues(1)
                            .setMaxValues(1)
                    );
                    const editRow = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`style_backgrounds_actions_${style}`)
                            .setPlaceholder('Choisir une action...')
                            .addOptions([
                                { label: 'Définir image par défaut', value: 'set_default' },
                                { label: 'Supprimer image par défaut', value: 'remove_default' },
                                { label: 'Lister mappings', value: 'list' },
                                { label: 'Retour', value: 'back' }
                            ])
                    );
                    await interaction.update({
                        content: `Style sélectionné: ${style}\n— Choisissez un rôle à associer, ou une action.`,
                        embeds: [],
                        components: [roleRow, editRow]
                    });
                    return;
                }

                if (interaction.customId.startsWith('style_backgrounds_role_')) {
                    const style = interaction.customId.replace('style_backgrounds_role_', '');
                    const roleId = interaction.values?.[0];
                    const role = interaction.guild.roles.cache.get(roleId);
                    const modal = new ModalBuilder()
                        .setCustomId(`style_backgrounds_modal_${style}_${roleId}`)
                        .setTitle(`Image pour ${role?.name || roleId} (${style})`);
                    const input = new TextInputBuilder()
                        .setCustomId('image_path_or_url')
                        .setLabel('URL ou chemin local (ex: assets/styles/.../femme.png)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setMaxLength(512);
                    modal.addComponents(new ActionRowBuilder().addComponents(input));
                    await interaction.showModal(modal);
                    return;
                }

                if (interaction.isModalSubmit && interaction.isModalSubmit() && interaction.customId.startsWith('style_backgrounds_modal_')) {
                    const parts = interaction.customId.split('_');
                    const style = parts[3];
                    const roleId = parts[4];
                    const imageValue = interaction.fields.getTextInputValue('image_path_or_url');
                    const role = interaction.guild.roles.cache.get(roleId);
                    const roleKey = require('./utils/styleBackgrounds').normalizeRoleName(role?.name || roleId);
                    config.styleBackgrounds = config.styleBackgrounds || {};
                    config.styleBackgrounds[style] = config.styleBackgrounds[style] || { default: '', byRole: {} };
                    config.styleBackgrounds[style].byRole[roleKey] = imageValue;
                    levelManager.saveConfig(config);
                    await interaction.reply({ content: `✅ Image associée au rôle ${role?.name || roleId} pour le style ${style}.`, ephemeral: true });
                    return;
                }

                if (interaction.customId.startsWith('style_backgrounds_actions_') && interaction.values && interaction.values.length) {
                    const style = interaction.customId.replace('style_backgrounds_actions_', '');
                    const action = interaction.values[0];
                    if (action === 'set_default') {
                        const modal = new ModalBuilder()
                            .setCustomId(`style_backgrounds_default_modal_${style}`)
                            .setTitle(`Image par défaut (${style})`);
                        const input = new TextInputBuilder()
                            .setCustomId('default_image')
                            .setLabel('URL ou chemin local pour l\'image par défaut')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setMaxLength(512);
                        modal.addComponents(new ActionRowBuilder().addComponents(input));
                        await interaction.showModal(modal);
                        return;
                    }
                    if (action === 'remove_default') {
                        config.styleBackgrounds = config.styleBackgrounds || {};
                        config.styleBackgrounds[style] = config.styleBackgrounds[style] || { default: '', byRole: {} };
                        config.styleBackgrounds[style].default = '';
                        levelManager.saveConfig(config);
                        await interaction.update({ content: `🗑️ Image par défaut supprimée pour ${style}.`, embeds: [], components: [] });
                        return;
                    }
                    if (action === 'list') {
                        const styleCfg = (config.styleBackgrounds || {})[style] || { default: '', byRole: {} };
                        const list = [
                            `Par défaut: ${styleCfg.default || '—'}`,
                            ...Object.entries(styleCfg.byRole || {}).map(([k, v]) => `• ${k} → ${v}`)
                        ].join('\n');
                        await interaction.update({ content: `📋 Mappings pour ${style} :\n${list}`, embeds: [], components: [] });
                        return;
                    }
                    if (action === 'back') {
                        await levelHandler.showNotificationsConfig({ ...interaction, update: (o) => interaction.update(o) });
                        return;
                    }
                }

                if (interaction.isModalSubmit && interaction.isModalSubmit() && interaction.customId.startsWith('style_backgrounds_default_modal_')) {
                    const style = interaction.customId.replace('style_backgrounds_default_modal_', '');
                    const imageValue = interaction.fields.getTextInputValue('default_image');
                    config.styleBackgrounds = config.styleBackgrounds || {};
                    config.styleBackgrounds[style] = config.styleBackgrounds[style] || { default: '', byRole: {} };
                    config.styleBackgrounds[style].default = imageValue;
                    levelManager.saveConfig(config);
                    await interaction.reply({ content: `✅ Image par défaut définie pour le style ${style}.`, ephemeral: true });
                    return;
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

            // Avantage booster: multiplicateur de récompense messages
            let amount = guildConfig.amount;
            try {
                const member = await message.guild.members.fetch(userId).catch(() => null);
                const isBooster = !!(member?.premiumSince || member?.premiumSinceTimestamp);
                if (isBooster) {
                    amount = Math.round(amount * 1.5);
                }
            } catch {}

            const user = await dataManager.getUser(userId, guildId);
            user.balance = (user.balance || 1000) + amount;
            user.messageCount = (user.messageCount || 0) + 1;

            await dataManager.updateUser(userId, guildId, user);

            console.log(`💰 ${message.author.tag} a gagné ${amount}€ en envoyant un message`);
            
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

            // Enforcer le mode NSFW si activé
            if (autoThreadConfig.nsfw === true && message.channel.nsfw !== true) {
                return;
            }
            
            // Générer le nom du thread
            let threadNameTemplate = autoThreadConfig.threadName || 'Discussion - {user}';
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
            
            // Déterminer la durée d'archivage
            let archiveDuration = parseInt(autoThreadConfig.archiveTime) || 60;
            
            // Si mode permanent, utiliser la durée maximale Discord (7 jours = 10080 minutes)
            if (autoThreadConfig.permanentThreads) {
                archiveDuration = 10080; // 7 jours (maximum Discord)
            }
            
            const thread = await message.startThread({
                name: threadName,
                autoArchiveDuration: archiveDuration,
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
            
            // Si mode permanent, surveiller ce thread pour le réactiver si archivé
            if (autoThreadConfig.permanentThreads) {
                this.monitorPermanentThread(thread.id, guildId);
            }
            
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
                member: message.member,
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

            // Skip bots entirely for voice XP
            const member = newState.member || oldState.member;
            if (!member || (member.user && member.user.bot)) {
                return;
            }
            
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
        
        // Skip if the member is a bot (safety net)
        const cachedMember = guild.members.cache.get(userId);
        if (cachedMember?.user?.bot) {
            console.log(`🤖 Ignorer le suivi XP vocal pour un bot (${userId})`);
            return;
        }
        
        // Si déjà en cours, arrêter l'ancien
        if (this.voiceIntervals.has(userId)) {
            clearInterval(this.voiceIntervals.get(userId));
        }
        
        const config = levelManager.loadConfig();
        const interval = setInterval(async () => {
            try {
                const result = await levelManager.addVoiceXP(userId, guild.id, {
                    user: { username: cachedMember?.user?.username || `User${userId}`, bot: false },
                    member: cachedMember,
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
        const { ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, RoleSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
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

            case 'notification_channel':
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

            case 'style_backgrounds':
                {
                    const styles = ['holographic','gamer','amour','sensuel','futuristic','elegant','minimal','gaming'];
                    const styleSelect = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('style_backgrounds_style')
                            .setPlaceholder('Choisir un style...')
                            .addOptions(styles.map(s => ({ label: s, value: s })))
                    );
                    await interaction.update({
                        content: '🖼️ Sélectionnez un style pour configurer les images (par rôle et par défaut):',
                        embeds: [],
                        components: [styleSelect]
                    });
                }
                break;

            default:
                await interaction.reply({
                    content: '❌ Action non reconnue.',
                    flags: 64
                });
        }

        // Gestion des sélecteurs et modals style_backgrounds_*
        if (interaction.customId === 'style_backgrounds_style' && interaction.values && interaction.values.length) {
            const style = interaction.values[0];
            const roleRow = new ActionRowBuilder().addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId(`style_backgrounds_role_${style}`)
                    .setPlaceholder('Sélectionner un rôle à mapper...')
                    .setMinValues(1)
                    .setMaxValues(1)
            );
            const editRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`style_backgrounds_actions_${style}`)
                    .setPlaceholder('Choisir une action...')
                    .addOptions([
                        { label: 'Définir image par défaut', value: 'set_default' },
                        { label: 'Supprimer image par défaut', value: 'remove_default' },
                        { label: 'Lister mappings', value: 'list' },
                        { label: 'Retour', value: 'back' }
                    ])
            );
            await interaction.update({
                content: `Style sélectionné: ${style}\n— Choisissez un rôle à associer, ou une action.`,
                embeds: [],
                components: [roleRow, editRow]
            });
            return;
        }

        if (interaction.customId.startsWith('style_backgrounds_role_')) {
            const style = interaction.customId.replace('style_backgrounds_role_', '');
            const roleId = interaction.values?.[0];
            const role = interaction.guild.roles.cache.get(roleId);
            const modal = new ModalBuilder()
                .setCustomId(`style_backgrounds_modal_${style}_${roleId}`)
                .setTitle(`Image pour ${role?.name || roleId} (${style})`);
            const input = new TextInputBuilder()
                .setCustomId('image_path_or_url')
                .setLabel('URL ou chemin local (ex: assets/styles/.../femme.png)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(512);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
            return;
        }

        if (interaction.isModalSubmit && interaction.isModalSubmit() && interaction.customId.startsWith('style_backgrounds_modal_')) {
            const parts = interaction.customId.split('_');
            const style = parts[3];
            const roleId = parts[4];
            const imageValue = interaction.fields.getTextInputValue('image_path_or_url');
            const role = interaction.guild.roles.cache.get(roleId);
            const roleKey = require('./utils/styleBackgrounds').normalizeRoleName(role?.name || roleId);
            config.styleBackgrounds = config.styleBackgrounds || {};
            config.styleBackgrounds[style] = config.styleBackgrounds[style] || { default: '', byRole: {} };
            config.styleBackgrounds[style].byRole[roleKey] = imageValue;
            levelManager.saveConfig(config);
            await interaction.reply({ content: `✅ Image associée au rôle ${role?.name || roleId} pour le style ${style}.`, ephemeral: true });
            return;
        }

        if (interaction.customId.startsWith('style_backgrounds_actions_') && interaction.values && interaction.values.length) {
            const style = interaction.customId.replace('style_backgrounds_actions_', '');
            const action = interaction.values[0];
            if (action === 'set_default') {
                const modal = new ModalBuilder()
                    .setCustomId(`style_backgrounds_default_modal_${style}`)
                    .setTitle(`Image par défaut (${style})`);
                const input = new TextInputBuilder()
                    .setCustomId('default_image')
                    .setLabel('URL ou chemin local pour l\'image par défaut')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(512);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
                return;
            }
            if (action === 'remove_default') {
                config.styleBackgrounds = config.styleBackgrounds || {};
                config.styleBackgrounds[style] = config.styleBackgrounds[style] || { default: '', byRole: {} };
                config.styleBackgrounds[style].default = '';
                levelManager.saveConfig(config);
                await interaction.update({ content: `🗑️ Image par défaut supprimée pour ${style}.`, embeds: [], components: [] });
                return;
            }
            if (action === 'list') {
                const styleCfg = (config.styleBackgrounds || {})[style] || { default: '', byRole: {} };
                const list = [
                    `Par défaut: ${styleCfg.default || '—'}`,
                    ...Object.entries(styleCfg.byRole || {}).map(([k, v]) => `• ${k} → ${v}`)
                ].join('\n');
                await interaction.update({ content: `📋 Mappings pour ${style} :\n${list}`, embeds: [], components: [] });
                return;
            }
            if (action === 'back') {
                await levelHandler.showNotificationsConfig({ ...interaction, update: (o) => interaction.update(o) });
                return;
            }
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
        const karmaDiscountsData = await dataManager.loadData('karma_discounts', {});
        const shopItems = shopData[guildId] || [];

        // Trouver l'objet sélectionné
        let item;
        if (itemId.startsWith('shop_item_')) {
            const indexMatch = itemId.match(/shop_item_(\d+)_/);
            if (indexMatch) {
                const itemIndex = parseInt(indexMatch[1]);
                item = shopItems[itemIndex];
            }
        } else {
            item = shopItems.find(i => (i.id || shopItems.indexOf(i)).toString() === itemId);
        }
        
        if (!item) {
            return await interaction.reply({
                content: '❌ Objet introuvable dans la boutique.',
                flags: 64
            });
        }

        // Calculer la réputation (karma net = charme + perversion négative)
        const userKarmaNet = (userData.goodKarma || 0) + (userData.badKarma || 0);
        let discountPercent = 0;
        
        const guildDiscounts = karmaDiscountsData[guildId] || [];
        if (guildDiscounts.length > 0) {
            const applicableDiscount = guildDiscounts
                .filter(discount => userKarmaNet >= discount.karmaMin)
                .sort((a, b) => b.karmaMin - a.karmaMin)[0];
            discountPercent = applicableDiscount ? applicableDiscount.percentage : 0;
        }

        // Calculer le prix final avec remise
        const originalPrice = item.price;
        const finalPrice = discountPercent > 0 ? 
            Math.floor(originalPrice * (100 - discountPercent) / 100) : originalPrice;

        // Vérifier solde
        if (userData.balance < finalPrice) {
            const missingAmount = finalPrice - userData.balance;
            return await interaction.reply({
                content: `❌ **Solde insuffisant !**\n\n💰 Prix: ${finalPrice}💋 ${discountPercent > 0 ? `(remise ${discountPercent}% appliquée)` : ''}\n💳 Votre solde: ${userData.balance}💋\n❌ Manque: ${missingAmount}💋`,
                flags: 64
            });
        }

        // Déduire
        userData.balance -= finalPrice;

        // Ajouter inventaire
        if (!userData.inventory) userData.inventory = [];
        const uniqueId = item.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${userId.slice(-4)}`;
        const inventoryItem = {
            id: uniqueId,
            name: item.name,
            description: item.description || 'Objet de la boutique',
            type: item.type || 'custom_object',
            price: finalPrice,
            purchaseDate: new Date().toISOString(),
            from: 'shop'
        };

        // Gestion rôles boutique existants
        if ((item.type === 'temporary_role' || item.type === 'temp_role') && item.roleId && item.duration) {
            inventoryItem.roleId = item.roleId;
            inventoryItem.duration = item.duration;
            inventoryItem.expiresAt = new Date(Date.now() + (item.duration * 24 * 60 * 60 * 1000)).toISOString();
        } else if (item.type === 'permanent_role' && item.roleId) {
            inventoryItem.roleId = item.roleId;
        }

        // Gestion nouvelles suites privées
        const member = await interaction.guild.members.fetch(userId);
        const { createPrivateSuite, scheduleExpiry } = require('./utils/privateSuiteManager');
        if (item.type === 'private_24h') {
            const rec = await createPrivateSuite(interaction, member, { durationDays: 1 });
            scheduleExpiry(interaction.client, rec);
            inventoryItem.privateSuiteId = rec.id;
            inventoryItem.type = 'private_suite';
            inventoryItem.expiresAt = rec.expiresAt;
        } else if (item.type === 'private_monthly') {
            const rec = await createPrivateSuite(interaction, member, { durationDays: 30 });
            scheduleExpiry(interaction.client, rec);
            inventoryItem.privateSuiteId = rec.id;
            inventoryItem.type = 'private_suite';
            inventoryItem.expiresAt = rec.expiresAt;
        } else if (item.type === 'private_permanent') {
            const rec = await createPrivateSuite(interaction, member, { durationDays: null });
            inventoryItem.privateSuiteId = rec.id;
            inventoryItem.type = 'private_suite_permanent';
        }

        userData.inventory.push(inventoryItem);
        await dataManager.updateUser(userId, guildId, userData);

        // Effets visibles
        let effectMessage = '';
        if ((item.type === 'temporary_role' || item.type === 'temp_role') && item.roleId) {
            try {
                const role = await interaction.guild.roles.fetch(item.roleId);
                if (role) {
                    await interaction.member.roles.add(role);
                    effectMessage = `\n👤 Rôle **${role.name}** attribué pour ${item.duration} jour${item.duration > 1 ? 's' : ''} !`;
                    // Programmer la suppression avec le client
                    setTimeout(async () => {
                        try {
                            const client = interaction.client;
                            const guild = client.guilds.cache.get(interaction.guild.id) || await client.guilds.fetch(interaction.guild.id);
                            const memberToUpdate = await guild.members.fetch(userId);
                            await memberToUpdate.roles.remove(role, 'Expiration rôle temporaire (boutique)');
                        } catch (_) {}
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
        } else if (item.type === 'private_24h' || item.type === 'private_monthly' || item.type === 'private_permanent') {
            effectMessage = '\n🔒 Suite privée créée: 1 rôle + 2 salons (🔞 texte NSFW + 🎙️ vocal)';
        } else if (item.type === 'custom_object' || item.type === 'custom' || item.type === 'text') {
            effectMessage = '\n🎁 Objet personnalisé acheté !';
        } else {
            effectMessage = '\n📦 Objet ajouté à votre inventaire !';
        }

        // Confirmation
        let confirmMessage = `✅ **Achat réussi !**\n\n🛒 **${item.name}**\n💰 Prix payé: **${finalPrice}💋**`;
        if (discountPercent > 0) {
            const savedAmount = originalPrice - finalPrice;
            confirmMessage += `\n💸 Prix original: ~~${originalPrice}💋~~\n🎯 Remise réputation (${discountPercent}%): **-${savedAmount}💋**\n⚖️ Votre réputation 🥵: ${userKarmaNet}`;
        }
        confirmMessage += `\n💳 Nouveau solde: **${userData.balance}💋**${effectMessage}`;

        await interaction.reply({ content: confirmMessage, flags: 64 });
        console.log(`🛒 ${interaction.user.tag} a acheté "${item.name}" pour ${finalPrice} (remise: ${discountPercent}%)`);

    } catch (error) {
        console.error('❌ Erreur handleShopPurchase:', error);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Erreur lors de l\'achat.', flags: 64 });
          }
        } catch {}
    }
}

const app = new RenderSolutionBot();

// Configurer la sauvegarde d'urgence avant la fin du processus
console.log('🛡️ Configuration du système de sauvegarde d\'urgence...');

// Handler de sauvegarde d'urgence unifié
const emergencyBackupHandler = async (signal) => {
    console.log(`🚨 Signal ${signal} reçu - Sauvegarde d'urgence en cours...`);
    
    try {
        // Sauvegarde d'urgence via deployment manager
        await deploymentManager.emergencyBackup();
        console.log('✅ Sauvegarde d\'urgence terminée');
    } catch (error) {
        console.error('❌ Erreur sauvegarde d\'urgence:', error);
    }
    
    // Fermer proprement
    if (app.client) {
        await app.client.destroy();
        console.log('🔌 Client Discord fermé');
    }
    
    console.log('👋 Arrêt du bot terminé');
    process.exit(0);
};

// Configurer les handlers pour tous les signaux d'arrêt
process.on('SIGTERM', () => emergencyBackupHandler('SIGTERM'));
process.on('SIGINT', () => emergencyBackupHandler('SIGINT'));
process.on('beforeExit', () => emergencyBackupHandler('beforeExit'));

// Handler pour les erreurs non gérées avec sauvegarde
process.on('unhandledRejection', async (error) => {
    console.error('❌ Erreur non gérée détectée:', error);
    console.log('🚨 Déclenchement sauvegarde d\'urgence...');
    
    try {
        await deploymentManager.emergencyBackup();
        console.log('✅ Sauvegarde d\'urgence après erreur terminée');
    } catch (backupError) {
        console.error('❌ Échec sauvegarde d\'urgence:', backupError);
    }
});

console.log('✅ Système de sauvegarde d\'urgence configuré');

module.exports = { RenderSolutionBot, handleShopPurchase };
