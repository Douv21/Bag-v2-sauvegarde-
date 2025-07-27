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
        
        // Auto-correction du niveau basé sur l'XP actuel
        const correctLevel = this.calculateLevelFromXP(users[userKey].xp);
        if (users[userKey].level !== correctLevel) {
            const oldLevel = users[userKey].level;
            console.log(`🔄 Correction niveau: ${userId} ${oldLevel} → ${correctLevel} (XP: ${users[userKey].xp})`);
            users[userKey].level = correctLevel;
            this.saveUsers(users);
            
            // Si c'est une correction vers un niveau supérieur, on pourrait notifier
            // Mais pour éviter le spam, on le fait seulement si demandé explicitement
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

    // Nouvelle fonction pour récupérer le rôle configuré pour un niveau spécifique
    getRoleForLevel(level, guild = null) {
        try {
            const config = this.loadConfig();
            
            if (!config.roleRewards) {
                return null;
            }
            
            let roleReward = null;
            
            // Gérer le cas où roleRewards peut être un objet ou un tableau
            if (Array.isArray(config.roleRewards)) {
                // Trouver le rôle pour le niveau exact ou le niveau le plus proche en dessous
                const sortedRewards = config.roleRewards
                    .filter(reward => reward.level <= level)
                    .sort((a, b) => b.level - a.level);
                roleReward = sortedRewards[0] || null;
            } else {
                // Si c'est un objet, chercher par clé de niveau
                const availableLevels = Object.keys(config.roleRewards)
                    .map(key => parseInt(key))
                    .filter(lvl => lvl <= level)
                    .sort((a, b) => b - a);
                
                if (availableLevels.length > 0) {
                    const bestLevel = availableLevels[0];
                    roleReward = {
                        level: bestLevel,
                        roleId: config.roleRewards[bestLevel]
                    };
                }
            }
            
            if (roleReward && roleReward.roleId && guild) {
                // Récupérer le nom du rôle depuis Discord
                const role = guild.roles.cache.get(roleReward.roleId);
                return {
                    level: roleReward.level,
                    roleId: roleReward.roleId,
                    roleName: role ? role.name : 'Rôle inconnu'
                };
            } else if (roleReward && roleReward.roleId) {
                // Retourner sans nom si pas de guild
                return {
                    level: roleReward.level,
                    roleId: roleReward.roleId,
                    roleName: null
                };
            }
            
            return null;
        } catch (error) {
            console.error('Erreur récupération rôle pour niveau:', error);
            return null;
        }
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
            let roleAwarded = null;
            
            if (config.roleRewards) {
                // Gérer le cas où roleRewards peut être un objet ou un tableau
                let roleReward = null;
                if (Array.isArray(config.roleRewards)) {
                    roleReward = config.roleRewards.find(reward => reward.level === newLevel);
                } else {
                    // Si c'est un objet, chercher par clé de niveau
                    roleReward = config.roleRewards[newLevel] ? {
                        level: newLevel,
                        roleId: config.roleRewards[newLevel]
                    } : null;
                }
                
                if (roleReward && roleReward.roleId) {
                    try {
                        const role = await guild.roles.fetch(roleReward.roleId);
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
            }
            
            // Send level up notification
            if (config.notifications.enabled && config.notifications.channelId) {
                await this.sendLevelUpNotification(userId, userLevel, oldLevel, newLevel, roleAwarded, guild, config);
            }
            
            // Send separate reward notification if a role was awarded
            if (roleAwarded && config.notifications.enabled && config.notifications.channelId) {
                await this.sendRewardNotification(userId, roleAwarded, newLevel, guild, config);
            }
            
        } catch (error) {
            console.error('Erreur gestion level up:', error);
        }
    }

    async sendLevelUpNotification(userId, userLevel, oldLevel, newLevel, roleReward, guild, config) {
        try {
            const channelId = config.notifications.channelId || config.notifications.channel;
            const channel = await guild.channels.fetch(channelId);
            if (!channel || !channel.isTextBased()) {
                console.log(`⚠️ Canal de notification non trouvé ou invalide: ${channelId}`);
                return;
            }
            
            const user = await guild.members.fetch(userId);
            if (!user) return;
            
            console.log(`🎉 Envoi notification niveau ${newLevel} pour ${user.user.username} dans ${channel.name}`);
            
            // Message simple comme demandé
            let message = `Félicitations tu as atteint le niveau ${newLevel}`;
            
            const messageContent = {
                content: message,
                allowedMentions: { users: [userId] } // Permet le ping de l'utilisateur
            };
            
            // Générer et ajouter la carte de niveau
            try {
                // Préparer l'utilisateur avec ses rôles pour la génération de carte
                const serverAvatar = user.displayAvatarURL?.({ format: 'png', size: 256 }) || null;
                const globalAvatar = user.user.displayAvatarURL?.({ format: 'png', size: 256 }) || null;
                let finalAvatar = serverAvatar || globalAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
                
                if (finalAvatar && finalAvatar.includes('.webp')) {
                    finalAvatar = finalAvatar.replace('.webp', '.png');
                }
                
                const userWithRoles = {
                    id: user.user.id,
                    username: user.user.username || 'Unknown',
                    displayName: user.displayName || user.user.displayName || user.user.username || 'Unknown User',
                    avatarURL: finalAvatar,
                    roles: user.roles.cache.map(role => ({ name: role.name, id: role.id })),
                    rolesCount: user.roles.cache.size
                };
                
                // Calculs de progression pour la carte
                const currentLevelXP = this.calculateXPForLevel(newLevel);
                const nextLevelXP = this.calculateXPForLevel(newLevel + 1);
                const xpProgress = Math.max(0, userLevel.xp - currentLevelXP);
                const xpNeeded = nextLevelXP - currentLevelXP;
                const progressPercent = Math.min(100, Math.max(0, Math.round((xpProgress / xpNeeded) * 100)));
                
                const progressData = {
                    currentXP: xpProgress,
                    totalNeeded: xpNeeded,
                    progressPercent: progressPercent,
                    totalXP: userLevel.xp,
                    nextLevelXP: nextLevelXP,
                    totalMessages: userLevel.totalMessages || 0,
                    totalVoiceTime: Math.floor((userLevel.totalVoiceTime || 0) / 60000),
                    rank: 1, // Placeholder pour notification
                    totalUsers: 1
                };
                
                // Utiliser uniquement le style holographique avec choix d'image selon les rôles
                console.log(`🎨 Génération carte niveau: holographic (image selon rôles)`);
                
                const cardBuffer = await levelCardGenerator.generateNotificationCard(
                    userWithRoles,
                    newLevel
                );
                
                if (cardBuffer && cardBuffer.length > 0) {
                    messageContent.files = [{
                        attachment: cardBuffer,
                        name: `level_up_${userId}_${newLevel}.png`
                    }];
                }
            } catch (cardError) {
                console.error('Erreur génération carte pour notification:', cardError);
                // Continue without card
            }
            
            messageContent.content = `<@${userId}>`;
            await channel.send(messageContent);
            console.log(`✅ Notification niveau envoyée pour ${user.user.username}`);
            
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

    // Fonction pour forcer la notification d'un niveau et attribution des récompenses
    async forceLevelNotification(userId, guildId, guild) {
        try {
            const userLevel = this.getUserLevel(userId, guildId);
            const config = this.loadConfig();
            
            console.log(`🔔 Force notification niveau ${userLevel.level} pour ${userId}`);
            
            // Vérifier et attribuer les récompenses de rôles manquées
            let roleAwarded = null;
            if (config.roleRewards) {
                // Gérer le cas où roleRewards peut être un objet ou un tableau
                let roleReward = null;
                if (Array.isArray(config.roleRewards)) {
                    roleReward = config.roleRewards.find(reward => reward.level === userLevel.level);
                } else {
                    // Si c'est un objet, chercher par clé de niveau
                    roleReward = config.roleRewards[userLevel.level] ? {
                        level: userLevel.level,
                        roleId: config.roleRewards[userLevel.level]
                    } : null;
                }
                
                if (roleReward && roleReward.roleId) {
                    try {
                        const role = await guild.roles.fetch(roleReward.roleId);
                        const member = await guild.members.fetch(userId);
                        
                        if (role && member && !member.roles.cache.has(roleReward.roleId)) {
                            await member.roles.add(role);
                            roleAwarded = role;
                            console.log(`🎁 Rôle ${role.name} attribué (rattrapage) à ${member.user.username} pour le niveau ${userLevel.level}`);
                        }
                    } catch (error) {
                        console.error('Erreur attribution rôle rattrapage:', error);
                    }
                }
            }
            
            // Envoyer notification de niveau
            if (config.notifications.enabled && config.notifications.channelId) {
                await this.sendLevelUpNotification(userId, userLevel, userLevel.level - 1, userLevel.level, null, guild, config);
            }
            
            // Envoyer notification de récompense SEULEMENT si un rôle a été attribué
            if (roleAwarded && config.notifications.enabled && config.notifications.channelId) {
                await this.sendRewardNotification(userId, roleAwarded, userLevel.level, guild, config);
            }
            
        } catch (error) {
            console.error('Erreur force notification niveau:', error);
        }
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

    async sendRewardNotification(userId, role, level, guild, config) {
        try {
            const channel = await guild.channels.fetch(config.notifications.channelId);
            if (!channel || !channel.isTextBased()) {
                console.log(`⚠️ Canal de notification non trouvé ou invalide: ${config.notifications.channelId}`);
                return;
            }
            
            const user = await guild.members.fetch(userId);
            if (!user) return;
            
            console.log(`🎁 Envoi notification récompense ${role.name} pour ${user.user.username} dans ${channel.name}`);
            
            // Préparer l'utilisateur avec ses rôles pour la génération de carte
            const serverAvatar = user.displayAvatarURL?.({ format: 'png', size: 256 }) || null;
            const globalAvatar = user.user.displayAvatarURL?.({ format: 'png', size: 256 }) || null;
            let finalAvatar = serverAvatar || globalAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
            
            if (finalAvatar && finalAvatar.includes('.webp')) {
                finalAvatar = finalAvatar.replace('.webp', '.png');
            }

            const userWithRoles = {
                id: user.user.id,
                username: user.user.username || 'Unknown',
                displayName: user.displayName || user.user.displayName || user.user.username || 'Unknown User',
                avatarURL: finalAvatar,
                roles: user.roles.cache.map(role => ({ name: role.name, id: role.id }))
            };

            const messageContent = {
                content: `<@${userId}> 🏆 **Nouvelle récompense obtenue !**`,
                allowedMentions: { users: [userId] }
            };
            
            // Générer et ajouter la carte de récompense
            try {
                const cardBuffer = await levelCardGenerator.generateRewardCard(
                    userWithRoles,
                    `🏆 Rôle obtenu: ${role.name}`,
                    level
                );
                
                if (cardBuffer && cardBuffer.length > 0) {
                    messageContent.files = [{
                        attachment: cardBuffer,
                        name: `reward_${userId}_${level}.png`
                    }];
                }
            } catch (cardError) {
                console.error('Erreur génération carte pour récompense:', cardError);
                // Continue without card
            }
            
            await channel.send(messageContent);
            console.log(`✅ Notification récompense envoyée pour ${user.user.username}`);
            
        } catch (error) {
            console.error('Erreur envoi notification récompense:', error);
        }
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