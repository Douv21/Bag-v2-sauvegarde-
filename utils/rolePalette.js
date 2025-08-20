function hexToRgb(hex) {
	const normalized = hex.replace('#', '');
	const bigint = parseInt(normalized, 16);
	return {
		r: (bigint >> 16) & 255,
		g: (bigint >> 8) & 255,
		b: bigint & 255
	};
}

function rgbToHex(r, g, b) {
	const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generateGradient(startHex, endHex, steps) {
	const start = hexToRgb(startHex);
	const end = hexToRgb(endHex);
	const gradient = [];
	for (let i = 0; i < steps; i++) {
		const t = steps === 1 ? 0 : i / (steps - 1);
		const r = Math.round(start.r + (end.r - start.r) * t);
		const g = Math.round(start.g + (end.g - start.g) * t);
		const b = Math.round(start.b + (end.b - start.b) * t);
		gradient.push(rgbToHex(r, g, b));
	}
	return gradient;
}

// Palette « Irisé & Exotique » (nouvelles couleurs uniquement)
const ROLE_STYLES = [
	// Irisé (holographique/pastel)
	{ key: 'irise-1', name: '🌈 Irisé 1', color: '#FF77E9' },
	{ key: 'irise-2', name: '🌈 Irisé 2', color: '#ECA9FF' },
	{ key: 'irise-3', name: '🌈 Irisé 3', color: '#B2A8FF' },
	{ key: 'irise-4', name: '🌈 Irisé 4', color: '#8DDCFF' },
	{ key: 'irise-5', name: '🌈 Irisé 5', color: '#A5FFE1' },
	{ key: 'irise-6', name: '🌈 Irisé 6', color: '#FFF7AE' },
	{ key: 'irise-7', name: '🌈 Irisé 7', color: '#FFC1CC' },
	{ key: 'irise-8', name: '🌈 Irisé 8', color: '#B6F3FF' },
	{ key: 'irise-9', name: '🌈 Irisé 9', color: '#D0B8FF' },
	{ key: 'irise-10', name: '🌈 Irisé 10', color: '#9FF0FF' },
	{ key: 'irise-11', name: '🌈 Irisé 11', color: '#FFE1F9' },
	{ key: 'irise-12', name: '🌈 Irisé 12', color: '#C8FFE8' },

	// Exotique (néons tropicaux)
	{ key: 'exotique-1', name: '🪸 Exotique 1', color: '#00FFA3' },
	{ key: 'exotique-2', name: '🪸 Exotique 2', color: '#00E0FF' },
	{ key: 'exotique-3', name: '🪸 Exotique 3', color: '#0085FF' },
	{ key: 'exotique-4', name: '🪸 Exotique 4', color: '#7A00FF' },
	{ key: 'exotique-5', name: '🪸 Exotique 5', color: '#FF00E5' },
	{ key: 'exotique-6', name: '🪸 Exotique 6', color: '#FF0062' },
	{ key: 'exotique-7', name: '🪸 Exotique 7', color: '#FF8A00' },
	{ key: 'exotique-8', name: '🪸 Exotique 8', color: '#A3FF00' },
	{ key: 'exotique-9', name: '🪸 Exotique 9', color: '#39FF14' },
	{ key: 'exotique-10', name: '🪸 Exotique 10', color: '#FFD300' },
	{ key: 'exotique-11', name: '🪸 Exotique 11', color: '#FF2079' },
	{ key: 'exotique-12', name: '🪸 Exotique 12', color: '#00FFFB' }
];

function buildChoicesForSlashCommand() {
	return ROLE_STYLES.map(style => ({ name: style.name, value: style.key }));
}

function findStyleByKey(styleKey) {
	return ROLE_STYLES.find(style => style.key === styleKey);
}

module.exports = {
	ROLE_STYLES,
	buildChoicesForSlashCommand,
	findStyleByKey
};