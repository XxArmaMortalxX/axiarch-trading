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

const PIPELINE = [
  { stage: '01', title: 'Market Data Collection', desc: 'Pull real-time quotes and 30-day historical OHLCV candle data for every ticker.', tags: ['Finnhub API', 'OHLCV Candles', 'Real-Time Quotes'] },
  { stage: '02', title: 'Technical Indicator Engine', desc: 'Calculate RSI(14), EMA(9/21) crossovers, MACD histogram, Bollinger Bands, ATR(14), VWAP, and Relative Volume.', tags: ['RSI', 'MACD', 'EMA Crossover', 'Bollinger Bands', 'ATR \u00B7 VWAP'] },
  { stage: '03', title: 'Multi-Factor Scoring', desc: 'Score each stock on a weighted composite: 40% technical, 25% momentum, 15% volatility, 20% volume.', tags: ['4-Factor Model', 'Confluence Scoring', '0-99 Composite'] },
  { stage: '04', title: 'Trade Signal Generation', desc: 'Generate BUY/SELL/HOLD signals with ATR-based entry, stop-loss, and profit targets.', tags: ['Entry / Stop / Target', 'ATR-Based R:R', 'Signal Strength'] },
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section id="hero" style={{ paddingTop: '9rem', paddingBottom: '5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderBottom: 'none' }}>
        <div className="hero-glow" />
        <div className="hero-grid" />

        <div className="section-label">Algorithmic Trading Intelligence</div>
        <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', maxWidth: '780px' }}>
          Stop Guessing. <span style={{ color: 'var(--accent-blue)' }}>Start Trading with Data.</span>
        </h1>
        <p className="section-subtitle" style={{ maxWidth: '640px', marginTop: '1rem' }}>
          Axiarch scans 65+ stocks in real-time, calculates 6 technical indicators on each, and generates BUY/SELL signals with precise entry, stop-loss, and profit targets.
        </p>

        <div className="hero-stats">
          {SOCIAL_PROOF.map(s => (
            <div className="hero-stat" key={s.label}>
              <div className="hero-stat-value">{s.value}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="hero-actions">
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
              <div className="feature-icon" style={{ background: 'var(--accent-blue-dim)' }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section style={{ textAlign: 'center' }}>
        <div className="section-label">Plans</div>
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
