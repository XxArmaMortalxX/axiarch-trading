export default function ScoreBar({ score }) {
  const color = score >= 75 ? 'var(--accent-green)' : score >= 55 ? 'var(--accent-amber)' : 'var(--accent-red)';
  return (
    <div className="score-bar">
      <div className="score-bar-fill" style={{ width: `${score}%`, background: color }} />
      <span className="score-bar-value" style={{ color }}>{score}</span>
    </div>
  );
}
