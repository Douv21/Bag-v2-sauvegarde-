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

function getYouTubeCookieString() {
  if (cachedCookieString !== undefined) return cachedCookieString;

  const direct = process.env.YOUTUBE_COOKIES;
  if (direct && direct.trim().length > 0) {
    cachedCookieString = direct.trim();
    return cachedCookieString;
  }

  const b64 = process.env.YOUTUBE_COOKIES_B64;
  if (b64 && b64.trim().length > 0) {
    const decoded = decodeBase64(b64.trim());
    if (decoded && decoded.trim().length > 0) {
      cachedCookieString = decoded.trim();
      return cachedCookieString;
    }
  }

  const file = process.env.YOUTUBE_COOKIES_FILE;
  if (file && file.trim().length > 0) {
    const fromFile = readFromFile(file.trim());
    if (fromFile) {
      cachedCookieString = fromFile;
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