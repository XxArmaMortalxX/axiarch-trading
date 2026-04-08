import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose, required = false }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (trimmed && trimmed.includes('@')) {
      login(trimmed);
      setShowSuccess(true);
    }
  };

  if (showSuccess) {
    return (
      <div className="auth-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="auth-box" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>{'\u2705'}</div>
          <h3>You're in!</h3>
          <p style={{ marginBottom: 'var(--space-4)' }}>You'll receive daily picks in your inbox before the market opens.</p>

          <a
            href="https://t.me/axiarchtradebot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ width: '100%', display: 'block', textAlign: 'center', marginBottom: 'var(--space-3)' }}
          >
            Join Telegram for Live Alerts
          </a>

          <button onClick={onClose} className="btn-secondary" style={{ width: '100%' }}>
            Go to Screener
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-overlay" onClick={e => { if (!required && e.target === e.currentTarget) onClose(); }}>
      <div className="auth-box">
        <h3>{required ? 'Sign in to continue' : 'Sign In'}</h3>
        <p>{required
          ? 'Enter your email to access the live screener, watchlist, and trading signals. Free — no credit card required.'
          : 'Enter your email to save your watchlist, preferences, and access all features.'
        }</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoFocus
          />
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            {required ? 'Get Free Access' : 'Continue'}
          </button>
        </form>
        {!required && (
          <button
            onClick={onClose}
            className="btn-text-link"
            style={{ marginTop: '1rem' }}
          >
            Skip for now
          </button>
        )}
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          Free forever. No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
