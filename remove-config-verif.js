/**
 * Script pour supprimer les anciennes commandes /config-verif
 * Ce script supprime les commandes slash obsolètes du serveur Discord
 */

// Charger les variables d'environnement
try {
    require('dotenv').config();
} catch (e) {
    console.log('⚠️ dotenv non installé, utilisation des variables d\'environnement système');
}

const { REST, Routes } = require('discord.js');

async function removeOldConfigVerifCommands() {
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID;
    const guildId = process.env.GUILD_ID;

    if (!token) {
        console.error('❌ DISCORD_TOKEN manquant dans les variables d\'environnement');
        process.exit(1);
    }

    if (!clientId) {
        console.error('❌ CLIENT_ID manquant dans les variables d\'environnement');
        process.exit(1);
    }

    const rest = new REST().setToken(token);

    try {
        console.log('🔍 Récupération des commandes existantes...');

        let commands;
        if (guildId) {
            // Commandes spécifiques à un serveur
            console.log(`📍 Ciblage du serveur: ${guildId}`);
            commands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
        } else {
            // Commandes globales
            console.log('🌍 Ciblage des commandes globales');
            commands = await rest.get(Routes.applicationCommands(clientId));
        }

        console.log(`📋 ${commands.length} commandes trouvées`);

        // Rechercher les commandes config-verif à supprimer
        const configVerifCommands = commands.filter(cmd => 
            cmd.name === 'config-verif' || cmd.name === 'config-verif-menu'
        );

        if (configVerifCommands.length === 0) {
            console.log('✅ Aucune commande config-verif trouvée à supprimer');
            return;
        }

        console.log(`🎯 ${configVerifCommands.length} commande(s) config-verif trouvée(s):`);
        configVerifCommands.forEach(cmd => {
            console.log(`  - ${cmd.name} (ID: ${cmd.id})`);
        });

        // Demander confirmation
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise(resolve => {
            rl.question('⚠️  Voulez-vous supprimer ces commandes ? (y/N): ', resolve);
        });
        rl.close();

        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log('❌ Suppression annulée');
            return;
        }

        // Supprimer les commandes
        console.log('🗑️  Suppression des commandes...');
        
        for (const command of configVerifCommands) {
            try {
                if (guildId) {
                    await rest.delete(Routes.applicationGuildCommand(clientId, guildId, command.id));
                } else {
                    await rest.delete(Routes.applicationCommand(clientId, command.id));
                }
                console.log(`✅ Commande "${command.name}" supprimée (ID: ${command.id})`);
            } catch (error) {
                console.error(`❌ Erreur lors de la suppression de "${command.name}":`, error.message);
            }
        }

        console.log('🎉 Suppression terminée !');
        
        // Optionnel: Réenregistrer toutes les commandes pour s'assurer que tout est à jour
        console.log('\n💡 Pour réenregistrer toutes les commandes à jour, exécutez:');
        console.log('   npm run deploy:commands');

    } catch (error) {
        console.error('❌ Erreur lors de la suppression des commandes:', error);
        
        if (error.code === 50001) {
            console.error('💡 Erreur: Bot manque de permissions. Vérifiez que le bot a les permissions "applications.commands"');
        } else if (error.code === 'TokenInvalid') {
            console.error('💡 Token Discord invalide. Vérifiez votre DISCORD_TOKEN');
        }
        
        process.exit(1);
    }
}

// Fonction alternative pour supprimer TOUTES les commandes (mode nuclear)
async function removeAllCommands() {
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID;
    const guildId = process.env.GUILD_ID;

    if (!token || !clientId) {
        console.error('❌ DISCORD_TOKEN et CLIENT_ID requis');
        process.exit(1);
    }

    const rest = new REST().setToken(token);

    try {
        console.log('☢️  MODE NUCLEAR: Suppression de TOUTES les commandes...');
        
        if (guildId) {
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
            console.log('✅ Toutes les commandes du serveur supprimées');
        } else {
            await rest.put(Routes.applicationCommands(clientId), { body: [] });
            console.log('✅ Toutes les commandes globales supprimées');
        }
        
        console.log('💡 N\'oubliez pas de réenregistrer vos commandes avec: npm run deploy:commands');
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

// Vérifier les arguments de ligne de commande
const args = process.argv.slice(2);

if (args.includes('--nuclear') || args.includes('--all')) {
    console.log('⚠️  Mode nuclear activé - suppression de TOUTES les commandes');
    removeAllCommands();
} else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📋 Script de suppression des commandes config-verif

Usage:
  node remove-config-verif.js                 # Supprimer seulement config-verif
  node remove-config-verif.js --nuclear       # Supprimer TOUTES les commandes
  node remove-config-verif.js --help          # Afficher cette aide

Variables d'environnement requises:
  DISCORD_TOKEN    # Token du bot Discord
  CLIENT_ID        # ID de l'application Discord
  GUILD_ID         # (Optionnel) ID du serveur pour commandes locales
    `);
} else {
    removeOldConfigVerifCommands();
}