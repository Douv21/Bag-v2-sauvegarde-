#!/usr/bin/env node

/**
 * Script de nettoyage des commandes inutiles pour le redéploiement sur Render
 * Ce script supprime les fichiers de commandes temporaires, de test, et obsolètes
 * pour optimiser le déploiement et éviter les conflits.
 * 
 * Usage: node cleanup-commands-for-render.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

// Configuration des commandes à supprimer
const COMMANDS_TO_REMOVE = [
  // Commandes de test et diagnostic
  'test-verif.js',
  'test-level-notif.js',
  'diagnostic-quarantine.js',
  'mongodb-diagnostic.js',
  
  // Commandes de backup/maintenance (pas nécessaires en production)
  'force-backup.js',
  'mongodb-backup.js',
  'backup-status.js',
  
  // Versions obsolètes
  'voler-old.js',
  'parier-old.js',
  
  // Commandes administratives de développement
  'clear-commands.js',
  'reset.js',
  
  // Fichiers non-JS (images, fichiers temporaires)
  '1',
  '1.jpg',
  '2.jpg',
  '2.png',
  '3.jpg',
  '3.png',
  'default-avatar.png'
];

// Commandes potentiellement inutiles (à vérifier)
const OPTIONAL_COMMANDS_TO_REMOVE = [
  // Commandes de modération basiques (si vous avez des alternatives)
  'massban.js',
  'masskick.js',
  
  // Commandes de développement/maintenance
  'setup-colors.js',
  'inactivity-report.js'
];

// Patterns de fichiers à supprimer
const PATTERNS_TO_REMOVE = [
  /.*-old\.js$/,          // Fichiers finissant par -old.js
  /.*-temp\.js$/,         // Fichiers temporaires
  /.*-test\.js$/,         // Fichiers de test
  /.*-debug\.js$/,        // Fichiers de debug
  /.*-backup\.js$/,       // Fichiers de backup
  /.*\.png$/,             // Images PNG
  /.*\.jpg$/,             // Images JPG
  /.*\.jpeg$/,            // Images JPEG
  /.*\.gif$/,             // Images GIF
  /^\d+$/                 // Fichiers nommés avec des chiffres uniquement
];

class CommandCleaner {
  constructor(dryRun = false) {
    this.dryRun = dryRun;
    this.commandsDir = path.join(__dirname, 'commands');
    this.removedFiles = [];
    this.keptFiles = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const prefix = {
      info: '📝',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      dry: '🔍'
    };
    
    console.log(`${prefix[type]} ${message}`);
  }

  shouldRemoveFile(filename) {
    // Vérifier la liste explicite
    if (COMMANDS_TO_REMOVE.includes(filename)) {
      return { remove: true, reason: 'Liste explicite' };
    }

    // Vérifier les patterns
    for (const pattern of PATTERNS_TO_REMOVE) {
      if (pattern.test(filename)) {
        return { remove: true, reason: `Pattern: ${pattern}` };
      }
    }

    return { remove: false, reason: 'Fichier conservé' };
  }

  async cleanupCommands() {
    this.log(`🚀 Démarrage du nettoyage des commandes${this.dryRun ? ' (MODE DRY-RUN)' : ''}`, 'info');
    this.log(`📂 Répertoire: ${this.commandsDir}`, 'info');

    try {
      // Vérifier que le répertoire existe
      if (!fs.existsSync(this.commandsDir)) {
        throw new Error(`Le répertoire commands n'existe pas: ${this.commandsDir}`);
      }

      // Lire tous les fichiers
      const files = fs.readdirSync(this.commandsDir);
      this.log(`📋 ${files.length} fichiers trouvés`, 'info');

      // Traiter chaque fichier
      for (const file of files) {
        const filePath = path.join(this.commandsDir, file);
        const stats = fs.statSync(filePath);

        // Ignorer les répertoires
        if (stats.isDirectory()) {
          this.log(`📁 Répertoire ignoré: ${file}`, 'info');
          continue;
        }

        const shouldRemove = this.shouldRemoveFile(file);

        if (shouldRemove.remove) {
          await this.removeFile(filePath, file, shouldRemove.reason);
        } else {
          this.keptFiles.push(file);
          this.log(`✅ Conservé: ${file}`, 'success');
        }
      }

      // Afficher le résumé
      this.displaySummary();

    } catch (error) {
      this.log(`Erreur lors du nettoyage: ${error.message}`, 'error');
      this.errors.push(error.message);
      return false;
    }

    return this.errors.length === 0;
  }

  async removeFile(filePath, filename, reason) {
    try {
      if (this.dryRun) {
        this.log(`🔍 [DRY-RUN] Supprimerait: ${filename} (${reason})`, 'dry');
        this.removedFiles.push(filename);
      } else {
        fs.unlinkSync(filePath);
        this.log(`🗑️ Supprimé: ${filename} (${reason})`, 'warning');
        this.removedFiles.push(filename);
      }
    } catch (error) {
      const errorMsg = `Erreur lors de la suppression de ${filename}: ${error.message}`;
      this.log(errorMsg, 'error');
      this.errors.push(errorMsg);
    }
  }

  displaySummary() {
    console.log('\n' + '='.repeat(60));
    this.log('📊 RÉSUMÉ DU NETTOYAGE', 'info');
    console.log('='.repeat(60));
    
    this.log(`🗑️ Fichiers supprimés: ${this.removedFiles.length}`, 'warning');
    this.log(`✅ Fichiers conservés: ${this.keptFiles.length}`, 'success');
    this.log(`❌ Erreurs: ${this.errors.length}`, this.errors.length > 0 ? 'error' : 'success');

    if (this.removedFiles.length > 0) {
      console.log('\n📋 Fichiers supprimés:');
      this.removedFiles.forEach(file => console.log(`  - ${file}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Erreurs rencontrées:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }

    // Estimation de l'espace libéré
    const estimatedSavings = this.removedFiles.length * 50; // Estimation 50KB par fichier
    this.log(`💾 Espace estimé libéré: ~${estimatedSavings}KB`, 'info');

    if (this.dryRun) {
      console.log('\n💡 Pour exécuter réellement, lancez: node cleanup-commands-for-render.js');
    } else {
      console.log('\n🎉 Nettoyage terminé avec succès!');
      console.log('🚀 Votre bot est maintenant prêt pour le redéploiement sur Render.');
    }
  }

  // Méthode pour créer une sauvegarde avant nettoyage
  async createBackup() {
    const backupDir = path.join(__dirname, 'commands-backup');
    
    try {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }

      const files = fs.readdirSync(this.commandsDir);
      let backedUp = 0;

      for (const file of files) {
        const shouldRemove = this.shouldRemoveFile(file);
        if (shouldRemove.remove) {
          const sourcePath = path.join(this.commandsDir, file);
          const backupPath = path.join(backupDir, file);
          
          if (fs.statSync(sourcePath).isFile()) {
            fs.copyFileSync(sourcePath, backupPath);
            backedUp++;
          }
        }
      }

      this.log(`💾 Sauvegarde créée: ${backedUp} fichiers dans ${backupDir}`, 'success');
      return true;
    } catch (error) {
      this.log(`Erreur lors de la sauvegarde: ${error.message}`, 'error');
      return false;
    }
  }
}

// Script principal
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  const createBackup = args.includes('--backup') || args.includes('-b');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`
🧹 Script de nettoyage des commandes pour Render

Usage: node cleanup-commands-for-render.js [options]

Options:
  --dry-run, -n     Simulation (ne supprime pas réellement)
  --backup, -b      Créer une sauvegarde avant nettoyage
  --help, -h        Afficher cette aide

Exemples:
  node cleanup-commands-for-render.js --dry-run    # Voir ce qui serait supprimé
  node cleanup-commands-for-render.js --backup     # Sauvegarder puis nettoyer
  node cleanup-commands-for-render.js              # Nettoyer directement
    `);
    process.exit(0);
  }

  const cleaner = new CommandCleaner(dryRun);

  // Créer une sauvegarde si demandé
  if (createBackup && !dryRun) {
    console.log('💾 Création de la sauvegarde...');
    const backupSuccess = await cleaner.createBackup();
    if (!backupSuccess) {
      console.log('❌ Échec de la sauvegarde. Arrêt du script.');
      process.exit(1);
    }
  }

  // Exécuter le nettoyage
  const success = await cleaner.cleanupCommands();
  
  process.exit(success ? 0 : 1);
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = CommandCleaner;