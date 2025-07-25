
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

    // Clé unifiée pour les utilisateurs (TOUJOURS userId_guildId)
    getUserKey(userId, guildId) {
        return `${userId}_${guildId}`;
    }

    // Corriger les clés inversées dans les données existantes
    fixInvertedKeys() {
        try {
            const users = this.loadData('users.json', {});
            let fixed = 0;
            const toDelete = [];
            const toAdd = {};

            for (const [key, userData] of Object.entries(users)) {
                const parts = key.split('_');
                if (parts.length === 2) {
                    const [first, second] = parts;
                    
                    // Si la clé est inversée (guildId_userId au lieu de userId_guildId)
                    if (first.length > 15 && second.length < 15) {
                        const correctKey = `${second}_${first}`;
                        
                        if (!users[correctKey]) {
                            // Déplacer vers la bonne clé
                            toAdd[correctKey] = {
                                ...userData,
                                id: second,
                                guildId: first,
                                updatedAt: new Date().toISOString()
                            };
                            toDelete.push(key);
                            fixed++;
                        } else {
                            // Fusionner les données si les deux existent
                            const existing = users[correctKey];
                            toAdd[correctKey] = {
                                ...existing,
                                balance: Math.max(existing.balance || 1000, userData.balance || 1000),
                                goodKarma: Math.max(existing.goodKarma || 0, userData.goodKarma || 0),
                                badKarma: Math.max(existing.badKarma || 0, userData.badKarma || 0),
                                messageCount: Math.max(existing.messageCount || 0, userData.messageCount || 0),
                                xp: Math.max(existing.xp || 0, userData.xp || 0),
                                updatedAt: new Date().toISOString()
                            };
                            toDelete.push(key);
                            fixed++;
                        }
                    }
                }
            }

            // Appliquer les changements
            for (const key of toDelete) {
                delete users[key];
            }
            Object.assign(users, toAdd);

            if (fixed > 0) {
                this.saveData('users.json', users);
                console.log(`🔧 Correction: ${fixed} clés inversées corrigées`);
            }

        } catch (error) {
            console.error('❌ Erreur correction clés:', error);
        }
    }

    // Sauvegarde directe fichier local
    saveData(filename, data) {
        try {
            console.log(`💾 Sauvegarde: ${filename}`);
            
            const filepath = path.join(this.dataPath, filename);
            const backupFilepath = path.join(this.backupPath, `${filename}.backup.${Date.now()}`);
            
            // Backup de l'ancien fichier
            if (fs.existsSync(filepath)) {
                fs.copyFileSync(filepath, backupFilepath);
            }
            
            // Sauvegarde atomique
            const tempFilepath = filepath + '.tmp';
            fs.writeFileSync(tempFilepath, JSON.stringify(data, null, 2), 'utf8');
            fs.renameSync(tempFilepath, filepath);
            
            this.cleanOldBackups(filename);
            
        } catch (error) {
            console.error(`❌ Erreur sauvegarde ${filename}:`, error);
        }
    }

    // Chargement direct fichier local
    loadData(filename, defaultValue = {}) {
        try {
            console.log(`📥 Chargement: ${filename}`);
            
            const filepath = path.join(this.dataPath, filename);
            
            if (!fs.existsSync(filepath)) {
                console.log(`📁 Création fichier initial: ${filename}`);
                this.saveData(filename, defaultValue);
                return defaultValue;
            }
            
            const content = fs.readFileSync(filepath, 'utf8').trim();
            if (!content) {
                console.log(`📄 Fichier vide détecté: ${filename}, utilisation backup...`);
                return this.restoreFromLatestBackup(filename, defaultValue);
            }
            
            const data = JSON.parse(content);
            return data || defaultValue;
            
        } catch (error) {
            console.error(`❌ Erreur lecture ${filename}:`, error);
            return this.restoreFromLatestBackup(filename, defaultValue);
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
                    return timeB - timeA;
                });
            
            if (backupFiles.length > 0) {
                const latestBackup = path.join(this.backupPath, backupFiles[0]);
                const backupData = JSON.parse(fs.readFileSync(latestBackup, 'utf8'));
                
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

    // MÉTHODES UNIFIÉES POUR L'ÉCONOMIE

    // Obtenir un utilisateur avec structure COMPLÈTEMENT unifiée
    getUser(userId, guildId) {
        const users = this.loadData('users.json', {});
        const key = this.getUserKey(userId, guildId);
        
        if (!users[key]) {
            users[key] = {
                id: userId,
                guildId: guildId,
                balance: 1000,
                xp: 0,
                goodKarma: 0,
                badKarma: 0,
                dailyStreak: 0,
                lastDaily: null,
                messageCount: 0,
                lastMessage: null,
                timeInVocal: 0, // Temps en vocal en secondes
                level: 0,
                karmaNet: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.saveData('users.json', users);
        }

        // Migration et unification COMPLÈTE des données
        let needsUpdate = false;
        const userData = users[key];

        // S'assurer que toutes les propriétés existent
        const defaults = {
            id: userId,
            guildId: guildId,
            balance: 1000,
            xp: 0,
            goodKarma: 0,
            badKarma: 0,
            dailyStreak: 0,
            lastDaily: null,
            messageCount: 0,
            lastMessage: null,
            timeInVocal: 0,
            level: 0,
            karmaNet: 0
        };

        for (const [prop, defaultValue] of Object.entries(defaults)) {
            if (userData[prop] === undefined) {
                userData[prop] = defaultValue;
                needsUpdate = true;
            }
        }

        // Unifier les propriétés karma (supprimer les doublons)
        if (userData.karmaGood !== undefined || userData.karmaBad !== undefined || 
            userData.karma_good !== undefined || userData.karma_bad !== undefined) {
            const maxGoodKarma = Math.max(
                userData.goodKarma || 0,
                userData.karmaGood || 0,
                userData.karma_good || 0
            );
            const maxBadKarma = Math.max(
                userData.badKarma || 0,
                userData.karmaBad || 0,
                userData.karma_bad || 0
            );
            
            if (userData.goodKarma !== maxGoodKarma) {
                userData.goodKarma = maxGoodKarma;
                needsUpdate = true;
            }
            
            if (userData.badKarma !== maxBadKarma) {
                userData.badKarma = maxBadKarma;
                needsUpdate = true;
            }
            
            // Supprimer les propriétés obsolètes
            const obsoleteProps = ['karmaGood', 'karmaBad', 'karma_good', 'karma_bad'];
            for (const prop of obsoleteProps) {
                if (userData[prop] !== undefined) {
                    delete userData[prop];
                    needsUpdate = true;
                }
            }
        }

        // Recalculer toujours le karma net pour garantir la cohérence
        const newKarmaNet = (userData.goodKarma || 0) - (userData.badKarma || 0);
        if (userData.karmaNet !== newKarmaNet) {
            userData.karmaNet = newKarmaNet;
            needsUpdate = true;
        }

        // Recalculer toujours le niveau pour garantir la cohérence
        const newLevel = Math.floor((userData.xp || 0) / 1000);
        if (userData.level !== newLevel) {
            userData.level = newLevel;
            needsUpdate = true;
        }

        if (needsUpdate) {
            userData.updatedAt = new Date().toISOString();
            users[key] = userData;
            this.saveData('users.json', users);
        }
        
        return userData;
    }

    // Mettre à jour un utilisateur avec structure unifiée
    updateUser(userId, guildId, updateData) {
        const users = this.loadData('users.json', {});
        const key = this.getUserKey(userId, guildId);
        
        if (!users[key]) {
            users[key] = this.getUser(userId, guildId);
        }

        // Nettoyer les données d'entrée (supprimer propriétés obsolètes)
        const cleanData = { ...updateData };
        delete cleanData.karmaGood;
        delete cleanData.karmaBad;
        delete cleanData.karma_good;
        delete cleanData.karma_bad;

        // Appliquer les mises à jour
        users[key] = {
            ...users[key],
            ...cleanData,
            updatedAt: new Date().toISOString()
        };

        // Recalculer les valeurs dérivées
        if (cleanData.goodKarma !== undefined || cleanData.badKarma !== undefined) {
            users[key].karmaNet = (users[key].goodKarma || 0) - (users[key].badKarma || 0);
        }

        if (cleanData.xp !== undefined) {
            users[key].level = Math.floor((users[key].xp || 0) / 1000);
        }
        
        this.saveData('users.json', users);
        return users[key];
    }

    // Obtenir tous les utilisateurs d'un serveur
    getAllUsers(guildId) {
        const users = this.loadData('users.json', {});
        const guildUsers = [];
        
        for (const [key, user] of Object.entries(users)) {
            if (user.guildId === guildId) {
                guildUsers.push({
                    ...user,
                    userId: user.id || key.split('_')[0]
                });
            }
        }
        
        return guildUsers;
    }

    // Incrémenter le compteur de messages d'un utilisateur
    incrementMessageCount(userId, guildId) {
        const user = this.getUser(userId, guildId);
        const updatedUser = this.updateUser(userId, guildId, {
            messageCount: (user.messageCount || 0) + 1,
            lastMessage: Date.now()
        });
        return updatedUser;
    }

    // Obtenir les statistiques de messages d'un utilisateur
    getUserMessageStats(userId, guildId) {
        const user = this.getUser(userId, guildId);
        return {
            messageCount: user.messageCount || 0,
            lastMessage: user.lastMessage
        };
    }

    // Migration des données de user_stats.json vers users.json
    migrateMessageStats() {
        try {
            const userStats = this.loadData('user_stats.json', {});
            const users = this.loadData('users.json', {});
            let migrated = 0;

            for (const [guildId, guildData] of Object.entries(userStats)) {
                if (typeof guildData === 'object') {
                    for (const [userId, userData] of Object.entries(guildData)) {
                        if (typeof userData === 'object' && userData.messageCount) {
                            const userKey = this.getUserKey(userId, guildId);
                            
                            if (users[userKey]) {
                                // Mettre à jour avec les données de user_stats.json si plus récentes
                                if ((users[userKey].messageCount || 0) < userData.messageCount) {
                                    users[userKey].messageCount = userData.messageCount;
                                    users[userKey].lastMessage = userData.lastMessage;
                                    users[userKey].updatedAt = new Date().toISOString();
                                    migrated++;
                                }
                            } else {
                                // Créer un nouvel utilisateur avec les stats de messages
                                users[userKey] = {
                                    id: userId,
                                    guildId: guildId,
                                    balance: 1000,
                                    xp: 0,
                                    goodKarma: 0,
                                    badKarma: 0,
                                    karmaGood: 0,
                                    karmaBad: 0,
                                    dailyStreak: 0,
                                    lastDaily: null,
                                    messageCount: userData.messageCount || 0,
                                    lastMessage: userData.lastMessage || null,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString()
                                };
                                migrated++;
                            }
                        }
                    }
                }
            }

            if (migrated > 0) {
                this.saveData('users.json', users);
                console.log(`✅ Migration messages: ${migrated} utilisateurs mis à jour avec les stats de messages`);
            }

        } catch (error) {
            console.error('❌ Erreur migration stats messages:', error);
        }
    }

    // Migration des données de economy.json vers users.json
    migrateEconomyData() {
        try {
            const economy = this.loadData('economy.json', {});
            const users = this.loadData('users.json', {});
            let migrated = 0;

            for (const [key, economyUser] of Object.entries(economy)) {
                if (key.includes('_') && typeof economyUser === 'object') {
                    const parts = key.split('_');
                    if (parts.length === 2) {
                        const userId = parts[0];
                        const guildId = parts[1];
                        const userKey = this.getUserKey(userId, guildId);

                        if (!users[userKey] || users[userKey].balance === 1000) {
                            users[userKey] = {
                                id: userId,
                                guildId: guildId,
                                balance: economyUser.balance || 1000,
                                xp: economyUser.xp || 0,
                                goodKarma: economyUser.goodKarma || 0,
                                badKarma: economyUser.badKarma || 0,
                                karmaGood: economyUser.goodKarma || 0,
                                karmaBad: economyUser.badKarma || 0,
                                dailyStreak: economyUser.dailyStreak || 0,
                                lastDaily: economyUser.lastDaily || null,
                                messageCount: economyUser.messageCount || 0,
                                lastMessage: null,
                                createdAt: users[userKey]?.createdAt || new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            };
                            migrated++;
                        }
                    }
                }
            }

            if (migrated > 0) {
                this.saveData('users.json', users);
                console.log(`✅ Migration: ${migrated} utilisateurs migrés de economy.json vers users.json`);
            }

        } catch (error) {
            console.error('❌ Erreur migration données économie:', error);
        }
    }

    // Méthode de backup manuel
    createBackup(filename) {
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

    // Démarrer backup automatique
    startAutoBackup(intervalMinutes = 30) {
        const interval = intervalMinutes * 60 * 1000;
        
        setInterval(() => {
            const criticalFiles = ['users.json', 'actions.json', 'cooldowns.json'];
            
            criticalFiles.forEach(filename => {
                if (fs.existsSync(path.join(this.dataPath, filename))) {
                    this.createBackup(filename);
                }
            });
            
            console.log(`🔄 Backup automatique effectué - ${new Date().toLocaleTimeString()}`);
        }, interval);
        
        console.log(`⏰ Système de backup automatique démarré (${intervalMinutes} min)`);
    }
}

// Instance globale
const dataManager = new DataManager();

// Lancer les migrations et corrections au démarrage
dataManager.fixInvertedKeys();
dataManager.migrateEconomyData();
dataManager.migrateMessageStats();

module.exports = dataManager;
