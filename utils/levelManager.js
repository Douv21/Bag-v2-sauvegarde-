const fs = require('fs');
const path = require('path');
const levelCardGenerator = require('./levelCardGenerator');

class LevelManager {
    constructor() {
        this.configPath = path.join(__dirname, '../data/level_config.json');
        this.usersPath = path.join(__dirname, '../data/level_users.json');
        this.cooldowns = new Map(); // XP cooldowns in memory
        
        this.ensureDataFiles();
    }

    ensureDataFiles() {
        // Ensure data directory exists
        const dataDir = path.join(__dirname, '../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Create default config if doesn't exist
        if (!fs.existsSync(this.configPath)) {
            const defaultConfig = {
                textXP: {
                    min: 5,
                    max: 15,
                    cooldown: 60000
                },
                voiceXP: {
                    amount: 10,
                    perMinute: 10,
                    interval: 60000 // 60 seconds
                },
                xpCooldown: 60000, // 60 seconds
                notifications: {
                    enabled: true,
                    channelId: null,
                    cardStyle: 'futuristic'
                },
                roleRewards: [],
                levelFormula: {
                    baseXP: 1000,
                    multiplier: 1.5
                },
                leaderboard: {
                    limit: 10
                }
            };
            this.saveConfig(defaultConfig);
        }

        // Create default users file if doesn't exist
        if (!fs.existsSync(this.usersPath)) {
            this.saveUsers({});
        }
    }

    loadConfig() {
        try {
            const data = fs.readFileSync(this.configPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Erreur chargement config niveau:', error);
            return this.getDefaultConfig();
        }
    }

    saveConfig(config) {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
            return true;
        } catch (error) {
            console.error('Erreur sauvegarde config niveau:', error);
            return false;
        }
    }

    loadUsers() {
        try {
            const data = fs.readFileSync(this.usersPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Erreur chargement utilisateurs niveau:', error);
            return {};
        }
    }

    saveUsers(users) {
        try {
            fs.writeFileSync(this.usersPath, JSON.stringify(users, null, 2));
            return true;
        } catch (error) {
            console.error('Erreur sauvegarde utilisateurs niveau:', error);
            return false;
        }
    }

    getDefaultConfig() {
        return {
            textXP: { min: 5, max: 15, cooldown: 60000 },
            voiceXP: { amount: 10, perMinute: 10, interval: 60000 },
            xpCooldown: 60000,
            notifications: { enabled: true, channelId: null, cardStyle: 'futuristic' },
            roleRewards: [],
            levelFormula: { baseXP: 1000, multiplier: 1.5 },
            leaderboard: { limit: 10 }
        };
    }

    getUserLevel(userId, guildId) {
        const users = this.loadUsers();
        const userKey = `${guildId}_${userId}`;
        
        if (!users[userKey]) {
            users[userKey] = {
                userId,
                guildId,
                xp: 0,
                level: 1,
                totalMessages: 0,
                totalVoiceTime: 0,
                lastMessageTime: 0,
                lastVoiceTime: 0
            };
            this.saveUsers(users);
        }
        
        return users[userKey];
    }

    calculateXPForLevel(level) {
        if (level <= 1) return 0;
        const config = this.loadConfig();
        const { baseXP, multiplier } = config.levelFormula;
        
        // Formula: baseXP * (level - 1) ^ multiplier
        return Math.floor(baseXP * Math.pow(level - 1, multiplier));
    }

    calculateLevelFromXP(xp) {
        let level = 1;
        while (this.calculateXPForLevel(level + 1) <= xp) {
            level++;
        }
        return level;
    }

    async addTextXP(userId, guildId, context = {}) {
        try {
            // Check cooldown
            const cooldownKey = `${guildId}_${userId}_text`;
            if (this.cooldowns.has(cooldownKey)) {
                const lastTime = this.cooldowns.get(cooldownKey);
                const config = this.loadConfig();
                if (Date.now() - lastTime < config.xpCooldown) {
                    return null; // Still in cooldown
                }
            }

            const users = this.loadUsers();
            const userKey = `${guildId}_${userId}`;
            const userLevel = this.getUserLevel(userId, guildId);
            
            // Generate random XP
            const config = this.loadConfig();
            const xpGain = Math.floor(Math.random() * (config.textXP.max - config.textXP.min + 1)) + config.textXP.min;
            
            const oldLevel = userLevel.level;
            userLevel.xp += xpGain;
            userLevel.totalMessages = (userLevel.totalMessages || 0) + 1;
            userLevel.lastMessageTime = Date.now();
            
            // Calculate new level
            const newLevel = this.calculateLevelFromXP(userLevel.xp);
            const leveledUp = newLevel > oldLevel;
            userLevel.level = newLevel;
            
            // Save user data
            users[userKey] = userLevel;
            this.saveUsers(users);
            
            // Set cooldown
            this.cooldowns.set(cooldownKey, Date.now());
            
            console.log(`📈 ${context.user?.username || userId} a gagné ${xpGain} XP (Total: ${userLevel.xp}, Niveau: ${newLevel})`);
            
            // Handle level up
            if (leveledUp && context.guild) {
                await this.handleLevelUp(userId, userLevel, oldLevel, newLevel, context.guild);
            }
            
            return {
                xpGain,
                totalXP: userLevel.xp,
                oldLevel,
                newLevel,
                leveledUp
            };
            
        } catch (error) {
            console.error('Erreur ajout XP texte:', error);
            return null;
        }
    }

    setUserXP(userId, guildId, newXP) {
        const users = this.loadUsers();
        const userKey = `${guildId}_${userId}`;
        
        if (!users[userKey]) {
            users[userKey] = {
                userId,
                guildId,
                xp: 0,
                level: 1,
                totalMessages: 0,
                totalVoiceTime: 0,
                lastMessageTime: 0,
                lastVoiceTime: 0
            };
        }
        
        users[userKey].xp = Math.max(0, newXP);
        users[userKey].level = this.calculateLevelFromXP(users[userKey].xp);
        
        this.saveUsers(users);
        return users[userKey];
    }

    getXPForLevel(level) {
        return this.calculateXPForLevel(level);
    }

    async addVoiceXP(userId, guildId, context = {}) {
        try {
            const users = this.loadUsers();
            const userKey = `${guildId}_${userId}`;
            const userLevel = this.getUserLevel(userId, guildId);
            
            const config = this.loadConfig();
            const xpGain = config.voiceXP.amount;
            
            const oldLevel = userLevel.level;
            userLevel.xp += xpGain;
            userLevel.totalVoiceTime = (userLevel.totalVoiceTime || 0) + config.voiceXP.interval;
            userLevel.lastVoiceTime = Date.now();
            
            // Calculate new level
            const newLevel = this.calculateLevelFromXP(userLevel.xp);
            const leveledUp = newLevel > oldLevel;
            userLevel.level = newLevel;
            
            // Save user data
            users[userKey] = userLevel;
            this.saveUsers(users);
            
            console.log(`🎤 ${context.user?.username || userId} a gagné ${xpGain} XP vocal (Total: ${userLevel.xp}, Niveau: ${newLevel})`);
            
            // Handle level up
            if (leveledUp && context.guild) {
                await this.handleLevelUp(userId, userLevel, oldLevel, newLevel, context.guild);
            }
            
            return {
                xpGain,
                totalXP: userLevel.xp,
                oldLevel,
                newLevel,
                leveledUp
            };
            
        } catch (error) {
            console.error('Erreur ajout XP vocal:', error);
            return null;
        }
    }

    async handleLevelUp(userId, userLevel, oldLevel, newLevel, guild) {
        try {
            const config = this.loadConfig();
            
            // Check for role rewards
            const roleReward = config.roleRewards[newLevel];
            let roleAwarded = null;
            
            if (roleReward) {
                try {
                    const role = await guild.roles.fetch(roleReward);
                    const member = await guild.members.fetch(userId);
                    
                    if (role && member) {
                        await member.roles.add(role);
                        roleAwarded = role;
                        console.log(`🎁 Rôle ${role.name} attribué à ${member.user.username} pour le niveau ${newLevel}`);
                    }
                } catch (error) {
                    console.error('Erreur attribution rôle:', error);
                }
            }
            
            // Send level up notification
            if (config.notifications.enabled && config.notifications.channel) {
                await this.sendLevelUpNotification(userId, userLevel, oldLevel, newLevel, roleAwarded, guild, config);
            }
            
        } catch (error) {
            console.error('Erreur gestion level up:', error);
        }
    }

    async sendLevelUpNotification(userId, userLevel, oldLevel, newLevel, roleReward, guild, config) {
        try {
            const channel = await guild.channels.fetch(config.notifications.channel);
            if (!channel || !channel.isTextBased()) return;
            
            const user = await guild.members.fetch(userId);
            if (!user) return;
            
            // Préparer l'utilisateur avec ses rôles pour la génération de carte
            const userWithRoles = {
                ...user.user,
                roles: user.roles.cache.map(role => ({ name: role.name, id: role.id })),
                displayAvatarURL: user.user.displayAvatarURL?.bind(user.user) || (() => user.user.avatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png')
            };
            
            // Generate level up card with chosen style
            const cardBuffer = await levelCardGenerator.generateCard(
                userWithRoles,
                userLevel,
                oldLevel,
                newLevel,
                roleReward,
                config.notifications.cardStyle
            );
            
            // Message simple selon demande utilisateur
            let message = `Félicitations ${user.user.username}, tu as atteint le niveau ${newLevel} !`;
            
            // Ajouter message pour récompense de rôle si applicable
            if (roleReward) {
                message += `\nFélicitations ${user.user.username}, tu as obtenu le rôle ${roleReward.name} !`;
            }
            
            const messageContent = {
                content: message
            };
            
            // Ajouter la carte si générée avec succès
            if (cardBuffer && cardBuffer.length > 0) {
                messageContent.files = [{
                    attachment: cardBuffer,
                    name: `level_up_${userId}_${newLevel}.png`
                }];
            }
            
            await channel.send(messageContent);
            
        } catch (error) {
            console.error('Erreur envoi notification niveau:', error);
        }
    }

    getTopUsers(guildId, limit = 10) {
        const users = this.loadUsers();
        const guildUsers = [];
        
        for (const [userKey, userData] of Object.entries(users)) {
            if (userKey.startsWith(`${guildId}_`)) {
                guildUsers.push(userData);
            }
        }
        
        // Sort by XP descending
        guildUsers.sort((a, b) => b.xp - a.xp);
        
        return guildUsers.slice(0, limit);
    }

    getGuildStats(guildId) {
        const users = this.loadUsers();
        const guildUsers = [];
        
        for (const [userKey, userData] of Object.entries(users)) {
            if (userKey.startsWith(`${guildId}_`)) {
                guildUsers.push(userData);
            }
        }
        
        if (guildUsers.length === 0) {
            return {
                totalUsers: 0,
                avgLevel: 0,
                totalMessages: 0,
                totalXP: 0,
                avgXP: 0
            };
        }
        
        const totalXP = guildUsers.reduce((sum, user) => sum + user.xp, 0);
        const totalMessages = guildUsers.reduce((sum, user) => sum + (user.totalMessages || 0), 0);
        const totalLevels = guildUsers.reduce((sum, user) => sum + user.level, 0);
        
        return {
            totalUsers: guildUsers.length,
            avgLevel: totalLevels / guildUsers.length,
            totalMessages,
            totalXP,
            avgXP: totalXP / guildUsers.length
        };
    }

    // Admin functions
    setUserXP(userId, guildId, xp) {
        const users = this.loadUsers();
        const userKey = `${guildId}_${userId}`;
        const userLevel = this.getUserLevel(userId, guildId);
        
        userLevel.xp = Math.max(0, xp);
        userLevel.level = this.calculateLevelFromXP(userLevel.xp);
        
        users[userKey] = userLevel;
        this.saveUsers(users);
        
        return userLevel;
    }

    setUserLevel(userId, guildId, level) {
        const xpRequired = this.calculateXPForLevel(level);
        return this.setUserXP(userId, guildId, xpRequired);
    }

    resetUserProgress(userId, guildId) {
        const users = this.loadUsers();
        const userKey = `${guildId}_${userId}`;
        
        users[userKey] = {
            userId,
            guildId,
            xp: 0,
            level: 1,
            totalMessages: 0,
            totalVoiceTime: 0,
            lastMessageTime: 0,
            lastVoiceTime: 0
        };
        
        this.saveUsers(users);
        return users[userKey];
    }

    resetGuildProgress(guildId) {
        const users = this.loadUsers();
        const keysToDelete = Object.keys(users).filter(key => key.startsWith(`${guildId}_`));
        
        keysToDelete.forEach(key => delete users[key]);
        
        this.saveUsers(users);
        return keysToDelete.length;
    }
}

module.exports = new LevelManager();