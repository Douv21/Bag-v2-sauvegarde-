# Commandes Admin (permissions requises)

- `/adminxp` (Administrateur): Gérer l'XP et les niveaux d'un membre
  - Options: `membre` (User, requis), `action` (Choix: add_xp, remove_xp, add_levels, remove_levels, set_xp, set_level, requis), `montant` (Integer, optionnel)

- `/add-level-reward` (Administrateur): Ajouter une récompense de rôle pour un niveau
  - Options: `niveau` (Integer 1-100, requis), `role` (Role, requis)

- `/backup-status` (Administrateur): État du système de sauvegarde MongoDB

- `/ban` (Administrateur): Bannir un membre
  - Options: `membre` (User, requis), `raison` (String)

- `/bump-reminder` (Gérer le serveur): Configurer les rappels de bump
  - Sous-commandes: `enable`, `disable`, `set-channel(channel)`, `set-interval(heures)`, `set-message(message)`, `set-role(role)`, `status`

- `/clear-commands` (Administrateur): Supprimer commandes Discord (guild/global/all)
  - Options: `type` (Choix: guild|global|all, requis), `confirmation` (Boolean, requis)

- `/config-aouv` (Administrateur): Configuration du jeu Action ou Vérité

- `/config-economie` (Administrateur): Configuration du système économique

- `/config-logs` (Administrateur): Configuration du système de logs

- `/config-moderation` (Administrateur): Configuration du système de modération

- `/dashboard` (Administrateur): Ouvre le tableau de bord minimal

- `/force-backup` (Administrateur): Forcer une sauvegarde manuelle vers MongoDB

- `/kick` (Administrateur): Expulser un membre
  - Options: `membre` (User, requis), `raison` (String)

- `/massban` (Administrateur): Bannir plusieurs utilisateurs par IDs
  - Options: `userids` (String, requis), `raison` (String)

- `/masskick` (Administrateur): Expulser plusieurs membres
  - Options: `membres` (String, requis), `raison` (String)

- `/mongodb-backup` (Administrateur): Gestion des sauvegardes MongoDB
  - Options: `action` (Choix: backup|restore|verify|list|scan, requis), `fichier` (String)

- `/mongodb-diagnostic` (Administrateur): Diagnostic de la connexion MongoDB

- `/mute` (Administrateur): Rendre muet un membre (timeout)
  - Options: `membre` (User, requis), `minutes` (Integer, min 1), `raison` (String)

- `/purge` (Administrateur): Vider le salon et/ou restaurer paramètres
  - Options: `messages` (Integer 1-100)

- `/reset` (Administrateur): Supprimer toutes les commandes globales du bot

- `/test-level-notif` (Administrateur): Forcer la notification de niveau et récompenses
  - Options: `utilisateur` (User)

- `/unban` (Administrateur): Débannir par ID
  - Options: `userid` (String, requis), `raison` (String)

- `/unmute` (Administrateur): Retirer le mute d'un membre
  - Options: `membre` (User, requis), `raison` (String)

- `/warn` (Administrateur): Avertir un membre
  - Options: `membre` (User, requis), `raison` (String)

- `/warns` (Administrateur): Voir les avertissements d'un membre
  - Options: `membre` (User, requis)

- `/unwarn` (Administrateur): Retirer le dernier avertissement d'un membre
  - Options: `membre` (User, requis)

- `/vider-salon` (Administrateur): Vider le salon et restaurer les paramètres spéciaux

- `/ajout-argent` (Administrateur): Ajouter du plaisir à un membre
  - Options: `membre` (User, requis), `montant` (Integer 1-999999, requis)

- `/retrait-argent` (Administrateur): Retirer du plaisir à un membre
  - Options: `membre` (User, requis), `montant` (Integer 1-999999, requis)

- `/ajout-karma` (Administrateur): Ajouter du karma (positif/négatif) à un membre
  - Options: `membre` (User, requis), `type` (Choix: good|bad, requis), `montant` (Integer 1-999, requis)

- `/retrait-karma` (Administrateur): Retirer du karma (positif/négatif) à un membre
  - Options: `membre` (User, requis), `type` (Choix: good|bad, requis), `montant` (Integer 1-999, requis)

- `/autothread` (Administrateur): Configuration du système auto-thread global

- `/config-confession` (Administrateur): Configuration avancée du système de confessions

- `/config-level` (Administrateur): Configuration du système de niveaux

- `/comptage` (Administrateur/Gérer le serveur): Configurer le jeu de comptage coquin