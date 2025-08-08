const https = require('https');
const fs = require('fs');
const path = require('path');

const url = process.env.YTDLP_URL || 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
const dir = process.env.YTDLP_DIR || path.join(__dirname, '..', 'node_modules', '@distube', 'yt-dlp', 'bin');
const filename = process.env.YTDLP_FILENAME || 'yt-dlp';
const dest = path.join(dir, filename);

(async () => {
  try {
    if (process.env.YTDLP_DISABLE_DOWNLOAD === 'true') {
      console.log('[install-yt-dlp] Download disabled by YTDLP_DISABLE_DOWNLOAD');
      return;
    }
    if (fs.existsSync(dest)) {
      console.log('[install-yt-dlp] yt-dlp already present at', dest);
      return;
    }
    fs.mkdirSync(dir, { recursive: true });
    console.log('[install-yt-dlp] Downloading yt-dlp from', url);
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest, { mode: 0o755 });
      https.get(url, res => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Follow redirect once
          https.get(res.headers.location, r2 => r2.pipe(file)).on('error', reject);
        } else if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
        } else {
          res.pipe(file);
        }
        file.on('finish', () => file.close(resolve));
      }).on('error', reject);
    });
    fs.chmodSync(dest, 0o755);
    console.log('[install-yt-dlp] yt-dlp downloaded to', dest);
  } catch (err) {
    console.warn('[install-yt-dlp] Failed to download yt-dlp:', err.message);
  }
})();