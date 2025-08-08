const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const url = process.env.YTDLP_URL || 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
const dir = process.env.YTDLP_DIR || path.join(__dirname, '..', 'node_modules', '@distube', 'yt-dlp', 'bin');
const filename = process.env.YTDLP_FILENAME || 'yt-dlp';
const dest = path.join(dir, filename);

function httpDownload(u, outPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outPath, { mode: 0o755 });
    const request = https.get(u, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow one redirect manually
        https.get(res.headers.location, r2 => r2.pipe(file)).on('error', reject);
      } else if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      } else {
        res.pipe(file);
      }
      file.on('finish', () => file.close(resolve));
    });
    request.on('error', reject);
  });
}

(async () => {
  try {
    if (process.env.YTDLP_DISABLE_DOWNLOAD === 'true') {
      console.log('[install-yt-dlp] Download disabled by YTDLP_DISABLE_DOWNLOAD');
      return;
    }
    if (fs.existsSync(dest) && fs.statSync(dest).size > 100000) {
      console.log('[install-yt-dlp] yt-dlp already present at', dest);
      return;
    }
    fs.mkdirSync(dir, { recursive: true });
    console.log('[install-yt-dlp] Downloading yt-dlp from', url);

    let ok = false;
    try {
      await httpDownload(url, dest);
      ok = fs.existsSync(dest) && fs.statSync(dest).size > 100000; // ~100KB min
    } catch (err) {
      console.warn('[install-yt-dlp] Node https download failed:', err.message);
    }

    if (!ok) {
      try {
        console.log('[install-yt-dlp] Fallback to curl');
        execSync(`curl -L --fail --retry 3 -o "${dest}" "${url}"`, { stdio: 'inherit' });
        ok = fs.existsSync(dest) && fs.statSync(dest).size > 100000;
      } catch (e) {
        console.warn('[install-yt-dlp] curl fallback failed:', e.message);
      }
    }

    if (!ok) {
      try {
        console.log('[install-yt-dlp] Fallback to wget');
        execSync(`wget -O "${dest}" "${url}"`, { stdio: 'inherit' });
        ok = fs.existsSync(dest) && fs.statSync(dest).size > 100000;
      } catch (e) {
        console.warn('[install-yt-dlp] wget fallback failed:', e.message);
      }
    }

    if (!ok) {
      throw new Error('Unable to download yt-dlp binary');
    }

    fs.chmodSync(dest, 0o755);
    console.log('[install-yt-dlp] yt-dlp downloaded to', dest);
  } catch (err) {
    console.warn('[install-yt-dlp] Failed to download yt-dlp:', err.message);
  }
})();