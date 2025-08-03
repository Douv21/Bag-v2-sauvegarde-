// Test de connexion MongoDB pour Render avec les nouvelles variables
const mongoBackup = require('./utils/mongoBackupManager');

async function testRenderBackupSystem() {
    console.log('🧪 TEST DU SYSTÈME DE SAUVEGARDE RENDER');
    console.log('==========================================');
    
    // Afficher la configuration
    console.log('\n📋 Configuration MongoDB:');
    console.log(`   Username: ${process.env.MONGODB_USERNAME || 'NON DÉFINI'}`);
    console.log(`   Password: ${process.env.MONGODB_PASSWORD ? '***' : 'NON DÉFINI'}`);
    console.log(`   Cluster: ${process.env.MONGODB_CLUSTER_URL || 'NON DÉFINI'}`);
    console.log(`   Debug: ${process.env.DEBUG_BACKUP || 'false'}`);
    
    // Test de connexion
    console.log('\n🔌 Test de connexion MongoDB...');
    const connected = await mongoBackup.connect();
    
    if (connected) {
        console.log('✅ Connexion MongoDB réussie !');
        
        // Test de sauvegarde
        console.log('\n💾 Test de sauvegarde...');
        const backupResult = await mongoBackup.backupToMongo();
        
        if (backupResult.success) {
            console.log(`✅ Sauvegarde réussie: ${backupResult.backupCount} fichiers`);
            
            // Test de vérification d'intégrité
            console.log('\n🔍 Test de vérification d\'intégrité...');
            const integrityOk = await mongoBackup.verifyBackupIntegrity();
            
            if (integrityOk) {
                console.log('✅ Intégrité des sauvegardes vérifiée');
            } else {
                console.log('⚠️ Problème d\'intégrité détecté');
            }
        } else {
            console.log('❌ Échec de la sauvegarde:', backupResult.error);
        }
        
        await mongoBackup.disconnect();
    } else {
        console.log('❌ Impossible de se connecter à MongoDB');
        console.log('\n🔧 Vérifications à effectuer:');
        console.log('   1. Variables d\'environnement correctement définies');
        console.log('   2. Mot de passe MongoDB correct');
        console.log('   3. IP autorisées sur MongoDB Atlas (0.0.0.0/0)');
        console.log('   4. Utilisateur avec permissions readWrite sur bagbot');
    }
    
    console.log('\n==========================================');
    console.log('🏁 Test terminé');
}

// Lancer le test
if (require.main === module) {
    testRenderBackupSystem().catch(error => {
        console.error('❌ Erreur lors du test:', error);
        process.exit(1);
    });
}

module.exports = { testRenderBackupSystem };