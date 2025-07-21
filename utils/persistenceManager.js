// Gestionnaire de persistance pour éviter la perte de données sur Render.com
const fs = require('fs');
const path = require('path');

class PersistenceManager {
    constructor() {
        this.backupInterval = 5 * 60 * 1000; // 5 minutes
        this.criticalFiles = [
            'counting.json',
            'users.json', 
            'actions.json',
            'message_rewards.json',
            'cooldowns.json',
            'confessions.json',
            'shop.json',
            'karma_config.json'
        ];
        this.dataPath = './data';
        
        // Initialiser le système de persistance
        this.initializePersistence();
    }
    
    async initializePersistence() {
        console.log('🔄 Initialisation système de persistance...');
        
        // Vérifier si PostgreSQL est disponible
        if (process.env.DATABASE_URL) {
            try {
                await this.initializeDatabase();
                console.log('✅ Persistance PostgreSQL activée');
            } catch (error) {
                console.error('❌ Échec PostgreSQL, fallback fichiers:', error.message);
                this.fallbackToFiles();
            }
        } else {
            console.log('📁 Persistance fichiers activée (PostgreSQL non disponible)');
            this.fallbackToFiles();
        }
        
        // Démarrer les sauvegardes automatiques
        this.startAutoBackup();
    }
    
    async initializeDatabase() {
        const { Pool } = require('pg');
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        // Créer la table de persistance si elle n'existe pas
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS bot_persistence (
                file_name VARCHAR(255) PRIMARY KEY,
                file_content TEXT NOT NULL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                checksum VARCHAR(64)
            )
        `);
        
        // Restaurer les données depuis la base
        await this.restoreFromDatabase();
    }
    
    fallbackToFiles() {
        // Mode fichiers uniquement avec backup renforcé
        this.useDatabase = false;
        this.ensureBackupDirectory();
    }
    
    ensureBackupDirectory() {
        const backupPath = path.join(this.dataPath, 'persistence_backups');
        if (!fs.existsSync(backupPath)) {
            fs.mkdirSync(backupPath, { recursive: true });
        }
    }
    
    async saveData(filename, data) {
        try {
            const filepath = path.join(this.dataPath, filename);
            const content = JSON.stringify(data, null, 2);
            
            // Sauvegarder en local
            fs.writeFileSync(filepath, content, 'utf8');
            
            // Sauvegarder en base de données si disponible
            if (this.pool) {
                const checksum = this.generateChecksum(content);
                await this.pool.query(
                    'INSERT INTO bot_persistence (file_name, file_content, checksum) VALUES ($1, $2, $3) ON CONFLICT (file_name) DO UPDATE SET file_content = $2, checksum = $3, last_updated = CURRENT_TIMESTAMP',
                    [filename, content, checksum]
                );
                console.log(`💾 Sauvegardé en DB: ${filename}`);
            }
            
            // Backup local supplémentaire
            this.createLocalBackup(filename, content);
            
        } catch (error) {
            console.error(`❌ Erreur sauvegarde ${filename}:`, error);
            throw error;
        }
    }
    
    async loadData(filename, defaultValue = {}) {
        try {
            const filepath = path.join(this.dataPath, filename);
            
            // Tenter de charger depuis la base de données d'abord
            if (this.pool) {
                try {
                    const result = await this.pool.query(
                        'SELECT file_content, checksum FROM bot_persistence WHERE file_name = $1',
                        [filename]
                    );
                    
                    if (result.rows.length > 0) {
                        const content = result.rows[0].file_content;
                        const dbChecksum = result.rows[0].checksum;
                        
                        // Vérifier l'intégrité
                        if (this.generateChecksum(content) === dbChecksum) {
                            const data = JSON.parse(content);
                            
                            // Synchroniser avec le fichier local
                            fs.writeFileSync(filepath, content, 'utf8');
                            console.log(`📥 Restauré depuis DB: ${filename}`);
                            return data;
                        }
                    }
                } catch (dbError) {
                    console.log(`⚠️ Erreur DB pour ${filename}, fallback fichier:`, dbError.message);
                }
            }
            
            // Charger depuis le fichier local
            if (fs.existsSync(filepath)) {
                const content = fs.readFileSync(filepath, 'utf8');
                if (content.trim()) {
                    return JSON.parse(content);
                }
            }
            
            // Tenter de restaurer depuis backup
            const backupData = this.restoreFromLocalBackup(filename);
            if (backupData) {
                console.log(`🔄 Restauré depuis backup: ${filename}`);
                await this.saveData(filename, backupData);
                return backupData;
            }
            
            // Utiliser valeur par défaut
            console.log(`📝 Fichier initial créé: ${filename}`);
            await this.saveData(filename, defaultValue);
            return defaultValue;
            
        } catch (error) {
            console.error(`❌ Erreur chargement ${filename}:`, error);
            return defaultValue;
        }
    }
    
    async restoreFromDatabase() {
        if (!this.pool) return;
        
        try {
            const result = await this.pool.query('SELECT file_name, file_content FROM bot_persistence');
            
            for (const row of result.rows) {
                const filepath = path.join(this.dataPath, row.file_name);
                fs.writeFileSync(filepath, row.file_content, 'utf8');
                console.log(`📥 Restauré: ${row.file_name}`);
            }
            
            console.log(`✅ ${result.rows.length} fichiers restaurés depuis PostgreSQL`);
        } catch (error) {
            console.error('❌ Erreur restauration DB:', error);
        }
    }
    
    createLocalBackup(filename, content) {
        try {
            const backupPath = path.join(this.dataPath, 'persistence_backups');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupPath, `${filename}.${timestamp}.backup`);
            
            fs.writeFileSync(backupFile, content, 'utf8');
            
            // Nettoyer les anciens backups (garder les 5 plus récents)
            this.cleanOldBackups(filename);
            
        } catch (error) {
            console.error(`❌ Erreur backup local ${filename}:`, error);
        }
    }
    
    restoreFromLocalBackup(filename) {
        try {
            const backupPath = path.join(this.dataPath, 'persistence_backups');
            if (!fs.existsSync(backupPath)) return null;
            
            const backupFiles = fs.readdirSync(backupPath)
                .filter(file => file.startsWith(`${filename}.`))
                .sort((a, b) => {
                    const timeA = a.split('.')[1];
                    const timeB = b.split('.')[1];
                    return timeB.localeCompare(timeA);
                });
            
            if (backupFiles.length > 0) {
                const latestBackup = path.join(backupPath, backupFiles[0]);
                const content = fs.readFileSync(latestBackup, 'utf8');
                return JSON.parse(content);
            }
            
        } catch (error) {
            console.error(`❌ Erreur restauration backup ${filename}:`, error);
        }
        
        return null;
    }
    
    cleanOldBackups(filename) {
        try {
            const backupPath = path.join(this.dataPath, 'persistence_backups');
            const backupFiles = fs.readdirSync(backupPath)
                .filter(file => file.startsWith(`${filename}.`))
                .sort((a, b) => {
                    const timeA = a.split('.')[1];
                    const timeB = b.split('.')[1];
                    return timeB.localeCompare(timeA);
                });
            
            // Garder seulement les 5 plus récents
            if (backupFiles.length > 5) {
                const filesToDelete = backupFiles.slice(5);
                filesToDelete.forEach(file => {
                    try {
                        fs.unlinkSync(path.join(backupPath, file));
                    } catch (e) {
                        console.error(`Erreur suppression backup ${file}:`, e);
                    }
                });
            }
            
        } catch (error) {
            console.error('❌ Erreur nettoyage backups:', error);
        }
    }
    
    generateChecksum(content) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    
    startAutoBackup() {
        setInterval(async () => {
            try {
                console.log('🔄 Backup automatique en cours...');
                
                for (const filename of this.criticalFiles) {
                    const filepath = path.join(this.dataPath, filename);
                    if (fs.existsSync(filepath)) {
                        const content = fs.readFileSync(filepath, 'utf8');
                        const data = JSON.parse(content);
                        await this.saveData(filename, data);
                    }
                }
                
                console.log(`✅ Backup automatique terminé - ${new Date().toLocaleTimeString()}`);
                
            } catch (error) {
                console.error('❌ Erreur backup automatique:', error);
            }
        }, this.backupInterval);
        
        console.log(`⏰ Backup automatique configuré (${this.backupInterval / 60000} min)`);
    }
    
    async cleanup() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

// Instance globale
const persistenceManager = new PersistenceManager();

module.exports = persistenceManager;