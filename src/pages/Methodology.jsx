import { Link } from 'react-router-dom';

const STAGES = [
  {
    num: '01',
    title: 'Market Data Collection',
    subtitle: 'Raw data ingestion from Finnhub API',
    content: 'The algorithm pulls real-time quotes and 30-day historical OHLCV (Open, High, Low, Close, Volume) candle data for every ticker in the watchlist. This two-phase approach first does a quick quote scan across all 65+ tickers, then deep-dives into candle data for full technical analysis.',
    details: [
      'Phase 1: Batch quote fetching (10 symbols/batch, rate-limited to 60 calls/min)',
      'Phase 2: Historical candle data (45-day daily candles for each ticker)',
      'Data validation: Reject quotes with zero price or missing fields',
      'Candle cache: Previously fetched candle data is reused to minimize API calls',
    ],
  },
  {
    num: '02',
    title: 'Technical Indicator Engine',
    subtitle: '6 indicators calculated from OHLCV data',
    content: 'Every indicator is computed from scratch using raw candle data. No third-party indicator libraries are used — each calculation follows the standard financial formula.',
    details: [
      'RSI(14): Relative Strength Index using Wilder\'s smoothing method. Values below 30 indicate oversold, above 70 overbought.',
      'EMA(9) & EMA(21): Exponential Moving Averages for crossover detection. EMA(9) above EMA(21) = bullish golden cross.',
      'MACD: Moving Average Convergence Divergence using EMA(12), EMA(26), and Signal(9). Histogram direction indicates momentum.',
      'Bollinger Bands(20,2): 20-period SMA with 2 standard deviations. Position within bands indicates mean-reversion potential.',
      'ATR(14): Average True Range measures volatility. Used for dynamic stop-loss and profit target calculation.',
      'VWAP & Relative Volume: Volume-Weighted Average Price and 20-day relative volume ratio confirm institutional activity.',
    ],
  },
  {
    num: '03',
    title: 'Multi-Factor Scoring Engine',
    subtitle: 'Weighted composite score (0-99)',
    content: 'Each stock receives a composite score from 4 weighted categories. The score represents overall trade quality — not just direction.',
    details: [
      'Technical Factor (40%): RSI zone scoring + EMA alignment + Bollinger position + MACD direction. Max 100 points.',
      'Momentum Factor (25%): Daily change magnitude + consecutive up days + price vs VWAP. Captures short-term directional strength.',
      'Volatility Factor (15%): ATR as percentage of price. Higher volatility = higher score for day trading potential.',
      'Volume Factor (20%): Relative volume vs 20-day average. RVOL > 2x scores highest — confirms institutional interest.',
      'Final composite: (Tech * 0.40) + (Mom * 0.25) + (Vol * 0.15) + (VolSc * 0.20), clamped to 10-99.',
    ],
  },
  {
    num: '04',
    title: 'Signal Generation & Bias',
    subtitle: 'BUY/SELL/HOLD with ATR-based targets',
    content: 'Signals are generated from a 6-point indicator confluence system. Bull and bear points are tallied, and the net difference determines signal strength.',
    details: [
      'RSI: Oversold (<30) = +2 bull, Overbought (>75) = +2 bear',
      'EMA Alignment: Full bullish stack (price > EMA9 > EMA21) = +2 bull',
      'VWAP: Price above VWAP = +1 bull, below = +1 bear',
      'Volume: RVOL > 1.5x in direction of move = +1 confirmation',
      'MACD: Positive histogram = +1 bull, negative = +1 bear',
      'Change: >3% move = +1 in direction of move',
      'STRONG BUY: Bull >= Bear+3 | BUY: Bull >= Bear+1 | SELL: Bear >= Bull+1 | STRONG SELL: Bear >= Bull+3',
      'Targets: Entry = current price, Stop = 1.5 ATR from entry, Target = 2-3 ATR from entry',
    ],
  },
];

export default function Methodology() {
  return (
    <section>
      <div className="section-label">Algorithm</div>
      <h2 className="section-title">How the Scoring Algorithm Works</h2>
      <p className="section-subtitle">A complete breakdown of the 4-stage pipeline from raw market data to actionable trade signals. Every calculation is transparent and verifiable.</p>

      <div style={{ marginTop: '3rem' }}>
        {STAGES.map((stage, i) => (
          <div key={i} style={{ marginBottom: '3rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--accent-blue), transparent)' }} />
            <div className="pipeline-number">Stage {stage.num}</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.3rem' }}>{stage.title}</h3>
            <p style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', marginBottom: '1rem', letterSpacing: '0.03em' }}>{stage.subtitle}</p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.9rem', marginBottom: '1.5rem' }}>{stage.content}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {stage.details.map((detail, j) => (
                <div key={j} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-blue)', fontWeight: 700, minWidth: '20px', marginTop: '2px' }}>{String(j + 1).padStart(2, '0')}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.55 }}>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/screener" className="btn-primary">See It In Action &rarr;</Link>
      </div>
    </section>
  );
}
