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
  { quote: 'Axiarch flagged GEVO before it ran +17.78% in 4 days. Entered at $2.42, rode it to $2.84. The confluence signal was dead on.', name: 'Founder', detail: 'Axiarch Trading, April 2026' },
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
        <h1 className="section-title hero-headline">
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

        <div className="section-centered" style={{ marginTop: 'var(--space-10)' }}>
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
      <section className="section-centered">
        <div className="section-label" style={{ justifyContent: 'center' }}>Trusted by Traders</div>
        <h2 className="section-title">Real Results. Real Traders.</h2>

        <div className="social-proof-row">
          <div className="hero-stat" style={{ borderColor: 'var(--accent-green)' }}>
            <div className="hero-stat-value">100%</div>
            <div className="hero-stat-label">Win Rate</div>
          </div>
          <div className="hero-stat" style={{ borderColor: 'var(--accent-green)' }}>
            <div className="hero-stat-value">+24.3%</div>
            <div className="hero-stat-label">Avg Return</div>
          </div>
          <div className="hero-stat" style={{ borderColor: 'var(--accent-green)' }}>
            <div className="hero-stat-value">+135.4%</div>
            <div className="hero-stat-label">Best Pick (APLS)</div>
          </div>
        </div>

        <div className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div className="testimonial-card" key={i}>
              <p className="testimonial-quote">"{t.quote}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.name.charAt(0)}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-detail">{t.detail}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SIGNUP */}
      <section className="section-centered">
        <div className="section-label" style={{ justifyContent: 'center' }}>Get Started</div>
        <h2 className="section-title">Get Daily Picks Before the Bell</h2>
        <p className="section-subtitle" style={{ margin: '0 auto 2rem' }}>
          Join thousands of traders receiving algorithmically scored picks every morning. Free during beta.
        </p>

        <div className="cta-row" style={{ marginBottom: 'var(--space-8)' }}>
          <a
            href="https://t.me/axiarchtradebot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-lg"
          >
            Join Telegram Channel
          </a>
        </div>

        <div className="signup-card">
          <p className="signup-card-subtitle">Or get picks delivered to your inbox:</p>
          {emailStatus === 'success' ? (
            <div className="signup-success">
              <div className="signup-success-icon">&#10003;</div>
              <div className="signup-success-title">You're in!</div>
              <div className="signup-success-desc">Daily picks will hit your inbox at 8:30 AM ET.</div>
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
            className="signup-form"
          >
            <input type="email" name="email" required placeholder="your@email.com" className="signup-input" />
            <button type="submit" className="btn-primary" disabled={emailStatus === 'sending'}>
              {emailStatus === 'sending' ? 'Sending...' : 'Subscribe'}
            </button>
          </form>
          )}
          {emailStatus === 'error' && <p className="signup-error">Something went wrong. Try again.</p>}
          {emailStatus !== 'success' && (
            <p className="signup-fine-print">Free forever. No spam. Unsubscribe anytime.</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section-centered">
        <h2 className="section-title">Ready to Trade Smarter?</h2>
        <p className="section-subtitle" style={{ margin: '0 auto 2rem' }}>
          Start free with demo data, or connect your Finnhub key for real-time analysis across 65+ tickers.
        </p>
        <div className="cta-row">
          <Link to="/screener" className="btn-primary">Try the Screener Free</Link>
          <Link to="/pricing" className="btn-secondary">View Pricing Plans</Link>
        </div>
      </section>
    </>
  );
}
