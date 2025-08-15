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

## Cookies YouTube (yt-dlp) – éviter l’erreur 429

Pour que la lecture YouTube fonctionne de manière fiable (éviter `HTTP Error 429`), fournissez des cookies valides au runtime. Trois méthodes sont supportées par le code (`utils/youtubeCookies.js` et `managers/SimpleMusicManager.js`) :

1) Secret `YOUTUBE_COOKIES` (recommandé)
- Collez l’en‑tête Cookie complet sur une seule ligne, par ex. `VISITOR_INFO1_LIVE=...; YSC=...; __Secure-3PSID=...`.

2) Secret `YOUTUBE_COOKIES_B64`
- Exportez vos cookies YouTube au format Netscape (`cookies.txt`) depuis votre navigateur, puis encodez‑les en base64 :
```bash
base64 -w0 cookies.txt
```
- Collez la valeur obtenue dans le secret `YOUTUBE_COOKIES_B64`.

3) Fichier `YT_COOKIES_FILE`
- Déposez un `cookies.txt` (format Netscape) dans le projet et réglez la variable d’environnement `YT_COOKIES_FILE` sur son chemin (par défaut `/opt/render/project/src/cookies.txt`).

Notes:
- Les cookies expirent : réexportez‑les si YouTube redemande une connexion.
- Les salons Stage Discord nécessitent de promouvoir le bot en "Orateur" pour entendre le son.

### Lecture via PIPED (YouTube proxy sans cookies)

Dans les environnements où YouTube bloque ou rate souvent, la lecture passe par **Piped**.

Variables supportées (déjà ajoutées à `render.yaml`):

- `PIPED_BASE_URL`: instance par défaut (ex: `https://piped.video`)
- `PIPED_TIMEOUT`: timeout des requêtes réseau (ms)
- `PIPED_REGION`: région des résultats (ex: `FR`)

Si vous voyez `⏰ Timeout lors de la récupération du flux (Piped)`, changez d'instance via `PIPED_BASE_URL` ou réessayez.