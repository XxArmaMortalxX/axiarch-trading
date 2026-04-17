import { createContext, useContext, useEffect, useRef } from 'react';
import { useFinnhub } from '../hooks/useFinnhub';
import { useWatchlist } from '../hooks/useWatchlist';
import { useTradingMode } from './TradingModeContext';

const FinnhubContext = createContext(null);

export function FinnhubProvider({ children }) {
  const finnhub = useFinnhub();
  const watchlist = useWatchlist();
  const { mode } = useTradingMode();
  const hasScanned = useRef(false);
  const lastMode = useRef(mode);

  // Auto-scan on app load
  useEffect(() => {
    if (!hasScanned.current) {
      hasScanned.current = true;
      finnhub.runFullScan(watchlist.fullWatchlist, mode);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-scan when mode changes
  useEffect(() => {
    if (hasScanned.current && lastMode.current !== mode) {
      lastMode.current = mode;
      finnhub.runFullScan(null, mode);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = { ...finnhub, ...watchlist };

  return (
    <FinnhubContext.Provider value={value}>
      {children}
    </FinnhubContext.Provider>
  );
}

export function useFinnhubContext() {
  const ctx = useContext(FinnhubContext);
  if (!ctx) throw new Error('useFinnhubContext must be used within FinnhubProvider');
  return ctx;
}
