/**
 * Simple Backup Manager - Version HTTP-Based pour Render.com
 * Alternative MongoDB via requêtes HTTP
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

class SimpleBackupManager {
    constructor() {
        this.backupEndpoint = process.env.BACKUP_WEBHOOK_URL || null;
        this.enabled = !!this.backupEndpoint;
        
        this.localFiles = [
            'economy.json',
            'level_users.json',      // Données niveaux des membres
            'level_config.json',     // Configuration du système de niveaux
            'confessions.json', 
            'counting.json',
            'autothread.json',
            'shop.json',
            'karma_config.json',
            'message_rewards.json',
            'daily.json',
            'actions.json',
            'config.json'
        ];
    }

    // SAUVEGARDE VIA HTTP WEBHOOK
    async backupToWebhook() {
        if (!this.enabled) {
            console.log('⚠️ Sauvegarde webhook désactivée - BACKUP_WEBHOOK_URL manquant');
            return false;
        }

        try {
            console.log('📤 Sauvegarde via webhook...');
            const dataDir = path.join(__dirname, '..', 'data');
            const backupData = {};

            // Lire tous les fichiers
            for (const filename of this.localFiles) {
                const filePath = path.join(dataDir, filename);
                
                try {
                    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
                    if (fileExists) {
                        const content = await fs.readFile(filePath, 'utf8');
                        backupData[filename] = JSON.parse(content);
                        console.log(`✅ ${filename} préparé pour sauvegarde`);
                    }
                } catch (error) {
                    console.log(`⚠️ Erreur lecture ${filename}:`, error.message);
                }
            }

            // Envoyer via webhook
            const payload = {
                timestamp: new Date().toISOString(),
                deployment: process.env.RENDER_SERVICE_ID || 'local',
                data: backupData
            };

            const success = await this.sendWebhook(payload);
            console.log(success ? '✅ Sauvegarde webhook réussie' : '❌ Échec sauvegarde webhook');
            return success;

        } catch (error) {
            console.error('❌ Erreur sauvegarde webhook:', error);
            return false;
        }
    }

    // ENVOI WEBHOOK HTTPS
    async sendWebhook(data) {
        return new Promise((resolve) => {
            try {
                const url = new URL(this.backupEndpoint);
                const postData = JSON.stringify(data);

                const options = {
                    hostname: url.hostname,
                    port: url.port || 443,
                    path: url.pathname + url.search,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData),
                        'User-Agent': 'BagBot-Backup/1.0'
                    },
                    timeout: 10000
                };

                const req = https.request(options, (res) => {
                    let responseData = '';
                    res.on('data', (chunk) => responseData += chunk);
                    res.on('end', () => {
                        const success = res.statusCode >= 200 && res.statusCode < 300;
                        if (success) {
                            console.log(`📡 Webhook envoyé (${res.statusCode})`);
                        } else {
                            console.log(`❌ Webhook erreur ${res.statusCode}: ${responseData}`);
                        }
                        resolve(success);
                    });
                });

                req.on('error', (error) => {
                    console.error('❌ Erreur requête webhook:', error.message);
                    resolve(false);
                });

                req.on('timeout', () => {
                    console.error('⏰ Timeout webhook');
                    req.destroy();
                    resolve(false);
                });

                req.write(postData);
                req.end();

            } catch (error) {
                console.error('❌ Erreur configuration webhook:', error);
                resolve(false);
            }
        });
    }

    // SAUVEGARDE LOCALE COMPRESSÉE
    async createLocalBackup() {
        try {
            console.log('📦 Création sauvegarde locale...');
            const dataDir = path.join(__dirname, '..', 'data');
            const backupDir = path.join(dataDir, 'backups');
            
            // Créer dossier backups
            await fs.mkdir(backupDir, { recursive: true });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

            const backupData = {
                timestamp: new Date().toISOString(),
                deployment: process.env.RENDER_SERVICE_ID || 'local',
                files: {}
            };

            // Sauvegarder tous les fichiers
            for (const filename of this.localFiles) {
                const filePath = path.join(dataDir, filename);
                
                try {
                    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
                    if (fileExists) {
                        const content = await fs.readFile(filePath, 'utf8');
                        backupData.files[filename] = JSON.parse(content);
                    }
                } catch (error) {
                    console.log(`⚠️ Erreur backup ${filename}:`, error.message);
                }
            }

            // Écrire le fichier de sauvegarde
            await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
            console.log(`✅ Sauvegarde locale créée: ${path.basename(backupFile)}`);

            // Nettoyer les anciennes sauvegardes (garder 5 max)
            await this.cleanOldBackups(backupDir);

            return true;
        } catch (error) {
            console.error('❌ Erreur sauvegarde locale:', error);
            return false;
        }
    }

    // NETTOYAGE ANCIENNES SAUVEGARDES
    async cleanOldBackups(backupDir) {
        try {
            const files = await fs.readdir(backupDir);
            const backupFiles = files
                .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
                .map(file => ({
                    name: file,
                    path: path.join(backupDir, file),
                    time: fs.stat(path.join(backupDir, file)).then(stats => stats.mtime)
                }));

            // Attendre les stats et trier par date
            for (let fileObj of backupFiles) {
                fileObj.time = await fileObj.time;
            }
            
            backupFiles.sort((a, b) => b.time - a.time);

            // Supprimer les anciens (garder 5 max)
            const toDelete = backupFiles.slice(5);
            for (const fileObj of toDelete) {
                await fs.unlink(fileObj.path);
                console.log(`🗑️ Suppression ancienne sauvegarde: ${fileObj.name}`);
            }

        } catch (error) {
            console.error('❌ Erreur nettoyage sauvegardes:', error);
        }
    }

    // SAUVEGARDE AUTOMATIQUE COMPLÈTE
    async performBackup() {
        console.log('💾 Démarrage sauvegarde automatique...');
        
        // Vérification d'intégrité avant sauvegarde
        const integrityCheck = await this.verifyDataIntegrity();
        if (!integrityCheck.isValid) {
            console.log('⚠️ Problèmes d\'intégrité détectés avant sauvegarde');
            console.log(`   - Inventaires manquants: ${integrityCheck.issues.missingInventories.length}`);
            console.log(`   - Incohérences XP: ${integrityCheck.issues.xpInconsistencies.length}`);
            
            // Optionnel: déclencher une réparation automatique
            if (process.env.AUTO_REPAIR_DATA === 'true') {
                console.log('🔧 Réparation automatique activée...');
                try {
                    const DataIntegrityFixer = require('../fix-data-integrity');
                    const fixer = new DataIntegrityFixer();
                    await fixer.runRepair();
                } catch (error) {
                    console.error('❌ Erreur réparation automatique:', error);
                }
            }
        }
        
        const webhookSuccess = await this.backupToWebhook();
        const localSuccess = await this.createLocalBackup();

        const success = webhookSuccess || localSuccess;
        console.log(success ? '✅ Sauvegarde terminée' : '❌ Échec sauvegarde complète');
        
        return success;
    }

    // VÉRIFICATION INTÉGRITÉ DES DONNÉES
    async verifyDataIntegrity() {
        try {
            const dataDir = path.join(__dirname, '..', 'data');
            const economyPath = path.join(dataDir, 'economy.json');
            const levelUsersPath = path.join(dataDir, 'level_users.json');
            
            const issues = {
                missingInventories: [],
                xpInconsistencies: [],
                missingEconomyEntries: []
            };
            
            if (!fs.existsSync(economyPath) || !fs.existsSync(levelUsersPath)) {
                return { isValid: false, issues };
            }

            const economy = JSON.parse(await fs.readFile(economyPath, 'utf8'));
            const levelUsers = JSON.parse(await fs.readFile(levelUsersPath, 'utf8'));

            // Vérifier les inventaires manquants
            Object.keys(economy).forEach(key => {
                if (!economy[key].inventory) {
                    issues.missingInventories.push(key);
                }
            });

            // Vérifier les incohérences XP
            Object.keys(levelUsers).forEach(levelKey => {
                const levelData = levelUsers[levelKey];
                const economyKey = `${levelData.userId}_${levelData.guildId}`;
                
                if (economy[economyKey]) {
                    const economyXP = economy[economyKey].xp || 0;
                    if (Math.abs(levelData.xp - economyXP) > 10) { // Tolérance de 10 XP
                        issues.xpInconsistencies.push({
                            key: economyKey,
                            levelXP: levelData.xp,
                            economyXP: economyXP
                        });
                    }
                }
            });

            const isValid = issues.missingInventories.length === 0 && issues.xpInconsistencies.length === 0;
            
            return { isValid, issues };
        } catch (error) {
            console.error('❌ Erreur vérification intégrité:', error);
            return { isValid: false, issues: { error: error.message } };
        }
    }

    // DÉMARRAGE SAUVEGARDE PÉRIODIQUE
    startAutoBackup(intervalMinutes = 30) {
        console.log(`🕐 Sauvegarde automatique simple démarrée (toutes les ${intervalMinutes} minutes)`);
        
        setInterval(() => {
            this.performBackup();
        }, intervalMinutes * 60 * 1000);

        // Sauvegarde immédiate après 10 secondes
        setTimeout(() => this.performBackup(), 10000);
    }

    // ALIAS POUR COMPATIBILITÉ
    async createBackup() {
        return await this.performBackup();
    }

    // STATUS SYSTÈME
    getStatus() {
        return {
            webhookEnabled: this.enabled,
            webhookUrl: this.backupEndpoint ? '***masked***' : 'not configured',
            filesTracked: this.localFiles.length,
            lastCheck: new Date().toISOString()
        };
    }
}

module.exports = new SimpleBackupManager();