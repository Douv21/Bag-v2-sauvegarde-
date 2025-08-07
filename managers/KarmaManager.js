const fs = require('fs').promises;
const path = require('path');

class KarmaManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.karmaConfig = null;
        this.loadKarmaConfig();
    }

    async loadKarmaConfig() {
        try {
            const configPath = path.join(__dirname, '../data/karma_config.json');
            const data = await fs.readFile(configPath, 'utf8');
            const fileConfig = JSON.parse(data);

            // Normaliser la configuration pour supporter l'ancien et le nouveau schéma
            const defaultRewards = {
                saint: { money: 500, dailyBonus: 1.5, cooldownReduction: 0.7 },
                good: { money: 200, dailyBonus: 1.2, cooldownReduction: 0.9 },
                neutral: { money: 0, dailyBonus: 1.0, cooldownReduction: 1.0 },
                bad: { money: -100, dailyBonus: 0.8, cooldownReduction: 1.2 },
                evil: { money: -300, dailyBonus: 0.5, cooldownReduction: 1.5 }
            };

            const defaultActions = {
                work: { karmaGood: 1, karmaBad: -1, enabled: true },
                fish: { karmaGood: 1, karmaBad: -1, enabled: true },
                donate: { karmaGood: 3, karmaBad: -2, enabled: true },
                steal: { karmaGood: -1, karmaBad: 1, enabled: true },
                crime: { karmaGood: -3, karmaBad: 3, enabled: true },
                bet: { karmaGood: -1, karmaBad: 1, enabled: true }
            };

            // Construire l'objet config en gardant le schéma weeklyReset
            const weeklyReset = fileConfig.weeklyReset || {
                enabled: true,
                dayOfWeek: (typeof fileConfig.resetDay === 'number' ? fileConfig.resetDay : 1),
                lastReset: (typeof fileConfig.lastReset === 'number' ? fileConfig.lastReset : null)
            };

            this.karmaConfig = {
                weeklyReset,
                rewards: fileConfig.rewards || defaultRewards,
                actions: fileConfig.actions || defaultActions
            };

            // Persister la normalisation si nécessaire
            await this.saveKarmaConfig();
        } catch (error) {
            // Configuration par défaut (aucun fichier ou fichier invalide)
            this.karmaConfig = {
                weeklyReset: {
                    enabled: true,
                    dayOfWeek: 1, // Lundi (0=Dimanche, 1=Lundi, etc.)
                    lastReset: null
                },
                rewards: {
                    saint: { // +10 karma et plus
                        money: 500,
                        dailyBonus: 1.5,
                        cooldownReduction: 0.7
                    },
                    good: { // +1 à +9 karma
                        money: 200,
                        dailyBonus: 1.2,
                        cooldownReduction: 0.9
                    },
                    neutral: { // 0 karma
                        money: 0,
                        dailyBonus: 1.0,
                        cooldownReduction: 1.0
                    },
                    bad: { // -1 à -9 karma
                        money: -100,
                        dailyBonus: 0.8,
                        cooldownReduction: 1.2
                    },
                    evil: { // -10 karma et moins
                        money: -300,
                        dailyBonus: 0.5,
                        cooldownReduction: 1.5
                    }
                },
                actions: {
                    work: { karmaGood: 1, karmaBad: -1, enabled: true },
                    fish: { karmaGood: 1, karmaBad: -1, enabled: true },
                    donate: { karmaGood: 3, karmaBad: -2, enabled: true },
                    steal: { karmaGood: -1, karmaBad: 1, enabled: true },
                    crime: { karmaGood: -3, karmaBad: 3, enabled: true },
                    bet: { karmaGood: -1, karmaBad: 1, enabled: true }
                }
            };
            await this.saveKarmaConfig();
        }
    }

    async saveKarmaConfig() {
        try {
            const configPath = path.join(__dirname, '../data/karma_config.json');
            await fs.mkdir(path.dirname(configPath), { recursive: true });

            // Toujours sauvegarder au format weeklyReset pour cohérence avec le reste de l'app
            const toSave = {
                weeklyReset: this.karmaConfig.weeklyReset,
                rewards: this.karmaConfig.rewards,
                actions: this.karmaConfig.actions
            };

            await fs.writeFile(configPath, JSON.stringify(toSave, null, 2));
        } catch (error) {
            console.error('❌ Erreur sauvegarde karma config:', error);
        }
    }

    async checkWeeklyReset() {
        const now = new Date();
        const weekly = this.karmaConfig.weeklyReset || { enabled: false };

        if (!weekly.enabled) {
            return false;
        }

        const lastResetDate = weekly.lastReset ? new Date(weekly.lastReset) : null;
        const currentDay = now.getDay();
        const resetDay = typeof weekly.dayOfWeek === 'number' ? weekly.dayOfWeek : 1;

        // Réinitialiser une fois le jour sélectionné, en évitant les doublons le même jour
        const alreadyResetToday = lastResetDate && lastResetDate.toDateString() === now.toDateString();
        if (currentDay === resetDay && !alreadyResetToday) {
            await this.performWeeklyReset();
            return true;
        }
        return false;
    }

    async performWeeklyReset() {
        console.log('🔄 Réinitialisation hebdomadaire du karma...');

        const users = await this.dataManager.getData('users');
        let resetCount = 0;

        for (const userKey in users) {
            if (users[userKey].karmaGood || users[userKey].karmaBad) {
                // Distribuer les récompenses/sanctions avant reset
                await this.applyWeeklyRewards(userKey, users[userKey]);

                // Reset karma
                users[userKey].karmaGood = 0;
                users[userKey].karmaBad = 0;
                resetCount++;
            }
        }

        await this.dataManager.saveData('users', users);
        this.karmaConfig.weeklyReset = {
            ...(this.karmaConfig.weeklyReset || {}),
            lastReset: Date.now()
        };
        await this.saveKarmaConfig();

        console.log(`✅ Karma reset pour ${resetCount} utilisateurs`);
    }

    async applyWeeklyRewards(userKey, userData) {
        const netKarma = (userData.karmaGood || 0) - (userData.karmaBad || 0);
        const level = this.getKarmaLevel(netKarma);
        const rewards = this.karmaConfig.rewards[level];

        if (rewards.money !== 0) {
            userData.balance = (userData.balance || 0) + rewards.money;
            console.log(`💰 ${userKey}: ${rewards.money > 0 ? '+' : ''}${rewards.money}€ (karma ${level})`);
        }
    }

    getKarmaLevel(netKarma) {
        if (netKarma >= 10) return 'saint';
        if (netKarma >= 1) return 'good';
        if (netKarma === 0) return 'neutral';
        if (netKarma >= -9) return 'bad';
        return 'evil';
    }

    getKarmaMultiplier(netKarma, type = 'dailyBonus') {
        const level = this.getKarmaLevel(netKarma);
        return this.karmaConfig.rewards[level][type] || 1.0;
    }

    async applyActionKarma(userKey, action, success = true) {
        const actionConfig = this.karmaConfig.actions[action];
        if (!actionConfig || !actionConfig.enabled) return { karmaGood: 0, karmaBad: 0 };

        const users = await this.dataManager.getData('users');
        const userData = users[userKey] || { karmaGood: 0, karmaBad: 0 };

        let karmaGoodChange = 0;
        let karmaBadChange = 0;

        if (success) {
            karmaGoodChange = Math.max(0, actionConfig.karmaGood);
            karmaBadChange = Math.max(0, actionConfig.karmaBad);
        } else {
            // En cas d'échec, appliquer les pénalités
            karmaGoodChange = Math.min(0, actionConfig.karmaGood);
            karmaBadChange = Math.max(0, actionConfig.karmaBad);
        }

        userData.karmaGood = (userData.karmaGood || 0) + karmaGoodChange;
        userData.karmaBad = (userData.karmaBad || 0) + karmaBadChange;

        users[userKey] = userData;
        await this.dataManager.saveData('users', users);

        return { karmaGood: karmaGoodChange, karmaBad: karmaBadChange };
    }

    async setResetDay(day) {
        this.karmaConfig.weeklyReset = {
            ...(this.karmaConfig.weeklyReset || {}),
            dayOfWeek: day,
            enabled: true
        };
        await this.saveKarmaConfig();
    }

    async updateActionKarma(action, karmaGood, karmaBad) {
        if (!this.karmaConfig.actions[action]) {
            this.karmaConfig.actions[action] = { enabled: true };
        }

        this.karmaConfig.actions[action].karmaGood = karmaGood;
        this.karmaConfig.actions[action].karmaBad = karmaBad;
        await this.saveKarmaConfig();
    }

    async updateRewards(level, money, dailyBonus, cooldownReduction) {
        this.karmaConfig.rewards[level] = {
            money: money,
            dailyBonus: dailyBonus,
            cooldownReduction: cooldownReduction
        };
        await this.saveKarmaConfig();
    }

    getKarmaConfig() {
        return this.karmaConfig;
    }
}

module.exports = KarmaManager;