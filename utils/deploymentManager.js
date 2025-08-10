const mongoBackup = require('./mongoBackupManager');
const simpleBackup = require('./simpleBackupManager');
const fs = require('fs').promises;
const path = require('path');

class DeploymentManager {
    constructor() {
        this.isFirstBoot = false;
        this.deploymentId = process.env.RENDER_SERVICE_ID || `local-${Date.now()}`;
        this.lastDeploymentFile = path.join(__dirname, '..', 'data', '.last_deployment');
    }

    // DÉTECTION NOUVEAU DÉPLOIEMENT
    async checkNewDeployment() {
        try {
            const currentId = this.deploymentId;
            
            try {
                const lastId = await fs.readFile(this.lastDeploymentFile, 'utf8');
                this.isFirstBoot = (lastId.trim() !== currentId);
            } catch (error) {
                // Fichier n'existe pas = premier déploiement
                this.isFirstBoot = true;
            }

            if (this.isFirstBoot) {
                console.log('🚀 Nouveau déploiement détecté:', currentId);
                await fs.writeFile(this.lastDeploymentFile, currentId);
            } else {
                console.log('🔄 Redémarrage du même déploiement:', currentId);
            }

            return this.isFirstBoot;
        } catch (error) {
            console.error('❌ Erreur détection déploiement:', error);
            return false;
        }
    }

    // INITIALISATION COMPLÈTE AU DÉPLOIEMENT
    async initializeDeployment() {
        console.log('🎯 Initialisation du déploiement...');
        
        const isNewDeployment = await this.checkNewDeployment();
        
        if (isNewDeployment) {
            console.log('📥 Nouveau déploiement - restauration des données...');
            await this.restoreAllData();
        } else {
            console.log('🔄 Redémarrage - vérification des données...');
            await this.verifyDataIntegrity();
        }

        // Démarrer la sauvegarde automatique
        this.startBackupSystem();
        
        return isNewDeployment;
    }

    // RESTAURATION COMPLÈTE DES DONNÉES
    async restoreAllData() {
        try {
            // Vérifier si MongoDB est disponible avant d'essayer
            if (process.env.MONGODB_PASSWORD && process.env.MONGODB_USERNAME && process.env.MONGODB_CLUSTER_URL) {
                console.log('📦 Tentative restauration depuis MongoDB...');
                const mongoSuccess = await mongoBackup.restoreFromMongo();
                
                if (mongoSuccess) {
                    console.log('✅ Restauration MongoDB réussie');
                    // Nettoyage automatique des artefacts de test (prix 594939) côté Mongo
                    await this.cleanMongoTestShopItems();
                    await this.verifyDataIntegrity();
                    return true;
                }
            }
            
            console.log('📁 Utilisation des fichiers locaux existants');
            await this.createDefaultFiles();
            
            // Vérifier l'intégrité après restauration
            await this.verifyDataIntegrity();
            
            console.log('✅ Restauration complète terminée');
            return true;
        } catch (error) {
            console.error('❌ Erreur restauration complète:', error);
            await this.createDefaultFiles();
            return false;
        }
    }

    // Nettoyer les objets de test (prix 594939) dans les collections Mongo de sauvegarde boutique
    async cleanMongoTestShopItems() {
        try {
            // Ne rien faire si Mongo non configuré
            if (!process.env.MONGODB_PASSWORD || !process.env.MONGODB_USERNAME || !process.env.MONGODB_CLUSTER_URL) {
                return;
            }

            const connected = await mongoBackup.connect();
            if (!connected || !mongoBackup.db) {
                console.log('⚠️ MongoDB indisponible - nettoyage distant ignoré');
                return;
            }

            const db = mongoBackup.db;
            const targetPrice = 594939;

            const cleanCollection = async (collectionName) => {
                try {
                    const col = db.collection(collectionName);
                    const docs = await col.find({}).toArray();
                    let modifiedDocs = 0;
                    let removedItems = 0;

                    for (const doc of docs) {
                        if (!doc || typeof doc.data !== 'object' || doc.data === null) continue;

                        let changed = false;
                        const newData = { ...doc.data };

                        for (const [guildId, items] of Object.entries(newData)) {
                            if (Array.isArray(items)) {
                                const before = items.length;
                                const filtered = items.filter(it => !(it && typeof it === 'object' && it.price === targetPrice));
                                if (filtered.length !== before) {
                                    newData[guildId] = filtered;
                                    removedItems += (before - filtered.length);
                                    changed = true;
                                }
                            }
                        }

                        if (changed) {
                            await col.updateOne({ _id: doc._id }, { $set: { data: newData, timestamp: new Date() } });
                            modifiedDocs += 1;
                        }
                    }

                    console.log(`🧹 Nettoyage ${collectionName}: ${modifiedDocs} doc(s) mis à jour, ${removedItems} item(s) retiré(s)`);
                } catch (err) {
                    console.log(`⚠️ Nettoyage ignoré pour ${collectionName}: ${err.message}`);
                }
            };

            // Nettoyer mapping dédié et ancien mapping
            await cleanCollection('backup_shop_items');
            await cleanCollection('shop');

            await mongoBackup.disconnect();
        } catch (error) {
            console.log('⚠️ Erreur nettoyage Mongo test shop items:', error.message);
        }
    }

    // CRÉATION FICHIERS PAR DÉFAUT
    async createDefaultFiles() {
        console.log('🆕 Création des fichiers de configuration par défaut...');
        
        const dataDir = path.join(__dirname, '..', 'data');
        await fs.mkdir(dataDir, { recursive: true });

        const defaultConfigs = {
            'economy.json': {},
            'confessions.json': {},
            'counting.json': {},
            'autothread.json': {},
            'shop.json': {},
            'karma_config.json': { customRewards: [] },
            'karma_discounts.json': {},
            'message_rewards.json': {}
        };

        for (const [filename, defaultData] of Object.entries(defaultConfigs)) {
            const filePath = path.join(dataDir, filename);
            
            try {
                await fs.access(filePath);
                console.log(`⏭️ ${filename} existe déjà`);
            } catch {
                await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
                console.log(`✅ ${filename} créé avec configuration par défaut`);
            }
        }
    }

    // VÉRIFICATION INTÉGRITÉ DES DONNÉES
    async verifyDataIntegrity() {
        console.log('🔍 Vérification intégrité des données locales...');
        
        const dataDir = path.join(__dirname, '..', 'data');
        const requiredFiles = [
            'economy.json', 'confessions.json', 'counting.json',
            'autothread.json', 'shop.json', 'karma_config.json', 'karma_discounts.json', 'message_rewards.json'
        ];

        let allValid = true;

        for (const filename of requiredFiles) {
            const filePath = path.join(dataDir, filename);
            
            try {
                const data = await fs.readFile(filePath, 'utf8');
                JSON.parse(data); // Test validité JSON
                console.log(`✅ ${filename} valide`);
            } catch (error) {
                console.log(`❌ ${filename} invalide ou manquant - création par défaut`);
                await fs.writeFile(filePath, JSON.stringify({}, null, 2));
                allValid = false;
            }
        }

        if (allValid) {
            console.log('✅ Toutes les données sont valides');
        } else {
            console.log('⚠️ Certains fichiers ont été recréés');
        }

        return allValid;
    }

    // DÉMARRAGE SYSTÈME DE SAUVEGARDE
    startBackupSystem() {
        console.log('🛡️ Démarrage du système de sauvegarde...');
        
        // Vérifier disponibilité MongoDB avant d'essayer
        if (process.env.MONGODB_PASSWORD && process.env.MONGODB_USERNAME && process.env.MONGODB_CLUSTER_URL) {
            try {
                mongoBackup.startAutoBackup(15);
                mongoBackup.setupEmergencyBackup();
                console.log('✅ Système MongoDB actif');
            } catch (error) {
                console.log('⚠️ MongoDB indisponible - utilisation sauvegarde simple');
                simpleBackup.startAutoBackup(30);
            }
        } else {
            console.log('📁 Mode sauvegarde locale uniquement');
            simpleBackup.startAutoBackup(30);
        }
        
        // Nettoyage hebdomadaire des anciennes sauvegardes
        this.scheduleWeeklyCleanup();
        
        console.log('✅ Système de sauvegarde actif');
    }

    // NETTOYAGE HEBDOMADAIRE
    scheduleWeeklyCleanup() {
        const weeklyInterval = 7 * 24 * 60 * 60 * 1000; // 1 semaine
        
        setInterval(async () => {
            console.log('🧹 Nettoyage hebdomadaire des sauvegardes...');
            await mongoBackup.cleanOldBackups(14); // Garder 2 semaines
        }, weeklyInterval);
    }

    // SAUVEGARDE MANUELLE D'URGENCE - INCLUT LES DONNÉES DE NIVEAUX
    async emergencyBackup() {
        console.log('🚨 Sauvegarde manuelle d\'urgence...');
        
        // Priorité aux fichiers de niveaux dans la sauvegarde d'urgence
        const criticalFiles = [
            'economy.json',
            'level_users.json', // Données niveaux des membres
            'level_config.json', // Configuration du système de niveaux
            'confessions.json',
            'counting.json',
            'autothread.json',
            'shop.json',
            'karma_config.json',
            'karma_discounts.json',
            'message_rewards.json',
            'daily.json',
            'actions.json',
            'config.json'
        ];
        
        console.log('📋 Fichiers prioritaires pour sauvegarde d\'urgence:');
        criticalFiles.forEach(file => console.log(`   • ${file}`));
        
        // Essayer MongoDB d'abord
        const mongoResult = await mongoBackup.backupToMongo();
        if (mongoResult) {
            console.log('✅ Sauvegarde d\'urgence MongoDB réussie (inclut données de niveaux)');
            return true;
        }
        
        // Fallback vers sauvegarde simple avec focus sur les niveaux
        console.log('🔄 Fallback vers sauvegarde simple...');
        const simpleResult = await simpleBackup.performBackup();
        
        if (simpleResult) {
            console.log('✅ Sauvegarde d\'urgence simple réussie (inclut données de niveaux)');
            return true;
        }
        
        console.log('❌ Échec de toutes les sauvegardes d\'urgence');
        return false;
    }

    // STATUS DU SYSTÈME
    async getSystemStatus() {
        const connected = await mongoBackup.connect();
        
        return {
            deploymentId: this.deploymentId,
            isFirstBoot: this.isFirstBoot,
            mongoConnected: connected,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = new DeploymentManager();