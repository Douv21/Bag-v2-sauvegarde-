/**
 * Test rapide pour vérifier si AouV peut sauvegarder maintenant
 */

const DataManager = require('./managers/DataManager');

async function testAouvSave() {
    console.log('🧪 === TEST SAUVEGARDE AOUV ===\n');
    
    try {
        const dataManager = new DataManager();
        const testGuildId = '1360897918504271882';
        const testChannelId = '999999999999999999';
        
        console.log('1️⃣ Test de chargement...');
        const data = await dataManager.loadData('aouv_config', {});
        console.log('✅ Chargement réussi:', Object.keys(data).length, 'guildes');
        
        console.log('\n2️⃣ Test de sauvegarde...');
        const testData = {
            ...data,
            [testGuildId]: {
                allowedChannels: [testChannelId],
                disabledBaseActions: [],
                disabledBaseTruths: [],
                customActions: [],
                customTruths: []
            }
        };
        
        await dataManager.saveData('aouv_config', testData);
        console.log('✅ Sauvegarde réussie !');
        
        console.log('\n3️⃣ Vérification...');
        const verifyData = await dataManager.loadData('aouv_config', {});
        const hasTestGuild = verifyData[testGuildId] !== undefined;
        console.log('✅ Données persistées:', hasTestGuild);
        
        if (hasTestGuild) {
            console.log('✅ Canaux sauvegardés:', verifyData[testGuildId].allowedChannels);
        }
        
        console.log('\n🎉 SUCCÈS ! Le système AouV fonctionne maintenant !');
        
    } catch (error) {
        console.error('❌ ÉCHEC:', error.message);
        console.error('Stack:', error.stack);
    }
}

testAouvSave();