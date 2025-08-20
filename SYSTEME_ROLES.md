# 🎭 Système de Rôles Personnalisés

## Vue d'ensemble

Le système de rôles personnalisés permet aux utilisateurs de choisir des rôles pour personnaliser leur profil Discord. Il inclut des catégories prédéfinies avec des rôles stylés et colorés.

## 🚀 Installation et Configuration

### 1. Initialisation

```bash
/role setup
```

Cette commande crée automatiquement :
- **40+ rôles prédéfinis** répartis en 6 catégories
- **Catégories configurées** avec règles d'exclusivité
- **Permissions par défaut** pour la gestion

### 2. Rôles Prédéfinis Créés

#### 🎨 **Couleurs** (Exclusif - 8 rôles)
- ❤️ Rouge Passion `#FF6B6B`
- 💙 Bleu Océan `#4ECDC4`  
- 💜 Violet Mystique `#BB8FCE`
- 💚 Vert Nature `#96CEB4`
- 🧡 Orange Soleil `#F39C12`
- 🌸 Rose Sakura `#F8BBD9`
- 👑 Or Royal `#F7DC6F`
- 🌙 Argent Lunaire `#D5DBDB`

#### 🎮 **Hobbies & Passions** (Multiple - 10 rôles)
- 🎮 Gamer
- 🍜 Otaku
- 🎵 Musicien
- 🎨 Artiste
- 📚 Lecteur
- 🎬 Cinéphile
- ⚽ Sportif
- 👨‍🍳 Cuisinier
- 📸 Photographe
- ✈️ Voyageur

#### 🔔 **Notifications** (Multiple - 5 rôles)
- 🎉 Événements
- 📢 Annonces
- 🎁 Giveaways
- 🔄 Mises à jour
- 🤝 Partenariats

#### 🌍 **Région** (Exclusif - 8 rôles)
- 🇫🇷 France
- 🇧🇪 Belgique
- 🇨🇭 Suisse
- 🇨🇦 Canada
- ⚜️ Québec
- 🏺 Maghreb
- 🏝️ DOM-TOM
- 🌐 International

#### ⭐ **Niveau de Participation** (Exclusif - 4 rôles)
- 🌱 Nouveau
- ⚡ Actif
- 🏆 Vétéran
- 👑 Légende

#### ✨ **Rôles Spéciaux** (Multiple - 5 rôles)
- 💎 Nitro Booster
- 📹 Créateur de Contenu
- 💻 Développeur
- 🎨 Designer
- 🤖 Bot Tester

## 📋 Commandes Disponibles

### Pour tous les utilisateurs

```bash
/role list [categorie]           # Afficher les rôles disponibles
/role get <role>                 # Obtenir un rôle
/role remove <role>              # Retirer un rôle
/role mes-roles [utilisateur]    # Voir ses rôles ou ceux d'un autre
/role panel                      # Panneau interactif de sélection
```

### Pour les administrateurs

```bash
/role create <nom> <categorie> [couleur] [emoji] [description]  # Créer un rôle
/role delete <role>                                             # Supprimer un rôle
/role config                                                    # Configuration avancée
/role category <action> <id>                                    # Gérer les catégories
/role setup [force]                                             # Initialiser le système
```

## 🎛️ Interface Interactive

### Panneau Principal
Le panneau interactif (`/role panel`) permet :
- **Navigation par catégories** avec menus déroulants
- **Sélection multiple** pour les catégories non-exclusives
- **Retrait en masse** des rôles d'une catégorie
- **Retour facile** aux catégories

### Fonctionnalités Avancées
- **Rôles exclusifs** : Un seul rôle par catégorie (ex: couleurs, région)
- **Rôles multiples** : Plusieurs rôles possibles (ex: hobbies, notifications)
- **Gestion automatique** : Retrait automatique des rôles conflictuels
- **Feedback visuel** : Statut des rôles (✅ possédé, ⭕ disponible)

## ⚙️ Configuration

### Permissions
- **Gérer les rôles** : Requis pour les commandes admin
- **Rôles personnalisés** : Configurables via `/role config`

### Limites
- **Rôles par utilisateur** : 10 par défaut (configurable)
- **Couleurs autorisées** : Liste prédéfinie modifiable
- **Catégories** : Illimitées

### Stockage des Données
```json
{
  "custom_roles": {
    "guild_id": {
      "roles": {
        "role_id": {
          "name": "Nom du rôle",
          "category": "couleurs",
          "description": "Description",
          "emoji": "🎨",
          "color": "#FF6B6B",
          "createdAt": 1234567890,
          "memberCount": 42
        }
      },
      "categories": {
        "couleurs": {
          "name": "🎨 Couleurs",
          "description": "Rôles de couleur",
          "exclusive": true,
          "roles": ["role_id_1", "role_id_2"]
        }
      }
    }
  }
}
```

## 🔧 Architecture Technique

### Fichiers Principaux
- `managers/RoleManager.js` - Logique métier
- `handlers/RoleInteractionHandler.js` - Interactions Discord
- `commands/role.js` - Commande principale
- `utils/defaultRoles.js` - Rôles prédéfinis

### Intégration
Le système s'intègre automatiquement au bot existant via :
- **DataManager** pour la persistance
- **InteractionHandler** pour les boutons/menus
- **CommandHandler** pour les commandes slash

## 🎨 Personnalisation

### Ajouter de Nouveaux Rôles
```javascript
// Dans utils/defaultRoles.js
{
  name: 'Nom du Rôle',
  emoji: '🎭',
  color: '#FF6B6B',
  description: 'Description du rôle'
}
```

### Créer une Nouvelle Catégorie
```bash
/role category create ma-categorie
```

### Modifier les Couleurs Autorisées
```bash
/role config
# Puis utiliser le bouton "Couleurs"
```

## 🚨 Sécurité et Permissions

### Vérifications Automatiques
- **Permissions Discord** : Vérification des droits avant actions
- **Rôles gérés** : Seuls les rôles du système sont modifiables
- **Limites utilisateur** : Respect du nombre maximum de rôles
- **Hiérarchie** : Respect de la hiérarchie des rôles Discord

### Logs et Audit
- **Actions loggées** : Création, suppression, attribution de rôles
- **Erreurs trackées** : Toutes les erreurs sont consignées
- **Statistiques** : Comptage des membres par rôle

## 📊 Utilisation Recommandée

### Pour les Serveurs Communautaires
1. Utiliser `/role setup` pour l'initialisation rapide
2. Personnaliser les catégories selon la communauté
3. Utiliser le panneau interactif pour l'engagement

### Pour les Serveurs Gaming
1. Ajouter des rôles par jeu dans la catégorie hobbies
2. Créer des rôles de notifications pour les événements
3. Utiliser les rôles de niveau pour la progression

### Pour les Serveurs Éducatifs
1. Créer des rôles par matière/classe
2. Utiliser les notifications pour les annonces importantes
3. Rôles spéciaux pour les enseignants/tuteurs

## 🔄 Maintenance

### Nettoyage Automatique
- **Compteurs mis à jour** : Nombre de membres par rôle
- **Rôles orphelins** : Détection des rôles sans membres
- **Cache optimisé** : Performances améliorées

### Sauvegarde
Les données sont automatiquement sauvegardées via le DataManager existant.

---

*Système créé pour améliorer l'engagement et la personnalisation des serveurs Discord* 🎭