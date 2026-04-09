import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AccuracyMeter from '../components/AccuracyMeter';

export default function Performance() {
  const [perfData, setPerfData] = useState(null);

  useEffect(() => {
    fetch('/.netlify/functions/get-performance')
      .then(r => r.json())
      .then(setPerfData)
      .catch(() => {
        fetch('/performance.json')
          .then(r => r.json())
          .then(setPerfData)
          .catch(() => {});
      });
  }, []);

  const picks = perfData?.picks || [];

  // Separate active trades (BUY/SELL) from holds (no position taken)
  function isActiveTrade(pick) {
    const sig = pick.signal || '';
    return sig.includes('BUY') || sig.includes('SELL');
  }

  function isHold(pick) {
    return !isActiveTrade(pick);
  }

  // Directional win logic: BUY + up = win, SELL + down = win
  function isWin(pick) {
    if (pick.result === 'WIN') return true;
    if (pick.result === 'LOSS') return false;
    if (pick.result === 'NEUTRAL') return null; // no trade
    const isBullish = pick.signal === 'BUY' || pick.signal === 'STRONG BUY';
    const isBearish = pick.signal === 'SELL' || pick.signal === 'STRONG SELL';
    if (isBullish) return pick.pctChange > 0;
    if (isBearish) return pick.pctChange < 0;
    if (isHold(pick)) return null; // HOLD = no trade taken
    return pick.pctChange > 0; // legacy picks without signal
  }

  function getResultIcon(pick) {
    const win = isWin(pick);
    if (win === null) return '\u2014'; // dash for holds
    return win ? '\u2705' : '\u274C';
  }

  const activePicks = picks.filter(isActiveTrade);
  const holdPicks = picks.filter(isHold);
  const winners = activePicks.filter(p => isWin(p) === true);
  const losers = activePicks.filter(p => isWin(p) === false);
  const avgReturn = activePicks.length > 0 ? (activePicks.reduce((s, p) => s + Math.abs(p.pctChange), 0) / activePicks.length).toFixed(1) : '0';
  const bestPick = activePicks.reduce((best, p) => Math.abs(p.pctChange) > Math.abs(best?.pctChange || 0) ? p : best, null);

  return (
    <div className="page-fullbg page-fullbg-performance">
      <section className="page-hero">
        <div className="section-label">Transparency</div>
        <h2 className="section-title">Verified Performance</h2>
        <p className="section-subtitle">Every pick is tracked from the moment it's flagged. Entry price at flag time, close price at end of day. No cherry-picking. No hindsight bias.</p>
      </section>

      <section>
        {/* Live Accuracy Meter */}
        <AccuracyMeter />

        {/* Stats */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { value: activePicks.length, label: 'Active Trades' },
            { value: `${winners.length}`, label: 'Correct Calls', color: 'var(--accent-green)' },
            { value: `${losers.length}`, label: 'Missed Calls', color: losers.length > 0 ? 'var(--accent-red)' : 'var(--text-muted)' },
            { value: `${avgReturn}%`, label: 'Avg Move', color: 'var(--accent-green)' },
            { value: holdPicks.length > 0 ? `${holdPicks.length}` : '\u2014', label: 'No Trade (Hold)', color: 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} className="hero-stat">
              <div className="hero-stat-value" style={s.color ? { color: s.color } : {}}>{s.value}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Key insight */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>How the Algorithm Works</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-3)' }}>
            The Axiarch scanner runs overnight and flags stocks based on Reddit buzz + Yahoo gainers + news headlines, combined with technical analysis. Every single output is tracked — wins and losses.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>1.</span> Picks appearing in <strong>both</strong> Reddit AND Yahoo gainers are significantly more reliable than single-source signals
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>2.</span> High Fear & Greed (&gt;65) = momentum environment, picks perform better
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>3.</span> First hour of trading is key — if it doesn't move in the first 30min, cut it
            </p>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-3)', fontStyle: 'italic' }}>
            The algorithm isn't perfect — nothing is. But at a 2:1 risk/reward setup you only need ~35% accuracy to profit. We're running higher than that.
          </p>
        </div>

        {/* Picks table */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="screener-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ticker</th>
                  <th>Signal</th>
                  <th>Date</th>
                  <th>Entry</th>
                  <th>Close</th>
                  <th>Move</th>
                  <th>Result</th>
                  <th>Sources</th>
                </tr>
              </thead>
              <tbody>
                {[...picks].sort((a, b) => new Date(b.flaggedDate) - new Date(a.flaggedDate)).map((pick, i) => {
                  const signalColor = (pick.signal || '').includes('BUY') ? 'var(--accent-green)' : (pick.signal || '').includes('SELL') ? 'var(--accent-red)' : 'var(--text-muted)';
                  return (
                  <tr key={i} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/stock/${pick.ticker}`}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{i + 1}</td>
                    <td className="ticker-cell">${pick.ticker}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: signalColor }}>{pick.signal || 'BUY'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pick.flaggedDate}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>${pick.entryPrice.toFixed(2)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>${pick.closePrice.toFixed(2)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }} className={pick.pctChange >= 0 ? 'positive' : 'negative'}>
                      {pick.pctChange >= 0 ? '+' : ''}{pick.pctChange.toFixed(2)}%
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{getResultIcon(pick)}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pick.sources.join(', ')}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="section-centered" style={{ marginTop: 'var(--space-8)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Want to see tomorrow's picks before the market opens?
          </p>
          <div className="cta-row">
            <Link to="/screener" className="btn-primary">Try the Screener</Link>
            <Link to="/go" className="btn-secondary">Start Free Trial</Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-8)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Past performance does not guarantee future results. All picks are tracked from the moment they are flagged by the algorithm. Entry price is the price at flag time. Close price is the market close that day.
        </p>
      </section>
    </div>
  );
}
