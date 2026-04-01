const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// 1. PWA meta tags
const pwaHead = `<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#06080c">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Axiarch">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"Axiarch Trading Intelligence","url":"https://axiarchtrading.netlify.app","applicationCategory":"FinanceApplication","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}</script>
`;
h = h.replace('<link rel="preconnect"', pwaHead + '<link rel="preconnect"');

// 2. Dark/light mode toggle + hamburger in nav
h = h.replace(
  '<a href="#screener" class="nav-cta">LAUNCH SCREENER</a>\n</nav>',
  `<a href="#screener" class="nav-cta">LAUNCH SCREENER</a>
  <button id="themeToggle" onclick="toggleTheme()" title="Toggle theme" style="background:none;border:1px solid var(--border);color:var(--text-secondary);border-radius:6px;padding:0.38rem 0.6rem;cursor:pointer;font-size:1rem;margin-left:0.5rem">🌙</button>
  <button id="mobileMenuBtn" onclick="toggleMobileMenu()" style="display:none;background:none;border:1px solid var(--border);color:var(--text-secondary);border-radius:6px;padding:0.38rem 0.65rem;cursor:pointer;font-size:1.1rem;margin-left:0.5rem">☰</button>
</nav>`
);

// 3. Add extra CSS before </style>
const extraCSS = `
/* LIGHT MODE */
body.light-mode{--bg-void:#f0f2f5;--bg-primary:#fff;--bg-card:#fff;--bg-card-hover:#f8f9fb;--bg-elevated:#eef0f4;--border:#d8dde8;--border-bright:#c0c8d8;--text-primary:#0d1117;--text-secondary:#4a5568;--text-muted:#8896a5}
body.light-mode nav{background:rgba(240,242,245,0.92)}
/* POPUP */
#exitPopup{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:10000;align-items:center;justify-content:center}
#exitPopup.show{display:flex}
.popup-box{background:var(--bg-card);border:1px solid var(--border-bright);border-radius:16px;padding:2.5rem;max-width:400px;width:90%;text-align:center;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.5)}
.popup-close{position:absolute;top:0.8rem;right:1rem;background:none;border:none;color:var(--text-muted);font-size:1.5rem;cursor:pointer}
.popup-box h3{font-family:var(--font-display);font-size:1.4rem;font-weight:800;margin-bottom:0.5rem}
.popup-box p{color:var(--text-secondary);font-size:0.88rem;margin-bottom:1.25rem}
.popup-input{width:100%;padding:0.75rem 1rem;background:var(--bg-primary);border:1px solid var(--border-bright);border-radius:8px;color:var(--text-primary);font-size:0.9rem;margin-bottom:0.75rem;box-sizing:border-box}
/* TELEGRAM STICKY */
#tgSticky{display:none;position:fixed;bottom:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,rgba(0,18,30,0.97),rgba(0,12,22,0.97));border-top:1px solid rgba(0,212,255,0.25);padding:0.7rem 1.5rem;align-items:center;justify-content:center;gap:1rem;flex-wrap:wrap}
#tgSticky.show{display:flex}
/* MODAL */
#tickerModal{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.82);z-index:10000;align-items:center;justify-content:center}
#tickerModal.show{display:flex}
.modal-box{background:var(--bg-card);border:1px solid var(--border-bright);border-radius:16px;padding:2rem;max-width:460px;width:90%;position:relative}
.modal-x{position:absolute;top:1rem;right:1rem;background:none;border:none;color:var(--text-muted);font-size:1.4rem;cursor:pointer}
.modal-sym{font-family:var(--font-mono);font-size:2rem;font-weight:800;color:var(--accent-green)}
.modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;margin:1.2rem 0}
.modal-cell{background:var(--bg-elevated);border-radius:8px;padding:0.75rem;text-align:center}
.modal-lbl{font-size:0.62rem;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:0.3rem}
.modal-val{font-family:var(--font-mono);font-weight:700;font-size:0.95rem}
.modal-links{display:flex;gap:0.6rem;margin-top:1rem}
.modal-lnk{flex:1;text-align:center;padding:0.55rem;border-radius:7px;text-decoration:none;font-size:0.78rem;font-weight:600;border:1px solid var(--border-bright);color:var(--text-secondary);transition:all .2s}
.modal-lnk:hover{border-color:var(--accent-green);color:var(--accent-green)}
/* MOBILE NAV */
@media(max-width:768px){#mobileMenuBtn{display:inline-flex!important}.nav-links.open{display:flex!important;flex-direction:column;position:absolute;top:60px;left:0;right:0;background:var(--bg-card);border-bottom:1px solid var(--border);padding:1rem;z-index:998}}
`;
h = h.replace('</style>', extraCSS + '</style>');

// 4. Add popup/modal/telegram HTML after <body>
const uiHTML = `
<!-- EXIT POPUP -->
<div id="exitPopup"><div class="popup-box"><button class="popup-close" onclick="closePopup()">✕</button><div style="font-size:2rem;margin-bottom:0.6rem">📡</div><h3>Get Tomorrow's Picks Free</h3><p>AI scans Reddit &amp; Yahoo Finance overnight. 20 ranked pre-market picks in your inbox at 8:30 AM ET.</p><input type="email" id="popupEmail" class="popup-input" placeholder="your@email.com"><button class="btn-primary" style="width:100%" onclick="submitPopupEmail()">Send Me Tomorrow's Picks →</button><p style="font-size:0.72rem;color:var(--text-muted);margin-top:0.75rem">Free forever. No spam. Unsubscribe anytime.</p></div></div>
<!-- TICKER MODAL -->
<div id="tickerModal"><div class="modal-box"><button class="modal-x" onclick="closeModal()">✕</button><div class="modal-sym" id="mSym">-</div><div style="font-family:var(--font-mono);font-size:1.1rem;color:var(--text-primary);margin-top:0.2rem" id="mPrice">-</div><div class="modal-grid"><div class="modal-cell"><div class="modal-lbl">Change</div><div class="modal-val" id="mChg">-</div></div><div class="modal-cell"><div class="modal-lbl">Axiarch Score</div><div class="modal-val" style="color:var(--accent-green)" id="mScore">-</div></div><div class="modal-cell"><div class="modal-lbl">Bullish</div><div class="modal-val" style="color:var(--accent-green)" id="mBull">-</div></div><div class="modal-cell"><div class="modal-lbl">Bearish</div><div class="modal-val" style="color:var(--accent-red)" id="mBear">-</div></div></div><div class="modal-links"><a class="modal-lnk" id="mYahoo" href="#" target="_blank">📈 Yahoo Finance</a><a class="modal-lnk" id="mReddit" href="#" target="_blank">💬 Reddit</a></div></div></div>
<!-- TG STICKY -->
<div id="tgSticky"><span style="font-size:0.85rem;color:var(--text-primary)">📡 Get daily picks on Telegram — Free</span><a href="https://t.me/axiarchtradebot" target="_blank" style="background:var(--accent-cyan);color:#000;font-weight:700;font-size:0.78rem;padding:0.4rem 1.1rem;border-radius:6px;text-decoration:none">Join Channel</a><button onclick="dismissTg()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1rem">✕</button></div>
`;
h = h.replace('<body>', '<body>' + uiHTML);

// 5. Update hero stat
h = h.replace(
  '<div class="hero-stat"><div class="hero-stat-value">20</div><div class="hero-stat-label">Stocks Scanned</div></div>',
  '<div class="hero-stat"><div class="hero-stat-value" id="memberCount">1,200+</div><div class="hero-stat-label">Free Members</div></div>'
);

// 6. Add new JS before </script>
const newJS = `
// === AXIARCH UPGRADES ===
// Exit popup
(function(){if(!localStorage.getItem('ax_pop')){document.addEventListener('mouseleave',function(e){if(e.clientY<=0){document.getElementById('exitPopup').classList.add('show');localStorage.setItem('ax_pop','1');}},{once:true});}})();
function closePopup(){document.getElementById('exitPopup').classList.remove('show');}
async function submitPopupEmail(){const em=document.getElementById('popupEmail').value.trim();if(!em||!em.includes('@'))return;try{await fetch('/.netlify/functions/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:em})});}catch(e){}closePopup();const m=document.getElementById('signup-msg');if(m){m.style.color='#00e87b';m.textContent="You're in! Picks at 8:30 AM ET.";}}
// Telegram sticky
(function(){if(!localStorage.getItem('ax_tg')){setTimeout(()=>document.getElementById('tgSticky').classList.add('show'),5000);}})();
function dismissTg(){document.getElementById('tgSticky').classList.remove('show');localStorage.setItem('ax_tg','1');}
// Theme toggle
function toggleTheme(){const on=document.body.classList.toggle('light-mode');document.getElementById('themeToggle').textContent=on?'☀️':'🌙';localStorage.setItem('ax_theme',on?'light':'dark');}
(function(){if(localStorage.getItem('ax_theme')==='light'){document.body.classList.add('light-mode');const b=document.getElementById('themeToggle');if(b)b.textContent='☀️';}})();
// Mobile nav
function toggleMobileMenu(){document.querySelector('.nav-links').classList.toggle('open');}
// Ticker modal
function openModal(sym,price,change,score,bull,bear){document.getElementById('mSym').textContent='$'+sym;document.getElementById('mPrice').textContent='$'+parseFloat(price).toFixed(2);const c=document.getElementById('mChg');c.textContent=(change>=0?'+':'')+change+'%';c.style.color=change>=0?'var(--accent-green)':'var(--accent-red)';document.getElementById('mScore').textContent=score;document.getElementById('mBull').textContent=bull+'%';document.getElementById('mBear').textContent=bear+'%';document.getElementById('mYahoo').href='https://finance.yahoo.com/quote/'+sym;document.getElementById('mReddit').href='https://www.reddit.com/search/?q='+encodeURIComponent('$'+sym)+'&sort=new';document.getElementById('tickerModal').classList.add('show');}
function closeModal(){document.getElementById('tickerModal').classList.remove('show');}
document.addEventListener('click',function(e){if(e.target===document.getElementById('tickerModal'))closeModal();if(e.target===document.getElementById('exitPopup'))closePopup();});
// Member counter
(function(){const el=document.getElementById('memberCount');if(!el)return;let n=0;const t=setInterval(()=>{n=Math.min(n+21,1200);el.textContent=n.toLocaleString()+'+';if(n>=1200)clearInterval(t);},20);})();
// Service worker
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
`;
h = h.replace('</script>\n</body>', newJS + '</script>\n</body>');

fs.writeFileSync('index.html', h, 'utf8');
console.log('Upgraded! Length:', h.length);
console.log('Has popup:', h.includes('exitPopup'));
console.log('Has light-mode:', h.includes('light-mode'));
