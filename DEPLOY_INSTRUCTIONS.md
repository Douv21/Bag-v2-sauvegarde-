# Instructions de Déploiement BAG Bot

## 📋 Pré-requis
- Compte Discord Developer (bot token)
- Compte Render.com (gratuit)
- Repository GitHub

## 🚀 Déploiement Render.com

1. **Upload vers GitHub**
   - Créer un nouveau repository
   - Upload tous les fichiers du ZIP
   - Commit et push

2. **Configuration Render.com**
   - Nouveau Web Service
   - Connecter votre repository GitHub
   - Runtime: Node.js
   - Build Command: npm install
   - Start Command: node index.production.js

3. **Variables d'environnement**
   - DISCORD_TOKEN=votre_bot_token
   - CLIENT_ID=votre_client_id
   - GUILD_ID=votre_server_id (optionnel)
   - NODE_ENV=production

4. **Vérification**
   - Health check: https://votre-app.onrender.com/health
   - Bot en ligne sur Discord

## 📚 Documentation
- Voir RENDER_DEPLOYMENT_FINAL.md pour plus de détails
- README.md pour les fonctionnalités

## 🔧 Commandes principales
- /arc-en-ciel - Configuration avancée (admins)
- /economie - Statut économique
- /profil-carte - Carte personnalisée
- /confess - Confessions anonymes

Bon déploiement ! 🎉
