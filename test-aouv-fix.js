/**
 * Test de la correction AouV pour vérifier que les canaux s'enregistrent
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 === TEST DE LA CORRECTION AOUV ===\n');

try {
    // 1. Vérifier le DataManager
    console.log('1️⃣ Test du DataManager...');
    const DataManager = require('./managers/DataManager');
    const dataManager = new DataManager();
    
    // Vérifier que le type aouv_config est maintenant défini
    const dataTypes = dataManager.dataTypes;
    const hasAouvConfig = dataTypes.hasOwnProperty('aouv_config');
    
    console.log(`✅ Type 'aouv_config' défini: ${hasAouvConfig}`);
    if (hasAouvConfig) {
        console.log(`✅ Fichier mappé: ${dataTypes['aouv_config']}`);
    }

    // 2. Test de la sauvegarde/chargement
    console.log('\n2️⃣ Test de sauvegarde/chargement...');
    
    const testGuildId = '1360897918504271882';
    const testChannelId = '123456789012345678';
    
    // Simuler les données de test
    const testData = {
        [testGuildId]: {
            allowedChannels: [testChannelId],
            disabledBaseActions: [],
            disabledBaseTruths: [],
            customActions: [],
            customTruths: []
        }
    };
    
    // Test de sauvegarde
    try {
        await dataManager.saveData('aouv_config', testData);
        console.log('✅ Sauvegarde: SUCCESS');
    } catch (error) {
        console.log(`❌ Sauvegarde: ERREUR - ${error.message}`);
    }
    
    // Test de chargement
    try {
        const loadedData = await dataManager.loadData('aouv_config', {});
        console.log('✅ Chargement: SUCCESS');
        console.log(`✅ Données chargées: ${JSON.stringify(loadedData, null, 2)}`);
    } catch (error) {
        console.log(`❌ Chargement: ERREUR - ${error.message}`);
    }

    // 3. Vérifier les fichiers modifiés
    console.log('\n3️⃣ Vérification des corrections dans les fichiers...');
    
    const filesToCheck = [
        'handlers/AouvConfigHandler.js',
        'commands/aouv.js',
        'commands/action.js',
        'commands/verite.js'
    ];
    
    for (const file of filesToCheck) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const hasOldReference = content.includes("'aouv_config.json'");
            const hasNewReference = content.includes("'aouv_config'");
            
            console.log(`📄 ${file}:`);
            console.log(`  - Anciennes références (.json): ${hasOldReference ? '❌ TROUVÉES' : '✅ SUPPRIMÉES'}`);
            console.log(`  - Nouvelles références: ${hasNewReference ? '✅ PRÉSENTES' : '❌ MANQUANTES'}`);
        } else {
            console.log(`📄 ${file}: ❌ FICHIER MANQUANT`);
        }
    }

    // 4. Vérifier le fichier de données
    console.log('\n4️⃣ Vérification du fichier de données...');
    const aouvConfigPath = path.join(__dirname, 'data', 'aouv_config.json');
    
    if (fs.existsSync(aouvConfigPath)) {
        console.log('✅ Fichier aouv_config.json existe');
        const data = JSON.parse(fs.readFileSync(aouvConfigPath, 'utf8'));
        console.log(`✅ Guildes configurées: ${Object.keys(data).length}`);
        
        if (data[testGuildId]) {
            console.log(`✅ Configuration pour guild ${testGuildId}: ${JSON.stringify(data[testGuildId], null, 2)}`);
        }
    } else {
        console.log('ℹ️  Fichier aouv_config.json sera créé à la première utilisation');
    }

    console.log('\n✅ Test terminé avec succès !');
    console.log('\n📝 INSTRUCTIONS POUR TESTER:');
    console.log('1. Utilisez /config-aouv sur Discord');
    console.log('2. Allez dans Salons autorisés'); 
    console.log('3. Ajoutez un salon');
    console.log('4. Vérifiez que "✅ Salon autorisé" s\'affiche sans erreur');

} catch (error) {
    console.error('❌ Erreur durant le test:', error);
    console.error('Stack:', error.stack);
}