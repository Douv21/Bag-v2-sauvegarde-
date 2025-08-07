// Imports temporaires pour tests - Version simplifiée sans DB
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dataManager = require('./dataManager');

class EconomyManager {
    constructor() {
        // Version simplifiée avec fichiers JSON
        this.dataPath = './data';
        this.usersFile = path.join(this.dataPath, 'users.json');
        this.actionsFile = path.join(this.dataPath, 'actions.json');
        this.cooldownsFile = path.join(this.dataPath, 'cooldowns.json');
        
        // Créer le dossier data s'il n'existe pas
        if (!fs.existsSync(this.dataPath)) {
            fs.mkdirSync(this.dataPath, { recursive: true });
        }
        this.defaultActions = {
            // Bonnes actions
            work: {
                id: 'work',
                name: '💋 Charmer',
                description: 'Faites chavirer les cœurs pour gagner du plaisir',
                actionType: 'good',
                baseReward: 50,
                cooldown: 3600, // 1 heure
                karmaGoodChange: 1,
                karmaBadChange: -1
            },
            fish: {
                id: 'fish',
                name: '🍑 Flirter',
                description: 'Flirtez gentiment pour accumuler du plaisir',
                actionType: 'good',
                baseReward: 30,
                cooldown: 1800, // 30 minutes
                karmaGoodChange: 1,
                karmaBadChange: 0
            },
            donate: {
                id: 'donate',
                name: '🎁 Offrir',
                description: 'Offrez un peu de plaisir à la communauté',
                actionType: 'good',
                baseReward: -20, // Coûte de l'argent
                cooldown: 7200, // 2 heures
                karmaGoodChange: 2,
                karmaBadChange: -1
            },
            // Mauvaises actions
            steal: {
                id: 'steal',
                name: '😈 Séduire',
                description: 'Jouez avec le feu (action risquée)',
                actionType: 'bad',
                baseReward: 80,
                cooldown: 5400, // 1.5 heures
                karmaGoodChange: -1,
                karmaBadChange: 1
            },
            crime: {
                id: 'crime',
                name: '🔥 Coup de folie',
                description: 'Osez tout pour un maximum de plaisir',
                actionType: 'bad',
                baseReward: 120,
                cooldown: 7200, // 2 heures
                karmaGoodChange: -2,
                karmaBadChange: 2
            },
            gamble: {
                id: 'gamble',
                name: '🎲 Oser',
                description: 'Tentez votre chance (très risqué)',
                actionType: 'bad',
                baseReward: 100, // Variable selon le résultat
                cooldown: 3600, // 1 heure
                karmaGoodChange: -1,
                karmaBadChange: 1
            }
        };
    }

    async initializeGuild(guildId) {
        // Version simplifiée avec fichiers JSON
        const actions = this.loadActions();
        let changed = false;
        
        for (const [actionId, actionData] of Object.entries(this.defaultActions)) {
            const key = `${guildId}_${actionData.id}`;
            if (!actions[key]) {
                actions[key] = {
                    ...actionData,
                    guildId: guildId
                };
                changed = true;
            }
        }
        
        if (changed) {
            this.saveActions(actions);
        }
    }

    loadUsers() {
        return dataManager.loadData('users.json', {});
    }

    saveUsers(users) {
        dataManager.saveData('users.json', users);
    }

    loadActions() {
        return dataManager.loadData('actions.json', {});
    }

    saveActions(actions) {
        dataManager.saveData('actions.json', actions);
    }

    loadCooldowns() {
        return dataManager.loadData('cooldowns.json', {});
    }

    saveCooldowns(cooldowns) {
        dataManager.saveData('cooldowns.json', cooldowns);
    }

    async getOrCreateUser(userId, guildId) {
        const users = this.loadUsers();
        const key = `${guildId}_${userId}`;
        
        if (!users[key]) {
            users[key] = {
                id: userId,
                guildId: guildId,
                balance: 100, // Argent de départ
                karma_good: 0,
                karma_bad: 0,
                karmaGood: 0,
                karmaBad: 0,
                xp: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.saveUsers(users);
        }
        
        // Migration: ajouter XP et normaliser karma si manquant
        let needsSave = false;
        if (typeof users[key].xp === 'undefined') {
            users[key].xp = 0;
            needsSave = true;
        }
        if (typeof users[key].karmaGood === 'undefined') {
            users[key].karmaGood = users[key].karma_good || 0;
            needsSave = true;
        }
        if (typeof users[key].karmaBad === 'undefined') {
            users[key].karmaBad = users[key].karma_bad || 0;
            needsSave = true;
        }
        
        if (needsSave) {
            this.saveUsers(users);
        }
        
        return users[key];
    }

    async checkCooldown(userId, guildId, actionId) {
        const cooldowns = this.loadCooldowns();
        const key = `${guildId}_${userId}_${actionId}`;
        
        if (cooldowns[key] && new Date(cooldowns[key].expiresAt) > new Date()) {
            return cooldowns[key];
        }
        
        return null;
    }

    async setCooldown(userId, guildId, actionId, cooldownSeconds) {
        const cooldowns = this.loadCooldowns();
        const key = `${guildId}_${userId}_${actionId}`;
        const expiresAt = new Date(Date.now() + cooldownSeconds * 1000);
        
        cooldowns[key] = {
            userId,
            guildId,
            actionId,
            lastUsed: new Date().toISOString(),
            expiresAt: expiresAt.toISOString()
        };
        
        this.saveCooldowns(cooldowns);
    }

    async executeAction(userId, guildId, actionId) {
        await this.initializeGuild(guildId);
        
        const user = await this.getOrCreateUser(userId, guildId);
        
        // Vérifier le cooldown
        const cooldown = await this.checkCooldown(userId, guildId, actionId);
        if (cooldown) {
            const remainingTime = Math.ceil((new Date(cooldown.expiresAt) - new Date()) / 1000);
            return {
                success: false,
                message: `⏰ Vous devez attendre encore ${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s`,
                remainingTime
            };
        }

        // Récupérer l'action
        const actions = this.loadActions();
        const actionKey = `${guildId}_${actionId}`;
        const actionData = actions[actionKey];

        if (!actionData) {
            return {
                success: false,
                message: '❌ Cette action n\'existe pas. Les actions disponibles sont : work, fish, donate, steal, crime, gamble'
            };
        }

        if (actionData.enabled === false) {
            return {
                success: false,
                message: '❌ Cette action est actuellement désactivée'
            };
        }

        // Calculer le gain (avec variabilité)
        let reward = actionData.baseReward;
        
        // Actions spéciales
        if (actionId === 'gamble') {
            // 50% de chance de perdre tout
            if (Math.random() < 0.5) {
                reward = -Math.min(user.balance, 50); // Perd jusqu'à 50
            } else {
                reward = Math.floor(reward * (0.5 + Math.random())); // Gagne 50-150% du montant de base
            }
        } else if (actionId === 'steal') {
            // 30% de chance d'échouer et perdre de l'argent
            if (Math.random() < 0.3) {
                reward = -25;
            }
        } else {
            // Variabilité normale ±20%
            reward = Math.floor(reward * (0.8 + Math.random() * 0.4));
        }

        // Vérifier si l'utilisateur a assez d'argent pour les actions qui coûtent
        if (reward < 0 && user.balance + reward < 0) {
            return {
                success: false,
                message: '💸 Vous n\'avez pas assez d\'argent pour cette action'
            };
        }

        // Mettre à jour l'utilisateur
        const users = this.loadUsers();
        const userKey = `${guildId}_${userId}`;
        const newBalance = user.balance + reward;
        
        // Utiliser les champs karma unifiés - prendre la valeur la plus élevée
        const currentKarmaGood = Math.max(user.karmaGood || 0, user.karma_good || 0);
        const currentKarmaBad = Math.max(user.karmaBad || 0, user.karma_bad || 0);
        
        const newKarmaGood = Math.max(0, currentKarmaGood + actionData.karmaGoodChange);
        const newKarmaBad = Math.max(0, currentKarmaBad + actionData.karmaBadChange);

        users[userKey] = {
            ...users[userKey],
            balance: newBalance,
            karma_good: newKarmaGood,
            karma_bad: newKarmaBad,
            karmaGood: newKarmaGood,
            karmaBad: newKarmaBad,
            updatedAt: new Date().toISOString()
        };
        
        this.saveUsers(users);

        // Définir le cooldown
        await this.setCooldown(userId, guildId, actionId, actionData.cooldown);

        return {
            success: true,
            action: actionData,
            reward,
            newBalance,
            karmaChange: {
                good: actionData.karmaGoodChange,
                bad: actionData.karmaBadChange
            },
            newKarma: {
                good: newKarmaGood,
                bad: newKarmaBad,
                total: newKarmaGood - newKarmaBad
            }
        };
    }

    async getUserStats(userId, guildId) {
        await this.initializeGuild(guildId);
        const user = await this.getOrCreateUser(userId, guildId);
        
        // Récupérer les cooldowns actifs
        const cooldowns = this.loadCooldowns();
        const activeCooldowns = [];
        
        for (const [key, cooldown] of Object.entries(cooldowns)) {
            if (cooldown.userId === userId && 
                cooldown.guildId === guildId && 
                new Date(cooldown.expiresAt) > new Date()) {
                activeCooldowns.push({
                    actionId: cooldown.actionId,
                    expiresAt: cooldown.expiresAt
                });
            }
        }

        return {
            user,
            cooldowns: activeCooldowns
        };
    }

    async getLeaderboard(guildId, type = 'balance', limit = 10) {
        const users = this.loadUsers();
        const guildUsers = [];
        
        for (const [key, user] of Object.entries(users)) {
            if (user.guildId === guildId) {
                guildUsers.push(user);
            }
        }
        
        // Filter users with positive values and sort
        const filteredUsers = guildUsers.filter(user => {
            const value = user[type] || 0;
            return value > 0;
        }).sort((a, b) => {
            if (type === 'karma_good') return (b.karma_good || 0) - (a.karma_good || 0);
            if (type === 'karma_bad') return (b.karma_bad || 0) - (a.karma_bad || 0);
            return (b.balance || 0) - (a.balance || 0);
        });
        
        console.log(`Leaderboard for ${type} in guild ${guildId}:`, filteredUsers.slice(0, limit));
        return filteredUsers.slice(0, limit);
    }
}

module.exports = new EconomyManager();