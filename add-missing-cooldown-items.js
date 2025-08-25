/**
 * Script pour ajouter les articles de cooldown manquants
 */

const fs = require('fs');
const path = require('path');

const GUILD_ID = '1360897918504271882';

// Articles manquants à ajouter
const missingCooldownItems = [
    {
        id: Date.now().toString() + '_cd50_1m',
        type: 'cooldown_reduction',
        name: '🔥 50% de réduction - 1 mois',
        price: 1500,
        description: 'Réduit de 50% tous les cooldowns pendant 30 jours',
        category: 'Réductions de Cooldown',
        reductionPercent: 50,
        durationDays: 30,
        created: new Date().toISOString()
    },
    {
        id: Date.now().toString() + '_cd75_1w',
        type: 'cooldown_reduction',
        name: '⚡ 75% de réduction - 1 semaine',
        price: 1250,
        description: 'Réduit de 75% tous les cooldowns pendant 7 jours',
        category: 'Réductions de Cooldown',
        reductionPercent: 75,
        durationDays: 7,
        created: new Date().toISOString()
    },
    {
        id: Date.now().toString() + '_cd75_1m',
        type: 'cooldown_reduction',
        name: '⚡ 75% de réduction - 1 mois',
        price: 3750,
        description: 'Réduit de 75% tous les cooldowns pendant 30 jours',
        category: 'Réductions de Cooldown',
        reductionPercent: 75,
        durationDays: 30,
        created: new Date().toISOString()
    },
    {
        id: Date.now().toString() + '_cd100_1w',
        type: 'cooldown_reduction',
        name: '🚀 Actions illimitées - 1 semaine',
        price: 2500,
        description: 'Supprime tous les cooldowns pendant 7 jours',
        category: 'Réductions de Cooldown',
        reductionPercent: 100,
        durationDays: 7,
        created: new Date().toISOString()
    },
    {
        id: Date.now().toString() + '_cd100_1m',
        type: 'cooldown_reduction',
        name: '🚀 Actions illimitées - 1 mois',
        price: 7500,
        description: 'Supprime tous les cooldowns pendant 30 jours',
        category: 'Réductions de Cooldown',
        reductionPercent: 100,
        durationDays: 30,
        created: new Date().toISOString()
    }
];

async function addMissingCooldownItems() {
    try {
        console.log('📦 Ajout des articles de cooldown manquants...\n');

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

        // Vérifier les articles existants
        const existingCooldownItems = shopData[GUILD_ID].filter(item => item.type === 'cooldown_reduction');
        
        console.log(`🔍 Articles de cooldown existants: ${existingCooldownItems.length}`);
        existingCooldownItems.forEach(item => {
            console.log(`  - ${item.name} (${item.reductionPercent}% - ${item.durationDays}j) - ${item.price}💋`);
        });

        // Ajouter les nouveaux articles
        console.log('\n➕ Ajout des articles manquants:');
        missingCooldownItems.forEach(item => {
            shopData[GUILD_ID].push(item);
            console.log(`✅ Ajouté: ${item.name} - ${item.price}💋`);
        });

        // Sauvegarder le fichier
        fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));
        
        console.log(`\n🎉 ${missingCooldownItems.length} articles ajoutés avec succès !`);
        console.log('\n📋 Récapitulatif complet (9 articles):');
        
        // Afficher tous les articles de cooldown organisés
        const allCooldownItems = shopData[GUILD_ID].filter(item => item.type === 'cooldown_reduction');
        
        console.log('\n🔥 50% de réduction:');
        allCooldownItems.filter(item => item.reductionPercent === 50).forEach(item => {
            console.log(`  - ${item.durationDays}j: ${item.price}💋`);
        });
        
        console.log('\n⚡ 75% de réduction:');
        allCooldownItems.filter(item => item.reductionPercent === 75).forEach(item => {
            console.log(`  - ${item.durationDays}j: ${item.price}💋`);
        });
        
        console.log('\n🚀 100% (illimité):');
        allCooldownItems.filter(item => item.reductionPercent === 100).forEach(item => {
            console.log(`  - ${item.durationDays}j: ${item.price}💋`);
        });

        console.log(`\n✨ Total: ${allCooldownItems.length} articles de cooldown disponibles !`);

    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout des articles:', error);
    }
}

addMissingCooldownItems();