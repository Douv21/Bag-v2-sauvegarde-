# Corrections Dashboard & UI Serveur (janv 2025)

- **DashboardHandler**
  - Correction du calcul des stats: suppression de `interaction` hors scope dans `calculateStats`.
  - Économie: adaptation au schéma `userId_guildId` et calcul robustes (moyennes, streaks).
  - Confessions: lecture résiliente depuis `data/logs/confessions.json` via `getData('confessions')` et fallback sur `data/confessions.json` pour la config.
  - Navigation: ajout d’option « Retour dashboard » dans les menus secondaires.

- **MainRouterHandler**
  - Prise en charge du select `dashboard_sections` et des menus `*_dashboard_options` pour retourner au tableau de bord principal.
  - Correction d’un tronquage accidentel en fin de fichier dans la méthode `handleColorRoleSelect` (réponses d’erreur complètes, export module rétabli).

- **UI Web**
  - `public/dashboard.html`: ajout d’une barre de navigation mobile (bottom bar) + padding bas pour éviter le recouvrement.
  - Sidebar mobile escamotable; navigation synchronisée entre la sidebar et la bottom bar.

- **Endpoints côté serveur**
  - Aucune route critique cassée; les endpoints utilisés par le dashboard sont disponibles: `/health`, `/api/stats`, `/api/metrics/last7days`, `/api/servers/distribution`, `/api/guilds`, `/api/guilds/:guildId/channels`, `/api/backups`, `/api/upload/style-background`, `/api/config/*` (les routes manquantes renvoient 200/503 selon le design actuel).

- **Accès Dashboard**
  - Ouvrir: `/dashboard` (ou via la commande `/dashboard` qui génère le lien complet).
  - Le paramètre `guildId` est optionnel: `/dashboard?guildId=<ID>`.

- **Tests**
  - `npm test` passe (sanity check).