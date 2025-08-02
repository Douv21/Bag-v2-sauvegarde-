/**
 * Script de réparation de l'intégrité des données
 * Corrige les problèmes de sauvegarde des inventaires et niveaux
 */

const fs = require('fs');
const path = require('path');

class DataIntegrityFixer {
    constructor() {
        this.dataPath = path.join(__dirname, 'data');
        this.backupPath = path.join(this.dataPath, 'backups');
        
        this.economyPath = path.join(this.dataPath, 'economy.json');
        this.levelUsersPath = path.join(this.dataPath, 'level_users.json');
        this.usersPath = path.join(this.dataPath, 'users.json');
    }

    // Créer un backup avant réparation
    createPreRepairBackup() {
        try {
            if (!fs.existsSync(this.backupPath)) {
                fs.mkdirSync(this.backupPath, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(this.backupPath, `pre-repair-${timestamp}`);
            fs.mkdirSync(backupDir);

            // Backup des fichiers principaux
            const filesToBackup = ['economy.json', 'level_users.json', 'users.json'];
            
            filesToBackup.forEach(filename => {
                const sourcePath = path.join(this.dataPath, filename);
                if (fs.existsSync(sourcePath)) {
                    const targetPath = path.join(backupDir, filename);
                    fs.copyFileSync(sourcePath, targetPath);
                    console.log(`📄 Backup créé: ${filename}`);
                }
            });

            console.log(`✅ Backup pré-réparation créé: ${backupDir}`);
            return backupDir;
        } catch (error) {
            console.error('❌ Erreur création backup:', error);
            return null;
        }
    }

    // Charger les données existantes
    loadExistingData() {
        const data = {
            economy: {},
            levelUsers: {},
            users: {}
        };

        try {
            if (fs.existsSync(this.economyPath)) {
                data.economy = JSON.parse(fs.readFileSync(this.economyPath, 'utf8'));
            }
            if (fs.existsSync(this.levelUsersPath)) {
                data.levelUsers = JSON.parse(fs.readFileSync(this.levelUsersPath, 'utf8'));
            }
            if (fs.existsSync(this.usersPath)) {
                data.users = JSON.parse(fs.readFileSync(this.usersPath, 'utf8'));
            }
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
        }

        return data;
    }

    // Analyser les incohérences
    analyzeInconsistencies(data) {
        const issues = {
            missingInventories: [],
            xpInconsistencies: [],
            missingEconomyEntries: [],
            duplicateEntries: []
        };

        console.log('\n🔍 Analyse des incohérences...');

        // Vérifier les inventaires manquants dans economy.json
        Object.keys(data.economy).forEach(key => {
            const userData = data.economy[key];
            if (!userData.inventory) {
                issues.missingInventories.push(key);
            }
        });

        // Vérifier les incohérences XP entre level_users.json et economy.json
        Object.keys(data.levelUsers).forEach(levelKey => {
            const levelData = data.levelUsers[levelKey];
            const economyKey = `${levelData.userId}_${levelData.guildId}`;
            
            if (data.economy[economyKey]) {
                const economyXP = data.economy[economyKey].xp || 0;
                if (Math.abs(levelData.xp - economyXP) > 0) {
                    issues.xpInconsistencies.push({
                        key: economyKey,
                        levelXP: levelData.xp,
                        economyXP: economyXP
                    });
                }
            } else {
                issues.missingEconomyEntries.push(economyKey);
            }
        });

        return issues;
    }

    // Réparer les données
    repairData(data, issues) {
        console.log('\n🔧 Réparation des données...');
        let repaired = 0;

        // Ajouter les inventaires manquants
        issues.missingInventories.forEach(key => {
            data.economy[key].inventory = [];
            console.log(`➕ Inventaire ajouté pour: ${key}`);
            repaired++;
        });

        // Synchroniser les XP
        issues.xpInconsistencies.forEach(issue => {
            // Utiliser la valeur la plus élevée (plus sûr)
            const correctXP = Math.max(issue.levelXP, issue.economyXP);
            data.economy[issue.key].xp = correctXP;
            
            // Trouver et mettre à jour dans levelUsers
            Object.keys(data.levelUsers).forEach(levelKey => {
                const levelData = data.levelUsers[levelKey];
                const economyKey = `${levelData.userId}_${levelData.guildId}`;
                if (economyKey === issue.key) {
                    levelData.xp = correctXP;
                    // Recalculer le niveau
                    levelData.level = this.calculateLevelFromXP(correctXP);
                }
            });
            
            console.log(`🔄 XP synchronisé pour ${issue.key}: ${correctXP} XP`);
            repaired++;
        });

        // Créer les entrées economy manquantes
        issues.missingEconomyEntries.forEach(economyKey => {
            const parts = economyKey.split('_');
            const userId = parts[0];
            const guildId = parts[1];
            
            // Trouver les données dans levelUsers
            const levelData = Object.values(data.levelUsers).find(ld => 
                ld.userId === userId && ld.guildId === guildId
            );
            
            data.economy[economyKey] = {
                balance: 1000,
                goodKarma: 0,
                badKarma: 0,
                dailyStreak: 0,
                lastDaily: null,
                messageCount: levelData?.totalMessages || 0,
                xp: levelData?.xp || 0,
                inventory: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            console.log(`➕ Entrée economy créée pour: ${economyKey}`);
            repaired++;
        });

        return repaired;
    }

    // Calculer le niveau depuis l'XP
    calculateLevelFromXP(xp) {
        const baseXP = 100;
        const multiplier = 1.5;
        
        let level = 1;
        while (true) {
            const requiredXP = Math.floor(baseXP * Math.pow(level, multiplier));
            if (xp < requiredXP) break;
            level++;
        }
        return level;
    }

    // Sauvegarder les données réparées
    saveRepairedData(data) {
        try {
            fs.writeFileSync(this.economyPath, JSON.stringify(data.economy, null, 2));
            fs.writeFileSync(this.levelUsersPath, JSON.stringify(data.levelUsers, null, 2));
            
            console.log('💾 Données réparées sauvegardées');
            return true;
        } catch (error) {
            console.error('❌ Erreur sauvegarde données réparées:', error);
            return false;
        }
    }

    // Exécuter la réparation complète
    async runRepair() {
        console.log('🚀 Démarrage de la réparation des données...\n');

        // Créer un backup
        const backupPath = this.createPreRepairBackup();
        if (!backupPath) {
            console.error('❌ Impossible de créer un backup. Arrêt de la réparation.');
            return false;
        }

        // Charger les données
        const data = this.loadExistingData();
        console.log(`📊 Données chargées:`);
        console.log(`   - Economy: ${Object.keys(data.economy).length} entrées`);
        console.log(`   - Level Users: ${Object.keys(data.levelUsers).length} entrées`);
        console.log(`   - Users: ${Object.keys(data.users).length} entrées`);

        // Analyser les problèmes
        const issues = this.analyzeInconsistencies(data);
        console.log(`\n📋 Problèmes détectés:`);
        console.log(`   - Inventaires manquants: ${issues.missingInventories.length}`);
        console.log(`   - Incohérences XP: ${issues.xpInconsistencies.length}`);
        console.log(`   - Entrées economy manquantes: ${issues.missingEconomyEntries.length}`);

        if (issues.missingInventories.length === 0 && 
            issues.xpInconsistencies.length === 0 && 
            issues.missingEconomyEntries.length === 0) {
            console.log('\n✅ Aucun problème détecté. Les données sont cohérentes.');
            return true;
        }

        // Réparer les données
        const repaired = this.repairData(data, issues);
        
        // Sauvegarder
        const saved = this.saveRepairedData(data);
        
        if (saved) {
            console.log(`\n✅ Réparation terminée avec succès!`);
            console.log(`🔧 ${repaired} problème(s) corrigé(s)`);
            console.log(`📁 Backup disponible: ${backupPath}`);
            return true;
        } else {
            console.error('\n❌ Échec de la sauvegarde des données réparées');
            return false;
        }
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    const fixer = new DataIntegrityFixer();
    fixer.runRepair().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = DataIntegrityFixer;