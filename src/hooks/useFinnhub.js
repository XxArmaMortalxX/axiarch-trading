import { useState, useCallback, useRef } from 'react';
import { WATCHLIST, FALLBACK_DATA } from '../lib/constants';
import { calcRSI, calcMACD, calcRelativeVolume, axiarchScore, generateSignal, determineBias } from '../lib/indicators';

async function finnhubQuote(symbol, key) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return await resp.json();
}

async function finnhubCandles(symbol, resolution, from, to, key) {
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${key}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  if (data.s !== 'ok') return null;
  return { c: data.c, h: data.h, l: data.l, o: data.o, v: data.v, t: data.t };
}

function processQuotes(quotes, candleCache) {
  return quotes.map(q => {
    const candles = candleCache[q.symbol] || null;
    const sig = generateSignal(q, candles);
    const rsi = candles ? calcRSI(candles.c) : null;
    const rvol = candles ? calcRelativeVolume(candles.v) : null;
    const macd = candles ? calcMACD(candles.c) : null;
    return {
      sym: q.symbol,
      price: q.c,
      change: +(q.dp || 0).toFixed(2),
      open: q.o,
      high: q.h,
      low: q.l,
      prevClose: q.pc,
      score: axiarchScore(q, candles),
      rsi,
      rvol,
      macd,
      signal: sig.signal,
      entry: sig.entry,
      stop: sig.stop,
      target: sig.target,
      rr: sig.rr,
      bias: determineBias(q, candles),
      hasCandles: !!candles,
    };
  }).sort((a, b) => b.score - a.score);
}

export function useFinnhub() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [dataSource, setDataSource] = useState('demo');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('demo');
  const [scanMessage, setScanMessage] = useState('DEMO DATA — Enter Finnhub API key for live data');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('finnhub_key') || '');
  const candleCacheRef = useRef({});

  const saveKey = useCallback((key) => {
    setApiKey(key);
    if (key) localStorage.setItem('finnhub_key', key);
  }, []);

  const runFullScan = useCallback(async (key) => {
    const effectiveKey = key || apiKey;
    if (!effectiveKey) {
      setData(FALLBACK_DATA);
      setDataSource('demo');
      setScanStatus('demo');
      setScanMessage('DEMO DATA — Enter Finnhub API key for live data');
      return;
    }

    setIsScanning(true);
    setScanStatus('scanning');

    try {
      // Phase 1: Fetch quotes
      const results = [];
      const batchSize = 10;
      const delayMs = 1200;
      for (let i = 0; i < WATCHLIST.length; i += batchSize) {
        const batch = WATCHLIST.slice(i, i + batchSize);
        const promises = batch.map(async (sym) => {
          try {
            const quote = await finnhubQuote(sym, effectiveKey);
            if (quote && quote.c > 0) return { symbol: sym, ...quote };
            return null;
          } catch { return null; }
        });
        const batchResults = await Promise.all(promises);
        results.push(...batchResults.filter(Boolean));
        const pct = Math.round(((i + batchSize) / WATCHLIST.length) * 100);
        setScanMessage(`Phase 1/2: Quotes... ${Math.min(i + batchSize, WATCHLIST.length)}/${WATCHLIST.length} (${Math.min(pct, 100)}%)`);
        if (i + batchSize < WATCHLIST.length) await new Promise(r => setTimeout(r, delayMs));
      }

      if (results.length === 0) throw new Error('No valid quotes returned');

      // Phase 2: Fetch candle data
      const syms = results.map(q => q.symbol);
      const now = Math.floor(Date.now() / 1000);
      const from = now - 45 * 86400;
      const candleBatchSize = 5;
      const candleDelay = 1500;
      for (let i = 0; i < syms.length; i += candleBatchSize) {
        const batch = syms.slice(i, i + candleBatchSize);
        const promises = batch.map(async (sym) => {
          try {
            const candles = await finnhubCandles(sym, 'D', from, now, effectiveKey);
            if (candles) candleCacheRef.current[sym] = candles;
          } catch { /* skip */ }
        });
        await Promise.all(promises);
        const pct = Math.round(((i + candleBatchSize) / syms.length) * 100);
        setScanMessage(`Phase 2/2: Indicators... ${Math.min(i + candleBatchSize, syms.length)}/${syms.length} (${Math.min(pct, 100)}%)`);
        if (i + candleBatchSize < syms.length) await new Promise(r => setTimeout(r, candleDelay));
      }

      const processed = processQuotes(results, candleCacheRef.current);
      setData(processed);
      setDataSource('live');
      setScanStatus('live');
      const withTA = processed.filter(t => t.hasCandles).length;
      setScanMessage(`LIVE · ${processed.length} stocks · ${withTA} with TA · ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      console.error('Scan failed:', err);
      setData(prev => prev.length > 0 ? prev : FALLBACK_DATA);
      setDataSource('demo');
      setScanStatus('error');
      setScanMessage(`Scan failed: ${err.message}. Check API key.`);
    }

    setIsScanning(false);
  }, [apiKey]);

  return {
    data,
    dataSource,
    isScanning,
    scanStatus,
    scanMessage,
    apiKey,
    saveKey,
    runFullScan,
  };
}
