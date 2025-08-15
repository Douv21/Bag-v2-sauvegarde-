#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function loadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error('Erreur lecture JSON:', e?.message || e);
    return null;
  }
}

function formatDuration(ms) {
  const abs = Math.abs(ms);
  const sec = Math.floor(abs / 1000) % 60;
  const min = Math.floor(abs / (60 * 1000)) % 60;
  const hr = Math.floor(abs / (60 * 60 * 1000)) % 24;
  const day = Math.floor(abs / (24 * 60 * 60 * 1000));
  const parts = [];
  if (day) parts.push(`${day}j`);
  if (hr) parts.push(`${hr}h`);
  if (min) parts.push(`${min}m`);
  if (sec || parts.length === 0) parts.push(`${sec}s`);
  return parts.join(' ');
}

(function main() {
  const args = process.argv.slice(2);
  const failOnExpired = args.includes('--fail-on-expired') || args.includes('--strict');

  const suitesPath = path.join(__dirname, '..', 'data', 'private_suites.json');
  const suites = loadJSON(suitesPath);

  if (!suites) {
    console.log('ℹ️ Aucune donnée de suites privées (data/private_suites.json manquant).');
    process.exit(0);
  }

  const now = Date.now();
  let total = 0;
  let expiredCount = 0;
  let activeCount = 0;

  for (const [guildId, records] of Object.entries(suites)) {
    const entries = Object.values(records || {});
    if (entries.length === 0) continue;

    console.log(`\n🛡️ Serveur ${guildId} — ${entries.length} suite(s)`);
    for (const rec of entries) {
      total += 1;
      const expTs = rec.expiresAt ? new Date(rec.expiresAt).getTime() : null;
      if (!expTs) {
        console.log(`  • ${rec.id} — perma — user:${rec.userId} role:${rec.roleId || 'n/a'}`);
        continue;
      }

      const delta = expTs - now;
      if (delta <= 0) {
        expiredCount += 1;
        console.log(`  • ${rec.id} — EXPIRÉ (depuis ${formatDuration(delta)}) — user:${rec.userId} role:${rec.roleId || 'n/a'}`);
      } else {
        activeCount += 1;
        console.log(`  • ${rec.id} — actif (reste ${formatDuration(delta)}) — user:${rec.userId} role:${rec.roleId || 'n/a'}`);
      }
    }
  }

  console.log(`\nRésumé: ${total} suite(s) — ${activeCount} active(s), ${expiredCount} expirée(s)`);

  if (failOnExpired && expiredCount > 0) {
    console.error('\n❌ Suites expirées détectées. Le cleanup devrait les supprimer au prochain scan/redémarrage.');
    process.exit(1);
  }

  console.log('\n✅ Diagnostic terminé.');
  process.exit(0);
})();