## Musique (Lavalink)

Pré‑requis: Lavalink configuré et accessible. Le bot doit pouvoir « Se connecter » et « Parler » dans le salon vocal; et « Envoyer des messages » + « Intégrer des liens » dans le salon texte.

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

