// Diagnostic MongoDB Atlas pour déboguer les problèmes de connexion
const { MongoClient } = require('mongodb');

class MongoDBDiagnostic {
    static async testConnection() {
        console.log('🔍 === DIAGNOSTIC MONGODB ATLAS ===');
        
        // Vérifier les variables d'environnement
        const username = process.env.MONGODB_USERNAME;
        const password = process.env.MONGODB_PASSWORD;
        let clusterUrl = process.env.MONGODB_CLUSTER_URL;
        
        console.log('📋 Variables d\'environnement:');
        console.log(`   Username: ${username ? '✓ ' + username : '✗ Manquant'}`);
        console.log(`   Password: ${password ? '✓ ' + password.length + ' caractères' : '✗ Manquant'}`);
        console.log(`   Cluster: ${clusterUrl ? '✓ ' + clusterUrl : '✗ Manquant'}`);
        
        if (!username || !password || !clusterUrl) {
            console.log('❌ Variables d\'environnement incomplètes');
            return false;
        }
        
        // Nettoyer l'URL du cluster
        if (clusterUrl.includes('mongodb+srv://')) {
            const match = clusterUrl.match(/@([^\/\?]+)/);
            if (match) {
                clusterUrl = match[1];
                console.log(`🧹 URL nettoyée: ${clusterUrl}`);
            }
        }
        
        // Construire la chaîne de connexion
        const connectionString = `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${clusterUrl}/bagbot?retryWrites=true&w=majority`;
        console.log(`🔗 Chaîne de connexion: mongodb+srv://${username}:***@${clusterUrl}/bagbot`);
        
        try {
            console.log('🔄 Tentative de connexion...');
            const client = new MongoClient(connectionString, {
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000,
                maxPoolSize: 10
            });
            
            await client.connect();
            console.log('✅ Connexion établie');
            
            // Test ping
            console.log('🏓 Test ping...');
            await client.db('admin').command({ ping: 1 });
            console.log('✅ Ping réussi');
            
            // Test base de données
            console.log('🗄️  Test accès base de données bagbot...');
            const db = client.db('bagbot');
            const collections = await db.listCollections().toArray();
            console.log(`✅ Base bagbot accessible - ${collections.length} collections`);
            
            // Test écriture
            console.log('✍️  Test écriture...');
            const testCollection = db.collection('test');
            await testCollection.insertOne({ test: true, timestamp: new Date() });
            console.log('✅ Écriture réussie');
            
            // Nettoyage
            await testCollection.deleteMany({ test: true });
            await client.close();
            
            console.log('🎉 MongoDB Atlas complètement fonctionnel !');
            return true;
            
        } catch (error) {
            console.log(`❌ Erreur de connexion: ${error.message}`);
            
            // Diagnostics spécifiques
            if (error.message.includes('Authentication failed')) {
                console.log('💡 Solutions possibles:');
                console.log('   1. Vérifiez le nom d\'utilisateur et mot de passe dans MongoDB Atlas');
                console.log('   2. Assurez-vous que l\'utilisateur a les permissions "readWrite"');
                console.log('   3. Vérifiez que l\'utilisateur est bien créé dans la base "bagbot"');
            }
            
            if (error.message.includes('network') || error.message.includes('timeout')) {
                console.log('💡 Solutions possibles:');
                console.log('   1. Ajoutez 0.0.0.0/0 dans Network Access (IP Whitelist)');
                console.log('   2. Vérifiez que votre cluster est bien en ligne');
            }
            
            return false;
        }
    }
}

module.exports = MongoDBDiagnostic;