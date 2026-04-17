import { createContext, useContext, useState, useCallback } from 'react';

const TradingModeContext = createContext(null);

const STORAGE_KEY = 'axiarch-trading-mode';

export function TradingModeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'dayTrade';
    } catch {
      return 'dayTrade';
    }
  });

  const setMode = useCallback((newMode) => {
    setModeState(newMode);
    try { localStorage.setItem(STORAGE_KEY, newMode); } catch {}
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dayTrade' ? 'growth' : 'dayTrade');
  }, [mode, setMode]);

  const isGrowthMode = mode === 'growth';
  const isDayTradeMode = mode === 'dayTrade';

  return (
    <TradingModeContext.Provider value={{ mode, setMode, toggleMode, isGrowthMode, isDayTradeMode }}>
      {children}
    </TradingModeContext.Provider>
  );
}

export function useTradingMode() {
  const ctx = useContext(TradingModeContext);
  if (!ctx) throw new Error('useTradingMode must be used within TradingModeProvider');
  return ctx;
}
