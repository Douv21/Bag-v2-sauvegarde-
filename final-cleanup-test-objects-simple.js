const fs = require('fs');
const path = require('path');

/**
 * Script de nettoyage définitif et complet de tous les objets test (version simple)
 * Nettoie les fichiers locaux et les sauvegardes
 */

class SimpleTestObjectCleaner {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.backupDir = path.join(this.dataDir, 'backups');
        
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
            { isTest: true },
            { debug: true }
        ];

        this.cleanupStats = {
            filesProcessed: 0,
            objectsRemoved: 0,
            backupsProcessed: 0,
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
            
            // 3. Vérification finale
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
                    console.log(`     🗑️ Suppression: ${JSON.stringify(obj[i]).substring(0, 80)}...`);
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
                    console.log(`     🗑️ Suppression clé '${key}': ${JSON.stringify(obj[key]).substring(0, 80)}...`);
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
                console.log(`📁 Nettoyage répertoire: ${item}`);
                await this.cleanBackupDirectory(itemPath);
            } else if (item.endsWith('.json') && !item.includes('cleaned') && !item.includes('backup')) {
                await this.cleanJsonFile(itemPath);
                this.cleanupStats.backupsProcessed++;
            }
        }
    }

    // Vérification finale
    async verifyCleanup() {
        console.log('\n🔍 VÉRIFICATION FINALE');
        console.log('-'.repeat(50));

        const testValues = ['594939', '999999', '123456'];
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
        console.log(`❌ Erreurs rencontrées: ${this.cleanupStats.errors}`);
        
        if (this.cleanupStats.errors === 0) {
            console.log('\n🎉 NETTOYAGE TERMINÉ AVEC SUCCÈS !');
            console.log('✨ Tous les objets test ont été supprimés du système local.');
            console.log('💡 Pour nettoyer MongoDB, utilisez le script clean-test-objects.js');
        } else {
            console.log('\n⚠️ Nettoyage terminé avec quelques erreurs. Vérifiez les logs ci-dessus.');
        }
    }
}

// Fonction principale
async function main() {
    const cleaner = new SimpleTestObjectCleaner();
    
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

module.exports = SimpleTestObjectCleaner;