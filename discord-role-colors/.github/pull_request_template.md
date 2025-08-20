## Objet

Ajout d’un bot Discord permettant de créer une palette de rôles colorés en une commande et d’appliquer ces styles à des rôles existants.

## Changements principaux

- Projet `discord-role-colors`
  - Commande `/setup-colors` : crée 10 rôles "couleur/style" (avec emoji + nom)
  - Commande `/color-role` : applique un style à un rôle existant (options: role, style, rename)
  - Fichiers clés: `src/index.js`, `src/register-commands.js`, `src/palette.js`
  - `README.md` avec instructions d’installation et d’utilisation
  - `.env.example` pour la configuration

## Tests/Validation

- Exécuter `npm run deploy:commands` puis `npm start`
- Vérifier que `/setup-colors` crée correctement les 10 rôles
- Vérifier que `/color-role` modifie la couleur (et le nom si `rename = true`)
- Le rôle du bot doit être au-dessus des rôles à modifier

## Screenshots (optionnel)

- Ajouter des captures montrant la liste des rôles créés et l’application d’un style

## Checklist

- [ ] Documentation mise à jour (`README.md`)
- [ ] Variables d’environnement renseignées (`.env`)
- [ ] Permissions du bot vérifiées (Gérer les rôles)

