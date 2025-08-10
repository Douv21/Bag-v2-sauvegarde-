const fs = require('fs');
const path = require('path');

let cachedCookieString;

function readFromFile(filePath) {
  try {
    const p = path.resolve(filePath);
    const content = fs.readFileSync(p, 'utf8');
    const txt = (content || '').trim();
    return txt.length > 0 ? txt : null;
  } catch (_) {
    return null;
  }
}

function decodeBase64(b64) {
  try {
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch (_) {
    return null;
  }
}

function stripCookieHeaderPrefix(value) {
  if (!value) return value;
  const trimmed = value.trim();
  if (/^cookie\s*:/i.test(trimmed)) {
    return trimmed.replace(/^cookie\s*:/i, '').trim();
  }
  return trimmed;
}

function maybeParseNetscapeCookies(value) {
  // Détecter un format cookies.txt (Netscape) et le convertir en en-tête Cookie
  // Format attendu: colonnes tab-séparées, lignes non commentées (#) :
  // domain \t flag \t path \t secure \t expiration \t name \t value
  if (!value) return value;
  const lines = value.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const hasTabs = lines.some(l => l.includes('\t'));
  const looksLikeNetscape = hasTabs || lines.some(l => l.startsWith('# HTTP') || l.startsWith('# Netscape'));
  if (!looksLikeNetscape) return value;

  const pairs = [];
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('\t');
    if (parts.length < 7) continue;
    const name = parts[5];
    const val = parts[6];
    if (name && typeof val !== 'undefined') {
      pairs.push(`${name}=${val}`);
    }
  }
  if (pairs.length === 0) return value;
  return pairs.join('; ');
}

function normalizeCookieValue(raw) {
  if (!raw) return null;
  let v = stripCookieHeaderPrefix(raw);
  v = maybeParseNetscapeCookies(v);
  return v && v.trim().length > 0 ? v.trim() : null;
}

function getYouTubeCookieString() {
  if (cachedCookieString !== undefined) return cachedCookieString;

  const direct = process.env.YOUTUBE_COOKIES;
  if (direct && direct.trim().length > 0) {
    cachedCookieString = normalizeCookieValue(direct);
    return cachedCookieString;
  }

  const b64 = process.env.YOUTUBE_COOKIES_B64;
  if (b64 && b64.trim().length > 0) {
    const decoded = decodeBase64(b64.trim());
    if (decoded && decoded.trim().length > 0) {
      cachedCookieString = normalizeCookieValue(decoded.trim());
      return cachedCookieString;
    }
  }

  const file = process.env.YOUTUBE_COOKIES_FILE;
  if (file && file.trim().length > 0) {
    const fromFile = readFromFile(file.trim());
    if (fromFile) {
      cachedCookieString = normalizeCookieValue(fromFile);
      return cachedCookieString;
    }
  }

  cachedCookieString = null;
  return cachedCookieString;
}

function applyPlayDlCookies(playModule) {
  const cookie = getYouTubeCookieString();
  if (!cookie) return false;
  try {
    if (typeof playModule?.setToken === 'function') {
      playModule.setToken({ youtube: { cookie } });
      return true;
    }
  } catch (_) {}
  return false;
}

function buildYtdlRequestOptions() {
  const cookie = getYouTubeCookieString();
  if (!cookie) return undefined;
  return { headers: { cookie } };
}

module.exports = {
  getYouTubeCookieString,
  applyPlayDlCookies,
  buildYtdlRequestOptions,
};