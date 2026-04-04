const biasMap = { LONG: 'bias-long', SHORT: 'bias-short', NEUTRAL: 'bias-neutral' };

export default function BiasTag({ bias }) {
  return <span className={`bias-badge ${biasMap[bias] || 'bias-neutral'}`}>{bias}</span>;
}
