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
  const toHex = n => n.toString(16).padStart(2, '0').toUpperCase();
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

// Solid palette “chic & elegant” (metal, wood, gems, luxe neutrals)
export const ROLE_STYLES = [
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
  { key: 'lux-linen', name: '🎩 Linen', color: '#E5D6C3' }
];

export function buildChoicesForSlashCommand() {
  return ROLE_STYLES.map(style => ({ name: style.name, value: style.key }));
}

export function findStyleByKey(styleKey) {
  return ROLE_STYLES.find(style => style.key === styleKey);
}

