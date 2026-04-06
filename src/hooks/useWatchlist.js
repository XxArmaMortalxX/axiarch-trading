import { useState, useCallback } from 'react';
import { WATCHLIST } from '../lib/constants';

const STORAGE_KEY = 'axiarch_custom_watchlist';

export function useWatchlist() {
  const [customTickers, setCustomTickers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const addTicker = useCallback((ticker) => {
    const t = ticker.toUpperCase().trim();
    if (!t) return;
    setCustomTickers(prev => {
      if (prev.includes(t)) return prev;
      const next = [...prev, t];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeTicker = useCallback((ticker) => {
    setCustomTickers(prev => {
      const next = prev.filter(t => t !== ticker);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCustom = useCallback(() => {
    setCustomTickers([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Merge: default watchlist + custom tickers (deduplicated)
  const fullWatchlist = [...new Set([...WATCHLIST, ...customTickers])];

  return { customTickers, fullWatchlist, addTicker, removeTicker, clearCustom };
}
