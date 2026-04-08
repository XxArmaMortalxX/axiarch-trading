import { fmtPrice } from '../lib/indicators';

function getRiskLevel(atrPct, rvol, rsi) {
  let risk = 0;
  if (atrPct > 10) risk += 3;
  else if (atrPct > 6) risk += 2;
  else if (atrPct > 3) risk += 1;
  if (rvol > 3) risk += 2;
  else if (rvol > 1.5) risk += 1;
  if (rsi > 80 || rsi < 20) risk += 2;
  else if (rsi > 70 || rsi < 30) risk += 1;

  if (risk >= 5) return { level: 'Extreme', color: 'var(--accent-red)', pct: 100 };
  if (risk >= 3) return { level: 'High', color: 'var(--accent-red)', pct: 75 };
  if (risk >= 2) return { level: 'Medium', color: 'var(--accent-amber)', pct: 50 };
  return { level: 'Low', color: 'var(--accent-green)', pct: 25 };
}

function getSetupDescription(ticker, indicators, price) {
  const parts = [];
  const rsi = ticker?.rsi || indicators.rsi;
  const ema9 = indicators.ema9;
  const ema21 = indicators.ema21;
  const rvol = ticker?.rvol || indicators.rvol;
  const macd = indicators.macd;
  const bb = indicators.bb;
  const change = ticker?.change || 0;
  const socialScore = ticker?.socialScore || 0;
  const mentions = ticker?.mentions || 0;

  // Trend
  if (ema9 && ema21) {
    if (price > ema9 && ema9 > ema21) {
      parts.push('Price is trading above both moving averages — the trend is bullish.');
    } else if (price < ema9 && ema9 < ema21) {
      parts.push('Price is below both moving averages — the trend is bearish.');
    } else if (ema9 > ema21) {
      parts.push('The short-term trend is turning bullish, but price hasn\'t fully confirmed yet.');
    } else {
      parts.push('The short-term trend is weakening. The fast average has crossed below the slow one.');
    }
  }

  // RSI
  if (rsi) {
    if (rsi < 30) {
      parts.push(`RSI is at ${rsi.toFixed(0)} — this stock is oversold. Historically, this means a bounce is likely.`);
    } else if (rsi > 70) {
      parts.push(`RSI is at ${rsi.toFixed(0)} — this stock is overbought. It may pull back soon.`);
    } else if (rsi > 55) {
      parts.push(`RSI is at ${rsi.toFixed(0)} — healthy bullish momentum without being overextended.`);
    } else if (rsi < 45) {
      parts.push(`RSI is at ${rsi.toFixed(0)} — momentum is weak. Buyers aren't stepping in yet.`);
    }
  }

  // Volume
  if (rvol) {
    if (rvol > 3) {
      parts.push(`Volume is ${rvol.toFixed(1)}x above average — something big is happening. This kind of volume often precedes a major move.`);
    } else if (rvol > 1.5) {
      parts.push(`Volume is elevated at ${rvol.toFixed(1)}x normal — more traders are paying attention.`);
    } else if (rvol < 0.5) {
      parts.push('Volume is very low — not many people are trading this right now. Be cautious.');
    }
  }

  // MACD
  if (macd) {
    if (macd.histogram > 0 && macd.macd > macd.signal) {
      parts.push('MACD is positive and expanding — momentum is accelerating to the upside.');
    } else if (macd.histogram < 0 && macd.macd < macd.signal) {
      parts.push('MACD is negative — selling pressure is increasing.');
    } else if (macd.histogram > 0) {
      parts.push('MACD just crossed bullish — early sign of a potential reversal.');
    }
  }

  // Bollinger Bands
  if (bb) {
    const bbPos = (price - bb.lower) / (bb.upper - bb.lower);
    if (bbPos <= 0.1) {
      parts.push('Price is sitting at the bottom of its Bollinger Band — this is a potential bounce zone.');
    } else if (bbPos >= 0.9) {
      parts.push('Price is pressing against the upper Bollinger Band — it\'s stretched and may need to cool off.');
    }
  }

  // Social
  if (socialScore > 50) {
    parts.push(`Social buzz is high${mentions > 0 ? ` (${mentions} Reddit mentions)` : ''}. Retail traders are watching this one closely.`);
  } else if (socialScore > 20) {
    parts.push('There\'s moderate social media chatter around this stock.');
  }

  // Daily change context
  if (Math.abs(change) > 10) {
    parts.push(`The stock ${change > 0 ? 'surged' : 'dropped'} ${Math.abs(change).toFixed(1)}% today — that\'s a big move. ${change > 0 ? 'Momentum is strong but be careful chasing.' : 'Could be a buying opportunity, or a sign of deeper trouble.'}`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Not enough data to generate a full analysis. Check back when the market is open.';
}

function getBullBearCount(ticker, indicators, price) {
  let bull = 0, bear = 0, total = 0;
  const rsi = ticker?.rsi || indicators.rsi;
  const ema9 = indicators.ema9;
  const ema21 = indicators.ema21;
  const macd = indicators.macd;
  const vwap = indicators.vwap;
  const rvol = ticker?.rvol || indicators.rvol;
  const change = ticker?.change || 0;

  if (rsi) { total++; if (rsi < 45) bull++; else if (rsi > 55) bear++; else { bull += 0.5; bear += 0.5; } }
  // Note: low RSI = oversold = bullish opportunity
  if (rsi && rsi < 30) { bull++; total++; }
  if (ema9 && ema21) { total++; if (ema9 > ema21) bull++; else bear++; }
  if (price && ema9) { total++; if (price > ema9) bull++; else bear++; }
  if (macd) { total++; if (macd.histogram > 0) bull++; else bear++; }
  if (vwap && price) { total++; if (price > vwap) bull++; else bear++; }
  if (rvol && change) { total++; if (rvol > 1.5 && change > 0) bull++; else if (rvol > 1.5 && change < 0) bear++; }

  return { bull: Math.round(bull), bear: Math.round(bear), total: Math.round(total) };
}

export default function StrategyCard({ ticker, indicators, price, sym }) {
  const rsi = ticker?.rsi || indicators.rsi;
  const rvol = ticker?.rvol || indicators.rvol;
  const atr = indicators.atr;
  const atrPct = atr && price ? (atr / price) * 100 : 0;
  const risk = getRiskLevel(atrPct, rvol || 1, rsi || 50);
  const description = getSetupDescription(ticker, indicators, price);
  const { bull, bear, total } = getBullBearCount(ticker, indicators, price);
  const signal = ticker?.signal;
  const isBullish = signal === 'BUY' || signal === 'STRONG BUY';
  const isBearish = signal === 'SELL' || signal === 'STRONG SELL';

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', marginBottom: '1.5rem' }}>
      {/* Header */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 600, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: '24px', height: '1px', background: 'var(--accent-green)', display: 'inline-block' }} />
        Axiarch Strategy
      </div>

      {/* What Axiarch Sees */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>What Axiarch Sees</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
          {description}
        </p>
      </div>

      {/* The Play */}
      {ticker?.entry && (
        <div style={{ marginBottom: 'var(--space-6)', background: 'var(--bg-primary)', borderRadius: 'var(--radius)', padding: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
            The Play
            <span style={{ marginLeft: '0.5rem', fontSize: 'var(--text-sm)', fontWeight: 600, color: isBullish ? 'var(--accent-green)' : isBearish ? 'var(--accent-red)' : 'var(--text-muted)' }}>
              {isBullish ? '(Bullish)' : isBearish ? '(Bearish)' : '(Neutral)'}
            </span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{isBullish ? 'Buy' : 'Short'} near {fmtPrice(ticker.entry)}</strong>
                {' '}— {isBullish ? 'enter on a pullback to this level if possible' : 'look for rejection at this price'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-red)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Stop loss at {fmtPrice(ticker.stop)}</strong>
                {' '}— if it hits this, exit immediately. No exceptions.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Target: {fmtPrice(ticker.target)}</strong>
                {' '}— take profit here. Don't get greedy.
              </span>
            </div>
            {ticker.rr && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                Risk/Reward: {ticker.rr} — {parseFloat(ticker.rr) >= 2.5 ? 'excellent setup' : parseFloat(ticker.rr) >= 1.5 ? 'decent setup' : 'tight setup, manage size'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Why This Setup */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>Why This Setup {isBullish ? 'Works' : isBearish ? 'Matters' : ''}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)' }}>{bull}</div>
          <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${total > 0 ? (bull / total) * 100 : 50}%`, height: '100%', background: 'var(--accent-green)', transition: 'width 0.3s' }} />
            <div style={{ width: `${total > 0 ? (bear / total) * 100 : 50}%`, height: '100%', background: 'var(--accent-red)', transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-red)' }}>{bear}</div>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {bull > bear
            ? `${bull} out of ${total} indicators are bullish. ${bull >= total - 1 ? 'Strong confluence — most signals agree.' : 'Majority bullish but not unanimous. Watch for confirmation.'}`
            : bear > bull
            ? `${bear} out of ${total} indicators are bearish. ${bear >= total - 1 ? 'Clear bearish bias across the board.' : 'Leaning bearish but some mixed signals.'}`
            : `Indicators are split ${bull}-${bear}. No clear direction — this is a hold or wait for a catalyst.`
          }
        </p>
      </div>

      {/* Risk Level */}
      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>Risk Level</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ flex: 1, height: '10px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${risk.pct}%`, height: '100%', background: risk.color, borderRadius: '5px', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, color: risk.color, minWidth: '70px' }}>{risk.level}</span>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
          {risk.level === 'Low' && 'Relatively stable. Good for larger position sizes.'}
          {risk.level === 'Medium' && 'Moderate volatility. Use standard position sizing.'}
          {risk.level === 'High' && 'High volatility. Reduce position size. Set tight stops.'}
          {risk.level === 'Extreme' && 'Extreme volatility. Small positions only. This stock can move 10%+ in a day.'}
          {atrPct > 0 && ` Average daily range: ${atrPct.toFixed(1)}% of price.`}
        </p>
      </div>
    </div>
  );
}
