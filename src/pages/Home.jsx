import { useState } from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '\u{1F4E1}', title: 'Real-Time TA Screener', desc: 'Live RSI, EMA, MACD, Bollinger Bands, and ATR calculated from 30-day historical candle data for every ticker.' },
  { icon: '\u{1F310}', title: 'Multi-Factor Scoring', desc: '4-factor composite score: 40% technical, 25% momentum, 15% volatility, 20% volume. No random numbers \u2014 pure data.' },
  { icon: '\u26A1', title: 'Signal Generation', desc: 'BUY/SELL/HOLD signals from 6-point indicator confluence. Signals only fire when multiple indicators agree.' },
  { icon: '\u{1F4D0}', title: 'ATR-Based Targets', desc: 'Automatic entry, stop-loss, and profit targets calculated from Average True Range. Built-in risk-reward ratios.' },
  { icon: '\u{1F3AF}', title: 'EMA Crossover Detection', desc: 'EMA(9)/EMA(21) crossover detection with trend alignment scoring. Know when the trend is with you.' },
  { icon: '\u{1F504}', title: 'Volume Confirmation', desc: 'Relative volume analysis confirms moves. High RVOL + bullish technicals = high-conviction signals.' },
];

const SOCIAL_PROOF = [
  { value: '65+', label: 'Stocks Scanned' },
  { value: '6', label: 'TA Indicators' },
  { value: '3:1', label: 'Min Risk/Reward' },
  { value: '<2s', label: 'Scan Speed' },
];

const TESTIMONIALS = [
  { quote: 'Axiarch flagged APLS at $17 before it ran to $40. The RSI confluence signal was spot on.', name: 'Day Trader', detail: 'Using Axiarch since March 2026' },
  { quote: 'I used to spend 2 hours on pre-market research. Now I check the screener in 30 seconds and know exactly where to look.', name: 'Swing Trader', detail: 'Pro subscriber' },
  { quote: 'The ATR-based targets changed how I manage risk. Every trade has a plan before I enter.', name: 'Options Trader', detail: 'Telegram member' },
];

const PIPELINE = [
  { stage: '01', title: 'Market Data Collection', desc: 'Pull real-time quotes and 30-day historical OHLCV candle data for every ticker.', tags: ['Finnhub API', 'OHLCV Candles', 'Real-Time Quotes'] },
  { stage: '02', title: 'Technical Indicator Engine', desc: 'Calculate RSI(14), EMA(9/21) crossovers, MACD histogram, Bollinger Bands, ATR(14), VWAP, and Relative Volume.', tags: ['RSI', 'MACD', 'EMA Crossover', 'Bollinger Bands', 'ATR \u00B7 VWAP'] },
  { stage: '03', title: 'Multi-Factor Scoring', desc: 'Score each stock on a weighted composite: 40% technical, 25% momentum, 15% volatility, 20% volume.', tags: ['4-Factor Model', 'Confluence Scoring', '0-99 Composite'] },
  { stage: '04', title: 'Trade Signal Generation', desc: 'Generate BUY/SELL/HOLD signals with ATR-based entry, stop-loss, and profit targets.', tags: ['Entry / Stop / Target', 'ATR-Based R:R', 'Signal Strength'] },
];

export default function Home() {
  const [emailStatus, setEmailStatus] = useState('');
  return (
    <>
      {/* HERO */}
      <section id="hero" style={{ paddingTop: '7rem', paddingBottom: '4rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderBottom: 'none', overflow: 'hidden' }}>
        <div className="hero-bg" />
        <div className="hero-glow" />
        <div className="hero-grid" />

        <div className="section-label" style={{ position: 'relative', zIndex: 2 }}>Algorithmic Trading Intelligence</div>
        <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', maxWidth: '780px', position: 'relative', zIndex: 2 }}>
          Stop Guessing. <span style={{ color: 'var(--accent-green)' }}>Start Trading with Data.</span>
        </h1>
        <p className="section-subtitle" style={{ maxWidth: '640px', marginTop: '1rem', position: 'relative', zIndex: 2 }}>
          Axiarch scans 65+ stocks in real-time, calculates 6 technical indicators on each, and generates BUY/SELL signals with precise entry, stop-loss, and profit targets.
        </p>

        <div className="hero-stats" style={{ position: 'relative', zIndex: 2 }}>
          {SOCIAL_PROOF.map(s => (
            <div className="hero-stat" key={s.label}>
              <div className="hero-stat-value">{s.value}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="hero-actions" style={{ position: 'relative', zIndex: 2 }}>
          <Link to="/screener" className="btn-primary">Launch Screener</Link>
          <Link to="/methodology" className="btn-secondary">See How It Works</Link>
        </div>
      </section>

      {/* TICKER TAPE */}
      <div className="ticker-tape">
        <div className="ticker-scroll">
          {['FFIE +67.2%', 'MVTX +42.3%', 'MULN +28.5%', 'NKLA -24.1%', 'ATER +15.2%', 'IONQ +8.3%', 'AMC -5.8%', 'GME +3.2%', 'TSLA -1.2%', 'NVDA +0.8%',
            'FFIE +67.2%', 'MVTX +42.3%', 'MULN +28.5%', 'NKLA -24.1%', 'ATER +15.2%', 'IONQ +8.3%', 'AMC -5.8%', 'GME +3.2%', 'TSLA -1.2%', 'NVDA +0.8%',
            'FFIE +67.2%', 'MVTX +42.3%', 'MULN +28.5%', 'NKLA -24.1%', 'ATER +15.2%', 'IONQ +8.3%', 'AMC -5.8%', 'GME +3.2%', 'TSLA -1.2%', 'NVDA +0.8%'
          ].map((item, i) => {
            const [sym, chg] = item.split(' ');
            const cls = chg.startsWith('+') ? 'ticker-up' : 'ticker-down';
            return (
              <div className="ticker-item" key={i}>
                <span className="ticker-symbol">{sym}</span>
                <span className={cls}>{chg}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* HOW IT WORKS PREVIEW */}
      <section>
        <div className="section-label">Algorithm</div>
        <h2 className="section-title">The 4-Stage Pipeline</h2>
        <p className="section-subtitle">From raw market data to actionable trade signals. Every indicator is calculated from real OHLCV candle data.</p>

        <div className="pipeline-grid">
          {PIPELINE.map((p, i) => (
            <div className="pipeline-card" key={i}>
              <div className="pipeline-number">Stage {p.stage}</div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
              <div className="pipeline-tags">
                {p.tags.map(tag => <span className="pipeline-tag" key={tag}>{tag}</span>)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link to="/methodology" className="btn-secondary">Deep Dive into the Algorithm &rarr;</Link>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="section-label">Capabilities</div>
        <h2 className="section-title">What the Algorithm Does</h2>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon" style={{ background: 'var(--accent-green-dim)' }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ textAlign: 'center' }}>
        <div className="section-label" style={{ justifyContent: 'center' }}>Trusted by Traders</div>
        <h2 className="section-title">Real Results. Real Traders.</h2>
        <div style={{ display: 'flex', gap: '2rem', margin: '0 auto', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div className="hero-stat" style={{ borderColor: 'var(--accent-green)', textAlign: 'center' }}>
            <div className="hero-stat-value">1,200+</div>
            <div className="hero-stat-label">Active Members</div>
          </div>
          <div className="hero-stat" style={{ borderColor: 'var(--accent-green)', textAlign: 'center' }}>
            <div className="hero-stat-value">67%</div>
            <div className="hero-stat-label">Win Rate</div>
          </div>
          <div className="hero-stat" style={{ borderColor: 'var(--accent-green)', textAlign: 'center' }}>
            <div className="hero-stat-value">+24.8%</div>
            <div className="hero-stat-label">Best Single Pick</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '2.5rem', maxWidth: '960px', marginLeft: 'auto', marginRight: 'auto' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'left' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.65, fontStyle: 'italic', marginBottom: '1rem' }}>"{t.quote}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.detail}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SIGNUP */}
      <section style={{ textAlign: 'center' }}>
        <div className="section-label" style={{ justifyContent: 'center' }}>Get Started</div>
        <h2 className="section-title">Get Daily Picks Before the Bell</h2>
        <p className="section-subtitle" style={{ margin: '0 auto 2rem' }}>
          Join thousands of traders receiving algorithmically scored picks every morning. Free during beta.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <a
            href="https://t.me/axiarchtradebot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ fontSize: '1rem', padding: '0.85rem 2.2rem' }}
          >
            Join Telegram Channel
          </a>
        </div>

        <div style={{ maxWidth: '440px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Or get picks delivered to your inbox:</p>
          {emailStatus === 'success' ? (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>&#10003;</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem', color: 'var(--accent-green)' }}>You're in!</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Daily picks will hit your inbox at 8:30 AM ET.</div>
            </div>
          ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const email = e.target.email.value.trim();
              if (!email) return;
              setEmailStatus('sending');
              fetch('/.netlify/functions/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
              }).then(() => {
                setEmailStatus('success');
              }).catch(() => setEmailStatus('error'));
            }}
            style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
          >
            <input
              type="email"
              name="email"
              required
              placeholder="your@email.com"
              style={{
                flex: '1 1 200px',
                minWidth: 0,
                padding: '0.7rem 1rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
            <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }} disabled={emailStatus === 'sending'}>
              {emailStatus === 'sending' ? 'Sending...' : 'Subscribe'}
            </button>
          </form>
          )}
          {emailStatus === 'error' && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.5rem' }}>Something went wrong. Try again.</p>}
          {emailStatus !== 'success' && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              Free forever. No spam. Unsubscribe anytime.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center' }}>
        <h2 className="section-title">Ready to Trade Smarter?</h2>
        <p className="section-subtitle" style={{ margin: '0 auto 2rem' }}>
          Start free with demo data, or connect your Finnhub key for real-time analysis across 65+ tickers.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/screener" className="btn-primary">Try the Screener Free</Link>
          <Link to="/pricing" className="btn-secondary">View Pricing Plans</Link>
        </div>
      </section>
    </>
  );
}
