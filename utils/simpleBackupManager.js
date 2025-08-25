/**
 * GESTIONNAIRE DE SAUVEGARDE SIMPLE
 * Sauvegarde basique des fichiers de données critiques
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class SimpleBackupManager {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.backupDir = path.join(this.dataDir, 'backups');
        this.maxBackups = 5; // Garder 5 sauvegardes maximum
        
        // Fichiers critiques à sauvegarder
        this.criticalFiles = [
            'economy.json',
            'users.json',
            'shop.json',
            'aouv_config.json',
            'level_users.json',
            'karma_config.json',
            'counting.json',
            'daily.json'
        ];
        
        this.ensureBackupDirectory();
    }

    async ensureBackupDirectory() {
        try {
            if (!fsSync.existsSync(this.backupDir)) {
                await fs.mkdir(this.backupDir, { recursive: true });
            }
        } catch (error) {
            console.error('❌ Erreur création dossier backup:', error);
        }
    }

    async performBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            let backupCount = 0;

            // Sauvegarder chaque fichier critique
            for (const filename of this.criticalFiles) {
                const sourceFile = path.join(this.dataDir, filename);
                
                if (fsSync.existsSync(sourceFile)) {
                    const backupFilename = `${filename.replace('.json', '')}_backup_${timestamp}.json`;
                    const backupFile = path.join(this.backupDir, backupFilename);
                    
                    try {
                        await fs.copyFile(sourceFile, backupFile);
                        backupCount++;
                    } catch (error) {
                        console.error(`❌ Erreur backup ${filename}:`, error);
                    }
                }
            }

            console.log(`✅ Sauvegarde simple: ${backupCount} fichiers sauvegardés`);
            
            // Nettoyer les anciennes sauvegardes
            await this.cleanOldBackups();
            
            return true;
        } catch (error) {
            console.error('❌ Erreur sauvegarde simple:', error);
            return false;
        }
    }

    async cleanOldBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files.filter(file => file.includes('backup_')).sort();
            
            if (backupFiles.length > this.maxBackups) {
                const filesToDelete = backupFiles.slice(0, backupFiles.length - this.maxBackups);
                
                for (const file of filesToDelete) {
                    await fs.unlink(path.join(this.backupDir, file));
                }
                
                console.log(`🧹 ${filesToDelete.length} anciennes sauvegardes supprimées`);
            }
        } catch (error) {
            console.error('❌ Erreur nettoyage backups:', error);
        }
    }

    async restoreBackup(filename, timestamp) {
        try {
            const backupFilename = `${filename.replace('.json', '')}_backup_${timestamp}.json`;
            const backupFile = path.join(this.backupDir, backupFilename);
            const targetFile = path.join(this.dataDir, filename);
            
            if (fsSync.existsSync(backupFile)) {
                await fs.copyFile(backupFile, targetFile);
                console.log(`✅ Restauration: ${filename} depuis ${timestamp}`);
                return true;
            } else {
                console.log(`❌ Backup non trouvé: ${backupFilename}`);
                return false;
            }
        } catch (error) {
            console.error('❌ Erreur restauration:', error);
            return false;
        }
    }

    async listBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files.filter(file => file.includes('backup_'));
            
            const backupsByFile = {};
            for (const backup of backupFiles) {
                const [filename, , timestamp] = backup.replace('_backup_', '|').replace('.json', '').split('|');
                if (!backupsByFile[filename]) {
                    backupsByFile[filename] = [];
                }
                backupsByFile[filename].push(timestamp);
            }
            
            return backupsByFile;
        } catch (error) {
            console.error('❌ Erreur listage backups:', error);
            return {};
        }
    }
}

module.exports = new SimpleBackupManager();