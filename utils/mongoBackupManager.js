// Utilisation optionnelle de MongoDB - fallback si module indisponible
let MongoClient;
try {
    MongoClient = require('mongodb').MongoClient;
} catch (error) {
    console.log('📦 Module MongoDB non disponible - mode fichier local uniquement');
    MongoClient = null;
}
const simpleBackup = require('./simpleBackupManager');
const fs = require('fs').promises;
const path = require('path');

class MongoBackupManager {
    constructor() {
        this.client = null;
        this.db = null;
        this.connected = false;
        
        // Construction de la chaîne de connexion avec les nouvelles variables
        const username = process.env.MONGODB_USERNAME;
        const password = process.env.MONGODB_PASSWORD;
        let clusterUrl = process.env.MONGODB_CLUSTER_URL;
        
        // Nettoyer l'URL si elle contient déjà le format complet
        if (clusterUrl && clusterUrl.includes('mongodb+srv://')) {
            // Extraire juste le nom du cluster depuis l'URL complète
            const match = clusterUrl.match(/@([^\/\?]+)/);
            if (match) {
                clusterUrl = match[1];
            }
        }
        
        this.connectionString = password ? 
            `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${clusterUrl}/bagbot?retryWrites=true&w=majority&authSource=admin&readPreference=secondaryPreferred&maxPoolSize=20&serverSelectionTimeoutMS=5000&socketTimeoutMS=45000` : 
            null;
        
        // Debug de connexion
        if (!password) {
            console.log('🔑 MONGODB_PASSWORD non configuré - sauvegarde locale uniquement');
        } else if (!username) {
            console.log('🔑 MONGODB_USERNAME non configuré - sauvegarde locale uniquement');
        } else if (!clusterUrl) {
            console.log('🔑 MONGODB_CLUSTER_URL non configuré - sauvegarde locale uniquement');
        } else {
            console.log(`🔑 MongoDB configuré: ${username}@${clusterUrl} - MongoDB disponible`);
            console.log(`📡 String de connexion: mongodb+srv://${username}:***@${clusterUrl}/bagbot`);
        }
        
        // Mapping fichier -> collection individuelle pour une séparation claire
        this.fileCollectionMapping = {
            // Fichiers utilisateurs - collections séparées
            'users.json': 'backup_users_profiles',
            'user_stats.json': 'backup_user_statistics',
            'level_users.json': 'backup_user_levels',
            
            // Fichiers économie - collections séparées
            'economy.json': 'backup_economy_data',
            'shop.json': 'backup_shop_items',
            
            // Fichiers système - collections séparées
            'config.json': 'backup_main_config',
            'level_config.json': 'backup_level_system_config',
            'karma_config.json': 'backup_karma_system_config',
            'staff_config.json': 'backup_staff_configuration',
            
            // Fichiers fonctionnalités - collections séparées
            'confessions.json': 'backup_confessions_system',
            'counting.json': 'backup_counting_game',
            'autothread.json': 'backup_autothread_config',
            'actions.json': 'backup_actions_config',
            // Configurations AOUV
            'aouv_config.json': 'backup_aouv_config',
            
            // Fichiers temporels - collections séparées
            'daily.json': 'backup_daily_system',
            'cooldowns.json': 'backup_cooldowns_data',
            'daily_cooldowns.json': 'backup_daily_cooldowns',
            'message_cooldowns.json': 'backup_message_cooldowns',
            'message_rewards.json': 'backup_message_rewards',
            
            // Fichiers logs et erreurs - collections séparées
            'error_logs.json': 'backup_error_logs',
            'stability_reports.json': 'backup_stability_reports',
            'mobile_restart_alert.json': 'backup_mobile_alerts',
            'mobile_test.json': 'backup_mobile_test_data',
            
            // Fichiers objets - collections séparées
            'gifted_objects.json': 'backup_gifted_objects',
            'levels.json': 'backup_levels_data'
        };
        
        // Collections génériques (ancienne méthode pour compatibilité)
        this.collections = {
            users: 'users',
            economy: 'economy', 
            confessions: 'confessions',
            counting: 'counting',
            autothread: 'autothread',
            shop: 'shop',
            karma: 'karma',
            level_config: 'level_config',
            level_users: 'level_users',
            daily_config: 'daily_config',
            message_rewards: 'message_rewards',
            actions_config: 'actions_config',
            main_config: 'main_config',
            cooldowns: 'cooldowns',
            user_stats: 'user_stats',
            staff_config: 'staff_config'
        };

        this.localFiles = {
            // Données économiques et utilisateurs
            'economy.json': 'economy',
            'users.json': 'users',
            'user_stats.json': 'user_stats',
            
            // Configuration système de niveaux
            'level_config.json': 'level_config',
            'level_users.json': 'level_users',
            
            // Configuration systèmes principaux
            'confessions.json': 'confessions',
            'counting.json': 'counting',
            'autothread.json': 'autothread',
            'shop.json': 'shop',
            // AOUV
            'aouv_config.json': 'aouv_config',
            
            // Configuration karma et récompenses
            'karma_config.json': 'karma',
        'karma_discounts.json': 'karma',
            'daily.json': 'daily_config',
            'message_rewards.json': 'message_rewards',
            'actions.json': 'actions_config',
            
            // Configuration principale et cooldowns
            'config.json': 'main_config',
            'daily_cooldowns.json': 'cooldowns',
            'message_cooldowns.json': 'cooldowns',
            'cooldowns.json': 'cooldowns',
            
            // Configuration staff et administration
            'staff_config.json': 'staff_config',
            'karma_discounts.json': 'karma'
        };
    }

    async connect() {
        if (this.connected || !this.connectionString || !MongoClient) {
            return this.connected;
        }

        try {
            console.log('🔄 Connexion MongoDB pour sauvegarde...');
            this.client = new MongoClient(this.connectionString, {
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000,
                socketTimeoutMS: 15000,
                maxPoolSize: 10,
                retryWrites: true,
                authSource: 'admin'
            });
            
            await this.client.connect();
            
            // Test de connexion avec la base bagbot directement
            this.db = this.client.db('bagbot');
            await this.db.command({ ping: 1 });
            
            this.connected = true;
            console.log('✅ MongoDB connecté pour système de sauvegarde');
            return true;
        } catch (error) {
            console.log(`❌ MongoDB indisponible (${error.message}) - mode fichier local uniquement`);
            
            // Diagnostic détaillé de l'erreur
            if (error.message.includes('authentication failed')) {
                console.log('🔐 Problème d\'authentification détecté:');
                console.log('   - Vérifiez que l\'utilisateur existe dans MongoDB Atlas');
                console.log('   - Vérifiez les permissions "readWrite" sur la base "bagbot"');
                console.log('   - Vérifiez que le mot de passe est correct');
            } else if (error.message.includes('network')) {
                console.log('🌐 Problème de réseau détecté:');
                console.log('   - Vérifiez la connectivité Internet');
                console.log('   - Vérifiez les IP autorisées dans MongoDB Atlas (0.0.0.0/0 pour tous)');
            }
            
            this.connected = false;
            return false;
        }
    }

    async disconnect() {
        if (this.client && this.connected) {
            await this.client.close();
            this.connected = false;
            console.log('🔌 MongoDB déconnecté');
        }
    }

    // Scanner automatiquement tous les fichiers JSON du dossier data
    async scanAllDataFiles() {
        const dataDir = path.join(__dirname, '..', 'data');
        const allFiles = {};
        
        try {
            const fsPack = require('fs');
            
            // Scanner récursivement le dossier data
            const scanDirectory = (dir, relative = '') => {
                const items = fsPack.readdirSync(dir);
                
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const relativePath = relative ? path.join(relative, item) : item;
                    const stat = fsPack.statSync(fullPath);
                    
                    if (stat.isDirectory() && item !== 'backups' && item !== 'logs') {
                        // Scanner sous-dossier (sauf backups et logs)
                        scanDirectory(fullPath, relativePath);
                    } else if (stat.isFile() && item.endsWith('.json')) {
                        // Utiliser le mapping individuel pour chaque fichier
                        const collection = this.fileCollectionMapping[item] || `backup_generic_${item.replace('.json', '')}`;
                        allFiles[relativePath] = collection;
                    }
                }
            };
            
            scanDirectory(dataDir);
            return allFiles;
            
        } catch (error) {
            console.error('❌ Erreur scan fichiers data:', error);
            return {};
        }
    }

    // SAUVEGARDE: Fichiers locaux → MongoDB (version complète)
    async backupToMongo() {
        if (!MongoClient) {
            console.log('⚠️ Sauvegarde MongoDB ignorée - module non disponible');
            return false;
        }
        
        if (!await this.connect()) {
            console.log('⚠️ Sauvegarde MongoDB ignorée - pas de connexion');
            return false;
        }

        try {
            console.log('📤 Début sauvegarde COMPLÈTE vers MongoDB...');
            
            // Scanner tous les fichiers JSON existants
            const allDataFiles = await this.scanAllDataFiles();
            
            // Combiner avec les fichiers prédéfinis
            const filesToBackup = { ...this.localFiles, ...allDataFiles };
            
            let backupCount = 0;
            let skippedCount = 0;
            const backupSummary = [];

            for (const [filename, collection] of Object.entries(filesToBackup)) {
                const filePath = path.join(__dirname, '..', 'data', filename);
                
                try {
                    const fsPack = require('fs');
                    if (!fsPack.existsSync(filePath)) {
                        skippedCount++;
                        continue;
                    }

                    const data = await fs.readFile(filePath, 'utf8');
                    const jsonData = JSON.parse(data);

                    // Calculer la taille des données
                    const dataSize = JSON.stringify(jsonData).length;
                    
                    // Sauvegarder avec métadonnées complètes
                    const backupDoc = {
                        filename: filename,
                        data: jsonData,
                        timestamp: new Date(),
                        deployment: process.env.RENDER_SERVICE_ID || 'local',
                        version: process.env.npm_package_version || '1.0.0',
                        fileSize: dataSize,
                        recordCount: Array.isArray(jsonData) ? jsonData.length : Object.keys(jsonData).length
                    };

                    await this.db.collection(collection).replaceOne(
                        { filename: filename },
                        backupDoc,
                        { upsert: true }
                    );

                    backupCount++;
                    backupSummary.push(`✅ ${filename} → ${collection} (${Math.round(dataSize/1024)}KB)`);
                    
                } catch (fileError) {
                    console.error(`❌ Erreur sauvegarde ${filename}:`, fileError.message);
                    skippedCount++;
                }
            }

            // Sauvegarder aussi les collections Mongo liées au système de bump
            try {
                const bumpConfigs = await this.db.collection('bumpConfigs').find({}).toArray();
                await this.db.collection('backup_bump_configs').replaceOne(
                    { key: 'bumpConfigs' },
                    { key: 'bumpConfigs', data: bumpConfigs, timestamp: new Date(), snapshot: true },
                    { upsert: true }
                );
                backupSummary.push(`✅ bumpConfigs → backup_bump_configs (${bumpConfigs.length} docs)`);
            } catch (e) {
                console.log(`⚠️ Sauvegarde bumpConfigs ignorée: ${e.message}`);
            }

            try {
                const bumpCooldowns = await this.db.collection('bumpCooldowns').find({}).toArray();
                await this.db.collection('backup_bump_cooldowns').replaceOne(
                    { key: 'bumpCooldowns' },
                    { key: 'bumpCooldowns', data: bumpCooldowns, timestamp: new Date(), snapshot: true },
                    { upsert: true }
                );
                backupSummary.push(`✅ bumpCooldowns → backup_bump_cooldowns (${bumpCooldowns.length} docs)`);
            } catch (e) {
                console.log(`⚠️ Sauvegarde bumpCooldowns ignorée: ${e.message}`);
            }
 
            // Afficher le résumé détaillé
            console.log(`📤 SAUVEGARDE MONGODB TERMINÉE:`);
            console.log(`   ✅ ${backupCount} fichiers sauvegardés`);
            console.log(`   ⏭️ ${skippedCount} fichiers ignorés`);
            console.log(`   📁 Collections utilisées: ${[...new Set(Object.values(filesToBackup))].length}`);
            
            // Afficher le détail si demandé
            if (process.env.DEBUG_BACKUP === 'true') {
                console.log('📋 Détail des sauvegardes:');
                backupSummary.forEach(line => console.log(`   ${line}`));
            }
            
            return { success: true, backupCount, skippedCount, total: Object.keys(filesToBackup).length };
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde MongoDB:', error);
            return { success: false, error: error.message };
        }
    }

    // RESTAURATION: MongoDB → Fichiers locaux (version complète)
    async restoreFromMongo(specificFile = null) {
        if (!MongoClient) {
            console.log('⚠️ Restauration MongoDB ignorée - module non disponible');
            return { success: false, reason: 'Module MongoDB non disponible' };
        }
        
        if (!await this.connect()) {
            console.log('⚠️ Restauration MongoDB ignorée - pas de connexion');
            return { success: false, reason: 'Connexion MongoDB impossible' };
        }

        try {
            console.log('📥 Début restauration COMPLÈTE depuis MongoDB...');
            let restoreCount = 0;
            let skippedCount = 0;
            const restoreSummary = [];

            // Créer le dossier data s'il n'existe pas
            const dataDir = path.join(__dirname, '..', 'data');
            await fs.mkdir(dataDir, { recursive: true });

            // Scanner toutes les collections MongoDB disponibles
            const allCollections = await this.db.listCollections().toArray();
            const availableCollections = allCollections.map(c => c.name);
            
            console.log(`📁 Collections MongoDB disponibles: ${availableCollections.join(', ')}`);

            // Restaurer fichier spécifique ou tous les fichiers avec mapping individualisé
            let filesToRestore;
            if (specificFile) {
                const collection = this.fileCollectionMapping[specificFile] || 
                                 this.localFiles[specificFile] || 
                                 `backup_generic_${specificFile.replace('.json', '')}`;
                filesToRestore = { [specificFile]: collection };
            } else {
                // Utiliser le mapping individualisé en priorité
                filesToRestore = { ...this.fileCollectionMapping };
                
                // Ajouter les fichiers de l'ancien mapping s'ils ne sont pas déjà dans le nouveau
                for (const [filename, collection] of Object.entries(this.localFiles)) {
                    if (!filesToRestore[filename]) {
                        filesToRestore[filename] = collection;
                    }
                }
            }

            for (const [filename, collection] of Object.entries(filesToRestore)) {
                try {
                    // Chercher le document de sauvegarde
                    const backupDoc = await this.db.collection(collection)
                        .findOne({ filename: filename }, { sort: { timestamp: -1 } });

                    if (!backupDoc) {
                        console.log(`⏭️ Aucune sauvegarde trouvée pour ${filename} dans ${collection}`);
                        skippedCount++;
                        continue;
                    }

                    // Créer le dossier parent si nécessaire
                    const filePath = path.join(dataDir, filename);
                    const parentDir = path.dirname(filePath);
                    await fs.mkdir(parentDir, { recursive: true });

                    // Écrire le fichier avec les données restaurées
                    await fs.writeFile(filePath, JSON.stringify(backupDoc.data, null, 2));

                    // Calculer l'âge de la sauvegarde
                    const backupAge = Date.now() - new Date(backupDoc.timestamp).getTime();
                    const ageHours = Math.floor(backupAge / (1000 * 60 * 60));
                    const ageMinutes = Math.floor((backupAge % (1000 * 60 * 60)) / (1000 * 60));

                    restoreCount++;
                    const sizeInfo = backupDoc.fileSize ? `${Math.round(backupDoc.fileSize/1024)}KB` : 'taille inconnue';
                    restoreSummary.push(`✅ ${filename} ← ${collection} (${sizeInfo}, il y a ${ageHours}h${ageMinutes}m)`);
                    
                } catch (restoreError) {
                    console.error(`❌ Erreur restauration ${filename}:`, restoreError.message);
                    skippedCount++;
                }
            }

            // Restaurer les collections bump depuis les backups si elles sont vides
            try {
                const bumpCount = await this.db.collection('bumpConfigs').countDocuments({});
                if (bumpCount === 0) {
                    const backupDoc = await this.db.collection('backup_bump_configs').findOne({ key: 'bumpConfigs' }, { sort: { timestamp: -1 } });
                    if (backupDoc && Array.isArray(backupDoc.data) && backupDoc.data.length > 0) {
                        const docs = backupDoc.data.map(d => { const { _id, ...rest } = d || {}; return rest; });
                        if (docs.length > 0) {
                            await this.db.collection('bumpConfigs').insertMany(docs);
                            restoreSummary.push(`✅ bumpConfigs restauré (${docs.length} docs)`);
                        }
                    }
                }
            } catch (e) {
                console.log(`⚠️ Restauration bumpConfigs ignorée: ${e.message}`);
            }

            try {
                const cooldownCount = await this.db.collection('bumpCooldowns').countDocuments({});
                if (cooldownCount === 0) {
                    const backupDoc = await this.db.collection('backup_bump_cooldowns').findOne({ key: 'bumpCooldowns' }, { sort: { timestamp: -1 } });
                    if (backupDoc && Array.isArray(backupDoc.data) && backupDoc.data.length > 0) {
                        const docs = backupDoc.data.map(d => { const { _id, ...rest } = d || {}; return rest; });
                        if (docs.length > 0) {
                            await this.db.collection('bumpCooldowns').insertMany(docs);
                            restoreSummary.push(`✅ bumpCooldowns restauré (${docs.length} docs)`);
                        }
                    }
                }
            } catch (e) {
                console.log(`⚠️ Restauration bumpCooldowns ignorée: ${e.message}`);
            }
 
            // Afficher le résumé détaillé
            console.log(`📥 RESTAURATION MONGODB TERMINÉE:`);
            console.log(`   ✅ ${restoreCount} fichiers restaurés`);
            console.log(`   ⏭️ ${skippedCount} fichiers ignorés`);
            console.log(`   📁 Collections utilisées: ${availableCollections.length}`);
            
            // Afficher le détail si demandé
            if (process.env.DEBUG_BACKUP === 'true' || restoreSummary.length <= 10) {
                console.log('📋 Détail des restaurations:');
                restoreSummary.forEach(line => console.log(`   ${line}`));
            }
            
            return { 
                success: true, 
                restoreCount, 
                skippedCount, 
                total: Object.keys(filesToRestore).length,
                collections: availableCollections
            };
            
        } catch (error) {
            console.error('❌ Erreur restauration MongoDB:', error);
            return { success: false, error: error.message };
        }
    }

    // SAUVEGARDE AUTOMATIQUE PÉRIODIQUE
    startAutoBackup(intervalMinutes = 15) {
        console.log(`🕐 Sauvegarde automatique démarrée (toutes les ${intervalMinutes} minutes)`);
        
        setInterval(async () => {
            try {
                const result = await this.backupToMongo();
                if (!result || result.success === false) {
                    await simpleBackup.performBackup();
                }
            } catch (e) {
                console.log('⚠️ Fallback sauvegarde simple (erreur Mongo):', e.message);
                try { await simpleBackup.performBackup(); } catch {}
            }
        }, intervalMinutes * 60 * 1000);

        // Sauvegarde immédiate au démarrage
        setTimeout(async () => {
            try {
                const result = await this.backupToMongo();
                if (!result || result.success === false) {
                    await simpleBackup.performBackup();
                }
            } catch (e) {
                try { await simpleBackup.performBackup(); } catch {}
            }
        }, 5000);
    }

    // SAUVEGARDE D'URGENCE (avant arrêt du processus)
    setupEmergencyBackup() {
        const emergencyBackup = async () => {
            console.log('🚨 Sauvegarde d\'urgence en cours...');
            try {
                const result = await this.backupToMongo();
                if (!result || result.success === false) {
                    await simpleBackup.performBackup();
                }
            } catch (e) {
                try { await simpleBackup.performBackup(); } catch {}
            }
            await this.disconnect();
        };

        process.on('SIGTERM', emergencyBackup);
        process.on('SIGINT', emergencyBackup);
        process.on('beforeExit', emergencyBackup);
    }

    // VÉRIFICATION INTÉGRITÉ DES DONNÉES
    async verifyBackupIntegrity() {
        if (!await this.connect()) return false;

        try {
            console.log('🔍 Vérification intégrité des sauvegardes...');
            
            for (const [filename, collection] of Object.entries(this.localFiles)) {
                const backupDoc = await this.db.collection(collection)
                    .findOne({ filename: filename });
                
                if (backupDoc) {
                    const age = Date.now() - new Date(backupDoc.timestamp).getTime();
                    const ageHours = Math.floor(age / (1000 * 60 * 60));
                    
                    console.log(`📊 ${filename}: sauvegardé il y a ${ageHours}h (${backupDoc.timestamp})`);
                } else {
                    console.log(`⚠️ ${filename}: aucune sauvegarde trouvée`);
                }
            }
            
            return true;
        } catch (error) {
            console.error('❌ Erreur vérification intégrité:', error);
            return false;
        }
    }

    // NETTOYAGE DES ANCIENNES SAUVEGARDES
    async cleanOldBackups(keepDays = 7) {
        if (!await this.connect()) return false;

        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - keepDays);

            console.log(`🧹 Nettoyage sauvegardes antérieures au ${cutoffDate.toISOString()}`);

            for (const collection of Object.values(this.collections)) {
                const result = await this.db.collection(collection)
                    .deleteMany({
                        timestamp: { $lt: cutoffDate },
                        filename: { $exists: true }
                    });

                if (result.deletedCount > 0) {
                    console.log(`🗑️ ${result.deletedCount} anciennes sauvegardes supprimées de ${collection}`);
                }
            }
            
            return true;
        } catch (error) {
            console.error('❌ Erreur nettoyage:', error);
            return false;
        }
    }
}

module.exports = new MongoBackupManager();
