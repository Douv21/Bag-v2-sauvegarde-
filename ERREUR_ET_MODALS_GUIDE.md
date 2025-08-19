# 🛠️ Système de Gestion d'Erreurs et Modals

Ce guide détaille le système avancé de gestion d'erreurs critiques et de modals non implémentées ajouté au bot Discord.

## 📋 Vue d'ensemble

Le système comprend deux composants principaux :

1. **ErrorHandler** - Gestion centralisée des erreurs avec logging avancé
2. **ModalHandler** - Gestion automatique des modals implémentées et non implémentées

## 🔥 Système de Gestion d'Erreurs

### Fonctionnalités

- **Logging avec niveaux** : INFO, WARNING, ERROR, CRITICAL
- **Sauvegarde automatique** des logs dans `data/error_logs.json`
- **Console colorée** avec émojis pour une meilleure lisibilité
- **Statistiques d'erreurs** avec calcul d'indicateurs de santé
- **Gestion des erreurs critiques** avec notifications utilisateur
- **Wrapper de fonctions** pour capture automatique d'erreurs

### Utilisation

```javascript
const { errorHandler, ErrorLevels } = require('./utils/errorHandler');

// Logging simple
await errorHandler.logError(ErrorLevels.INFO, 'Message informatif');
await errorHandler.logError(ErrorLevels.ERROR, 'Erreur détectée', error, { context: 'data' });

// Gestion d'erreur critique avec interaction
await errorHandler.handleCriticalError(error, { context: 'commande' }, interaction);

// Statistiques
const { stats } = await errorHandler.getErrorStats(24); // 24 dernières heures
```

### Niveaux d'erreurs

| Niveau | Émoji | Couleur | Description |
|--------|-------|---------|-------------|
| INFO | ℹ️ | Cyan | Informations générales |
| WARNING | ⚠️ | Jaune | Avertissements |
| ERROR | ❌ | Rouge | Erreurs standards |
| CRITICAL | 🔥 | Rouge sur blanc | Erreurs critiques |

## 🎛️ Système de Gestion des Modals

### Fonctionnalités

- **Détection automatique** des modals non implémentées
- **Formulaire de feedback** pour les fonctionnalités manquantes
- **Suivi des demandes** utilisateur avec priorités
- **Messages informatifs** pour les fonctionnalités en développement
- **Gestion centralisée** des modals implémentées

### Modals Implémentées

✅ **Actuellement disponibles** :
- `action_config_modal` - Configuration des actions économiques
- `objet_perso_modal` - Objets personnalisés
- `role_config_modal` - Configuration des rôles
- `remise_karma_modal` - Remise de karma
- `daily_amount_modal` - Montants quotidiens
- `daily_streak_modal` - Séries quotidiennes
- `message_amount_modal` - Montants messages
- `message_cooldown_modal` - Cooldown messages
- `message_limits_modal` - Limites messages ⭐ **NOUVEAU**
- `karma_levels_modal` - Niveaux de karma
- `create_positive_reward_modal` - Récompenses positives
- `create_negative_reward_modal` - Récompenses négatives

### Modals Planifiées

🚧 **En développement** :
- `advanced_karma_modal` - Configuration avancée du karma
- `backup_settings_modal` - Configuration des sauvegardes
- `notification_settings_modal` - Paramètres de notifications
- `role_permissions_modal` - Gestion des permissions de rôles
- `economy_settings_modal` - Paramètres économiques avancés
- `level_rewards_modal` - Configuration des récompenses de niveau
- `custom_commands_modal` - Création de commandes personnalisées
- `automod_settings_modal` - Configuration de la modération automatique
- `welcome_message_modal` - Configuration des messages de bienvenue

### Utilisation

```javascript
const { modalHandler } = require('./utils/modalHandler');

// Vérifier si un modal est implémenté
const isImplemented = modalHandler.isModalImplemented('advanced_karma_modal');

// Gérer automatiquement les soumissions de modals
const result = await modalHandler.handleModalSubmission(interaction);
// Retourne true si implémenté, false si géré automatiquement

// Obtenir la liste des modals
const { implemented, planned } = modalHandler.getAvailableModals();
```

## 📊 Suivi et Monitoring

Le suivi de l'état du système et des modals se fait via le système de logs centralisé et les métriques internes. Consultez les logs pour :

- Nombre total d'événements
- Répartition par niveau (critique, erreur, warning, info)
- Indicateurs de santé du système
- Erreurs critiques récentes

## 🔧 Intégration dans le Code Principal

### Événements Discord

Le système est automatiquement intégré dans tous les événements Discord :

```javascript
// Gestion automatique des erreurs d'interaction
this.client.on('interactionCreate', async interaction => {
    try {
        // Vérification automatique des modals
        if (interaction.isModalSubmit()) {
            const modalImplemented = await modalHandler.handleModalSubmission(interaction);
            if (!modalImplemented) return; // Géré automatiquement
        }
        
        await this.handleInteraction(interaction);
    } catch (error) {
        await errorHandler.handleCriticalError(error, {
            context: 'interactionCreate event',
            interactionType: interaction.type
        }, interaction);
    }
});
```

### Handlers d'Erreurs

Tous les handlers existants utilisent maintenant le système centralisé :

```javascript
} catch (error) {
    await errorHandler.logError(ErrorLevels.ERROR, 'Erreur traitement message', error, {
        messageId: message.id,
        authorId: message.author.id,
        guildId: message.guild?.id
    });
}
```

## 🎯 Nouveautés Ajoutées

### 1. Modal Limites Messages

**Nouveau modal implémenté** : `message_limits_modal`

Permet de configurer :
- Messages maximum par jour par utilisateur
- Messages maximum par heure par utilisateur
- Protection anti-spam (messages/minute)
- Rôles exemptés des limites

### 2. Gestion Automatique des Modals Non Implémentées

Quand un utilisateur essaie d'utiliser un modal non implémenté :

1. **Détection automatique** du modal manquant
2. **Message informatif** avec statut de développement
3. **Formulaire de feedback** optionnel
4. **Logging de la demande** pour priorisation

### 3. Système de Feedback Utilisateur

Les utilisateurs peuvent :
- Donner leur feedback sur les fonctionnalités manquantes
- Indiquer leur priorité (1-5)
- Laisser leurs coordonnées pour être contactés
- Contribuer à la priorisation du développement

## 📈 Indicateurs de Santé

Le système calcule automatiquement des indicateurs de santé :

| État | Condition | Action |
|------|-----------|--------|
| 🟢 Excellent | Aucune erreur critique | Surveillance normale |
| 🟡 Vigilance | > 20 warnings | Attention accrue |
| 🟠 Attention | > 10 erreurs | Investigation requise |
| 🔴 Critique | Erreurs critiques | Action immédiate |

## 🔄 Maintenance

### Logs d'Erreurs

- **Rotation automatique** : Garde les 1000 derniers logs
- **Sauvegarde** : `data/error_logs.json`
- **Analyse** : Disponible via le système de logs et d'outils internes

### Surveillance

```javascript
// Récupérer les stats des dernières 24h
const { stats, recentLogs } = await errorHandler.getErrorStats(24);

// Vérifier la santé du système
if (stats.critical > 0) {
    // Alerter les administrateurs
}
```

## 🚀 Avantages du Système

1. **Proactivité** : Détection automatique des erreurs
2. **Transparence** : Utilisateurs informés des fonctionnalités manquantes
3. **Amélioration continue** : Feedback utilisateur pour priorisation
4. **Monitoring** : Surveillance en temps réel de la santé du bot
5. **Debugging facilité** : Logs détaillés avec contexte
6. **Expérience utilisateur** : Messages clairs au lieu d'erreurs silencieuses

---

## 📞 Support

Pour toute question concernant ce système :

1. Consultez l'état via les logs et métriques internes
2. Consultez les logs d'erreurs
3. Vérifiez les modals implémentées vs planifiées
4. Contactez l'équipe de développement avec les informations de diagnostic

**Version** : 2.0.0 - Système d'erreurs et modals intégré
**Date** : Janvier 2025