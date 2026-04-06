import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { useFinnhubContext } from '../context/FinnhubContext';
import AuthModal from './AuthModal';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const location = useLocation();
  const { isDark, toggle } = useTheme();
  const { user, isLoggedIn, logout } = useAuth();
  const { customTickers } = useFinnhubContext();

  const watchlistCount = customTickers?.length || 0;

  const links = [
    { to: '/', label: 'Home' },
    { to: '/screener', label: 'Screener' },
    { to: '/watchlist', label: watchlistCount > 0 ? `Watchlist (${watchlistCount})` : 'Watchlist' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/blog', label: 'Learn' },
  ];

  return (
    <>
    <nav>
      <Link to="/" className="nav-logo">Axiarch</Link>
      <div className={`nav-links${mobileOpen ? ' open' : ''}`}>
        {links.map(l => (
          <Link
            key={l.to}
            to={l.to}
            className={location.pathname === l.to ? 'active' : ''}
            onClick={() => setMobileOpen(false)}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isLoggedIn ? (
          <div style={{ position: 'relative' }}>
            <div className="user-avatar" onClick={logout} title={`${user.email} — click to logout`}>
              {user.initial}
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAuth(true)} className="nav-cta" style={{ background: 'none', cursor: 'pointer' }}>Sign In</button>
        )}
        <Link to="/pricing" className="nav-cta">Pricing</Link>
        <button
          onClick={toggle}
          title={isDark ? 'Light mode' : 'Dark mode'}
          style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '6px', padding: '0.3rem 0.5rem', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1 }}
        >
          {isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'}
        </button>
        <button
          id="mobileMenuBtn"
          onClick={() => setMobileOpen(o => !o)}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}
        >
          {mobileOpen ? '\u2715' : '\u2630'}
        </button>
      </div>
    </nav>
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
