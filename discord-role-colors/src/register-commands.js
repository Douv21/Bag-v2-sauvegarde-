import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildChoicesForSlashCommand } from './palette.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID; // Application (bot) ID
const guildId = process.env.DISCORD_GUILD_ID;   // Serveur cible

if (!token || !clientId || !guildId) {
  console.error('DISCORD_TOKEN, DISCORD_CLIENT_ID ou DISCORD_GUILD_ID manquant dans .env');
  process.exit(1);
}

const roleChoices = buildChoicesForSlashCommand();

const commands = [
  new SlashCommandBuilder()
    .setName('setup-colors')
    .setDescription('Créer 10 rôles « couleur/style » en une fois')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName('color-role')
    .setDescription('Appliquer une couleur/style à un rôle existant')
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('Rôle à modifier')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('style')
        .setDescription('Choisis un style')
        .setRequired(true)
        .addChoices(...roleChoices)
    )
    .addBooleanOption(option =>
      option
        .setName('rename')
        .setDescription('Renommer le rôle avec le nom du style (par défaut: non)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

try {
  console.log('Enregistrement des commandes (guild)…');
  const route = Routes.applicationGuildCommands(clientId, guildId);
  await rest.put(route, { body: commands });
  console.log('Commandes enregistrées.');
} catch (error) {
  console.error('Erreur d\'enregistrement des commandes:', error);
  process.exit(1);
}

