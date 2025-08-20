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

// Palette solide « chic & élégant »
const ROLE_STYLES = [
	{ key: 'metal-platinum', name: '✨ Platinum Mist', color: '#C7CDD7' },
	{ key: 'metal-silver', name: '✨ Silver Frost', color: '#BFC5CE' },
	{ key: 'metal-gunmetal', name: '✨ Gunmetal', color: '#2A2F36' },
	{ key: 'metal-pewter', name: '✨ Pewter', color: '#8E949C' },
	{ key: 'metal-champagne', name: '✨ Champagne Gold', color: '#D1B67A' },
	{ key: 'metal-rosegold', name: '✨ Rose Gold', color: '#C8929B' },
	{ key: 'metal-bronze', name: '✨ Bronze Patina', color: '#8B6B3D' },
	{ key: 'metal-copper', name: '✨ Copper Ember', color: '#B46E3A' },
	{ key: 'metal-brass', name: '✨ Brass Satin', color: '#B9972F' },
	{ key: 'wood-walnut', name: '🌲 Walnut', color: '#6B4B3A' },
	{ key: 'wood-mahogany', name: '🌲 Mahogany', color: '#7B3B2E' },
	{ key: 'wood-teak', name: '🌲 Teak', color: '#996C3F' },
	{ key: 'wood-oak', name: '🌲 Oak', color: '#A67C52' },
	{ key: 'wood-ebony', name: '🌲 Ebony', color: '#1F1410' },
	{ key: 'wood-maple', name: '🌲 Maple', color: '#C99B66' },
	{ key: 'gem-slate', name: '💎 Slate', color: '#5C6A75' },
	{ key: 'gem-onyx', name: '💎 Onyx', color: '#0F141A' },
	{ key: 'gem-lapis', name: '💎 Lapis', color: '#2D56A6' },
	{ key: 'gem-amethyst', name: '💎 Amethyst', color: '#6A4EA2' },
	{ key: 'gem-jade', name: '💎 Jade', color: '#2E7D6C' },
	{ key: 'gem-garnet', name: '💎 Garnet', color: '#7B1E2E' },
	{ key: 'lux-midnight', name: '🎩 Midnight Navy', color: '#1F2A44' },
	{ key: 'lux-graphite', name: '🎩 Graphite Blue', color: '#344154' },
	{ key: 'lux-porcelain', name: '🎩 Porcelain', color: '#EDE8E3' },
	{ key: 'lux-linen', name: '🎩 Linen', color: '#E5D6C3' },

	// Irisé (holographique/pastel)
	{ key: 'irise-1', name: '🌈 Irisé 1', color: '#FF66CC' },
	{ key: 'irise-2', name: '🌈 Irisé 2', color: '#FFA3E0' },
	{ key: 'irise-3', name: '🌈 Irisé 3', color: '#CBA6FF' },
	{ key: 'irise-4', name: '🌈 Irisé 4', color: '#9AD9FF' },
	{ key: 'irise-5', name: '🌈 Irisé 5', color: '#8CFAC7' },
	{ key: 'irise-6', name: '🌈 Irisé 6', color: '#FFE174' },
	{ key: 'irise-7', name: '🌈 Irisé 7', color: '#FFB3B3' },
	{ key: 'irise-8', name: '🌈 Irisé 8', color: '#B6F3FF' },

	// Exotique (néons tropicaux)
	{ key: 'exotique-1', name: '🪸 Exotique 1', color: '#00FFA3' },
	{ key: 'exotique-2', name: '🪸 Exotique 2', color: '#00E0FF' },
	{ key: 'exotique-3', name: '🪸 Exotique 3', color: '#0085FF' },
	{ key: 'exotique-4', name: '🪸 Exotique 4', color: '#7A00FF' },
	{ key: 'exotique-5', name: '🪸 Exotique 5', color: '#FF00E5' },
	{ key: 'exotique-6', name: '🪸 Exotique 6', color: '#FF0062' },
	{ key: 'exotique-7', name: '🪸 Exotique 7', color: '#FF8A00' },
	{ key: 'exotique-8', name: '🪸 Exotique 8', color: '#A3FF00' },

	// Dégradé vertical (stops du violet au corail)
	{ key: 'degrade-v-1', name: '🧪 Dégradé V 1', color: '#2E026C' },
	{ key: 'degrade-v-2', name: '🧪 Dégradé V 2', color: '#5B0AC8' },
	{ key: 'degrade-v-3', name: '🧪 Dégradé V 3', color: '#8F3BFF' },
	{ key: 'degrade-v-4', name: '🧪 Dégradé V 4', color: '#FF4DB6' },
	{ key: 'degrade-v-5', name: '🧪 Dégradé V 5', color: '#FF7A45' },
	{ key: 'degrade-v-6', name: '🧪 Dégradé V 6', color: '#FFC33D' },
	{ key: 'degrade-v-7', name: '🧪 Dégradé V 7', color: '#E2FF72' },
	{ key: 'degrade-v-8', name: '🧪 Dégradé V 8', color: '#8CFFEA' }
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