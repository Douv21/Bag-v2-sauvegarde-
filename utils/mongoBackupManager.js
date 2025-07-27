// Utilisation optionnelle de MongoDB - fallback si module indisponible
let MongoClient;
try {
    MongoClient = require('mongodb').MongoClient;
} catch (error) {
    console.log('📦 Module MongoDB non disponible - mode fichier local uniquement');
    MongoClient = null;
}
const fs = require('fs').promises;
const path = require('path');

class MongoBackupManager {
    constructor() {
        this.client = null;
        this.db = null;
        this.connected = false;
        
        // Construction de la chaîne de connexion avec les nouvelles variables
        const username = process.env.MONGODB_USERNAME || 'douvdouv21';
        const password = process.env.MONGODB_PASSWORD;
        let clusterUrl = process.env.MONGODB_CLUSTER_URL || 'cluster0.5ujrblq.mongodb.net';
        
        // Nettoyer l'URL si elle contient déjà le format complet
        if (clusterUrl.includes('mongodb+srv://')) {
            // Extraire juste le nom du cluster depuis l'URL complète
            const match = clusterUrl.match(/@([^\/\?]+)/);
            if (match) {
                clusterUrl = match[1];
            }
        }
        
        this.connectionString = password ? 
            `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${clusterUrl}/bagbot?retryWrites=true&w=majority&authSource=admin` : 
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
            
            // Configuration karma et récompenses
            'karma_config.json': 'karma',
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
                        // Déterminer la collection basée sur le type de fichier
                        let collection = 'general_config';
                        
                        if (item.includes('economy')) collection = 'economy';
                        else if (item.includes('level')) collection = 'level_config';
                        else if (item.includes('confession')) collection = 'confessions';
                        else if (item.includes('counting')) collection = 'counting';
                        else if (item.includes('autothread')) collection = 'autothread';
                        else if (item.includes('shop')) collection = 'shop';
                        else if (item.includes('karma')) collection = 'karma';
                        else if (item.includes('daily')) collection = 'daily_config';
                        else if (item.includes('message')) collection = 'message_rewards';
                        else if (item.includes('action')) collection = 'actions_config';
                        else if (item.includes('user')) collection = 'users';
                        else if (item.includes('staff')) collection = 'staff_config';
                        else if (item.includes('cooldown')) collection = 'cooldowns';
                        else if (item.includes('config')) collection = 'main_config';
                        
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

            // Restaurer fichier spécifique ou tous les fichiers
            const filesToRestore = specificFile ? 
                { [specificFile]: this.localFiles[specificFile] || 'general_config' } : 
                this.localFiles;

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
            await this.backupToMongo();
        }, intervalMinutes * 60 * 1000);

        // Sauvegarde immédiate au démarrage
        setTimeout(() => this.backupToMongo(), 5000);
    }

    // SAUVEGARDE D'URGENCE (avant arrêt du processus)
    setupEmergencyBackup() {
        const emergencyBackup = async () => {
            console.log('🚨 Sauvegarde d\'urgence en cours...');
            await this.backupToMongo();
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