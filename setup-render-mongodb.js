#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class RenderMongoDBSetup {
    constructor() {
        this.requiredVars = {
            'MONGODB_USERNAME': 'Nom d\'utilisateur MongoDB Atlas',
            'MONGODB_PASSWORD': 'Mot de passe MongoDB Atlas',
            'MONGODB_CLUSTER_URL': 'URL du cluster MongoDB (ex: cluster0.xxxxx.mongodb.net)'
        };
    }

    async setupRenderConfig() {
        console.log('🚀 === CONFIGURATION MONGODB POUR RENDER ===\n');
        
        await this.checkCurrentConfig();
        await this.generateRenderYaml();
        await this.generateEnvironmentTemplate();
        await this.testMongoDBConnection();
        
        this.showInstructions();
    }

    async checkCurrentConfig() {
        console.log('1️⃣ Vérification configuration actuelle...');
        
        for (const [varName, description] of Object.entries(this.requiredVars)) {
            const value = process.env[varName];
            if (value) {
                console.log(`   ✅ ${varName}: Configuré`);
            } else {
                console.log(`   ❌ ${varName}: Non configuré`);
            }
        }
        console.log('');
    }

    async generateRenderYaml() {
        console.log('2️⃣ Génération configuration render.yaml...');
        
        const renderYamlPath = path.join(__dirname, 'render.yaml');
        
        try {
            // Lire le fichier render.yaml existant
            let renderConfig = await fs.readFile(renderYamlPath, 'utf8');
            
            // Vérifier si les variables MongoDB sont déjà présentes
            const hasMongoVars = this.requiredVars.every(varName => 
                renderConfig.includes(`- key: ${varName}`)
            );
            
            if (!hasMongoVars) {
                console.log('   🔧 Ajout des variables MongoDB au render.yaml...');
                
                // Ajouter les variables MongoDB si elles ne sont pas présentes
                const envVarsSection = `
  # Variables MongoDB pour sauvegarde cloud
  - key: MONGODB_USERNAME
    value: YOUR_MONGODB_USERNAME
  - key: MONGODB_PASSWORD
    value: YOUR_MONGODB_PASSWORD  
  - key: MONGODB_CLUSTER_URL
    value: YOUR_CLUSTER_URL`;
                
                // Insérer avant la fin de la section envVars
                renderConfig = renderConfig.replace(
                    /(\s+envVars:[\s\S]*?)(\n\s*#|$)/,
                    `$1${envVarsSection}$2`
                );
                
                await fs.writeFile(renderYamlPath, renderConfig);
                console.log('   ✅ render.yaml mis à jour avec les variables MongoDB');
            } else {
                console.log('   ✅ Variables MongoDB déjà présentes dans render.yaml');
            }
            
        } catch (error) {
            console.log('   ⚠️ Erreur lecture render.yaml:', error.message);
            
            // Créer un render.yaml basique
            const basicRenderYaml = `services:
  - type: web
    name: bagbot-v2
    env: node
    plan: free
    buildCommand: npm install
    startCommand: node index.render-final.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_USERNAME
        value: YOUR_MONGODB_USERNAME
      - key: MONGODB_PASSWORD
        value: YOUR_MONGODB_PASSWORD  
      - key: MONGODB_CLUSTER_URL
        value: YOUR_CLUSTER_URL`;
        
            await fs.writeFile(renderYamlPath, basicRenderYaml);
            console.log('   ✅ render.yaml créé avec configuration MongoDB');
        }
        console.log('');
    }

    async generateEnvironmentTemplate() {
        console.log('3️⃣ Génération template d\'environnement...');
        
        const envTemplatePath = path.join(__dirname, '.env.render.template');
        
        const envTemplate = `# Configuration MongoDB pour Render
# Copiez ces variables dans la section "Environment" de votre service Render

# Nom d'utilisateur MongoDB Atlas
MONGODB_USERNAME=votre_nom_utilisateur

# Mot de passe MongoDB Atlas  
MONGODB_PASSWORD=votre_mot_de_passe

# URL du cluster MongoDB (sans mongodb+srv://)
# Exemple: cluster0.abc123.mongodb.net
MONGODB_CLUSTER_URL=votre_cluster_url

# Variables optionnelles pour debug
DEBUG_BACKUP=false
BACKUP_WEBHOOK_URL=

# Configuration Discord (si nécessaire)
DISCORD_TOKEN=votre_token_discord
DISCORD_CLIENT_ID=votre_client_id`;

        await fs.writeFile(envTemplatePath, envTemplate);
        console.log('   ✅ Template .env.render.template créé');
        console.log('');
    }

    async testMongoDBConnection() {
        console.log('4️⃣ Test connexion MongoDB...');
        
        const hasAllVars = Object.keys(this.requiredVars).every(varName => process.env[varName]);
        
        if (!hasAllVars) {
            console.log('   ⚠️ Variables MongoDB manquantes - test de connexion ignoré');
            console.log('');
            return;
        }
        
        try {
            const mongoBackup = require('./utils/mongoBackupManager');
            console.log('   🔄 Tentative de connexion...');
            
            const connected = await mongoBackup.connect();
            
            if (connected) {
                console.log('   ✅ Connexion MongoDB réussie !');
                
                // Test d'une opération basique
                console.log('   🔄 Test opération basique...');
                const testResult = await mongoBackup.verifyBackupIntegrity();
                
                if (testResult) {
                    console.log('   ✅ MongoDB opérationnel pour les sauvegardes');
                } else {
                    console.log('   ⚠️ Problème avec les opérations de sauvegarde');
                }
                
                await mongoBackup.disconnect();
            } else {
                console.log('   ❌ Connexion MongoDB échouée');
                console.log('   💡 Vérifiez vos variables d\'environnement');
            }
            
        } catch (error) {
            console.log('   ❌ Erreur test MongoDB:', error.message);
        }
        console.log('');
    }

    showInstructions() {
        console.log('📋 === INSTRUCTIONS POUR RENDER ===\n');
        
        console.log('🔧 ÉTAPES À SUIVRE:');
        console.log('');
        
        console.log('1️⃣ **Créer un cluster MongoDB Atlas:**');
        console.log('   • Allez sur https://cloud.mongodb.com');
        console.log('   • Créez un cluster gratuit');
        console.log('   • Créez un utilisateur avec permissions "readWrite"');
        console.log('   • Autorisez toutes les IP (0.0.0.0/0) pour Render');
        console.log('');
        
        console.log('2️⃣ **Configurer les variables dans Render:**');
        console.log('   • Allez dans votre service Render');
        console.log('   • Section "Environment"');
        console.log('   • Ajoutez ces variables:');
        console.log('');
        
        Object.entries(this.requiredVars).forEach(([varName, description]) => {
            console.log(`   ${varName}=votre_valeur`);
            console.log(`   └─ ${description}`);
        });
        console.log('');
        
        console.log('3️⃣ **Redéployer votre service:**');
        console.log('   • Cliquez sur "Manual Deploy" dans Render');
        console.log('   • Ou poussez un commit pour déclencher un redéploiement');
        console.log('');
        
        console.log('4️⃣ **Vérifier le fonctionnement:**');
        console.log('   • Consultez les logs de déploiement');
        console.log('   • Cherchez "✅ MongoDB connecté pour système de sauvegarde"');
        console.log('   • Testez la commande /force-backup');
        console.log('');
        
        console.log('🎯 **RÉSULTAT ATTENDU:**');
        console.log('   ✅ Sauvegarde automatique toutes les 15 minutes');
        console.log('   ✅ Commande force-backup fonctionnelle');
        console.log('   ✅ Sauvegarde complète de toutes les données');
        console.log('   ✅ Sauvegarde locale ET cloud (redondance)');
        console.log('');
        
        console.log('🆘 **EN CAS DE PROBLÈME:**');
        console.log('   • Vérifiez les logs Render pour les erreurs MongoDB');
        console.log('   • Testez la connexion avec: node setup-render-mongodb.js');
        console.log('   • Consultez le diagnostic: node utils/backupDiagnostic.js');
        console.log('');
        
        console.log('📁 **FICHIERS GÉNÉRÉS:**');
        console.log('   • render.yaml (mis à jour avec variables MongoDB)');
        console.log('   • .env.render.template (template pour les variables)');
        console.log('');
        
        console.log('🎉 **Configuration terminée !**');
        console.log('Une fois les variables configurées dans Render, votre système de sauvegarde sera 100% fonctionnel.');
    }

    async createMongoDBDiagnostic() {
        console.log('🔍 Création script de diagnostic MongoDB...');
        
        const diagnosticScript = `#!/usr/bin/env node

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
    
    const connectionString = \`mongodb+srv://\${encodeURIComponent(username)}:\${encodeURIComponent(password)}@\${clusterUrl}/bagbot?retryWrites=true&w=majority\`;
    
    console.log('🔄 Test connexion MongoDB...');
    console.log(\`📡 Cluster: \${clusterUrl}\`);
    console.log(\`👤 Utilisateur: \${username}\`);
    
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
            console.log('🔐 Problème d\\'authentification:');
            console.log('   - Vérifiez le nom d\\'utilisateur et mot de passe');
            console.log('   - L\\'utilisateur doit avoir les permissions "readWrite"');
        } else if (error.message.includes('network')) {
            console.log('🌐 Problème réseau:');
            console.log('   - Vérifiez l\\'URL du cluster');
            console.log('   - Autorisez toutes les IP (0.0.0.0/0)');
        }
        
        process.exit(1);
    }
}

testMongoDB();`;

        await fs.writeFile('test-mongodb-render.js', diagnosticScript);
        console.log('   ✅ Script test-mongodb-render.js créé');
    }
}

// Exécution du script
if (require.main === module) {
    const setup = new RenderMongoDBSetup();
    
    setup.setupRenderConfig()
        .then(() => setup.createMongoDBDiagnostic())
        .then(() => {
            console.log('🏁 Configuration terminée !');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erreur configuration:', error);
            process.exit(1);
        });
}

module.exports = RenderMongoDBSetup;