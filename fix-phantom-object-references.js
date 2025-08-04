const fs = require('fs');
const path = require('path');

/**
 * Script de diagnostic et correction des références fantômes d'objets
 * Résout le problème "objet non trouvé" pour des objets supprimés
 */

class PhantomObjectFixer {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.problematicIds = ['1753602834934', '1753566340743']; // IDs d'objets test connus
        this.fixedIssues = [];
        this.checkedFiles = [];
    }

    async runDiagnostic() {
        console.log('🔍 DIAGNOSTIC DES RÉFÉRENCES FANTÔMES D\'OBJETS');
        console.log('='.repeat(60));

        try {
            // 1. Vérifier les fichiers de données principaux
            await this.checkMainDataFiles();
            
            // 2. Vérifier les sauvegardes pour des références
            await this.checkBackupFiles();
            
            // 3. Vérifier les logs pour des erreurs
            await this.checkLogFiles();
            
            // 4. Vérifier les fichiers temporaires
            await this.checkTempFiles();
            
            // 5. Générer le rapport
            this.generateReport();

        } catch (error) {
            console.error('❌ Erreur pendant le diagnostic:', error);
        }
    }

    async checkMainDataFiles() {
        console.log('\n📁 VÉRIFICATION DES FICHIERS PRINCIPAUX');
        console.log('-'.repeat(40));

        const mainFiles = [
            'economy.json',
            'users.json', 
            'shop.json',
            'actions.json',
            'level_users.json',
            'user_stats.json',
            'confessions.json'
        ];

        for (const filename of mainFiles) {
            const filePath = path.join(this.dataDir, filename);
            await this.checkFileForPhantomReferences(filePath, filename);
        }
    }

    async checkBackupFiles() {
        console.log('\n💾 VÉRIFICATION DES SAUVEGARDES');
        console.log('-'.repeat(40));

        try {
            const backupDir = path.join(this.dataDir, 'backups');
            if (fs.existsSync(backupDir)) {
                const backupFiles = fs.readdirSync(backupDir);
                for (const file of backupFiles) {
                    const filePath = path.join(backupDir, file);
                    if (path.extname(file) === '.json') {
                        await this.checkFileForPhantomReferences(filePath, `backups/${file}`);
                    }
                }
            }

            // Vérifier aussi les fichiers .backup dans le dossier principal
            const dataFiles = fs.readdirSync(this.dataDir);
            for (const file of dataFiles) {
                if (file.includes('.backup')) {
                    const filePath = path.join(this.dataDir, file);
                    await this.checkFileForPhantomReferences(filePath, file);
                }
            }
        } catch (error) {
            console.log('⚠️ Erreur lors de la vérification des sauvegardes:', error.message);
        }
    }

    async checkLogFiles() {
        console.log('\n📋 VÉRIFICATION DES LOGS');
        console.log('-'.repeat(40));

        const logFiles = ['app.log'];
        
        for (const filename of logFiles) {
            const filePath = path.join(__dirname, filename);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    let hasPhantomRefs = false;
                    
                    for (const id of this.problematicIds) {
                        if (content.includes(id)) {
                            hasPhantomRefs = true;
                            console.log(`⚠️ ${filename}: Référence trouvée pour ${id}`);
                        }
                    }
                    
                    if (!hasPhantomRefs) {
                        console.log(`✅ ${filename}: Aucune référence fantôme`);
                    }
                } catch (error) {
                    console.log(`❌ Erreur lecture ${filename}:`, error.message);
                }
            }
        }
    }

    async checkTempFiles() {
        console.log('\n🗂️ VÉRIFICATION DES FICHIERS TEMPORAIRES');
        console.log('-'.repeat(40));

        // Vérifier s'il existe des fichiers temporaires qui pourraient contenir des références
        const tempPatterns = ['.tmp', '.temp', '.cache'];
        
        try {
            const allFiles = this.getAllFiles(__dirname);
            for (const file of allFiles) {
                const filename = path.basename(file);
                if (tempPatterns.some(pattern => filename.includes(pattern))) {
                    await this.checkFileForPhantomReferences(file, filename);
                }
            }
        } catch (error) {
            console.log('⚠️ Erreur lors de la vérification des fichiers temporaires:', error.message);
        }
    }

    async checkFileForPhantomReferences(filePath, displayName) {
        if (!fs.existsSync(filePath)) {
            return;
        }

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            let hasIssues = false;

            for (const id of this.problematicIds) {
                if (content.includes(id)) {
                    console.log(`⚠️ ${displayName}: Référence fantôme trouvée pour ${id}`);
                    hasIssues = true;
                    
                    // Si c'est un fichier JSON de données actives, proposer la correction
                    if (displayName.includes('.json') && !displayName.includes('backup') && !displayName.includes('log')) {
                        this.fixedIssues.push({
                            file: displayName,
                            objectId: id,
                            needsManualReview: true
                        });
                    }
                }
            }

            if (!hasIssues) {
                console.log(`✅ ${displayName}: Propre`);
            }

            this.checkedFiles.push(displayName);

        } catch (error) {
            console.log(`❌ Erreur lecture ${displayName}:`, error.message);
        }
    }

    getAllFiles(dirPath, arrayOfFiles = []) {
        try {
            const files = fs.readdirSync(dirPath);

            files.forEach(file => {
                const fullPath = path.join(dirPath, file);
                if (fs.statSync(fullPath).isDirectory()) {
                    if (!file.startsWith('.') && file !== 'node_modules') {
                        arrayOfFiles = this.getAllFiles(fullPath, arrayOfFiles);
                    }
                } else {
                    arrayOfFiles.push(fullPath);
                }
            });

            return arrayOfFiles;
        } catch (error) {
            return arrayOfFiles;
        }
    }

    generateReport() {
        console.log('\n🎯 RAPPORT FINAL');
        console.log('='.repeat(60));
        
        console.log(`📁 Fichiers vérifiés: ${this.checkedFiles.length}`);
        console.log(`🔍 IDs problématiques recherchés: ${this.problematicIds.join(', ')}`);
        
        if (this.fixedIssues.length === 0) {
            console.log('✅ AUCUNE RÉFÉRENCE FANTÔME TROUVÉE');
            console.log('🎉 Le système est propre - l\'erreur "objet non trouvé" ne devrait plus se produire.');
        } else {
            console.log(`⚠️ ${this.fixedIssues.length} problème(s) détecté(s):`);
            this.fixedIssues.forEach(issue => {
                console.log(`   - ${issue.file}: ${issue.objectId}`);
            });
        }

        console.log('\n💡 PROCHAINES ÉTAPES RECOMMANDÉES:');
        console.log('1. Redémarrer le bot Discord pour vider le cache');
        console.log('2. Demander aux utilisateurs de fermer les menus d\'objets ouverts');
        console.log('3. Surveiller les logs pour de nouvelles erreurs');
        
        console.log('\n🛡️ PROTECTION FUTURE:');
        console.log('- Le gestionnaire d\'objets a été amélioré avec une validation renforcée');
        console.log('- Les erreurs "objet non trouvé" sont désormais gérées gracieusement');
    }

    // Méthode pour nettoyer un objet spécifique si trouvé
    async cleanSpecificObject(objectId) {
        console.log(`🧹 Nettoyage spécifique de l'objet ${objectId}...`);
        
        const economyPath = path.join(this.dataDir, 'economy.json');
        if (fs.existsSync(economyPath)) {
            try {
                const economyData = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
                let cleaned = false;

                // Parcourir tous les utilisateurs
                for (const userKey of Object.keys(economyData)) {
                    if (economyData[userKey].inventory) {
                        const originalLength = economyData[userKey].inventory.length;
                        economyData[userKey].inventory = economyData[userKey].inventory.filter(
                            item => item.id && item.id.toString() !== objectId
                        );
                        
                        if (economyData[userKey].inventory.length < originalLength) {
                            console.log(`✅ Objet ${objectId} supprimé de l'inventaire de ${userKey}`);
                            cleaned = true;
                        }
                    }
                }

                if (cleaned) {
                    // Créer une sauvegarde
                    const backupPath = `${economyPath}.backup.${Date.now()}`;
                    fs.copyFileSync(economyPath, backupPath);
                    
                    // Sauvegarder les données nettoyées
                    fs.writeFileSync(economyPath, JSON.stringify(economyData, null, 2));
                    console.log(`💾 Sauvegarde créée: ${path.basename(backupPath)}`);
                    console.log('✅ Nettoyage terminé');
                } else {
                    console.log('ℹ️ Objet non trouvé dans les données actuelles');
                }

            } catch (error) {
                console.error('❌ Erreur pendant le nettoyage:', error);
            }
        }
    }
}

// Exécution
if (require.main === module) {
    async function main() {
        const fixer = new PhantomObjectFixer();
        
        const args = process.argv.slice(2);
        if (args[0] === 'clean' && args[1]) {
            await fixer.cleanSpecificObject(args[1]);
        } else {
            await fixer.runDiagnostic();
        }
    }
    
    main().catch(console.error);
}

module.exports = PhantomObjectFixer;