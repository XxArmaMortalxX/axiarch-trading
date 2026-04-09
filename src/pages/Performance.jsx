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
  const today = new Date().toISOString().split('T')[0];

  // Split into today vs past
  const todayPicks = picks.filter(p => p.flaggedDate === today);
  const pastPicks = picks.filter(p => p.flaggedDate !== today);

  // Group past picks by date
  const pastByDate = {};
  for (const pick of pastPicks) {
    const date = pick.flaggedDate || 'Unknown';
    if (!pastByDate[date]) pastByDate[date] = [];
    pastByDate[date].push(pick);
  }
  const sortedDates = Object.keys(pastByDate).sort((a, b) => new Date(b) - new Date(a));

  function getResultIcon(pick) {
    const isBullish = (pick.signal || '').includes('BUY');
    const isBearish = (pick.signal || '').includes('SELL');
    const isHold = !isBullish && !isBearish;
    if (isHold) return '\u2014';
    if (pick.result === 'WIN') return '\u2705';
    if (pick.result === 'LOSS') return '\u274C';
    if (isBullish && pick.pctChange > 0) return '\u2705';
    if (isBearish && pick.pctChange < 0) return '\u2705';
    if (isBullish && pick.pctChange < 0) return '\u274C';
    if (isBearish && pick.pctChange > 0) return '\u274C';
    return '\u2014';
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return (
    <div className="page-fullbg page-fullbg-performance">
      <section className="page-hero">
        <div className="section-label">Transparency</div>
        <h2 className="section-title">Verified Performance</h2>
        <p className="section-subtitle">Every pick is tracked from flag time to close. No cherry-picking. No hindsight bias.</p>
      </section>

      <section>
        {/* Live Accuracy Meter — today only */}
        <AccuracyMeter />

        {/* How it works */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>How the Algorithm Works</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-3)' }}>
            The Axiarch scanner runs every morning at 9:30 AM ET. It scores 65+ stocks on technical indicators + Reddit/StockTwits social sentiment. Top 5 picks are logged with entry prices. At 4:00 PM ET, close prices are recorded and results are scored.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{'\u2713'}</span> BUY signal + price goes up = <strong style={{ color: 'var(--accent-green)' }}>correct call</strong>
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{'\u2713'}</span> SELL signal + price goes down = <strong style={{ color: 'var(--accent-green)' }}>correct call</strong>
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>{'\u2717'}</span> Wrong direction = <strong style={{ color: 'var(--accent-red)' }}>missed call</strong>
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{'\u2014'}</span> HOLD = no trade taken (algorithm wasn't confident)
            </p>
          </div>
        </div>

        {/* Past Performance — grouped by date */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 600, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '24px', height: '1px', background: 'var(--accent-green)', display: 'inline-block' }} />
          Past Picks
        </div>

        {sortedDates.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            No past picks yet. Check back after the first full day of tracking.
          </div>
        ) : sortedDates.map(date => {
          const datePicks = pastByDate[date];
          const dateActive = datePicks.filter(p => (p.signal || '').includes('BUY') || (p.signal || '').includes('SELL'));
          const dateWins = datePicks.filter(p => getResultIcon(p) === '\u2705').length;
          const dateLosses = datePicks.filter(p => getResultIcon(p) === '\u274C').length;
          const dateHolds = datePicks.length - dateActive.length;

          return (
            <div key={date} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: '0.75rem', overflow: 'hidden' }}>
              {/* Date header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                  {formatDate(date)}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                  {dateWins > 0 && <span style={{ color: 'var(--accent-green)' }}>{dateWins}W</span>}
                  {dateLosses > 0 && <span style={{ color: 'var(--accent-red)' }}>{dateLosses}L</span>}
                  {dateHolds > 0 && <span style={{ color: 'var(--text-muted)' }}>{dateHolds}H</span>}
                </div>
              </div>
              {/* Picks for this date */}
              <div style={{ overflowX: 'auto' }}>
                <table className="screener-table" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Ticker</th><th>Signal</th><th>Entry</th><th>Close</th><th>Move</th><th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datePicks.map((pick, i) => {
                      const signalColor = (pick.signal || '').includes('BUY') ? 'var(--accent-green)' : (pick.signal || '').includes('SELL') ? 'var(--accent-red)' : 'var(--text-muted)';
                      return (
                        <tr key={i} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/stock/${pick.ticker}`}>
                          <td className="ticker-cell">${pick.ticker}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: signalColor }}>{pick.signal || 'BUY'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>${pick.entryPrice.toFixed(2)}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>${pick.closePrice.toFixed(2)}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }} className={pick.pctChange >= 0 ? 'positive' : 'negative'}>
                            {pick.pctChange >= 0 ? '+' : ''}{pick.pctChange.toFixed(2)}%
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{getResultIcon(pick)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* CTA */}
        <div className="section-centered" style={{ marginTop: 'var(--space-8)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Want to see tomorrow's picks before the market opens?
          </p>
          <div className="cta-row">
            <Link to="/screener" className="btn-primary">Try the Screener</Link>
            <a href="https://t.me/axiarchtradebot" target="_blank" rel="noopener noreferrer" className="btn-secondary">Join Telegram</a>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-8)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Past performance does not guarantee future results. All picks are tracked from the moment they are flagged by the algorithm.
        </p>
      </section>
    </div>
  );
}
