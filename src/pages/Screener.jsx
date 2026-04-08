import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFinnhubContext } from '../context/FinnhubContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import ScoreBar from '../components/ScoreBar';
import BiasTag from '../components/BiasTag';
import SignalBadge from '../components/SignalBadge';
import { fmtPrice } from '../lib/indicators';

export default function Screener() {
  const { isLoggedIn } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const { data, dataSource, isScanning, scanStatus, scanMessage, runFullScan, fullWatchlist, customTickers } = useFinnhubContext();
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef(null);

  // Auto-refresh every 60 seconds when enabled
  useEffect(() => {
    if (autoRefresh && !isScanning) {
      intervalRef.current = setInterval(() => {
        runFullScan(fullWatchlist);
      }, 60000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, isScanning, runFullScan, fullWatchlist]);

  const filtered = (() => {
    let d = [...data];
    if (filter === 'long') d = d.filter(t => t.bias === 'LONG');
    else if (filter === 'short') d = d.filter(t => t.bias === 'SHORT');
    else if (filter === 'hot') d = d.filter(t => t.signal === 'STRONG BUY' || t.signal === 'STRONG SELL');
    else if (filter === 'social') d = d.filter(t => t.socialScore > 0).sort((a, b) => b.socialScore - a.socialScore);
    if (filter !== 'social') d = d.sort((a, b) => b.score - a.score);
    return d;
  })();

  const statusColor = scanStatus === 'live' ? 'var(--accent-green)' : scanStatus === 'error' ? 'var(--accent-red)' : scanStatus === 'scanning' ? 'var(--accent-cyan)' : 'var(--accent-amber)';

  return (
    <div className="page-fullbg page-fullbg-screener">
      <section className="page-hero">
        <div className="section-label">Scanner</div>
        <h2 className="section-title">Real-Time Stock Scanner</h2>
        <p className="section-subtitle">65+ stocks scanned in real-time with RSI, EMA, MACD, Bollinger Bands, ATR, and VWAP. Click any ticker for full analysis.</p>
      </section>

      {/* Auth gate */}
      {!isLoggedIn && (
        <section className="section-centered" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
          <div style={{ maxWidth: '460px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Unlock the Scanner</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 'var(--leading-relaxed)' }}>
              Enter your email to access live stock scanning with RSI, EMA, MACD, social sentiment, and BUY/SELL signals. Completely free.
            </p>
            <button onClick={() => setShowAuth(true)} className="btn-primary" style={{ width: '100%' }}>
              Sign In with Email
            </button>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
              No credit card. No spam. Just your email.
            </p>
          </div>
          {showAuth && <AuthModal onClose={() => setShowAuth(false)} required />}
        </section>
      )}

      {isLoggedIn && <section>

        {/* Watchlist link + scan status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Link to="/watchlist" style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 600 }}>
            My Watchlist {customTickers.length > 0 && `(${customTickers.length})`} &rarr;
          </Link>
          <button
            className="btn-secondary"
            style={{ padding: '0.35rem 0.8rem', fontSize: 'var(--text-xs)' }}
            onClick={() => runFullScan(fullWatchlist)}
            disabled={isScanning}
          >
            {isScanning ? 'Scanning...' : 'Rescan All'}
          </button>
        </div>

        <div style={{ fontSize: '0.72rem', color: statusColor, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            {scanStatus === 'scanning' && <span className="spinner" />}
            {scanStatus === 'live' && <span className="live-dot" />}
            {scanMessage}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} style={{ accentColor: 'var(--accent-green)' }} />
            Auto-refresh (60s)
          </label>
        </div>
        {isScanning && (() => {
          const match = scanMessage.match(/(\d+)%/);
          const pct = match ? parseInt(match[1]) : 0;
          return (
            <div className="scan-progress" style={{ marginBottom: '1rem' }}>
              <div className="scan-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          );
        })()}

        <div className="screener-container">
          <div className="screener-toolbar">
            <div className="screener-filters">
              {[['all', 'All Picks'], ['long', 'Long Only'], ['short', 'Short Only'], ['hot', 'Strong Signals'], ['social', 'Social Buzz']].map(([key, label]) => (
                <button key={key} className={`filter-chip${filter === key ? ' active' : ''}`} onClick={() => setFilter(key)}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="screener-table">
              <thead>
                <tr>
                  <th>#</th><th>Ticker</th><th>Price</th><th>Change %</th><th>Social</th><th>Score</th><th>Signal</th><th>Bias</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No stocks match current filters.</td></tr>
                ) : filtered.slice(0, 30).map((t, i) => {
                  const chgCls = t.change >= 0 ? 'positive' : 'negative';

                  return (
                    <tr key={t.sym} onClick={() => navigate(`/stock/${t.sym}`)} style={{ cursor: 'pointer' }}>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{i + 1}</td>
                      <td className="ticker-cell">{t.sym}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{fmtPrice(t.price)}</td>
                      <td className={chgCls} style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{t.change >= 0 ? '+' : ''}{t.change}%</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: t.socialScore > 50 ? 'var(--accent-green)' : t.socialScore > 20 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                        {t.socialScore > 0 ? t.socialScore : '\u2014'}
                        {t.mentions > 0 && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>({t.mentions})</span>}
                      </td>
                      <td><ScoreBar score={t.score} /></td>
                      <td><SignalBadge signal={t.signal} /></td>
                      <td><BiasTag bias={t.bias} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>}

    </div>
  );
}
