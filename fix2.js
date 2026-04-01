const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// Nuclear option: replace known broken patterns with wildcards
h = h.replace(/Launch Screener [^\n<]+Free/g, 'Launch Screener — Free');
h = h.replace(/Axiarch Algorithm [^\n<]+Penny/g, 'Axiarch Algorithm — Penny');
h = h.replace(/See How It Works[^\n<]+/g, 'See How It Works');
h = h.replace(/Get free key [^\n<]+/g, 'Get free key →');
h = h.replace(/View Full Results [^\n<]+/g, 'View Full Results →');

// Fix emoji placeholders - replace broken icon divs
h = h.replace(/<div class="feature-icon"[^>]*>[^<]*<\/div>/g, (match) => {
  if (match.includes('green-dim')) return '<div class="feature-icon" style="background:var(--accent-green-dim);">📡</div>';
  if (match.includes('blue-dim')) return '<div class="feature-icon" style="background:var(--accent-blue-dim);">🌐</div>';
  if (match.includes('amber-dim')) return '<div class="feature-icon" style="background:var(--accent-amber-dim);">⚡</div>';
  if (match.includes('red-dim')) return '<div class="feature-icon" style="background:var(--accent-red-dim);">📉</div>';
  if (match.includes('cyan-dim')) return '<div class="feature-icon" style="background:var(--accent-cyan-dim);">🎯</div>';
  if (match.includes('247,0.15')) return '<div class="feature-icon" style="background:rgba(168,85,247,0.15);">🔄</div>';
  return match;
});

// Fix title
h = h.replace(/<title>[^<]+<\/title>/, '<title>Axiarch Algorithm — Penny Stock Sentiment Intelligence</title>');

fs.writeFileSync('index.html', h, 'utf8');
console.log('Fixed! Length:', h.length);

// Verify
const check = fs.readFileSync('index.html', 'utf8');
console.log('Launch Screener line:', check.includes('Launch Screener — Free'));
console.log('Title fixed:', check.includes('<title>Axiarch Algorithm — Penny'));
