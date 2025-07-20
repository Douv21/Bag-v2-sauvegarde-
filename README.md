# BAG Bot V2 - Architecture Render.com Web Service

## 🚀 Architecture Web Service

Cette version est spécialement conçue pour le déploiement en **Web Service** sur Render.com avec une architecture modulaire et centralisée.

### 📁 Structure du Projet

```
render/
├── index.js                 # Point d'entrée Web Service
├── managers/
│   └── DataManager.js       # Gestionnaire données centralisé
├── handlers/
│   ├── CommandHandler.js    # Gestionnaire commandes
│   └── InteractionHandler.js # Gestionnaire interactions centralisé
├── commands/               # Commandes Discord (auto-créées)
├── data/                  # Stockage données JSON
├── public/               # Assets web statiques
├── package.json          # Configuration Node.js
└── render.yaml          # Configuration Render.com
```

### ✨ Fonctionnalités Clés

#### 🎯 **Web Service Ready**
- ✅ Serveur Express intégré
- ✅ Health checks automatiques (`/health`)
- ✅ API REST pour données (`/api/stats`, `/api/data/:type`)
- ✅ Interface web pour monitoring

#### 🔧 **Architecture Modulaire**
- ✅ **DataManager centralisé** - Gestion unifiée des données par commande
- ✅ **InteractionHandler centralisé** - Menus déroulants et boutons unifiés
- ✅ **CommandHandler intelligent** - Chargement automatique des commandes
- ✅ **Système de cache** - Performances optimisées

#### 💾 **Système de Données par Commande**
```javascript
// Chaque commande a ses propres données
dataTypes = {
    'users': 'users.json',           // Système économie
    'confessions': 'confessions.json', // Système confession  
    'counting': 'counting.json',       // Système comptage
    'config': 'config.json'           // Configuration
}
```

#### 🎮 **Gestionnaire d'Interactions Centralisé**
```javascript
// Tous les menus et boutons gérés centralement
handlers = {
    selectMenu: Map(),  // Menus déroulants
    button: Map(),      // Boutons
    modal: Map()        // Modals
}
```

### 🚀 Déploiement Render.com

#### 1. **Prérequis**
- Compte Render.com
- Discord Bot Token + Client ID

#### 2. **Déploiement**
```bash
# 1. Créer Web Service sur Render.com
# 2. Connecter ce repository
# 3. Configuration automatique via render.yaml
# 4. Définir variables d'environnement:
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
```

#### 3. **Variables d'Environnement**
```env
NODE_ENV=production
PORT=5000                    # Port Web Service
DISCORD_TOKEN=bot_token      # Token Discord Bot  
CLIENT_ID=client_id          # ID Application Discord
```

### 📊 Endpoints Web Service

#### **Health Checks** (Obligatoires Render.com)
- `GET /` - Statut principal
- `GET /health` - Santé détaillée

#### **API REST**
- `GET /api/stats` - Statistiques globales
- `GET /api/data/:type` - Données par type

### 🔧 Configuration Discord

#### **Commandes Incluses**
- `/confess` - Confessions anonymes
- `/economie` - Profil économique
- `/config` - Configuration serveur (Admin)
- `/stats` - Statistiques bot

#### **Système d'Interactions**
- ✅ Menus déroulants centralisés
- ✅ Boutons centralisés  
- ✅ Modals centralisés
- ✅ Gestion d'erreurs robuste

### 💡 Avantages Architecture

#### **vs Architecture Classique**
| Aspect | Classique | Web Service |
|--------|-----------|-------------|
| Déploiement | Background Worker | Web Service |
| Monitoring | Logs uniquement | Interface web + API |
| Données | Fichiers dispersés | Système centralisé |
| Interactions | Code dupliqué | Handler centralisé |
| Maintenance | Complexe | Modulaire |

#### **Compatibilité Render.com**
- ✅ **Health checks** automatiques
- ✅ **Port binding** correct (0.0.0.0)
- ✅ **Variables d'environnement** sécurisées
- ✅ **Logs structurés** pour monitoring
- ✅ **Redémarrages gracieux**

### 🛠️ Développement

#### **Installation Locale**
```bash
cd render/
npm install
npm run dev  # Mode développement avec nodemon
```

#### **Test Health Checks**
```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/stats
```

#### **Structure Commands**
```javascript
// Template commande
module.exports = {
    data: new SlashCommandBuilder()
        .setName('command')
        .setDescription('Description'),
    
    async execute(interaction, dataManager) {
        // Logic avec dataManager injecté
    }
};
```

### 🚨 Important - Différences vs Version Classique

1. **Point d'entrée**: `render/index.js` au lieu de `index.js`
2. **Gestionnaires centralisés** au lieu de code dupliqué
3. **DataManager injecté** dans chaque commande
4. **Web Service** au lieu de Background Worker
5. **Monitoring web** intégré

---

**✅ Version optimisée pour déploiement Web Service sur Render.com**

Cette architecture garantit une compatibilité parfaite avec les exigences Render.com tout en maintenant toutes les fonctionnalités du bot.