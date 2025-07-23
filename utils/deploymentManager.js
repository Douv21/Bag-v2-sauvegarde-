const mongoBackup = require('./mongoBackupManager');
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
            console.log('📦 Restauration complète depuis MongoDB...');
            
            // Restaurer depuis MongoDB
            const mongoSuccess = await mongoBackup.restoreFromMongo();
            
            if (!mongoSuccess) {
                console.log('⚠️ Échec restauration MongoDB - création fichiers par défaut');
                await this.createDefaultFiles();
            }
            
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
            'autothread.json', 'shop.json', 'karma_config.json', 'message_rewards.json'
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
        
        // Sauvegarde automatique toutes les 15 minutes
        mongoBackup.startAutoBackup(15);
        
        // Sauvegarde d'urgence en cas d'arrêt
        mongoBackup.setupEmergencyBackup();
        
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

    // SAUVEGARDE MANUELLE D'URGENCE
    async emergencyBackup() {
        console.log('🚨 Sauvegarde manuelle d\'urgence...');
        return await mongoBackup.backupToMongo();
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