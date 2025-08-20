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

// Pastel gradient from lavender to pink (similar to screenshot)
const GRADIENT_COLORS = generateGradient('#A78BFA', '#F9A8D4', 10);

export const ROLE_STYLES = GRADIENT_COLORS.map((hex, index) => ({
  key: `gradient-${String(index + 1).padStart(2, '0')}`,
  name: `🦄 Dégradé ${String(index + 1).padStart(2, '0')}`,
  color: hex
}));

export function buildChoicesForSlashCommand() {
  return ROLE_STYLES.map(style => ({ name: style.name, value: style.key }));
}

export function findStyleByKey(styleKey) {
  return ROLE_STYLES.find(style => style.key === styleKey);
}

