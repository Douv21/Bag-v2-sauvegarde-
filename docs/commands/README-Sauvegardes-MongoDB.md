## Sauvegardes MongoDB

Commandes:

- `/backup-status` — État du système de sauvegarde (connexion, intégrité, environnement, collections).
- `/force-backup` — Force une sauvegarde manuelle (résumé + durée).
- `/mongodb-diagnostic` — Diagnostic de la connexion MongoDB Atlas.
- `/mongodb-backup action:<backup|restore|verify|list|scan> fichier:<String?>`
  - backup: sauvegarde fichiers vers Mongo.
  - restore: restauration (option fichier cible).
  - verify: vérifie l’intégrité (logs côté serveur).
  - list: liste collections et total documents.
  - scan: recense les fichiers JSON `/data` et leurs collections cibles.

Remarques:
- Les identifiants Mongo doivent être présents en variables d’environnement.
- L’intégrité détaillée se lit dans les logs serveur.

