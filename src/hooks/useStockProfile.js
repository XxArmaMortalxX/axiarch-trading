import { useState, useEffect, useRef } from 'react';

const profileCache = {};

export function useStockProfile(symbol, apiKey) {
  const [profile, setProfile] = useState(profileCache[symbol] || null);
  const [loading, setLoading] = useState(!profileCache[symbol]);

  useEffect(() => {
    if (!symbol) return;
    if (profileCache[symbol]) { setProfile(profileCache[symbol]); setLoading(false); return; }
    if (!apiKey) { setLoading(false); return; }

    setLoading(true);
    fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.name) {
          profileCache[symbol] = data;
          setProfile(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbol, apiKey]);

  return { profile, loading };
}
