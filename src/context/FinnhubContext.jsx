import { createContext, useContext, useEffect, useRef } from 'react';
import { useFinnhub } from '../hooks/useFinnhub';

const FinnhubContext = createContext(null);

export function FinnhubProvider({ children }) {
  const finnhub = useFinnhub();
  const hasScanned = useRef(false);

  // Auto-scan once on app load if API key exists
  useEffect(() => {
    if (finnhub.apiKey && !hasScanned.current) {
      hasScanned.current = true;
      finnhub.runFullScan(finnhub.apiKey);
    }
  }, [finnhub.apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FinnhubContext.Provider value={finnhub}>
      {children}
    </FinnhubContext.Provider>
  );
}

export function useFinnhubContext() {
  const ctx = useContext(FinnhubContext);
  if (!ctx) throw new Error('useFinnhubContext must be used within FinnhubProvider');
  return ctx;
}
