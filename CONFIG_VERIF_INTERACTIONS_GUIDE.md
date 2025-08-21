# 🎛️ Guide des Interactions Config-Verif

Ce guide détaille toutes les interactions disponibles pour la commande `/config-verif menu` et leur fonctionnement.

## 🚀 Commande Principale

### `/config-verif menu`
- **Description :** Ouvre le menu de configuration principal du système de vérification
- **Permissions :** Administrateur uniquement
- **Réponse :** Interface interactive avec menu déroulant et boutons

## 📋 Menu Déroulant Principal

Le menu `config_verif_menu` propose 6 options :

### 🔍 Vérification automatique (`auto_verification`)
- **Fonction :** Affiche la configuration de la vérification automatique
- **Contenu :**
  - État actuel (activé/désactivé)
  - Paramètres configurés (âge minimum, score de risque, seuil multi-comptes)
  - Instructions pour modifier les paramètres
- **Boutons disponibles :**
  - `config_verif_toggle_auto` - Activer/désactiver rapidement
  - `config_verif_back_menu` - Retour au menu principal

### 🔒 Système de quarantaine (`quarantine_system`)
- **Fonction :** Affiche la configuration du système de quarantaine
- **Contenu :**
  - État de configuration
  - Rôles configurés (quarantaine et vérifié)
  - Explication du fonctionnement automatique
- **Boutons disponibles :**
  - `config_verif_back_menu` - Retour au menu principal

### ⚡ Actions automatiques (`auto_actions`)
- **Fonction :** Affiche les actions configurées pour chaque type de suspect
- **Contenu :**
  - Actions pour comptes récents
  - Actions pour multi-comptes
  - Actions pour noms suspects
  - Avertissements de sécurité
- **Boutons disponibles :**
  - `config_verif_back_menu` - Retour au menu principal

### 📢 Notifications admin (`notifications`)
- **Fonction :** Affiche la configuration des notifications
- **Contenu :**
  - État des alertes
  - Canal d'alertes configuré
  - Rôle admin configuré
  - Délai de décision
- **Boutons disponibles :**
  - `config_verif_back_menu` - Retour au menu principal

### 📝 Exemptions (`exemptions`)
- **Fonction :** Affiche les exemptions de vérification
- **Contenu :**
  - Nombre total d'exemptions
  - Répartition utilisateurs/rôles
  - Instructions de gestion
- **Boutons disponibles :**
  - `config_verif_show_exemptions` - Voir la liste détaillée
  - `config_verif_back_menu` - Retour au menu principal

### 📊 Voir configuration (`view_config`)
- **Fonction :** Affiche la configuration complète
- **Contenu :**
  - État général du système
  - Détails de vérification automatique
  - Infrastructure configurée
  - Statistiques des exemptions
- **Boutons disponibles :**
  - `config_verif_back_menu` - Retour au menu principal

## 🔘 Boutons Principaux

### ✅/❌ Activer/Désactiver système (`config_verif_enable`)
- **Fonction :** Bascule l'état du système de sécurité
- **Comportement :**
  - Bouton vert "Activer système" si désactivé
  - Bouton rouge "Désactiver système" si activé
- **Réponse :** Confirmation de l'action avec nouvel état

### 🗑️ Réinitialiser (`config_verif_reset`)
- **Fonction :** Lance le processus de réinitialisation
- **Comportement :** Affiche une confirmation avant action
- **Boutons de confirmation :**
  - `config_verif_reset_confirm` - Confirmer la suppression
  - `config_verif_reset_cancel` - Annuler l'opération

### ❓ Guide d'aide (`config_verif_help`)
- **Fonction :** Affiche le guide d'aide détaillé
- **Contenu :** Explication de chaque section du système
- **Boutons disponibles :**
  - `config_verif_back_menu` - Retour au menu principal

## 🔄 Boutons de Navigation

### 🔙 Retour au menu (`config_verif_back_menu`)
- **Fonction :** Retourne au menu principal depuis n'importe quelle sous-section
- **Comportement :** Met à jour l'interface avec le menu complet
- **Disponible dans :** Toutes les sous-sections

### 📋 Voir la liste (`config_verif_show_exemptions`)
- **Fonction :** Affiche la liste détaillée des exemptions
- **Contenu :**
  - Liste des utilisateurs exemptés (max 10 affichés)
  - Liste des rôles exemptés (max 10 affichés)
  - Gestion des utilisateurs/rôles introuvables
- **Condition :** Désactivé si aucune exemption

### ✅/❌ Toggle Auto-Vérification (`config_verif_toggle_auto`)
- **Fonction :** Bascule rapidement la vérification automatique
- **Comportement :** Activer/désactiver sans confirmation
- **Réponse :** Confirmation de l'action

## 🔒 Confirmations de Sécurité

### ✅ Confirmer Reset (`config_verif_reset_confirm`)
- **Fonction :** Exécute la réinitialisation complète
- **Action :** Supprime toute la configuration de sécurité
- **Réponse :** Confirmation de réinitialisation terminée

### ❌ Annuler Reset (`config_verif_reset_cancel`)
- **Fonction :** Annule la réinitialisation
- **Réponse :** Confirmation d'annulation

## 🎨 États Visuels

### Couleurs des Embeds
- **🟢 Vert (0x51cf66) :** Système activé, configuration OK
- **🔴 Rouge (0xff6b6b) :** Avertissements, confirmations dangereuses
- **🔵 Bleu (0x3498db) :** Informations, aide
- **⚫ Gris (0x6c757d) :** Système désactivé, annulations

### Styles des Boutons
- **Success (Vert) :** Actions positives (Activer)
- **Danger (Rouge) :** Actions destructives (Désactiver, Reset)
- **Secondary (Gris) :** Navigation (Retour, Annuler)
- **Primary (Bleu) :** Actions d'information (Voir liste)

## 🔧 Gestion d'Erreurs

### Erreurs Communes
- **Handler non disponible :** Message d'erreur si SecurityConfigHandler n'est pas initialisé
- **Permissions insuffisantes :** Vérification des permissions administrateur
- **Système de modération indisponible :** Vérification du moderationManager
- **Custom ID non reconnu :** Gestion des interactions inconnues

### Messages d'Erreur
- `❌ Réservé aux administrateurs.`
- `❌ Système de modération non disponible.`
- `❌ Erreur lors de la configuration.`
- `❌ Action non reconnue.`

## 📱 Réactivité

### Types de Réponses
- **Reply :** Première réponse à une interaction
- **Update :** Mise à jour de l'interface existante
- **Ephemeral :** Messages privés (flags: 64)

### Persistance
- Menu principal : Visible pour tous
- Sous-menus : Éphémères (privés)
- Confirmations : Éphémères avec timeout

## 🚀 Flux d'Utilisation Typique

1. **Démarrage :** `/config-verif menu`
2. **Navigation :** Sélection dans le menu déroulant
3. **Configuration :** Utilisation des boutons d'action rapide
4. **Retour :** Bouton "Retour au menu" pour navigation
5. **Actions importantes :** Confirmations pour reset/modifications critiques

## 🔍 Débogage

### Tests Disponibles
- `node test-config-verif-simple.js` - Test de structure
- `node test-config-verif-interactions.js` - Test complet (nécessite discord.js)

### Logs de Debug
- Tous les handlers loggent les erreurs avec `console.error`
- Custom IDs tracés pour debugging
- États de configuration affichés dans les réponses

## 📋 Checklist de Fonctionnement

- ✅ Commande `/config-verif menu` accessible
- ✅ Menu déroulant avec 6 options fonctionnelles
- ✅ 3 boutons principaux (Activer, Reset, Aide)
- ✅ Navigation fluide entre sections
- ✅ Confirmations pour actions dangereuses
- ✅ Gestion d'erreurs robuste
- ✅ Messages informatifs et clairs
- ✅ Permissions correctement vérifiées
- ✅ Interface responsive et intuitive