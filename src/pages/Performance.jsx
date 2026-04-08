import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
  const winners = picks.filter(p => p.pctChange > 0);
  const winRate = picks.length > 0 ? Math.round((winners.length / picks.length) * 100) : 0;
  const avgReturn = picks.length > 0 ? (picks.reduce((s, p) => s + p.pctChange, 0) / picks.length).toFixed(1) : '0';
  const bestPick = picks.reduce((best, p) => p.pctChange > (best?.pctChange || -Infinity) ? p : best, null);
  const totalReturn = picks.reduce((s, p) => s + p.pctChange, 0).toFixed(1);

  return (
    <div className="page-fullbg page-fullbg-performance">
      <section className="page-hero">
        <div className="section-label">Transparency</div>
        <h2 className="section-title">Verified Performance</h2>
        <p className="section-subtitle">Every pick is tracked from the moment it's flagged. Entry price at flag time, close price at end of day. No cherry-picking. No hindsight bias.</p>
      </section>

      <section>
        {/* Stats */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { value: picks.length, label: 'Tracked Picks' },
            { value: `${winners.length}/${picks.length}`, label: 'Winners', color: 'var(--accent-green)' },
            { value: `+${avgReturn}%`, label: 'Avg Return', color: 'var(--accent-green)' },
            { value: bestPick ? `+${bestPick.pctChange.toFixed(1)}%` : '\u2014', label: bestPick ? `Best: $${bestPick.ticker}` : 'Best Pick', color: 'var(--accent-green)' },
            { value: `+${totalReturn}%`, label: 'Total Return', color: 'var(--accent-green)' },
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
                  <th>Date Flagged</th>
                  <th>Entry Price</th>
                  <th>Close Price</th>
                  <th>Return</th>
                  <th>Result</th>
                  <th>Sources</th>
                </tr>
              </thead>
              <tbody>
                {[...picks].sort((a, b) => b.pctChange - a.pctChange).map((pick, i) => (
                  <tr key={i} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/stock/${pick.ticker}`}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{i + 1}</td>
                    <td className="ticker-cell">${pick.ticker}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pick.flaggedDate}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>${pick.entryPrice.toFixed(2)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>${pick.closePrice.toFixed(2)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }} className={pick.pctChange >= 0 ? 'positive' : 'negative'}>
                      {pick.pctChange >= 0 ? '+' : ''}{pick.pctChange.toFixed(2)}%
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{pick.pctChange >= 0 ? '\u2705' : '\u274C'}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pick.sources.join(', ')}</td>
                  </tr>
                ))}
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
