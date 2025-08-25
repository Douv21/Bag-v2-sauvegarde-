const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const zlib = require('zlib');

class SimpleBackupManager {
	constructor() {
		this.dataDir = path.join(__dirname, '..', 'data');
		this.backupDir = path.join(this.dataDir, 'backups');
		this.maxBackups = 10;
	}

	async ensureDirs() {
		await fsp.mkdir(this.backupDir, { recursive: true });
	}

	async discoverJsonFiles() {
		const entries = await fsp.readdir(this.dataDir);
		return entries.filter(f => f.endsWith('.json') && f !== 'package.json' && f !== 'package-lock.json');
	}

	async performBackup(label = null) {
		try {
			await this.ensureDirs();
			const files = await this.discoverJsonFiles();
			const snapshot = { timestamp: new Date().toISOString(), deployment: process.env.RENDER_SERVICE_ID || 'local', files: {} };

			for (const filename of files) {
				try {
					const filePath = path.join(this.dataDir, filename);
					const raw = await fsp.readFile(filePath, 'utf8');
					const json = JSON.parse(raw);
					snapshot.files[filename] = json;
				} catch (e) {
					// ignore single file error
				}
			}

			const base = label || `full-${snapshot.timestamp.replace(/[:.]/g, '-')}`;
			const outPath = path.join(this.backupDir, `${base}.json.gz`);
			const jsonStr = JSON.stringify(snapshot, null, 2);
			const gz = zlib.gzipSync(Buffer.from(jsonStr, 'utf8'));
			await fsp.writeFile(outPath, gz);

			await this.cleanOldBackups();
			console.log(`✅ Backup local créé: ${path.basename(outPath)} (${(gz.length/1024).toFixed(1)}KB)`);
			return { success: true, path: outPath };
		} catch (error) {
			console.error('❌ Erreur backup local:', error.message);
			return { success: false, error: error.message };
		}
	}

	async listBackups() {
		try {
			await this.ensureDirs();
			const entries = await fsp.readdir(this.backupDir);
			return entries
				.filter(f => f.endsWith('.json.gz'))
				.map(name => ({ name, path: path.join(this.backupDir, name), time: fs.statSync(path.join(this.backupDir, name)).mtimeMs }))
				.sort((a, b) => b.time - a.time);
		} catch (e) {
			return [];
		}
	}

	async restoreFromBackup(backupName = null) {
		try {
			const backups = await this.listBackups();
			if (backups.length === 0) return { success: false, error: 'Aucune sauvegarde locale' };
			const target = backupName ? backups.find(b => b.name.includes(backupName)) || backups[0] : backups[0];
			const gz = await fsp.readFile(target.path);
			const raw = zlib.gunzipSync(gz).toString('utf8');
			const snapshot = JSON.parse(raw);

			// écrire fichiers
			for (const [filename, data] of Object.entries(snapshot.files || {})) {
				const filePath = path.join(this.dataDir, filename);
				await fsp.mkdir(path.dirname(filePath), { recursive: true });
				await fsp.writeFile(filePath, JSON.stringify(data, null, 2));
			}
			console.log(`✅ Restauration locale effectuée depuis ${target.name}`);
			return { success: true };
		} catch (error) {
			console.error('❌ Erreur restauration locale:', error.message);
			return { success: false, error: error.message };
		}
	}

	async cleanOldBackups() {
		const backups = await this.listBackups();
		if (backups.length <= this.maxBackups) return;
		for (const b of backups.slice(this.maxBackups)) {
			try { await fsp.unlink(b.path); } catch {}
		}
	}

	startAutoBackup(intervalMinutes = 30) {
		console.log(`🕐 Sauvegarde locale activée (${intervalMinutes} min)`);
		setInterval(() => this.performBackup().catch(() => {}), intervalMinutes * 60 * 1000);
		setTimeout(() => this.performBackup('startup').catch(() => {}), 5000);
	}
}

module.exports = new SimpleBackupManager();