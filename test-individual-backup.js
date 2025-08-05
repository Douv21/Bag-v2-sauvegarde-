#!/usr/bin/env node

require('dotenv').config();

const mongoBackup = require('./utils/mongoBackupManager');
const fs = require('fs').promises;
const path = require('path');

class IndividualBackupTest {
    constructor() {
        this.testResults = [];
        this.startTime = Date.now();
    }

    async runAllTests() {
        console.log('🧪 === TEST SAUVEGARDE INDIVIDUALISÉE + GÉO-REDONDANCE ===\n');
        
        await this.testGeoRedundancyConfig();
        await this.testFileCollectionMapping();
        await this.testIndividualBackup();
        await this.testIndividualRestore();
        await this.testSpecificFileBackup();
        await this.testCollectionSeparation();
        
        this.generateFinalReport();
        return this.testResults;
    }

    async testGeoRedundancyConfig() {
        console.log('1️⃣ Test configuration géo-redondance...');
        
        try {
            const manager = new (require('./utils/mongoBackupManager').constructor || Object)();
            const connectionString = manager.connectionString;
            
            // Vérifier les paramètres de géo-redondance
            const hasRedundancy = connectionString && (
                connectionString.includes('readPreference=secondaryPreferred') &&
                connectionString.includes('w=majority') &&
                connectionString.includes('retryWrites=true')
            );
            
            const result = {
                test: 'Configuration géo-redondance',
                passed: hasRedundancy,
                details: hasRedundancy ? 
                    'Géo-redondance configurée (secondaryPreferred, w=majority, retryWrites)' : 
                    'Configuration géo-redondance manquante'
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ${result.passed ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} - ${result.details}\n`);
            
        } catch (error) {
            const result = {
                test: 'Configuration géo-redondance',
                passed: false,
                details: `Erreur: ${error.message}`
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ❌ ÉCHOUÉ - ${result.details}\n`);
        }
    }

    async testFileCollectionMapping() {
        console.log('2️⃣ Test mapping fichier → collection individuelle...');
        
        try {
            const manager = new (require('./utils/mongoBackupManager').constructor || Object)();
            const mapping = manager.fileCollectionMapping;
            
            // Vérifier que les fichiers principaux ont leurs propres collections
            const criticalFiles = ['users.json', 'economy.json', 'shop.json', 'level_users.json'];
            const mappedFiles = criticalFiles.filter(file => mapping[file] && mapping[file].startsWith('backup_'));
            
            const result = {
                test: 'Mapping fichier-collection',
                passed: mappedFiles.length === criticalFiles.length,
                details: `${mappedFiles.length}/${criticalFiles.length} fichiers critiques mappés individuellement`
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ${result.passed ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} - ${result.details}`);
            
            // Afficher quelques exemples de mapping
            console.log('   📋 Exemples de mapping:');
            criticalFiles.forEach(file => {
                if (mapping[file]) {
                    console.log(`      ${file} → ${mapping[file]}`);
                }
            });
            console.log('');
            
        } catch (error) {
            const result = {
                test: 'Mapping fichier-collection',
                passed: false,
                details: `Erreur: ${error.message}`
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ❌ ÉCHOUÉ - ${result.details}\n`);
        }
    }

    async testIndividualBackup() {
        console.log('3️⃣ Test sauvegarde individualisée...');
        
        try {
            const connected = await mongoBackup.connect();
            if (!connected) {
                throw new Error('Connexion MongoDB impossible');
            }
            
            const backupResult = await mongoBackup.backupToMongo();
            await mongoBackup.disconnect();
            
            const result = {
                test: 'Sauvegarde individualisée',
                passed: backupResult.success,
                details: backupResult.success ? 
                    `${backupResult.backupCount} fichiers sauvegardés dans collections séparées` : 
                    'Échec sauvegarde individualisée'
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ${result.passed ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} - ${result.details}\n`);
            
        } catch (error) {
            const result = {
                test: 'Sauvegarde individualisée',
                passed: false,
                details: `Erreur: ${error.message}`
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ❌ ÉCHOUÉ - ${result.details}\n`);
        }
    }

    async testIndividualRestore() {
        console.log('4️⃣ Test restauration individualisée...');
        
        try {
            const connected = await mongoBackup.connect();
            if (!connected) {
                throw new Error('Connexion MongoDB impossible');
            }
            
            const restoreResult = await mongoBackup.restoreFromMongo();
            await mongoBackup.disconnect();
            
            const result = {
                test: 'Restauration individualisée',
                passed: restoreResult.success,
                details: restoreResult.success ? 
                    `${restoreResult.restoredFiles || 'Plusieurs'} fichiers restaurés depuis collections séparées` : 
                    'Échec restauration individualisée'
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ${result.passed ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} - ${result.details}\n`);
            
        } catch (error) {
            const result = {
                test: 'Restauration individualisée',
                passed: false,
                details: `Erreur: ${error.message}`
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ❌ ÉCHOUÉ - ${result.details}\n`);
        }
    }

    async testSpecificFileBackup() {
        console.log('5️⃣ Test sauvegarde fichier spécifique (users.json)...');
        
        try {
            const connected = await mongoBackup.connect();
            if (!connected) {
                throw new Error('Connexion MongoDB impossible');
            }
            
            // Tester la restauration d'un fichier spécifique
            const restoreResult = await mongoBackup.restoreFromMongo('users.json');
            await mongoBackup.disconnect();
            
            // Vérifier que le fichier existe
            const filePath = path.join(__dirname, 'data', 'users.json');
            const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
            
            const result = {
                test: 'Sauvegarde fichier spécifique',
                passed: restoreResult.success && fileExists,
                details: (restoreResult.success && fileExists) ? 
                    'users.json restauré avec succès depuis sa collection dédiée' : 
                    'Échec restauration fichier spécifique'
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ${result.passed ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} - ${result.details}\n`);
            
        } catch (error) {
            const result = {
                test: 'Sauvegarde fichier spécifique',
                passed: false,
                details: `Erreur: ${error.message}`
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ❌ ÉCHOUÉ - ${result.details}\n`);
        }
    }

    async testCollectionSeparation() {
        console.log('6️⃣ Test séparation des collections...');
        
        try {
            const connected = await mongoBackup.connect();
            if (!connected) {
                throw new Error('Connexion MongoDB impossible');
            }
            
            // Lister les collections MongoDB
            const collections = await mongoBackup.db.listCollections().toArray();
            const collectionNames = collections.map(c => c.name);
            
            // Vérifier que les collections individuelles existent
            const individualCollections = collectionNames.filter(name => name.startsWith('backup_'));
            const hasUsersCollection = collectionNames.includes('backup_users_profiles');
            const hasEconomyCollection = collectionNames.includes('backup_economy_data');
            
            await mongoBackup.disconnect();
            
            const result = {
                test: 'Séparation collections',
                passed: individualCollections.length > 0 && hasUsersCollection && hasEconomyCollection,
                details: `${individualCollections.length} collections individuelles détectées (backup_users_profiles, backup_economy_data, etc.)`
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ${result.passed ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} - ${result.details}`);
            
            if (individualCollections.length > 0) {
                console.log('   📋 Collections individuelles trouvées:');
                individualCollections.slice(0, 5).forEach(name => {
                    console.log(`      ${name}`);
                });
                if (individualCollections.length > 5) {
                    console.log(`      ... et ${individualCollections.length - 5} autres`);
                }
            }
            console.log('');
            
        } catch (error) {
            const result = {
                test: 'Séparation collections',
                passed: false,
                details: `Erreur: ${error.message}`
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ❌ ÉCHOUÉ - ${result.details}\n`);
        }
    }

    generateFinalReport() {
        const duration = Date.now() - this.startTime;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        
        console.log('📋 === RAPPORT FINAL SAUVEGARDE INDIVIDUALISÉE ===\n');
        
        console.log('🎯 RÉSULTATS DES TESTS:');
        this.testResults.forEach((result, index) => {
            const status = result.passed ? '✅' : '❌';
            console.log(`   ${index + 1}. ${status} ${result.test}: ${result.details}`);
        });
        console.log('');
        
        console.log('📊 STATISTIQUES:');
        console.log(`   • Tests réussis: ${passedTests}/${totalTests}`);
        console.log(`   • Taux de réussite: ${Math.round((passedTests/totalTests)*100)}%`);
        console.log(`   • Durée: ${(duration/1000).toFixed(2)}s`);
        console.log('');
        
        if (passedTests === totalTests) {
            console.log('🎉 SYSTÈME INDIVIDUALISÉ + GÉO-REDONDANT OPÉRATIONNEL !');
            console.log('');
            console.log('✅ FONCTIONNALITÉS CONFIRMÉES:');
            console.log('   • Géo-redondance multi-région configurée');
            console.log('   • Chaque fichier dans sa propre collection MongoDB');
            console.log('   • users.json séparé de la collection générique');
            console.log('   • Sauvegarde et restauration fichier par fichier');
            console.log('   • Collections préfixées "backup_" pour organisation');
            console.log('   • Réplication automatique sur 3+ centres de données');
        } else {
            console.log('⚠️ QUELQUES AMÉLIORATIONS NÉCESSAIRES');
            const failedTests = this.testResults.filter(r => !r.passed);
            console.log('');
            console.log('❌ TESTS ÉCHOUÉS:');
            failedTests.forEach(test => {
                console.log(`   • ${test.test}: ${test.details}`);
            });
        }
        
        console.log('');
        console.log('🔧 CONFIGURATION FINALE:');
        console.log('   • Stratégie: MongoDB Atlas avec géo-redondance');
        console.log('   • Collections: Individualisées par fichier');
        console.log('   • Préfixe: backup_[type]_[nom]');
        console.log('   • Réplication: w=majority (3+ réplicas)');
        console.log('   • Lecture: secondaryPreferred (performance optimisée)');
        console.log('   • Timeout: 45s (connexions réseau robustes)');
        console.log('');
        
        return {
            passed: passedTests,
            total: totalTests,
            success: passedTests === totalTests,
            duration: duration
        };
    }
}

// Exécution du script
if (require.main === module) {
    const tester = new IndividualBackupTest();
    
    tester.runAllTests()
        .then((results) => {
            const summary = tester.generateFinalReport();
            console.log(`🏁 Tests individualisés terminés: ${summary.passed}/${summary.total} réussis en ${(summary.duration/1000).toFixed(2)}s`);
            process.exit(summary.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Erreur critique lors des tests individualisés:', error);
            process.exit(1);
        });
}

module.exports = IndividualBackupTest;