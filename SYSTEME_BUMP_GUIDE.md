# 📢 Système de Bump Multi-Plateforme

## Vue d'ensemble

Le système de bump multi-plateforme permet de promouvoir votre serveur Discord sur plusieurs plateformes en une seule commande, similaire à Disboard mais étendu à d'autres services.

## 🚀 Fonctionnalités

### Plateformes supportées
- **🔥 Top.gg** - Cooldown: 12h
- **⭐ Discord Bot List** - Cooldown: 24h
- **🚢 Discord Boats** - Cooldown: 12h
- **🤖 Discord Bots** - Cooldown: 24h
- **📢 Disboard** - Cooldown: 2h

### Fonctionnalités principales
- ✅ Bump sur plusieurs plateformes simultanément
- ⏰ Gestion automatique des cooldowns
- 🎯 Sélection granulaire des plateformes
- 📊 Statistiques et historique des bumps
- 🔔 Rappels automatiques (optionnel)
- ⚙️ Configuration par serveur

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

### `/bump-config`
Configuration du système de bump.

**Sous-commandes:**

#### `/bump-config plateformes`
Active/désactive les plateformes de bump via une interface interactive.

#### `/bump-config channel <channel>`
Définit le canal par défaut pour les notifications de bump.

#### `/bump-config message [message]`
Configure un message personnalisé ou réinitialise au message par défaut.

#### `/bump-config reminder <activer>`
Active/désactive les rappels automatiques.

#### `/bump-config status`
Affiche la configuration actuelle du serveur.

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

## 🛠️ Configuration Technique

### Base de données
Le système utilise deux collections MongoDB :

#### `bumpConfigs`
Stocke la configuration par serveur :
```javascript
{
  guildId: String,
  enabledPlatforms: [String],
  bumpChannelId: String,
  autoReminder: Boolean,
  customMessage: String,
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
1. Configuration initiale avec /bump-config plateformes
2. Activation de Top.gg et Disboard pour visibilité maximale
3. Bump quotidien avec /bump
4. Rappels automatiques pour les modérateurs
```

### Serveur de gaming
```
1. Configuration toutes plateformes pour audience large
2. Canal dédié aux bumps avec /bump-config channel
3. Message personnalisé mentionnant les événements
4. Bump coordonné par équipe de modération
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