import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose, required = false }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (trimmed && trimmed.includes('@')) {
      login(trimmed);
      onClose();
    }
  };

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
