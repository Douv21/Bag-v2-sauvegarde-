/**
 * Script pour ajouter automatiquement des articles de réduction de cooldown dans la boutique
 */

const fs = require('fs');
const path = require('path');

const GUILD_ID = '1360897918504271882';

// Articles de réduction de cooldown à ajouter
const cooldownItems = [
    {
        id: Date.now().toString() + '_cd50_1d',
        type: 'cooldown_reduction',
        name: '🔥 50% de réduction - 1 jour',
        price: 100,
        description: 'Réduit de 50% tous les cooldowns pendant 24h',
        category: 'Réductions de Cooldown',
        reductionPercent: 50,
        durationDays: 1,
        created: new Date().toISOString()
    },
    {
        id: Date.now().toString() + '_cd50_1w',
        type: 'cooldown_reduction', 
        name: '🔥 50% de réduction - 1 semaine',
        price: 500,
        description: 'Réduit de 50% tous les cooldowns pendant 7 jours',
        category: 'Réductions de Cooldown',
        reductionPercent: 50,
        durationDays: 7,
        created: new Date().toISOString()
    },
    {
        id: Date.now().toString() + '_cd75_1d',
        type: 'cooldown_reduction',
        name: '⚡ 75% de réduction - 1 jour', 
        price: 250,
        description: 'Réduit de 75% tous les cooldowns pendant 24h',
        category: 'Réductions de Cooldown',
        reductionPercent: 75,
        durationDays: 1,
        created: new Date().toISOString()
    },
    {
        id: Date.now().toString() + '_cd100_1d',
        type: 'cooldown_reduction',
        name: '🚀 Actions illimitées - 1 jour',
        price: 500, 
        description: 'Supprime tous les cooldowns pendant 24h',
        category: 'Réductions de Cooldown',
        reductionPercent: 100,
        durationDays: 1,
        created: new Date().toISOString()
    }
];

async function addCooldownItemsToShop() {
    try {
        console.log('📦 Ajout d\'articles de réduction de cooldown...\n');

        // Lire le fichier shop.json actuel
        const shopPath = path.join(__dirname, 'data', 'shop.json');
        let shopData = {};
        
        if (fs.existsSync(shopPath)) {
            const rawData = fs.readFileSync(shopPath, 'utf8');
            shopData = JSON.parse(rawData);
        }

        // Initialiser le tableau pour la guilde si nécessaire
        if (!shopData[GUILD_ID]) {
            shopData[GUILD_ID] = [];
        }

        // Vérifier s'il y a déjà des articles de cooldown
        const existingCooldownItems = shopData[GUILD_ID].filter(item => item.type === 'cooldown_reduction');
        
        if (existingCooldownItems.length > 0) {
            console.log(`⚠️  Il y a déjà ${existingCooldownItems.length} article(s) de cooldown dans la boutique.`);
            console.log('Articles existants:');
            existingCooldownItems.forEach(item => {
                console.log(`  - ${item.name} (${item.price}💋)`);
            });
            console.log('\n🤔 Voulez-vous vraiment en ajouter d\'autres ?');
            return;
        }

        // Ajouter les nouveaux articles
        cooldownItems.forEach(item => {
            shopData[GUILD_ID].push(item);
            console.log(`✅ Ajouté: ${item.name} - ${item.price}💋`);
        });

        // Sauvegarder le fichier
        fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));
        
        console.log(`\n🎉 ${cooldownItems.length} articles de réduction de cooldown ajoutés avec succès !`);
        console.log('\n📋 Vous pouvez maintenant:');
        console.log('1. Utiliser /boutique pour voir les nouveaux articles');
        console.log('2. Acheter un article de réduction');
        console.log('3. Tester /travailler pour voir la réduction appliquée');

    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout des articles:', error);
    }
}

addCooldownItemsToShop();