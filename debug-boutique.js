/**
 * Script de debug pour vérifier pourquoi les articles de cooldown n'apparaissent pas
 */

const fs = require('fs');
const path = require('path');

const GUILD_ID = '1360897918504271882';

function debugBoutique() {
    console.log('🔍 === DEBUG BOUTIQUE ===\n');

    try {
        // 1. Vérifier le fichier shop.json
        const shopPath = path.join(__dirname, 'data', 'shop.json');
        console.log('📂 1. Lecture du fichier shop.json...');
        
        if (!fs.existsSync(shopPath)) {
            console.log('❌ Fichier shop.json n\'existe pas !');
            return;
        }

        const shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
        const guildItems = shopData[GUILD_ID] || [];
        
        console.log(`✅ Fichier trouvé avec ${guildItems.length} articles pour la guild ${GUILD_ID}`);

        // 2. Lister tous les articles
        console.log('\n📋 2. Articles dans la boutique:');
        guildItems.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.name} (${item.type}) - ${item.price}💋`);
            if (item.category) {
                console.log(`     └─ Catégorie: "${item.category}"`);
            }
        });

        // 3. Filtrer les articles de cooldown
        const cooldownItems = guildItems.filter(item => item.type === 'cooldown_reduction');
        console.log(`\n⚡ 3. Articles de cooldown trouvés: ${cooldownItems.length}`);
        
        cooldownItems.forEach(item => {
            console.log(`  - ${item.name}: ${item.reductionPercent}% pendant ${item.durationDays}j`);
        });

        // 4. Simuler la logique de catégorisation de boutique.js
        console.log('\n🏷️  4. Test de catégorisation:');
        
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

        const categoriesMap = guildItems.reduce((acc, item) => {
            const raw = typeof item.category === 'string' ? item.category.trim() : '';
            const cat = raw && raw.length > 0 ? raw : deriveCategoryFromType(item.type);
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {});

        console.log('Catégories créées:');
        Object.keys(categoriesMap).forEach(catName => {
            console.log(`  - "${catName}": ${categoriesMap[catName].length} articles`);
            categoriesMap[catName].forEach(item => {
                console.log(`    └─ ${item.name} (${item.type})`);
            });
        });

        // 5. Test spécifique pour les cooldowns
        console.log('\n🧪 5. Test spécifique cooldown_reduction:');
        const testType = 'cooldown_reduction';
        console.log(`isCooldownReduction("${testType}"): ${isCooldownReduction(testType)}`);
        console.log(`deriveCategoryFromType("${testType}"): ${deriveCategoryFromType(testType)}`);

        // 6. Vérification des données utilisateur (pour l'affichage)
        console.log('\n👤 6. Test données utilisateur:');
        const usersPath = path.join(__dirname, 'data', 'users.json');
        if (fs.existsSync(usersPath)) {
            const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
            console.log(`✅ Fichier users.json trouvé avec ${Object.keys(usersData).length} utilisateurs`);
        } else {
            console.log('❌ Fichier users.json n\'existe pas');
        }

    } catch (error) {
        console.error('❌ Erreur durant le debug:', error);
    }
}

debugBoutique();