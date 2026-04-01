const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// Fix all broken UTF-8 sequences
const fixes = [
  // Em dash variants
  [/â€"/g, '—'],
  [/â€"(?=[A-Za-z ])/g, '—'],
  // Quotes
  [/â€™/g, "'"],
  [/â€œ/g, '"'],
  [/â€/g, '"'],
  // Emojis
  [/ðŸš€/g, '🚀'],
  [/ðŸ"¡/g, '📡'],
  [/ðŸŒ/g, '🌐'],
  [/âš¡/g, '⚡'],
  [/ðŸ"/g, '📉'],
  [/ðŸŽ¯/g, '🎯'],
  [/ðŸ"„/g, '🔄'],
  [/ðŸ¥‡/g, '🥇'],
  [/ðŸ¥ˆ/g, '🥈'],
  [/ðŸ¥‰/g, '🥉'],
  // Symbols
  [/Â·/g, '·'],
  [/â†'/g, '→'],
  [/âŸ³/g, '↻'],
  [/âœ•/g, '✕'],
  [/âš /g, '⚠'],
  [/Â©/g, '©'],
  [/Â /g, ' '],
];

for (const [pattern, replacement] of fixes) {
  h = h.replace(pattern, replacement);
}

fs.writeFileSync('index.html', h, 'utf8');
console.log('Fixed! Length:', h.length);

// Verify
const check = fs.readFileSync('index.html', 'utf8');
console.log('Em dash found:', check.includes('—'));
console.log('Rocket found:', check.includes('🚀'));
