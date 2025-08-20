### Titre
feat(role-colors): ajouter le système de rôles « dégradé » avec `/setup-colors` et `/color-role`

### Contexte
- Demande: « rollers de couleur dégradé » pour créer une palette et appliquer rapidement un style de couleur à des rôles.
- Objectif: simplifier la création et l’application de couleurs cohérentes via des commandes slash.

### Changements principaux
- Ajout commande `setup-colors` pour créer automatiquement 10 rôles de style/couleur.
- Ajout commande `color-role` pour appliquer un style (couleur + renommage optionnel) à un rôle existant.
- Palette partagée via `utils/rolePalette.js` (clés, noms et couleurs des styles).

### Fichiers ajoutés
- `commands/setup-colors.js`
- `commands/color-role.js`
- `utils/rolePalette.js`

### Détails d’implémentation
- Les commandes suivent le format utilisé par les autres commandes (`SlashCommandBuilder`, propriété `data`, méthode `execute`).
- Permissions: `ManageRoles` exigée; les réponses sensibles sont éphémères (flags/ephemeral).
- L’enregistrement des commandes s’appuie sur le chargeur existant: au redémarrage, elles sont incluses et déployées.

### Considérations & risques
- Le bot doit avoir la permission « Gérer les rôles » et son rôle doit être placé au-dessus des rôles à modifier.
- Pas de nouvelles variables d’environnement.

### Tests / Validation
1) Redémarrer le bot pour déployer les commandes.
2) Exécuter `/setup-colors` dans un serveur: vérifie la création (ou la présence) des 10 rôles de la palette.
3) Exécuter `/color-role role:<un_rôle> style:<un_style> rename:true|false`: confirme que la couleur et (optionnellement) le nom sont mis à jour.
4) Vérifier les logs: aucune erreur de permissions.

Option d’enregistrement manuel (si besoin):
```bash
node force-register.js
```

### Rollout
- Redémarrage unique du bot, aucun downtime critique.

### Checklist
- [x] Commandes ajoutées et chargées par le bot
- [x] Permissions vérifiées
- [x] Test de chargement local (require) OK
- [x] Documentation PR fournie

