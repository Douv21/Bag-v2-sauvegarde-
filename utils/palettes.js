// Palettes intégrées. Une palette unique expose un tableau de styles { key, name, color }.
// Clés en minuscules sans espaces, couleurs au format hex.

// 1) Néon (6)
const NEON = [
	{ key: 'neon-1', name: '🔮 Néon Vert', color: '#39FF14' },
	{ key: 'neon-2', name: '🔮 Néon Rouge', color: '#FF073A' },
	{ key: 'neon-3', name: '🔮 Néon Cyan', color: '#00FFFF' },
	{ key: 'neon-4', name: '🔮 Néon Rose', color: '#FF6EC7' },
	{ key: 'neon-5', name: '🔮 Néon Bleu', color: '#7DF9FF' },
	{ key: 'neon-6', name: '🔮 Néon Jaune', color: '#F5F500' }
];

// 2) Dark (6)
const DARK = [
	{ key: 'dark-1', name: '🌑 Dark Onyx', color: '#0F172A' },
	{ key: 'dark-2', name: '🌑 Dark Graphite', color: '#111827' },
	{ key: 'dark-3', name: '🌑 Dark Slate', color: '#1E293B' },
	{ key: 'dark-4', name: '🌑 Dark Navy', color: '#0B132B' },
	{ key: 'dark-5', name: '🌑 Dark Charcoal', color: '#2D2D2D' },
	{ key: 'dark-6', name: '🌑 Dark Emerald', color: '#064E3B' }
];

// 3) Pastel (6)
const PASTEL = [
	{ key: 'pastel-1', name: '🎨 Pastel Rose', color: '#F8BBD0' },
	{ key: 'pastel-2', name: '🎨 Pastel Bleu', color: '#AEC6FF' },
	{ key: 'pastel-3', name: '🎨 Pastel Vert', color: '#C5E1A5' },
	{ key: 'pastel-4', name: '🎨 Pastel Pêche', color: '#FFD1DC' },
	{ key: 'pastel-5', name: '🎨 Pastel Lavande', color: '#E0BBE4' },
	{ key: 'pastel-6', name: '🎨 Pastel Ambre', color: '#FFECB3' }
];

// 4) Métal (6)
const METAL = [
	{ key: 'metal-1', name: '⚙️ Or', color: '#D4AF37' },
	{ key: 'metal-2', name: '⚙️ Argent', color: '#C0C0C0' },
	{ key: 'metal-3', name: '⚙️ Bronze', color: '#CD7F32' },
	{ key: 'metal-4', name: '⚙️ Platine', color: '#E5E4E2' },
	{ key: 'metal-5', name: '⚙️ Cuivre', color: '#B87333' },
	{ key: 'metal-6', name: '⚙️ Acier', color: '#7F8C8D' }
];

// Palette unique consolidée (24 styles ≤ 25 pour Discord Choices)
const UNIFIED_STYLES = [
	...NEON,
	...DARK,
	...PASTEL,
	...METAL
];

const ROLE_PALETTES = {
	unified: { key: 'unified', name: 'Palette Unique', styles: UNIFIED_STYLES }
};

const DEFAULT_PALETTE_KEY = 'unified';

module.exports = {
	ROLE_PALETTES,
	DEFAULT_PALETTE_KEY
};

