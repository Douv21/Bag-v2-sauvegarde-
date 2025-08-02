/**
 * Simple Data Manager - Sans PostgreSQL
 * Gestion fichiers locaux uniquement
 */

const fs = require('fs');
const path = require('path');
const dataHooks = require('./dataHooks');

class SimpleDataManager {
    constructor() {
        this.dataPath = path.join(__dirname, '..', 'data');
        
        // Créer le dossier data s'il n'existe pas
        if (!fs.existsSync(this.dataPath)) {
            fs.mkdirSync(this.dataPath, { recursive: true });
        }
    }

    // Lire un fichier JSON
    getData(filename) {
        try {
            const filepath = path.join(this.dataPath, filename);
            
            if (!fs.existsSync(filepath)) {
                console.log(`📁 Création fichier: ${filename}`);
                this.setData(filename, {});
                return {};
            }
            
            const content = fs.readFileSync(filepath, 'utf8');
            return JSON.parse(content);
            
        } catch (error) {
            console.error(`❌ Erreur lecture ${filename}:`, error);
            return {};
        }
    }

    // Écrire un fichier JSON
    setData(filename, data) {
        try {
            const filepath = path.join(this.dataPath, filename);
            fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
            console.log(`💾 Fichier sauvegardé: ${filename}`);
            
            // Déclencher sauvegarde automatique MongoDB
            if (dataHooks) {
                dataHooks.triggerBackup(`setData_${filename}`);
            }
            
        } catch (error) {
            console.error(`❌ Erreur écriture ${filename}:`, error);
        }
    }

    // Compatibilité avec l'ancien dataManager
    async saveData(filename, data) {
        this.setData(filename, data);
        
        // Déclencher sauvegarde automatique MongoDB
        if (dataHooks) {
            dataHooks.triggerBackup(`saveData_${filename}`);
        }
        
        return true;
    }

    async loadData(filename, defaultValue = {}) {
        const data = this.getData(filename);
        return Object.keys(data).length === 0 ? defaultValue : data;
    }

    // Obtenir un utilisateur (fichiers locaux uniquement)
    async getUser(userId, guildId) {
        const economy = this.getData('economy.json');
        const key = `${userId}_${guildId}`;
        
        return economy[key] || {
            balance: 1000,
            goodKarma: 0,
            badKarma: 0,
            dailyStreak: 0,
            lastDaily: null,
            messageCount: 0
        };
    }

    // Obtenir tous les utilisateurs d'un serveur
    async getAllUsers(guildId) {
        const economy = this.getData('economy.json');
        const users = [];
        
        for (const [key, userData] of Object.entries(economy)) {
            if (key.includes(`_${guildId}`)) {
                const userId = key.split(`_${guildId}`)[0];
                users.push({
                    userId: userId,
                    ...userData
                });
            }
        }
        
        return users;
    }

    // Mettre à jour un utilisateur (fichiers locaux uniquement)
    async updateUser(userId, guildId, userData) {
        const economy = this.getData('economy.json');
        const key = `${userId}_${guildId}`;
        economy[key] = userData;
        this.setData('economy.json', economy);
    }

}

module.exports = new SimpleDataManager();