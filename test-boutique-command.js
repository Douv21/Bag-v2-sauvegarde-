/**
 * Test direct de la commande boutique pour diagnostiquer le problème
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 === TEST DIRECT DE LA COMMANDE BOUTIQUE ===\n');

const GUILD_ID = '1360897918504271882';

try {
    // 1. Test du fichier shop.json
    console.log('1️⃣ Test du fichier shop.json...');
    const shopPath = path.join(__dirname, 'data', 'shop.json');
    
    if (!fs.existsSync(shopPath)) {
        console.log('❌ Fichier shop.json manquant !');
        return;
    }

    const shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
    const allShopItems = shopData[GUILD_ID] || [];
    
    console.log(`✅ ${allShopItems.length} articles trouvés`);

    // 2. Test de la logique de catégorisation (copie de boutique.js)
    console.log('\n2️⃣ Test de la logique de catégorisation...');
    
    const isCustom = (t) => t === 'custom_object' || t === 'custom' || t === 'text' || !t;
    const isTempRole = (t) => t === 'temporary_role' || t === 'temp_role';
    const isPermRole = (t) => t === 'permanent_role' || t === 'perm_role';
    const isSuite = (t) => t === 'private_24h' || t === 'private_monthly' || t === 'private_permanent';
    const isCooldownReduction = (t) => t === 'cooldown_reduction';
    const deriveCategoryFromType = (t) => {
        if (isSuite(t)) return 'Suites privées';
        if (isTempRole(t) || isPermRole(t)) return 'Rôles';
        if (isCooldownReduction(t)) return 'Réductions de Cooldown';
        if (isCustom(t)) return 'Objets personnalisés';
        return 'Autres';
    };

    const categoriesMap = allShopItems.reduce((acc, item) => {
        const raw = typeof item.category === 'string' ? item.category.trim() : '';
        const cat = raw && raw.length > 0 ? raw : deriveCategoryFromType(item.type);
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    const categories = Object.entries(categoriesMap);
    const shopHasItems = categories.length > 0;

    console.log(`✅ shopHasItems: ${shopHasItems}`);
    console.log(`✅ Catégories trouvées: ${categories.length}`);

    // 3. Afficher les catégories
    console.log('\n3️⃣ Catégories détectées:');
    categories.forEach(([catName, items]) => {
        console.log(`  📂 "${catName}": ${items.length} articles`);
        items.forEach(item => {
            console.log(`    - ${item.name} (${item.type})`);
        });
    });

    // 4. Test de la fonction renderLine
    console.log('\n4️⃣ Test du rendu des articles...');
    
    const renderLine = (item) => {
        let typeIcon = '🏆';
        let typeText = 'Objet virtuel';
        if (isTempRole(item.type)) {
            typeIcon = '⌛';
            typeText = `Rôle temporaire (${item.duration}j)`;
        } else if (isPermRole(item.type)) {
            typeIcon = '⭐';
            typeText = 'Rôle permanent';
        } else if (isCooldownReduction(item.type)) {
            if (item.reductionPercent === 100) {
                typeIcon = '🚀';
                typeText = `Actions illimitées (${item.durationDays}j)`;
            } else if (item.reductionPercent === 75) {
                typeIcon = '⚡';
                typeText = `Réduction 75% cooldowns (${item.durationDays}j)`;
            } else {
                typeIcon = '🔥';
                typeText = `Réduction 50% cooldowns (${item.durationDays}j)`;
            }
        } else if (isCustom(item.type)) {
            typeIcon = '🎨';
            typeText = 'Objet personnalisé';
        } else if (item.type === 'private_24h') {
            typeIcon = '🔒';
            typeText = 'Suite privée 24h (texte NSFW + vocal)';
        } else if (item.type === 'private_monthly') {
            typeIcon = '🗓️';
            typeText = 'Suite privée 30j (texte NSFW + vocal)';
        } else if (item.type === 'private_permanent') {
            typeIcon = '♾️';
            typeText = 'Suite privée permanente (texte NSFW + vocal)';
        }
        
        const priceText = `${item.price}💋`;
        return `${typeIcon} **${item.name}** - ${priceText}\n${typeText}\n*${item.description || 'Aucune description'}*`;
    };

    // Tester le rendu du premier article de chaque catégorie
    categories.forEach(([catName, items]) => {
        if (items.length > 0) {
            const firstItem = items[0];
            console.log(`\n📝 Rendu de "${firstItem.name}":`);
            try {
                const rendered = renderLine(firstItem);
                console.log(rendered);
            } catch (error) {
                console.log(`❌ Erreur rendu: ${error.message}`);
            }
        }
    });

    console.log('\n✅ Test terminé avec succès !');

} catch (error) {
    console.error('❌ Erreur durant le test:', error);
    console.error('Stack:', error.stack);
}