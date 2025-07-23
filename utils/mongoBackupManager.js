const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

class MongoBackupManager {
    constructor() {
        this.client = null;
        this.db = null;
        this.connected = false;
        this.connectionString = process.env.MONGODB_PASSWORD ? 
            `mongodb+srv://douvdouv21:${process.env.MONGODB_PASSWORD}@cluster0.5ujrblq.mongodb.net/bagbot?retryWrites=true&w=majority` : 
            null;
        
        this.collections = {
            users: 'users',
            economy: 'economy', 
            confessions: 'confessions',
            counting: 'counting',
            autothread: 'autothread',
            shop: 'shop',
            karma: 'karma',
            configs: 'configs'
        };

        this.localFiles = {
            'economy.json': 'economy',
            'confessions.json': 'confessions', 
            'counting.json': 'counting',
            'autothread.json': 'autothread',
            'shop.json': 'shop',
            'karma_config.json': 'karma',
            'message_rewards.json': 'configs'
        };
    }

    async connect() {
        if (this.connected || !this.connectionString) {
            return this.connected;
        }

        try {
            console.log('🔄 Connexion MongoDB pour sauvegarde...');
            this.client = new MongoClient(this.connectionString, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000,
                maxPoolSize: 5
            });
            
            await this.client.connect();
            this.db = this.client.db('bagbot');
            this.connected = true;
            console.log('✅ MongoDB connecté pour système de sauvegarde');
            return true;
        } catch (error) {
            console.log('❌ MongoDB indisponible - mode fichier local uniquement');
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

    // SAUVEGARDE: Fichiers locaux → MongoDB
    async backupToMongo() {
        if (!await this.connect()) {
            console.log('⚠️ Sauvegarde MongoDB ignorée - pas de connexion');
            return false;
        }

        try {
            console.log('📤 Début sauvegarde automatique vers MongoDB...');
            let backupCount = 0;

            for (const [filename, collection] of Object.entries(this.localFiles)) {
                const filePath = path.join(__dirname, '..', 'data', filename);
                
                try {
                    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
                    if (!fileExists) {
                        console.log(`⏭️ ${filename} n'existe pas - ignoré`);
                        continue;
                    }

                    const data = await fs.readFile(filePath, 'utf8');
                    const jsonData = JSON.parse(data);

                    // Sauvegarder avec timestamp
                    const backupDoc = {
                        filename: filename,
                        data: jsonData,
                        timestamp: new Date(),
                        deployment: process.env.RENDER_SERVICE_ID || 'local'
                    };

                    await this.db.collection(collection).replaceOne(
                        { filename: filename },
                        backupDoc,
                        { upsert: true }
                    );

                    backupCount++;
                    console.log(`✅ ${filename} sauvegardé dans collection ${collection}`);
                } catch (fileError) {
                    console.error(`❌ Erreur sauvegarde ${filename}:`, fileError.message);
                }
            }

            console.log(`📤 Sauvegarde terminée: ${backupCount} fichiers sauvegardés`);
            return true;
        } catch (error) {
            console.error('❌ Erreur sauvegarde MongoDB:', error);
            return false;
        }
    }

    // RESTAURATION: MongoDB → Fichiers locaux
    async restoreFromMongo() {
        if (!await this.connect()) {
            console.log('⚠️ Restauration MongoDB ignorée - pas de connexion');
            return false;
        }

        try {
            console.log('📥 Début restauration depuis MongoDB...');
            let restoreCount = 0;

            // Créer le dossier data s'il n'existe pas
            const dataDir = path.join(__dirname, '..', 'data');
            await fs.mkdir(dataDir, { recursive: true });

            for (const [filename, collection] of Object.entries(this.localFiles)) {
                try {
                    const backupDoc = await this.db.collection(collection)
                        .findOne({ filename: filename });

                    if (!backupDoc) {
                        console.log(`⏭️ Aucune sauvegarde trouvée pour ${filename}`);
                        continue;
                    }

                    const filePath = path.join(dataDir, filename);
                    await fs.writeFile(filePath, JSON.stringify(backupDoc.data, null, 2));

                    restoreCount++;
                    console.log(`✅ ${filename} restauré depuis ${collection} (${backupDoc.timestamp})`);
                } catch (restoreError) {
                    console.error(`❌ Erreur restauration ${filename}:`, restoreError.message);
                }
            }

            console.log(`📥 Restauration terminée: ${restoreCount} fichiers restaurés`);
            return true;
        } catch (error) {
            console.error('❌ Erreur restauration MongoDB:', error);
            return false;
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