#!/usr/bin/env node

// Test rapide de connexion MongoDB pour Render
const { MongoClient } = require('mongodb');

async function testMongoDB() {
    const username = process.env.MONGODB_USERNAME;
    const password = process.env.MONGODB_PASSWORD;
    const clusterUrl = process.env.MONGODB_CLUSTER_URL;
    
    if (!username || !password || !clusterUrl) {
        console.log('❌ Variables MongoDB manquantes');
        console.log('Configurez: MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_CLUSTER_URL');
        process.exit(1);
    }
    
    const connectionString = `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${clusterUrl}/bagbot?retryWrites=true&w=majority`;
    
    console.log('🔄 Test connexion MongoDB...');
    console.log(`📡 Cluster: ${clusterUrl}`);
    console.log(`👤 Utilisateur: ${username}`);
    
    try {
        const client = new MongoClient(connectionString, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000
        });
        
        await client.connect();
        await client.db('bagbot').command({ ping: 1 });
        
        console.log('✅ Connexion MongoDB réussie !');
        console.log('🎉 Sauvegarde cloud opérationnelle');
        
        await client.close();
        process.exit(0);
        
    } catch (error) {
        console.log('❌ Erreur connexion:', error.message);
        
        if (error.message.includes('authentication')) {
            console.log('🔐 Problème d\'authentification:');
            console.log('   - Vérifiez le nom d\'utilisateur et mot de passe');
            console.log('   - L\'utilisateur doit avoir les permissions "readWrite"');
        } else if (error.message.includes('network')) {
            console.log('🌐 Problème réseau:');
            console.log('   - Vérifiez l\'URL du cluster');
            console.log('   - Autorisez toutes les IP (0.0.0.0/0)');
        }
        
        process.exit(1);
    }
}

testMongoDB();