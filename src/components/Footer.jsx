import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Footer() {
  const [subStatus, setSubStatus] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    if (!email) return;
    fetch('/.netlify/functions/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then(() => {
      e.target.reset();
      setSubStatus('Subscribed!');
    }).catch(() => setSubStatus('Error — try again'));
  };

  return (
    <footer>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', textAlign: 'left', marginBottom: '2rem' }}>
        {/* Brand */}
        <div>
          <div className="footer-brand">AXIARCH</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.4rem 0 1rem' }}>Algorithmic Trading Intelligence</p>
          <a
            href="https://t.me/axiarchtradebot"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', background: 'var(--accent-green)', color: '#000', fontWeight: 700, fontSize: '0.78rem', padding: '0.45rem 1rem', borderRadius: '6px', textDecoration: 'none' }}
          >
            Join Telegram
          </a>
        </div>

        {/* Links */}
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8rem' }}>Platform</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/screener" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.78rem' }}>Screener</Link>
            <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.78rem' }}>Dashboard</Link>
            <Link to="/performance" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.78rem' }}>Performance</Link>
            <Link to="/calculator" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.78rem' }}>Calculator</Link>
            <Link to="/framework" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.78rem' }}>Framework</Link>
            <Link to="/methodology" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.78rem' }}>Methodology</Link>
            <Link to="/pricing" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.78rem' }}>Pricing</Link>
          </div>
        </div>

        {/* Email Signup */}
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8rem' }}>Daily Picks Newsletter</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.7rem' }}>Get pre-market picks in your inbox every morning.</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              type="email"
              name="email"
              required
              placeholder="your@email.com"
              style={{
                flex: 1,
                padding: '0.5rem 0.7rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '5px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.78rem',
                outline: 'none',
                minWidth: 0,
              }}
            />
            <button type="submit" style={{ background: 'var(--accent-green)', color: '#000', fontWeight: 700, fontSize: '0.72rem', padding: '0.5rem 0.8rem', borderRadius: '5px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {subStatus || 'Subscribe'}
            </button>
          </form>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Free. No spam. Unsubscribe anytime.</p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', textAlign: 'center' }}>
        <p className="disclaimer">The Axiarch Trading Algorithm is an independent research tool for educational purposes only. Not financial advice. Day trading involves substantial risk of loss.</p>
      </div>
    </footer>
  );
}
