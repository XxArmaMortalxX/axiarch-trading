import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BENEFITS = [
  { icon: '\u{1F4C8}', text: 'Real-time scanning of 65+ stocks with 6 technical indicators' },
  { icon: '\u{1F3AF}', text: 'BUY/SELL signals with exact entry, stop-loss, and profit targets' },
  { icon: '\u26A1', text: 'Scans complete in under 2 seconds — faster than any manual workflow' },
  { icon: '\u{1F6E1}\uFE0F', text: 'ATR-based risk management with built-in 3:1 reward ratios' },
  { icon: '\u{1F4CA}', text: 'Multi-factor scoring: technical, momentum, volatility, and volume' },
  { icon: '\u{1F4F1}', text: 'Works on any device — desktop, tablet, or phone' },
];

const STATS = [
  { value: '+17.78%', label: 'GEVO in 4 Days' },
  { value: '67%', label: 'Win Rate' },
  { value: '11', label: 'Verified Picks' },
];

export default function Go() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email || '' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Unable to connect. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="page-fullbg">
      {/* Hero */}
      <section className="section-centered" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
        <div className="section-label" style={{ justifyContent: 'center' }}>Limited Time Offer</div>
        <h1 className="section-title hero-headline">
          Stop Losing Money on <span style={{ color: 'var(--accent-green)' }}>Bad Trades.</span>
        </h1>
        <p className="section-subtitle" style={{ maxWidth: '600px', margin: '1rem auto 2rem' }}>
          Axiarch scans 65+ stocks in real-time, tells you exactly when to buy, where to set your stop-loss, and where to take profit. Start your 7-day free trial today.
        </p>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="btn-primary btn-lg"
          style={{ minWidth: '280px' }}
        >
          {loading ? 'Redirecting to checkout...' : 'Start Free 7-Day Trial — $29/mo after'}
        </button>
        {error && <p className="signup-error" style={{ marginTop: '1rem' }}>{error}</p>}

        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          Cancel anytime. No commitment. No risk.
        </p>
      </section>

      {/* Social proof stats */}
      <section className="section-centered" style={{ paddingTop: '0' }}>
        <div className="social-proof-row">
          {STATS.map(s => (
            <div className="hero-stat" key={s.label} style={{ borderColor: 'var(--accent-green)' }}>
              <div className="hero-stat-value">{s.value}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section>
        <div className="section-label">What You Get</div>
        <h2 className="section-title">Your Unfair Advantage</h2>

        <div className="features-grid" style={{ marginTop: '1.5rem' }}>
          {BENEFITS.map((b, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon" style={{ background: 'var(--accent-green-dim)' }}>{b.icon}</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Real results */}
      <section className="section-centered">
        <div className="section-label" style={{ justifyContent: 'center' }}>Real Results</div>
        <h2 className="section-title">Built by a Trader, for Traders</h2>
        <p className="section-subtitle" style={{ margin: '0.5rem auto 2rem' }}>
          Every pick is tracked from the moment it's flagged. No cherry-picking. No hindsight bias.
        </p>

        <div className="testimonials-grid" style={{ marginTop: '0' }}>
          <div className="testimonial-card">
            <p className="testimonial-quote">"Axiarch flagged GEVO before it ran +17.78% in 4 days. Entered at $2.42, rode it to $2.84. The confluence signal was dead on."</p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">F</div>
              <div>
                <div className="testimonial-name">Founder</div>
                <div className="testimonial-detail">Axiarch Trading, April 2026</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <p className="testimonial-quote">"I used to spend 2 hours on pre-market research. Now I check the screener in 30 seconds and know exactly where to look."</p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">S</div>
              <div>
                <div className="testimonial-name">Swing Trader</div>
                <div className="testimonial-detail">Pro subscriber</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <p className="testimonial-quote">"The ATR-based targets changed how I manage risk. Every trade has a plan before I enter."</p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">O</div>
              <div>
                <div className="testimonial-name">Options Trader</div>
                <div className="testimonial-detail">Telegram member</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-8)' }}>
          <Link to="/performance" className="btn-secondary btn-sm">View All Verified Picks &rarr;</Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-centered" style={{ paddingBottom: '5rem' }}>
        <h2 className="section-title">Ready to Trade Smarter?</h2>
        <p className="section-subtitle" style={{ margin: '0.5rem auto 2rem', maxWidth: '500px' }}>
          Join hundreds of traders using Axiarch to find high-probability setups every day. Your first 7 days are free.
        </p>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="btn-primary btn-lg"
          style={{ minWidth: '280px' }}
        >
          {loading ? 'Redirecting...' : 'Start Your Free Trial Now'}
        </button>

        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          $29/mo after trial. Cancel anytime. No contracts.
        </p>

        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-8)', maxWidth: '500px', margin: 'var(--space-8) auto 0', lineHeight: 'var(--leading-relaxed)' }}>
          The Axiarch Trading Algorithm is an independent research tool for educational purposes only. Not financial advice. Day trading involves substantial risk of loss. Past performance does not guarantee future results.
        </p>
      </section>
    </div>
  );
}
