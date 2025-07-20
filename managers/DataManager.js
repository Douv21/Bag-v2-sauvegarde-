/**
 * GESTIONNAIRE DE DONNÉES CENTRALISÉ
 * Système de données modulaire par commande
 */

const fs = require('fs');
const path = require('path');

class DataManager {
    constructor() {
        this.dataPath = path.join(__dirname, '../data');
        this.ensureDataDirectory();
        
        // Cache en mémoire pour performances
        this.cache = new Map();
        
        // Types de données par commande
        this.dataTypes = {
            // Système économie
            'users': 'users.json',
            'actions': 'actions.json',
            'shop': 'shop.json',
            'daily': 'daily.json',
            'daily_cooldowns': 'daily_cooldowns.json',
            
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
            'karma_config': 'karma_config.json'
        };
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
            'actions': {},
            'shop': {},
            'daily': {},
            'daily_cooldowns': {},
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
            }
        };

        return defaults[type] || {};
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
            
            // Donner récompense
            await this.updateUser(userId, guildId, {
                balance: (await this.getUser(userId, guildId)).balance + rewards.amount,
                messageCount: (await this.getUser(userId, guildId)).messageCount + 1,
                xp: (await this.getUser(userId, guildId)).xp + 1
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
    async getStats() {
        try {
            const users = await this.getData('users');
            const confessions = await this.getData('confessions');
            const actions = await this.getData('actions');
            
            return {
                totalUsers: Object.keys(users).length,
                totalConfessions: confessions.length,
                totalActions: Object.keys(actions).length,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: Date.now()
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
     * Nettoyer cache
     */
    clearCache(type = null) {
        if (type) {
            this.cache.delete(type);
        } else {
            this.cache.clear();
        }
    }
}

module.exports = DataManager;