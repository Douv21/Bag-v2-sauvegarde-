/**
 * Script pour ajouter des objets personnalisés de test dans la boutique
 */

const fs = require('fs');
const path = require('path');

const GUILD_ID = '1360897918504271882';

// Objets personnalisés de test
const customObjects = [
    {
        id: Date.now().toString() + '_custom1',
        type: 'custom_object',
        name: '💎 Collier de Séduction',
        price: 150,
        description: 'Un magnifique collier qui augmente votre charme naturel',
        category: 'Objets personnalisés',
        created: new Date().toISOString()
    },
    {
        id: Date.now().toString() + '_custom2',
        type: 'custom_object',
        name: '🌹 Bouquet de Roses Éternelles',
        price: 200,
        description: 'Des roses qui ne fanent jamais, symbole d\'amour éternel',
        category: 'Objets personnalisés',
        created: new Date().toISOString()
    },
    {
        id: Date.now().toString() + '_custom3',
        type: 'custom_object',
        name: '🍷 Bouteille de Champagne Premium',
        price: 300,
        description: 'Une bouteille exclusive pour célébrer les moments spéciaux',
        category: 'Objets personnalisés',
        created: new Date().toISOString()
    },
    {
        id: Date.now().toString() + '_custom4',
        type: 'text',
        name: '💌 Message Personnalisé',
        price: 50,
        description: 'Envoyez un message personnalisé à quelqu\'un de spécial',
        category: 'Objets personnalisés',
        created: new Date().toISOString()
    }
];

async function addCustomObjects() {
    try {
        console.log('🎨 Ajout d\'objets personnalisés de test...\n');

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

        // Vérifier les objets personnalisés existants
        const existingCustomItems = shopData[GUILD_ID].filter(item => 
            item.type === 'custom_object' || item.type === 'custom' || item.type === 'text'
        );
        
        console.log(`🔍 Objets personnalisés existants: ${existingCustomItems.length}`);

        // Ajouter les nouveaux objets personnalisés
        console.log('\n➕ Ajout des objets personnalisés:');
        customObjects.forEach(item => {
            shopData[GUILD_ID].push(item);
            console.log(`✅ Ajouté: ${item.name} - ${item.price}💋`);
        });

        // Sauvegarder le fichier
        fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));
        
        console.log(`\n🎉 ${customObjects.length} objets personnalisés ajoutés avec succès !`);
        console.log('\n📋 Récapitulatif de la boutique:');
        
        // Statistiques par catégorie
        const allItems = shopData[GUILD_ID];
        const cooldownItems = allItems.filter(item => item.type === 'cooldown_reduction');
        const customItems = allItems.filter(item => item.type === 'custom_object' || item.type === 'custom' || item.type === 'text');
        const suiteItems = allItems.filter(item => item.type.startsWith('private_'));
        
        console.log(`⚡ Réductions de Cooldown: ${cooldownItems.length} articles`);
        console.log(`🎨 Objets personnalisés: ${customItems.length} articles`);
        console.log(`🔒 Suites privées: ${suiteItems.length} articles`);
        console.log(`📦 Total: ${allItems.length} articles`);

    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout des objets:', error);
    }
}

addCustomObjects();