const { REST, Routes } = require('discord.js');
try { require('dotenv').config(); } catch {}
const fs = require('fs');
const path = require('path');

(async () => {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  if (!token || !clientId || !guildId) {
    console.error('DISCORD_TOKEN, CLIENT_ID ou GUILD_ID manquant dans l\'environnement');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log(`🚀 Déploiement guild-only pour la guilde ${guildId}`);

    // Charger les commandes
    const commandsDir = path.resolve(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));

    const DISABLED_NAMES = new Set([
      'apercu-couleur',
      'mongodb-backup',
      'mongodb-diagnostic',
      'reset',
      'test-level-notif'
    ]);

    const nameToEntry = new Map();
    for (const file of commandFiles) {
      const filePath = path.resolve(commandsDir, file);
      try {
        delete require.cache[filePath];
        const command = require(filePath);
        if (command?.data && command?.execute) {
          const name = command.data.name;
          if (DISABLED_NAMES.has(name)) {
            console.log(`  ⛔ ${name} (désactivée, ignorée)`);
            continue;
          }
          const json = command.data.toJSON();
          const existing = nameToEntry.get(name);
          if (!existing) {
            nameToEntry.set(name, { json, file });
            console.log(`  ✅ ${name}`);
          } else {
            // Préférence au fichier sans suffixe -old
            const preferNew = existing.file.toLowerCase().includes('-old') && !file.toLowerCase().includes('-old');
            const reason = preferNew ? 'remplace la version -old' : 'doublon ignoré';
            console.log(`  ⚠️ Doublon ${name}: ${file} (${reason})`);
            if (preferNew) {
              nameToEntry.set(name, { json, file });
            }
          }
        } else {
          console.log(`  ⚠️ Ignorée (structure invalide): ${file}`);
        }
      } catch (e) {
        console.error(`  ❌ Erreur chargement ${file}: ${e?.message || e}`);
      }
    }

    const commands = Array.from(nameToEntry.values()).map(e => e.json);
    console.log(`📊 ${commands.length} commandes prêtes après déduplication`);

    // Purge des commandes de la guilde
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: [] }
    );
    console.log('🗑️ Purge des commandes de la guilde effectuée');

    // Enregistrement
    const result = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log(`✅ ${result.length} commandes enregistrées pour la guilde ${guildId}`);
  } catch (err) {
    console.error('❌ Échec du déploiement guild-only:', err?.message || err);
    process.exit(1);
  }
})();