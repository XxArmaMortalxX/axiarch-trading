import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggle } = useTheme();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/screener', label: 'Screener' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/calculator', label: 'Calculator' },
    { to: '/blog', label: 'Learn' },
  ];

  return (
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
        <a href="https://t.me/axiarchtradebot" target="_blank" rel="noopener noreferrer" className="nav-cta" style={{ background: 'var(--accent-green)', color: '#000', border: 'none' }}>Join Telegram</a>
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
  );
}
