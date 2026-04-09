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

  if (!data) return null;

  const today = new Date().toISOString().split('T')[0];
  const todayMorning = data.todayMorning;
  const allPicks = data.picks || [];

  // Today's picks only (from afternoon check or morning scan)
  const todayPicks = allPicks.filter(p => p.flaggedDate === today);
  const todayActive = todayPicks.filter(p => p.signal && (p.signal.includes('BUY') || p.signal.includes('SELL')));
  const todayWins = todayActive.filter(p => p.result === 'WIN' || (!p.result && ((p.signal?.includes('BUY') && p.pctChange > 0) || (p.signal?.includes('SELL') && p.pctChange < 0)))).length;
  const todayLosses = todayActive.filter(p => p.result === 'LOSS' || (!p.result && ((p.signal?.includes('BUY') && p.pctChange < 0) || (p.signal?.includes('SELL') && p.pctChange > 0)))).length;

  // If we have morning picks but no afternoon results yet, show "tracking"
  const hasMorningPicks = todayMorning?.picks?.length > 0;
  const hasResults = todayPicks.length > 0;

  // All-time stats for context
  const allActive = allPicks.filter(p => p.signal && (p.signal.includes('BUY') || p.signal.includes('SELL')));
  const allWins = allActive.filter(p => p.result === 'WIN' || (!p.result && ((p.signal?.includes('BUY') && p.pctChange > 0) || (p.signal?.includes('SELL') && p.pctChange < 0)))).length;
  const allLosses = allActive.filter(p => p.result === 'LOSS' || (!p.result && ((p.signal?.includes('BUY') && p.pctChange < 0) || (p.signal?.includes('SELL') && p.pctChange > 0)))).length;
  const allAccuracy = allActive.length > 0 ? Math.round((allWins / allActive.length) * 100) : 0;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      marginBottom: '1.5rem',
    }}>
      {/* Today's Status */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 600, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span className="live-dot" />
        Today's Performance
      </div>

      {hasMorningPicks && !hasResults && (
        <div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            {todayMorning.picks.length} picks flagged this morning — tracking until market close.
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {todayMorning.picks.map(p => (
              <div key={p.ticker} style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '0.5rem 0.75rem',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
              }}>
                <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>${p.ticker}</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                  {p.signal || 'BUY'} @ ${p.entryPrice.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasResults && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 800, color: todayWins >= todayLosses ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {todayWins}/{todayActive.length}
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Correct calls today</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {todayWins} wins, {todayLosses} losses, {todayPicks.length - todayActive.length} holds
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {todayPicks.map(p => {
              const isWin = p.result === 'WIN' || (p.signal?.includes('BUY') && p.pctChange > 0) || (p.signal?.includes('SELL') && p.pctChange < 0);
              const isLoss = p.result === 'LOSS';
              const isHold = !p.signal || p.signal === 'HOLD';
              return (
                <div key={p.ticker} style={{
                  background: 'var(--bg-primary)',
                  border: `1px solid ${isWin ? 'var(--accent-green)' : isLoss ? 'var(--accent-red)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  padding: '0.4rem 0.6rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                }}>
                  <span style={{ fontWeight: 700, color: isWin ? 'var(--accent-green)' : isLoss ? 'var(--accent-red)' : 'var(--text-muted)' }}>${p.ticker}</span>
                  <span style={{ color: p.pctChange >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', marginLeft: '0.3rem' }}>
                    {p.pctChange >= 0 ? '+' : ''}{p.pctChange.toFixed(1)}%
                  </span>
                  {isHold && <span style={{ color: 'var(--text-muted)', marginLeft: '0.2rem' }}>(hold)</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!hasMorningPicks && !hasResults && (
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          No picks yet today. Morning scan runs at 9:30 AM ET.
        </div>
      )}

      {/* All-time accuracy bar */}
      {allActive.length > 0 && (
        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>All-Time Accuracy</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, color: allAccuracy >= 60 ? 'var(--accent-green)' : allAccuracy >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{allAccuracy}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${allAccuracy}%`, height: '100%', background: allAccuracy >= 60 ? 'var(--accent-green)' : allAccuracy >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)', borderRadius: '3px' }} />
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
            {allWins}W / {allLosses}L across {allActive.length} active trades
          </div>
        </div>
      )}
    </div>
  );
}
