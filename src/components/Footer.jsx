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
      body: JSON.stringify({ email, source: 'footer' }),
    }).then(() => {
      e.target.reset();
      setSubStatus('Subscribed!');
    }).catch(() => setSubStatus('Error — try again'));
  };

  return (
    <footer>
      <div className="footer-grid">
        {/* Brand */}
        <div>
          <div className="footer-brand">AXIARCH</div>
          <p className="footer-body-text" style={{ margin: '0.4rem 0 1rem' }}>Algorithmic Trading Intelligence</p>
          <a href="https://t.me/axiarchtradebot" target="_blank" rel="noopener noreferrer" className="footer-cta">
            Join Telegram
          </a>
        </div>

        {/* Links */}
        <div>
          <p className="footer-section-heading">Platform</p>
          <div className="footer-link-list">
            <Link to="/screener" className="footer-link">Screener</Link>
            <Link to="/dashboard" className="footer-link">Dashboard</Link>
            <Link to="/performance" className="footer-link">Performance</Link>
            <Link to="/calculator" className="footer-link">Calculator</Link>
            <Link to="/framework" className="footer-link">Framework</Link>
            <Link to="/methodology" className="footer-link">Methodology</Link>
            <Link to="/pricing" className="footer-link">Pricing</Link>
          </div>
        </div>

        {/* Email Signup */}
        <div>
          <p className="footer-section-heading">Daily Picks Newsletter</p>
          <p className="footer-body-text" style={{ marginBottom: '0.7rem' }}>Get pre-market picks in your inbox every morning.</p>
          <form onSubmit={handleSubmit} className="footer-form">
            <input type="email" name="email" required placeholder="your@email.com" className="footer-input" />
            <button type="submit" className="footer-submit">
              {subStatus || 'Subscribe'}
            </button>
          </form>
          <p className="footer-fine-print">Free. No spam. Unsubscribe anytime.</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="disclaimer">The Axiarch Trading Algorithm is an independent research tool for educational purposes only. Not financial advice. Day trading involves substantial risk of loss.</p>
      </div>
    </footer>
  );
}
