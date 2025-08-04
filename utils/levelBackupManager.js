const fs = require('fs');
const path = require('path');

/**
 * Gestionnaire de sauvegarde/restauration spécialisé pour les données level
 * Corrige les problèmes de synchronisation entre level_users.json et economy.json
 */

class LevelBackupManager {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.backupDir = path.join(this.dataDir, 'backups', 'level_backups');
        this.levelUsersPath = path.join(this.dataDir, 'level_users.json');
        this.levelConfigPath = path.join(this.dataDir, 'level_config.json');
        this.economyPath = path.join(this.dataDir, 'economy.json');
        
        this.maxBackups = 20; // Garder 20 sauvegardes level
        this.autoBackupInterval = 30 * 60 * 1000; // 30 minutes
        
        this.ensureDirectories();
        this.startAutoBackup();
    }

    ensureDirectories() {
        try {
            if (!fs.existsSync(this.backupDir)) {
                fs.mkdirSync(this.backupDir, { recursive: true });
                console.log('📁 Répertoire de sauvegarde level créé');
            }
        } catch (error) {
            console.error('❌ Erreur création répertoire backup level:', error);
        }
    }

    // Créer une sauvegarde des données level
    async createLevelBackup(label = null) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupLabel = label || `level-backup-${timestamp}`;
            const backupPath = path.join(this.backupDir, `${backupLabel}.json`);

            console.log('💾 Création sauvegarde données level...');

            // Collecter toutes les données level
            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                files: {},
                metadata: {
                    totalUsers: 0,
                    avgLevel: 0,
                    totalXP: 0,
                    syncStatus: 'unknown'
                }
            };

            // Sauvegarder level_users.json
            if (fs.existsSync(this.levelUsersPath)) {
                const levelUsersData = JSON.parse(fs.readFileSync(this.levelUsersPath, 'utf8'));
                backupData.files['level_users.json'] = {
                    data: levelUsersData,
                    size: fs.statSync(this.levelUsersPath).size,
                    lastModified: fs.statSync(this.levelUsersPath).mtime.toISOString(),
                    recordCount: Object.keys(levelUsersData).length
                };

                // Calculer métadonnées
                const users = Object.values(levelUsersData);
                backupData.metadata.totalUsers = users.length;
                backupData.metadata.avgLevel = users.length > 0 ? 
                    users.reduce((sum, user) => sum + (user.level || 1), 0) / users.length : 0;
                backupData.metadata.totalXP = users.reduce((sum, user) => sum + (user.xp || 0), 0);
            }

            // Sauvegarder level_config.json
            if (fs.existsSync(this.levelConfigPath)) {
                const levelConfigData = JSON.parse(fs.readFileSync(this.levelConfigPath, 'utf8'));
                backupData.files['level_config.json'] = {
                    data: levelConfigData,
                    size: fs.statSync(this.levelConfigPath).size,
                    lastModified: fs.statSync(this.levelConfigPath).mtime.toISOString()
                };
            }

            // Extraire les données XP de economy.json pour comparaison
            if (fs.existsSync(this.economyPath)) {
                const economyData = JSON.parse(fs.readFileSync(this.economyPath, 'utf8'));
                const economyXPData = {};
                
                for (const [key, userData] of Object.entries(economyData)) {
                    if (userData.xp !== undefined) {
                        economyXPData[key] = {
                            xp: userData.xp,
                            messageCount: userData.messageCount || 0,
                            lastDaily: userData.lastDaily
                        };
                    }
                }

                backupData.files['economy_xp_extract.json'] = {
                    data: economyXPData,
                    size: JSON.stringify(economyXPData).length,
                    recordCount: Object.keys(economyXPData).length,
                    extractedAt: new Date().toISOString()
                };
            }

            // Vérifier la synchronisation
            backupData.metadata.syncStatus = await this.checkSyncStatus();

            // Écrire la sauvegarde
            fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
            
            console.log(`✅ Sauvegarde level créée: ${backupLabel}`);
            console.log(`   - Utilisateurs: ${backupData.metadata.totalUsers}`);
            console.log(`   - XP total: ${backupData.metadata.totalXP}`);
            console.log(`   - Sync status: ${backupData.metadata.syncStatus}`);

            // Nettoyer les anciennes sauvegardes
            await this.cleanOldBackups();

            return backupPath;

        } catch (error) {
            console.error('❌ Erreur création sauvegarde level:', error);
            return null;
        }
    }

    // Vérifier la synchronisation entre level_users.json et economy.json
    async checkSyncStatus() {
        try {
            if (!fs.existsSync(this.levelUsersPath) || !fs.existsSync(this.economyPath)) {
                return 'missing_files';
            }

            const levelUsers = JSON.parse(fs.readFileSync(this.levelUsersPath, 'utf8'));
            const economy = JSON.parse(fs.readFileSync(this.economyPath, 'utf8'));

            let syncIssues = 0;
            let totalChecked = 0;

            for (const [levelKey, levelUser] of Object.entries(levelUsers)) {
                // Convertir clé level (guildId_userId) vers clé economy (userId_guildId)
                const [guildId, userId] = levelKey.split('_');
                const economyKey = `${userId}_${guildId}`;

                if (economy[economyKey]) {
                    totalChecked++;
                    const levelXP = levelUser.xp || 0;
                    const economyXP = economy[economyKey].xp || 0;

                    if (Math.abs(levelXP - economyXP) > 10) { // Tolérance de 10 XP
                        syncIssues++;
                    }
                }
            }

            if (totalChecked === 0) return 'no_common_users';
            if (syncIssues === 0) return 'synchronized';
            if (syncIssues / totalChecked > 0.5) return 'major_desync';
            return 'minor_desync';

        } catch (error) {
            console.error('❌ Erreur vérification sync:', error);
            return 'error';
        }
    }

    // Restaurer les données level depuis une sauvegarde
    async restoreLevelData(backupFilename) {
        try {
            const backupPath = path.join(this.backupDir, backupFilename);
            
            if (!fs.existsSync(backupPath)) {
                throw new Error(`Sauvegarde non trouvée: ${backupFilename}`);
            }

            console.log(`🔄 Restauration données level depuis: ${backupFilename}`);

            // Créer une sauvegarde de sécurité avant restauration
            await this.createLevelBackup('pre-restore-safety');

            // Charger la sauvegarde
            const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

            let restoredFiles = 0;

            // Restaurer level_users.json
            if (backupData.files['level_users.json']) {
                fs.writeFileSync(this.levelUsersPath, 
                    JSON.stringify(backupData.files['level_users.json'].data, null, 2));
                console.log('✅ level_users.json restauré');
                restoredFiles++;
            }

            // Restaurer level_config.json
            if (backupData.files['level_config.json']) {
                fs.writeFileSync(this.levelConfigPath, 
                    JSON.stringify(backupData.files['level_config.json'].data, null, 2));
                console.log('✅ level_config.json restauré');
                restoredFiles++;
            }

            console.log(`✅ Restauration terminée: ${restoredFiles} fichiers restaurés`);
            console.log(`   - Timestamp sauvegarde: ${backupData.timestamp}`);
            console.log(`   - Utilisateurs restaurés: ${backupData.metadata.totalUsers}`);

            return true;

        } catch (error) {
            console.error('❌ Erreur restauration level:', error);
            return false;
        }
    }

    // Synchroniser les données XP entre level_users.json et economy.json
    async synchronizeXPData(direction = 'economy_to_level') {
        try {
            console.log(`🔄 Synchronisation XP: ${direction}`);

            if (!fs.existsSync(this.levelUsersPath) || !fs.existsSync(this.economyPath)) {
                throw new Error('Fichiers manquants pour synchronisation');
            }

            // Créer une sauvegarde avant sync
            await this.createLevelBackup('pre-sync');

            const levelUsers = JSON.parse(fs.readFileSync(this.levelUsersPath, 'utf8'));
            const economy = JSON.parse(fs.readFileSync(this.economyPath, 'utf8'));

            let syncCount = 0;
            let errorCount = 0;

            if (direction === 'economy_to_level') {
                // Synchroniser de economy.json vers level_users.json
                for (const [economyKey, economyUser] of Object.entries(economy)) {
                    if (economyUser.xp !== undefined) {
                        const [userId, guildId] = economyKey.split('_');
                        const levelKey = `${guildId}_${userId}`;

                        if (levelUsers[levelKey]) {
                            const oldXP = levelUsers[levelKey].xp || 0;
                            levelUsers[levelKey].xp = economyUser.xp;
                            
                            // Recalculer le niveau
                            levelUsers[levelKey].level = this.calculateLevelFromXP(economyUser.xp);
                            
                            if (oldXP !== economyUser.xp) {
                                console.log(`🔄 ${userId}: ${oldXP} → ${economyUser.xp} XP`);
                                syncCount++;
                            }
                        }
                    }
                }

                fs.writeFileSync(this.levelUsersPath, JSON.stringify(levelUsers, null, 2));

            } else if (direction === 'level_to_economy') {
                // Synchroniser de level_users.json vers economy.json
                for (const [levelKey, levelUser] of Object.entries(levelUsers)) {
                    const [guildId, userId] = levelKey.split('_');
                    const economyKey = `${userId}_${guildId}`;

                    if (economy[economyKey] && levelUser.xp !== undefined) {
                        const oldXP = economy[economyKey].xp || 0;
                        economy[economyKey].xp = levelUser.xp;
                        
                        if (oldXP !== levelUser.xp) {
                            console.log(`🔄 ${userId}: ${oldXP} → ${levelUser.xp} XP`);
                            syncCount++;
                        }
                    }
                }

                fs.writeFileSync(this.economyPath, JSON.stringify(economy, null, 2));
            }

            console.log(`✅ Synchronisation terminée: ${syncCount} utilisateurs synchronisés, ${errorCount} erreurs`);
            return { syncCount, errorCount };

        } catch (error) {
            console.error('❌ Erreur synchronisation XP:', error);
            return { syncCount: 0, errorCount: 1 };
        }
    }

    // Calculer le niveau depuis l'XP (copié du LevelManager)
    calculateLevelFromXP(xp) {
        let level = 1;
        const baseXP = 100;
        const multiplier = 1.5;
        
        while (this.calculateXPForLevel(level + 1, baseXP, multiplier) <= xp) {
            level++;
        }
        return level;
    }

    calculateXPForLevel(level, baseXP = 100, multiplier = 1.5) {
        if (level <= 1) return 0;
        return Math.floor(baseXP * Math.pow(level - 1, multiplier));
    }

    // Lister les sauvegardes disponibles
    listBackups() {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(f => f.endsWith('.json'))
                .map(f => {
                    const filePath = path.join(this.backupDir, f);
                    const stats = fs.statSync(filePath);
                    return {
                        filename: f,
                        size: stats.size,
                        created: stats.mtime,
                        age: Date.now() - stats.mtime.getTime()
                    };
                })
                .sort((a, b) => b.created - a.created);

            return files;
        } catch (error) {
            console.error('❌ Erreur listage sauvegardes:', error);
            return [];
        }
    }

    // Nettoyer les anciennes sauvegardes
    async cleanOldBackups() {
        try {
            const backups = this.listBackups();
            
            if (backups.length > this.maxBackups) {
                const toDelete = backups.slice(this.maxBackups);
                
                for (const backup of toDelete) {
                    const filePath = path.join(this.backupDir, backup.filename);
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Ancienne sauvegarde supprimée: ${backup.filename}`);
                }
            }
        } catch (error) {
            console.error('❌ Erreur nettoyage sauvegardes:', error);
        }
    }

    // Démarrer la sauvegarde automatique
    startAutoBackup() {
        if (this.autoBackupInterval > 0) {
            setInterval(async () => {
                console.log('⏰ Sauvegarde automatique level...');
                await this.createLevelBackup('auto');
            }, this.autoBackupInterval);
            
            console.log(`⏰ Sauvegarde automatique level activée (${this.autoBackupInterval/60000} min)`);
        }
    }

    // Diagnostiquer les problèmes de données level
    async diagnoseLevelIssues() {
        console.log('🔍 Diagnostic des données level...');
        
        const issues = [];
        const recommendations = [];

        try {
            // Vérifier l'existence des fichiers
            if (!fs.existsSync(this.levelUsersPath)) {
                issues.push('level_users.json manquant');
                recommendations.push('Créer level_users.json avec données par défaut');
            }

            if (!fs.existsSync(this.levelConfigPath)) {
                issues.push('level_config.json manquant');
                recommendations.push('Créer level_config.json avec configuration par défaut');
            }

            // Vérifier la synchronisation
            const syncStatus = await this.checkSyncStatus();
            if (syncStatus !== 'synchronized' && syncStatus !== 'no_common_users') {
                issues.push(`Désynchronisation XP: ${syncStatus}`);
                recommendations.push('Exécuter synchronizeXPData()');
            }

            // Vérifier la cohérence des données
            if (fs.existsSync(this.levelUsersPath)) {
                const levelUsers = JSON.parse(fs.readFileSync(this.levelUsersPath, 'utf8'));
                let invalidUsers = 0;

                for (const [key, user] of Object.entries(levelUsers)) {
                    if (!user.userId || !user.guildId || user.xp === undefined) {
                        invalidUsers++;
                    }
                }

                if (invalidUsers > 0) {
                    issues.push(`${invalidUsers} utilisateurs avec données invalides`);
                    recommendations.push('Nettoyer les données utilisateur invalides');
                }
            }

            console.log('📊 Résultats du diagnostic:');
            console.log(`   - Issues trouvées: ${issues.length}`);
            console.log(`   - Recommandations: ${recommendations.length}`);

            if (issues.length > 0) {
                console.log('\n⚠️ Issues:');
                issues.forEach(issue => console.log(`   - ${issue}`));
            }

            if (recommendations.length > 0) {
                console.log('\n💡 Recommandations:');
                recommendations.forEach(rec => console.log(`   - ${rec}`));
            }

            return { issues, recommendations, syncStatus };

        } catch (error) {
            console.error('❌ Erreur diagnostic:', error);
            return { issues: ['Erreur diagnostic'], recommendations: [], syncStatus: 'error' };
        }
    }
}

module.exports = LevelBackupManager;