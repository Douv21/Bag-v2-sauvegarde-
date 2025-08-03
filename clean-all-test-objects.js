const TestObjectCleaner = require('./clean-test-objects');
const LocalTestDataCleaner = require('./clean-local-test-data');

/**
 * Script principal de nettoyage des objets test
 * Combine le nettoyage MongoDB et local
 */

async function cleanAllTestObjects() {
    console.log('🧹 === NETTOYAGE COMPLET DES OBJETS TEST ===');
    console.log('============================================\n');

    let totalCleaned = 0;

    // 1. Nettoyage des fichiers locaux
    console.log('1️⃣ Nettoyage des fichiers locaux...');
    try {
        const localCleaner = new LocalTestDataCleaner();
        const localCleaned = await localCleaner.cleanAllFiles();
        totalCleaned += localCleaned;
        console.log('✅ Nettoyage local terminé\n');
    } catch (error) {
        console.error('❌ Erreur nettoyage local:', error.message);
    }

    // 2. Nettoyage MongoDB (si configuré)
    console.log('2️⃣ Nettoyage MongoDB...');
    try {
        const mongoCleaner = new TestObjectCleaner();
        const connected = await mongoCleaner.connect();
        
        if (connected) {
            await mongoCleaner.cleanTestObjects();
            await mongoCleaner.close();
            console.log('✅ Nettoyage MongoDB terminé\n');
        } else {
            console.log('⚠️ MongoDB non configuré - nettoyage ignoré\n');
        }
    } catch (error) {
        console.error('❌ Erreur nettoyage MongoDB:', error.message);
    }

    // 3. Résumé
    console.log('🎉 === RÉSUMÉ DU NETTOYAGE ===');
    console.log(`Total objets test supprimés: ${totalCleaned}`);
    
    if (totalCleaned > 0) {
        console.log('✅ Nettoyage réussi - tous les objets test ont été supprimés');
        console.log('💾 Des sauvegardes ont été créées pour tous les fichiers modifiés');
    } else {
        console.log('✅ Aucun objet test trouvé - système déjà propre');
    }

    console.log('\n📝 Les fichiers de sauvegarde peuvent être supprimés si tout fonctionne correctement.');
}

async function listAllTestObjects() {
    console.log('🔍 === RECHERCHE D\'OBJETS TEST ===');
    console.log('==================================\n');

    let totalFound = 0;

    // 1. Recherche dans les fichiers locaux
    console.log('1️⃣ Recherche dans les fichiers locaux...');
    try {
        const localCleaner = new LocalTestDataCleaner();
        const localFound = await localCleaner.listTestObjects();
        totalFound += localFound;
        console.log();
    } catch (error) {
        console.error('❌ Erreur recherche locale:', error.message);
    }

    // 2. Recherche dans MongoDB (si configuré)
    console.log('2️⃣ Recherche dans MongoDB...');
    try {
        const mongoCleaner = new TestObjectCleaner();
        const connected = await mongoCleaner.connect();
        
        if (connected) {
            await mongoCleaner.listTestObjects();
            await mongoCleaner.close();
        } else {
            console.log('⚠️ MongoDB non configuré - recherche ignorée');
        }
        console.log();
    } catch (error) {
        console.error('❌ Erreur recherche MongoDB:', error.message);
    }

    // 3. Résumé
    console.log('📊 === RÉSUMÉ ===');
    if (totalFound > 0) {
        console.log(`⚠️ ${totalFound} objets test trouvés au total`);
        console.log('💡 Utilisez "node clean-all-test-objects.js clean" pour les supprimer');
    } else {
        console.log('✅ Aucun objet test trouvé - système propre');
    }
}

async function main() {
    const action = process.argv[2] || 'clean';

    try {
        if (action === 'list') {
            await listAllTestObjects();
        } else if (action === 'clean') {
            await cleanAllTestObjects();
        } else {
            console.log('Usage: node clean-all-test-objects.js [list|clean]');
            console.log('  list  - Lister tous les objets test sans les supprimer');
            console.log('  clean - Nettoyer tous les objets test (défaut)');
            console.log('');
            console.log('Ce script nettoie:');
            console.log('  • Les objets test dans les fichiers JSON locaux');
            console.log('  • Les objets test dans MongoDB (si configuré)');
            console.log('  • Les collections test temporaires');
            console.log('  • Les données de test des scripts d\'intégrité');
        }
    } catch (error) {
        console.error('❌ Erreur critique:', error);
        process.exit(1);
    }
}

// Exécution
if (require.main === module) {
    main();
}

module.exports = { cleanAllTestObjects, listAllTestObjects };