import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFinnhubContext } from '../context/FinnhubContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { useStockProfile } from '../hooks/useStockProfile';
import { calcRSI, calcEMA, calcMACD, calcBollingerBands, calcATR, calcVWAP, calcRelativeVolume, fmtPrice } from '../lib/indicators';
import SignalBadge from '../components/SignalBadge';
import StockChart from '../components/StockChart';
import StrategyCard from '../components/StrategyCard';

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.8rem 1rem' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

const PROXY = '/.netlify/functions/finnhub-proxy';

export default function Stock() {
  const { symbol } = useParams();
  const sym = symbol.toUpperCase();
  const { isLoggedIn } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const { data, candleCache, customTickers, addTicker, removeTicker } = useFinnhubContext();
  const isWatchlisted = customTickers.includes(sym);
  const { profile } = useStockProfile(sym);
  const [localCandles, setLocalCandles] = useState(null);
  const [localQuote, setLocalQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  // Find ticker in cached scan data
  const cachedTicker = data.find(t => t.sym === sym);
  const candles = candleCache[sym] || localCandles;

  // Fetch quote + candles via proxy if not in cache
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        // Fetch quote if not in scanned data
        if (!cachedTicker) {
          const qRes = await fetch(`${PROXY}?endpoint=quote&symbol=${sym}`);
          const q = await qRes.json();
          if (!cancelled && q && q.c > 0) {
            setLocalQuote({
              sym, price: q.c, change: +(q.dp || 0).toFixed(2),
              open: q.o, high: q.h, low: q.l, prevClose: q.pc,
            });
          }
        }

        // Fetch candles if not cached
        if (!candleCache[sym] && !localCandles) {
          const now = Math.floor(Date.now() / 1000);
          const from = now - 400 * 86400; // ~13 months for 1Y chart support
          const cRes = await fetch(`${PROXY}?endpoint=candles&symbol=${sym}&from=${from}&to=${now}`);
          const d = await cRes.json();
          if (!cancelled && d.s === 'ok') {
            setLocalCandles({ c: d.c, h: d.h, l: d.l, o: d.o, v: d.v, t: d.t });
          }
        }
      } catch (e) {
        console.warn('Failed to fetch stock data:', e);
      }

      if (!cancelled) setLoading(false);
    }

    setLoading(true);
    fetchData();
    return () => { cancelled = true; };
  }, [sym]); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge data: prefer cached scan data, fall back to local fetch
  const ticker = cachedTicker || localQuote || data.find(t => t.sym === sym);

  // Set page title + OG tags for social sharing
  useEffect(() => {
    const name = profile?.name || sym;
    const title = `$${sym} — ${name} | Axiarch`;
    const description = `Technical analysis for $${sym}${profile?.name ? ` (${profile.name})` : ''}. RSI, EMA, MACD, Bollinger Bands, ATR signals and Axiarch composite score.`;
    const url = `https://axiarchtrading.org/stock/${sym}`;

    document.title = title;
    const setMeta = (selector, attr, value) => { const el = document.querySelector(selector); if (el) el.setAttribute(attr, value); };
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
  }, [sym, profile]);

  // Calculate indicators from candles
  const indicators = {};
  if (candles && candles.c) {
    indicators.rsi = calcRSI(candles.c);
    indicators.ema9 = calcEMA(candles.c, 9);
    indicators.ema21 = calcEMA(candles.c, 21);
    indicators.macd = calcMACD(candles.c);
    indicators.bb = calcBollingerBands(candles.c);
    indicators.atr = calcATR(candles.h, candles.l, candles.c);
    indicators.vwap = calcVWAP(candles.h, candles.l, candles.c, candles.v);
    indicators.rvol = calcRelativeVolume(candles.v);
  }

  const price = ticker?.price || (candles?.c ? candles.c[candles.c.length - 1] : 0);
  const change = ticker?.change || 0;
  const rsi = ticker?.rsi || indicators.rsi;
  const rvol = ticker?.rvol || indicators.rvol;

  // No longer need Chart.js config — using StockChart component

  const score = ticker?.score || 50;

  return (
    <section style={{ maxWidth: '960px' }}>
      {/* Back + Watchlist toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <Link to="/screener" style={{ color: 'var(--accent-green)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          &larr; Back to Screener
        </Link>
        <button
          onClick={() => isWatchlisted ? removeTicker(sym) : addTicker(sym)}
          className={isWatchlisted ? 'btn-secondary' : 'btn-primary'}
          style={{ padding: '0.4rem 1rem', fontSize: 'var(--text-sm)' }}
        >
          {isWatchlisted ? 'Remove from Watchlist' : '+ Add to Watchlist'}
        </button>
      </div>

      {/* Loading state */}
      {loading && !ticker && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ marginBottom: '1rem' }} />
          <div>Loading {sym} data...</div>
        </div>
      )}

      {/* No data available */}
      {!loading && !ticker && !candles && (
        <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '0.5rem' }}>${sym}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Unable to load data for this ticker. It may not be available.</p>
          <Link to="/screener" className="btn-primary">Back to Screener</Link>
        </div>
      )}

      {/* Main content — only show if we have some data */}
      {(ticker || candles) && <>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
            {profile?.logo && <img src={profile.logo} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-elevated)' }} />}
            <div>
              <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '-0.02em' }}>${sym}</h1>
              {profile?.name && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{profile.name}</div>}
            </div>
          </div>
          {profile?.finnhubIndustry && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--accent-green-dim)', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {profile.finnhubIndustry}
            </span>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800 }}>{fmtPrice(price)}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: change >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {change >= 0 ? '+' : ''}{change}%
          </div>
          {ticker && <div style={{ marginTop: '0.4rem' }}><SignalBadge signal={ticker.signal} /></div>}
        </div>
      </div>

      {/* Auth gate — teaser shows price/signal above, everything below is locked */}
      {!isLoggedIn && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)', textAlign: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Sign in to see full analysis</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 'var(--leading-relaxed)' }}>
              Get the full Axiarch Strategy for ${sym} — chart, entry/stop/target prices, risk level, and plain-English analysis. Free.
            </p>
            <button onClick={() => setShowAuth(true)} className="btn-primary" style={{ minWidth: '200px' }}>
              Unlock Full Analysis
            </button>
            <div style={{ margin: 'var(--space-3) 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>or</div>
            <a href="https://t.me/axiarchtradebot" target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">Join Telegram</a>
          </div>
          {showAuth && <AuthModal onClose={() => setShowAuth(false)} required />}
        </div>
      )}

      {isLoggedIn && <>
      {/* Price Chart */}
      <StockChart candles={candles} symbol={sym} />

      {/* Key Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <StatCard label="Open" value={fmtPrice(ticker?.open)} />
        <StatCard label="High" value={fmtPrice(ticker?.high)} />
        <StatCard label="Low" value={fmtPrice(ticker?.low)} />
        <StatCard label="Prev Close" value={fmtPrice(ticker?.prevClose)} />
        <StatCard label="Day Range" value={ticker ? `${fmtPrice(ticker.low)} — ${fmtPrice(ticker.high)}` : '—'} />
        <StatCard label="Rel Volume" value={rvol ? `${rvol.toFixed(1)}x` : '—'} color={rvol > 2 ? 'var(--accent-amber)' : undefined} />
        <StatCard label="Market Cap" value={profile?.marketCapitalization ? `$${(profile.marketCapitalization / 1000).toFixed(1)}B` : '—'} />
        <StatCard label="Exchange" value={profile?.exchange || '—'} />
      </div>

      {/* Axiarch Strategy — plain English analysis */}
      <StrategyCard ticker={ticker} indicators={indicators} price={price} sym={sym} />

      {/* Company Info */}
      {profile && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.2rem', marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8rem' }}>About {profile.name || sym}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem', fontSize: '0.82rem' }}>
            {profile.country && <div><span style={{ color: 'var(--text-muted)' }}>Country:</span> {profile.country}</div>}
            {profile.exchange && <div><span style={{ color: 'var(--text-muted)' }}>Exchange:</span> {profile.exchange}</div>}
            {profile.finnhubIndustry && <div><span style={{ color: 'var(--text-muted)' }}>Industry:</span> {profile.finnhubIndustry}</div>}
            {profile.ipo && <div><span style={{ color: 'var(--text-muted)' }}>IPO Date:</span> {profile.ipo}</div>}
          </div>
          {profile.weburl && (
            <a href={profile.weburl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--accent-green)', textDecoration: 'none' }}>
              Visit website &rarr;
            </a>
          )}
        </div>
      )}

      {/* Share + External Links */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button
          onClick={() => {
            const url = `https://axiarchtrading.org/stock/${sym}`;
            const text = `$${sym}${ticker?.signal && ticker.signal !== 'HOLD' ? ` — ${ticker.signal}` : ''} | Score: ${score}/99${rsi ? ` | RSI: ${rsi.toFixed(0)}` : ''} | Axiarch`;
            if (navigator.share) {
              navigator.share({ title: `$${sym} — Axiarch`, text, url }).catch(() => {});
            } else {
              navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
                const btn = document.activeElement;
                const orig = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = orig; }, 2000);
              });
            }
          }}
          className="btn-primary"
          style={{ fontSize: '0.78rem', padding: '0.5rem 1rem' }}
        >
          Share ${sym}
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`$${sym}${ticker?.signal && ticker.signal !== 'HOLD' ? ` — ${ticker.signal}` : ''} | Axiarch Score: ${score}/99`)}&url=${encodeURIComponent(`https://axiarchtrading.org/stock/${sym}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '0.5rem 1rem' }}
        >
          Post on X
        </a>
        <a href={`https://finance.yahoo.com/quote/${sym}`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.5rem 1rem' }}>Yahoo Finance</a>
        <a href={`https://www.tradingview.com/symbols/${sym}/`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.5rem 1rem' }}>TradingView</a>
        <a href={`https://www.reddit.com/search/?q=${encodeURIComponent('$' + sym)}&sort=new`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.5rem 1rem' }}>Reddit</a>
      </div>

      </>}
      </>}
    </section>
  );
}
