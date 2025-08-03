const fs = require('fs').promises;
const path = require('path');

class DataValidator {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        
        // Schémas de validation pour chaque type de fichier
        this.schemas = {
            'economy.json': {
                type: 'object',
                requiredFields: [],
                validation: (data) => {
                    // Vérifier que c'est un objet avec des IDs utilisateur comme clés
                    for (const [userId, userData] of Object.entries(data)) {
                        if (!userData.hasOwnProperty('money') || typeof userData.money !== 'number') {
                            return { valid: false, error: `Utilisateur ${userId}: champ 'money' invalide` };
                        }
                    }
                    return { valid: true };
                }
            },
            
            'users.json': {
                type: 'object',
                requiredFields: [],
                validation: (data) => {
                    for (const [userId, userData] of Object.entries(data)) {
                        if (!userData.hasOwnProperty('username') || typeof userData.username !== 'string') {
                            return { valid: false, error: `Utilisateur ${userId}: champ 'username' manquant` };
                        }
                    }
                    return { valid: true };
                }
            },
            
            'level_users.json': {
                type: 'object',
                requiredFields: [],
                validation: (data) => {
                    for (const [userId, userData] of Object.entries(data)) {
                        if (!userData.hasOwnProperty('level') || typeof userData.level !== 'number') {
                            return { valid: false, error: `Utilisateur ${userId}: champ 'level' invalide` };
                        }
                        if (!userData.hasOwnProperty('xp') || typeof userData.xp !== 'number') {
                            return { valid: false, error: `Utilisateur ${userId}: champ 'xp' invalide` };
                        }
                    }
                    return { valid: true };
                }
            },
            
            'confessions.json': {
                type: 'object',
                requiredFields: ['count'],
                validation: (data) => {
                    if (typeof data.count !== 'number') {
                        return { valid: false, error: 'Champ count doit être un nombre' };
                    }
                    return { valid: true };
                }
            },
            
            'shop.json': {
                type: 'object',
                requiredFields: [],
                validation: (data) => {
                    for (const [itemId, itemData] of Object.entries(data)) {
                        if (!itemData.hasOwnProperty('name') || typeof itemData.name !== 'string') {
                            return { valid: false, error: `Article ${itemId}: champ 'name' manquant` };
                        }
                        if (!itemData.hasOwnProperty('price') || typeof itemData.price !== 'number') {
                            return { valid: false, error: `Article ${itemId}: champ 'price' invalide` };
                        }
                    }
                    return { valid: true };
                }
            },
            
            'config.json': {
                type: 'object',
                requiredFields: ['prefix'],
                validation: (data) => {
                    if (typeof data.prefix !== 'string') {
                        return { valid: false, error: 'Le prefix doit être une chaîne' };
                    }
                    return { valid: true };
                }
            }
        };
    }

    // Valider un fichier spécifique
    async validateFile(filename) {
        try {
            const filePath = path.join(this.dataDir, filename);
            const data = await fs.readFile(filePath, 'utf8');
            const jsonData = JSON.parse(data);
            
            // Vérifications de base
            const basicChecks = {
                exists: true,
                parseable: true,
                empty: Object.keys(jsonData).length === 0,
                size: Buffer.byteLength(data, 'utf8')
            };
            
            // Validation spécifique selon le schéma
            const schema = this.schemas[filename];
            let schemaValidation = { valid: true };
            
            if (schema) {
                // Vérifier le type
                if (schema.type === 'object' && typeof jsonData !== 'object') {
                    schemaValidation = { valid: false, error: `Type attendu: ${schema.type}` };
                }
                
                // Vérifier les champs requis
                if (schemaValidation.valid && schema.requiredFields) {
                    for (const field of schema.requiredFields) {
                        if (!jsonData.hasOwnProperty(field)) {
                            schemaValidation = { valid: false, error: `Champ requis manquant: ${field}` };
                            break;
                        }
                    }
                }
                
                // Validation personnalisée
                if (schemaValidation.valid && schema.validation) {
                    schemaValidation = schema.validation(jsonData);
                }
            }
            
            return {
                filename,
                ...basicChecks,
                schema: schemaValidation,
                recordCount: Array.isArray(jsonData) ? jsonData.length : Object.keys(jsonData).length,
                valid: schemaValidation.valid && !basicChecks.empty
            };
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                return {
                    filename,
                    exists: false,
                    parseable: false,
                    empty: true,
                    valid: false,
                    error: 'Fichier non trouvé'
                };
            } else if (error instanceof SyntaxError) {
                return {
                    filename,
                    exists: true,
                    parseable: false,
                    empty: true,
                    valid: false,
                    error: 'JSON invalide: ' + error.message
                };
            } else {
                return {
                    filename,
                    exists: true,
                    parseable: false,
                    empty: true,
                    valid: false,
                    error: error.message
                };
            }
        }
    }

    // Valider tous les fichiers de données
    async validateAllData() {
        try {
            console.log('🔍 Validation complète des données en cours...');
            
            // Découvrir tous les fichiers JSON
            const files = await fs.readdir(this.dataDir);
            const jsonFiles = files.filter(file => 
                file.endsWith('.json') && 
                !file.startsWith('.') &&
                file !== 'package.json' &&
                file !== 'package-lock.json'
            );
            
            const results = {
                totalFiles: jsonFiles.length,
                validFiles: [],
                invalidFiles: [],
                emptyFiles: [],
                missingFiles: [],
                summary: {
                    valid: 0,
                    invalid: 0,
                    empty: 0,
                    missing: 0
                }
            };
            
            // Valider chaque fichier
            for (const filename of jsonFiles) {
                const validation = await this.validateFile(filename);
                
                if (!validation.exists) {
                    results.missingFiles.push(validation);
                    results.summary.missing++;
                } else if (validation.empty) {
                    results.emptyFiles.push(validation);
                    results.summary.empty++;
                } else if (validation.valid) {
                    results.validFiles.push(validation);
                    results.summary.valid++;
                } else {
                    results.invalidFiles.push(validation);
                    results.summary.invalid++;
                }
            }
            
            // Afficher le rapport
            console.log(`📊 Rapport de validation:`);
            console.log(`   ✅ ${results.summary.valid} fichiers valides`);
            console.log(`   ❌ ${results.summary.invalid} fichiers invalides`);
            console.log(`   📭 ${results.summary.empty} fichiers vides`);
            console.log(`   🚫 ${results.summary.missing} fichiers manquants`);
            
            // Détailler les problèmes
            if (results.invalidFiles.length > 0) {
                console.log(`\n❌ Fichiers avec erreurs:`);
                for (const file of results.invalidFiles) {
                    console.log(`   ${file.filename}: ${file.error || file.schema?.error || 'Erreur inconnue'}`);
                }
            }
            
            if (results.emptyFiles.length > 0) {
                console.log(`\n📭 Fichiers vides:`);
                for (const file of results.emptyFiles) {
                    console.log(`   ${file.filename}`);
                }
            }
            
            return results;
            
        } catch (error) {
            console.error('❌ Erreur validation globale:', error);
            return { error: error.message };
        }
    }

    // Réparer automatiquement les fichiers corrompus
    async autoRepair() {
        try {
            console.log('🔧 Réparation automatique des données...');
            
            const validationResults = await this.validateAllData();
            let repairCount = 0;
            
            // Réparer les fichiers vides en créant des structures par défaut
            for (const file of validationResults.emptyFiles) {
                if (file.exists && file.filename !== 'error_logs.json') {
                    const defaultData = this.getDefaultData(file.filename);
                    if (defaultData) {
                        const filePath = path.join(this.dataDir, file.filename);
                        await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
                        console.log(`🔧 ${file.filename} réparé avec données par défaut`);
                        repairCount++;
                    }
                }
            }
            
            // Créer les fichiers manquants critiques
            const criticalFiles = ['economy.json', 'users.json', 'level_users.json', 'config.json'];
            for (const filename of criticalFiles) {
                const missing = validationResults.missingFiles.find(f => f.filename === filename);
                if (missing) {
                    const defaultData = this.getDefaultData(filename);
                    const filePath = path.join(this.dataDir, filename);
                    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
                    console.log(`🔧 ${filename} créé avec données par défaut`);
                    repairCount++;
                }
            }
            
            console.log(`✅ Réparation terminée: ${repairCount} fichiers réparés`);
            return { success: true, repaired: repairCount };
            
        } catch (error) {
            console.error('❌ Erreur réparation:', error);
            return { success: false, error: error.message };
        }
    }

    // Obtenir les données par défaut pour un fichier
    getDefaultData(filename) {
        const defaults = {
            'economy.json': {},
            'users.json': {},
            'level_users.json': {},
            'user_stats.json': {},
            'confessions.json': { count: 0 },
            'counting.json': { number: 0, user: null },
            'autothread.json': { enabled: false },
            'shop.json': {},
            'karma_config.json': { enabled: true, basePoints: 1 },
            'karma_discounts.json': {},
            'daily.json': { enabled: true, amount: 100 },
            'message_rewards.json': { enabled: true, baseXp: 15 },
            'actions.json': [],
            'config.json': { prefix: '!', version: '2.0.0' },
            'daily_cooldowns.json': {},
            'message_cooldowns.json': {},
            'cooldowns.json': {},
            'staff_config.json': { admins: [], moderators: [] },
            'level_config.json': { 
                enabled: true,
                baseXp: 100,
                multiplier: 1.5,
                maxLevel: 100 
            }
        };
        
        return defaults[filename] || {};
    }

    // Créer un rapport détaillé de santé des données
    async generateHealthReport() {
        try {
            const validation = await this.validateAllData();
            const timestamp = new Date().toISOString();
            
            const report = {
                timestamp,
                version: '2.0.0',
                status: validation.summary.invalid === 0 ? 'HEALTHY' : 'ISSUES_DETECTED',
                summary: validation.summary,
                details: {
                    validFiles: validation.validFiles.map(f => ({
                        name: f.filename,
                        size: f.size,
                        records: f.recordCount
                    })),
                    issues: [
                        ...validation.invalidFiles.map(f => ({
                            file: f.filename,
                        type: 'INVALID',
                        error: f.error || f.schema?.error
                    })),
                    ...validation.emptyFiles.map(f => ({
                        file: f.filename,
                        type: 'EMPTY'
                    })),
                    ...validation.missingFiles.map(f => ({
                        file: f.filename,
                        type: 'MISSING'
                    }))
                ]
            },
            recommendations: []
        };
        
        // Générer des recommandations
        if (validation.summary.invalid > 0) {
            report.recommendations.push('Exécuter la réparation automatique');
        }
        if (validation.summary.empty > 0) {
            report.recommendations.push('Restaurer depuis une sauvegarde ou initialiser les fichiers vides');
        }
        if (validation.summary.missing > 0) {
            report.recommendations.push('Créer les fichiers manquants avec des données par défaut');
        }
        
        return report;
        
    } catch (error) {
        return {
            timestamp: new Date().toISOString(),
            status: 'ERROR',
            error: error.message
        };
    }
}
}

module.exports = new DataValidator();