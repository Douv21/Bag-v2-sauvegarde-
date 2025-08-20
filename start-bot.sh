#!/bin/bash

# Script de démarrage du bot Discord
echo "🚀 Démarrage du BAG Bot V2..."

# Arrêter le bot s'il est déjà en cours d'exécution
pkill -f "node index.js" 2>/dev/null || true
sleep 2

# Démarrer le bot en arrière-plan
cd /workspace
node index.js > bot.log 2>&1 &
BOT_PID=$!

echo "✅ Bot démarré avec le PID: $BOT_PID"
echo "📊 Logs disponibles dans: bot.log"
echo "🌐 Health check: http://localhost:5000/health"

# Attendre quelques secondes et vérifier le statut
sleep 5
if ps -p $BOT_PID > /dev/null; then
    echo "✅ Bot fonctionne correctement"
    tail -10 bot.log
else
    echo "❌ Erreur de démarrage du bot"
    tail -20 bot.log
fi