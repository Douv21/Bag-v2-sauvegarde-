const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class RobustBackupManager {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.backupDir = path.join(this.dataDir, 'backups');
        this.maxBackups = 10; // Garder 10 sauvegardes maximum
        
        // Fichiers critiques à sauvegarder en priorité
        this.criticalFiles = [
            'economy.json',
            'users.json',
            'level_users.json',
            'confessions.json',
            'karma_config.json',
            'shop.json',
            'user_stats.json'
        ];
        
        this.ensureBackupDirectory();
    }

    async ensureBackupDirectory() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
        } catch (error) {
            console.error('❌ Erreur création dossier backup:', error);
        }
    }

    // Découvrir automatiquement tous les fichiers de données
    async discoverDataFiles() {
        try {
            const files = await fs.readdir(this.dataDir);
            return files.filter(file => 
                file.endsWith('.json') && 
                !file.startsWith('.') &&
                file !== 'package.json' &&
                file !== 'package-lock.json'
            );
        } catch (error) {
            console.error('❌ Erreur découverte fichiers:', error);
            return [];
        }
    }

    // Créer une sauvegarde complète avec compression
    async createFullBackup(label = null) {
        try {
            console.log('🗜️ Création sauvegarde complète...');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupLabel = label || `full-backup-${timestamp}`;
            const backupPath = path.join(this.backupDir, `${backupLabel}.json.gz`);
            
            // Découvrir tous les fichiers de données
            const dataFiles = await this.discoverDataFiles();
            const backupData = {
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                files: {},
                metadata: {
                    totalFiles: dataFiles.length,
                    criticalFiles: this.criticalFiles.length,
                    deploymentId: process.env.RENDER_SERVICE_ID || 'local'
                }
            };

            let successCount = 0;
            let errorCount = 0;

            // Sauvegarder chaque fichier
            for (const filename of dataFiles) {
                try {
                    const filePath = path.join(this.dataDir, filename);
                    const data = await fs.readFile(filePath, 'utf8');
                    const jsonData = JSON.parse(data);
                    
                    // Calculer des métadonnées
                    const fileStats = await fs.stat(filePath);
                    
                    backupData.files[filename] = {
                        data: jsonData,
                        size: fileStats.size,
                        lastModified: fileStats.mtime.toISOString(),
                        isCritical: this.criticalFiles.includes(filename),
                        recordCount: Array.isArray(jsonData) ? jsonData.length : Object.keys(jsonData).length
                    };
                    
                    successCount++;
                } catch (error) {
                    console.error(`❌ Erreur sauvegarde ${filename}:`, error.message);
                    errorCount++;
                }
            }

            // Compresser et sauvegarder
            const jsonString = JSON.stringify(backupData, null, 2);
            const compressed = await gzip(jsonString);
            await fs.writeFile(backupPath, compressed);

            // Calculer taille de compression
            const originalSize = Buffer.byteLength(jsonString, 'utf8');
            const compressedSize = compressed.length;
            const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

            console.log(`✅ Sauvegarde complète créée: ${backupLabel}`);
            console.log(`   📁 ${successCount} fichiers sauvegardés, ${errorCount} erreurs`);
            console.log(`   📊 Taille: ${(originalSize/1024).toFixed(1)}KB → ${(compressedSize/1024).toFixed(1)}KB (${compressionRatio}% compression)`);
            
            // Nettoyer les anciennes sauvegardes
            await this.cleanOldBackups();
            
            return {
                success: true,
                backupPath,
                backupLabel,
                filesBackedUp: successCount,
                errors: errorCount,
                compressionRatio: compressionRatio + '%'
            };
            
        } catch (error) {
            console.error('❌ Erreur création sauvegarde:', error);
            return { success: false, error: error.message };
        }
    }

    // Restaurer depuis une sauvegarde
    async restoreFromBackup(backupLabel = null) {
        try {
            console.log('📥 Restauration depuis sauvegarde...');
            
            // Trouver la sauvegarde à utiliser
            let backupPath;
            if (backupLabel) {
                backupPath = path.join(this.backupDir, `${backupLabel}.json.gz`);
            } else {
                // Utiliser la sauvegarde la plus récente
                const backups = await this.listBackups();
                if (backups.length === 0) {
                    throw new Error('Aucune sauvegarde disponible');
                }
                backupPath = backups[0].path;
            }

            // Vérifier que le fichier existe
            if (!fsSync.existsSync(backupPath)) {
                throw new Error(`Sauvegarde non trouvée: ${backupPath}`);
            }

            // Décompresser et parser
            const compressed = await fs.readFile(backupPath);
            const decompressed = await gunzip(compressed);
            const backupData = JSON.parse(decompressed.toString());

            console.log(`📋 Restauration depuis: ${path.basename(backupPath)}`);
            console.log(`   📅 Date: ${backupData.timestamp}`);
            console.log(`   📁 Fichiers disponibles: ${Object.keys(backupData.files).length}`);

            let restoredCount = 0;
            let errorCount = 0;

            // Restaurer chaque fichier
            for (const [filename, fileData] of Object.entries(backupData.files)) {
                try {
                    const filePath = path.join(this.dataDir, filename);
                    
                    // Créer le dossier parent si nécessaire
                    const parentDir = path.dirname(filePath);
                    await fs.mkdir(parentDir, { recursive: true });
                    
                    // Restaurer le fichier
                    await fs.writeFile(filePath, JSON.stringify(fileData.data, null, 2));
                    restoredCount++;
                    
                    console.log(`✅ ${filename} restauré (${fileData.recordCount} enregistrements)`);
                } catch (error) {
                    console.error(`❌ Erreur restauration ${filename}:`, error.message);
                    errorCount++;
                }
            }

            console.log(`✅ Restauration terminée: ${restoredCount} fichiers restaurés, ${errorCount} erreurs`);
            
            return {
                success: true,
                filesRestored: restoredCount,
                errors: errorCount,
                backupDate: backupData.timestamp
            };
            
        } catch (error) {
            console.error('❌ Erreur restauration:', error);
            return { success: false, error: error.message };
        }
    }

    // Lister les sauvegardes disponibles
    async listBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backups = [];
            
            for (const file of files) {
                if (file.endsWith('.json.gz')) {
                    const filePath = path.join(this.backupDir, file);
                    const stats = await fs.stat(filePath);
                    
                    backups.push({
                        name: file.replace('.json.gz', ''),
                        path: filePath,
                        size: stats.size,
                        created: stats.mtime,
                        age: Date.now() - stats.mtime.getTime()
                    });
                }
            }
            
            // Trier par date de création (plus récent en premier)
            return backups.sort((a, b) => b.created - a.created);
            
        } catch (error) {
            console.error('❌ Erreur liste sauvegardes:', error);
            return [];
        }
    }

    // Nettoyer les anciennes sauvegardes
    async cleanOldBackups() {
        try {
            const backups = await this.listBackups();
            
            if (backups.length > this.maxBackups) {
                const toDelete = backups.slice(this.maxBackups);
                
                for (const backup of toDelete) {
                    await fs.unlink(backup.path);
                    console.log(`🗑️ Ancienne sauvegarde supprimée: ${backup.name}`);
                }
            }
        } catch (error) {
            console.error('❌ Erreur nettoyage sauvegardes:', error);
        }
    }

    // Vérifier l'intégrité des données
    async verifyDataIntegrity() {
        try {
            console.log('🔍 Vérification intégrité des données...');
            
            const dataFiles = await this.discoverDataFiles();
            const report = {
                totalFiles: dataFiles.length,
                validFiles: 0,
                corruptedFiles: [],
                emptyFiles: [],
                criticalStatus: 'OK'
            };

            for (const filename of dataFiles) {
                try {
                    const filePath = path.join(this.dataDir, filename);
                    const data = await fs.readFile(filePath, 'utf8');
                    const jsonData = JSON.parse(data);
                    
                    // Vérifier si le fichier est vide
                    if (Object.keys(jsonData).length === 0) {
                        report.emptyFiles.push(filename);
                        if (this.criticalFiles.includes(filename)) {
                            report.criticalStatus = 'WARNING';
                        }
                    } else {
                        report.validFiles++;
                    }
                    
                } catch (error) {
                    report.corruptedFiles.push({ filename, error: error.message });
                    if (this.criticalFiles.includes(filename)) {
                        report.criticalStatus = 'ERROR';
                    }
                }
            }

            console.log(`📊 Rapport d'intégrité:`);
            console.log(`   ✅ ${report.validFiles}/${report.totalFiles} fichiers valides`);
            console.log(`   ⚠️ ${report.emptyFiles.length} fichiers vides`);
            console.log(`   ❌ ${report.corruptedFiles.length} fichiers corrompus`);
            console.log(`   🚨 Statut critique: ${report.criticalStatus}`);

            return report;
            
        } catch (error) {
            console.error('❌ Erreur vérification intégrité:', error);
            return { error: error.message };
        }
    }

    // Sauvegarde d'urgence des fichiers critiques
    async emergencyBackup() {
        try {
            console.log('🚨 Sauvegarde d\'urgence en cours...');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const emergencyPath = path.join(this.backupDir, `emergency-${timestamp}.json`);
            
            const emergencyData = {
                timestamp: new Date().toISOString(),
                type: 'emergency',
                files: {}
            };

            let savedCount = 0;

            // Sauvegarder uniquement les fichiers critiques
            for (const filename of this.criticalFiles) {
                try {
                    const filePath = path.join(this.dataDir, filename);
                    if (fsSync.existsSync(filePath)) {
                        const data = await fs.readFile(filePath, 'utf8');
                        const jsonData = JSON.parse(data);
                        emergencyData.files[filename] = jsonData;
                        savedCount++;
                    }
                } catch (error) {
                    console.error(`❌ Erreur sauvegarde urgence ${filename}:`, error.message);
                }
            }

            await fs.writeFile(emergencyPath, JSON.stringify(emergencyData, null, 2));
            
            console.log(`✅ Sauvegarde d'urgence créée: ${savedCount} fichiers critiques`);
            return { success: true, filesSaved: savedCount, path: emergencyPath };
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde d\'urgence:', error);
            return { success: false, error: error.message };
        }
    }

    // Démarrer la sauvegarde automatique
    startAutoBackup(intervalMinutes = 30) {
        console.log(`🕐 Sauvegarde automatique robuste démarrée (toutes les ${intervalMinutes} minutes)`);
        
        // Sauvegarde immédiate au démarrage
        setTimeout(() => this.createFullBackup('startup'), 5000);
        
        // Sauvegarde périodique
        setInterval(async () => {
            try {
                await this.createFullBackup();
            } catch (error) {
                console.error('❌ Erreur sauvegarde automatique:', error);
                // En cas d'erreur, faire une sauvegarde d'urgence
                await this.emergencyBackup();
            }
        }, intervalMinutes * 60 * 1000);

        // Vérification d'intégrité quotidienne
        setInterval(async () => {
            await this.verifyDataIntegrity();
        }, 24 * 60 * 60 * 1000);
    }
}

module.exports = new RobustBackupManager();