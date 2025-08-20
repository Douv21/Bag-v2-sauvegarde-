const { execSync } = require('child_process');
const https = require('https');

function getRemoteInfo() {
  const url = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
  const m = url.match(/^https:\/\/x-access-token:([^@]+)@github\.com\/([^\/]+)\/([^\s]+?)(?:\.git)?$/);
  if (!m) {
    throw new Error('Impossible de lire le remote origin pour extraire les informations GitHub.');
  }
  const token = m[1];
  const owner = m[2];
  // Nettoie repo en retirant un éventuel trailing newline/espace
  const repo = m[3].replace(/\s+$/, '');
  return { token, owner, repo };
}

function createPullRequest({ token, owner, repo, title, head, base, body }) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ title, head, base, body });
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/pulls`,
      method: 'POST',
      headers: {
        'User-Agent': 'cursor-agent',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data || '{}');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json.html_url || 'PR créée');
            return;
          }
          // 422 Unprocessable Entity (PR déjà existante par ex.)
          if (res.statusCode === 422) {
            resolve({ exists: true, message: json.message });
            return;
          }
          reject(new Error(`GitHub API ${res.statusCode}: ${json.message || data}`));
        } catch (e) {
          reject(new Error(`Réponse invalide de l'API GitHub: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function findExistingPR({ token, owner, repo, head }) {
  return new Promise((resolve, reject) => {
    const path = `/repos/${owner}/${repo}/pulls?state=open&head=${owner}:${head}`;
    const options = {
      hostname: 'api.github.com',
      path,
      method: 'GET',
      headers: {
        'User-Agent': 'cursor-agent',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json'
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data || '[]');
          if (Array.isArray(json) && json.length > 0) {
            resolve(json[0].html_url);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(new Error(`Réponse invalide lors de la recherche de PR existante: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    const { token, owner, repo } = getRemoteInfo();
    const head = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const base = process.env.PR_BASE || 'main';
    const title = process.env.PR_TITLE || 'Désactivation et retrait de commandes (Render)';
    const body = process.env.PR_BODY || [
      '- Désactive: `apercu-couleur`, `mongodb-backup`, `mongodb-diagnostic`, `reset`, `test-level-notif` (ignorées au chargement).',
      '- Ajoute nettoyage global automatique avant déploiement des commandes guild.',
      '- Ajoute script `scripts/remove-commands.js` + npm script `remove:commands` pour suppression immédiate.',
      '- Sécurise aussi `force-register.js` pour éviter leur réinscription accidentelle.'
    ].join('\n');

    const created = await createPullRequest({ token, owner, repo, title, head, base, body });
    if (typeof created === 'string') {
      console.log(created);
      return;
    }
    if (created && created.exists) {
      const existingUrl = await findExistingPR({ token, owner, repo, head });
      if (existingUrl) {
        console.log(existingUrl);
        return;
      }
      // Fallback: lien de création manuel
      console.log(`https://github.com/${owner}/${repo}/pull/new/${encodeURIComponent(head)}`);
      return;
    }
    console.log('PR créée.');
  } catch (e) {
    // Fallback: propose le lien de PR basé sur branche
    try {
      const head = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      const m = remote.match(/github\.com\/([^\/]+)\/([^\s]+?)(?:\.git)?$/);
      if (m) {
        const owner = m[1];
        const repo = m[2];
        console.log(`https://github.com/${owner}/${repo}/pull/new/${encodeURIComponent(head)}`);
        return;
      }
    } catch {}
    console.error('Impossible de créer la PR automatiquement:', e.message);
    process.exit(1);
  }
}

main();

