import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose }) {
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
    <div className="auth-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="auth-box">
        <h3>Sign In</h3>
        <p>Enter your email to save your watchlist, preferences, and access Pro features.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoFocus
          />
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Continue</button>
        </form>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 'var(--text-sm)', cursor: 'pointer', marginTop: '1rem' }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
