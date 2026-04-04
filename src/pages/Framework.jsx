import { useState } from 'react';
import { FRAMEWORK_STEPS } from '../lib/constants';

export default function Framework() {
  const [activeStep, setActiveStep] = useState(0);
  const s = FRAMEWORK_STEPS[activeStep];

  return (
    <section>
      <div className="section-label">Pattern</div>
      <h2 className="section-title">The 7-Stage Pennystocking Lifecycle</h2>
      <p className="section-subtitle">Every stock goes through a psychological lifecycle. Understand where a stock is in the cycle to time entries and exits with precision.</p>

      <div className="framework-steps">
        {FRAMEWORK_STEPS.map((step, i) => (
          <div
            key={i}
            className={`framework-step${i === activeStep ? ' active' : ''}`}
            onClick={() => setActiveStep(i)}
          >
            <div className="step-num">{step.num}</div>
            <div className="step-name">{step.name}</div>
          </div>
        ))}
      </div>

      <div className="framework-detail">
        <div className="step-tagline">{s.tag}</div>
        <h3>{s.name}</h3>
        <p>{s.desc}</p>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{s.details}</p>

        <div className="framework-indicators">
          <div className="fw-indicator">
            <div className="fw-indicator-label">Psychology</div>
            <div className="fw-indicator-value">{s.psych}</div>
          </div>
          <div className="fw-indicator">
            <div className="fw-indicator-label">Volume</div>
            <div className="fw-indicator-value">{s.vol}</div>
          </div>
          <div className="fw-indicator">
            <div className="fw-indicator-label">Action</div>
            <div className="fw-indicator-value" style={{ color: 'var(--accent-green)' }}>{s.action}</div>
          </div>
          <div className="fw-indicator">
            <div className="fw-indicator-label">Risk</div>
            <div className="fw-indicator-value" style={{ color: s.risk === 'Extreme' ? 'var(--accent-red)' : s.risk === 'High' ? 'var(--accent-amber)' : 'var(--text-primary)' }}>{s.risk}</div>
          </div>
        </div>

        {s.indicators && (
          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8rem' }}>Key Indicators</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {s.indicators.map((ind, i) => (
                <span key={i} className="pipeline-tag">{ind}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
