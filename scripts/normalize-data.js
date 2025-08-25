const fs = require('fs');
const path = require('path');

function ensureFile(fp, defaultValue) {
  if (!fs.existsSync(fp)) {
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, JSON.stringify(defaultValue, null, 2));
    return defaultValue;
  }
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch (_) {
    fs.writeFileSync(fp, JSON.stringify(defaultValue, null, 2));
    return defaultValue;
  }
}

function save(fp, data) {
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
}

function normalizeCounting(counting) {
  let changed = false;
  for (const [guildId, guildCfg] of Object.entries(counting)) {
    if (guildId === 'global') continue;
    if (!guildCfg || !Array.isArray(guildCfg.channels)) continue;
    for (const channel of guildCfg.channels) {
      if (typeof channel.currentNumber !== 'number') { channel.currentNumber = typeof channel.current === 'number' ? channel.current : 0; changed = true; }
      if (typeof channel.lastUserId !== 'string' && channel.lastUserId !== null) { channel.lastUserId = typeof channel.lastUser === 'string' ? channel.lastUser : null; changed = true; }
      if (typeof channel.lastMessageId !== 'string' && channel.lastMessageId !== null) { channel.lastMessageId = channel.lastMessageId || null; changed = true; }
      if (typeof channel.lastTimestamp !== 'string') { channel.lastTimestamp = new Date().toISOString(); changed = true; }
      if (typeof channel.enabled !== 'boolean') { channel.enabled = true; changed = true; }
      if (Object.prototype.hasOwnProperty.call(channel, 'current')) { delete channel.current; changed = true; }
      if (Object.prototype.hasOwnProperty.call(channel, 'lastUser')) { delete channel.lastUser; changed = true; }
      if (Object.prototype.hasOwnProperty.call(channel, 'lastNumber')) { delete channel.lastNumber; changed = true; }
    }
  }
  return changed;
}

function normalizeAouv(aouv) {
  let changed = false;
  for (const [guildId, cfg] of Object.entries(aouv)) {
    if (!cfg || typeof cfg !== 'object') continue;
    if (!Array.isArray(cfg.allowedChannels)) { cfg.allowedChannels = []; changed = true; }
    if (!Array.isArray(cfg.nsfwAllowedChannels)) { cfg.nsfwAllowedChannels = []; changed = true; }
    if (!Array.isArray(cfg.disabledBaseActions)) { cfg.disabledBaseActions = []; changed = true; }
    if (!Array.isArray(cfg.disabledBaseTruths)) { cfg.disabledBaseTruths = []; changed = true; }
    if (!Array.isArray(cfg.customActions)) { cfg.customActions = []; changed = true; }
    if (!Array.isArray(cfg.customTruths)) { cfg.customTruths = []; changed = true; }
  }
  return changed;
}

function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const countingPath = path.join(dataDir, 'counting.json');
  const aouvPath = path.join(dataDir, 'aouv_config.json');

  const counting = ensureFile(countingPath, {});
  const aouv = ensureFile(aouvPath, {});

  const changedCounting = normalizeCounting(counting);
  const changedAouv = normalizeAouv(aouv);

  if (changedCounting) save(countingPath, counting);
  if (changedAouv) save(aouvPath, aouv);

  console.log(`Normalization done. counting changed=${changedCounting}, aouv changed=${changedAouv}`);
}

main();

