/**
 * Script de test simplifié pour valider l'intégrité des données
 * Version sans dépendances complexes
 */

const fs = require('fs');
const path = require('path');

class SimpleDataIntegrityTester {
    constructor() {
        this.dataPath = path.join(__dirname, 'data');
        this.testResults = {
            inventoryPersistence: false,
            dataConsistency: false,
            backupIntegrity: false
        };
        
        // Données de test
        this.testUserId = '999999999999999999';
        this.testGuildId = '888888888888888888';
    }

    async runAllTests() {
        console.log('🧪 Démarrage des tests simplifiés d\'intégrité des données...\n');

        try {
            await this.testInventoryPersistence();
            await this.testDataConsistency();
            await this.testBackupIntegrity();

            this.printResults();
            return this.allTestsPassed();
        } catch (error) {
            console.error('❌ Erreur lors des tests:', error);
            return false;
        } finally {
            await this.cleanup();
        }
    }

    async testInventoryPersistence() {
        console.log('🎒 Test: Persistance de l\'inventaire avec simpleDataManager...');
        
        try {
            // Charger le dataManager sans levelManager (pour éviter sharp)
            const dataManager = require('./utils/simpleDataManager');
            
            // Créer un utilisateur avec un inventaire
            const initialData = {
                balance: 5000,
                goodKarma: 10,
                badKarma: 0,
                inventory: [
                    {
                        id: 'test_item_1',
                        name: 'Item Test',
                        description: 'Item de test',
                        type: 'custom',
                        price: 100,
                        purchaseDate: new Date().toISOString()
                    }
                ]
            };

            // Sauvegarder les données initiales
            await dataManager.updateUser(this.testUserId, this.testGuildId, initialData);

            // Modifier seulement le balance (simulation d'une transaction)
            await dataManager.updateUser(this.testUserId, this.testGuildId, { balance: 4900 });

            // Vérifier que l'inventaire est préservé
            const updatedUser = await dataManager.getUser(this.testUserId, this.testGuildId);

            if (updatedUser.inventory && updatedUser.inventory.length === 1 && 
                updatedUser.inventory[0].id === 'test_item_1' && 
                updatedUser.balance === 4900) {
                this.testResults.inventoryPersistence = true;
                console.log('   ✅ Inventaire préservé lors des mises à jour');
            } else {
                console.log('   ❌ Inventaire perdu lors des mises à jour');
                console.log('   📊 Données reçues:', JSON.stringify(updatedUser, null, 2));
            }
        } catch (error) {
            console.log('   ❌ Erreur test inventaire:', error.message);
        }
    }

    async testDataConsistency() {
        console.log('\n📊 Test: Cohérence des données entre fichiers...');
        
        try {
            const economyPath = path.join(this.dataPath, 'economy.json');
            const levelUsersPath = path.join(this.dataPath, 'level_users.json');
            
            if (!fs.existsSync(economyPath) || !fs.existsSync(levelUsersPath)) {
                console.log('   ⚠️ Fichiers de données manquants');
                return;
            }

            const economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
            const levelUsers = JSON.parse(fs.readFileSync(levelUsersPath, 'utf8'));

            // Vérifier que tous les utilisateurs dans economy ont un inventaire
            let missingInventories = 0;
            let totalUsers = 0;
            
            Object.keys(economy).forEach(key => {
                if (key.includes('_') && economy[key] && typeof economy[key] === 'object') {
                    totalUsers++;
                    if (!economy[key].inventory) {
                        missingInventories++;
                    }
                }
            });

            // Vérifier la cohérence XP (avec tolérance)
            let xpInconsistencies = 0;
            let xpChecks = 0;
            
            Object.keys(levelUsers).forEach(levelKey => {
                const levelData = levelUsers[levelKey];
                if (levelData.userId && levelData.guildId) {
                    const economyKey = `${levelData.userId}_${levelData.guildId}`;
                    
                    if (economy[economyKey]) {
                        xpChecks++;
                        const economyXP = economy[economyKey].xp || 0;
                        const levelXP = levelData.xp || 0;
                        
                        if (Math.abs(levelXP - economyXP) > 50) { // Tolérance de 50 XP
                            xpInconsistencies++;
                        }
                    }
                }
            });

            console.log(`   📈 Utilisateurs vérifiés: ${totalUsers}`);
            console.log(`   🎒 Inventaires manquants: ${missingInventories}`);
            console.log(`   🔄 Vérifications XP: ${xpChecks}`);
            console.log(`   ⚠️ Incohérences XP: ${xpInconsistencies}`);

            // Test réussi si moins de 5% de problèmes
            const inventorySuccessRate = totalUsers > 0 ? (totalUsers - missingInventories) / totalUsers : 1;
            const xpSuccessRate = xpChecks > 0 ? (xpChecks - xpInconsistencies) / xpChecks : 1;
            
            if (inventorySuccessRate >= 0.95 && xpSuccessRate >= 0.90) {
                this.testResults.dataConsistency = true;
                console.log('   ✅ Cohérence des données acceptable');
            } else {
                console.log(`   ❌ Problèmes de cohérence (Inventaires: ${Math.round(inventorySuccessRate * 100)}%, XP: ${Math.round(xpSuccessRate * 100)}%)`);
            }
            
        } catch (error) {
            console.log('   ❌ Erreur test cohérence:', error.message);
        }
    }

    async testBackupIntegrity() {
        console.log('\n💾 Test: Intégrité du système de backup...');
        
        try {
            // Vérifier que le système de backup fonctionne
            const simpleBackupManager = require('./utils/simpleBackupManager');
            
            // Créer un backup de test
            const backupSuccess = await simpleBackupManager.createLocalBackup();
            
            if (backupSuccess) {
                console.log('   ✅ Système de backup fonctionnel');
                
                // Vérifier que les fichiers de backup existent
                const backupDir = path.join(this.dataPath, 'backups');
                if (fs.existsSync(backupDir)) {
                    const backupFiles = fs.readdirSync(backupDir);
                    const recentBackups = backupFiles.filter(f => f.startsWith('backup-') && f.endsWith('.json'));
                    
                    if (recentBackups.length > 0) {
                        this.testResults.backupIntegrity = true;
                        console.log(`   📁 ${recentBackups.length} backup(s) trouvé(s)`);
                    } else {
                        console.log('   ⚠️ Aucun fichier de backup trouvé');
                    }
                } else {
                    console.log('   ⚠️ Dossier de backup manquant');
                }
            } else {
                console.log('   ❌ Échec création backup');
            }
            
        } catch (error) {
            console.log('   ❌ Erreur test backup:', error.message);
        }
    }

    async cleanup() {
        console.log('\n🧹 Nettoyage des données de test...');
        
        try {
            const dataManager = require('./utils/simpleDataManager');
            
            // Supprimer l'utilisateur de test de economy.json
            const economy = dataManager.getData('economy.json');
            const testKey = `${this.testUserId}_${this.testGuildId}`;
            if (economy[testKey]) {
                delete economy[testKey];
                dataManager.setData('economy.json', economy);
                console.log('   ✅ Données de test supprimées');
            } else {
                console.log('   ℹ️ Aucune donnée de test à supprimer');
            }
        } catch (error) {
            console.log('   ⚠️ Erreur nettoyage:', error.message);
        }
    }

    printResults() {
        console.log('\n📊 Résultats des tests:');
        console.log('========================');
        
        Object.entries(this.testResults).forEach(([test, passed]) => {
            const status = passed ? '✅ RÉUSSI' : '❌ ÉCHEC';
            const testName = this.getTestName(test);
            console.log(`${status} - ${testName}`);
        });

        const passedCount = Object.values(this.testResults).filter(Boolean).length;
        const totalCount = Object.keys(this.testResults).length;
        
        console.log(`\n🎯 Score: ${passedCount}/${totalCount} tests réussis`);
        
        if (this.allTestsPassed()) {
            console.log('🎉 Tous les tests sont réussis ! Le système est opérationnel.');
        } else {
            console.log('⚠️ Certains tests ont échoué. Vérification requise.');
        }
    }

    getTestName(testKey) {
        const names = {
            inventoryPersistence: 'Persistance des inventaires',
            dataConsistency: 'Cohérence des données',
            backupIntegrity: 'Intégrité des backups'
        };
        return names[testKey] || testKey;
    }

    allTestsPassed() {
        return Object.values(this.testResults).every(Boolean);
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    const tester = new SimpleDataIntegrityTester();
    tester.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = SimpleDataIntegrityTester;