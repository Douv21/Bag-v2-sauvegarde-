## Économie & Karma

Le « plaisir » (💋) est la monnaie. Le karma est séparé en positif (😇) et négatif (😈). La réputation (🥵) = 😇 + 😈.

Membre:

- `/economie utilisateur:<User?>` — Profil Boys & Girls (solde, karma, messages, streak…)
- `/daily` — Récompense quotidienne (streak, bonus karma)
- `/travailler` — Gain standard, léger 😇 et léger 😈 négatif (configurable)
- `/pecher` — Mini‑jeu pêche, gains variables + karma
- `/donner membre:<User> montant:<Int>=10+` — Transfert entre membres avec impact karma et cooldown
- `/objet` — Gérer vos objets (offrir/supprimer/interaction)
- Classements: `/karma`, `/topplaisir`

NSFW/Actions à risque (voir README‑Jeux‑NSFW pour détails): `aguicher`, `baiser`, `caresser`, `embrasser`, `fuck`, `massage`, `seduire`, `seduire-mass`, `after-dark`, `oser`.

Administration:

- `/ajout-argent membre:<User> montant:<Int 1-999999>` — Ajoute 💋
- `/retrait-argent membre:<User> montant:<Int 1-999999>` — Retire 💋
- `/ajout-karma membre:<User> type:<good|bad> montant:<Int 1-999>`
- `/retrait-karma membre:<User> type:<good|bad> montant:<Int 1-999>`

Configuration:

- `/config-economie` — Ouvre le menu complet d’économie (handlers dédiés)

Remarques:
- Beaucoup d’actions lisent/écrivent `economy.json` via `dataManager`.
- Cooldowns et gains sont personnalisables par action (économie).

