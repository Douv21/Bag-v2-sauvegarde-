
// Script de migration pour unifier les données utilisateur
const dataManager = require('./utils/dataManager');

async function migrateAllData() {
    console.log('🔄 Début de la migration des données...');
    
    try {
        // Forcer la migration
        dataManager.migrateEconomyData();
        
        // Vérifier la cohérence des données
        const users = dataManager.loadData('users.json', {});
        let fixed = 0;
        
        for (const [key, user] of Object.entries(users)) {
            let needsUpdate = false;
            
            // Vérifier la structure de la clé
            const parts = key.split('_');
            if (parts.length !== 2) {
                console.log(`⚠️ Clé incorrecte détectée: ${key}`);
                continue;
            }
            
            // Synchroniser les propriétés karma
            if (user.goodKarma !== user.karmaGood) {
                user.goodKarma = Math.max(user.goodKarma || 0, user.karmaGood || 0);
                user.karmaGood = user.goodKarma;
                needsUpdate = true;
            }
            
            if (user.badKarma !== user.karmaBad) {
                user.badKarma = Math.max(user.badKarma || 0, user.karmaBad || 0);
                user.karmaBad = user.badKarma;
                needsUpdate = true;
            }
            
            // Ajouter propriétés manquantes
            if (!user.id) {
                user.id = parts[0];
                needsUpdate = true;
            }
            
            if (!user.guildId) {
                user.guildId = parts[1];
                needsUpdate = true;
            }
            
            if (!user.createdAt) {
                user.createdAt = new Date().toISOString();
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                user.updatedAt = new Date().toISOString();
                users[key] = user;
                fixed++;
            }
        }
        
        if (fixed > 0) {
            dataManager.saveData('users.json', users);
            console.log(`✅ Migration terminée: ${fixed} utilisateurs corrigés`);
        } else {
            console.log('✅ Migration terminée: aucune correction nécessaire');
        }
        
        // Afficher statistiques
        console.log(`📊 Total utilisateurs: ${Object.keys(users).length}`);
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
    }
}

// Exécuter la migration
migrateAllData();
