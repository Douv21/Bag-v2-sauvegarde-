/**
 * Debug direct de la configuration AouV
 */

const DataManager = require('./managers/DataManager');

async function debugAouvConfig() {
    console.log('🧪 === DEBUG CONFIGURATION AOUV ===\n');
    
    try {
        const dataManager = new DataManager();
        const guildId = '1360897918504271882';
        
        console.log('1️⃣ Test direct loadData...');
        const config = await dataManager.loadData('aouv_config', {});
        console.log('✅ Données brutes chargées:', JSON.stringify(config, null, 2));
        
        console.log('\n2️⃣ Test de la fonction getGuildConfig...');
        async function getGuildConfig(dataManager, guildId) {
            const config = await dataManager.loadData('aouv_config', {});
            return config[guildId] || {
                allowedChannels: [],
                disabledBaseActions: [],
                disabledBaseTruths: [],
                customActions: [],
                customTruths: [],
                baseActionOverrides: {},
                baseTruthOverrides: {},
                // NSFW
                nsfwAllowedChannels: [],
                nsfwDisabledBaseActions: [],
                nsfwDisabledBaseTruths: [],
                nsfwCustomActions: [],
                nsfwCustomTruths: [],
                nsfwBaseActionOverrides: {},
                nsfwBaseTruthOverrides: {}
            };
        }
        
        const guildConfig = await getGuildConfig(dataManager, guildId);
        console.log('✅ Configuration guild:', JSON.stringify(guildConfig, null, 2));
        
        console.log('\n3️⃣ Test direct du fichier...');
        const fs = require('fs');
        const rawFile = fs.readFileSync('./data/aouv_config.json', 'utf8');
        console.log('✅ Contenu fichier brut:', rawFile);
        
        console.log('\n4️⃣ Test des types de données DataManager...');
        console.log('✅ Type aouv_config dans dataTypes:', dataManager.dataTypes['aouv_config']);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        console.error('Stack:', error.stack);
    }
}

debugAouvConfig();