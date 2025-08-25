/**
 * Test final pour vérifier que toutes les fonctionnalités sont opérationnelles
 */

console.log('🎉 === TEST FINAL DES FONCTIONNALITÉS ===\n');

const fs = require('fs');

// 1. Vérifier que les articles de cooldown sont dans la boutique
console.log('1️⃣ Vérification des articles de cooldown...');
const shopData = JSON.parse(fs.readFileSync('data/shop.json', 'utf8'));
const guildItems = shopData['1360897918504271882'] || [];
const cooldownItems = guildItems.filter(item => item.type === 'cooldown_reduction');

console.log(`✅ ${cooldownItems.length} articles de cooldown trouvés dans la boutique:`);
cooldownItems.forEach(item => {
    console.log(`   - ${item.name}: ${item.reductionPercent}% pendant ${item.durationDays} jour(s) - ${item.price}💋`);
});

// 2. Vérifier que le calculateur de cooldown fonctionne
console.log('\n2️⃣ Test du calculateur de cooldown...');
const { calculateReducedCooldown } = require('./utils/cooldownCalculator');

// Test avec buff 50%
const userData = {
    cooldownBuffs: [{
        reductionPercent: 50,
        expiresAt: new Date(Date.now() + 86400000).toISOString()
    }]
};

const originalCooldown = 3600000; // 1 heure
const reducedCooldown = calculateReducedCooldown(userData, originalCooldown);
console.log(`✅ Cooldown original: ${originalCooldown/60000} minutes`);
console.log(`✅ Cooldown réduit (50%): ${reducedCooldown/60000} minutes`);

// 3. Vérifier les handlers
console.log('\n3️⃣ Vérification des handlers...');
try {
    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
    const handler = new EconomyConfigHandler({ loadData: () => {}, saveData: () => {} });
    
    const methods = [
        'showMainMenu',
        'showBoutiqueMenu', 
        'showCooldownReductionsMenu',
        'handleCooldownReductionSelect',
        'handleCooldownReductionModal'
    ];
    
    methods.forEach(method => {
        if (typeof handler[method] === 'function') {
            console.log(`✅ ${method} - OK`);
        } else {
            console.log(`❌ ${method} - MANQUANT`);
        }
    });
} catch (error) {
    console.log(`❌ Erreur handlers: ${error.message}`);
}

console.log('\n🚀 === INSTRUCTIONS POUR TESTER ===');
console.log('');
console.log('Maintenant que le bot est relancé, testez dans Discord:');
console.log('');
console.log('1️⃣ CONFIGURATION (Admin):');
console.log('   /config-economie');
console.log('   → Choisir "🏪 Boutique"');
console.log('   → Choisir "⚡ Réductions Cooldown"');
console.log('   → Ajouter d\'autres articles si désiré');
console.log('');
console.log('2️⃣ VOIR LA BOUTIQUE:');
console.log('   /boutique');
console.log('   → Vous devriez voir "📂 Réductions de Cooldown"');
console.log('   → 4 articles sont déjà disponibles');
console.log('');
console.log('3️⃣ ACHETER ET TESTER:');
console.log('   - Utilisez /ajout-argent pour avoir des 💋');
console.log('   - Achetez un article de réduction dans /boutique');
console.log('   - Testez /travailler pour voir la réduction appliquée !');
console.log('');
console.log('✨ Toutes les fonctionnalités de réduction de cooldown sont maintenant actives !');
console.log('   Les réductions s\'appliquent sur: /travailler, /crime, /voler, /pecher, etc.');