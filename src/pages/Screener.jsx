import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFinnhubContext } from '../context/FinnhubContext';
import ScoreBar from '../components/ScoreBar';
import BiasTag from '../components/BiasTag';
import SignalBadge from '../components/SignalBadge';
import { fmtPrice } from '../lib/indicators';

export default function Screener() {
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
    return d.sort((a, b) => b.score - a.score);
  })();

  const statusColor = scanStatus === 'live' ? 'var(--accent-green)' : scanStatus === 'error' ? 'var(--accent-red)' : scanStatus === 'scanning' ? 'var(--accent-cyan)' : 'var(--accent-amber)';

  return (
    <div className="page-fullbg page-fullbg-screener">
      <section className="page-hero">
        <div className="section-label">Scanner</div>
        <h2 className="section-title">Real-Time Stock Scanner</h2>
        <p className="section-subtitle">65+ stocks scanned in real-time with RSI, EMA, MACD, Bollinger Bands, ATR, and VWAP. Click any ticker for full analysis.</p>
      </section>

      <section>

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
              {[['all', 'All Picks'], ['long', 'Long Only'], ['short', 'Short Only'], ['hot', 'Strong Signals']].map(([key, label]) => (
                <button key={key} className={`filter-chip${filter === key ? ' active' : ''}`} onClick={() => setFilter(key)}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="screener-table">
              <thead>
                <tr>
                  <th>#</th><th>Ticker</th><th>Price</th><th>Change %</th><th>RSI(14)</th><th>Rel Vol</th><th>MACD</th><th>Score</th><th>Signal</th><th>Entry / Stop / Target</th><th>Bias</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="11" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No stocks match current filters.</td></tr>
                ) : filtered.slice(0, 30).map((t, i) => {
                  const chgCls = t.change >= 0 ? 'positive' : 'negative';
                  const rsiVal = t.rsi !== null ? t.rsi.toFixed(1) : '\u2014';
                  const rsiCls = t.rsi === null ? 'rsi-neutral' : t.rsi < 30 ? 'rsi-oversold' : t.rsi > 70 ? 'rsi-overbought' : 'rsi-neutral';
                  const rvolVal = t.rvol !== null ? t.rvol.toFixed(1) + 'x' : '\u2014';
                  const rvolCls = t.rvol === null ? 'rvol-normal' : t.rvol > 2 ? 'rvol-high' : t.rvol > 1 ? 'rvol-normal' : 'rvol-low';
                  const macdHist = t.macd ? t.macd.histogram : 0;
                  const macdCls = macdHist > 0 ? 'macd-bull' : macdHist < 0 ? 'macd-bear' : 'macd-neutral';
                  const macdIcon = macdHist > 0 ? '\u25B2' : macdHist < 0 ? '\u25BC' : '\u2014';

                  return (
                    <tr key={t.sym} onClick={() => navigate(`/stock/${t.sym}`)} style={{ cursor: 'pointer' }}>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{i + 1}</td>
                      <td className="ticker-cell">{t.sym}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{fmtPrice(t.price)}</td>
                      <td className={chgCls} style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{t.change >= 0 ? '+' : ''}{t.change}%</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }} className={rsiCls}>{rsiVal}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }} className={rvolCls}>{rvolVal}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }} className={macdCls}>{macdIcon} {Math.abs(macdHist).toFixed(3)}</td>
                      <td><ScoreBar score={t.score} /></td>
                      <td><SignalBadge signal={t.signal} /></td>
                      <td className="target-cell" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                        {t.entry !== null ? (
                          <>
                            <span className="target-entry">{fmtPrice(t.entry)}</span>
                            {' / '}
                            <span className="target-stop">{fmtPrice(t.stop)}</span>
                            {' / '}
                            <span className="target-tp">{fmtPrice(t.target)}</span>
                          </>
                        ) : <span style={{ color: 'var(--text-muted)' }}>{'\u2014'}</span>}
                      </td>
                      <td><BiasTag bias={t.bias} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}
