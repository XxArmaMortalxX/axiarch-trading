const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// Fix remaining encoding issues - using strings directly
h = h.split('â€"').join('—');
h = h.split("â€™").join("'");
h = h.split('â€œ').join('"');
h = h.split('â€').join('"');
h = h.split('Â·').join('·');
h = h.split('â†'').join('→');
h = h.split('âŸ³').join('↻');
h = h.split('âš ').join('⚠');
h = h.split('âš¡').join('⚡');
h = h.split('Â©').join('©');
h = h.split('Â ').join('');

fs.writeFileSync('index.html', h, 'utf8');
console.log('Final fix done. Length:', h.length);
