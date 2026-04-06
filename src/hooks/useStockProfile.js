import { useState, useEffect } from 'react';

const PROXY = '/.netlify/functions/finnhub-proxy';
const profileCache = {};

export function useStockProfile(symbol) {
  const [profile, setProfile] = useState(profileCache[symbol] || null);
  const [loading, setLoading] = useState(!profileCache[symbol]);

  useEffect(() => {
    if (!symbol) return;
    if (profileCache[symbol]) { setProfile(profileCache[symbol]); setLoading(false); return; }

    setLoading(true);
    fetch(`${PROXY}?endpoint=profile&symbol=${symbol}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.name) {
          profileCache[symbol] = data;
          setProfile(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbol]);

  return { profile, loading };
}
