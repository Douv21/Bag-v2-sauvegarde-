# 🚀 Guide de Déploiement Render.com

## 📋 Prérequis

1. **Compte Render.com** (gratuit)
2. **Bot Discord configuré** avec Token + Client ID
3. **Repository GitHub** avec le code

## 🔧 Configuration Discord

### 1. Créer Application Discord
1. Aller sur https://discord.com/developers/applications
2. Créer "New Application" → Nom: "BAG Bot V2"
3. Onglet "Bot" → Créer bot
4. **Copier le Token** (garder secret!)
5. Onglet "General Information" → **Copier Client ID**

### 2. Permissions Bot
```
Permissions requises:
✅ Send Messages
✅ Use Slash Commands  
✅ Embed Links
✅ Attach Files
✅ Read Message History
✅ Create Public Threads
✅ Send Messages in Threads
✅ Use External Emojis
```

## 🌐 Déploiement Render.com

### Étape 1: Créer Web Service

1. **Connexion Render.com** → Dashboard
2. **"New +"** → **"Web Service"**
3. **Connecter GitHub repository**
4. **Configuration automatique:**

```yaml
Name: bag-bot-v2
Runtime: Node  
Build Command: npm install
Start Command: npm start
```

### Étape 2: Variables d'Environnement

**Dans Render.com Dashboard → Environment:**

```env
DISCORD_TOKEN=your_actual_bot_token
CLIENT_ID=your_actual_client_id  
NODE_ENV=production
PORT=5000
```

### Étape 3: Configuration Avancée

```yaml
Health Check Path: /health
Auto-Deploy: true (optionnel)
Instance Type: Starter (gratuit)
Region: Oregon (recommandé)
```

## ✅ Vérification Déploiement

### 1. Logs de Démarrage
```bash
✅ BAG BOT V2 - Render.com Web Service démarré
✅ Bot_Name#0000 connecté  
📂 Chargement de X commandes...
✅ X commandes chargées
🌐 Serveur Web actif sur port 5000
```

### 2. Health Check
- **URL:** `https://your-app.onrender.com/health`
- **Réponse attendue:**
```json
{
  "status": "healthy",
  "discord": "connected", 
  "uptime": 123,
  "commands": 4,
  "guilds": 1
}
```

### 3. Interface Web
- **URL:** `https://your-app.onrender.com/`
- **Statut:** 🟢 Service actif

## 🎯 Ajout du Bot au Serveur

### URL d'Invitation
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274881181760&scope=bot%20applications.commands
```

**Remplacer YOUR_CLIENT_ID** par votre Client ID réel.

### Permissions Automatiques
Le bot s'enregistrera automatiquement avec les commandes:
- `/confess` - Confessions anonymes
- `/economie` - Profil économique  
- `/config` - Configuration (Admin)
- `/stats` - Statistiques

## 🔍 Monitoring & Maintenance

### Logs en Temps Réel
```bash
# Dans Render.com Dashboard → Logs
✅ Messages de succès en vert
⚠️ Avertissements en jaune  
❌ Erreurs en rouge
```

### Endpoints de Monitoring
- `/` - Statut principal
- `/health` - Santé détaillée
- `/api/stats` - Statistiques
- `/api/data/users` - Données utilisateurs

### Redémarrage Manuel
```bash
# Dans Dashboard Render.com
Manual Deploy → Deploy Latest Commit
```

## 🚨 Troubleshooting

### Erreurs Communes

#### 1. Bot ne se connecte pas
```
❌ Erreur: Invalid Token
→ Solution: Vérifier DISCORD_TOKEN dans Environment
```

#### 2. Commandes non enregistrées  
```
❌ DiscordAPIError: Missing Permissions
→ Solution: Bot doit être dans le serveur avec bonnes permissions
```

#### 3. Health Check échoue
```
❌ Health check failed
→ Solution: Port 5000 doit être libre, vérifier startCommand
```

### Support & Debug

#### Variables d'Debug
```env
DEBUG=true
LOG_LEVEL=verbose
```

#### Logs Utiles
```javascript
// Vérifier connection Discord
console.log('Discord Status:', client.readyAt)

// Vérifier commandes
console.log('Commands loaded:', client.commands.size)

// Vérifier serveur web  
console.log('Web server on port:', process.env.PORT)
```

## 🎉 Succès!

Votre bot est maintenant déployé en **Web Service** sur Render.com avec:

✅ **Architecture modulaire** - DataManager + InteractionHandler centralisés  
✅ **Health checks automatiques** - Monitoring Render.com intégré  
✅ **Interface web** - Dashboard de statut accessible  
✅ **API REST** - Endpoints pour données et statistiques  
✅ **Gestion d'erreurs robuste** - Redémarrage automatique  
✅ **Système de données centralisé** - Par commande avec cache  

**URL Production:** `https://your-app-name.onrender.com`

---

**🚀 Bot opérationnel 24/7 avec surveillance automatique!**