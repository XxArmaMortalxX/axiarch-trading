import { useEffect } from 'react';

export default function TickerModal({ ticker, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!ticker) return null;

  return (
    <div className="ticker-modal-overlay show" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <button className="modal-x" onClick={onClose}>{'\u2715'}</button>
        <div className="modal-sym">${ticker.sym}</div>
        <div className="modal-grid">
          <div className="modal-cell">
            <div className="modal-lbl">Price</div>
            <div className="modal-val">${ticker.price?.toFixed(2)}</div>
          </div>
          <div className="modal-cell">
            <div className="modal-lbl">Change</div>
            <div className="modal-val" style={{ color: ticker.change >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {ticker.change >= 0 ? '+' : ''}{ticker.change}%
            </div>
          </div>
          <div className="modal-cell">
            <div className="modal-lbl">Axiarch Score</div>
            <div className="modal-val">{ticker.score}</div>
          </div>
          <div className="modal-cell">
            <div className="modal-lbl">RSI(14)</div>
            <div className="modal-val">{ticker.rsi ? ticker.rsi.toFixed(1) : '\u2014'}</div>
          </div>
          <div className="modal-cell">
            <div className="modal-lbl">Rel Volume</div>
            <div className="modal-val">{ticker.rvol ? ticker.rvol.toFixed(1) + 'x' : '\u2014'}</div>
          </div>
          <div className="modal-cell">
            <div className="modal-lbl">Signal</div>
            <div className="modal-val" style={{ fontSize: '0.72rem' }}>{ticker.signal}</div>
          </div>
        </div>
        <div className="modal-links">
          <a href={`https://finance.yahoo.com/quote/${ticker.sym}`} className="modal-lnk" target="_blank" rel="noopener noreferrer">Yahoo Finance</a>
          <a href={`https://www.reddit.com/search/?q=${encodeURIComponent('$' + ticker.sym)}&sort=new`} className="modal-lnk" target="_blank" rel="noopener noreferrer">Reddit</a>
        </div>
      </div>
    </div>
  );
}
