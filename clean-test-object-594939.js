const fs = require('fs');
const path = require('path');

/**
 * Script de nettoyage spécialisé pour supprimer l'objet test de 594939 euros
 * de tous les fichiers de sauvegarde
 */

class TestObject594939Cleaner {
    constructor() {
        this.targetPrice = 594939;
        this.backupDir = path.join(__dirname, 'data/backups');
        this.dataDir = path.join(__dirname, 'data');
        this.filesProcessed = 0;
        this.objectsRemoved = 0;
    }

    async cleanAllFiles() {
        console.log('🧹 Démarrage du nettoyage de l\'objet test 594939 euros...');
        
        // Nettoyer les fichiers de sauvegarde
        await this.cleanBackupFiles();
        
        // Nettoyer les fichiers principaux
        await this.cleanMainDataFiles();
        
        console.log(`✅ Nettoyage terminé:`);
        console.log(`   - Fichiers traités: ${this.filesProcessed}`);
        console.log(`   - Objets supprimés: ${this.objectsRemoved}`);
    }

    async cleanBackupFiles() {
        console.log('🔍 Nettoyage des fichiers de sauvegarde...');
        
        if (!fs.existsSync(this.backupDir)) {
            console.log('⚠️ Répertoire backups non trouvé');
            return;
        }

        const files = fs.readdirSync(this.backupDir);
        
        for (const file of files) {
            if (file.includes('.backup') || file.includes('.json')) {
                const filePath = path.join(this.backupDir, file);
                await this.cleanFile(filePath);
            }
        }
    }

    async cleanMainDataFiles() {
        console.log('🔍 Nettoyage des fichiers principaux...');
        
        const dataFiles = [
            'shop.json',
            'shop.json.backup.1754254862483',
            'shop.json.backup.1754254862483.backup-before-clean-1754255399247'
        ];

        for (const file of dataFiles) {
            const filePath = path.join(this.dataDir, file);
            if (fs.existsSync(filePath)) {
                await this.cleanFile(filePath);
            }
        }
    }

    async cleanFile(filePath) {
        try {
            console.log(`📄 Traitement: ${path.basename(filePath)}`);
            
            const content = fs.readFileSync(filePath, 'utf8');
            let data;
            
            try {
                data = JSON.parse(content);
            } catch (parseError) {
                console.log(`   ⚠️ Fichier non JSON, ignoré`);
                return;
            }

            let modified = false;
            let removedCount = 0;

            // Fonction récursive pour nettoyer tous les objets avec price: 594939
            const cleanObject = (obj) => {
                if (Array.isArray(obj)) {
                    for (let i = obj.length - 1; i >= 0; i--) {
                        if (obj[i] && typeof obj[i] === 'object') {
                            if (obj[i].price === this.targetPrice) {
                                console.log(`   🗑️ Suppression objet: ${JSON.stringify(obj[i]).substring(0, 100)}...`);
                                obj.splice(i, 1);
                                removedCount++;
                                modified = true;
                            } else {
                                cleanObject(obj[i]);
                            }
                        }
                    }
                } else if (obj && typeof obj === 'object') {
                    for (const key in obj) {
                        if (obj[key] && typeof obj[key] === 'object') {
                            if (obj[key].price === this.targetPrice) {
                                console.log(`   🗑️ Suppression objet clé '${key}': ${JSON.stringify(obj[key]).substring(0, 100)}...`);
                                delete obj[key];
                                removedCount++;
                                modified = true;
                            } else {
                                cleanObject(obj[key]);
                            }
                        }
                    }
                }
            };

            cleanObject(data);

            if (modified) {
                // Créer une sauvegarde avant modification
                const backupPath = `${filePath}.cleaned-${Date.now()}.backup`;
                fs.writeFileSync(backupPath, content);
                console.log(`   💾 Sauvegarde créée: ${path.basename(backupPath)}`);
                
                // Écrire le fichier nettoyé
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                console.log(`   ✅ ${removedCount} objets supprimés`);
                
                this.objectsRemoved += removedCount;
            } else {
                console.log(`   ✓ Aucun objet test trouvé`);
            }

            this.filesProcessed++;

        } catch (error) {
            console.error(`   ❌ Erreur traitement ${path.basename(filePath)}:`, error.message);
        }
    }

    async verifyCleanup() {
        console.log('\n🔍 Vérification du nettoyage...');
        
        const allFiles = [];
        
        // Collecter tous les fichiers à vérifier
        if (fs.existsSync(this.backupDir)) {
            const backupFiles = fs.readdirSync(this.backupDir)
                .filter(f => f.includes('.json') || f.includes('.backup'))
                .map(f => path.join(this.backupDir, f));
            allFiles.push(...backupFiles);
        }

        const dataFiles = [
            'shop.json',
            'shop.json.backup.1754254862483',
            'shop.json.backup.1754254862483.backup-before-clean-1754255399247'
        ].map(f => path.join(this.dataDir, f))
         .filter(f => fs.existsSync(f));
        
        allFiles.push(...dataFiles);

        let foundObjects = 0;

        for (const filePath of allFiles) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.includes(this.targetPrice.toString())) {
                    console.log(`⚠️ Objet test encore présent dans: ${path.basename(filePath)}`);
                    foundObjects++;
                }
            } catch (error) {
                // Ignorer les erreurs de lecture
            }
        }

        if (foundObjects === 0) {
            console.log('✅ Aucun objet test 594939 trouvé - Nettoyage réussi !');
        } else {
            console.log(`❌ ${foundObjects} fichiers contiennent encore l'objet test`);
        }

        return foundObjects === 0;
    }
}

async function main() {
    const cleaner = new TestObject594939Cleaner();
    
    try {
        await cleaner.cleanAllFiles();
        await cleaner.verifyCleanup();
    } catch (error) {
        console.error('❌ Erreur critique:', error);
        process.exit(1);
    }
}

// Exécution
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Erreur critique:', error);
        process.exit(1);
    });
}

module.exports = TestObject594939Cleaner;