# BAG Bot V2 - Déploiement Render.com

## Configuration Render.com

### Variables d'environnement requises :
- `DISCORD_TOKEN` : Token du bot Discord
- `CLIENT_ID` : ID client de l'application Discord
- `DATABASE_URL` : URL de base de données (optionnel)
- `NODE_ENV` : production

### Configuration de service :
- **Type** : Web Service
- **Environnement** : Node.js 18+
- **Commande de build** : `npm install`
- **Commande de start** : `node index.js`
- **Health check** : `/health`
- **Port** : 5000 (automatique)

### Architecture :
- Discord Bot + Express Web Server
- Architecture modulaire avec handlers séparés
- Système de santé intégré pour monitoring Render
- Gestion automatique des erreurs et timeouts

### Endpoints disponibles :
- `GET /` : Status général du service
- `GET /health` : Health check détaillé pour Render
- `GET /api/stats` : Statistiques du bot
- `GET /api/data/:type` : Données spécifiques

### Déploiement :
1. Créer un Web Service sur Render.com
2. Connecter le repository Git
3. Configurer les variables d'environnement
4. Déployer avec le fichier `render.yaml`

Le bot démarre automatiquement et reste en ligne 24/7.