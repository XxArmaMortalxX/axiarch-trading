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
              <a href="https://t.me/axiarchtradebot" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'block', textAlign: 'center', width: '100%' }}>{plan.cta}</a>
            ) : plan.name === 'Free' ? (
              <Link to="/screener" className="btn-secondary" style={{ display: 'block', textAlign: 'center', width: '100%' }}>{plan.cta}</Link>
            ) : (
              <a href="https://t.me/axiarchtradebot" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'block', textAlign: 'center', width: '100%' }}>{plan.cta}</a>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
        <p>All plans include the complete technical analysis indicator suite (RSI, EMA, MACD, BB, ATR, VWAP).</p>
        <p style={{ marginTop: '0.3rem' }}>Cancel anytime. No contracts. 7-day free trial on Pro.</p>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: '700px', margin: '4rem auto 0' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>Frequently Asked Questions</h3>
        {[
          { q: 'Is the free plan really free?', a: 'Yes. The free plan includes demo data, basic indicators, and the risk calculator forever. No credit card required.' },
          { q: 'What is a Finnhub API key?', a: 'Finnhub is a free market data provider. You sign up at finnhub.io to get an API key, then paste it into Axiarch to unlock real-time stock data. It takes 30 seconds.' },
          { q: 'How are BUY/SELL signals generated?', a: 'Signals are generated from 6-point indicator confluence: RSI zone, EMA alignment, VWAP position, volume confirmation, MACD direction, and daily price change. A signal only fires when multiple indicators agree.' },
          { q: 'What stocks does Axiarch scan?', a: 'The default watchlist includes 65+ stocks across penny stocks, tech, crypto-adjacent, and high-volatility names. Pro and Institutional plans support custom watchlists.' },
          { q: 'How accurate are the signals?', a: 'Our tracked picks show a 67% win rate with +3.4% average return. Past performance does not guarantee future results. Always use proper risk management.' },
          { q: 'Can I cancel anytime?', a: 'Yes. All paid plans can be cancelled at any time with no contracts or cancellation fees.' },
        ].map((faq, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{faq.q}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.6 }}>{faq.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
