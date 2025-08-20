## Confessions

Commandes:

- `/confess texte:<String?> image:<Attachment?>`
  - Envoie une confession anonyme dans un salon autorisé. Supporte image optionnelle. Auto‑thread selon config.

Configuration:

- `/config-confession` — Menu avancé (handlers).
  - Canaux autorisés, niveau de logs (basic/detailed/full), canal de logs, rôles ping, auto‑thread (nom, auto‑archive), compteur, etc.

Remarques:
- Si la commande est utilisée hors des salons autorisés, la réponse indique la liste des salons valides.
- Un log admin est envoyé immédiatement dans le canal configuré avec le niveau choisi.

