
const dataManager = require('./utils/dataManager.js');

console.log('🔄 Début de la migration des compteurs de messages...');

try {
    // Migration des données de user_stats.json
    dataManager.migrateMessageStats();
    
    // Vérification et affichage des résultats
    const users = dataManager.loadData('users.json', {});
    let totalUsers = 0;
    let usersWithMessages = 0;
    
    for (const [key, user] of Object.entries(users)) {
        if (key.includes('_')) {
            totalUsers++;
            if (user.messageCount > 0) {
                usersWithMessages++;
            }
        }
    }
    
    console.log(`📊 Résultats de la migration :`);
    console.log(`   Total utilisateurs: ${totalUsers}`);
    console.log(`   Utilisateurs avec messages: ${usersWithMessages}`);
    console.log(`✅ Migration des compteurs de messages terminée !`);
    
} catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
}
