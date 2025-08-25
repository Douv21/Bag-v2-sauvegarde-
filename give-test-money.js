/**
 * Script pour donner de l'argent de test pour pouvoir acheter les articles de cooldown
 */

const fs = require('fs');
const path = require('path');

const GUILD_ID = '1360897918504271882';
const USER_ID = '1394318358228369538'; // Remplacez par votre vrai user ID Discord

async function giveTestMoney() {
    try {
        console.log('💰 Attribution d\'argent de test...\n');

        // Charger les données utilisateurs
        const usersPath = path.join(__dirname, 'data', 'users.json');
        let usersData = {};
        
        if (fs.existsSync(usersPath)) {
            const rawData = fs.readFileSync(usersPath, 'utf8');
            usersData = JSON.parse(rawData);
        }

        // Créer la clé guild-user
        const userKey = `${GUILD_ID}_${USER_ID}`;
        
        // Initialiser les données utilisateur si elles n'existent pas
        if (!usersData[userKey]) {
            usersData[userKey] = {
                userId: USER_ID,
                guildId: GUILD_ID,
                balance: 0,
                goodKarma: 0,
                badKarma: 0,
                inventory: []
            };
        }

        // Ajouter de l'argent de test
        const testAmount = 10000; // 10,000💋 pour tester tous les articles
        usersData[userKey].balance = (usersData[userKey].balance || 0) + testAmount;

        // Sauvegarder
        fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));

        console.log(`✅ ${testAmount}💋 ajoutés à votre compte !`);
        console.log(`💳 Nouveau solde: ${usersData[userKey].balance}💋`);
        
        console.log('\n🛒 Vous pouvez maintenant:');
        console.log('1. Utiliser /boutique pour voir tous les articles');
        console.log('2. Acheter un article de réduction de cooldown');
        console.log('3. Tester /travailler pour voir l\'effet !');

        console.log('\n📦 Articles disponibles:');
        console.log('- 🔥 50% - 1 jour: 100💋');
        console.log('- 🔥 50% - 1 semaine: 500💋');
        console.log('- ⚡ 75% - 1 jour: 250💋');
        console.log('- 🚀 Illimité - 1 jour: 500💋');

    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

// Demander l'user ID si vous voulez le changer
if (process.argv[2]) {
    const customUserId = process.argv[2];
    console.log(`🎯 Utilisation de l'user ID: ${customUserId}`);
    // Vous pouvez modifier le script pour utiliser l'ID personnalisé
}

giveTestMoney();