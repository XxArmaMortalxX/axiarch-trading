import { useState, useCallback } from 'react';

export default function Calculator() {
  const [inputs, setInputs] = useState({ open: 3.50, close: 2.80, shares: 1000, rr: 3.0 });

  const update = useCallback((field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const entry = Math.max(inputs.open, inputs.close);
  const stop = Math.min(inputs.open, inputs.close);
  const risk = entry - stop;
  const fmt = v => '$' + v.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const t1 = entry + risk * 2;
  const t2 = entry + risk * 3;
  const t3 = entry + risk * inputs.rr;
  const maxProfit = (t3 - entry) * inputs.shares;

  return (
    <>
    <section className="page-hero">
      <div className="hero-bg-calculator" />
      <div className="section-label">Tools</div>
      <h2 className="section-title">Position Sizing & Risk Management</h2>
      <p className="section-subtitle">Enter candle data to calculate entry, stop-loss, and profit targets with precise risk-reward ratios.</p>
    </section>

    <section>
      <div className="calc-container">
        <div className="calc-form">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Candle Input</h3>
          <div className="form-group">
            <label>Candle Open (Top of Body)</label>
            <input type="number" value={inputs.open} onChange={e => update('open', parseFloat(e.target.value) || 0)} step="0.01" />
          </div>
          <div className="form-group">
            <label>Candle Close (Bottom of Body)</label>
            <input type="number" value={inputs.close} onChange={e => update('close', parseFloat(e.target.value) || 0)} step="0.01" />
          </div>
          <div className="form-group">
            <label>Position Size (Shares)</label>
            <input type="number" value={inputs.shares} onChange={e => update('shares', parseInt(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label>Custom R:R Ratio</label>
            <input type="number" value={inputs.rr} onChange={e => update('rr', parseFloat(e.target.value) || 0)} step="0.1" />
          </div>
        </div>

        <div className="calc-results">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Trade Plan</h3>
          <div className="result-row">
            <span className="result-label">Entry Price</span>
            <span className="result-value">{fmt(entry)}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Stop Loss</span>
            <span className="result-value" style={{ color: 'var(--accent-red)' }}>{fmt(stop)}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Risk per Share</span>
            <span className="result-value">{fmt(risk)}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Total Risk</span>
            <span className="result-value" style={{ color: 'var(--accent-red)' }}>{fmt(risk * inputs.shares)}</span>
          </div>
          <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1rem 0' }}>
            <div className="result-row">
              <span className="result-label">Target 1 (2:1)</span>
              <span className="result-value" style={{ color: 'var(--accent-green)' }}>{fmt(t1)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Target 2 (3:1)</span>
              <span className="result-value" style={{ color: 'var(--accent-green)' }}>{fmt(t2)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Target 3 (Custom)</span>
              <span className="result-value" style={{ color: 'var(--accent-green)' }}>{fmt(t3)}</span>
            </div>
          </div>
          <div className="result-row">
            <span className="result-label">Max Profit</span>
            <span className="result-value" style={{ color: 'var(--accent-green)' }}>{fmt(maxProfit)}</span>
          </div>
          <div className="result-row" style={{ border: 'none' }}>
            <span className="result-label" style={{ fontWeight: 600 }}>Reward : Risk</span>
            <span className="result-value" style={{ color: 'var(--accent-blue)' }}>{inputs.rr.toFixed(1)} : 1</span>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
