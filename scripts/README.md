# 📁 Scripts de Maintenance

Ce dossier contient les scripts de maintenance et de nettoyage pour le bot BAG V2.

## 🧹 cleanup-removed-commands.js

**Script de nettoyage automatique des commandes supprimées lors du déploiement Render.**

### 🎯 Fonctionnalités
- Supprime automatiquement les commandes obsolètes de Discord
- Fonctionne avec les commandes globales et de guilde
- Intégré au processus de build Render
- Rapport détaillé des suppressions

### 🚀 Utilisation

#### Exécution manuelle
```bash
node scripts/cleanup-removed-commands.js
```

#### Exécution automatique
Le script s'exécute automatiquement lors du déploiement Render grâce à la configuration dans `render.yaml` :
```yaml
buildCommand: npm ci && node scripts/cleanup-removed-commands.js
```

### 📋 Commandes actuellement supprimées
- `profil-carte` - Commande de génération de cartes de profil
- `apercu-couleur` - Commande d'aperçu des couleurs de rôles

### ⚙️ Configuration
Le script utilise les variables d'environnement suivantes :
- `DISCORD_TOKEN` - Token du bot Discord (requis)
- `CLIENT_ID` - ID de l'application Discord (requis)
- `GUILD_ID` - ID de la guilde pour les commandes spécifiques (optionnel)

### 📊 Sortie exemple
```
🚀 === SCRIPT DE NETTOYAGE DES COMMANDES SUPPRIMÉES ===
📋 Commandes à supprimer: profil-carte, apercu-couleur

🧹 Nettoyage des commandes globales...
🗑️ Suppression commande globale: profil-carte
🗑️ Suppression commande globale: apercu-couleur
✅ 2 commande(s) globale(s) supprimée(s)

📊 === RÉSUMÉ DU NETTOYAGE ===
🗑️ Commandes globales supprimées: 2
🗑️ Commandes de guilde supprimées: 0
📊 Total supprimé: 2
⏱️ Durée: 1247ms
✅ Nettoyage terminé avec succès
```

### 🔧 Ajouter de nouvelles commandes à supprimer
Pour ajouter d'autres commandes à supprimer, modifiez le tableau `REMOVED_COMMANDS` dans le script :
```javascript
const REMOVED_COMMANDS = [
    'profil-carte',
    'apercu-couleur',
    'nouvelle-commande-a-supprimer'  // Ajouter ici
];
```