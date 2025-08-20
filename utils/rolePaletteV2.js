const fs = require('fs');
const path = require('path');
const { ROLE_PALETTES, DEFAULT_PALETTE_KEY } = require('./palettes');

function safeParseJSON(str) {
	try { return JSON.parse(str); } catch { return null; }
}

function validateStyles(styles) {
	if (!Array.isArray(styles)) return null;
	const hexRegex = /^#([0-9A-Fa-f]{6})$/;
	const cleaned = [];
	for (const s of styles) {
		if (!s || typeof s !== 'object') continue;
		const key = String(s.key || '').trim();
		const name = String(s.name || '').trim();
		const color = String(s.color || '').trim();
		if (!key || !name || !hexRegex.test(color)) continue;
		cleaned.push({ key, name, color: color.toUpperCase() });
	}
	return cleaned.length ? cleaned : null;
}

function loadCustomPaletteFromEnv() {
	const jsonInline = process.env.ROLE_PALETTE_JSON;
	const filePath = process.env.ROLE_PALETTE_FILE;
	let styles = null;
	if (jsonInline) {
		const parsed = safeParseJSON(jsonInline);
		styles = validateStyles(parsed?.styles || parsed);
	}
	if (!styles && filePath) {
		try {
			const resolved = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
			const raw = fs.readFileSync(resolved, 'utf8');
			const parsed = safeParseJSON(raw);
			styles = validateStyles(parsed?.styles || parsed);
		} catch {}
	}
	if (styles) return { key: 'custom', name: 'Custom', styles };
	return null;
}

function getPaletteByKey(paletteKey) {
	if (paletteKey === 'custom') return loadCustomPaletteFromEnv();
	return ROLE_PALETTES[paletteKey] || null;
}

function getActivePalette() {
	const envKey = (process.env.ROLE_PALETTE_KEY || '').trim();
	if (envKey === 'custom') {
		const maybe = loadCustomPaletteFromEnv();
		if (maybe) return maybe;
	}
	return ROLE_PALETTES[envKey] || ROLE_PALETTES[DEFAULT_PALETTE_KEY];
}

function getAllPalettes() {
	const all = { ...ROLE_PALETTES };
	const custom = loadCustomPaletteFromEnv();
	if (custom) all.custom = custom;
	return all;
}

function buildChoicesForSlashCommand(paletteKey) {
	const palette = paletteKey ? (getPaletteByKey(paletteKey) || getActivePalette()) : getActivePalette();
	const styles = palette?.styles || [];
	return styles.map(style => ({ name: style.name, value: style.key }));
}

function buildPaletteChoices() {
	const palettes = getAllPalettes();
	return Object.values(palettes).map(p => ({ name: p.name, value: p.key }));
}

function findStyleByKey(styleKey, paletteKey) {
	const source = paletteKey
		? ((getPaletteByKey(paletteKey) || {}).styles || [])
		: ((getActivePalette() || {}).styles || []);
	return source.find(style => style.key === styleKey);
}

module.exports = {
	getActivePalette,
	getAllPalettes,
	getPaletteByKey,
	buildChoicesForSlashCommand,
	buildPaletteChoices,
	findStyleByKey
};

