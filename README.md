# BAG Bot V2 - Test Dashboard

![Version](https://img.shields.io/badge/version-2.0-blue)
![Discord.js](https://img.shields.io/badge/discord.js-14.x-brightgreen)
![Node.js](https://img.shields.io/badge/node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-success)

## 📋 Description

BAG v2 est un bot Discord complet en français offrant un système de confessions anonymes, une économie avancée avec karma dual, un système de comptage mathématique, et de nombreuses fonctionnalités d'administration et de divertissement.

## ✨ Fonctionnalités Principales

- 🤐 **Confessions Anonymes** - Système complet avec auto-threads et logs admin
- 💰 **Économie Complète** - Karma dual (😇/😈), boutique, daily rewards
- 🔢 **Comptage Mathématique** - Système de comptage avancé avec formules
- 🛠️ **Administration** - Gestion complète des utilisateurs et configurations
- 🎯 **Multi-serveurs** - Support complet de plusieurs serveurs Discord
- 🗄️ **Sauvegarde MongoDB** - Système de sauvegarde automatique configurable
- 🌐 **Compatible Render.com** - Déploiement web service optimisé

## 📦 Installation Rapide

### Prérequis
- Node.js 18+
- Un bot Discord avec token
- (Optionnel) MongoDB Atlas pour la sauvegarde

### Configuration
1. Clonez ou téléchargez les fichiers du bot
2. Installez les dépendances : `npm install`
3. Configurez les variables d'environnement (copiez d'abord `.env.example`):
   ```bash
   cp .env.example .env
   # Éditez .env et renseignez DISCORD_TOKEN/CLIENT_ID
   ```
   Variables minimales:
   ```env
   DISCORD_TOKEN=votre_token_discord
   CLIENT_ID=votre_client_id
   PORT=5000
   ```
4. Lancez le bot : `npm start`

### Diagnostics musique
- Vérifier chargement du module: `npm run diagnose:music`
- Version yt-dlp: `npm run diag:yt-dlp`
- Rapport audio: `npm run diag:voice`
- Vérifier Lavalink: `npm run diag:lavalink`

## 🎵 Option Rythm-like (Lavalink + Shoukaku)

Par défaut, le bot utilise `@discordjs/voice` + `ffmpeg` + `play-dl`. Vous pouvez activer un système de lecture façon Rythm (Lavalink) en fournissant les variables d’environnement suivantes:

- Configuration simple:
```env
LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
LAVALINK_SECURE=false
```

- Ou configuration avancée (plusieurs nœuds):
```env
LAVALINK_NODES=[
  {"name":"main","url":"localhost:2333","auth":"youshallnotpass","secure":false}
]
```

Le routeur `managers/MusicManager` bascule automatiquement sur Lavalink si configuré, sinon garde le système actuel. Les commandes existantes (`/play`, `/pause`, `/skip`, `/stop`, `/queue`, `/volume`, `/nowplaying`) restent inchangées.

Exemple (nœud public sécurisé):
```env
LAVALINK_HOST=lava-v4.ajieblogs.eu.org
LAVALINK_PORT=443
LAVALINK_PASSWORD=https://dsc.gg/ajidevserver
LAVALINK_SECURE=true
```

## 🎮 Liste Complète des Commandes (28)

### 👤 Commandes Utilisateur (14)

#### 💰 Économie
- `/economie [utilisateur]` - Voir le profil économique (balance, karma, streak)
- `/charmer` - Charmer pour gagner du plaisir (Action positive 😇)
- `/flirter` - Flirter pour gagner du plaisir (Action positive 😇)
- `/offrir <membre> <montant>` - Offrir du plaisir à un membre (Action très positive 😇)
- `/seduire [membre]` - Tenter de séduire (Action négative 😈)
- `/coup-de-folie` - Faire un coup de folie (Action très négative 😈)
- `/oser <montant>` - Oser pour tenter sa chance (Action négative 😈)
- `/daily` - Récupérer sa récompense quotidienne avec streak

#### 🛒 Boutique & Objets
- `/boutique` - Accéder à la boutique du serveur (achats de rôles/objets)
- `/objet` - Gérer vos objets de boutique (offrir, supprimer, interaction)

#### 📊 Classements
- `/topargent` - Classement des membres les plus riches
- `/karma` - Classement karma - Actions bonnes 😇 vs mauvaises 😈

#### 🎨 Profil & Divers
- `/profil-carte` - Affiche votre profil avec carte visuelle PNG
- `/confess` - Envoyer une confession anonyme
- `/stats` - Statistiques générales du bot

### 🛠️ Commandes Administrateur (14)

#### 💸 Gestion Économique
- `/ajout-argent <membre> <montant>` - Ajouter de l'argent à un membre
- `/retrait-argent <membre> <montant>` - Retirer de l'argent à un membre
- `/ajout-karma <membre> <type> <montant>` - Ajouter du karma (positif/négatif)
- `/retrait-karma <membre> <type> <montant>` - Retirer du karma (positif/négatif)

#### ⚙️ Configuration Systèmes
- `/configeconomie` - Configuration complète du système économique
  - Actions (récompenses, karma, cooldowns)
  - Boutique (objets, rôles, remises karma)
  - Karma (niveaux personnalisés, récompenses automatiques)
  - Daily (montants, streaks)
  - Messages (gains par message, cooldowns)
  - Statistiques économiques

#### 🤐 Configuration Confessions
- `/config-confession` - Configuration avancée des confessions
  - Gestion des canaux de confession
  - Configuration des logs admin (niveaux, images, ping rôles)
  - Auto-threads pour confessions

#### 🔗 Configuration Auto-Thread
- `/autothread` - Configuration du système auto-thread global
  - Activation par canal
  - Noms de threads personnalisés
  - Temps d'archivage et slow mode

#### 🔢 Système de Comptage
- `/comptage` - Configuration du système de comptage mathématique
  - Canaux de comptage
  - Mode mathématique (formules acceptées)
  - Reset et records

#### 📊 Tableau de Bord
- `/dashboard` - En reconstruction (placeholder minimal)
- Endpoints disponibles en V0: `/health`, `/api/stats`

#### 🗄️ Sauvegarde MongoDB
- `/backup-status` - État du système de sauvegarde MongoDB
- `/force-backup` - Forcer une sauvegarde manuelle vers MongoDB
- `/mongodb-diagnostic` - Diagnostic complet de la connexion MongoDB Atlas

#### 🗑️ Maintenance
- `/clear-commands` - Supprimer les commandes Discord pour éliminer les doublons

## 🎯 Système Économique Détaillé

### Karma Dual (😇/😈)
- **Karma Positif (😇)** : Gagné par les bonnes actions (travailler, pêcher, donner)
- **Karma Négatif (😈)** : Gagné par les mauvaises actions (voler, crime, parier)
- **Effet Bidirectionnel** : Chaque action affecte les deux types de karma
- **Niveaux Personnalisables** : Créez vos propres niveaux de karma avec récompenses

### Actions Économiques
| Action | Karma 😇 | Karma 😈 | Effet |
|--------|----------|----------|-------|
| Travailler | +1 | -1 | Gain d'argent stable |
| Pêcher | +1 | -1 | Gain d'argent avec chance |
| Donner | +3 | -2 | Transfert d'argent + haut karma |
| Voler | -1 | +1 | Vol d'argent avec risque d'échec |
| Crime | -2/-3 | +2/+3 | Gros gains mais gros risques |
| Parier | -1 | +1 | 50% de chance de gain/perte |

### Boutique Avancée
- **Objets Personnalisés** : Créez des objets avec nom, prix et description
- **Rôles Temporaires** : Achat de rôles avec durée limitée
- **Rôles Permanents** : Achat de rôles définitifs
- **Remises Karma** : Réductions basées sur le karma net de l'utilisateur

## 🤐 Système de Confessions

### Fonctionnalités
- **Confessions Anonymes** : Texte et/ou images
- **Multi-canaux** : Support de plusieurs canaux de confession
- **Auto-threads** : Création automatique de fils de discussion
- **Logs Admin** : Système de logs avec identification utilisateur
- **Numérotation** : Chaque confession reçoit un numéro unique

### Configuration Admin
- **3 Niveaux de Logs** : Basic, Détaillé, Complet
- **Ping Rôles** : Notification automatique des modérateurs
- **Gestion Images** : Inclusion/exclusion des images dans les logs

## 🔢 Système de Comptage

### Fonctionnalités
- **Comptage Classique** : Séquence numérique simple
- **Mode Mathématique** : Support des formules (√, (), +, -, *, /, etc.)
- **Multi-canaux** : Plusieurs canaux de comptage simultanés
- **Auto-reset** : Remise à zéro automatique en cas d'erreur
- **Records** : Suivi des meilleurs scores par canal

## 🗄️ Sauvegarde MongoDB

### Configuration
Le bot supporte MongoDB Atlas avec configuration flexible :
```env
MONGODB_USERNAME=votre_nom_utilisateur
MONGODB_PASSWORD=votre_mot_de_passe  
MONGODB_CLUSTER_URL=cluster0.xxx.mongodb.net
```

### Fonctionnalités
- **Sauvegarde Automatique** : Toutes les 15 minutes
- **Triple Protection** : MongoDB + Sauvegarde locale + Hooks d'urgence
- **Diagnostic Intégré** : Commande `/mongodb-diagnostic` pour tester la connexion
- **Fallback Intelligent** : Basculement automatique vers fichiers locaux

## 🌐 Déploiement Render.com

### Configuration
1. Créez un Web Service sur Render.com
2. Connectez votre repository Git
3. Configurez les variables d'environnement
4. Build Command : `npm install`
5. Start Command : `node index.render-final.js`

### Variables d'Environnement Render.com
```
DISCORD_TOKEN=votre_token
CLIENT_ID=votre_client_id
MONGODB_USERNAME=optionnel
MONGODB_PASSWORD=optionnel
MONGODB_CLUSTER_URL=optionnel
```

## 📁 Structure du Projet

```
render/
├── commands/           # 28 commandes slash
├── handlers/          # Gestionnaires d'interactions
├── managers/          # Gestionnaires de données
├── utils/             # Utilitaires et helpers
├── data/              # Fichiers de données JSON
├── index.render-final.js  # Point d'entrée principal
├── package.json       # Dépendances Node.js
└── README.md         # Cette documentation
```

## 🔧 Architecture Technique

### Gestionnaires Modulaires
- **MainRouterHandler** : Routage central des interactions
- **ConfessionHandler** : Gestion complète des confessions
- **EconomyConfigHandler** : Configuration du système économique
- **AutoThreadConfigHandler** : Gestion des auto-threads
- **CountingConfigHandler** : Configuration du comptage

### Managers de Données
- **SimpleDataManager** : Gestion des fichiers JSON locaux
- **MongoBackupManager** : Sauvegarde MongoDB Atlas
- **DeploymentManager** : Gestion des déploiements
- **EconomyManager** : Logique économique et karma

## 🚀 Performances & Stabilité

### Optimisations
- **Chargement Asynchrone** : Commandes chargées en parallèle
- **Cache Intelligent** : Mise en cache des données fréquentes
- **Rate Limiting** : Protection contre le spam Discord
- **Error Handling** : Gestion robuste des erreurs

### Monitoring
- **Health Checks** : Endpoints de surveillance (port 5000)
- **Logs Détaillés** : Système de logging complet
- **Métriques** : Suivi des performances et utilisation

## 📈 Statistiques Bot

- **28 Commandes** actives
- **Multi-serveurs** avec isolation des données
- **Support Mobile** optimisé pour Discord mobile
- **Architecture Modulaire** pour faciliter les extensions
- **Compatible Render.com** avec déploiement one-click

## 🆘 Support & Dépannage

### Commandes de Diagnostic
- `/mongodb-diagnostic` - Test de connexion MongoDB
- `/backup-status` - État du système de sauvegarde
- `/stats` - Statistiques générales du bot

### Problèmes Courants
1. **Commandes Dupliquées** : Utilisez `/clear-commands` pour nettoyer
2. **MongoDB Indisponible** : Le bot bascule automatiquement vers les fichiers locaux
3. **Permissions Manquantes** : Vérifiez les permissions bot sur Discord

## 📝 Changelog

### Version 2.0 (Actuelle)
- ✅ 28 commandes slash complètes
- ✅ Système MongoDB configurable avec credentials utilisateur
- ✅ Karma dual personnalisable (😇/😈)
- ✅ Boutique avancée avec remises karma
- ✅ Système de comptage mathématique
- ✅ Interface mobile optimisée
- ✅ Commande `/clear-commands` pour maintenance
- ✅ Diagnostic MongoDB intégré
- ✅ Triple protection des données

---

**Développé pour la communauté Discord française** 🇫🇷

*Bot optimisé pour Render.com avec support MongoDB Atlas configurable*