const DataManager = require('./managers/DataManager');
const LevelBackupManager = require('./utils/levelBackupManager');

/**
 * Script de test pour le système de sauvegarde/restauration des données level
 */

class LevelBackupTester {
    constructor() {
        this.dataManager = new DataManager();
        this.levelBackupManager = new LevelBackupManager();
    }

    async runAllTests() {
        console.log('🧪 DÉMARRAGE DES TESTS DU SYSTÈME LEVEL BACKUP');
        console.log('='.repeat(60));

        const tests = [
            'testDiagnosis',
            'testBackupCreation',
            'testSynchronization',
            'testRestoration',
            'testDataIntegrity'
        ];

        let passedTests = 0;
        let totalTests = tests.length;

        for (const testName of tests) {
            try {
                console.log(`\n🔍 Test: ${testName}`);
                console.log('-'.repeat(40));
                
                const result = await this[testName]();
                if (result) {
                    console.log(`✅ ${testName} RÉUSSI`);
                    passedTests++;
                } else {
                    console.log(`❌ ${testName} ÉCHOUÉ`);
                }
            } catch (error) {
                console.error(`❌ ${testName} ERREUR:`, error.message);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`📊 RÉSULTATS FINAUX: ${passedTests}/${totalTests} tests réussis`);
        
        if (passedTests === totalTests) {
            console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
        } else {
            console.log('⚠️ Certains tests ont échoué. Vérifiez les logs ci-dessus.');
        }

        return passedTests === totalTests;
    }

    // Test 1: Diagnostic des données level
    async testDiagnosis() {
        console.log('Diagnostic des données level...');
        
        const diagnosis = await this.levelBackupManager.diagnoseLevelIssues();
        
        console.log(`Issues trouvées: ${diagnosis.issues.length}`);
        console.log(`Recommandations: ${diagnosis.recommendations.length}`);
        console.log(`Status sync: ${diagnosis.syncStatus}`);

        // Le diagnostic doit fonctionner sans erreur
        return diagnosis.syncStatus !== 'error';
    }

    // Test 2: Création de sauvegarde
    async testBackupCreation() {
        console.log('Test création de sauvegarde...');
        
        const backupPath = await this.levelBackupManager.createLevelBackup('test-backup');
        
        if (!backupPath) {
            console.log('❌ Échec création sauvegarde');
            return false;
        }

        console.log(`✅ Sauvegarde créée: ${backupPath}`);
        
        // Vérifier que le fichier existe
        const fs = require('fs');
        if (!fs.existsSync(backupPath)) {
            console.log('❌ Fichier de sauvegarde non trouvé');
            return false;
        }

        // Vérifier le contenu
        try {
            const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
            console.log(`   - Timestamp: ${backupData.timestamp}`);
            console.log(`   - Utilisateurs: ${backupData.metadata.totalUsers}`);
            console.log(`   - Fichiers: ${Object.keys(backupData.files).length}`);
            
            return backupData.timestamp && backupData.files;
        } catch (error) {
            console.log('❌ Erreur lecture sauvegarde:', error.message);
            return false;
        }
    }

    // Test 3: Synchronisation des données XP
    async testSynchronization() {
        console.log('Test synchronisation XP...');
        
        // Tester sync economy vers level
        console.log('  Sync economy → level...');
        const syncResult1 = await this.levelBackupManager.synchronizeXPData('economy_to_level');
        console.log(`    Synchronisés: ${syncResult1.syncCount}, Erreurs: ${syncResult1.errorCount}`);

        // Tester sync level vers economy
        console.log('  Sync level → economy...');
        const syncResult2 = await this.levelBackupManager.synchronizeXPData('level_to_economy');
        console.log(`    Synchronisés: ${syncResult2.syncCount}, Erreurs: ${syncResult2.errorCount}`);

        // La synchronisation doit fonctionner sans erreur majeure
        return syncResult1.errorCount === 0 && syncResult2.errorCount === 0;
    }

    // Test 4: Restauration de données
    async testRestoration() {
        console.log('Test restauration de données...');
        
        // Lister les sauvegardes disponibles
        const backups = this.levelBackupManager.listBackups();
        console.log(`Sauvegardes disponibles: ${backups.length}`);

        if (backups.length === 0) {
            console.log('⚠️ Aucune sauvegarde pour tester la restauration');
            return true; // Pas d'échec si pas de sauvegarde
        }

        // Prendre la sauvegarde la plus récente
        const latestBackup = backups[0];
        console.log(`Test restauration avec: ${latestBackup.filename}`);

        // Créer une sauvegarde de sécurité avant test
        await this.levelBackupManager.createLevelBackup('pre-restore-test');

        // Tester la restauration
        const restoreResult = await this.levelBackupManager.restoreLevelData(latestBackup.filename);

        if (restoreResult) {
            console.log('✅ Restauration réussie');
            return true;
        } else {
            console.log('❌ Échec restauration');
            return false;
        }
    }

    // Test 5: Intégrité des données après opérations
    async testDataIntegrity() {
        console.log('Test intégrité des données...');
        
        const fs = require('fs');
        const path = require('path');

        // Vérifier que les fichiers level existent et sont valides
        const levelUsersPath = path.join(__dirname, 'data', 'level_users.json');
        const levelConfigPath = path.join(__dirname, 'data', 'level_config.json');

        let integrity = true;

        // Test level_users.json
        if (fs.existsSync(levelUsersPath)) {
            try {
                const levelUsers = JSON.parse(fs.readFileSync(levelUsersPath, 'utf8'));
                console.log(`  level_users.json: ${Object.keys(levelUsers).length} utilisateurs`);
                
                // Vérifier structure des données
                for (const [key, user] of Object.entries(levelUsers)) {
                    if (!user.userId || !user.guildId || user.xp === undefined) {
                        console.log(`  ⚠️ Utilisateur invalide: ${key}`);
                        integrity = false;
                        break;
                    }
                }
            } catch (error) {
                console.log('  ❌ level_users.json corrompu:', error.message);
                integrity = false;
            }
        } else {
            console.log('  ⚠️ level_users.json manquant');
        }

        // Test level_config.json
        if (fs.existsSync(levelConfigPath)) {
            try {
                const levelConfig = JSON.parse(fs.readFileSync(levelConfigPath, 'utf8'));
                console.log('  level_config.json: OK');
                
                // Vérifier structure minimale
                if (!levelConfig.textXP || !levelConfig.levelFormula) {
                    console.log('  ⚠️ Configuration level incomplète');
                    integrity = false;
                }
            } catch (error) {
                console.log('  ❌ level_config.json corrompu:', error.message);
                integrity = false;
            }
        } else {
            console.log('  ⚠️ level_config.json manquant');
        }

        // Test final de synchronisation
        const syncStatus = await this.levelBackupManager.checkSyncStatus();
        console.log(`  Status synchronisation: ${syncStatus}`);

        return integrity && (syncStatus === 'synchronized' || syncStatus === 'no_common_users');
    }

    // Méthode utilitaire pour nettoyer les tests
    async cleanup() {
        console.log('\n🧹 Nettoyage des fichiers de test...');
        
        const fs = require('fs');
        const path = require('path');
        const backupDir = path.join(__dirname, 'data', 'backups', 'level_backups');

        if (fs.existsSync(backupDir)) {
            const files = fs.readdirSync(backupDir);
            const testFiles = files.filter(f => f.includes('test-backup') || f.includes('pre-restore-test'));
            
            for (const file of testFiles) {
                try {
                    fs.unlinkSync(path.join(backupDir, file));
                    console.log(`🗑️ Supprimé: ${file}`);
                } catch (error) {
                    console.log(`⚠️ Erreur suppression ${file}:`, error.message);
                }
            }
        }
    }
}

// Fonction principale
async function main() {
    const tester = new LevelBackupTester();
    
    try {
        const allTestsPassed = await tester.runAllTests();
        
        // Optionnel: nettoyer les fichiers de test
        await tester.cleanup();
        
        process.exit(allTestsPassed ? 0 : 1);
    } catch (error) {
        console.error('❌ Erreur critique dans les tests:', error);
        process.exit(1);
    }
}

// Exécution si appelé directement
if (require.main === module) {
    main();
}

module.exports = LevelBackupTester;