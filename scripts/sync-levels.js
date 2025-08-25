'use strict';

const dataManager = require('../utils/simpleDataManager');

(async () => {
    try {
        const guildId = process.env.GUILD_ID || '';
        const userId = process.env.USER_ID || '';
        const targetXP = Number(process.env.XP || '0');
        const shouldUpdateTarget = guildId && userId && targetXP > 0;

        const economy = await dataManager.loadData('economy.json', {});

        if (shouldUpdateTarget) {
            const econKey = `${userId}_${guildId}`;
            const existing = economy[econKey] || {};
            economy[econKey] = { ...existing, xp: targetXP };
            await dataManager.saveData('economy.json', economy);
            console.log(`✅ Updated economy XP: ${econKey} -> ${targetXP}`);
        }

        const levelConfig = await dataManager.loadData('level_config.json', {});
        const baseXP = (levelConfig.levelFormula && Number(levelConfig.levelFormula.baseXP)) || 100;
        const multiplier = (levelConfig.levelFormula && Number(levelConfig.levelFormula.multiplier)) || 1.5;

        const xpFor = (level) => {
            if (level <= 1) return 0;
            return Math.floor(baseXP * Math.pow(level - 1, multiplier));
        };

        const calculateLevelFromXP = (xp) => {
            let level = 1;
            while (xpFor(level + 1) <= xp) level++;
            return level;
        };

        const levelUsers = await dataManager.loadData('level_users.json', {});
        let updated = 0;

        for (const key of Object.keys(economy)) {
            if (!key.includes('_')) continue; // ignore non-user entries
            const [uid, gid] = key.split('_');
            const xp = Number(economy[key].xp || 0);
            const level = calculateLevelFromXP(xp);
            const userKey = `${gid}_${uid}`; // level_users uses guildId_userId
            const prev = levelUsers[userKey] || {
                userId: uid,
                guildId: gid,
                xp: 0,
                level: 1,
                totalMessages: 0,
                totalVoiceTime: 0,
                lastMessageTime: 0,
                lastVoiceTime: 0
            };
            levelUsers[userKey] = {
                ...prev,
                userId: uid,
                guildId: gid,
                xp,
                level
            };
            updated++;
        }

        await dataManager.saveData('level_users.json', levelUsers);

        if (shouldUpdateTarget) {
            const targetKey = `${guildId}_${userId}`;
            const target = levelUsers[targetKey];
            console.log(`🎯 Target user new level: ${target ? target.level : 'unknown'} (XP=${targetXP})`);
        }

        console.log(`✅ Synchronized ${updated} user(s) from economy -> level_users`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
})();

