#!/bin/bash

# Script de build pour Render.com avec Canvas

echo "🔧 Installation des dépendances système pour Canvas..."

# Mettre à jour les paquets
apt-get update

# Installer les dépendances requises pour Canvas
apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libfontconfig1-dev \
    python3 \
    python3-pip \
    pkg-config

echo "📦 Installation des dépendances Node.js..."

# Installer les dépendances Node.js
npm install

echo "✅ Build terminé avec succès!"