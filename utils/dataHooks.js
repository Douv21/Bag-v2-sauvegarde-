const mongoBackup = require('./mongoBackupManager');

class DataHooks {
    constructor() {
        this.enabled = true;
        this.backupQueue = new Set();
        this.isProcessing = false;
    }

    // HOOK AUTOMATIQUE POUR SAUVEGARDE APRÈS MODIFICATIONS
    async triggerBackup(operation = 'data_change') {
        if (!this.enabled) return;

        this.backupQueue.add(operation);
        
        // Débounce - attendre 2 secondes avant sauvegarde
        setTimeout(() => this.processBackupQueue(), 2000);
    }

    async processBackupQueue() {
        if (this.isProcessing || this.backupQueue.size === 0) return;

        this.isProcessing = true;
        const operations = Array.from(this.backupQueue);
        this.backupQueue.clear();

        try {
            console.log(`💾 Sauvegarde automatique déclenchée (${operations.length} opérations)`);
            await mongoBackup.backupToMongo();
        } catch (error) {
            console.error('❌ Erreur sauvegarde automatique:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    // WRAPPERS POUR OPÉRATIONS DE DONNÉES
    wrapDataOperation(originalFunction, operationName) {
        return async (...args) => {
            try {
                const result = await originalFunction.apply(this, args);
                
                // Déclencher sauvegarde après opération réussie
                this.triggerBackup(operationName);
                
                return result;
            } catch (error) {
                console.error(`❌ Erreur opération ${operationName}:`, error);
                throw error;
            }
        };
    }

    // INSTALLER LES HOOKS SUR LE DATA MANAGER
    installHooks(dataManager) {
        if (!dataManager) return;

        // Wrapper pour toutes les méthodes de sauvegarde
        const originalSetData = dataManager.setData;
        const originalSaveData = dataManager.saveData;
        const originalSetUser = dataManager.setUser;

        dataManager.setData = this.wrapDataOperation(originalSetData.bind(dataManager), 'setData');
        dataManager.saveData = this.wrapDataOperation(originalSaveData.bind(dataManager), 'saveData');
        
        if (dataManager.setUser) {
            dataManager.setUser = this.wrapDataOperation(originalSetUser.bind(dataManager), 'setUser');
        }

        console.log('🔗 Hooks de sauvegarde automatique installés');
    }

    // DÉSACTIVER TEMPORAIREMENT
    disable() {
        this.enabled = false;
        console.log('⏸️ Sauvegarde automatique désactivée');
    }

    enable() {
        this.enabled = true;
        console.log('▶️ Sauvegarde automatique activée');
    }
}

module.exports = new DataHooks();