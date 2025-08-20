const { REST, Routes } = require('discord.js');

/**
 * Script pour nettoyer les commandes de vérification séparées lors du redéploiement
 * Ce script supprime spécifiquement les commandes liées au système de vérification
 * pour éviter les conflits avec les nouvelles commandes unifiées
 */

// Configuration - à adapter selon votre setup
const config = {
  token: process.env.DISCORD_TOKEN || require('../config.json').token,
  clientId: process.env.CLIENT_ID || require('../config.json').clientId,
  guildId: process.env.GUILD_ID || require('../config.json').guildId
};

// Liste des commandes de vérification à supprimer
const VERIF_COMMANDS_TO_REMOVE = [
  'verif-config',
  'config-verif-menu', 
  'verif-menu',
  'security-config',
  'quarantine-config',
  'auto-verif-config',
  'verif-actions',
  'verif-notifications',
  'verif-exemptions',
  'verif-reset',
  'old-quarantaine', // anciennes versions
  'old-config-verif',
  'separate-verif'
];

const rest = new REST({ version: '10' }).setToken(config.token);

async function cleanupVerifCommands() {
  try {
    console.log('🧹 Nettoyage des commandes de vérification séparées...\n');

    let removedCount = 0;

    // Nettoyer les commandes globales
    console.log('📡 Vérification des commandes globales...');
    try {
      const globalCommands = await rest.get(Routes.applicationCommands(config.clientId));
      
      for (const cmd of globalCommands) {
        if (VERIF_COMMANDS_TO_REMOVE.includes(cmd.name) || 
            cmd.name.includes('verif') || 
            cmd.name.includes('quarantine') ||
            cmd.name.includes('security-config')) {
          
          await rest.delete(Routes.applicationCommand(config.clientId, cmd.id));
          console.log(`  ❌ Supprimée (globale): ${cmd.name}`);
          removedCount++;
        }
      }
    } catch (error) {
      console.log('  ⚠️ Aucune commande globale à nettoyer ou erreur:', error.message);
    }

    // Nettoyer les commandes de guilde
    if (config.guildId) {
      console.log('\n🏠 Vérification des commandes de guilde...');
      try {
        const guildCommands = await rest.get(Routes.applicationGuildCommands(config.clientId, config.guildId));
        
        for (const cmd of guildCommands) {
          if (VERIF_COMMANDS_TO_REMOVE.includes(cmd.name) || 
              cmd.name.includes('verif') || 
              cmd.name.includes('quarantine') ||
              cmd.name.includes('security-config')) {
            
            await rest.delete(Routes.applicationGuildCommand(config.clientId, config.guildId, cmd.id));
            console.log(`  ❌ Supprimée (guilde): ${cmd.name}`);
            removedCount++;
          }
        }
      } catch (error) {
        console.log('  ⚠️ Aucune commande de guilde à nettoyer ou erreur:', error.message);
      }
    }

    console.log(`\n✅ Nettoyage terminé ! ${removedCount} commande(s) supprimée(s).`);
    
    if (removedCount === 0) {
      console.log('ℹ️ Aucune commande de vérification séparée trouvée.');
    } else {
      console.log('\n💡 Les nouvelles commandes unifiées peuvent maintenant être déployées sans conflit.');
      console.log('   Utilisez /config-verif pour accéder au système unifié.');
    }

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des commandes:', error);
    process.exit(1);
  }
}

// Fonction pour nettoyer toutes les commandes (mode complet)
async function cleanupAllCommands() {
  try {
    console.log('🧹 SUPPRESSION COMPLÈTE de toutes les commandes...\n');
    console.log('⚠️ ATTENTION: Cette action supprime TOUTES les commandes du bot!\n');

    let removedCount = 0;

    // Commandes globales
    try {
      const globalCommands = await rest.get(Routes.applicationCommands(config.clientId));
      for (const cmd of globalCommands) {
        await rest.delete(Routes.applicationCommand(config.clientId, cmd.id));
        console.log(`❌ Supprimée (globale): ${cmd.name}`);
        removedCount++;
      }
    } catch (error) {
      console.log('⚠️ Aucune commande globale ou erreur:', error.message);
    }

    // Commandes de guilde
    if (config.guildId) {
      try {
        const guildCommands = await rest.get(Routes.applicationGuildCommands(config.clientId, config.guildId));
        for (const cmd of guildCommands) {
          await rest.delete(Routes.applicationGuildCommand(config.clientId, config.guildId, cmd.id));
          console.log(`❌ Supprimée (guilde): ${cmd.name}`);
          removedCount++;
        }
      } catch (error) {
        console.log('⚠️ Aucune commande de guilde ou erreur:', error.message);
      }
    }

    console.log(`\n✅ ${removedCount} commande(s) supprimée(s) au total.`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression complète:', error);
    process.exit(1);
  }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);

if (args.includes('--all') || args.includes('-a')) {
  console.log('🚨 Mode suppression complète activé\n');
  cleanupAllCommands();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📋 Script de nettoyage des commandes de vérification

Usage:
  node scripts/cleanup-verif-commands.js [options]

Options:
  (aucune)     Nettoie uniquement les commandes de vérification séparées
  --all, -a    Supprime TOUTES les commandes (attention!)
  --help, -h   Affiche cette aide

Exemples:
  node scripts/cleanup-verif-commands.js           # Nettoyage sélectif
  node scripts/cleanup-verif-commands.js --all     # Suppression complète
  
💡 Recommandé: Utilisez ce script avant chaque redéploiement pour éviter
   les conflits entre anciennes et nouvelles commandes.
`);
} else {
  cleanupVerifCommands();
}

module.exports = {
  cleanupVerifCommands,
  cleanupAllCommands,
  VERIF_COMMANDS_TO_REMOVE
};