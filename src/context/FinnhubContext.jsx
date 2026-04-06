import { createContext, useContext, useEffect, useRef } from 'react';
import { useFinnhub } from '../hooks/useFinnhub';
import { useWatchlist } from '../hooks/useWatchlist';

const FinnhubContext = createContext(null);

export function FinnhubProvider({ children }) {
  const finnhub = useFinnhub();
  const watchlist = useWatchlist();
  const hasScanned = useRef(false);

  // Auto-scan once on app load if API key exists
  useEffect(() => {
    if (finnhub.apiKey && !hasScanned.current) {
      hasScanned.current = true;
      finnhub.runFullScan(finnhub.apiKey, watchlist.fullWatchlist);
    }
  }, [finnhub.apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
