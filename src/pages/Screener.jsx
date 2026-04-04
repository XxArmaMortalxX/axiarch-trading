import { useState, useEffect, useCallback } from 'react';
import { useFinnhub } from '../hooks/useFinnhub';
import ScoreBar from '../components/ScoreBar';
import BiasTag from '../components/BiasTag';
import SignalBadge from '../components/SignalBadge';
import TickerModal from '../components/TickerModal';
import { fmtPrice } from '../lib/indicators';

export default function Screener() {
  const { data, dataSource, isScanning, scanStatus, scanMessage, apiKey, saveKey, runFullScan } = useFinnhub();
  const [filter, setFilter] = useState('all');
  const [keyInput, setKeyInput] = useState(apiKey);
  const [modalTicker, setModalTicker] = useState(null);

  useEffect(() => {
    if (apiKey) {
      runFullScan(apiKey);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = useCallback(() => {
    const key = keyInput.trim();
    if (key) {
      saveKey(key);
      runFullScan(key);
    }
  }, [keyInput, saveKey, runFullScan]);

  const filtered = (() => {
    let d = [...data];
    if (filter === 'long') d = d.filter(t => t.bias === 'LONG');
    else if (filter === 'short') d = d.filter(t => t.bias === 'SHORT');
    else if (filter === 'hot') d = d.filter(t => t.signal === 'STRONG BUY' || t.signal === 'STRONG SELL');
    return d.sort((a, b) => b.score - a.score);
  })();

  const statusColor = scanStatus === 'live' ? 'var(--accent-green)' : scanStatus === 'error' ? 'var(--accent-red)' : scanStatus === 'scanning' ? 'var(--accent-cyan)' : 'var(--accent-amber)';

  return (
    <>
      <section className="page-hero">
        <div className="hero-bg-screener" />
        <div className="section-label">Scanner</div>
        <h2 className="section-title">Real-Time Stock Scanner</h2>
        <p className="section-subtitle">Every stock scored by technical indicators. Connect your Finnhub API key for live data, or browse the demo below.</p>
      </section>

      <section>

        <div className="api-bar">
          <label>Finnhub API Key:</label>
          <input
            type="text"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            placeholder="sk_live_xxxxxxxxxxxxxxxx"
            onKeyDown={e => e.key === 'Enter' && handleConnect()}
          />
          <button onClick={handleConnect} disabled={isScanning} className="btn-primary" style={{ width: 'auto' }}>
            {isScanning ? '\u27F3 Scanning...' : apiKey ? '\u27F3 Refresh Scan' : 'Connect & Scan'}
          </button>
          <a href="https://finnhub.io/register" className="help-link" target="_blank" rel="noopener noreferrer">Get free key &rarr;</a>
          <span className={`api-status ${apiKey ? 'connected' : 'disconnected'}`}>
            {apiKey ? 'CONNECTED' : 'NO KEY'}
          </span>
        </div>

        <div style={{ fontSize: '0.72rem', color: statusColor, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {scanStatus === 'scanning' && <span className="spinner" />}
          {scanStatus === 'live' && <span className="live-dot" />}
          {scanMessage}
        </div>

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
                    <tr key={t.sym} onClick={() => setModalTicker(t)} style={{ cursor: 'pointer' }}>
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

      {modalTicker && <TickerModal ticker={modalTicker} onClose={() => setModalTicker(null)} />}
    </>
  );
}
