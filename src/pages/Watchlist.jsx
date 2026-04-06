import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFinnhubContext } from '../context/FinnhubContext';
import SignalBadge from '../components/SignalBadge';
import { fmtPrice } from '../lib/indicators';

const SORT_OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'price', label: 'Price' },
  { key: 'change', label: 'Change %' },
  { key: 'score', label: 'Score' },
];

function WatchlistCard({ ticker, stockData, onRemove }) {
  const hasData = !!stockData;
  const price = stockData?.price;
  const change = stockData?.change || 0;
  const score = stockData?.score;
  const signal = stockData?.signal;
  const rsi = stockData?.rsi;

  return (
    <div className="watchlist-card">
      <button className="watchlist-card-remove" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(ticker); }} title="Remove from watchlist">&times;</button>

      <Link to={`/stock/${ticker}`} className="watchlist-card-link">
        <div className="watchlist-card-header">
          <span className="watchlist-card-ticker">${ticker}</span>
          {signal && <SignalBadge signal={signal} />}
        </div>

        <div className="watchlist-card-price">
          <span className="watchlist-card-price-value">{hasData ? fmtPrice(price) : '—'}</span>
          <span className={`watchlist-card-change ${change >= 0 ? 'positive' : 'negative'}`}>
            {hasData ? `${change >= 0 ? '+' : ''}${change}%` : '—'}
          </span>
        </div>

        <div className="watchlist-card-indicators">
          <div className="watchlist-card-indicator">
            <span className="watchlist-card-indicator-label">Score</span>
            <span className="watchlist-card-indicator-value" style={{ color: score >= 70 ? 'var(--accent-green)' : score >= 45 ? 'var(--accent-amber)' : score ? 'var(--accent-red)' : 'var(--text-muted)' }}>
              {score ?? '—'}
            </span>
          </div>
          <div className="watchlist-card-indicator">
            <span className="watchlist-card-indicator-label">RSI</span>
            <span className="watchlist-card-indicator-value" style={{ color: rsi < 30 ? 'var(--accent-green)' : rsi > 70 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
              {rsi ? rsi.toFixed(1) : '—'}
            </span>
          </div>
          <div className="watchlist-card-indicator">
            <span className="watchlist-card-indicator-label">Bias</span>
            <span className="watchlist-card-indicator-value" style={{ color: stockData?.bias === 'LONG' ? 'var(--accent-green)' : stockData?.bias === 'SHORT' ? 'var(--accent-red)' : 'var(--text-muted)' }}>
              {stockData?.bias || '—'}
            </span>
          </div>
        </div>

        {stockData?.entry && (
          <div className="watchlist-card-trade">
            <span style={{ color: 'var(--accent-cyan)' }}>E: {fmtPrice(stockData.entry)}</span>
            <span style={{ color: 'var(--accent-red)' }}>S: {fmtPrice(stockData.stop)}</span>
            <span style={{ color: 'var(--accent-green)' }}>T: {fmtPrice(stockData.target)}</span>
          </div>
        )}
      </Link>
    </div>
  );
}

export default function Watchlist() {
  const { data, isScanning, scanMessage, runFullScan, customTickers, addTicker, removeTicker, clearCustom } = useFinnhubContext();
  const [tickerInput, setTickerInput] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [sortDir, setSortDir] = useState('desc');

  const handleAdd = () => {
    const t = tickerInput.trim().toUpperCase();
    if (t && /^[A-Z]{1,5}$/.test(t)) {
      addTicker(t);
      setTickerInput('');
    }
  };

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  // Build watchlist items with data
  const watchlistItems = useMemo(() => {
    return customTickers.map(ticker => {
      const stockData = data.find(d => d.sym === ticker) || null;
      return { ticker, stockData };
    }).sort((a, b) => {
      const aVal = a.stockData;
      const bVal = b.stockData;
      let cmp = 0;

      switch (sortBy) {
        case 'name':
          cmp = a.ticker.localeCompare(b.ticker);
          break;
        case 'price':
          cmp = (aVal?.price || 0) - (bVal?.price || 0);
          break;
        case 'change':
          cmp = (aVal?.change || 0) - (bVal?.change || 0);
          break;
        case 'score':
          cmp = (aVal?.score || 0) - (bVal?.score || 0);
          break;
        default:
          break;
      }

      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [customTickers, data, sortBy, sortDir]);

  return (
    <>
      <section className="page-hero">
        <div className="section-label">Portfolio</div>
        <h2 className="section-title">My Watchlist</h2>
        <p className="section-subtitle">Track your favorite tickers with real-time data, signals, and technical indicators.</p>
      </section>

      <section>
        {/* Add ticker + actions bar */}
        <div className="watchlist-actions">
          <div className="watchlist-add-row">
            <input
              type="text"
              value={tickerInput}
              onChange={e => setTickerInput(e.target.value.toUpperCase())}
              placeholder="Add ticker (e.g. AAPL)"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="watchlist-add-input"
            />
            <button onClick={handleAdd} className="btn-primary" style={{ padding: '0.55rem 1.2rem' }}>
              Add to Watchlist
            </button>
          </div>

          <div className="watchlist-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {customTickers.length > 0 && (
                <>
                  <button
                    onClick={() => runFullScan(customTickers)}
                    disabled={isScanning}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.9rem', fontSize: 'var(--text-sm)' }}
                  >
                    {isScanning ? 'Scanning...' : `Scan ${customTickers.length} Ticker${customTickers.length === 1 ? '' : 's'}`}
                  </button>
                  <button
                    onClick={clearCustom}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>

            {customTickers.length > 1 && (
              <div className="watchlist-sort">
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginRight: '0.3rem' }}>Sort:</span>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => handleSort(opt.key)}
                    className={`watchlist-sort-btn ${sortBy === opt.key ? 'active' : ''}`}
                  >
                    {opt.label} {sortBy === opt.key && (sortDir === 'desc' ? '\u2193' : '\u2191')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isScanning && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="spinner" /> {scanMessage}
            </div>
          )}
        </div>

        {/* Empty state */}
        {customTickers.length === 0 && (
          <div className="watchlist-empty">
            <div className="watchlist-empty-icon">+</div>
            <h3>Your watchlist is empty</h3>
            <p>Add ticker symbols above to start tracking stocks with real-time data and signals.</p>
            <p style={{ marginTop: '0.8rem' }}>
              <Link to="/screener" style={{ color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 600 }}>
                Browse the Screener to find stocks &rarr;
              </Link>
            </p>
          </div>
        )}

        {/* Watchlist grid */}
        {customTickers.length > 0 && (
          <div className="watchlist-grid">
            {watchlistItems.map(({ ticker, stockData }) => (
              <WatchlistCard
                key={ticker}
                ticker={ticker}
                stockData={stockData}
                onRemove={removeTicker}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
