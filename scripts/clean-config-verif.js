/**
 * Script automatique pour nettoyer les anciennes commandes config-verif
 * Utilisé dans le processus de déploiement
 */

// Charger les variables d'environnement
try {
    require('dotenv').config();
} catch (e) {
    // Ignorer si dotenv n'est pas disponible
}

const { REST, Routes } = require('discord.js');

async function cleanConfigVerifCommands() {
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID;
    const guildId = process.env.GUILD_ID;

    if (!token || !clientId) {
        console.log('⚠️ Token ou Client ID manquant, nettoyage ignoré');
        return;
    }

    const rest = new REST().setToken(token);

    try {
        console.log('🧹 Nettoyage des anciennes commandes config-verif...');

        let commands;
        if (guildId) {
            commands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
        } else {
            commands = await rest.get(Routes.applicationCommands(clientId));
        }

        // Rechercher les commandes config-verif obsolètes
        const oldCommands = commands.filter(cmd => {
            // Garder la nouvelle commande config-verif-menu, supprimer l'ancienne config-verif
            return cmd.name === 'config-verif' && cmd.description.includes('Configuration unifiée');
        });

        if (oldCommands.length === 0) {
            console.log('✅ Aucune ancienne commande config-verif à nettoyer');
            return;
        }

        console.log(`🗑️ Suppression de ${oldCommands.length} ancienne(s) commande(s)...`);
        
        for (const command of oldCommands) {
            try {
                if (guildId) {
                    await rest.delete(Routes.applicationGuildCommand(clientId, guildId, command.id));
                } else {
                    await rest.delete(Routes.applicationCommand(clientId, command.id));
                }
                console.log(`✅ Ancienne commande "${command.name}" supprimée`);
            } catch (error) {
                console.log(`⚠️ Erreur suppression "${command.name}":`, error.message);
            }
        }

        console.log('🎉 Nettoyage terminé !');

    } catch (error) {
        console.log('⚠️ Erreur lors du nettoyage:', error.message);
        // Ne pas faire échouer le processus principal
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    cleanConfigVerifCommands().catch(console.error);
}

module.exports = { cleanConfigVerifCommands };