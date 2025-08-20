import 'dotenv/config';
import { Client, GatewayIntentBits, Events, PermissionFlagsBits } from 'discord.js';
import { ROLE_STYLES, findStyleByKey } from './palette.js';

const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error('DISCORD_TOKEN manquant dans le fichier .env');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once(Events.ClientReady, readyClient => {
  console.log(`Connecté en tant que ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'setup-colors') {
    await handleSetupColors(interaction);
    return;
  }

  if (interaction.commandName === 'color-role') {
    await handleColorRole(interaction);
    return;
  }
});

async function handleSetupColors(interaction) {
  if (!interaction.inGuild()) {
    await interaction.reply({ content: 'Cette commande doit être utilisée dans un serveur.', ephemeral: true });
    return;
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
    await interaction.reply({ content: 'Tu as besoin de la permission Gérer les rôles.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const createdRoleNames = [];
  for (const style of ROLE_STYLES) {
    try {
      const existing = interaction.guild.roles.cache.find(r => r.name === style.name);
      if (existing) {
        createdRoleNames.push(`Déjà présent: ${style.name}`);
        continue;
      }
      const role = await interaction.guild.roles.create({
        name: style.name,
        color: style.color,
        hoist: false,
        mentionable: false,
        reason: 'Palette auto (setup-colors)'
      });
      createdRoleNames.push(`Créé: ${role.name}`);
    } catch (error) {
      createdRoleNames.push(`Erreur: ${style.name} (${error.message})`);
    }
  }

  await interaction.editReply({ content: `Terminé.\n${createdRoleNames.join('\n')}` });
}

async function handleColorRole(interaction) {
  if (!interaction.inGuild()) {
    await interaction.reply({ content: 'Cette commande doit être utilisée dans un serveur.', ephemeral: true });
    return;
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
    await interaction.reply({ content: 'Tu as besoin de la permission Gérer les rôles.', ephemeral: true });
    return;
  }

  const targetRole = interaction.options.getRole('role', true);
  const styleKey = interaction.options.getString('style', true);
  const shouldRename = interaction.options.getBoolean('rename') ?? false;

  const style = findStyleByKey(styleKey);
  if (!style) {
    await interaction.reply({ content: 'Style inconnu.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const roleEditData = { color: style.color };
    if (shouldRename) roleEditData.name = style.name;
    await targetRole.edit(roleEditData, 'Application de couleur via /color-role');
    await interaction.editReply({ content: `Mis à jour: ${targetRole.toString()} → ${style.name} (${style.color})` });
  } catch (error) {
    await interaction.editReply({ content: `Impossible de modifier ${targetRole.name}. Vérifie mes permissions et la position du rôle.\nErreur: ${error.message}` });
  }
}

client.login(token);

