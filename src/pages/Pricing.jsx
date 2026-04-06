import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PRICING_PLANS } from '../lib/constants';

export default function Pricing() {
  const [searchParams] = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [subStatus, setSubStatus] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check subscription status if returning from checkout
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const status = searchParams.get('status');

    if (status === 'success' && sessionId) {
      setShowSuccess(true);
      // Verify subscription with backend
      fetch(`/.netlify/functions/check-subscription?session_id=${sessionId}`)
        .then(r => r.json())
        .then(data => {
          if (data.status === 'active' || data.status === 'trialing') {
            setSubStatus(data);
            localStorage.setItem('axiarch_sub', JSON.stringify(data));
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create checkout session');
        setCheckoutLoading(false);
      }
    } catch (err) {
      alert('Failed to connect to payment system. Please try again.');
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    const sub = JSON.parse(localStorage.getItem('axiarch_sub') || '{}');
    if (!sub.customerId) return;
    try {
      const res = await fetch('/.netlify/functions/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: sub.customerId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { /* ignore */ }
  };

  const activeSub = subStatus || JSON.parse(localStorage.getItem('axiarch_sub') || 'null');
  const isPro = activeSub && (activeSub.status === 'active' || activeSub.status === 'trialing');

  return (
    <section style={{ minHeight: '80vh' }}>
      {/* Success banner */}
      {showSuccess && (
        <div style={{ background: 'var(--accent-green-dim)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-green)', marginBottom: '0.3rem' }}>Welcome to Axiarch Pro!</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your 7-day free trial has started. You now have full access to live data and all Pro features.</div>
        </div>
      )}

      {/* Active subscription banner */}
      {isPro && !showSuccess && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-green)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Axiarch Pro — <span style={{ color: 'var(--accent-green)' }}>{activeSub.status === 'trialing' ? 'Trial Active' : 'Active'}</span></div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{activeSub.customerEmail}</div>
          </div>
          <button onClick={handleManageSubscription} className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem 1rem' }}>Manage Subscription</button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="section-label" style={{ justifyContent: 'center' }}>Plans</div>
        <h2 className="section-title">Choose Your Edge</h2>
        <p className="section-subtitle" style={{ margin: '0 auto' }}>
          Start free with demo data. Upgrade to Pro for live market scanning with a 7-day free trial.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', maxWidth: '720px', margin: '0 auto' }}>
        {PRICING_PLANS.filter(p => p.name !== 'Institutional').map((plan, i) => (
          <div
            key={i}
            style={{
              background: plan.highlighted ? 'var(--bg-card-hover)' : 'var(--bg-card)',
              border: `1px solid ${plan.highlighted ? 'var(--accent-green)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {plan.highlighted && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--accent-green), var(--accent-cyan))' }} />
            )}
            {plan.highlighted && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.8rem' }}>
                {isPro ? 'Your Plan' : '7-Day Free Trial'}
              </div>
            )}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.3rem' }}>{plan.name}</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: 800, color: plan.highlighted ? 'var(--accent-green)' : 'var(--text-primary)' }}>{plan.price}</span>
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

            {plan.name === 'Free' ? (
              <Link to="/screener" className="btn-secondary" style={{ display: 'block', textAlign: 'center', width: '100%' }}>{plan.cta}</Link>
            ) : isPro ? (
              <button onClick={handleManageSubscription} className="btn-primary" style={{ display: 'block', textAlign: 'center', width: '100%', opacity: 0.8 }}>Manage Subscription</button>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="btn-primary"
                style={{ display: 'block', textAlign: 'center', width: '100%' }}
              >
                {checkoutLoading ? 'Redirecting to checkout...' : 'Start 7-Day Free Trial'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
        <p>7-day free trial on Pro. Cancel anytime. No contracts.</p>
        <p style={{ marginTop: '0.3rem' }}>Need a custom plan for your team? <a href="https://t.me/axiarchtradebot" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-green)', textDecoration: 'none' }}>Contact us on Telegram</a></p>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: '700px', margin: '4rem auto 0' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>Frequently Asked Questions</h3>
        {[
          { q: 'Is the free plan really free?', a: 'Yes. The free plan includes demo data, basic indicators, and the risk calculator forever. No credit card required.' },
          { q: 'How does the 7-day trial work?', a: 'Start your Pro trial instantly. You get full access to all Pro features for 7 days. Cancel anytime during the trial and you won\'t be charged.' },
          { q: 'What is a Finnhub API key?', a: 'Finnhub is a free market data provider. You sign up at finnhub.io to get an API key, then paste it into Axiarch to unlock real-time stock data. It takes 30 seconds.' },
          { q: 'How are BUY/SELL signals generated?', a: 'Signals are generated from 6-point indicator confluence: RSI zone, EMA alignment, VWAP position, volume confirmation, MACD direction, and daily price change. A signal only fires when multiple indicators agree.' },
          { q: 'How accurate are the signals?', a: 'Our tracked picks show a 67% win rate with +3.4% average return. Past performance does not guarantee future results. Always use proper risk management.' },
          { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your account dashboard at any time. No contracts, no cancellation fees. You keep access until the end of your billing period.' },
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
