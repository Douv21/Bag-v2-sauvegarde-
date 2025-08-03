const mongoBackup = require('./mongoBackupManager');
const robustBackup = require('./robustBackupManager');
const dataValidator = require('./dataValidator');

class UnifiedBackupManager {
    constructor() {
        this.mongoAvailable = false;
        this.initialized = false;
        this.backupStrategy = 'robust'; // 'mongo', 'robust', 'hybrid'
        
        this.init();
    }

    async init() {
        try {
            console.log('🔄 Initialisation du système de sauvegarde unifié...');
            
            // Vérifier la disponibilité de MongoDB
            this.mongoAvailable = await this.checkMongoAvailability();
            
            // Déterminer la stratégie de sauvegarde
            if (this.mongoAvailable) {
                this.backupStrategy = 'hybrid'; // MongoDB + Backup local
                console.log('✅ Stratégie: Hybride (MongoDB + Sauvegarde locale)');
            } else {
                this.backupStrategy = 'robust'; // Sauvegarde locale uniquement
                console.log('📁 Stratégie: Sauvegarde locale robuste uniquement');
            }
            
            // Vérifier l'intégrité des données au démarrage
            await this.performStartupCheck();
            
            this.initialized = true;
            console.log('✅ Système de sauvegarde unifié initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation système de sauvegarde:', error);
            this.backupStrategy = 'robust'; // Fallback vers sauvegarde locale
            this.initialized = true;
        }
    }

    async checkMongoAvailability() {
        try {
            // Vérifier les variables d'environnement
            const hasCredentials = process.env.MONGODB_USERNAME && 
                                 process.env.MONGODB_PASSWORD && 
                                 process.env.MONGODB_CLUSTER_URL;
            
            if (!hasCredentials) {
                console.log('⚠️ Variables MongoDB manquantes - utilisation locale uniquement');
                return false;
            }
            
            // Tenter une connexion
            const connected = await mongoBackup.connect();
            if (connected) {
                console.log('✅ MongoDB disponible');
                return true;
            } else {
                console.log('❌ MongoDB indisponible');
                return false;
            }
            
        } catch (error) {
            console.log('❌ Erreur vérification MongoDB:', error.message);
            return false;
        }
    }

    async performStartupCheck() {
        try {
            console.log('🔍 Vérification intégrité au démarrage...');
            
            const healthReport = await dataValidator.generateHealthReport();
            
            if (healthReport.status === 'ISSUES_DETECTED') {
                console.log('⚠️ Problèmes détectés dans les données');
                
                // Tenter une réparation automatique
                const repairResult = await dataValidator.autoRepair();
                if (repairResult.success) {
                    console.log(`✅ ${repairResult.repaired} fichiers réparés automatiquement`);
                }
                
                // Si des problèmes persistent, tenter une restauration
                if (healthReport.summary.invalid > 0 || healthReport.summary.missing > 0) {
                    await this.attemptDataRecovery();
                }
            } else {
                console.log('✅ Données intègres au démarrage');
            }
            
        } catch (error) {
            console.error('❌ Erreur vérification démarrage:', error);
        }
    }

    async attemptDataRecovery() {
        try {
            console.log('🔄 Tentative de récupération des données...');
            
            // 1. Essayer de restaurer depuis MongoDB si disponible
            if (this.mongoAvailable) {
                console.log('📥 Tentative restauration MongoDB...');
                const mongoRestore = await mongoBackup.restoreFromMongo();
                if (mongoRestore.success) {
                    console.log('✅ Données restaurées depuis MongoDB');
                    return true;
                }
            }
            
            // 2. Essayer de restaurer depuis la sauvegarde locale la plus récente
            console.log('📥 Tentative restauration sauvegarde locale...');
            const backups = await robustBackup.listBackups();
            if (backups.length > 0) {
                const restoreResult = await robustBackup.restoreFromBackup();
                if (restoreResult.success) {
                    console.log('✅ Données restaurées depuis sauvegarde locale');
                    return true;
                }
            }
            
            // 3. Créer des données par défaut en dernier recours
            console.log('🔧 Création de données par défaut...');
            const repairResult = await dataValidator.autoRepair();
            if (repairResult.success) {
                console.log('✅ Données par défaut créées');
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Erreur récupération données:', error);
            return false;
        }
    }

    // Sauvegarde selon la stratégie définie
    async performBackup(force = false) {
        try {
            if (!this.initialized && !force) {
                console.log('⚠️ Système non initialisé - sauvegarde ignorée');
                return { success: false, reason: 'System not initialized' };
            }

            console.log(`💾 Sauvegarde ${this.backupStrategy}...`);
            
            const results = {
                strategy: this.backupStrategy,
                mongo: null,
                local: null,
                success: false
            };

            switch (this.backupStrategy) {
                case 'mongo':
                    results.mongo = await mongoBackup.backupToMongo();
                    results.success = results.mongo?.success || false;
                    break;
                    
                case 'robust':
                    results.local = await robustBackup.createFullBackup();
                    results.success = results.local?.success || false;
                    break;
                    
                case 'hybrid':
                    // Sauvegarder sur les deux systèmes
                    results.local = await robustBackup.createFullBackup();
                    results.mongo = await mongoBackup.backupToMongo();
                    results.success = results.local?.success || results.mongo?.success || false;
                    
                    if (results.local?.success && results.mongo?.success) {
                        console.log('✅ Sauvegarde hybride complète réussie');
                    } else if (results.local?.success) {
                        console.log('✅ Sauvegarde locale réussie (MongoDB échoué)');
                    } else if (results.mongo?.success) {
                        console.log('✅ Sauvegarde MongoDB réussie (locale échouée)');
                    }
                    break;
            }

            if (results.success) {
                console.log(`✅ Sauvegarde ${this.backupStrategy} terminée`);
            } else {
                console.log(`❌ Échec sauvegarde ${this.backupStrategy}`);
            }

            return results;
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde unifiée:', error);
            return { success: false, error: error.message };
        }
    }

    // Restauration intelligente avec priorités
    async performRestore(source = 'auto') {
        try {
            console.log(`📥 Restauration depuis source: ${source}`);
            
            if (source === 'auto') {
                // Essayer MongoDB en premier si disponible
                if (this.mongoAvailable) {
                    const mongoResult = await mongoBackup.restoreFromMongo();
                    if (mongoResult.success) {
                        console.log('✅ Restauration MongoDB réussie');
                        return mongoResult;
                    }
                }
                
                // Fallback vers sauvegarde locale
                const localResult = await robustBackup.restoreFromBackup();
                if (localResult.success) {
                    console.log('✅ Restauration locale réussie');
                    return localResult;
                }
                
                throw new Error('Aucune source de restauration disponible');
                
            } else if (source === 'mongo') {
                return await mongoBackup.restoreFromMongo();
            } else if (source === 'local') {
                return await robustBackup.restoreFromBackup();
            }
            
        } catch (error) {
            console.error('❌ Erreur restauration:', error);
            return { success: false, error: error.message };
        }
    }

    // Sauvegarde d'urgence prioritaire
    async emergencyBackup() {
        try {
            console.log('🚨 SAUVEGARDE D\'URGENCE DÉCLENCHÉE');
            
            const results = {
                emergency: null,
                mongo: null,
                success: false
            };

            // 1. Sauvegarde d'urgence locale (rapide)
            results.emergency = await robustBackup.emergencyBackup();
            
            // 2. Tentative MongoDB si disponible (peut être lent)
            if (this.mongoAvailable) {
                try {
                    results.mongo = await mongoBackup.backupToMongo();
                } catch (error) {
                    console.log('⚠️ Sauvegarde MongoDB d\'urgence échouée:', error.message);
                }
            }
            
            results.success = results.emergency?.success || results.mongo?.success || false;
            
            if (results.success) {
                console.log('✅ Sauvegarde d\'urgence réussie');
            } else {
                console.log('❌ Échec sauvegarde d\'urgence');
            }
            
            return results;
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde d\'urgence:', error);
            return { success: false, error: error.message };
        }
    }

    // Rapport de statut complet
    async getSystemStatus() {
        try {
            const status = {
                timestamp: new Date().toISOString(),
                initialized: this.initialized,
                strategy: this.backupStrategy,
                mongo: {
                    available: this.mongoAvailable,
                    connected: this.mongoAvailable ? await mongoBackup.connect() : false
                },
                data: await dataValidator.generateHealthReport(),
                backups: {
                    local: await robustBackup.listBackups()
                }
            };
            
            // Vérifier les sauvegardes MongoDB si disponible
            if (this.mongoAvailable) {
                try {
                    status.mongo.integrity = await mongoBackup.verifyBackupIntegrity();
                } catch (error) {
                    status.mongo.error = error.message;
                }
            }
            
            return status;
            
        } catch (error) {
            return {
                timestamp: new Date().toISOString(),
                error: error.message,
                status: 'ERROR'
            };
        }
    }

    // Démarrer la sauvegarde automatique
    startAutoBackup(intervalMinutes = 30) {
        console.log(`🕐 Système de sauvegarde automatique unifié démarré (${intervalMinutes} min)`);
        
        // Sauvegarde immédiate
        setTimeout(() => this.performBackup(), 10000);
        
        // Sauvegarde périodique
        setInterval(async () => {
            await this.performBackup();
        }, intervalMinutes * 60 * 1000);
        
        // Vérification quotidienne
        setInterval(async () => {
            const status = await this.getSystemStatus();
            if (status.data?.status === 'ISSUES_DETECTED') {
                console.log('⚠️ Problèmes détectés - sauvegarde d\'urgence');
                await this.emergencyBackup();
            }
        }, 24 * 60 * 60 * 1000);
        
        // Configuration des sauvegardes d'urgence
        this.setupEmergencyHandlers();
    }

    setupEmergencyHandlers() {
        const emergencyHandler = async () => {
            console.log('🚨 Signal d\'arrêt détecté - sauvegarde d\'urgence...');
            await this.emergencyBackup();
            process.exit(0);
        };

        process.on('SIGTERM', emergencyHandler);
        process.on('SIGINT', emergencyHandler);
        process.on('beforeExit', emergencyHandler);
    }
}

module.exports = new UnifiedBackupManager();