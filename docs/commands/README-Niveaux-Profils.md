## Niveaux & Profils

Commandes membre:

- `/level utilisateur:<User?>` — Affiche une carte de niveau (image) avec progression, rang, stats messages/vocal et dernière récompense potentielle.
- `/leaderboard limite:<Int 5-25?>` — Classement des niveaux (XP).
- `/profil-carte utilisateur:<User?>` — Génère une carte profil holographique (solde, karma, messages, vocal, dates, niveau).

Administration:

- `/adminxp membre:<User> action:<add_xp|remove_xp|add_levels|remove_levels|set_xp|set_level> montant:<Int?>` — Gère l’XP/niveaux.
- `/add-level-reward niveau:<Int 1-100> role:<Role>` — Associe un rôle à un niveau.
- `/test-level-notif utilisateur:<User?>` — Force l’envoi de notification de niveau (avec carte de récompense si applicable).
- `/config-level` — Menu complet: XP messages, XP vocal, notifications (canal+style), récompenses de rôle, formule, leaderboard.

Notes:
- Les cartes utilisent `utils/levelCardGenerator` et des données de `levelManager`.
- Le canal de notifications doit être configuré pour les annonces automatiques.

