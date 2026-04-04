import { Link } from 'react-router-dom';
import { PRICING_PLANS } from '../lib/constants';

export default function Pricing() {
  return (
    <section style={{ minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="section-label" style={{ justifyContent: 'center' }}>Plans</div>
        <h2 className="section-title">Choose Your Edge</h2>
        <p className="section-subtitle" style={{ margin: '0 auto' }}>
          From free demo scanning to full real-time institutional analysis. Every plan includes the complete TA indicator suite.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '960px', margin: '0 auto' }}>
        {PRICING_PLANS.map((plan, i) => (
          <div
            key={i}
            style={{
              background: plan.highlighted ? 'var(--bg-card-hover)' : 'var(--bg-card)',
              border: `1px solid ${plan.highlighted ? 'var(--accent-blue)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.25s',
            }}
          >
            {plan.highlighted && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))' }} />
            )}
            {plan.highlighted && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.8rem' }}>Most Popular</div>
            )}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.3rem' }}>{plan.name}</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: 800, color: plan.highlighted ? 'var(--accent-blue)' : 'var(--text-primary)' }}>{plan.price}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{plan.period}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>{plan.description}</p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {plan.features.map((f, j) => (
                <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1 }}>{'\u2713'}</span>
                  {f}
                </li>
              ))}
            </ul>

            {plan.name === 'Institutional' ? (
              <a href="mailto:hello@axiarch.dev" className="btn-secondary" style={{ display: 'block', textAlign: 'center', width: '100%' }}>{plan.cta}</a>
            ) : (
              <Link to="/screener" className={plan.highlighted ? 'btn-primary' : 'btn-secondary'} style={{ display: 'block', textAlign: 'center', width: '100%' }}>{plan.cta}</Link>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
        <p>All plans include the complete technical analysis indicator suite (RSI, EMA, MACD, BB, ATR, VWAP).</p>
        <p style={{ marginTop: '0.3rem' }}>Cancel anytime. No contracts. 7-day free trial on Pro.</p>
      </div>
    </section>
  );
}
