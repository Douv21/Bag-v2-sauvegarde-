## Modération

Permissions requises: Administrateur (sauf mention contraire). Les actions sont loguées via `LogManager` et historisées via `ModerationManager`.

Commandes:

- `/ban membre:<User> raison:<String?>`
  - Bannit un membre. Ajoute à l'historique, journalise l'action.
- `/unban userid:<String> raison:<String?>`
  - Débannit par ID, log de l’événement si possible.
- `/kick membre:<User> raison:<String?>`
  - Expulse un membre. Historique + logs.
- `/mute membre:<User> minutes:<Int?> raison:<String?>`
  - Timeout (par défaut 60 min). Utilise `moderationManager.muteMember`.
- `/unmute membre:<User> raison:<String?>`
  - Retire le timeout via `moderationManager.unmuteMember`.
- `/warn membre:<User> raison:<String?>`
  - Ajoute un avertissement (stocké par `moderationManager`).
- `/warns membre:<User>`
  - Liste les avertissements d’un membre.
- `/unwarn membre:<User>`
  - Retire le dernier avertissement.
- `/massban userids:<String> raison:<String?>`
  - Bannit plusieurs IDs (séparés par espaces). Retourne succès/échecs.
- `/masskick membres:<String> raison:<String?>`
  - Expulse par @mentions/IDs multiples.
- `/purge messages:<Int 1-100?>`
  - Supprime N messages ou fait une purge étendue avec restauration des features (confession, counting, autothread).
- `/vider-salon`
  - Équivalent purge étendue sur le salon courant.
- `/historique membre:<User>`
  - Résumé cross‑serveur + audit log + warns locaux pour un membre.

Remarques:
- Beaucoup de réponses sont éphémères. En cas d’erreur, vérifier les permissions du bot (Connect/Speak en vocal non concerné ici) et l’existence du membre.
- Les actions de groupe (massban/masskick) ne s’arrêtent pas au premier échec et fournissent un récapitulatif.

