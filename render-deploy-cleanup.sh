#!/bin/bash

# Script de nettoyage automatique pour le redéploiement sur Render
# Ce script supprime les fichiers inutiles avant le déploiement

echo "🚀 Démarrage du nettoyage pour Render..."

# Répertoire des commandes
COMMANDS_DIR="./commands"

# Vérifier que le répertoire existe
if [ ! -d "$COMMANDS_DIR" ]; then
    echo "❌ Erreur: Le répertoire $COMMANDS_DIR n'existe pas"
    exit 1
fi

echo "📂 Nettoyage du répertoire: $COMMANDS_DIR"

# Compteurs
removed_count=0
kept_count=0

# Fonction pour supprimer un fichier
remove_file() {
    local file="$1"
    local reason="$2"
    
    if [ -f "$COMMANDS_DIR/$file" ]; then
        echo "🗑️ Suppression: $file ($reason)"
        rm "$COMMANDS_DIR/$file"
        ((removed_count++))
    fi
}

# Supprimer les commandes de test et diagnostic
echo "🧪 Suppression des commandes de test..."
remove_file "test-verif.js" "Commande de test"
remove_file "test-level-notif.js" "Commande de test"
remove_file "diagnostic-quarantine.js" "Diagnostic"
remove_file "mongodb-diagnostic.js" "Diagnostic"

# Supprimer les commandes de backup/maintenance
echo "🔧 Suppression des commandes de maintenance..."
remove_file "force-backup.js" "Maintenance"
remove_file "mongodb-backup.js" "Backup"
remove_file "backup-status.js" "Status backup"

# Supprimer les versions obsolètes
echo "📦 Suppression des versions obsolètes..."
remove_file "voler-old.js" "Version obsolète"
remove_file "parier-old.js" "Version obsolète"

# Supprimer les commandes administratives de développement
echo "⚙️ Suppression des outils de développement..."
remove_file "clear-commands.js" "Outil de dev"
remove_file "reset.js" "Outil de dev"

# Supprimer les fichiers média inutiles
echo "🖼️ Suppression des fichiers média..."
remove_file "1" "Fichier temporaire"
remove_file "1.jpg" "Image inutile"
remove_file "2.jpg" "Image inutile"
remove_file "2.png" "Image inutile"
remove_file "3.jpg" "Image inutile"
remove_file "3.png" "Image inutile"
remove_file "default-avatar.png" "Avatar par défaut"

# Compter les fichiers restants
for file in "$COMMANDS_DIR"/*; do
    if [ -f "$file" ]; then
        ((kept_count++))
    fi
done

# Nettoyer les fichiers temporaires du système
echo "🧹 Nettoyage des fichiers temporaires..."
find "$COMMANDS_DIR" -name "*.tmp" -delete 2>/dev/null || true
find "$COMMANDS_DIR" -name "*.log" -delete 2>/dev/null || true
find "$COMMANDS_DIR" -name ".DS_Store" -delete 2>/dev/null || true

# Afficher le résumé
echo ""
echo "=============================================="
echo "📊 RÉSUMÉ DU NETTOYAGE"
echo "=============================================="
echo "🗑️ Fichiers supprimés: $removed_count"
echo "✅ Fichiers conservés: $kept_count"

# Estimation de l'espace libéré (approximatif)
estimated_savings=$((removed_count * 50))
echo "💾 Espace estimé libéré: ~${estimated_savings}KB"

echo ""
echo "🎉 Nettoyage terminé avec succès!"
echo "🚀 Votre bot est maintenant optimisé pour Render."

# Créer un fichier de log du nettoyage
echo "$(date): Nettoyage effectué - $removed_count fichiers supprimés" >> cleanup.log

exit 0