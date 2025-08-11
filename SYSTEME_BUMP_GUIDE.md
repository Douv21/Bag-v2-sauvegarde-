# 📢 Système de Bump Multi-Plateforme

## Vue d'ensemble

Le système de bump multi-plateforme permet de promouvoir votre serveur Discord sur plusieurs plateformes en une seule commande, similaire à Disboard mais étendu à d'autres services.

## 🚀 Fonctionnalités

### Plateformes supportées

#### Plateformes Générales
- **🔥 Top.gg** - Cooldown: 12h
- **⭐ Discord Bot List** - Cooldown: 24h
- **🚢 Discord Boats** - Cooldown: 12h
- **🤖 Discord Bots** - Cooldown: 24h
- **📢 Disboard** - Cooldown: 2h

#### Plateformes NSFW (uniquement pour serveurs avec canaux NSFW)
- **🔞 NSFW Bot List** - Cooldown: 24h
- **💋 Adult Discord Servers** - Cooldown: 12h
- **🔥 NSFW Server List** - Cooldown: 6h
- **🌶️ Adult Servers Hub** - Cooldown: 8h

### Fonctionnalités principales
- ✅ Bump sur plusieurs plateformes simultanément
- ⏰ Gestion automatique des cooldowns
- 🎯 Sélection granulaire des plateformes
- 📊 Statistiques et historique des bumps
- 🔔 Rappels automatiques (optionnel)
- ⚙️ Configuration par serveur
- 🤖 **Bump automatique** - Système de bump programmé
- 🔞 **Support NSFW** - Plateformes spécialisées pour contenu adulte
- 🎛️ **Menu centralisé** - Interface de configuration complète

## 📝 Commandes

### `/bump`
Commande principale pour bumper le serveur.

**Options:**
- `plateforme` (optionnel) - Bump une plateforme spécifique

**Exemples:**
```
/bump
/bump plateforme:topgg
```

### `/config-bump`
**NOUVEAU** Menu de configuration centralisé pour toutes les options de bump.

Interface interactive unique pour :
- 🌐 **Plateformes Générales** - Configuration des plateformes standard
- 🔞 **Plateformes NSFW** - Plateformes pour serveurs adultes
- 🤖 **Bump Automatique** - Configuration du système automatique
- 📢 **Canal de Notification** - Définir le canal des notifications
- 💬 **Message Personnalisé** - Personnaliser les messages de bump
- 🔔 **Rappels Automatiques** - Gestion des rappels

### `/bump-config` (Legacy)
Ancienne interface de configuration (toujours disponible).

**Sous-commandes:**
- `/bump-config plateformes` - Active/désactive les plateformes
- `/bump-config channel <channel>` - Définit le canal de notification
- `/bump-config message [message]` - Configure le message personnalisé
- `/bump-config reminder <activer>` - Active/désactive les rappels
- `/bump-config status` - Affiche la configuration actuelle

## 🎮 Interface Interactive

### Menu de sélection des plateformes
Une interface intuitive permet de sélectionner les plateformes à bump :
- Affichage des cooldowns en temps réel
- Émojis distinctifs pour chaque plateforme
- Sélection multiple possible

### Boutons d'action
- **🚀 Bump Tout** - Bump toutes les plateformes disponibles
- **🔄 Actualiser** - Met à jour le statut des cooldowns
- **⚙️ Configuration** - Accès rapide à la configuration

### Système de confirmation
- Confirmation avant bump pour éviter les erreurs
- Aperçu des plateformes sélectionnées
- Possibilité d'annuler

## 📊 Gestion des Cooldowns

### Système intelligent
- Calcul automatique des temps de cooldown par plateforme
- Affichage du temps restant en format lisible (ex: "2h 30m")
- Prévention des bumps prématurés

### Persistance
- Stockage en base de données MongoDB
- Résistant aux redémarrages du bot
- Historique des bumps par utilisateur

## 🤖 Bump Automatique

### Configuration
Le système de bump automatique permet de promouvoir votre serveur sans intervention manuelle.

**Options disponibles :**
- **Intervalles** : 6h, 12h, 24h (recommandé), 48h
- **Plateformes cibles** :
  - Toutes les plateformes activées
  - Plateformes générales uniquement
  - Plateformes NSFW uniquement

### Fonctionnement
1. Le système vérifie les plateformes disponibles (pas en cooldown)
2. Effectue le bump sur les plateformes configurées
3. Envoie une notification dans le canal configuré
4. Programme le prochain bump automatique

### Gestion
- ✅ Démarrage/arrêt via `/config-bump`
- 📊 Suivi des bumps automatiques
- 🔔 Notifications de statut
- ⚙️ Configuration flexible par serveur

## 🔞 Plateformes NSFW

### Conditions d'accès
Les plateformes NSFW ne sont disponibles que pour les serveurs possédant au moins un canal NSFW.

### Sécurité
- Vérification automatique des canaux NSFW
- Separation claire des plateformes générales/NSFW
- Configuration indépendante

### Plateformes spécialisées
Les plateformes NSFW offrent une visibilité ciblée pour les serveurs de contenu adulte avec des cooldowns optimisés.

## 🛠️ Configuration Technique

### Base de données
Le système utilise deux collections MongoDB :

#### `bumpConfigs`
Stocke la configuration par serveur :
```javascript
{
  guildId: String,
  enabledPlatforms: [String],        // Plateformes générales
  enabledNSFWPlatforms: [String],    // Plateformes NSFW
  bumpChannelId: String,
  autoReminder: Boolean,
  customMessage: String,
  autoBump: {
    enabled: Boolean,
    interval: Number,                // Intervalle en ms
    platforms: String,               // 'all', 'general', 'nsfw'
    lastRun: Number                  // Timestamp du dernier bump auto
  },
  updatedAt: Date
}
```

#### `bumpCooldowns`
Stocke les cooldowns par plateforme :
```javascript
{
  guildId: String,
  platform: String,
  lastBump: Number,
  userId: String,
  updatedAt: Date
}
```

### Architecture modulaire

#### `BumpManager` (`/managers/BumpManager.js`)
- Gestion centrale du système de bump
- Calculs de cooldowns
- Interface avec la base de données
- Simulation d'appels API (extensible)

#### `BumpInteractionHandler` (`/handlers/BumpInteractionHandler.js`)
- Gestion des interactions utilisateur
- Routage des boutons et menus
- États temporaires de configuration

#### Commandes
- `/commands/bump.js` - Commande principale
- `/commands/bump-config.js` - Configuration complète

## 🔌 Extension API

### Intégration de vraies APIs
Le système est conçu pour être facilement extensible. Pour intégrer de vraies APIs :

1. Modifiez la méthode `callPlatformAPI` dans `BumpManager.js`
2. Ajoutez les tokens d'API dans les variables d'environnement
3. Implémentez la logique spécifique à chaque plateforme

Exemple pour Top.gg :
```javascript
async callTopGGAPI(guildId) {
    const response = await fetch(`https://top.gg/api/bots/${BOT_ID}/stats`, {
        method: 'POST',
        headers: {
            'Authorization': process.env.TOPGG_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            server_count: this.client.guilds.cache.size
        })
    });
    return response.ok;
}
```

## 🔒 Permissions requises

- **Utilisateurs:** `Gérer le serveur` pour utiliser les commandes de bump
- **Bot:** Permissions standard Discord.js (lecture/écriture messages, embeds)

## 🎯 Cas d'usage

### Serveur de communauté
```
1. Configuration avec /config-bump
2. Activation de Top.gg et Disboard pour visibilité maximale
3. Bump automatique toutes les 24h
4. Rappels automatiques pour les modérateurs
```

### Serveur de gaming
```
1. Configuration toutes plateformes via /config-bump
2. Canal dédié aux bumps
3. Message personnalisé mentionnant les événements
4. Bump automatique + bumps manuels d'événements
```

### Serveur NSFW
```
1. Configuration plateformes générales + NSFW via /config-bump
2. Bump automatique sur plateformes NSFW uniquement
3. Intervalle court (6-12h) pour visibilité maximale
4. Canal de notification dédié
```

## 🚨 Limitations actuelles

- Simulation des APIs (pas de vraies connexions)
- Pas de statistiques avancées
- Rappels automatiques basiques

## 🔮 Évolutions prévues

- [ ] Intégration des vraies APIs
- [ ] Système de statistiques avancé
- [ ] Planificateur de bumps automatiques
- [ ] Webhooks pour notifications
- [ ] Support de plateformes additionnelles
- [ ] Dashboard web

## 🛡️ Sécurité

- Validation des permissions à chaque interaction
- Prévention du spam avec cooldowns
- Données sensibles non exposées
- Gestion d'erreurs robuste

## 📞 Support

En cas de problème :
1. Vérifiez les logs du bot
2. Confirmez la configuration avec `/bump-config status`
3. Testez avec une plateforme à la fois
4. Vérifiez la connectivité MongoDB

---

*Système développé pour BAG Bot V2 - Version 2.0.0*