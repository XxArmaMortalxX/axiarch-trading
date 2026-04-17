import { useState, useCallback, useRef } from 'react';
import { WATCHLIST, GROWTH_WATCHLIST } from '../lib/constants';
import { calcRSI, calcMACD, calcRelativeVolume, axiarchScore, generateSignal, determineBias } from '../lib/indicators';
import { growthScore, generateGrowthSignal, determineGrowthBias } from '../lib/growthIndicators';

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

// --- Growth mode data fetchers ---

async function proxyMetrics(symbol) {
  const resp = await fetch(`${PROXY}?endpoint=metrics&symbol=${symbol}`);
  if (!resp.ok) return null;
  return await resp.json();
}

async function proxyEarnings(symbol) {
  const resp = await fetch(`${PROXY}?endpoint=earnings&symbol=${symbol}`);
  if (!resp.ok) return null;
  const data = await resp.json();
  return Array.isArray(data) ? data : null;
}

async function proxyRecommendations(symbol) {
  const resp = await fetch(`${PROXY}?endpoint=recommendation&symbol=${symbol}`);
  if (!resp.ok) return null;
  const data = await resp.json();
  return Array.isArray(data) ? data : null;
}

function processQuotes(quotes, candleCache, socialMap) {
  return quotes.map(q => {
    const candles = candleCache[q.symbol] || null;
    const social = socialMap?.[q.symbol] || null;
    const sig = generateSignal(q, candles, social);
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
      mode: 'dayTrade',
      // Social data
      socialScore: social?.socialScore || 0,
      mentions: social?.mentions || 0,
      sentiment: social?.sentiment ?? null,
      sentimentLabel: social?.sentimentLabel || null,
      trendingRank: social?.trendingRank || null,
    };
  }).sort((a, b) => b.score - a.score);
}

function processGrowthQuotes(quotes, candleCache, fundamentalCache) {
  return quotes.map(q => {
    const candles = candleCache[q.symbol] || null;
    const fundData = fundamentalCache[q.symbol] || {};
    const sig = generateGrowthSignal(q, candles, fundData);
    const rsi = candles ? calcRSI(candles.c) : null;
    return {
      sym: q.symbol,
      price: q.c,
      change: +(q.dp || 0).toFixed(2),
      open: q.o,
      high: q.h,
      low: q.l,
      prevClose: q.pc,
      score: growthScore(q, candles, fundData),
      rsi,
      signal: sig.signal,
      reasoning: sig.reasoning,
      entry: sig.entry,
      target1y: sig.target1y,
      stopLoss: sig.stopLoss,
      bias: determineGrowthBias(q, candles, fundData),
      hasCandles: !!candles,
      hasFundamentals: !!(fundData.metrics || fundData.earnings),
      mode: 'growth',
      // Component scores for detail views
      components: sig.components,
      // Key fundamental metrics for display
      peRatio: fundData.metrics?.metric?.peTTM ?? null,
      psRatio: fundData.metrics?.metric?.psTTM ?? null,
      pegRatio: fundData.metrics?.metric?.pegRatio ?? null,
      revenueGrowth: fundData.metrics?.metric?.revenueGrowthQuarterlyYoy ?? null,
      epsGrowth: fundData.metrics?.metric?.epsGrowthQuarterlyYoy ?? null,
      grossMargin: fundData.metrics?.metric?.grossMarginTTM != null
        ? +(fundData.metrics.metric.grossMarginTTM * 100).toFixed(1) : null,
      earningsBeats: fundData.earnings
        ? fundData.earnings.filter(e => e.actual > e.estimate).length + '/' + fundData.earnings.length
        : null,
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
  const fundamentalCacheRef = useRef({});

  const runFullScan = useCallback(async (customTickerList, mode = 'dayTrade') => {
    const defaultList = mode === 'growth' ? GROWTH_WATCHLIST : WATCHLIST;
    const tickersToScan = customTickerList || defaultList;

    setIsScanning(true);
    setScanStatus('scanning');

    try {
      // Phase 0: Fetch social data in background (day trade mode only)
      let socialPromise = Promise.resolve();
      if (mode === 'dayTrade') {
        socialPromise = fetch('/.netlify/functions/social-data')
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.tickers) socialCacheRef.current = data.tickers;
          })
          .catch(() => {});
      }

      // Phase 1: Fetch quotes via proxy
      const results = [];
      const batchSize = 10;
      const delayMs = 1200;
      const totalPhases = mode === 'growth' ? 4 : 3;
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
        setScanMessage(`Phase 1/${totalPhases}: Quotes... ${Math.min(i + batchSize, tickersToScan.length)}/${tickersToScan.length} (${Math.min(pct, 100)}%)`);
        if (i + batchSize < tickersToScan.length) await new Promise(r => setTimeout(r, delayMs));
      }

      if (results.length === 0) throw new Error('No valid quotes returned');

      // Phase 2: Fetch candle data via proxy
      // Growth mode fetches 400 days for 200 EMA; day trade fetches 45 days
      const syms = results.map(q => q.symbol);
      const now = Math.floor(Date.now() / 1000);
      const candleDays = mode === 'growth' ? 400 : 45;
      const from = now - candleDays * 86400;
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
        setScanMessage(`Phase 2/${totalPhases}: Indicators... ${Math.min(i + candleBatchSize, syms.length)}/${syms.length} (${Math.min(pct, 100)}%)`);
        if (i + candleBatchSize < syms.length) await new Promise(r => setTimeout(r, candleDelay));
      }

      if (mode === 'growth') {
        // Phase 3 (Growth): Fetch fundamental data — metrics, earnings, recommendations
        const fundBatchSize = 3; // smaller batches, more endpoints per stock
        const fundDelay = 2000;
        for (let i = 0; i < syms.length; i += fundBatchSize) {
          const batch = syms.slice(i, i + fundBatchSize);
          const promises = batch.map(async (sym) => {
            try {
              const [metrics, earnings, recommendations] = await Promise.all([
                proxyMetrics(sym),
                proxyEarnings(sym),
                proxyRecommendations(sym),
              ]);
              fundamentalCacheRef.current[sym] = { metrics, earnings, recommendations };
            } catch { /* skip */ }
          });
          await Promise.all(promises);
          const pct = Math.round(((i + fundBatchSize) / syms.length) * 100);
          setScanMessage(`Phase 3/${totalPhases}: Fundamentals... ${Math.min(i + fundBatchSize, syms.length)}/${syms.length} (${Math.min(pct, 100)}%)`);
          if (i + fundBatchSize < syms.length) await new Promise(r => setTimeout(r, fundDelay));
        }

        // Phase 4 (Growth): Process
        setScanMessage(`Phase 4/${totalPhases}: Scoring growth stocks...`);
        const processed = processGrowthQuotes(results, candleCacheRef.current, fundamentalCacheRef.current);
        setData(processed);
        setDataSource('live');
        setScanStatus('live');
        const withTA = processed.filter(t => t.hasCandles).length;
        const withFund = processed.filter(t => t.hasFundamentals).length;
        setScanMessage(`LIVE · Growth Mode · ${processed.length} stocks · ${withTA} TA · ${withFund} fundamentals · ${new Date().toLocaleTimeString()}`);
      } else {
        // Phase 3 (Day Trade): Wait for social data to finish
        setScanMessage(`Phase 3/${totalPhases}: Social sentiment...`);
        await socialPromise;

        const processed = processQuotes(results, candleCacheRef.current, socialCacheRef.current);
        setData(processed);
        setDataSource('live');
        setScanStatus('live');
        const withTA = processed.filter(t => t.hasCandles).length;
        const withSocial = processed.filter(t => t.socialScore > 0).length;
        setScanMessage(`LIVE · Day Trade Mode · ${processed.length} stocks · ${withTA} TA · ${withSocial} social · ${new Date().toLocaleTimeString()}`);
      }
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
    fundamentalCache: fundamentalCacheRef.current,
  };
}
