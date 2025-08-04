const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

/**
 * Script de nettoyage définitif et complet de tous les objets test
 * Nettoie les fichiers locaux, les sauvegardes et MongoDB
 */

class FinalTestObjectCleaner {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.backupDir = path.join(this.dataDir, 'backups');
        
        // Configuration MongoDB
        this.username = process.env.MONGODB_USERNAME;
        this.password = process.env.MONGODB_PASSWORD;
        this.clusterUrl = process.env.MONGODB_CLUSTER_URL;
        this.client = null;
        
        this.testPatterns = [
            // Patterns de prix test
            { price: 594939 },
            { price: 999999 },
            { price: 123456 },
            
            // Patterns de noms test
            { name: /^test$/i },
            { name: /^objet.*test/i },
            { name: /test.*object/i },
            
            // Patterns d'IDs test
            { id: /test/i },
            { userId: '999999999999999999' },
            { guildId: '888888888888888888' },
            
            // Patterns de propriétés test
            { test: true },
            { test: { $exists: true } },
            { isTest: true },
            { debug: true }
        ];

        this.cleanupStats = {
            filesProcessed: 0,
            objectsRemoved: 0,
            backupsProcessed: 0,
            mongoCollectionsCleaned: 0,
            errors: 0
        };
    }

    async runCompleteCleanup() {
        console.log('🧹 NETTOYAGE DÉFINITIF DE TOUS LES OBJETS TEST');
        console.log('='.repeat(60));

        try {
            // 1. Nettoyer les fichiers de données locaux
            await this.cleanLocalDataFiles();
            
            // 2. Nettoyer les sauvegardes
            await this.cleanBackupFiles();
            
            // 3. Nettoyer MongoDB si disponible
            await this.cleanMongoDatabase();
            
            // 4. Vérification finale
            await this.verifyCleanup();

            this.printFinalReport();
            
        } catch (error) {
            console.error('❌ Erreur critique pendant le nettoyage:', error);
            this.cleanupStats.errors++;
        }
    }

    // Nettoyer les fichiers de données locaux
    async cleanLocalDataFiles() {
        console.log('\n📁 NETTOYAGE DES FICHIERS DE DONNÉES LOCAUX');
        console.log('-'.repeat(50));

        const dataFiles = [
            'economy.json',
            'users.json',
            'level_users.json',
            'shop.json',
            'actions.json',
            'confessions.json',
            'user_stats.json'
        ];

        for (const filename of dataFiles) {
            const filePath = path.join(this.dataDir, filename);
            if (fs.existsSync(filePath)) {
                await this.cleanJsonFile(filePath);
            }
        }
    }

    // Nettoyer un fichier JSON spécifique
    async cleanJsonFile(filePath) {
        try {
            console.log(`📄 Nettoyage: ${path.basename(filePath)}`);
            
            const content = fs.readFileSync(filePath, 'utf8');
            let data = JSON.parse(content);
            let modified = false;
            let removedCount = 0;

            // Créer une sauvegarde avant modification
            const backupPath = `${filePath}.pre-final-clean-${Date.now()}.backup`;
            fs.writeFileSync(backupPath, content);

            // Nettoyer récursivement
            const cleanResult = this.removeTestObjects(data);
            if (cleanResult.modified) {
                data = cleanResult.data;
                removedCount = cleanResult.removedCount;
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                console.log(`   ✅ ${removedCount} objets test supprimés`);
                this.cleanupStats.objectsRemoved += removedCount;
            } else {
                // Supprimer la sauvegarde si pas de modification
                fs.unlinkSync(backupPath);
                console.log('   ✓ Aucun objet test trouvé');
            }

            this.cleanupStats.filesProcessed++;

        } catch (error) {
            console.error(`   ❌ Erreur: ${error.message}`);
            this.cleanupStats.errors++;
        }
    }

    // Fonction récursive pour supprimer les objets test
    removeTestObjects(obj) {
        let modified = false;
        let removedCount = 0;

        if (Array.isArray(obj)) {
            for (let i = obj.length - 1; i >= 0; i--) {
                if (this.isTestObject(obj[i])) {
                    obj.splice(i, 1);
                    removedCount++;
                    modified = true;
                } else if (typeof obj[i] === 'object' && obj[i] !== null) {
                    const result = this.removeTestObjects(obj[i]);
                    if (result.modified) {
                        obj[i] = result.data;
                        removedCount += result.removedCount;
                        modified = true;
                    }
                }
            }
        } else if (obj && typeof obj === 'object') {
            for (const key in obj) {
                if (this.isTestObject(obj[key])) {
                    delete obj[key];
                    removedCount++;
                    modified = true;
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    const result = this.removeTestObjects(obj[key]);
                    if (result.modified) {
                        obj[key] = result.data;
                        removedCount += result.removedCount;
                        modified = true;
                    }
                }
            }
        }

        return { data: obj, modified, removedCount };
    }

    // Vérifier si un objet est un objet test
    isTestObject(obj) {
        if (!obj || typeof obj !== 'object') return false;

        for (const pattern of this.testPatterns) {
            if (this.matchesPattern(obj, pattern)) {
                return true;
            }
        }

        return false;
    }

    // Vérifier si un objet correspond à un pattern
    matchesPattern(obj, pattern) {
        for (const [key, value] of Object.entries(pattern)) {
            if (key === '$exists') continue;
            
            if (obj[key] !== undefined) {
                if (value instanceof RegExp) {
                    if (typeof obj[key] === 'string' && value.test(obj[key])) {
                        return true;
                    }
                } else if (obj[key] === value) {
                    return true;
                }
            }
        }
        return false;
    }

    // Nettoyer les fichiers de sauvegarde
    async cleanBackupFiles() {
        console.log('\n💾 NETTOYAGE DES FICHIERS DE SAUVEGARDE');
        console.log('-'.repeat(50));

        if (!fs.existsSync(this.backupDir)) {
            console.log('⚠️ Répertoire backups non trouvé');
            return;
        }

        await this.cleanBackupDirectory(this.backupDir);
    }

    async cleanBackupDirectory(dir) {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const itemPath = path.join(dir, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                await this.cleanBackupDirectory(itemPath);
            } else if (item.endsWith('.json') && !item.includes('cleaned')) {
                await this.cleanJsonFile(itemPath);
                this.cleanupStats.backupsProcessed++;
            }
        }
    }

    // Nettoyer MongoDB
    async cleanMongoDatabase() {
        console.log('\n🍃 NETTOYAGE MONGODB');
        console.log('-'.repeat(50));

        if (!this.username || !this.password || !this.clusterUrl) {
            console.log('⚠️ Configuration MongoDB manquante - nettoyage local uniquement');
            return;
        }

        try {
            await this.connectToMongo();
            
            if (this.client) {
                const db = this.client.db('bagbot');
                const collections = await db.listCollections().toArray();

                for (const collectionInfo of collections) {
                    const collectionName = collectionInfo.name;
                    await this.cleanMongoCollection(db, collectionName);
                }

                await this.client.close();
                console.log('🔌 Connexion MongoDB fermée');
            }

        } catch (error) {
            console.error('❌ Erreur nettoyage MongoDB:', error);
            this.cleanupStats.errors++;
        }
    }

    async connectToMongo() {
        try {
            let cleanUrl = this.clusterUrl;
            if (cleanUrl.includes('mongodb+srv://')) {
                const match = cleanUrl.match(/@([^\/\?]+)/);
                if (match) {
                    cleanUrl = match[1];
                }
            }

            const connectionString = `mongodb+srv://${encodeURIComponent(this.username)}:${encodeURIComponent(this.password)}@${cleanUrl}/bagbot?retryWrites=true&w=majority`;
            
            this.client = new MongoClient(connectionString, {
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000
            });
            
            await this.client.connect();
            console.log('✅ Connexion MongoDB établie');

        } catch (error) {
            console.error('❌ Erreur connexion MongoDB:', error);
            this.client = null;
        }
    }

    async cleanMongoCollection(db, collectionName) {
        try {
            console.log(`🔍 Nettoyage collection: ${collectionName}`);
            const collection = db.collection(collectionName);
            let totalRemoved = 0;

            // Nettoyer avec chaque pattern
            for (const pattern of this.testPatterns) {
                try {
                    const result = await collection.deleteMany(pattern);
                    if (result.deletedCount > 0) {
                        console.log(`   ✅ ${result.deletedCount} objets supprimés (${JSON.stringify(pattern)})`);
                        totalRemoved += result.deletedCount;
                    }
                } catch (error) {
                    // Ignorer les erreurs de pattern invalides pour MongoDB
                }
            }

            if (totalRemoved > 0) {
                this.cleanupStats.objectsRemoved += totalRemoved;
                this.cleanupStats.mongoCollectionsCleaned++;
            } else {
                console.log(`   ✓ Aucun objet test trouvé`);
            }

        } catch (error) {
            console.error(`   ❌ Erreur collection ${collectionName}:`, error.message);
            this.cleanupStats.errors++;
        }
    }

    // Vérification finale
    async verifyCleanup() {
        console.log('\n🔍 VÉRIFICATION FINALE');
        console.log('-'.repeat(50));

        const testValues = ['594939', '999999', '123456', '"test"', 'isTest', 'debug'];
        let remainingIssues = 0;

        for (const testValue of testValues) {
            const foundFiles = await this.searchForTestValue(testValue);
            if (foundFiles.length > 0) {
                console.log(`⚠️ "${testValue}" encore trouvé dans:`);
                foundFiles.forEach(file => console.log(`   - ${file}`));
                remainingIssues += foundFiles.length;
            }
        }

        if (remainingIssues === 0) {
            console.log('✅ Aucun objet test résiduel détecté');
        } else {
            console.log(`⚠️ ${remainingIssues} références test potentielles restantes`);
        }
    }

    async searchForTestValue(value) {
        const foundFiles = [];
        const searchDirs = [this.dataDir];

        for (const dir of searchDirs) {
            if (fs.existsSync(dir)) {
                await this.searchInDirectory(dir, value, foundFiles);
            }
        }

        return foundFiles;
    }

    async searchInDirectory(dir, value, foundFiles) {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const itemPath = path.join(dir, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory() && !item.includes('node_modules')) {
                await this.searchInDirectory(itemPath, value, foundFiles);
            } else if (item.endsWith('.json') && !item.includes('backup')) {
                try {
                    const content = fs.readFileSync(itemPath, 'utf8');
                    if (content.includes(value)) {
                        foundFiles.push(path.relative(this.dataDir, itemPath));
                    }
                } catch (error) {
                    // Ignorer les erreurs de lecture
                }
            }
        }
    }

    // Rapport final
    printFinalReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 RAPPORT FINAL DE NETTOYAGE');
        console.log('='.repeat(60));
        console.log(`📁 Fichiers traités: ${this.cleanupStats.filesProcessed}`);
        console.log(`🗑️ Objets test supprimés: ${this.cleanupStats.objectsRemoved}`);
        console.log(`💾 Sauvegardes traitées: ${this.cleanupStats.backupsProcessed}`);
        console.log(`🍃 Collections MongoDB nettoyées: ${this.cleanupStats.mongoCollectionsCleaned}`);
        console.log(`❌ Erreurs rencontrées: ${this.cleanupStats.errors}`);
        
        if (this.cleanupStats.errors === 0) {
            console.log('\n🎉 NETTOYAGE TERMINÉ AVEC SUCCÈS !');
        } else {
            console.log('\n⚠️ Nettoyage terminé avec quelques erreurs. Vérifiez les logs ci-dessus.');
        }
    }
}

// Fonction principale
async function main() {
    const cleaner = new FinalTestObjectCleaner();
    
    try {
        await cleaner.runCompleteCleanup();
        process.exit(cleaner.cleanupStats.errors === 0 ? 0 : 1);
    } catch (error) {
        console.error('❌ Erreur critique:', error);
        process.exit(1);
    }
}

// Exécution si appelé directement
if (require.main === module) {
    main();
}

module.exports = FinalTestObjectCleaner;