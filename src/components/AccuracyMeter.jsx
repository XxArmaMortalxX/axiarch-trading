import { useState, useEffect } from 'react';

export default function AccuracyMeter() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/.netlify/functions/get-performance')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {
        fetch('/performance.json')
          .then(r => r.json())
          .then(d => setData(d))
          .catch(() => {});
      });
  }, []);

  if (!data?.picks?.length) return null;

  const picks = data.picks;
  const active = picks.filter(p => p.signal && (p.signal.includes('BUY') || p.signal.includes('SELL')));
  const holds = picks.filter(p => !p.signal || p.signal === 'HOLD');
  const wins = active.filter(p => p.result === 'WIN' || (!p.result && ((p.signal?.includes('BUY') && p.pctChange > 0) || (p.signal?.includes('SELL') && p.pctChange < 0))));
  const losses = active.filter(p => p.result === 'LOSS' || (!p.result && ((p.signal?.includes('BUY') && p.pctChange < 0) || (p.signal?.includes('SELL') && p.pctChange > 0))));
  const accuracy = active.length > 0 ? Math.round((wins.length / active.length) * 100) : 0;
  const avgReturn = active.length > 0 ? (active.reduce((s, p) => s + Math.abs(p.pctChange || 0), 0) / active.length).toFixed(1) : '0';

  const meterColor = accuracy >= 70 ? 'var(--accent-green)' : accuracy >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';

  // Last updated
  const lastPick = picks.reduce((latest, p) => {
    const d = new Date(p.flaggedDate || p.trackedAt || 0);
    return d > latest ? d : latest;
  }, new Date(0));
  const daysAgo = Math.floor((Date.now() - lastPick.getTime()) / 86400000);
  const lastUpdated = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1rem 1.25rem',
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Live Accuracy
        </div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
          Updated {lastUpdated}
        </div>
      </div>

      {/* Accuracy bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 800, color: meterColor, minWidth: '55px' }}>
          {accuracy}%
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${accuracy}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${meterColor}, ${meterColor}dd)`,
              borderRadius: '4px',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
        <div>
          <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{wins.length}</span>
          <span style={{ color: 'var(--text-muted)' }}> wins</span>
        </div>
        <div>
          <span style={{ color: losses.length > 0 ? 'var(--accent-red)' : 'var(--text-muted)', fontWeight: 700 }}>{losses.length}</span>
          <span style={{ color: 'var(--text-muted)' }}> losses</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{holds.length}</span>
          <span style={{ color: 'var(--text-muted)' }}> holds</span>
        </div>
        <div>
          <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{avgReturn}%</span>
          <span style={{ color: 'var(--text-muted)' }}> avg move</span>
        </div>
      </div>
    </div>
  );
}
