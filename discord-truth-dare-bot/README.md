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

- `/av` : Affiche les boutons « Action » et « Vérité ».
- `/action` : Tire directement une action.
- `/verite` : Tire directement une vérité.

Chaque commande accepte un paramètre `ephemere` (booléen) pour rendre la réponse privée (visible uniquement par toi).

## Personnalisation

- Les listes se trouvent dans `prompts.py` (`ACTIONS` et `VERITES`).
- Tu peux ajouter/supprimer/modifier des entrées librement.

## Notes

- Les boutons expirent après 2 minutes d'inactivité.
- Le bot n'a pas besoin d'intents privilégiés pour ces fonctionnalités de base.
- Si les commandes slash n'apparaissent pas immédiatement, patiente quelques minutes ou redémarre le bot pour resynchroniser.