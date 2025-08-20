/**
 * GESTIONNAIRE DE DONNÉES CENTRALISÉ
 * Système de données modulaire par commande
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const dataHooks = require('../utils/dataHooks');

class DataManager {
    constructor() {
        this.dataPath = path.join(__dirname, '../data');
        this.ensureDataDirectory();
        
        // Cache en mémoire pour performances
        this.cache = new Map();
        
        // MongoDB connection
        this.db = null;
        this.mongoClient = null;
        
        // Types de données par commande
        this.dataTypes = {
            // Système économie
            'users': 'users.json',
            'economy': 'economy.json',
            'actions': 'actions.json',
            'shop': 'shop.json',
            'daily': 'daily.json',
            'daily_cooldowns': 'daily_cooldowns.json',
            'metrics': 'metrics.json',
            
            // Système level - AJOUTÉ
            'level_users': 'level_users.json',
            'level_config': 'level_config.json',
            
            // Système confession
            'confessions': path.join('logs', 'confessions.json'),
            
            // Système comptage
            'counting': 'counting.json',
            
            // Configuration
            'config': 'config.json',
            'staff_config': 'staff_config.json',
            
            // Récompenses messages
            'message_rewards': 'message_rewards.json',
            
            // Stats utilisateur
            'user_stats': 'user_stats.json',
            
            // Cooldowns système
            'cooldowns': 'cooldowns.json',
            
            // Configuration karma personnalisé
            'karma_config': 'karma_config.json',
            'karma_discounts': 'karma_discounts.json',

            // Moderation
            'warnings': 'warnings.json',
            'moderation_config': 'moderation_config.json',
            'moderation_state': 'moderation_state.json',
            'logs_config': 'logs_config.json',
            // Snapshots de rôles pour logs
            'member_roles': 'member_roles.json',
            // Historique cross-serveur
            'global_moderation_history': 'global_moderation_history.json',
            // Configuration sécurité
            'security_config': 'security_config.json'
        };

        // Initialiser le LevelBackupManager
        this.initializeLevelBackup();
        
        // Initialiser MongoDB
        this.initializeMongoDB();
    }

    /**
     * Initialise la connexion MongoDB
     */
    async initializeMongoDB() {
        try {
            const username = process.env.MONGODB_USERNAME;
            const password = process.env.MONGODB_PASSWORD;
            let clusterUrl = process.env.MONGODB_CLUSTER_URL;
            
            if (!username || !password || !clusterUrl) {
                console.log('⚠️ Variables d\'environnement MongoDB manquantes - utilisation du mode JSON uniquement');
                console.log('   Pour utiliser le système de bump, configurez:');
                console.log('   - MONGODB_USERNAME');
                console.log('   - MONGODB_PASSWORD');
                console.log('   - MONGODB_CLUSTER_URL');
                return;
            }
            
            // Nettoyer l'URL du cluster
            if (clusterUrl.includes('mongodb+srv://')) {
                const match = clusterUrl.match(/@([^\/\?]+)/);
                if (match) {
                    clusterUrl = match[1];
                }
            }
            
            // Construire la chaîne de connexion
            const connectionString = `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${clusterUrl}/bagbot?retryWrites=true&w=majority`;
            
            console.log('🔄 Connexion à MongoDB...');
            this.mongoClient = new MongoClient(connectionString, {
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000,
                maxPoolSize: 10
            });
            
            await this.mongoClient.connect();
            this.db = this.mongoClient.db('bagbot');
            
            console.log('✅ Connexion MongoDB établie');
            
        } catch (error) {
            console.error('❌ Erreur connexion MongoDB:', error.message);
            console.log('⚠️ Fonctionnement en mode JSON uniquement');
        }
    }

    // Initialiser le système de sauvegarde level
    initializeLevelBackup() {
        try {
            const LevelBackupManager = require('../utils/levelBackupManager');
            this.levelBackupManager = new LevelBackupManager();
            console.log('✅ LevelBackupManager initialisé');
        } catch (error) {
            console.error('❌ Erreur initialisation LevelBackupManager:', error);
            this.levelBackupManager = null;
        }
    }

    ensureDataDirectory() {
        if (!fs.existsSync(this.dataPath)) {
            fs.mkdirSync(this.dataPath, { recursive: true });
        }
        
        // Créer sous-dossiers si nécessaire
        const subDirs = ['logs', 'backups'];
        subDirs.forEach(dir => {
            const dirPath = path.join(this.dataPath, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });
    }

    /**
     * Récupérer données par type
     */
    async getData(type) {
        try {
            if (this.cache.has(type)) {
                return this.cache.get(type);
            }

            const filename = this.dataTypes[type];
            if (!filename) {
                throw new Error(`Type de données inconnu: ${type}`);
            }

            const filepath = path.join(this.dataPath, filename);
            
            if (!fs.existsSync(filepath)) {
                const defaultData = this.getDefaultData(type);
                await this.saveData(type, defaultData);
                return defaultData;
            }

            const rawData = fs.readFileSync(filepath, 'utf8');
            const data = JSON.parse(rawData);
            
            // Mise en cache
            this.cache.set(type, data);
            
            return data;
        } catch (error) {
            console.error(`❌ Erreur lecture ${type}:`, error);
            return this.getDefaultData(type);
        }
    }

    /**
     * Sauvegarder données
     */
    async saveData(type, data) {
        try {
            const filename = this.dataTypes[type];
            if (!filename) {
                throw new Error(`Type de données inconnu: ${type}`);
            }

            const filepath = path.join(this.dataPath, filename);
            const dirPath = path.dirname(filepath);
            
            // Créer répertoire si nécessaire
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            // Sauvegarde atomique
            const tempPath = filepath + '.tmp';
            fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
            fs.renameSync(tempPath, filepath);
            
            // Mettre à jour cache
            this.cache.set(type, data);

            // Déclencher sauvegarde automatique MongoDB
            try {
                if (dataHooks && typeof dataHooks.triggerBackup === 'function') {
                    dataHooks.triggerBackup(`saveData_${filename}`);
                }
            } catch {}
            
            return true;
        } catch (error) {
            console.error(`❌ Erreur sauvegarde ${type}:`, error);
            return false;
        }
    }

    /**
     * Données par défaut selon le type
     */
    getDefaultData(type) {
        const defaults = {
            'users': {},
            'economy': {},
            'actions': {},
            'shop': {},
            'daily': {},
            'daily_cooldowns': {},
            
            // Données level par défaut
            'level_users': {},
            'level_config': {
                textXP: {
                    min: 15,
                    max: 25,
                    cooldown: 10000
                },
                voiceXP: {
                    amount: 150,
                    interval: 60000
                },
                xpCooldown: 10000,
                notifications: {
                    enabled: true,
                    channelId: null,
                    cardStyle: "holographic"
                },
                roleRewards: {},
                levelFormula: {
                    baseXP: 100,
                    multiplier: 1.5
                }
            },
            
            'confessions': [],
            'counting': {},
            'config': {
                confessionChannels: [],
                adminLogChannel: null,
                autoThread: false
            },
            'staff_config': {},
            'message_rewards': {
                enabled: false,
                amount: 1,
                cooldown: 60
            },
            'user_stats': {},
            'cooldowns': {},
            'karma_config': {
                customRewards: [],
                distributionDay: 1,
                enabled: true
            },
            // Moderation defaults
            'warnings': {},
            'moderation_config': {},
            'moderation_state': {},
            'logs_config': {},
            // Métriques globales (messages/commandes par jour, par guilde)
            'metrics': {
                messagesPerDay: {},
                commandsPerDay: {},
                guilds: {}
            },
            // Snapshots de rôles pour logs
            'member_roles': {}
        };

        return defaults[type] || {};
    }

    async loadData(filename, fallback = {}) {
        try {
            const fs = require('fs');
            const filePath = path.join(this.dataPath, filename);
            if (!fs.existsSync(filePath)) return fallback;
            const raw = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    }

    async saveRawFile(filename, data) {
        try {
            const fs = require('fs');
            const filePath = path.join(this.dataPath, filename);
            const dirPath = path.dirname(filePath);
            if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
            const tmp = filePath + '.tmp';
            fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
            fs.renameSync(tmp, filePath);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Récupérer utilisateur avec données complètes
     */
    async getUser(userId, guildId) {
        const users = await this.getData('users');
        const key = `${userId}_${guildId}`;
        
        if (!users[key]) {
            users[key] = {
                userId: userId,
                guildId: guildId,
                balance: 0,
                goodKarma: 0,
                badKarma: 0,
                xp: 0,
                messageCount: 0,
                createdAt: Date.now(),
                lastDaily: null,
                dailyStreak: 0
            };
            await this.saveData('users', users);
        }
        
        return users[key];
    }

    /**
     * Mettre à jour utilisateur
     */
    async updateUser(userId, guildId, updateData) {
        const users = await this.getData('users');
        const key = `${userId}_${guildId}`;
        
        if (!users[key]) {
            users[key] = await this.getUser(userId, guildId);
        }
        
        Object.assign(users[key], updateData);
        await this.saveData('users', users);
        
        return users[key];
    }

    /**
     * Gérer récompense de message
     */
    async handleMessageReward(message) {
        try {
            const rewards = await this.getData('message_rewards');
            if (!rewards.enabled) return;

            const cooldowns = await this.getData('cooldowns');
            const userId = message.author.id;
            const guildId = message.guild.id;
            const key = `message_${userId}_${guildId}`;
            
            // Vérifier cooldown
            const now = Date.now();
            const lastReward = cooldowns[key];
            
            if (lastReward && (now - lastReward) < (rewards.cooldown * 1000)) {
                return;
            }
            
            // Avantages boosters: multiplicateur et +1 XP bonus
            let amount = rewards.amount;
            try {
                const member = await message.guild.members.fetch(userId).catch(() => null);
                const isBooster = !!(member?.premiumSince || member?.premiumSinceTimestamp);
                if (isBooster) {
                    amount = Math.round(amount * 1.5);
                }
            } catch {}

            const current = await this.getUser(userId, guildId);
            await this.updateUser(userId, guildId, {
                balance: current.balance + amount,
                messageCount: current.messageCount + 1,
                xp: current.xp + 1
            });
            
            // Mettre à jour cooldown
            cooldowns[key] = now;
            await this.saveData('cooldowns', cooldowns);
            
        } catch (error) {
            console.error('❌ Erreur récompense message:', error);
        }
    }

    /**
     * Statistiques globales
     */
    async getStats(guildIdFilter = null) {
        try {
            const users = await this.getData('users');
            const confessions = await this.getData('confessions');
            const actions = await this.getData('actions');
            const userStats = await this.getData('user_stats');
            const metrics = await this.getData('metrics');

            // Totaux (potentiellement filtrés par guilde)
            const totalUsers = guildIdFilter
                ? Object.keys(users).filter(k => String(k).includes(guildIdFilter)).length
                : Object.keys(users).length;
            const totalConfessions = Array.isArray(confessions)
                ? confessions.length
                : (guildIdFilter ? Object.keys(confessions || {}).filter(k => String(k).includes(guildIdFilter)).length : Object.keys(confessions || {}).length);
            const totalActions = actions && typeof actions === 'object'
                ? (guildIdFilter ? Object.keys(actions).filter(k => String(k).includes(guildIdFilter)).length : Object.keys(actions).length)
                : 0;

            // Membres actifs (dernières 24h) à partir de user_stats
            const now = Date.now();
            const oneDayMs = 24 * 60 * 60 * 1000;
            let activeMembers = 0;
            try {
                const guildIds = guildIdFilter ? [guildIdFilter] : Object.keys(userStats || {});
                for (const guildId of guildIds) {
                    const usersMap = userStats[guildId] || {};
                    for (const uid of Object.keys(usersMap)) {
                        const last = usersMap[uid]?.lastMessage || 0;
                        if (last > 0 && (now - last) <= oneDayMs) activeMembers++;
                    }
                }
            } catch {}

            // Messages/Commandes du jour depuis metrics
            const todayKey = this.getTodayKey();
            let todayMessages = (metrics?.messagesPerDay && Number(metrics.messagesPerDay[todayKey])) || 0;
            let commandsUsed = (metrics?.commandsPerDay && Number(metrics.commandsPerDay[todayKey])) || 0;
            if (guildIdFilter && metrics?.guilds?.[guildIdFilter]) {
                const g = metrics.guilds[guildIdFilter];
                todayMessages = (g.messagesPerDay && Number(g.messagesPerDay[todayKey])) || 0;
                commandsUsed = (g.commandsPerDay && Number(g.commandsPerDay[todayKey])) || 0;
            }

            // Argent total (somme des balances des utilisateurs)
            let totalMoney = 0;
            if (guildIdFilter) {
                for (const [key, u] of Object.entries(users || {})) {
                    if (String(key).includes(guildIdFilter)) {
                        totalMoney += (Number(u.balance) || 0);
                    }
                }
            } else {
                totalMoney = Object.values(users || {}).reduce((sum, u) => sum + (Number(u.balance) || 0), 0);
            }

            return {
                totalUsers,
                totalConfessions,
                totalActions,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: Date.now(),
                activeMembers,
                todayMessages,
                commandsUsed,
                totalMoney
            };
        } catch (error) {
            console.error('❌ Erreur stats:', error);
            return {};
        }
    }

    /**
     * Backup automatique
     */
    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(this.dataPath, 'backups', timestamp);
            
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            
            // Copier tous les fichiers de données
            for (const [type, filename] of Object.entries(this.dataTypes)) {
                const sourcePath = path.join(this.dataPath, filename);
                const targetPath = path.join(backupDir, filename);
                
                if (fs.existsSync(sourcePath)) {
                    const targetDir = path.dirname(targetPath);
                    if (!fs.existsSync(targetDir)) {
                        fs.mkdirSync(targetDir, { recursive: true });
                    }
                    fs.copyFileSync(sourcePath, targetPath);
                }
            }
            
            console.log(`✅ Backup créé: ${timestamp}`);
            return timestamp;
        } catch (error) {
            console.error('❌ Erreur backup:', error);
            return null;
        }
    }

    /**
     * Méthodes spécialisées pour les données level
     */
    
    // Créer une sauvegarde des données level
    async createLevelBackup(label = null) {
        if (this.levelBackupManager) {
            return await this.levelBackupManager.createLevelBackup(label);
        } else {
            console.error('❌ LevelBackupManager non disponible');
            return null;
        }
    }

    // Restaurer les données level
    async restoreLevelData(backupFilename) {
        if (this.levelBackupManager) {
            const success = await this.levelBackupManager.restoreLevelData(backupFilename);
            if (success) {
                // Vider le cache pour forcer le rechargement
                this.clearCache('level_users');
                this.clearCache('level_config');
            }
            return success;
        } else {
            console.error('❌ LevelBackupManager non disponible');
            return false;
        }
    }

    // Synchroniser les données XP
    async synchronizeLevelXP(direction = 'economy_to_level') {
        if (this.levelBackupManager) {
            const result = await this.levelBackupManager.synchronizeXPData(direction);
            if (result.syncCount > 0) {
                // Vider le cache pour forcer le rechargement
                this.clearCache('level_users');
                this.clearCache('economy');
            }
            return result;
        } else {
            console.error('❌ LevelBackupManager non disponible');
            return { syncCount: 0, errorCount: 1 };
        }
    }

    // Diagnostiquer les problèmes level
    async diagnoseLevelIssues() {
        if (this.levelBackupManager) {
            return await this.levelBackupManager.diagnoseLevelIssues();
        } else {
            console.error('❌ LevelBackupManager non disponible');
            return { issues: ['LevelBackupManager non disponible'], recommendations: [], syncStatus: 'error' };
        }
    }

    // Lister les sauvegardes level
    listLevelBackups() {
        if (this.levelBackupManager) {
            return this.levelBackupManager.listBackups();
        } else {
            console.error('❌ LevelBackupManager non disponible');
            return [];
        }
    }

    /**
     * Nettoyer cache
     */
    clearCache(type = null) {
        if (type) {
            this.cache.delete(type);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Fermer la connexion MongoDB
     */
    async closeMongoDB() {
        if (this.mongoClient) {
            try {
                await this.mongoClient.close();
                console.log('🔐 Connexion MongoDB fermée');
            } catch (error) {
                console.error('❌ Erreur fermeture MongoDB:', error);
            }
        }
    }

    /**
     * Utilitaires métriques
     */
    getTodayKey() {
        try {
            return new Date().toISOString().slice(0, 10);
        } catch {
            const d = new Date();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${d.getFullYear()}-${m}-${day}`;
        }
    }

    async incrementMessageCount(guildId) {
        try {
            const metrics = await this.getData('metrics');
            const today = this.getTodayKey();
            if (!metrics.messagesPerDay) metrics.messagesPerDay = {};
            metrics.messagesPerDay[today] = (Number(metrics.messagesPerDay[today]) || 0) + 1;

            if (guildId) {
                if (!metrics.guilds) metrics.guilds = {};
                if (!metrics.guilds[guildId]) metrics.guilds[guildId] = { messagesPerDay: {}, commandsPerDay: {} };
                const g = metrics.guilds[guildId];
                if (!g.messagesPerDay) g.messagesPerDay = {};
                g.messagesPerDay[today] = (Number(g.messagesPerDay[today]) || 0) + 1;
            }

            await this.saveData('metrics', metrics);
        } catch (e) {
            // silencieux
        }
    }

    async incrementCommandCount(guildId) {
        try {
            const metrics = await this.getData('metrics');
            const today = this.getTodayKey();
            if (!metrics.commandsPerDay) metrics.commandsPerDay = {};
            metrics.commandsPerDay[today] = (Number(metrics.commandsPerDay[today]) || 0) + 1;

            if (guildId) {
                if (!metrics.guilds) metrics.guilds = {};
                if (!metrics.guilds[guildId]) metrics.guilds[guildId] = { messagesPerDay: {}, commandsPerDay: {} };
                const g = metrics.guilds[guildId];
                if (!g.commandsPerDay) g.commandsPerDay = {};
                g.commandsPerDay[today] = (Number(g.commandsPerDay[today]) || 0) + 1;
            }

            await this.saveData('metrics', metrics);
        } catch (e) {
            // silencieux
        }
    }
}

module.exports = DataManager;