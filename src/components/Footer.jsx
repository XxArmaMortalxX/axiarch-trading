import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <div className="footer-brand">AXIARCH</div>
      <p style={{ margin: '0.6rem 0', fontSize: '0.8rem' }}>Algorithmic Trading Intelligence</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', margin: '1rem 0', flexWrap: 'wrap' }}>
        <Link to="/screener" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.75rem' }}>Screener</Link>
        <Link to="/calculator" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.75rem' }}>Calculator</Link>
        <Link to="/framework" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.75rem' }}>Framework</Link>
        <Link to="/methodology" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.75rem' }}>Methodology</Link>
        <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.75rem' }}>Dashboard</Link>
        <Link to="/pricing" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.75rem' }}>Pricing</Link>
      </div>
      <p className="disclaimer">The Axiarch Trading Algorithm is an independent research tool for educational purposes only. Not financial advice. Day trading involves substantial risk of loss.</p>
    </footer>
  );
}
