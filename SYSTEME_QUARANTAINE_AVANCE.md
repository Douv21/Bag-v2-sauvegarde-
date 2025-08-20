# 🔒 SYSTÈME DE QUARANTAINE AVANCÉ

## 🎯 Vue d'ensemble

Le système de quarantaine avancé crée automatiquement des canaux personnalisés pour chaque membre suspect et l'isole complètement du reste du serveur, tout en permettant aux modérateurs de communiquer avec lui.

## ✨ Fonctionnalités principales

### 🚀 Quarantaine automatique
- **Déclenchement** : Score de risque élevé, compte trop récent, multi-comptes détectés
- **Création automatique** : Canaux texte et vocal personnalisés
- **Isolation complète** : Accès retiré à TOUS les autres canaux
- **Communication** : Message de bienvenue explicatif dans le canal de quarantaine

### 🏗️ Infrastructure automatique
- **Catégorie** : Création automatique d'une catégorie "🔒 QUARANTAINE"
- **Canal texte** : `quarantaine-[nom]-[timestamp]`
- **Canal vocal** : `🔊 Quarantaine [nom]`
- **Rôle** : Création automatique du rôle "Quarantaine" si inexistant

### 🔐 Permissions strictes
- **Membre en quarantaine** :
  - ✅ Accès uniquement à ses canaux de quarantaine
  - ❌ Aucun accès aux autres canaux du serveur
  - ✅ Peut écrire et parler dans ses canaux
- **Modérateurs** :
  - ✅ Accès complet aux canaux de quarantaine
  - ✅ Gestion des messages et membres
  - ✅ Permissions de déplacement vocal

### 🧹 Nettoyage automatique
- **Libération** : Suppression automatique des canaux
- **Restauration** : Accès restauré à tous les canaux
- **Catégorie** : Supprimée si vide après nettoyage

## 📋 Commandes disponibles

### `/quarantaine appliquer`
Mettre un membre en quarantaine manuellement
```
/quarantaine appliquer membre:@Suspect raison:"Comportement suspect"
```

### `/quarantaine liberer`
Libérer un membre de la quarantaine
```
/quarantaine liberer membre:@Membre raison:"Vérification terminée"
```

### `/quarantaine liste`
Voir tous les membres actuellement en quarantaine
```
/quarantaine liste
```

### `/quarantaine info`
Voir les détails d'une quarantaine spécifique
```
/quarantaine info membre:@Membre
```

### `/quarantaine nettoyer`
Nettoyer les canaux de quarantaine orphelins
```
/quarantaine nettoyer
```

### `/test-verif quarantaine`
Tester le système complet de quarantaine
```
/test-verif quarantaine membre:@TestMember
```

## 🔧 Configuration requise

### 1. Permissions du bot
Le bot doit avoir les permissions suivantes :
- **Gérer les rôles** : Pour créer et attribuer le rôle de quarantaine
- **Gérer les canaux** : Pour créer/supprimer les canaux
- **Gérer les permissions** : Pour configurer l'isolation
- **Voir les canaux** : Pour accéder aux canaux existants
- **Envoyer des messages** : Pour les notifications

### 2. Configuration de sécurité
```bash
# Activer le système
/config-verif activer etat:true

# Configurer le contrôle d'accès
/config-verif acces activer:true age-minimum:7 score-max:40

# Configurer les actions automatiques
/config-verif actions compte-recent:QUARANTINE risque-eleve:QUARANTINE

# Configurer les notifications admin
/config-verif admins canal-alertes:#securite role-admin:@Modérateurs
```

## 🔄 Processus de quarantaine

### Étape 1 : Déclenchement
- Nouveau membre rejoint le serveur
- Analyse de sécurité effectuée
- Score de risque calculé
- Décision automatique selon la configuration

### Étape 2 : Isolation
1. **Rôle** : Création/attribution du rôle de quarantaine
2. **Canaux** : Création des canaux personnalisés
3. **Permissions** : Configuration de l'isolation complète
4. **Données** : Enregistrement des informations

### Étape 3 : Communication
1. **Message privé** : Notification au membre avec liens des canaux
2. **Message d'accueil** : Embed explicatif dans le canal texte
3. **Alerte admin** : Notification avec boutons d'action rapide

### Étape 4 : Résolution
1. **Décision admin** : Approuver ou refuser
2. **Nettoyage** : Suppression des canaux
3. **Restauration** : Accès restauré au serveur
4. **Archivage** : Données marquées comme résolues

## 🎮 Interface administrative

### Notifications avec boutons
Les alertes de quarantaine incluent des boutons pour :
- ✅ **Approuver** : Libère le membre automatiquement
- ❌ **Refuser & Ban** : Bannit le membre et nettoie
- 🔍 **Examiner** : Lien direct vers le canal de quarantaine

### Informations détaillées
Chaque notification contient :
- Informations du membre (nom, âge du compte, avatar)
- Raison de la quarantaine et score de risque
- Liens directs vers les canaux créés
- Actions recommandées et boutons rapides

## 📊 Gestion des données

### Structure de stockage
```json
{
  "guildId": {
    "userId": {
      "reason": "Compte trop récent (3j < 7j)",
      "score": 65,
      "textChannelId": "123456789",
      "voiceChannelId": "987654321",
      "timestamp": 1703123456789,
      "status": "active", // ou "resolved"
      "guildId": "guild123",
      "userId": "user456",
      "resolvedAt": 1703123556789, // si résolu
      "resolvedReason": "Vérification manuelle OK"
    }
  }
}
```

### Historique complet
- Toutes les quarantaines sont archivées
- Traçabilité des décisions administratives
- Statistiques disponibles via `/quarantaine liste`

## 🛡️ Sécurité et robustesse

### Système de fallback
- Si la création de canaux échoue : quarantaine simple avec rôle
- Si les permissions échouent : logs d'erreur détaillés
- Si le nettoyage échoue : commande manuelle disponible

### Protection contre les abus
- Impossible de mettre un administrateur en quarantaine
- Vérification des permissions avant chaque action
- Logs détaillés de toutes les opérations

### Gestion des erreurs
- Rate limiting automatique pour les créations de canaux
- Traitement par lots des modifications de permissions
- Messages d'erreur explicites pour le débogage

## 🧪 Tests et validation

### Test automatique complet
La commande `/test-verif quarantaine` permet de :
1. Tester la création des canaux
2. Vérifier l'isolation des permissions
3. Valider les notifications admin
4. Tester le nettoyage automatique

### Validation manuelle
1. Créer un compte Discord de test récent
2. Le faire rejoindre le serveur
3. Vérifier la quarantaine automatique
4. Tester la libération manuelle
5. Confirmer le nettoyage des canaux

## 📈 Avantages du système

### Pour les administrateurs
- **Contrôle total** : Isolation complète des membres suspects
- **Communication directe** : Canal dédié pour échanger avec le membre
- **Automatisation** : Moins d'intervention manuelle requise
- **Traçabilité** : Historique complet des quarantaines

### Pour les membres
- **Communication claire** : Explication de la situation
- **Possibilité d'échange** : Canal pour s'expliquer
- **Processus transparent** : Étapes clairement définies
- **Résolution rapide** : Interface admin facilitée

### Pour le serveur
- **Sécurité renforcée** : Isolation totale des menaces
- **Organisation** : Canaux dédiés, pas de pollution
- **Efficacité** : Nettoyage automatique
- **Évolutivité** : Système adaptable selon les besoins

## 🚨 Points d'attention

### Permissions Discord
- Le bot doit être plus haut que les rôles qu'il gère
- Vérifier les permissions sur tous les canaux existants
- S'assurer que les modérateurs ont accès aux canaux de quarantaine

### Performance
- Traitement par lots pour éviter les rate limits
- Délais entre les opérations massives
- Nettoyage régulier des données anciennes

### Maintenance
- Surveiller les logs pour les erreurs de permissions
- Nettoyer périodiquement les canaux orphelins
- Vérifier la configuration après les mises à jour Discord

Ce système offre une solution complète et robuste pour gérer les membres suspects tout en maintenant une communication claire et un contrôle administratif optimal.