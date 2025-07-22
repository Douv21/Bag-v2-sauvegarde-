# Installation de Canvas sur Render.com

## Méthode 1: Configuration render.yaml (Recommandée)

1. **Utilisez le fichier `render.yaml`** qui inclut les dépendances système
2. **Variables d'environnement requises** dans le dashboard Render:
   - `CANVAS_PREBUILT=false`
   - `NODE_ENV=production`

## Méthode 2: Build Command personnalisé

Dans votre service Render.com:

1. **Build Command:**
```bash
apt-get update && apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libfontconfig1-dev python3 python3-pip pkg-config && npm install
```

2. **Start Command:**
```bash
node index.js
```

## Méthode 3: Dockerfile

Utilisez le `Dockerfile.render` fourni qui inclut:
- Ubuntu/Debian base avec Node.js 18
- Toutes les dépendances système pour Canvas
- Installation optimisée des packages

## Dépendances système requises

Canvas nécessite ces bibliothèques système:
- `build-essential` - Outils de compilation
- `libcairo2-dev` - Bibliothèque graphique Cairo
- `libpango1.0-dev` - Bibliothèque de rendu de texte
- `libjpeg-dev` - Support JPEG
- `libgif-dev` - Support GIF
- `librsvg2-dev` - Support SVG
- `libfontconfig1-dev` - Configuration des polices
- `python3` & `python3-pip` - Build tools
- `pkg-config` - Configuration des packages

## Test local

Pour tester localement avec Docker:
```bash
docker build -f Dockerfile.render -t bag-bot-canvas .
docker run -p 5000:5000 bag-bot-canvas
```

## Troubleshooting

Si Canvas ne fonctionne toujours pas:
1. Vérifiez les logs de build dans Render
2. Assurez-vous que `CANVAS_PREBUILT=false`
3. Utilisez le fallback SVG intégré dans le code
4. Contactez le support Render pour les dépendances système

## Fallback automatique

Le code inclut un fallback automatique vers SVG si Canvas échoue:
- Essaie d'abord Canvas (PNG haute qualité)
- Bascule vers SVG si Canvas non disponible
- Garantit que les cartes s'affichent toujours