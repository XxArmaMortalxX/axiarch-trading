import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function DailyRecap() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/picks.json')
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || !data.picks) return null;

  const top5 = data.picks.slice(0, 5);
  const stats = data.stats;
  const date = stats?.lastUpdated
    ? new Date(stats.lastUpdated).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'Today';

  const fgLabel = stats?.fearGreedLabel || 'Unknown';
  const fgValue = stats?.fearGreed ?? '—';

  return (
    <div className="recap-card">
      <h3>Daily Market Recap</h3>
      <div className="recap-date">{date}</div>

      {/* Top picks */}
      {top5.map((pick, i) => {
        const medal = i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : `#${i + 1}`;
        return (
          <div className="recap-pick" key={pick.ticker}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: 'var(--text-sm)' }}>{medal}</span>
              <Link to={`/stock/${pick.ticker}`} style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)', textDecoration: 'none', fontSize: 'var(--text-base)' }}>
                ${pick.ticker}
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Score {pick.score}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {pick.sources.join(', ')}
              </span>
            </div>
          </div>
        );
      })}

      {/* Stats summary */}
      {stats && (
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap', fontSize: 'var(--text-sm)' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Win Rate: </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)' }}>{stats.winRate}%</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Avg Return: </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)' }}>+{stats.avgReturn}%</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Fear & Greed: </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: fgValue < 25 ? 'var(--accent-red)' : fgValue < 50 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
              {fgValue} ({fgLabel})
            </span>
          </div>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <Link to="/screener" style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 600 }}>
          View all picks in Screener &rarr;
        </Link>
      </div>
    </div>
  );
}
