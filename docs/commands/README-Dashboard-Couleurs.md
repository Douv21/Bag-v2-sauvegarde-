## Dashboard & Couleurs

Dashboard:

- `/dashboard` (Admin) — Envoie un lien vers le dashboard minimal (URL déduite de l’environnement). Affiche un embed avec lien.

Couleurs & Styles de rôles:

- `/setup-colors palette:<Choice?>` (Gérer les rôles) — Crée tous les rôles de la palette (noms/couleurs). Ignore ceux déjà présents.
- `/color-role role:<Role> style:<Choice?> style-key:<String?> palette:<Choice?> rename:<Bool?>`
  - Applique une couleur/style au rôle, et peut le renommer.
- `/apercu-couleur style:<Choice?> style-key:<String?> palette:<Choice?>`
  - Affiche un aperçu d’un style (embed avec hex et nom).

Remarques:
- Les styles/palettes proviennent de `utils/rolePalette`.
- Le bot doit avoir la permission « Gérer les rôles » et être au‑dessus des rôles à modifier.

