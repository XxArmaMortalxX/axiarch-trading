import { useTradingMode } from '../context/TradingModeContext';

export default function ModeToggle() {
  const { mode, setMode } = useTradingMode();

  return (
    <div className="mode-toggle" style={{
      display: 'inline-flex',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '0.15rem',
      gap: '0.15rem',
    }}>
      <button
        onClick={() => setMode('dayTrade')}
        style={{
          background: mode === 'dayTrade' ? 'var(--accent-green)' : 'transparent',
          color: mode === 'dayTrade' ? '#000' : 'var(--text-secondary)',
          border: 'none',
          padding: '0.3rem 0.6rem',
          borderRadius: 'var(--radius-xs)',
          fontSize: '0.7rem',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        Day Trade
      </button>
      <button
        onClick={() => setMode('growth')}
        style={{
          background: mode === 'growth' ? 'var(--accent-amber)' : 'transparent',
          color: mode === 'growth' ? '#000' : 'var(--text-secondary)',
          border: 'none',
          padding: '0.3rem 0.6rem',
          borderRadius: 'var(--radius-xs)',
          fontSize: '0.7rem',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        Growth
      </button>
    </div>
  );
}
