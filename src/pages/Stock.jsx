import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFinnhubContext } from '../context/FinnhubContext';
import { useStockProfile } from '../hooks/useStockProfile';
import { calcRSI, calcEMA, calcMACD, calcBollingerBands, calcATR, calcVWAP, calcRelativeVolume, fmtPrice } from '../lib/indicators';
import SignalBadge from '../components/SignalBadge';
import StockChart from '../components/StockChart';

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.8rem 1rem' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function IndicatorCard({ label, value, detail, barPct, barColor }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.2rem' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700, color: barColor || 'var(--text-primary)', marginBottom: '0.3rem' }}>{value}</div>
      {barPct !== undefined && (
        <div style={{ width: '100%', height: '4px', background: 'var(--border)', borderRadius: '2px', marginBottom: '0.4rem' }}>
          <div style={{ width: `${Math.min(100, Math.max(0, barPct))}%`, height: '100%', background: barColor || 'var(--accent-green)', borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
      )}
      {detail && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{detail}</div>}
    </div>
  );
}

function ScoreBreakdownBar({ label, pct, weight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.6rem' }}>
      <div style={{ width: '90px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>{label} ({weight}%)</div>
      <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 70 ? 'var(--accent-green)' : pct >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)', borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
      <div style={{ width: '30px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 600, textAlign: 'right', color: pct >= 70 ? 'var(--accent-green)' : pct >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{Math.round(pct)}</div>
    </div>
  );
}

const PROXY = '/.netlify/functions/finnhub-proxy';

export default function Stock() {
  const { symbol } = useParams();
  const sym = symbol.toUpperCase();
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
    const url = `https://axiarch.netlify.app/stock/${sym}`;

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

  // Estimate score components (reverse-engineer from composite for display)
  const score = ticker?.score || 50;
  const techScore = rsi ? (rsi < 40 ? 75 : rsi < 60 ? 55 : 35) : 50;
  const momScore = Math.abs(change) > 10 ? 80 : Math.abs(change) > 5 ? 60 : 40;
  const volScore = indicators.atr && price ? ((indicators.atr / price) * 100 > 5 ? 80 : 45) : 50;
  const volumeScore = rvol ? (rvol > 2 ? 85 : rvol > 1 ? 55 : 25) : 40;

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

      {/* Technical Analysis */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 600, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: '24px', height: '1px', background: 'var(--accent-green)', display: 'inline-block' }} />
        Technical Analysis
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <IndicatorCard
          label="RSI (14)"
          value={rsi ? rsi.toFixed(1) : '—'}
          barPct={rsi || 50}
          barColor={rsi < 30 ? 'var(--accent-green)' : rsi > 70 ? 'var(--accent-red)' : 'var(--accent-amber)'}
          detail={rsi < 30 ? 'Oversold' : rsi > 70 ? 'Overbought' : rsi < 50 ? 'Below midline' : 'Above midline'}
        />
        <IndicatorCard
          label="EMA (9)"
          value={indicators.ema9 ? fmtPrice(indicators.ema9) : '—'}
          detail={indicators.ema9 && price > indicators.ema9 ? 'Price above EMA9' : indicators.ema9 ? 'Price below EMA9' : null}
          barColor={indicators.ema9 && price > indicators.ema9 ? 'var(--accent-green)' : 'var(--accent-red)'}
        />
        <IndicatorCard
          label="EMA (21)"
          value={indicators.ema21 ? fmtPrice(indicators.ema21) : '—'}
          detail={indicators.ema9 && indicators.ema21 ? (indicators.ema9 > indicators.ema21 ? 'Golden cross (bullish)' : 'Death cross (bearish)') : null}
          barColor={indicators.ema9 > indicators.ema21 ? 'var(--accent-green)' : 'var(--accent-red)'}
        />
        <IndicatorCard
          label="MACD"
          value={indicators.macd ? indicators.macd.histogram.toFixed(4) : ticker?.macd?.histogram?.toFixed(4) || '—'}
          detail={(() => { const h = indicators.macd?.histogram || ticker?.macd?.histogram || 0; return h > 0 ? 'Bullish momentum' : h < 0 ? 'Bearish momentum' : 'Neutral'; })()}
          barColor={(() => { const h = indicators.macd?.histogram || ticker?.macd?.histogram || 0; return h > 0 ? 'var(--accent-green)' : 'var(--accent-red)'; })()}
        />
        <IndicatorCard
          label="ATR (14)"
          value={indicators.atr ? fmtPrice(indicators.atr) : '—'}
          detail={indicators.atr && price ? `${((indicators.atr / price) * 100).toFixed(1)}% of price` : null}
        />
        <IndicatorCard
          label="VWAP"
          value={indicators.vwap ? fmtPrice(indicators.vwap) : '—'}
          detail={indicators.vwap && price > indicators.vwap ? 'Price above VWAP (bullish)' : indicators.vwap ? 'Price below VWAP (bearish)' : null}
          barColor={indicators.vwap && price > indicators.vwap ? 'var(--accent-green)' : 'var(--accent-red)'}
        />
      </div>

      {/* Bollinger Bands */}
      {indicators.bb && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.2rem', marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>Bollinger Bands (20, 2)</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Lower</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)' }}>{fmtPrice(indicators.bb.lower)}</div>
            </div>
            <div style={{ flex: 1, position: 'relative', height: '20px', background: 'var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
              {(() => {
                const pos = ((price - indicators.bb.lower) / (indicators.bb.upper - indicators.bb.lower)) * 100;
                return <div style={{ position: 'absolute', left: `${Math.min(100, Math.max(0, pos))}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px rgba(0,230,118,0.4)' }} />;
              })()}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Upper</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-red)' }}>{fmtPrice(indicators.bb.upper)}</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Bandwidth: {indicators.bb.bandwidth.toFixed(1)}%</div>
        </div>
      )}

      {/* Axiarch Score Breakdown */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Axiarch Composite Score</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 800, color: score >= 70 ? 'var(--accent-green)' : score >= 45 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{score}</div>
        </div>
        <ScoreBreakdownBar label="Technical" pct={techScore} weight={35} />
        <ScoreBreakdownBar label="Momentum" pct={momScore} weight={20} />
        <ScoreBreakdownBar label="Volatility" pct={volScore} weight={15} />
        <ScoreBreakdownBar label="Volume" pct={volumeScore} weight={15} />
        <ScoreBreakdownBar label="Social" pct={ticker?.socialScore || 0} weight={15} />
      </div>

      {/* Trade Plan */}
      {ticker?.entry && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.2rem', marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Trade Plan</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.8rem', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Signal</div>
              <SignalBadge signal={ticker.signal} />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Entry</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>{fmtPrice(ticker.entry)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Stop Loss</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-red)' }}>{fmtPrice(ticker.stop)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Target</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)' }}>{fmtPrice(ticker.target)}</div>
            </div>
          </div>
          {ticker.rr && (
            <div style={{ textAlign: 'center', marginTop: '0.8rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-amber)' }}>
              Risk/Reward: {ticker.rr}
            </div>
          )}
        </div>
      )}

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
            const url = `https://axiarch.netlify.app/stock/${sym}`;
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
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`$${sym}${ticker?.signal && ticker.signal !== 'HOLD' ? ` — ${ticker.signal}` : ''} | Axiarch Score: ${score}/99`)}&url=${encodeURIComponent(`https://axiarch.netlify.app/stock/${sym}`)}`}
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
    </section>
  );
}
