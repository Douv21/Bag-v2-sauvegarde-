### Bot Discord: Palette de rôles couleur/style

Ce bot permet:

- **/setup-colors**: crée en une seule commande une dizaine de rôles spéciaux avec des couleurs et des styles (emojis + noms).
- **/color-role**: applique l’une de ces couleurs/styles à **un rôle existant** du serveur.

#### Prérequis

- Node.js 18+
- Un bot Discord avec les permissions: Gérer les rôles, Lire les messages slash (Guilds)

#### Configuration

1. Copier `.env.example` en `.env` et renseigner:
   - **DISCORD_TOKEN**: token du bot
   - **DISCORD_CLIENT_ID**: ID de l’application (bot)
   - **DISCORD_GUILD_ID**: ID du serveur cible
2. Installer les dépendances:

```bash
npm install
```

3. Enregistrer les commandes slash dans votre serveur (plus rapide qu’en global):

```bash
npm run deploy:commands
```

4. Démarrer le bot:

```bash
npm start
```

#### Utilisation

- Exécuter `/setup-colors` pour créer automatiquement 10 rôles de couleurs (ex: "🦄 Licorne Pastel", "🌈 Arc-en-ciel", etc.).
- Pour colorer un rôle déjà présent, utilisez `/color-role` puis choisissez:
  - **role**: le rôle à modifier
  - **style**: la couleur/style dans la liste
  - **rename** (optionnel): si activé, renomme le rôle avec le nom du style

Le bot a besoin que sa position de rôle soit **au-dessus** des rôles qu’il doit modifier.

#### Personnalisation

Modifiez la palette dans `src/palette.js` pour changer les couleurs, emojis, noms et ajouter/enlever des éléments.

