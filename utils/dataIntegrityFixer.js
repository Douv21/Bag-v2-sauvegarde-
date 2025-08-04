const fs = require('fs').promises;
const path = require('path');

class DataIntegrityFixer {
    constructor() {
        this.fixedFiles = [];
        this.errors = [];
    }

    async fixAllDataFiles() {
        console.log('🔧 === RÉPARATION INTÉGRITÉ DES DONNÉES ===\n');
        
        await this.fixConfigJson();
        await this.fixEconomyJson();
        await this.fixShopJson();
        await this.fixUsersJson();
        await this.fixEmptyFiles();
        
        this.generateReport();
        return {
            fixed: this.fixedFiles.length,
            errors: this.errors.length
        };
    }

    async fixConfigJson() {
        console.log('1️⃣ Réparation config.json...');
        
        try {
            const configPath = path.join(__dirname, '..', 'data', 'config.json');
            const data = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(data);
            
            // Ajouter le prefix manquant
            if (!config.prefix) {
                config.prefix = '!';
                console.log('   ✅ Prefix ajouté: "!"');
            }
            
            // Autres champs requis par défaut
            if (!config.botName) config.botName = 'BagBot';
            if (!config.version) config.version = '2.0.0';
            if (!config.maintenance) config.maintenance = false;
            
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
            this.fixedFiles.push('config.json');
            console.log('   ✅ config.json réparé\n');
            
        } catch (error) {
            console.log('   ❌ Erreur réparation config.json:', error.message);
            this.errors.push({ file: 'config.json', error: error.message });
        }
    }

    async fixEconomyJson() {
        console.log('2️⃣ Réparation economy.json...');
        
        try {
            const economyPath = path.join(__dirname, '..', 'data', 'economy.json');
            const data = await fs.readFile(economyPath, 'utf8');
            const economy = JSON.parse(data);
            
            let fixedUsers = 0;
            
            for (const [userId, userData] of Object.entries(economy)) {
                if (typeof userData === 'object' && userData !== null) {
                    // Réparer le champ 'money' manquant ou invalide
                    if (userData.money === undefined || isNaN(userData.money)) {
                        userData.money = userData.coins || userData.balance || 0;
                        fixedUsers++;
                    }
                    
                    // Assurer que money est un nombre
                    userData.money = parseInt(userData.money) || 0;
                    
                    // Champs par défaut
                    if (userData.level === undefined) userData.level = 1;
                    if (userData.xp === undefined) userData.xp = 0;
                    if (userData.goodKarma === undefined) userData.goodKarma = 0;
                    if (userData.badKarma === undefined) userData.badKarma = 0;
                    if (userData.inventory === undefined) userData.inventory = {};
                    if (userData.messageCount === undefined) userData.messageCount = 0;
                }
            }
            
            await fs.writeFile(economyPath, JSON.stringify(economy, null, 2));
            this.fixedFiles.push('economy.json');
            console.log(`   ✅ economy.json réparé (${fixedUsers} utilisateurs corrigés)\n`);
            
        } catch (error) {
            console.log('   ❌ Erreur réparation economy.json:', error.message);
            this.errors.push({ file: 'economy.json', error: error.message });
        }
    }

    async fixShopJson() {
        console.log('3️⃣ Réparation shop.json...');
        
        try {
            const shopPath = path.join(__dirname, '..', 'data', 'shop.json');
            const data = await fs.readFile(shopPath, 'utf8');
            const shop = JSON.parse(data);
            
            let fixedItems = 0;
            
            for (const [itemId, itemData] of Object.entries(shop)) {
                if (typeof itemData === 'object' && itemData !== null) {
                    // Réparer le champ 'name' manquant
                    if (!itemData.name) {
                        itemData.name = `Objet ${itemId}`;
                        fixedItems++;
                    }
                    
                    // Champs par défaut
                    if (itemData.price === undefined) itemData.price = 100;
                    if (itemData.description === undefined) itemData.description = 'Objet mystérieux';
                    if (itemData.category === undefined) itemData.category = 'general';
                    if (itemData.available === undefined) itemData.available = true;
                    if (itemData.stock === undefined) itemData.stock = -1; // -1 = illimité
                }
            }
            
            await fs.writeFile(shopPath, JSON.stringify(shop, null, 2));
            this.fixedFiles.push('shop.json');
            console.log(`   ✅ shop.json réparé (${fixedItems} articles corrigés)\n`);
            
        } catch (error) {
            console.log('   ❌ Erreur réparation shop.json:', error.message);
            this.errors.push({ file: 'shop.json', error: error.message });
        }
    }

    async fixUsersJson() {
        console.log('4️⃣ Réparation users.json...');
        
        try {
            const usersPath = path.join(__dirname, '..', 'data', 'users.json');
            const data = await fs.readFile(usersPath, 'utf8');
            const users = JSON.parse(data);
            
            let fixedUsers = 0;
            
            for (const [userId, userData] of Object.entries(users)) {
                if (typeof userData === 'object' && userData !== null) {
                    // Réparer le champ 'username' manquant
                    if (!userData.username) {
                        userData.username = `Utilisateur${userId.split('_')[0]}`;
                        fixedUsers++;
                    }
                    
                    // Champs par défaut
                    if (userData.discriminator === undefined) userData.discriminator = '0000';
                    if (userData.joinedAt === undefined) userData.joinedAt = new Date().toISOString();
                    if (userData.isActive === undefined) userData.isActive = true;
                    if (userData.lastSeen === undefined) userData.lastSeen = new Date().toISOString();
                }
            }
            
            await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
            this.fixedFiles.push('users.json');
            console.log(`   ✅ users.json réparé (${fixedUsers} utilisateurs corrigés)\n`);
            
        } catch (error) {
            console.log('   ❌ Erreur réparation users.json:', error.message);
            this.errors.push({ file: 'users.json', error: error.message });
        }
    }

    async fixEmptyFiles() {
        console.log('5️⃣ Réparation fichiers vides...');
        
        const emptyFilesConfig = {
            'error_logs.json': [],
            'gifted_objects.json': {},
            'levels.json': {}
        };
        
        for (const [filename, defaultData] of Object.entries(emptyFilesConfig)) {
            try {
                const filePath = path.join(__dirname, '..', 'data', filename);
                
                // Vérifier si le fichier est vide ou invalide
                let needsRepair = false;
                try {
                    const data = await fs.readFile(filePath, 'utf8');
                    const parsed = JSON.parse(data);
                    
                    // Si c'est un objet vide ou un tableau vide, c'est OK
                    if (data.trim() === '' || data.trim() === '{}' || data.trim() === '[]') {
                        needsRepair = false;
                    }
                } catch {
                    needsRepair = true;
                }
                
                if (needsRepair) {
                    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
                    this.fixedFiles.push(filename);
                    console.log(`   ✅ ${filename} réparé avec données par défaut`);
                } else {
                    console.log(`   ✅ ${filename} déjà valide`);
                }
                
            } catch (error) {
                console.log(`   ❌ Erreur réparation ${filename}:`, error.message);
                this.errors.push({ file: filename, error: error.message });
            }
        }
        console.log('');
    }

    generateReport() {
        console.log('📋 === RAPPORT DE RÉPARATION ===\n');
        
        if (this.fixedFiles.length > 0) {
            console.log('✅ FICHIERS RÉPARÉS:');
            this.fixedFiles.forEach((file, index) => {
                console.log(`   ${index + 1}. ${file}`);
            });
            console.log('');
        }
        
        if (this.errors.length > 0) {
            console.log('❌ ERREURS RENCONTRÉES:');
            this.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.file}: ${error.error}`);
            });
            console.log('');
        }
        
        console.log('🎯 RÉSUMÉ:');
        console.log(`   • ${this.fixedFiles.length} fichier(s) réparé(s)`);
        console.log(`   • ${this.errors.length} erreur(s) rencontrée(s)`);
        
        if (this.fixedFiles.length > 0) {
            console.log('\n🎉 Réparation terminée avec succès !');
            console.log('💡 Redémarrez le bot pour appliquer les corrections.');
        }
    }

    async createBackupBeforeRepair() {
        console.log('💾 Création sauvegarde avant réparation...');
        
        try {
            const backupDir = path.join(__dirname, '..', 'data', 'backups');
            await fs.mkdir(backupDir, { recursive: true });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `pre-repair-${timestamp}`;
            const backupPath = path.join(backupDir, backupName);
            
            await fs.mkdir(backupPath, { recursive: true });
            
            // Copier tous les fichiers JSON critiques
            const criticalFiles = [
                'config.json', 'economy.json', 'shop.json', 'users.json',
                'error_logs.json', 'gifted_objects.json', 'levels.json'
            ];
            
            let backedUpFiles = 0;
            for (const filename of criticalFiles) {
                try {
                    const sourcePath = path.join(__dirname, '..', 'data', filename);
                    const destPath = path.join(backupPath, filename);
                    
                    await fs.copyFile(sourcePath, destPath);
                    backedUpFiles++;
                } catch (error) {
                    // Fichier n'existe pas, c'est OK
                }
            }
            
            console.log(`   ✅ ${backedUpFiles} fichiers sauvegardés dans ${backupName}\n`);
            return backupPath;
            
        } catch (error) {
            console.log('   ⚠️ Erreur création sauvegarde:', error.message);
            return null;
        }
    }
}

module.exports = new DataIntegrityFixer();

// Si exécuté directement
if (require.main === module) {
    const fixer = new DataIntegrityFixer();
    
    fixer.createBackupBeforeRepair()
        .then(() => fixer.fixAllDataFiles())
        .then((result) => {
            console.log(`\n🏁 Réparation terminée: ${result.fixed} fichiers réparés, ${result.errors} erreurs`);
            process.exit(result.errors > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('❌ Erreur critique:', error);
            process.exit(1);
        });
}