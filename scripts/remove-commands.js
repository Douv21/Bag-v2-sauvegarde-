const { REST, Routes } = require('discord.js');

async function removeCommands({ token, clientId }) {
    if (!token || !clientId) {
        throw new Error('DISCORD_TOKEN et CLIENT_ID sont requis');
    }

    const rest = new REST({ version: '10' }).setToken(token);
    const TARGET_NAMES = new Set([
        'apercu-couleur',
        'mongodb-backup',
        'mongodb-diagnostic',
        'reset',
        'test-level-notif'
    ]);

    // Supprimer globalement
    try {
        const global = await rest.get(Routes.applicationCommands(clientId));
        for (const cmd of global) {
            if (TARGET_NAMES.has(cmd.name)) {
                await rest.delete(Routes.applicationCommand(clientId, cmd.id));
                console.log(`❌ Supprimée (globale) : ${cmd.name}`);
            }
        }
    } catch (err) {
        console.warn('⚠️ Erreur suppression globale:', err?.message || err);
    }

    // Suppression par liste explicite de guilds (recommandé pour token bot)
    const guildIds = String(process.env.GUILD_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (guildIds.length) {
        for (const guildId of guildIds) {
            try {
                const list = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
                for (const cmd of list) {
                    if (TARGET_NAMES.has(cmd.name)) {
                        await rest.delete(Routes.applicationGuildCommand(clientId, guildId, cmd.id));
                        console.log(`❌ Supprimée (guild ${guildId}) : ${cmd.name}`);
                    }
                }
            } catch (e) {
                console.warn(`⚠️ Erreur sur guilde ${guildId}:`, e?.message || e);
            }
        }
    } else {
        // Fallback: tenter de supprimer côté guildes connus du bot si GUILD_IDS non fourni
        try {
            const guildIdsGuess = String(process.env.KNOWN_GUILD_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
            for (const guildId of guildIdsGuess) {
                const list = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
                for (const cmd of list) {
                    if (TARGET_NAMES.has(cmd.name)) {
                        await rest.delete(Routes.applicationGuildCommand(clientId, guildId, cmd.id));
                        console.log(`❌ Supprimée (guild ${guildId}) : ${cmd.name}`);
                    }
                }
            }
        } catch (e) {
            console.log('ℹ️ Aucune guilde fournie. Définissez GUILD_IDS=ID1,ID2 pour supprimer côté guildes.');
        }
    }
}

if (require.main === module) {
    removeCommands({ token: process.env.DISCORD_TOKEN, clientId: process.env.CLIENT_ID })
        .then(() => console.log('✅ Suppression terminée'))
        .catch((e) => { console.error('❌ Échec suppression:', e); process.exit(1); });
}

module.exports = removeCommands;

