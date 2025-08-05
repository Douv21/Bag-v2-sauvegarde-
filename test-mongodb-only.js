#!/usr/bin/env node

require('dotenv').config();

const unifiedBackup = require('./utils/unifiedBackupManager');
const mongoBackup = require('./utils/mongoBackupManager');

class MongoDBOnlyTest {
    constructor() {
        this.testResults = [];
        this.startTime = Date.now();
    }

    async runAllTests() {
        console.log('🧪 === TEST SYSTÈME MONGODB UNIQUEMENT ===\n');
        
        await this.testEnvironmentVariables();
        await this.testMongoConnection();
        await this.testUnifiedSystemInit();
        await this.testMongoBackup();
        await this.testMongoRestore();
        await this.testEmergencyBackup();
        
        this.generateFinalReport();
        return this.testResults;
    }

    async testEnvironmentVariables() {
        console.log('1️⃣ Test variables d\'environnement MongoDB...');
        
        const required = ['MONGODB_USERNAME', 'MONGODB_PASSWORD', 'MONGODB_CLUSTER_URL'];
        const missing = required.filter(varName => !process.env[varName]);
        
        const result = {
            test: 'Variables environnement',
            passed: missing.length === 0,
            details: missing.length === 0 ? 
                'Toutes les variables MongoDB configurées' : 
                `Variables manquantes: ${missing.join(', ')}`
        };
        
        this.testResults.push(result);
        console.log(`   📊 Résultat: ${result.passed ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} - ${result.details}\n`);
    }

    async testMongoConnection() {
        console.log('2️⃣ Test connexion MongoDB...');
        
        try {
            const connected = await mongoBackup.connect();
            if (connected) {
                await mongoBackup.disconnect();
            }
            
            const result = {
                test: 'Connexion MongoDB',
                passed: connected,
                details: connected ? 'Connexion réussie' : 'Échec de connexion'
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ${result.passed ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} - ${result.details}\n`);
            
        } catch (error) {
            const result = {
                test: 'Connexion MongoDB',
                passed: false,
                details: `Erreur: ${error.message}`
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ❌ ÉCHOUÉ - ${result.details}\n`);
        }
    }

    async testUnifiedSystemInit() {
        console.log('3️⃣ Test initialisation système unifié...');
        
        try {
            // Attendre l'initialisation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const status = await unifiedBackup.getSystemStatus();
            const isMongoOnly = status.strategy === 'mongo' && status.mongo.available;
            
            const result = {
                test: 'Système unifié',
                passed: isMongoOnly,
                details: `Stratégie: ${status.strategy}, MongoDB: ${status.mongo.available ? 'Disponible' : 'Indisponible'}`
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ${result.passed ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} - ${result.details}\n`);
            
        } catch (error) {
            const result = {
                test: 'Système unifié',
                passed: false,
                details: `Erreur: ${error.message}`
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ❌ ÉCHOUÉ - ${result.details}\n`);
        }
    }

    async testMongoBackup() {
        console.log('4️⃣ Test sauvegarde MongoDB...');
        
        try {
            const backupResult = await unifiedBackup.performBackup(true);
            
            const result = {
                test: 'Sauvegarde MongoDB',
                passed: backupResult.success && backupResult.strategy === 'mongo',
                details: backupResult.success ? 
                    `${backupResult.mongo.backupCount} fichiers sauvegardés` : 
                    'Échec sauvegarde'
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ${result.passed ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} - ${result.details}\n`);
            
        } catch (error) {
            const result = {
                test: 'Sauvegarde MongoDB',
                passed: false,
                details: `Erreur: ${error.message}`
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ❌ ÉCHOUÉ - ${result.details}\n`);
        }
    }

    async testMongoRestore() {
        console.log('5️⃣ Test restauration MongoDB...');
        
        try {
            const restoreResult = await mongoBackup.restoreFromMongo();
            
            const result = {
                test: 'Restauration MongoDB',
                passed: restoreResult.success,
                details: restoreResult.success ? 
                    `${restoreResult.restoredFiles} fichiers restaurés` : 
                    'Échec restauration'
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ${result.passed ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} - ${result.details}\n`);
            
        } catch (error) {
            const result = {
                test: 'Restauration MongoDB',
                passed: false,
                details: `Erreur: ${error.message}`
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ❌ ÉCHOUÉ - ${result.details}\n`);
        }
    }

    async testEmergencyBackup() {
        console.log('6️⃣ Test sauvegarde d\'urgence...');
        
        try {
            const emergencyResult = await unifiedBackup.emergencyBackup();
            
            const result = {
                test: 'Sauvegarde urgence',
                passed: emergencyResult.success,
                details: emergencyResult.success ? 
                    'Sauvegarde d\'urgence réussie' : 
                    'Échec sauvegarde d\'urgence'
            };
            
            this.testResults.push(result);
            console.log(`   📊 Résultat: ${result.passed ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'} - ${result.details}\n`);
            
        } catch (error) {
            const result = {
                test: 'Sauvegarde urgence',
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
        
        console.log('📋 === RAPPORT FINAL MONGODB UNIQUEMENT ===\n');
        
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
            console.log('🎉 SYSTÈME MONGODB UNIQUEMENT OPÉRATIONNEL !');
            console.log('');
            console.log('✅ FONCTIONNALITÉS CONFIRMÉES:');
            console.log('   • Connexion MongoDB Atlas fonctionnelle');
            console.log('   • Sauvegarde automatique uniquement vers MongoDB');
            console.log('   • Restauration depuis MongoDB opérationnelle');
            console.log('   • Sauvegarde d\'urgence MongoDB disponible');
            console.log('   • Sauvegarde locale complètement désactivée');
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
        console.log('🔧 CONFIGURATION ACTUELLE:');
        console.log('   • Stratégie: MongoDB uniquement');
        console.log('   • Sauvegarde locale: DÉSACTIVÉE');
        console.log('   • Connexion: MongoDB Atlas');
        console.log('   • Compression: Gérée par MongoDB');
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
    const tester = new MongoDBOnlyTest();
    
    tester.runAllTests()
        .then((results) => {
            const summary = tester.generateFinalReport();
            console.log(`🏁 Tests MongoDB terminés: ${summary.passed}/${summary.total} réussis en ${(summary.duration/1000).toFixed(2)}s`);
            process.exit(summary.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Erreur critique lors des tests MongoDB:', error);
            process.exit(1);
        });
}

module.exports = MongoDBOnlyTest;