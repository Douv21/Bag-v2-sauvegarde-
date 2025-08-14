# Bot Discord Action ou Vérité (FR)

Un bot Discord en français pour jouer à Action ou Vérité avec des boutons. Inclut 100 actions et 100 vérités adaptées à un serveur Discord.

## Installation

1. Crée une application et un bot sur le [Portail des développeurs Discord](https://discord.com/developers/applications).
2. Active le bot, copie le token et garde-le précieusement.
3. Donne au bot les scopes suivants lors de l'invitation:
   - `applications.commands`
   - `bot`
4. Permissions minimales recommandées:
   - Envoyer des messages
   - Intégrer des liens (embeds)
   - Utiliser des emojis externes (facultatif)

## Déploiement local

```bash
cd /workspace/discord-truth-dare-bot
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Édite .env et remplace le token
python bot.py
```

Dans `.env`, ajoute:

```bash
DISCORD_BOT_TOKEN=ton-token-ici
```

## Commandes

- `/aouv` : Démarre le jeu dans le salon, avec deux boutons « Action » et « Vérité ». Chaque clic poste un nouveau prompt public pour l'utilisateur qui a cliqué.
- `/action` : Envoie une action aléatoire (message unique, sans boutons).
- `/verite` : Envoie une vérité aléatoire (message unique, sans boutons).
- `/aouvconfig` : Commandes d’administration (réservées aux membres avec « Gérer le serveur »).

### Configuration des salons

- `/aouvconfig channel add salon:#salon` — autorise ce salon pour le jeu.
- `/aouvconfig channel remove salon:#salon` — retire ce salon.
- `/aouvconfig channel list` — liste des salons autorisés.

Si aucun salon n’est configuré, le jeu est autorisé dans tous les salons. Si des salons sont configurés, `/aouv` refusera ailleurs.

### Gestion des prompts

Prompts combinés = prompts de base (100/100) − désactivés + personnalisés du serveur.

- Ajouter: `/aouvconfig prompt add kind:(action|vérité) texte:"..."`
- Modifier: `/aouvconfig prompt edit kind:(action|vérité) prompt_id:XXXXXXXX texte:"..."`
- Supprimer: `/aouvconfig prompt remove kind:(action|vérité) prompt_id:XXXXXXXX`
- Lister (custom): `/aouvconfig prompt list-custom kind:(action|vérité)`
- Désactiver base: `/aouvconfig prompt disable-base kind:(action|vérité) numero:1..n`
- Réactiver base: `/aouvconfig prompt enable-base kind:(action|vérité) numero:1..n`
- Lister base (paginé): `/aouvconfig prompt list-base kind:(action|vérité) page:1`

Les IDs renvoyés pour les prompts personnalisés sont courts (8 hex) et propres à chaque serveur.

## Données et persistance

- Les configurations sont stockées en JSON dans `data/config.json` à la racine du projet (créé automatiquement).
- Les données sont séparées par serveur (guild ID).

## Notes

- Les boutons expirent après 15 minutes d'inactivité sur le message initial.
- Le bot n'a pas besoin d'intents privilégiés pour ces fonctionnalités de base.
- Si les commandes slash n'apparaissent pas immédiatement, patiente quelques minutes ou redémarre le bot pour resynchroniser.