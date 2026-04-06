import { useState } from 'react';
import DailyRecap from '../components/DailyRecap';

const ARTICLES = [
  {
    id: 'rsi-guide',
    title: 'RSI Explained: The Trader\'s Momentum Gauge',
    category: 'Indicators',
    readTime: '5 min',
    excerpt: 'RSI (Relative Strength Index) measures the speed and magnitude of price changes on a scale of 0-100. Learn how to read overbought/oversold zones and spot momentum reversals.',
    content: `## What is RSI?

RSI (Relative Strength Index) is a momentum oscillator that measures the speed and magnitude of recent price changes. It ranges from 0 to 100.

### Key Levels
- **Below 30** — Oversold. The stock has been sold heavily and may be due for a bounce. This is where Axiarch starts looking for BUY signals.
- **30-70** — Neutral zone. Most stocks spend most of their time here.
- **Above 70** — Overbought. The stock has run hard and may be due for a pullback. Axiarch flags these as potential SELL signals.

### How Axiarch Uses RSI
RSI is one of 6 indicators in our confluence scoring system. It contributes to the Technical Score (40% of the composite):
- RSI 30-40 (oversold recovery): +30 points
- RSI 40-60 (neutral): +20 points
- RSI 20-30 (deeply oversold): +25 points
- RSI 60-70 (getting hot): +15 points
- RSI 70+ (overbought): +5 points

### Trading Tip
RSI divergence is powerful: if price makes a new low but RSI makes a higher low, it signals weakening bearish momentum — a potential reversal is coming.`
  },
  {
    id: 'ema-crossover',
    title: 'EMA Crossovers: Catching Trends Early',
    category: 'Indicators',
    readTime: '4 min',
    excerpt: 'EMA(9) crossing above EMA(21) is the "golden cross" for day traders. Learn when to enter, when to exit, and how Axiarch scores trend alignment.',
    content: `## What are EMA Crossovers?

EMA (Exponential Moving Average) gives more weight to recent prices than a simple moving average. Axiarch uses two EMAs:
- **EMA(9)** — Fast line (reacts quickly to price changes)
- **EMA(21)** — Slow line (smoother, shows the trend)

### The Golden Cross
When EMA(9) crosses ABOVE EMA(21), it's a bullish signal called the "golden cross." It means short-term momentum is turning up.

### The Death Cross
When EMA(9) crosses BELOW EMA(21), it's bearish — the "death cross." Short-term momentum is turning down.

### How Axiarch Scores EMA Position
- Price above EMA(9) AND EMA(9) above EMA(21): **+30 points** (strong uptrend)
- Price above EMA(9) only: +22 points
- Price above EMA(21) only: +15 points
- EMAs bullish but price below: +10 points
- Full downtrend: +5 points

### Trading Tip
The best entries come when price pulls back to EMA(9) in an uptrend and bounces. This is called a "mean reversion" entry.`
  },
  {
    id: 'macd-signals',
    title: 'MACD: Reading Momentum Like a Pro',
    category: 'Indicators',
    readTime: '5 min',
    excerpt: 'The MACD histogram tells you if momentum is accelerating or decelerating. Learn how to read the crossover, the histogram, and the signal line.',
    content: `## What is MACD?

MACD (Moving Average Convergence Divergence) is calculated from two EMAs:
- **MACD Line** = EMA(12) - EMA(26)
- **Signal Line** = 9-period EMA of the MACD Line
- **Histogram** = MACD Line - Signal Line

### Reading the Histogram
- **Histogram > 0 and growing**: Bullish momentum accelerating
- **Histogram > 0 but shrinking**: Bullish momentum decelerating (watch out)
- **Histogram < 0 and growing negative**: Bearish momentum accelerating
- **Histogram < 0 but shrinking**: Bearish momentum decelerating (potential reversal)

### How Axiarch Uses MACD
MACD contributes to both the Technical Score and Signal Generation:
- Bullish crossover (histogram > 0, MACD > signal): **+15 points**
- Histogram positive but no crossover: +10 points
- Bearish: +5 points

### Trading Tip
MACD works best in trending markets. In sideways/choppy markets, MACD generates many false signals. Always confirm with RSI and volume.`
  },
  {
    id: 'risk-management',
    title: 'ATR-Based Risk Management: Never Risk More Than You Plan',
    category: 'Strategy',
    readTime: '6 min',
    excerpt: 'ATR (Average True Range) measures volatility. Axiarch uses it to calculate precise stop-loss and profit targets so every trade has a plan.',
    content: `## What is ATR?

ATR (Average True Range) measures how much a stock moves on average per day. A stock with ATR of $2 typically moves about $2 per day.

### Why ATR Matters for Risk
Instead of using arbitrary stop-losses ("I'll set my stop $1 below"), ATR gives you a volatility-adjusted stop:
- **Stop Loss** = Entry Price - (1.5 x ATR)
- **Target 1** = Entry Price + (2 x ATR) → 2:1 reward
- **Target 2** = Entry Price + (3 x ATR) → 3:1 reward

### Example
Stock XYZ is at $10.00 with ATR of $0.80:
- Entry: $10.00
- Stop Loss: $10.00 - (1.5 x $0.80) = **$8.80**
- Target 1: $10.00 + (2 x $0.80) = **$11.60** (2:1 R:R)
- Target 2: $10.00 + (3 x $0.80) = **$12.40** (3:1 R:R)

### Position Sizing
Once you know your risk per share ($1.20 in the example), you can size your position:
- If you're willing to risk $300: $300 / $1.20 = **250 shares**

### Trading Tip
Use the Axiarch RCT Calculator to automate this math. Enter the candle data and get instant entry, stop, and multi-target levels.`
  },
  {
    id: 'volume-confirmation',
    title: 'Relative Volume: The Move Validator',
    category: 'Indicators',
    readTime: '4 min',
    excerpt: 'High volume confirms moves. Low volume warns of fakeouts. Learn how Axiarch uses Relative Volume (RVOL) to separate real breakouts from traps.',
    content: `## What is Relative Volume?

RVOL compares today's volume to the average volume over the last 20 days:
- **RVOL = Today's Volume / 20-Day Average Volume**

### Key Levels
- **RVOL > 3.0x**: Extremely high — institutional activity likely. Major move incoming.
- **RVOL 1.5-3.0x**: Above average — confirms the current trend direction.
- **RVOL 1.0-1.5x**: Normal — no unusual activity.
- **RVOL < 1.0x**: Below average — the move lacks conviction. Potential fakeout.

### How Axiarch Scores Volume
Volume is 20% of the composite Axiarch Score:
- RVOL > 3x: 95 points
- RVOL > 2x: 80 points
- RVOL > 1.5x: 65 points
- RVOL > 1x: 45 points
- RVOL < 0.5x: 10 points

### The Golden Rule
**High RVOL + Bullish Technicals = High-Conviction BUY**
**High RVOL + Bearish Technicals = High-Conviction SELL**
**Low RVOL + Any Signal = Proceed with caution**

### Trading Tip
Pre-market RVOL is the most predictive. If a stock has 5x RVOL before the bell even rings, it's likely to make a big move at open.`
  },
];

export default function Blog() {
  const [selectedArticle, setSelectedArticle] = useState(null);

  if (selectedArticle) {
    const article = ARTICLES.find(a => a.id === selectedArticle);
    return (
      <section style={{ maxWidth: '700px', margin: '0 auto' }}>
        <button
          onClick={() => setSelectedArticle(null)}
          style={{ background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginBottom: '2rem', padding: 0 }}
        >
          &larr; Back to articles
        </button>
        <div className="section-label">{article.category}</div>
        <h1 className="section-title" style={{ fontSize: '1.8rem' }}>{article.title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '2rem' }}>{article.readTime} read</p>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.8 }}>
          {article.content.split('\n\n').map((block, i) => {
            if (block.startsWith('## ')) return <h2 key={i} style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', margin: '2rem 0 0.8rem', letterSpacing: '-0.02em' }}>{block.replace('## ', '')}</h2>;
            if (block.startsWith('### ')) return <h3 key={i} style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '1.5rem 0 0.5rem' }}>{block.replace('### ', '')}</h3>;
            if (block.startsWith('- ')) return <ul key={i} style={{ paddingLeft: '1.2rem', margin: '0.5rem 0' }}>{block.split('\n').map((line, j) => <li key={j} style={{ marginBottom: '0.4rem' }}>{line.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').split('<strong>').map((part, k) => k % 2 === 0 ? part.replace('</strong>', '') : <strong key={k} style={{ color: 'var(--text-primary)' }}>{part.replace('</strong>', '')}</strong>)}</li>)}</ul>;
            return <p key={i} style={{ margin: '0.6rem 0' }}>{block.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').split('<strong>').map((part, k) => k % 2 === 0 ? part.replace('</strong>', '') : <strong key={k} style={{ color: 'var(--text-primary)' }}>{part.replace('</strong>', '')}</strong>)}</p>;
          })}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="section-label">Learn</div>
      <h2 className="section-title">Trading Education</h2>
      <p className="section-subtitle">Understand the indicators and strategies behind every Axiarch signal.</p>

      <DailyRecap />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginTop: '2rem' }}>
        {ARTICLES.map(article => (
          <div
            key={article.id}
            onClick={() => setSelectedArticle(article.id)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{article.category}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{article.readTime}</span>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.6rem', letterSpacing: '-0.01em' }}>{article.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6 }}>{article.excerpt}</p>
            <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--accent-green)', fontWeight: 600 }}>Read article &rarr;</div>
          </div>
        ))}
      </div>
    </section>
  );
}
