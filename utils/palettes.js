// Palettes intégrées. Chaque palette expose un tableau de styles { key, name, color }.
// Clés en minuscules sans espaces, couleurs au format hex.

const IRISÉ = [
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
	{ key: 'irise-12', name: '🌈 Irisé 12', color: '#C8FFE8' }
];

const EXOTIQUE = [
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

const IRISE_EXOTIQUE = [...IRISÉ, ...EXOTIQUE];

const CORPORATE = [
	{ key: 'corporate-1', name: 'Corporate Blue 1', color: '#1D4ED8' },
	{ key: 'corporate-2', name: 'Corporate Blue 2', color: '#2563EB' },
	{ key: 'corporate-3', name: 'Corporate Blue 3', color: '#3B82F6' },
	{ key: 'corporate-4', name: 'Corporate Sky', color: '#0EA5E9' },
	{ key: 'corporate-5', name: 'Corporate Teal', color: '#14B8A6' },
	{ key: 'corporate-6', name: 'Corporate Emerald', color: '#10B981' },
	{ key: 'corporate-7', name: 'Corporate Amber', color: '#F59E0B' },
	{ key: 'corporate-8', name: 'Corporate Rose', color: '#F43F5E' },
	{ key: 'corporate-9', name: 'Corporate Violet', color: '#7C3AED' },
	{ key: 'corporate-10', name: 'Corporate Slate', color: '#334155' },
	{ key: 'corporate-11', name: 'Corporate Gray', color: '#64748B' },
	{ key: 'corporate-12', name: 'Corporate Black', color: '#111827' }
];

const PASTEL = [
	{ key: 'pastel-1', name: 'Pastel Pink', color: '#F8BBD0' },
	{ key: 'pastel-2', name: 'Pastel Rose', color: '#F48FB1' },
	{ key: 'pastel-3', name: 'Pastel Purple', color: '#CE93D8' },
	{ key: 'pastel-4', name: 'Pastel Indigo', color: '#B39DDB' },
	{ key: 'pastel-5', name: 'Pastel Blue', color: '#9FA8DA' },
	{ key: 'pastel-6', name: 'Pastel Sky', color: '#90CAF9' },
	{ key: 'pastel-7', name: 'Pastel Light Blue', color: '#81D4FA' },
	{ key: 'pastel-8', name: 'Pastel Teal', color: '#80DEEA' },
	{ key: 'pastel-9', name: 'Pastel Green', color: '#A5D6A7' },
	{ key: 'pastel-10', name: 'Pastel Lime', color: '#C5E1A5' },
	{ key: 'pastel-11', name: 'Pastel Amber', color: '#FFE082' },
	{ key: 'pastel-12', name: 'Pastel Orange', color: '#FFCC80' }
];

const VIBRANT = [
	{ key: 'vibrant-1', name: 'Vibrant Fuchsia', color: '#FF00B8' },
	{ key: 'vibrant-2', name: 'Vibrant Magenta', color: '#FF0054' },
	{ key: 'vibrant-3', name: 'Vibrant Orange', color: '#FF6F00' },
	{ key: 'vibrant-4', name: 'Vibrant Amber', color: '#FFBD00' },
	{ key: 'vibrant-5', name: 'Vibrant Lime', color: '#B6FF00' },
	{ key: 'vibrant-6', name: 'Vibrant Green', color: '#14FF00' },
	{ key: 'vibrant-7', name: 'Vibrant Teal', color: '#00FFB8' },
	{ key: 'vibrant-8', name: 'Vibrant Cyan', color: '#00C2FF' },
	{ key: 'vibrant-9', name: 'Vibrant Blue', color: '#0077FF' },
	{ key: 'vibrant-10', name: 'Vibrant Indigo', color: '#4C00FF' },
	{ key: 'vibrant-11', name: 'Vibrant Violet', color: '#8F00FF' },
	{ key: 'vibrant-12', name: 'Vibrant Rose', color: '#FF0077' }
];

const OCEAN = [
	{ key: 'ocean-1', name: 'Ocean Cyan', color: '#22D3EE' },
	{ key: 'ocean-2', name: 'Ocean Sky', color: '#38BDF8' },
	{ key: 'ocean-3', name: 'Ocean Blue', color: '#3B82F6' },
	{ key: 'ocean-4', name: 'Ocean Indigo', color: '#1D4ED8' },
	{ key: 'ocean-5', name: 'Ocean Deep', color: '#0B3D91' },
	{ key: 'ocean-6', name: 'Ocean Teal', color: '#06B6D4' },
	{ key: 'ocean-7', name: 'Ocean Emerald', color: '#10B981' },
	{ key: 'ocean-8', name: 'Ocean Sea', color: '#0EA5E9' },
	{ key: 'ocean-9', name: 'Ocean Wave', color: '#0284C7' },
	{ key: 'ocean-10', name: 'Ocean Reef', color: '#0D9488' },
	{ key: 'ocean-11', name: 'Ocean Lagoon', color: '#164E63' },
	{ key: 'ocean-12', name: 'Ocean Abyss', color: '#0F172A' }
];

const ROLE_PALETTES = {
	// Palette par défaut (backward compat) = combinaison existante Irisé + Exotique
	irise_exotique: { key: 'irise_exotique', name: 'Irisé + Exotique (défaut)', styles: IRISE_EXOTIQUE },
	// Palettes séparées
	irise: { key: 'irise', name: 'Irisé', styles: IRISÉ },
	exotique: { key: 'exotique', name: 'Exotique', styles: EXOTIQUE },
	// Nouvelles palettes
	corporate: { key: 'corporate', name: 'Corporate', styles: CORPORATE },
	pastel: { key: 'pastel', name: 'Pastel', styles: PASTEL },
	vibrant: { key: 'vibrant', name: 'Vibrant', styles: VIBRANT },
	ocean: { key: 'ocean', name: 'Ocean', styles: OCEAN }
};

const DEFAULT_PALETTE_KEY = 'irise_exotique';

module.exports = {
	ROLE_PALETTES,
	DEFAULT_PALETTE_KEY
};

