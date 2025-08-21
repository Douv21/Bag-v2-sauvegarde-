# 🚀 Guide de Déploiement sur Render

Ce guide explique comment nettoyer et optimiser votre bot Discord avant le déploiement sur Render.

## 📋 Scripts de Nettoyage Disponibles

### 1. Script Node.js (Recommandé)
```bash
# Voir ce qui serait supprimé (simulation)
npm run cleanup:dry-run

# Nettoyer avec sauvegarde
npm run cleanup:backup

# Nettoyer directement
npm run cleanup:render

# Ou directement avec Node
node cleanup-commands-for-render.js --dry-run
```

### 2. Script Shell (Alternative)
```bash
# Exécuter le script shell
npm run cleanup:shell

# Ou directement
./render-deploy-cleanup.sh
```

## 🗑️ Fichiers Supprimés Automatiquement

### Commandes de Test et Diagnostic
- `test-verif.js` - Tests du système de vérification
- `test-level-notif.js` - Tests des notifications de niveau
- `diagnostic-quarantine.js` - Diagnostic de quarantaine
- `mongodb-diagnostic.js` - Diagnostic MongoDB

### Commandes de Maintenance
- `force-backup.js` - Backup forcé
- `mongodb-backup.js` - Backup MongoDB
- `backup-status.js` - Status des backups

### Versions Obsolètes
- `voler-old.js` - Ancienne version de la commande voler
- `parier-old.js` - Ancienne version de la commande parier

### Outils de Développement
- `clear-commands.js` - Nettoyage des commandes Discord
- `reset.js` - Réinitialisation

### Fichiers Média Inutiles
- Images PNG/JPG temporaires
- Avatars par défaut
- Fichiers temporaires numérotés

## ⚙️ Configuration Automatique

Le script `prebuild` dans `package.json` exécute automatiquement le nettoyage avant chaque build :

```json
{
  "scripts": {
    "prebuild": "npm run cleanup:render"
  }
}
```

## 🔧 Options Avancées

### Mode Dry-Run (Simulation)
```bash
node cleanup-commands-for-render.js --dry-run
```
Affiche ce qui serait supprimé sans rien supprimer réellement.

### Avec Sauvegarde
```bash
node cleanup-commands-for-render.js --backup
```
Crée une sauvegarde dans `commands-backup/` avant suppression.

### Aide
```bash
node cleanup-commands-for-render.js --help
```

## 📊 Avantages du Nettoyage

1. **Réduction de la taille** - Moins de fichiers à déployer
2. **Déploiement plus rapide** - Moins de transfert de données
3. **Évite les conflits** - Supprime les commandes obsolètes
4. **Sécurité** - Supprime les outils de développement
5. **Optimisation** - Garde seulement les fichiers nécessaires

## 🚀 Processus de Déploiement Recommandé

1. **Vérification locale**
   ```bash
   npm run cleanup:dry-run
   ```

2. **Sauvegarde et nettoyage**
   ```bash
   npm run cleanup:backup
   ```

3. **Test du bot**
   ```bash
   npm start
   ```

4. **Commit et push**
   ```bash
   git add .
   git commit -m "Clean commands for production deployment"
   git push
   ```

5. **Déploiement sur Render**
   - Le script `prebuild` s'exécute automatiquement
   - Render déploie la version nettoyée

## 📝 Logs et Suivi

- Le script crée un fichier `cleanup.log` avec l'historique
- Affichage détaillé de chaque suppression
- Compteurs de fichiers traités
- Estimation de l'espace libéré

## ⚠️ Avertissements

- **Sauvegardez** toujours avant le nettoyage en production
- **Testez** votre bot après nettoyage
- Les fichiers supprimés ne peuvent pas être récupérés (sauf sauvegarde)
- Certaines commandes de développement peuvent être nécessaires localement

## 🔄 Restauration

Si vous avez créé une sauvegarde :
```bash
# Restaurer depuis la sauvegarde
cp commands-backup/* commands/
```

## 📞 Support

En cas de problème avec le nettoyage :
1. Vérifiez les logs dans `cleanup.log`
2. Utilisez `--dry-run` pour diagnostiquer
3. Restaurez depuis la sauvegarde si nécessaire
4. Testez individuellement les commandes importantes