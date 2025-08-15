# Suites Privées — Expiration et Nettoyage

Cette note décrit le fonctionnement d'expiration des suites privées (rôle + salons), ainsi que les moyens de vérification.

## Comportement
- À l'achat d'une suite, un rôle dédié est créé et attribué à l'acheteur, puis les salons privés sont créés.
- Si la suite est temporaire, une expiration (`expiresAt`) est enregistrée.
- Un timer planifie la suppression à l'échéance, et un scan au démarrage repasse sur toutes les suites pour fiabiliser le nettoyage même si le bot était hors-ligne.

## Implémentation
- Création: `utils/privateSuiteManager.js` → `createPrivateSuite(interaction, member, { durationDays })`
- Planification: `utils/privateSuiteManager.js` → `scheduleExpiry(client, suiteRecord)`
- Scan/auto-réparation au démarrage: `utils/privateSuiteManager.js` → `scanAndRepairSuites(client)` (appelé dans `index.render-final.js` et `index.production.js`)
- Nettoyage effectif: `utils/privateSuiteManager.js` → `cleanupSuite(client, suiteRecord)`
  - Supprime le salon texte et (le cas échéant) le salon vocal
  - Supprime le rôle dédié de la suite
  - Retire l'enregistrement de `data/private_suites.json`

## Vérifications
1. Démarrage: vérifier dans les logs `🔒 Suites privées prêtes`.
2. Achat: le code appelle `scheduleExpiry(...)` après `createPrivateSuite(...)`, ce qui programme le cleanup à la date d'expiration.
3. Redémarrage: le scan applique le cleanup immédiat des suites expirées (cas bot hors-ligne à l'heure d'échéance).

## Diagnostic rapide
- Exécuter:
  ```bash
  npm run diag:suites
  ```
- Comportement:
  - Affiche les suites actives/expirées par serveur
  - Avec `--fail-on-expired`, retourne un code de sortie ≠ 0 s'il reste des suites expirées dans `data/private_suites.json`

## Notes
- Les suites permanentes n'ont pas d'expiration et ne sont pas supprimées automatiquement.
- Assurez-vous que le bot dispose des permissions de gestion des rôles et de suppression de salons.