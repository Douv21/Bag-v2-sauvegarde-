export const ROLE_STYLES = [
  { key: 'licorne',     name: '🦄 Licorne Pastel',     color: '#F6A6FF' },
  { key: 'arcenciel',   name: '🌈 Arc-en-ciel',        color: '#FF6EC7' },
  { key: 'rose',        name: '🌸 Rose Sakura',        color: '#E91E63' },
  { key: 'violet',      name: '🔮 Violet Améthyste',   color: '#9B59B6' },
  { key: 'bleu',        name: '🌊 Bleu Océan',         color: '#3498DB' },
  { key: 'turquoise',   name: '🧜‍♀️ Turquoise',       color: '#1ABC9C' },
  { key: 'vert',        name: '🌿 Vert Forêt',         color: '#2ECC71' },
  { key: 'or',          name: '👑 Or Royal',           color: '#F1C40F' },
  { key: 'orange',      name: '🔥 Orange Néon',        color: '#FF9E00' },
  { key: 'gris',        name: '🖤 Charbon Chic',       color: '#2C2F33' }
];

export function buildChoicesForSlashCommand() {
  return ROLE_STYLES.map(style => ({ name: style.name, value: style.key }));
}

export function findStyleByKey(styleKey) {
  return ROLE_STYLES.find(style => style.key === styleKey);
}

