import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const location = useLocation();
  const { isDark, toggle } = useTheme();
  const { user, isLoggedIn, logout } = useAuth();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/screener', label: 'Screener' },
    { to: '/watchlist', label: 'Watchlist' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/blog', label: 'Learn' },
    { to: '/performance', label: 'Performance' },
    { to: '/community', label: 'Community' },
  ];

  return (
    <>
    <nav>
      <Link to="/" className="nav-logo">
        <img src="/logo.png" alt="Axiarch" className="nav-logo-img" />
        <span className="nav-beta-tag">Beta</span>
      </Link>
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
      <div className="nav-actions">
        {isLoggedIn ? (
          <div className="user-avatar" onClick={logout} title={`${user.email} — click to logout`}>
            {user.initial}
          </div>
        ) : (
          <button onClick={() => setShowAuth(true)} className="nav-cta">Sign In</button>
        )}
        <Link to="/pricing" className="nav-cta">Pricing</Link>
        <button onClick={toggle} title={isDark ? 'Light mode' : 'Dark mode'} className="nav-icon-btn">
          {isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'}
        </button>
        <button id="mobileMenuBtn" onClick={() => setMobileOpen(o => !o)} className="nav-icon-btn nav-icon-btn--borderless">
          {mobileOpen ? '\u2715' : '\u2630'}
        </button>
      </div>
    </nav>
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
