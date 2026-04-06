import { useState, useEffect } from 'react';

export default function Performance() {
  const [perfData, setPerfData] = useState(null);

  useEffect(() => {
    fetch('/performance.json')
      .then(r => r.json())
      .then(setPerfData)
      .catch(() => {});
  }, []);

  const picks = perfData?.picks || [];
  const winners = picks.filter(p => p.pctChange > 0);
  const losers = picks.filter(p => p.pctChange <= 0);
  const winRate = picks.length > 0 ? Math.round((winners.length / picks.length) * 100) : 0;
  const avgReturn = picks.length > 0 ? (picks.reduce((s, p) => s + p.pctChange, 0) / picks.length).toFixed(2) : '0';
  const bestPick = picks.reduce((best, p) => p.pctChange > (best?.pctChange || -Infinity) ? p : best, null);
  const totalReturn = picks.reduce((s, p) => s + p.pctChange, 0).toFixed(1);

  return (
    <section>
      <div className="section-label">Transparency</div>
      <h2 className="section-title">Verified Performance</h2>
      <p className="section-subtitle">Every pick is tracked from the moment it's flagged. Entry price at flag time, close price at end of day. No cherry-picking.</p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        {[
          { value: picks.length, label: 'Tracked Picks' },
          { value: `${winRate}%`, label: 'Win Rate', color: winRate >= 50 ? 'var(--accent-green)' : 'var(--accent-red)' },
          { value: `+${avgReturn}%`, label: 'Avg Return', color: 'var(--accent-green)' },
          { value: bestPick ? `+${bestPick.pctChange.toFixed(1)}%` : '—', label: bestPick ? `Best: $${bestPick.ticker}` : 'Best Pick', color: 'var(--accent-green)' },
          { value: `+${totalReturn}%`, label: 'Total Return', color: 'var(--accent-green)' },
        ].map(s => (
          <div key={s.label} className="hero-stat">
            <div className="hero-stat-value" style={s.color ? { color: s.color } : {}}>{s.value}</div>
            <div className="hero-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Picks table */}
      <div style={{ marginTop: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="screener-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Date Flagged</th>
                <th>Entry Price</th>
                <th>Close Price</th>
                <th>Return</th>
                <th>Score</th>
                <th>Sources</th>
              </tr>
            </thead>
            <tbody>
              {picks.sort((a, b) => b.pctChange - a.pctChange).map((pick, i) => (
                <tr key={i}>
                  <td className="ticker-cell">${pick.ticker}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pick.flaggedDate}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>${pick.entryPrice.toFixed(2)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>${pick.closePrice.toFixed(2)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }} className={pick.pctChange >= 0 ? 'positive' : 'negative'}>
                    {pick.pctChange >= 0 ? '+' : ''}{pick.pctChange.toFixed(2)}%
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{typeof pick.score === 'number' ? pick.score.toFixed(0) : pick.score}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pick.sources.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        Past performance does not guarantee future results. All picks are tracked from the moment they are flagged by the algorithm. Entry price is the price at flag time. Close price is the market close that day.
      </p>
    </section>
  );
}
