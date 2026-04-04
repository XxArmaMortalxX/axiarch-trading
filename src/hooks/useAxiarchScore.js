import { useMemo } from 'react';

export function useAxiarchScore(data) {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return { scanned: 0, picks: 0, buys: 0, sells: 0, holds: 0 };
    const buys = data.filter(t => t.signal.includes('BUY')).length;
    const sells = data.filter(t => t.signal.includes('SELL')).length;
    const holds = data.filter(t => t.signal === 'HOLD').length;
    const picks = data.filter(t => t.signal !== 'HOLD').length;
    return { scanned: data.length, picks, buys, sells, holds };
  }, [data]);

  return stats;
}
