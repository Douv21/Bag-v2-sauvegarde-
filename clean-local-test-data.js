const fs = require('fs');
const path = require('path');

/**
 * Script de nettoyage des données de test dans les fichiers locaux
 * Supprime tous les objets test qui peuvent être restés dans les fichiers JSON
 */

class LocalTestDataCleaner {
    constructor() {
        this.dataDir = './data';
        this.backupDir = './data/backup';
        this.dataFiles = [
            'economy.json',
            'confessions.json',
            'counting.json',
            'autothread.json',
            'shop.json',
            'karma_config.json',
            'message_rewards.json'
        ];
    }

    async cleanAllFiles() {
        console.log('🧹 Nettoyage des données test locales...');
        let totalCleaned = 0;

        for (const filename of this.dataFiles) {
            const filePath = path.join(this.dataDir, filename);
            const cleaned = await this.cleanFile(filePath);
            totalCleaned += cleaned;
        }

        // Nettoyer aussi les fichiers de sauvegarde
        if (fs.existsSync(this.backupDir)) {
            const backupFiles = fs.readdirSync(this.backupDir);
            for (const backupFile of backupFiles) {
                if (backupFile.endsWith('.json')) {
                    const backupPath = path.join(this.backupDir, backupFile);
                    const cleaned = await this.cleanFile(backupPath);
                    totalCleaned += cleaned;
                }
            }
        }

        console.log(`🎉 Nettoyage terminé: ${totalCleaned} objets test supprimés au total`);
        return totalCleaned;
    }

    async cleanFile(filePath) {
        if (!fs.existsSync(filePath)) {
            return 0;
        }

        try {
            console.log(`🔍 Vérification: ${filePath}`);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            let cleaned = 0;
            let modified = false;

            // Nettoyer selon la structure du fichier
            if (typeof data === 'object' && data !== null) {
                cleaned += this.cleanObjectRecursively(data);
                if (cleaned > 0) {
                    modified = true;
                }
            }

            if (modified) {
                // Créer une sauvegarde avant modification
                const backupPath = `${filePath}.backup.${Date.now()}`;
                fs.copyFileSync(filePath, backupPath);
                console.log(`  💾 Sauvegarde créée: ${backupPath}`);

                // Sauvegarder le fichier nettoyé
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                console.log(`  ✅ ${cleaned} objets test supprimés de ${path.basename(filePath)}`);
            }

            return cleaned;
        } catch (error) {
            console.error(`  ❌ Erreur lors du nettoyage de ${filePath}:`, error.message);
            return 0;
        }
    }

    cleanObjectRecursively(obj) {
        let cleaned = 0;

        if (Array.isArray(obj)) {
            // Pour les tableaux, filtrer les objets test
            for (let i = obj.length - 1; i >= 0; i--) {
                if (this.isTestObject(obj[i])) {
                    obj.splice(i, 1);
                    cleaned++;
                } else if (typeof obj[i] === 'object' && obj[i] !== null) {
                    cleaned += this.cleanObjectRecursively(obj[i]);
                }
            }
        } else if (typeof obj === 'object' && obj !== null) {
            // Pour les objets, nettoyer les propriétés
            const keysToDelete = [];
            
            for (const [key, value] of Object.entries(obj)) {
                // Supprimer les clés qui sont des IDs de test
                if (this.isTestKey(key)) {
                    keysToDelete.push(key);
                    cleaned++;
                } else if (this.isTestObject(value)) {
                    keysToDelete.push(key);
                    cleaned++;
                } else if (typeof value === 'object' && value !== null) {
                    cleaned += this.cleanObjectRecursively(value);
                }
            }

            // Supprimer les clés identifiées
            keysToDelete.forEach(key => delete obj[key]);
        }

        return cleaned;
    }

    isTestObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        // Vérifier différents patterns d'objets test
        return (
            obj.test === true ||
            obj.isTest === true ||
            (typeof obj.name === 'string' && obj.name.toLowerCase().includes('test')) ||
            (typeof obj.id === 'string' && (
                obj.id.includes('test') || 
                obj.id === '999999999999999999' ||
                obj.id === '888888888888888888'
            )) ||
            (typeof obj.userId === 'string' && (
                obj.userId === '999999999999999999' ||
                obj.userId.includes('test')
            )) ||
            (typeof obj.guildId === 'string' && (
                obj.guildId === '888888888888888888' ||
                obj.guildId.includes('test')
            )) ||
            (obj.description && typeof obj.description === 'string' && 
             obj.description.toLowerCase().includes('test'))
        );
    }

    isTestKey(key) {
        if (typeof key !== 'string') {
            return false;
        }

        return (
            key.includes('test') ||
            key === '999999999999999999' ||
            key === '888888888888888888'
        );
    }

    async listTestObjects() {
        console.log('🔍 Recherche d\'objets test dans les fichiers locaux...');
        let totalFound = 0;

        for (const filename of this.dataFiles) {
            const filePath = path.join(this.dataDir, filename);
            const found = await this.countTestObjectsInFile(filePath);
            totalFound += found;
        }

        if (totalFound === 0) {
            console.log('✅ Aucun objet test trouvé dans les fichiers locaux');
        } else {
            console.log(`⚠️ Total: ${totalFound} objets test trouvés dans les fichiers locaux`);
        }

        return totalFound;
    }

    async countTestObjectsInFile(filePath) {
        if (!fs.existsSync(filePath)) {
            return 0;
        }

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const count = this.countTestObjectsRecursively(data);
            
            if (count > 0) {
                console.log(`📋 ${path.basename(filePath)}: ${count} objets test trouvés`);
            }
            
            return count;
        } catch (error) {
            console.error(`❌ Erreur lors de la lecture de ${filePath}:`, error.message);
            return 0;
        }
    }

    countTestObjectsRecursively(obj) {
        let count = 0;

        if (Array.isArray(obj)) {
            for (const item of obj) {
                if (this.isTestObject(item)) {
                    count++;
                } else if (typeof item === 'object' && item !== null) {
                    count += this.countTestObjectsRecursively(item);
                }
            }
        } else if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
                if (this.isTestKey(key) || this.isTestObject(value)) {
                    count++;
                } else if (typeof value === 'object' && value !== null) {
                    count += this.countTestObjectsRecursively(value);
                }
            }
        }

        return count;
    }
}

async function main() {
    const cleaner = new LocalTestDataCleaner();
    
    // Vérifier les arguments de ligne de commande
    const action = process.argv[2] || 'clean';

    try {
        if (action === 'list') {
            await cleaner.listTestObjects();
        } else if (action === 'clean') {
            await cleaner.listTestObjects();
            console.log('\n🧹 Démarrage du nettoyage...');
            await cleaner.cleanAllFiles();
        } else {
            console.log('Usage: node clean-local-test-data.js [list|clean]');
            console.log('  list  - Lister les objets test sans les supprimer');
            console.log('  clean - Nettoyer tous les objets test (défaut)');
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

module.exports = LocalTestDataCleaner;