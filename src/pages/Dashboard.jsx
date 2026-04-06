import { useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useFinnhubContext } from '../context/FinnhubContext';
import { useAxiarchScore } from '../hooks/useAxiarchScore';
import SignalBadge from '../components/SignalBadge';
import { fmtPrice } from '../lib/indicators';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Dashboard() {
  const { data, dataSource, isScanning, scanStatus, scanMessage, runFullScan } = useFinnhubContext();
  const stats = useAxiarchScore(data);

  // Top signals
  const topSignals = [...data].filter(t => t.signal !== 'HOLD').sort((a, b) => b.score - a.score).slice(0, 7);
  if (topSignals.length === 0) topSignals.push(...[...data].sort((a, b) => b.score - a.score).slice(0, 7));

  // Active alerts
  const alerts = [...data].filter(t => t.signal !== 'HOLD' && Math.abs(t.change) > 3).sort((a, b) => b.score - a.score).slice(0, 6);

  // Signal distribution
  const total = data.length || 1;
  const bullPct = Math.round((stats.buys / total) * 100);
  const bearPct = Math.round((stats.sells / total) * 100);
  const neutPct = Math.max(0, 100 - bullPct - bearPct);

  const sentimentData = {
    labels: ['Buy Signals', 'Sell Signals', 'Hold'],
    datasets: [{ data: [bullPct, bearPct, neutPct], backgroundColor: ['#00c853', '#ef4444', '#1a2640'], borderWidth: 0, hoverOffset: 6 }],
  };

  const sentimentOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: { legend: { position: 'bottom', labels: { color: '#7a8ba8', font: { family: 'IBM Plex Mono', size: 10 }, padding: 14, usePointStyle: true, pointStyle: 'circle' } } },
  };

  // RSI distribution
  const rsiZones = ['<20', '20-30', '30-40', '40-50', '50-60', '60-70', '70-80', '>80'];
  const rsiCounts = [0, 0, 0, 0, 0, 0, 0, 0];
  data.forEach(t => {
    const r = t.rsi || 50;
    if (r < 20) rsiCounts[0]++;
    else if (r < 30) rsiCounts[1]++;
    else if (r < 40) rsiCounts[2]++;
    else if (r < 50) rsiCounts[3]++;
    else if (r < 60) rsiCounts[4]++;
    else if (r < 70) rsiCounts[5]++;
    else if (r < 80) rsiCounts[6]++;
    else rsiCounts[7]++;
  });

  const rsiData = {
    labels: rsiZones,
    datasets: [{ label: 'Stocks', data: rsiCounts, backgroundColor: ['#ef4444', '#f97316', '#00c853', '#0ea5e9', '#0ea5e9', '#f97316', '#ef4444', '#ef4444'], borderWidth: 0, borderRadius: 4 }],
  };

  const rsiOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { grid: { color: 'rgba(26,38,64,0.4)' }, ticks: { color: '#4a5b74', font: { family: 'IBM Plex Mono', size: 10 } } },
      y: { grid: { color: 'rgba(26,38,64,0.4)' }, ticks: { color: '#4a5b74', font: { family: 'IBM Plex Mono', size: 10 }, stepSize: 1 } },
    },
    plugins: { legend: { display: false } },
  };

  return (
    <div className="page-fullbg page-fullbg-dashboard">
    <section className="page-hero">
      <div className="section-label">Analysis</div>
      <h2 className="section-title">Signals Dashboard</h2>
      <p className="section-subtitle">Top-ranked signals, market-wide signal distribution, and RSI breakdown — all derived from indicator confluence.</p>
    </section>

    <section>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Stocks Scanned', value: stats.scanned + '+' },
          { label: 'Actionable Signals', value: stats.picks },
          { label: 'Buy Signals', value: stats.buys, color: 'var(--accent-green)' },
          { label: 'Sell Signals', value: stats.sells, color: 'var(--accent-red)' },
          { label: 'Data Source', value: dataSource === 'live' ? 'LIVE' : 'DEMO', color: dataSource === 'live' ? 'var(--accent-green)' : 'var(--accent-amber)' },
        ].map(s => (
          <div key={s.label} className="hero-stat">
            <div className="hero-stat-value" style={s.color ? { color: s.color } : {}}>{s.value}</div>
            <div className="hero-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="sentiment-grid" style={{ marginTop: '2rem' }}>
        {/* Top Signals */}
        <div className="sentiment-card">
          <h3><span className="live-dot" /> Top Signals</h3>
          <table className="radar-table">
            <thead>
              <tr><th>Ticker</th><th>RSI</th><th>Change</th><th>Signal</th><th>R:R</th></tr>
            </thead>
            <tbody>
              {topSignals.map(t => (
                <tr key={t.sym}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>{t.sym}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }} className={t.rsi === null ? '' : t.rsi < 30 ? 'rsi-oversold' : t.rsi > 70 ? 'rsi-overbought' : ''}>
                    {t.rsi !== null ? t.rsi.toFixed(1) : '\u2014'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    <span className={t.change >= 0 ? 'positive' : 'negative'}>{t.change >= 0 ? '+' : ''}{t.change}%</span>
                  </td>
                  <td><SignalBadge signal={t.signal} /></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{t.rr || '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signal Distribution */}
        <div className="sentiment-card">
          <h3><span className="live-dot" /> Signal Distribution</h3>
          <div style={{ maxHeight: '200px' }}>
            <Doughnut data={sentimentData} options={sentimentOptions} />
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div style={{ marginTop: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
          <span className="live-dot" /> Active Signals
        </h3>
        {alerts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No actionable signals detected yet.</div>
        ) : alerts.map(t => (
          <div key={t.sym} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>{t.sym}</span>
              <SignalBadge signal={t.signal} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700 }} className={t.change >= 0 ? 'positive' : 'negative'}>
                {t.change >= 0 ? '+' : ''}{t.change}%
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>RSI {t.rsi !== null ? t.rsi.toFixed(0) : '\u2014'}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Score {t.score}</span>
            </div>
          </div>
        ))}
      </div>

      {/* RSI Distribution */}
      <div style={{ marginTop: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
          RSI Distribution
        </h3>
        <div style={{ maxHeight: '200px' }}>
          <Bar data={rsiData} options={rsiOptions} />
        </div>
      </div>
    </section>
    </div>
  );
}
