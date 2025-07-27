const mongoBackupManager = require('./utils/mongoBackupManager');
const MongoDBDiagnostic = require('./utils/mongodbDiagnostic');

async function testMongoDB() {
    console.log('🧪 TEST MONGODB COMPLET');
    console.log('========================');
    
    // Test 1: Diagnostic complet
    console.log('\n1️⃣ Diagnostic MongoDB Atlas...');
    const diagnosticResult = await MongoDBDiagnostic.testConnection();
    
    if (!diagnosticResult) {
        console.log('❌ Diagnostic échoué - arrêt des tests');
        return;
    }
    
    // Test 2: Test de sauvegarde
    console.log('\n2️⃣ Test sauvegarde...');
    const backupResult = await mongoBackupManager.backupToMongo();
    console.log('Résultat sauvegarde:', backupResult);
    
    // Test 3: Test de vérification
    console.log('\n3️⃣ Test vérification intégrité...');
    const verifyResult = await mongoBackupManager.verifyBackupIntegrity();
    console.log('Résultat vérification:', verifyResult);
    
    // Test 4: Scanner de fichiers
    console.log('\n4️⃣ Test scanner fichiers...');
    const scanResult = await mongoBackupManager.scanAllDataFiles();
    console.log('Fichiers détectés:', Object.keys(scanResult).length);
    console.log('Collections cibles:', [...new Set(Object.values(scanResult))]);
    
    console.log('\n✅ Tests MongoDB terminés');
    process.exit(0);
}

testMongoDB().catch(error => {
    console.error('❌ Erreur test MongoDB:', error);
    process.exit(1);
});