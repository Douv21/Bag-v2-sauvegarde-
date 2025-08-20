## Système de logs

Commandes:

- `/config-logs` (Admin)
  - Ouvre un menu permettant de configurer les catégories de logs, activer/désactiver et définir le canal par catégorie.

Fonctionnement:

- Un sélecteur vous permet de choisir la catégorie (messages, members, nicknames, roles, voice, moderation, economy, channels, threads, emojis, stickers, invites, webhooks, server, boosts, events, etc.).
- Pour chaque catégorie, deux actions principales:
  - Activer/Désactiver la catégorie
  - Définir le canal cible de la catégorie

Remarques:
- Le bot envoie les embeds vers le canal configuré pour chaque catégorie via `LogManager.sendToCategory`.
- Si une catégorie n’a pas de canal défini, un fallback peut s’appliquer (autre catégorie configurée).

