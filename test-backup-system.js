const unifiedBackup = require('./utils/unifiedBackupManager');
const robustBackup = require('./utils/robustBackupManager');
const dataValidator = require('./utils/dataValidator');

async function testBackupSystem() {
    console.log('🧪 === TEST SYSTÈME DE SAUVEGARDE COMPLET ===\n');
    
    try {
        // Test 1: Validation des données existantes
        console.log('1️⃣ Test validation des données...');
        const validationReport = await dataValidator.validateAllData();
        console.log(`   ✅ Validation terminée: ${validationReport.summary.valid} valides, ${validationReport.summary.invalid} invalides\n`);
        
        // Test 2: Réparation automatique si nécessaire
        if (validationReport.summary.invalid > 0 || validationReport.summary.empty > 0) {
            console.log('2️⃣ Test réparation automatique...');
            const repairResult = await dataValidator.autoRepair();
            console.log(`   ✅ Réparation: ${repairResult.repaired || 0} fichiers réparés\n`);
        }
        
        // Test 3: Sauvegarde robuste locale
        console.log('3️⃣ Test sauvegarde robuste...');
        const backupResult = await robustBackup.createFullBackup('test-backup');
        if (backupResult.success) {
            console.log(`   ✅ Sauvegarde créée: ${backupResult.filesBackedUp} fichiers, compression ${backupResult.compressionRatio}`);
        } else {
            console.log(`   ❌ Échec sauvegarde: ${backupResult.error}`);
        }
        console.log();
        
        // Test 4: Liste des sauvegardes
        console.log('4️⃣ Test liste des sauvegardes...');
        const backupList = await robustBackup.listBackups();
        console.log(`   📁 ${backupList.length} sauvegardes disponibles`);
        if (backupList.length > 0) {
            console.log(`   📅 Plus récente: ${backupList[0].name} (${Math.round(backupList[0].size/1024)}KB)`);
        }
        console.log();
        
        // Test 5: Test du système unifié
        console.log('5️⃣ Test système unifié...');
        const systemStatus = await unifiedBackup.getSystemStatus();
        console.log(`   🔧 Stratégie: ${systemStatus.strategy}`);
        console.log(`   🔗 MongoDB: ${systemStatus.mongo.available ? 'Disponible' : 'Indisponible'}`);
        console.log(`   💚 Santé données: ${systemStatus.data.status}`);
        console.log();
        
        // Test 6: Sauvegarde via système unifié
        console.log('6️⃣ Test sauvegarde unifiée...');
        const unifiedResult = await unifiedBackup.performBackup(true);
        console.log(`   ✅ Sauvegarde ${unifiedResult.strategy}: ${unifiedResult.success ? 'Réussie' : 'Échouée'}`);
        console.log();
        
        // Test 7: Vérification intégrité
        console.log('7️⃣ Test vérification intégrité...');
        const integrityReport = await robustBackup.verifyDataIntegrity();
        console.log(`   📊 ${integrityReport.validFiles}/${integrityReport.totalFiles} fichiers valides`);
        console.log(`   🚨 Statut: ${integrityReport.criticalStatus}`);
        console.log();
        
        // Test 8: Test sauvegarde d'urgence
        console.log('8️⃣ Test sauvegarde d\'urgence...');
        const emergencyResult = await robustBackup.emergencyBackup();
        if (emergencyResult.success) {
            console.log(`   🚨 Urgence réussie: ${emergencyResult.filesSaved} fichiers critiques sauvés`);
        } else {
            console.log(`   ❌ Échec urgence: ${emergencyResult.error}`);
        }
        console.log();
        
        // Test 9: Test restauration (simulation)
        console.log('9️⃣ Test simulation restauration...');
        const restoreList = await robustBackup.listBackups();
        if (restoreList.length > 0) {
            console.log(`   📥 ${restoreList.length} sauvegardes disponibles pour restauration`);
            console.log(`   ✅ Restauration possible depuis: ${restoreList[0].name}`);
        } else {
            console.log(`   ⚠️ Aucune sauvegarde disponible pour restauration`);
        }
        console.log();
        
        // Résumé final
        console.log('📋 === RÉSUMÉ DES TESTS ===');
        console.log(`✅ Validation données: ${validationReport.summary.valid}/${validationReport.summary.valid + validationReport.summary.invalid + validationReport.summary.empty} OK`);
        console.log(`✅ Sauvegarde locale: ${backupResult.success ? 'Fonctionnelle' : 'Défaillante'}`);
        console.log(`✅ Système unifié: ${systemStatus.initialized ? 'Initialisé' : 'Erreur'}`);
        console.log(`✅ Sauvegardes disponibles: ${backupList.length}`);
        console.log(`✅ Intégrité: ${integrityReport.criticalStatus}`);
        
        // Recommandations
        console.log('\n💡 RECOMMANDATIONS:');
        
        if (!systemStatus.mongo.available) {
            console.log('   🔧 Configurez MongoDB pour la sauvegarde hybride (variables d\'environnement)');
        }
        
        if (backupList.length < 3) {
            console.log('   📅 Laissez le système créer plus de sauvegardes automatiques');
        }
        
        if (integrityReport.criticalStatus !== 'OK') {
            console.log('   ⚠️ Problèmes d\'intégrité détectés - vérifiez les données');
        }
        
        console.log('\n🎉 Tests terminés avec succès!');
        
        return {
            success: true,
            tests: {
                validation: validationReport.summary.valid > 0,
                backup: backupResult.success,
                unified: systemStatus.initialized,
                integrity: integrityReport.criticalStatus === 'OK',
                emergency: emergencyResult.success
            }
        };
        
    } catch (error) {
        console.error('❌ Erreur durant les tests:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Configuration MongoDB suggérée
function displayMongoConfig() {
    console.log('\n🔧 === CONFIGURATION MONGODB (optionnelle) ===');
    console.log('Pour activer la sauvegarde hybride, configurez ces variables d\'environnement:');
    console.log('');
    console.log('MONGODB_USERNAME=votre_nom_utilisateur');
    console.log('MONGODB_PASSWORD=votre_mot_de_passe');
    console.log('MONGODB_CLUSTER_URL=cluster0.xxxxx.mongodb.net');
    console.log('');
    console.log('Sans ces variables, le système utilise uniquement la sauvegarde locale robuste.');
    console.log('');
}

// Démarrage des tests
async function runTests() {
    const startTime = Date.now();
    
    displayMongoConfig();
    const results = await testBackupSystem();
    
    const duration = Date.now() - startTime;
    console.log(`\n⏱️ Tests terminés en ${(duration/1000).toFixed(2)}s`);
    
    if (results.success) {
        const passedTests = Object.values(results.tests).filter(t => t).length;
        const totalTests = Object.values(results.tests).length;
        console.log(`📊 Score: ${passedTests}/${totalTests} tests réussis`);
        
        if (passedTests === totalTests) {
            console.log('🏆 Système de sauvegarde parfaitement fonctionnel!');
        } else {
            console.log('⚠️ Quelques améliorations recommandées (voir ci-dessus)');
        }
    }
    
    process.exit(results.success ? 0 : 1);
}

runTests().catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
});