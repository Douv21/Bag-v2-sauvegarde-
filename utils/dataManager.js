// Gestionnaire central des données avec système de backup automatique
const fs = require('fs');
const path = require('path');

class DataManager {
    constructor() {
        this.dataPath = './data';
        this.backupPath = './data/backups';
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.dataPath)) {
            fs.mkdirSync(this.dataPath, { recursive: true });
        }
        if (!fs.existsSync(this.backupPath)) {
            fs.mkdirSync(this.backupPath, { recursive: true });
        }
    }

    // Sauvegarde directe fichier local (sans persistance PostgreSQL)
    async saveData(filename, data) {
        try {
            console.log(`💾 Sauvegarde directe: ${filename}`);
            
        } catch (error) {
            console.error(`❌ Erreur sauvegarde ${filename}:`, error);
            
            // Fallback sur sauvegarde locale
            const filepath = path.join(this.dataPath, filename);
            const backupFilepath = path.join(this.backupPath, `${filename}.backup.${Date.now()}`);
            
            try {
                if (fs.existsSync(filepath)) {
                    fs.copyFileSync(filepath, backupFilepath);
                }
                
                const tempFilepath = filepath + '.tmp';
                fs.writeFileSync(tempFilepath, JSON.stringify(data, null, 2), 'utf8');
                fs.renameSync(tempFilepath, filepath);
                
                console.log(`💾 Sauvegarde locale fallback: ${filename}`);
                this.cleanOldBackups(filename);
                
            } catch (fallbackError) {
                console.error(`❌ Échec sauvegarde fallback:`, fallbackError);
            }
        }
    }

    // Chargement direct fichier local (sans persistance PostgreSQL)
    async loadData(filename, defaultValue = {}) {
        try {
            console.log(`📥 Chargement direct: ${filename}`);
            
        } catch (error) {
            console.error(`❌ Erreur chargement ${filename}:`, error);
            
            // Fallback sur chargement local
            const filepath = path.join(this.dataPath, filename);
            
            try {
                if (!fs.existsSync(filepath)) {
                    console.log(`📁 Création fichier initial: ${filename}`);
                    await this.saveData(filename, defaultValue);
                    return defaultValue;
                }
                
                const content = fs.readFileSync(filepath, 'utf8').trim();
                if (!content) {
                    console.log(`📄 Fichier vide détecté: ${filename}, utilisation backup...`);
                    return this.restoreFromLatestBackup(filename, defaultValue);
                }
                
                const data = JSON.parse(content);
                return data || defaultValue;
                
            } catch (fallbackError) {
                console.error(`❌ Erreur lecture fallback ${filename}:`, fallbackError);
                return this.restoreFromLatestBackup(filename, defaultValue);
            }
        }
    }

    // Restaurer depuis le backup le plus récent
    restoreFromLatestBackup(filename, defaultValue = {}) {
        try {
            const backupFiles = fs.readdirSync(this.backupPath)
                .filter(file => file.startsWith(`${filename}.backup.`))
                .sort((a, b) => {
                    const timeA = parseInt(a.split('.backup.')[1]);
                    const timeB = parseInt(b.split('.backup.')[1]);
                    return timeB - timeA; // Plus récent en premier
                });
            
            if (backupFiles.length > 0) {
                const latestBackup = path.join(this.backupPath, backupFiles[0]);
                const backupData = JSON.parse(fs.readFileSync(latestBackup, 'utf8'));
                
                // Restaurer le fichier principal
                this.saveData(filename, backupData);
                console.log(`✅ Données restaurées depuis backup: ${backupFiles[0]}`);
                
                return backupData;
            }
        } catch (error) {
            console.error(`❌ Échec restauration backup pour ${filename}:`, error);
        }
        
        console.log(`📝 Utilisation valeurs par défaut pour: ${filename}`);
        this.saveData(filename, defaultValue);
        return defaultValue;
    }

    // Nettoyer les anciens backups (garder les 10 plus récents)
    cleanOldBackups(filename) {
        try {
            const backupFiles = fs.readdirSync(this.backupPath)
                .filter(file => file.startsWith(`${filename}.backup.`))
                .sort((a, b) => {
                    const timeA = parseInt(a.split('.backup.')[1]);
                    const timeB = parseInt(b.split('.backup.')[1]);
                    return timeB - timeA;
                });
            
            // Supprimer les backups au-delà de 10
            if (backupFiles.length > 10) {
                const filesToDelete = backupFiles.slice(10);
                filesToDelete.forEach(file => {
                    try {
                        fs.unlinkSync(path.join(this.backupPath, file));
                    } catch (deleteError) {
                        console.error(`Erreur suppression backup ${file}:`, deleteError);
                    }
                });
                console.log(`🧹 ${filesToDelete.length} anciens backups supprimés pour ${filename}`);
            }
        } catch (error) {
            console.error(`Erreur nettoyage backups:`, error);
        }
    }

    // Méthode de backup manuel
    async createBackup(filename) {
        try {
            const filepath = path.join(this.dataPath, filename);
            if (fs.existsSync(filepath)) {
                const backupFilepath = path.join(this.backupPath, `${filename}.manual.${Date.now()}`);
                fs.copyFileSync(filepath, backupFilepath);
                console.log(`💾 Backup manuel créé: ${backupFilepath}`);
                return true;
            }
        } catch (error) {
            console.error(`❌ Erreur backup manuel ${filename}:`, error);
            return false;
        }
    }

    // Méthodes pour l'économie
    
    // Obtenir tous les utilisateurs d'un serveur
    async getAllUsers(guildId) {
        const users = this.loadData('users.json');
        return Object.entries(users)
            .filter(([key, user]) => key.endsWith(`_${guildId}`))
            .map(([key, user]) => ({
                ...user,
                userId: key.split('_')[0]
            }));
    }
    async getUser(userId, guildId) {
        const data = this.loadData('users.json');
        const key = `${userId}_${guildId}`;
        const userData = data[key];
        
        if (!userData) {
            return {
                id: userId,
                guildId: guildId,
                balance: 1000,
                xp: 0,
                karmaGood: 0,
                karmaBad: 0,
                dailyStreak: 0,
                lastDaily: null,
                messageCount: 0
            };
        }
        
        return userData;
    }

    async updateUser(userId, guildId, userData) {
        const data = this.loadData('users.json');
        const key = `${userId}_${guildId}`;
        data[key] = { ...data[key], ...userData };
        this.saveData('users.json', data);
        return data[key];
    }

    // Méthode getData pour compatibilité
    getData(filename) {
        return this.loadData(filename);
    }

    // Méthode setData pour compatibilité
    setData(filename, data) {
        this.saveData(filename, data);
    }

    // Créer un backup manuel avec timestamp
    createManualBackup(filename, reason = 'manual') {
        const filepath = path.join(this.dataPath, filename);
        if (!fs.existsSync(filepath)) return false;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFilepath = path.join(this.backupPath, `${filename}.${reason}.${timestamp}.backup`);
        
        try {
            fs.copyFileSync(filepath, backupFilepath);
            console.log(`📦 Backup manuel créé: ${filename} (${reason})`);
            return true;
        } catch (error) {
            console.error(`❌ Erreur backup manuel:`, error);
            return false;
        }
    }

    // Synchronisation périodique automatique
    startAutoBackup(intervalMinutes = 30) {
        const interval = intervalMinutes * 60 * 1000;
        
        setInterval(() => {
            const criticalFiles = ['users.json', 'actions.json', 'cooldowns.json', 'message_rewards.json'];
            
            criticalFiles.forEach(filename => {
                if (fs.existsSync(path.join(this.dataPath, filename))) {
                    this.createManualBackup(filename, 'auto');
                }
            });
            
            console.log(`🔄 Backup automatique effectué - ${new Date().toLocaleTimeString()}`);
        }, interval);
        
        console.log(`⏰ Système de backup automatique démarré (${intervalMinutes} min)`);
    }
}

// Instance globale
const dataManager = new DataManager();

module.exports = dataManager;