import { useState, useCallback, useRef } from 'react';
import { WATCHLIST } from '../lib/constants';
import { calcRSI, calcMACD, calcRelativeVolume, axiarchScore, generateSignal, determineBias } from '../lib/indicators';

const PROXY = '/.netlify/functions/finnhub-proxy';

async function proxyQuote(symbol) {
  const resp = await fetch(`${PROXY}?endpoint=quote&symbol=${symbol}`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return await resp.json();
}

async function proxyCandles(symbol, from, to) {
  const resp = await fetch(`${PROXY}?endpoint=candles&symbol=${symbol}&from=${from}&to=${to}`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  if (data.s !== 'ok') return null;
  return { c: data.c, h: data.h, l: data.l, o: data.o, v: data.v, t: data.t };
}

function processQuotes(quotes, candleCache, socialMap) {
  return quotes.map(q => {
    const candles = candleCache[q.symbol] || null;
    const social = socialMap?.[q.symbol] || null;
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
      score: axiarchScore(q, candles, social),
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
      // Social data
      socialScore: social?.socialScore || 0,
      mentions: social?.mentions || 0,
      sentiment: social?.sentiment ?? null,
      sentimentLabel: social?.sentimentLabel || null,
      trendingRank: social?.trendingRank || null,
    };
  }).sort((a, b) => b.score - a.score);
}

export function useFinnhub() {
  const [data, setData] = useState([]);
  const [dataSource, setDataSource] = useState('loading');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('loading');
  const [scanMessage, setScanMessage] = useState('Loading market data...');
  const candleCacheRef = useRef({});
  const socialCacheRef = useRef({});

  const runFullScan = useCallback(async (customTickerList) => {
    const tickersToScan = customTickerList || WATCHLIST;

    setIsScanning(true);
    setScanStatus('scanning');

    try {
      // Phase 0: Fetch social data in background (non-blocking)
      const socialPromise = fetch('/.netlify/functions/social-data')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.tickers) socialCacheRef.current = data.tickers;
        })
        .catch(() => {});

      // Phase 1: Fetch quotes via proxy
      const results = [];
      const batchSize = 10;
      const delayMs = 1200;
      for (let i = 0; i < tickersToScan.length; i += batchSize) {
        const batch = tickersToScan.slice(i, i + batchSize);
        const promises = batch.map(async (sym) => {
          try {
            const quote = await proxyQuote(sym);
            if (quote && quote.c > 0) return { symbol: sym, ...quote };
            return null;
          } catch { return null; }
        });
        const batchResults = await Promise.all(promises);
        results.push(...batchResults.filter(Boolean));
        const pct = Math.round(((i + batchSize) / tickersToScan.length) * 100);
        setScanMessage(`Phase 1/3: Quotes... ${Math.min(i + batchSize, tickersToScan.length)}/${tickersToScan.length} (${Math.min(pct, 100)}%)`);
        if (i + batchSize < tickersToScan.length) await new Promise(r => setTimeout(r, delayMs));
      }

      if (results.length === 0) throw new Error('No valid quotes returned');

      // Phase 2: Fetch candle data via proxy
      const syms = results.map(q => q.symbol);
      const now = Math.floor(Date.now() / 1000);
      const from = now - 45 * 86400;
      const candleBatchSize = 5;
      const candleDelay = 1500;
      for (let i = 0; i < syms.length; i += candleBatchSize) {
        const batch = syms.slice(i, i + candleBatchSize);
        const promises = batch.map(async (sym) => {
          try {
            const candles = await proxyCandles(sym, from, now);
            if (candles) candleCacheRef.current[sym] = candles;
          } catch { /* skip */ }
        });
        await Promise.all(promises);
        const pct = Math.round(((i + candleBatchSize) / syms.length) * 100);
        setScanMessage(`Phase 2/3: Indicators... ${Math.min(i + candleBatchSize, syms.length)}/${syms.length} (${Math.min(pct, 100)}%)`);
        if (i + candleBatchSize < syms.length) await new Promise(r => setTimeout(r, candleDelay));
      }

      // Phase 3: Wait for social data to finish
      setScanMessage('Phase 3/3: Social sentiment...');
      await socialPromise;

      const processed = processQuotes(results, candleCacheRef.current, socialCacheRef.current);
      setData(processed);
      setDataSource('live');
      setScanStatus('live');
      const withTA = processed.filter(t => t.hasCandles).length;
      const withSocial = processed.filter(t => t.socialScore > 0).length;
      setScanMessage(`LIVE · ${processed.length} stocks · ${withTA} TA · ${withSocial} social · ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      console.error('Scan failed:', err);
      setDataSource('error');
      setScanStatus('error');
      setScanMessage(`Scan failed: ${err.message}`);
    }

    setIsScanning(false);
  }, []);

  return {
    data,
    dataSource,
    isScanning,
    scanStatus,
    scanMessage,
    runFullScan,
    candleCache: candleCacheRef.current,
  };
}
