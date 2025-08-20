## Sécurité & Vérifications

Ces commandes évaluent les risques, détectent des multi‑comptes, agrègent l’historique, et s’appuient sur `ModerationManager`.

Commandes:

- `/verifier membre:<User> detaille:<Bool?>` (Modérer les membres)
  - Analyse complète (multi‑comptes, historique cross-serveur, audit log, warns locaux, genre détecté, recommandations et actions rapides).

Configuration liée:

- `/config-verif`
  - Sous‑commandes:
    - `voir`: Affiche la configuration.
    - `activer etat:<Bool>`: Active/désactive le système.
    - `acces activer:<Bool> age-minimum:<Int?> score-max:<Int?>`: Portes d’accès (âge compte, score risque).
    - `roles quarantaine:<Role?> verifie:<Role?> canal-quarantaine:<Text?>`: Rôles/canal.
    - `actions compte-recent:<Choice> risque-eleve:<Choice>`: Actions automatiques (ALERT/QUARANTINE/ADMIN_APPROVAL/KICK/BAN selon le cas).
    - `admins canal-alertes:<Text?> role-admin:<Role?> delai:<Int?>`: Canal d’alertes, rôle à mentionner, délai d’approbation.
    - `whitelist action:<view|add_user|remove_user|add_role|remove_role> utilisateur:<User?> role:<Role?>`.

Bonnes pratiques:
- Commencer par `ALERT`/`QUARANTINE` avant d’activer `KICK`/`BAN` automatiques.
- Configurer un canal d’alertes et un rôle admin pour l’escalade rapide.

