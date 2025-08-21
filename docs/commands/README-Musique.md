## Musique (Lavalink)

Pré‑requis: Lavalink configuré et accessible. Le bot doit pouvoir « Se connecter » et « Parler » dans le salon vocal; et « Envoyer des messages » + « Intégrer des liens » dans le salon texte.

Qualité sonore:
- HQ par défaut: égaliseur subtil appliqué et volume par défaut à 85% pour éviter l'écrêtage.
- Désactiver HQ: définir `MUSIC_HQ_ENABLE=false` (ou `LAVALINK_HQ_FILTERS=false`).
- Volume par défaut: `MUSIC_DEFAULT_VOLUME=85` (0-100).
- Recherche YouTube Music (optionnel): `MUSIC_USE_YTM=true` (dépend du nœud Lavalink).

Commandes:

- `/play terme:<String>` — Ajoute un lien ou une recherche à la file. Affiche un lecteur (embed + boutons) si permissions texte OK.
- `/nowplaying` — Affiche le morceau en cours, met à jour le lecteur épinglé.
- `/queue` — Affiche la file.
- `/skip` — Passe au morceau suivant.
- `/pause` — Met en pause.
- `/resume` — Relance la lecture.
- `/seek secondes:<Int>` — Va à T secondes.
- `/stop` — Arrête et vide la file.
- `/volume pourcentage:<Int 0-100>` — Ajuste le volume.

Remarques:
- Toutes ces commandes exigent que vous soyez dans un salon vocal du serveur.
- Quand les permissions texte sont insuffisantes, le lecteur n’est pas posté; la réponse reste éphémère.

