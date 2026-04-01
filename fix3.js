const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// Build replacement pairs using char codes
const fixes = [
  // Â· -> ·
  [String.fromCharCode(0xc2, 0xb7), '\u00b7'],
  // â€" -> —  (em dash)
  [String.fromCharCode(0xe2, 0x80, 0x94), '\u2014'],
  // â€™ -> '
  [String.fromCharCode(0xe2, 0x80, 0x99), "'"],
  // â€œ -> "
  [String.fromCharCode(0xe2, 0x80, 0x9c), '"'],
  // â€ -> "  
  [String.fromCharCode(0xe2, 0x80, 0x9d), '"'],
  // â†' -> →
  [String.fromCharCode(0xe2, 0x86, 0x92), '\u2192'],
  // âŸ³ -> ↻ 
  [String.fromCharCode(0xe2, 0x9f, 0xb3), '\u21bb'],
  // âš  -> ⚠
  [String.fromCharCode(0xe2, 0x9a, 0xa0), '\u26a0'],
  // âš¡ -> ⚡
  [String.fromCharCode(0xe2, 0x9a, 0xa1), '\u26a1'],
  // Â© -> ©
  [String.fromCharCode(0xc2, 0xa9), '\u00a9'],
  // Â (nbsp artifact)
  [String.fromCharCode(0xc2, 0xa0), ' '],
];

for (const [bad, good] of fixes) {
  h = h.split(bad).join(good);
}

fs.writeFileSync('index.html', h, 'utf8');
console.log('Fixed! Length:', h.length);
console.log('Still has Â·:', h.includes(String.fromCharCode(0xc2, 0xb7)));
