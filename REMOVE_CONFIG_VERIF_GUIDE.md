# 🗑️ Guide de suppression des anciennes commandes config-verif

Ce guide explique comment supprimer les anciennes commandes `/config-verif` de votre serveur Discord.

## 🎯 Scripts disponibles

### 1. Script interactif (recommandé)
```bash
node remove-config-verif.js
```
- ✅ Script interactif avec confirmation
- 🔍 Affiche les commandes trouvées avant suppression
- ⚠️ Demande confirmation avant de supprimer

### 2. Script automatique (pour CI/CD)
```bash
npm run clean:config-verif
```
- 🤖 Suppression automatique sans confirmation
- 🧹 Nettoie seulement les anciennes commandes obsolètes
- ✅ Garde la nouvelle commande `/config-verif-menu`

### 3. Déploiement propre
```bash
npm run deploy:clean
```
- 🧹 Nettoie les anciennes commandes
- 🚀 Déploie toutes les nouvelles commandes
- ⚡ Processus en une seule étape

## 🔧 Configuration requise

Assurez-vous d'avoir ces variables d'environnement :

```env
DISCORD_TOKEN=votre_token_bot
CLIENT_ID=votre_client_id
GUILD_ID=votre_server_id  # Optionnel pour commandes locales
```

## 📋 Options avancées

### Suppression de toutes les commandes (mode nuclear)
```bash
node remove-config-verif.js --nuclear
```
⚠️ **ATTENTION** : Supprime TOUTES les commandes slash !

### Aide
```bash
node remove-config-verif.js --help
```

## 🚀 Processus recommandé

1. **Sauvegardez** votre configuration actuelle
2. **Testez** d'abord sur un serveur de test
3. **Nettoyez** les anciennes commandes :
   ```bash
   npm run clean:config-verif
   ```
4. **Déployez** les nouvelles commandes :
   ```bash
   npm run deploy:commands
   ```
5. **Vérifiez** que `/config-verif-menu` fonctionne

## ❓ Dépannage

### Erreur "Token invalide"
- Vérifiez votre `DISCORD_TOKEN` dans `.env`
- Le token doit être celui du bot, pas de l'application

### Erreur "Permissions manquantes"
- Le bot doit avoir la permission `applications.commands`
- Vérifiez les permissions OAuth2 de votre bot

### Commandes toujours visibles
- Les commandes peuvent prendre jusqu'à 1 heure pour disparaître
- Redémarrez Discord pour forcer le rafraîchissement
- Utilisez `/` dans le chat pour voir les commandes actuelles

## 🔄 Retour en arrière

Si vous voulez restaurer l'ancienne commande :
1. Restaurez le fichier `commands/config-verif.js` depuis Git
2. Supprimez `commands/config-verif-menu.js`
3. Redéployez avec `npm run deploy:commands`