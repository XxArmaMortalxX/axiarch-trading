import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/screener', label: 'Screener' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/calculator', label: 'RCT Calc' },
    { to: '/framework', label: 'Framework' },
    { to: '/methodology', label: 'How It Works' },
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/pricing" className="nav-cta">Pricing</Link>
        <button
          id="mobileMenuBtn"
          onClick={() => setMobileOpen(o => !o)}
          style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}
        >
          {mobileOpen ? '\u2715' : '\u2630'}
        </button>
      </div>
    </nav>
  );
}
