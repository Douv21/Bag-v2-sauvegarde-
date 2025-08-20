### Titre
feat(color-roles): styles Irisé/Exotique/Dégradé V + aperçu couleur et clés de style

### Contexte
- Demande: ajouter des effets d'illusion de couleurs et fournir un aperçu visuel.
- Contraintes Discord: la couleur d'un rôle est fixe; on enrichit la palette et on ajoute un aperçu via embed.

### Changements principaux
- Ajout de 24 nouvelles couleurs groupées en 3 familles:
  - Irisé: `irise-1` … `irise-8`
  - Exotique: `exotique-1` … `exotique-8`
  - Dégradé vertical: `degrade-v-1` … `degrade-v-8`
- Commande d'aperçu:
  - Bot principal: `/apercu-couleur` (embed coloré avec clé et hex)
  - Sous-module `discord-role-colors`: `/preview-color`
- Amélioration `/color-role`:
  - Support d'un champ texte `style-key` (ex: `irise-3`) pour contourner la limite de 25 choix
  - Réponse avec un embed coloré de confirmation
- `/setup-colors`: libellé mis à jour et création de toute la palette étendue

### Fichiers modifiés / ajoutés
- Bot principal
  - `utils/rolePalette.js`: ajout des 24 nouvelles couleurs
  - `commands/color-role.js`: support `style-key` + embed de confirmation
  - `commands/setup-colors.js`: description mise à jour
  - `commands/apercu-couleur.js`: NOUVEAU — aperçu d'un style via embed
- Sous-module `discord-role-colors`
  - `src/palette.js`: ajout des 24 nouvelles couleurs
  - `src/register-commands.js`: ajout de `preview-color` + limite de 25 choix pour `style`
  - `src/index.js`: support `style-key` pour `color-role` et ajout du handler `preview-color`

### Permissions / contraintes
- Le bot doit disposer de `ManageRoles` et être positionné au-dessus des rôles à modifier.
- Aperçu: aucune permission spéciale, la réponse est éphémère.

### Déploiement
- Bot principal: redémarrer le bot OU `node force-register.js` (avec `DISCORD_TOKEN` et `CLIENT_ID`).
- Sous-module: dans `discord-role-colors`, exécuter `node src/register-commands.js` avec `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`.

### Validation rapide
1) `/setup-colors` → les nouveaux rôles sont créés (ou détectés comme existants).
2) `/apercu-couleur style-key:exotique-5` → embed avec bordure `#FF00E5`.
3) `/color-role role:@Cible style-key:degrade-v-2 rename:true` → rôle recoloré, embed de confirmation.
4) Sous-module: `/preview-color style:…` ou `style-key:…` → embed.

### Notes
- La palette élargie marche aussi pour des rotations programmées si nécessaire (potentiel futur script de cycle).

