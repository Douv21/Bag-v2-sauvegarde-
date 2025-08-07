const { ChannelType, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const fs = require('fs');
const dataManager = require('./simpleDataManager');

function loadJSON(file) {
  try {
    const dataDir = path.join(__dirname, '..', 'data');
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveJSON(file, data) {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const filePath = path.join(dataDir, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getStaffRoleIds(guildId) {
  try {
    const staffCfg = loadJSON('staff_config.json');
    return (staffCfg[guildId]?.roles) || [];
  } catch {
    return [];
  }
}

async function ensureCategory(guild) {
  const name = 'Suites privées';
  let category = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === name.toLowerCase()
  );
  if (!category) {
    category = await guild.channels.create({ name, type: ChannelType.GuildCategory });
  }
  return category;
}

function buildOverwrites(guild, roleId, staffRoleIds) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks
      ]
    }
  ];
  for (const staffId of staffRoleIds) {
    overwrites.push({
      id: staffId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ReadMessageHistory
      ]
    });
  }
  return overwrites;
}

function buildVoiceOverwrites(guild, roleId, staffRoleIds) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
    },
    {
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.Stream
      ]
    }
  ];
  for (const staffId of staffRoleIds) {
    overwrites.push({
      id: staffId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.Stream
      ]
    });
  }
  return overwrites;
}

function humanizeName(base, member) {
  const username = (member?.displayName || member?.user?.username || 'membre')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  return `${base}-${username}`;
}

async function createPrivateSuite(interaction, member, options) {
  const guild = interaction.guild;
  const guildId = guild.id;
  const userId = member.id;
  const durationDays = options.durationDays || null; // null = permanent

  // Create dedicated role for the suite
  const role = await guild.roles.create({
    name: `Suite ${durationDays ? `${durationDays}j` : 'perma'} — ${member.displayName}`.slice(0, 95),
    hoist: false,
    mentionable: false,
    reason: 'Rôle suite privée achetée'
  });

  // Assign role to user
  await member.roles.add(role);

  // Ensure category exists
  const category = await ensureCategory(guild);

  const staffRoles = getStaffRoleIds(guildId);

  // Create text channel (NSFW)
  const textChannel = await guild.channels.create({
    name: humanizeName('🔞-suite', member),
    type: ChannelType.GuildText,
    parent: category.id,
    nsfw: true,
    permissionOverwrites: buildOverwrites(guild, role.id, staffRoles)
  });

  // Create voice channel
  const voiceChannel = await guild.channels.create({
    name: humanizeName('🎙️-suite', member),
    type: ChannelType.GuildVoice,
    parent: category.id,
    userLimit: 0,
    permissionOverwrites: buildVoiceOverwrites(guild, role.id, staffRoles)
  });

  // Persist record
  const suites = loadJSON('private_suites.json');
  if (!suites[guildId]) suites[guildId] = {};
  const recordId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const now = Date.now();
  const expiresAt = durationDays ? new Date(now + durationDays * 24 * 60 * 60 * 1000).toISOString() : null;

  suites[guildId][recordId] = {
    id: recordId,
    guildId,
    userId,
    roleId: role.id,
    textChannelId: textChannel.id,
    voiceChannelId: voiceChannel.id,
    createdAt: new Date(now).toISOString(),
    expiresAt,
    durationDays
  };

  saveJSON('private_suites.json', suites);

  return suites[guildId][recordId];
}

function scheduleExpiry(client, suiteRecord) {
  if (!suiteRecord.expiresAt) return; // permanent
  const expiryMs = new Date(suiteRecord.expiresAt).getTime() - Date.now();
  if (expiryMs <= 0) return; // already expired, will be handled by scan

  // Max safe timeout chunk (~24 jours)
  const MAX_DELAY = 24 * 24 * 60 * 60 * 1000; // 24 jours en ms

  const schedule = (delay) => {
    setTimeout(async () => {
      const remaining = new Date(suiteRecord.expiresAt).getTime() - Date.now();
      if (remaining > MAX_DELAY) {
        schedule(MAX_DELAY);
        return;
      }

      if (remaining > 0) {
        setTimeout(() => cleanupSuite(client, suiteRecord).catch(() => {}), remaining);
      } else {
        await cleanupSuite(client, suiteRecord).catch(() => {});
      }
    }, delay);
  };

  if (expiryMs > MAX_DELAY) {
    schedule(MAX_DELAY);
  } else {
    setTimeout(() => cleanupSuite(client, suiteRecord).catch(() => {}), Math.max(1000, expiryMs));
  }
}

async function cleanupSuite(client, suiteRecord) {
  try {
    const guild = await client.guilds.fetch(suiteRecord.guildId);
    const g = await guild.fetch();

    // Delete channels if exist
    if (suiteRecord.textChannelId) {
      const ch = g.channels.cache.get(suiteRecord.textChannelId) || await g.channels.fetch(suiteRecord.textChannelId).catch(() => null);
      if (ch) await ch.delete('Expiration suite privée');
    }
    if (suiteRecord.voiceChannelId) {
      const chv = g.channels.cache.get(suiteRecord.voiceChannelId) || await g.channels.fetch(suiteRecord.voiceChannelId).catch(() => null);
      if (chv) await chv.delete('Expiration suite privée');
    }

    // Remove role
    if (suiteRecord.roleId) {
      const role = g.roles.cache.get(suiteRecord.roleId) || await g.roles.fetch(suiteRecord.roleId).catch(() => null);
      if (role) await role.delete('Expiration suite privée');
    }

    // Remove record
    const suites = loadJSON('private_suites.json');
    if (suites[suiteRecord.guildId]) {
      const keys = Object.keys(suites[suiteRecord.guildId]);
      for (const key of keys) {
        if (suites[suiteRecord.guildId][key]?.id === suiteRecord.id) {
          delete suites[suiteRecord.guildId][key];
          break;
        }
      }
      saveJSON('private_suites.json', suites);
    }
  } catch (e) {
    // Silent
  }
}

async function scanAndRepairSuites(client) {
  try {
    const suites = loadJSON('private_suites.json');
    const now = Date.now();
    for (const [guildId, records] of Object.entries(suites)) {
      for (const record of Object.values(records)) {
        const exp = record.expiresAt ? new Date(record.expiresAt).getTime() : null;
        if (exp && exp <= now) {
          await cleanupSuite(client, record);
        } else {
          scheduleExpiry(client, record);
        }
      }
    }
  } catch {}
}

async function ensurePrivateSuiteShopItems(guild) {
  const shop = await dataManager.loadData('shop.json', {});
  const guildId = guild.id;
  const items = shop[guildId] || [];

  const ensure = (type, name, price, description) => {
    const exists = items.some(i => i.type === type);
    if (!exists) {
      items.push({
        id: `${type}_${Date.now()}`,
        type,
        name,
        price,
        description,
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      });
    }
  };

  ensure('private_24h', 'Suite Privée 24h', 5000, 'Crée un rôle et deux salons privés (texte NSFW + vocal) pour 24h.');
  ensure('private_monthly', 'Suite Privée Mensuelle', 15000, 'Crée un rôle et deux salons privés (texte NSFW + vocal) pour 30 jours.');
  ensure('private_permanent', 'Suite Privée Permanente', 50000, 'Crée un rôle et deux salons privés (texte NSFW + vocal) sans expiration.');

  shop[guildId] = items;
  await dataManager.saveData('shop.json', shop);
}

module.exports = {
  createPrivateSuite,
  scheduleExpiry,
  scanAndRepairSuites,
  ensurePrivateSuiteShopItems
};