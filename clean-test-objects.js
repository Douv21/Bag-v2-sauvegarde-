const { MongoClient } = require('mongodb');

/**
 * Script de nettoyage des objets test dans MongoDB
 * Supprime tous les objets test qui peuvent être restés dans la base
 */

class TestObjectCleaner {
    constructor() {
        // Utiliser les mêmes variables que le système existant
        this.username = process.env.MONGODB_USERNAME;
        this.password = process.env.MONGODB_PASSWORD;
        this.clusterUrl = process.env.MONGODB_CLUSTER_URL;
        this.client = null;
    }

    async connect() {
        // Vérifier les variables d'environnement comme dans mongodbDiagnostic.js
        if (!this.username || !this.password || !this.clusterUrl) {
            console.log('⚠️ Variables d\'environnement MongoDB manquantes');
            console.log(`   Username: ${this.username ? '✓' : '✗'}`);
            console.log(`   Password: ${this.password ? '✓' : '✗'}`);
            console.log(`   Cluster: ${this.clusterUrl ? '✓' : '✗'}`);
            console.log('💡 Mode local uniquement - pas de nettoyage MongoDB nécessaire');
            return false;
        }

        try {
            // Nettoyer l'URL du cluster comme dans mongodbDiagnostic.js
            let cleanUrl = this.clusterUrl;
            if (cleanUrl.includes('mongodb+srv://')) {
                const match = cleanUrl.match(/@([^\/\?]+)/);
                if (match) {
                    cleanUrl = match[1];
                }
            }

            // Construire la chaîne de connexion
            const connectionString = `mongodb+srv://${encodeURIComponent(this.username)}:${encodeURIComponent(this.password)}@${cleanUrl}/bagbot?retryWrites=true&w=majority`;
            
            console.log('🔌 Connexion à MongoDB...');
            this.client = new MongoClient(connectionString, {
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000,
                maxPoolSize: 10
            });
            
            await this.client.connect();
            console.log('✅ Connexion MongoDB établie');
            return true;
        } catch (error) {
            console.error('❌ Erreur connexion MongoDB:', error.message);
            return false;
        }
    }

    async cleanTestObjects() {
        if (!this.client) {
            console.log('❌ Pas de connexion MongoDB active');
            return;
        }

        try {
            const db = this.client.db('bagbot');
            
            // 1. Nettoyer la collection 'test' complètement
            console.log('🧹 Nettoyage collection test...');
            const testCollection = db.collection('test');
            const testResult = await testCollection.deleteMany({});
            console.log(`✅ ${testResult.deletedCount} objets supprimés de la collection test`);

            // 2. Nettoyer les objets test dans d'autres collections
            console.log('🧹 Recherche d\'objets test dans toutes les collections...');
            
            const collections = await db.listCollections().toArray();
            let totalCleaned = 0;

            for (const collectionInfo of collections) {
                const collectionName = collectionInfo.name;
                if (collectionName === 'test') continue; // Déjà nettoyée

                console.log(`🔍 Vérification collection: ${collectionName}`);
                const collection = db.collection(collectionName);

                // Rechercher différents patterns d'objets test
                const testPatterns = [
                    { test: true },
                    { test: { $exists: true } },
                    { name: /test/i },
                    { id: /test/i },
                    { userId: '999999999999999999' }, // ID de test du script de test d'intégrité
                    { guildId: '888888888888888888' } // ID de test du script de test d'intégrité
                ];

                for (const pattern of testPatterns) {
                    try {
                        const result = await collection.deleteMany(pattern);
                        if (result.deletedCount > 0) {
                            console.log(`  ✅ ${result.deletedCount} objets test supprimés (pattern: ${JSON.stringify(pattern)})`);
                            totalCleaned += result.deletedCount;
                        }
                    } catch (error) {
                        console.log(`  ⚠️ Erreur avec pattern ${JSON.stringify(pattern)}: ${error.message}`);
                    }
                }
            }

            console.log(`🎉 Nettoyage terminé: ${totalCleaned} objets test supprimés au total`);

        } catch (error) {
            console.error('❌ Erreur lors du nettoyage:', error.message);
        }
    }

    async listTestObjects() {
        if (!this.client) {
            console.log('❌ Pas de connexion MongoDB active');
            return;
        }

        try {
            const db = this.client.db('bagbot');
            const collections = await db.listCollections().toArray();
            
            console.log('🔍 Recherche d\'objets test...');
            let totalFound = 0;

            for (const collectionInfo of collections) {
                const collectionName = collectionInfo.name;
                const collection = db.collection(collectionName);

                // Compter les objets test
                const testCount = await collection.countDocuments({ test: { $exists: true } });
                if (testCount > 0) {
                    console.log(`📋 Collection ${collectionName}: ${testCount} objets test trouvés`);
                    totalFound += testCount;
                }
            }

            if (totalFound === 0) {
                console.log('✅ Aucun objet test trouvé');
            } else {
                console.log(`⚠️ Total: ${totalFound} objets test trouvés`);
            }

        } catch (error) {
            console.error('❌ Erreur lors de la recherche:', error.message);
        }
    }

    async close() {
        if (this.client) {
            await this.client.close();
            console.log('🔌 Connexion MongoDB fermée');
        }
    }
}

async function main() {
    const cleaner = new TestObjectCleaner();
    
    // Connexion
    const connected = await cleaner.connect();
    if (!connected) {
        console.log('❌ Impossible de se connecter à MongoDB');
        process.exit(1);
    }

    // Vérifier les arguments de ligne de commande
    const action = process.argv[2] || 'clean';

    try {
        if (action === 'list') {
            await cleaner.listTestObjects();
        } else if (action === 'clean') {
            await cleaner.listTestObjects();
            console.log('\n🧹 Démarrage du nettoyage...');
            await cleaner.cleanTestObjects();
        } else {
            console.log('Usage: node clean-test-objects.js [list|clean]');
            console.log('  list  - Lister les objets test sans les supprimer');
            console.log('  clean - Nettoyer tous les objets test (défaut)');
        }
    } finally {
        await cleaner.close();
    }
}

// Exécution
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Erreur critique:', error);
        process.exit(1);
    });
}

module.exports = TestObjectCleaner;