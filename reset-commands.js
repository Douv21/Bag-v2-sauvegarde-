const { REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('🧹 Suppression des commandes...');

    const global = await rest.get(Routes.applicationCommands(clientId));
    for (const cmd of global) {
      await rest.delete(Routes.applicationCommand(clientId, cmd.id));
      console.log(`❌ Supprimée (globale) : ${cmd.name}`);
    }

    const guild = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
    for (const cmd of guild) {
      await rest.delete(Routes.applicationGuildCommand(clientId, guildId, cmd.id));
      console.log(`❌ Supprimée (guilde) : ${cmd.name}`);
    }

    console.log('✅ Toutes les commandes ont été supprimées.');
  } catch (err) {
    console.error('❌ Erreur :', err);
  }
})();
