import 'dotenv/config';
import { Client, GatewayIntentBits, Events, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
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

  if (interaction.commandName === 'preview-color') {
    await handlePreviewColor(interaction);
    return;
  }
});

async function handleSetupColors(interaction) {
  if (!interaction.inGuild()) {
    await interaction.reply({ content: 'Cette commande doit être utilisée dans un serveur.', ephemeral: true });
    return;
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: 'Tu as besoin de la permission Administrateur.', ephemeral: true });
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
      // Placer le rôle juste sous le rôle le plus haut du bot
      try {
        const me = interaction.guild.members.me;
        if (me) {
          const targetPosition = Math.max(1, me.roles.highest.position - 1);
          await role.setPosition(targetPosition);
        }
      } catch (e) {
        console.warn('Impossible de positionner le rôle (setup) au plus haut:', e?.message);
      }
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

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: 'Tu as besoin de la permission Administrateur.', ephemeral: true });
    return;
  }

  const targetRole = interaction.options.getRole('role');
  const targetMember = interaction.options.getMember('member');
  const styleKeyFromChoice = interaction.options.getString('style');
  const styleKeyFromText = interaction.options.getString('style-key');
  const shouldRename = interaction.options.getBoolean('rename') ?? false;

  const styleKey = styleKeyFromText || styleKeyFromChoice;
  if (!styleKey) {
    await interaction.reply({ content: 'Précise un style via la liste (style) ou sa clé (style-key), ex: irise-3.', ephemeral: true });
    return;
  }

  const style = findStyleByKey(styleKey);
  if (!style) {
    await interaction.reply({ content: `Style inconnu: ${styleKey}. Vérifie la clé (ex: irise-3, exotique-5).`, ephemeral: true });
    return;
  }

  if (!targetRole && !targetMember) {
    await interaction.reply({ content: 'Précise soit un rôle (role), soit un membre (member).', ephemeral: true });
    return;
  }

  if (targetRole && targetMember) {
    await interaction.reply({ content: 'Choisis soit un rôle, soit un membre — pas les deux.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    if (targetRole) {
      const roleEditData = { color: style.color };
      if (shouldRename) roleEditData.name = style.name;
      await targetRole.edit(roleEditData, 'Application de couleur via /color-role');

      const embed = new EmbedBuilder()
        .setTitle(`Style appliqué: ${style.name}`)
        .setDescription(`Clé: ${style.key}\nHex: ${style.color}`)
        .setColor(style.color);

      await interaction.editReply({ content: `Mis à jour: ${targetRole.toString()} → ${style.name} (${style.color})`, embeds: [embed] });
      return;
    }

    let styleRole = interaction.guild.roles.cache.find(r => r.name === style.name);
    if (!styleRole) {
      styleRole = await interaction.guild.roles.create({
        name: style.name,
        color: style.color,
        hoist: false,
        mentionable: false,
        reason: 'Création auto du rôle de couleur (color-role)'
      });
      // Placer le rôle juste sous le rôle le plus haut du bot
      try {
        const meForPosition = interaction.guild.members.me;
        if (meForPosition) {
          const targetPosition = Math.max(1, meForPosition.roles.highest.position - 1);
          await styleRole.setPosition(targetPosition);
        }
      } catch (e) {
        console.warn('Impossible de positionner le rôle (color-role) au plus haut:', e?.message);
      }
    }

    const me = interaction.guild.members.me;
    if (!me || me.roles.highest.comparePositionTo(styleRole) <= 0) {
      await interaction.editReply({ content: `Je ne peux pas assigner le rôle ${styleRole.toString()} (position trop haute). Place mon rôle au-dessus.` });
      return;
    }

    await targetMember.roles.add(styleRole, 'Attribution de la couleur via /color-role');

    const embed = new EmbedBuilder()
      .setTitle(`Style appliqué à ${targetMember.displayName}`)
      .setDescription(`Rôle attribué: ${styleRole.toString()}\nClé: ${style.key}\nHex: ${style.color}`)
      .setColor(style.color);

    await interaction.editReply({ content: `Couleur attribuée à ${targetMember.toString()} → ${style.name} (${style.color})`, embeds: [embed] });
  } catch (error) {
    await interaction.editReply({ content: `Action impossible. Vérifie mes permissions et la position des rôles.\nErreur: ${error.message}` });
  }
}

async function handlePreviewColor(interaction) {
  if (!interaction.inGuild()) {
    await interaction.reply({ content: 'Cette commande doit être utilisée dans un serveur.', ephemeral: true });
    return;
  }

  // Restreindre aux administrateurs
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: 'Tu as besoin de la permission Administrateur.', ephemeral: true });
    return;
  }

  const styleKeyFromChoice = interaction.options.getString('style');
  const styleKeyFromText = interaction.options.getString('style-key');
  const styleKey = styleKeyFromText || styleKeyFromChoice;

  if (!styleKey) {
    await interaction.reply({ content: 'Précise un style via la liste (style) ou sa clé (style-key), ex: irise-3.', ephemeral: true });
    return;
  }

  const style = findStyleByKey(styleKey);
  if (!style) {
    await interaction.reply({ content: `Style inconnu: ${styleKey}. Exemples: irise-3, exotique-5.`, ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Aperçu: ${style.name}`)
    .setDescription(`Clé: ${style.key}\nHex: ${style.color}`)
    .setColor(style.color)
    .setFooter({ text: "Cet aperçu utilise la couleur de la bordure de l'embed." });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

client.login(token);