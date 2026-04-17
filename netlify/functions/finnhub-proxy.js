const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const BASE = 'https://finnhub.io/api/v1';

// Simple in-memory cache
const cache = {};

function getCached(key, ttlMs) {
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < ttlMs) return entry.data;
  return null;
}

function setCache(key, data) {
  cache[key] = { data, ts: Date.now() };
}

// Yahoo Finance candle fetcher (free, no API key needed)
async function fetchYahooCandles(symbol, fromTs, toTs) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${fromTs}&period2=${toTs}&interval=1d`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!resp.ok) return null;
  const json = await resp.json();
  const result = json?.chart?.result?.[0];
  if (!result) return null;

  const timestamps = result.timestamp;
  const quotes = result.indicators?.quote?.[0];
  if (!timestamps || !quotes) return null;

  // Convert to Finnhub candle format
  return {
    s: 'ok',
    c: quotes.close.filter(v => v !== null),
    h: quotes.high.filter(v => v !== null),
    l: quotes.low.filter(v => v !== null),
    o: quotes.open.filter(v => v !== null),
    v: quotes.volume.filter(v => v !== null),
    t: timestamps.filter((_, i) => quotes.close[i] !== null),
  };
}

// Yahoo Finance intraday fetcher (5-min candles, 1 day)
async function fetchYahooIntraday(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=1d`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!resp.ok) return null;
  const json = await resp.json();
  const result = json?.chart?.result?.[0];
  if (!result) return null;

  const timestamps = result.timestamp;
  const quotes = result.indicators?.quote?.[0];
  if (!timestamps || !quotes) return null;

  return {
    s: 'ok',
    c: timestamps.map((_, i) => quotes.close[i]).filter(v => v !== null),
    h: timestamps.map((_, i) => quotes.high[i]).filter(v => v !== null),
    l: timestamps.map((_, i) => quotes.low[i]).filter(v => v !== null),
    o: timestamps.map((_, i) => quotes.open[i]).filter(v => v !== null),
    v: timestamps.map((_, i) => quotes.volume[i]).filter(v => v !== null),
    t: timestamps.filter((_, i) => quotes.close[i] !== null),
    intraday: true,
  };
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (!FINNHUB_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'FINNHUB_API_KEY not configured' }) };
  }

  const params = event.queryStringParameters || {};
  const { endpoint, symbol, from, to, resolution } = params;

  if (!endpoint) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'endpoint parameter required (quote, candles, profile)' }) };
  }

  if (!symbol && endpoint !== 'batch') {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'symbol parameter required' }) };
  }

  try {
    let url, cacheKey, ttl;

    switch (endpoint) {
      case 'quote':
        cacheKey = `quote:${symbol}`;
        ttl = 2 * 60 * 1000; // 2 minutes
        url = `${BASE}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`;
        break;

      case 'candles': {
        const fromTs = from || Math.floor(Date.now() / 1000) - 45 * 86400;
        const toTs = to || Math.floor(Date.now() / 1000);
        cacheKey = `candles:${symbol}:${fromTs}`;
        ttl = 30 * 60 * 1000; // 30 minutes

        // Check cache first
        const cached = getCached(cacheKey, ttl);
        if (cached) {
          return { statusCode: 200, headers, body: JSON.stringify(cached) };
        }

        // Try Finnhub first
        const fhUrl = `${BASE}/stock/candle?symbol=${symbol}&resolution=D&from=${fromTs}&to=${toTs}&token=${FINNHUB_KEY}`;
        const fhResp = await fetch(fhUrl);

        if (fhResp.ok) {
          const fhData = await fhResp.json();
          if (fhData.s === 'ok') {
            setCache(cacheKey, fhData);
            return { statusCode: 200, headers, body: JSON.stringify(fhData) };
          }
        }

        // Fallback to Yahoo Finance (free, no key needed)
        const yahooData = await fetchYahooCandles(symbol, fromTs, toTs);
        if (yahooData && yahooData.c.length > 0) {
          setCache(cacheKey, yahooData);
          return { statusCode: 200, headers, body: JSON.stringify(yahooData) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({ s: 'no_data' }) };
      }

      case 'intraday': {
        cacheKey = `intraday:${symbol}`;
        ttl = 2 * 60 * 1000; // 2 minutes

        const intradayCached = getCached(cacheKey, ttl);
        if (intradayCached) {
          return { statusCode: 200, headers, body: JSON.stringify(intradayCached) };
        }

        const intradayData = await fetchYahooIntraday(symbol);
        if (intradayData && intradayData.c.length > 0) {
          setCache(cacheKey, intradayData);
          return { statusCode: 200, headers, body: JSON.stringify(intradayData) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({ s: 'no_data' }) };
      }

      case 'profile':
        cacheKey = `profile:${symbol}`;
        ttl = 24 * 60 * 60 * 1000; // 24 hours
        url = `${BASE}/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`;
        break;

      // === Growth Mode Endpoints ===

      case 'metrics':
        cacheKey = `metrics:${symbol}`;
        ttl = 6 * 60 * 60 * 1000; // 6 hours
        url = `${BASE}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_KEY}`;
        break;

      case 'earnings': {
        cacheKey = `earnings:${symbol}`;
        ttl = 12 * 60 * 60 * 1000; // 12 hours
        url = `${BASE}/stock/earnings?symbol=${symbol}&limit=8&token=${FINNHUB_KEY}`;
        break;
      }

      case 'financials': {
        const freq = params.freq || 'quarterly';
        cacheKey = `financials:${symbol}:${freq}`;
        ttl = 12 * 60 * 60 * 1000; // 12 hours
        url = `${BASE}/stock/financials-reported?symbol=${symbol}&freq=${freq}&token=${FINNHUB_KEY}`;
        break;
      }

      case 'recommendation':
        cacheKey = `rec:${symbol}`;
        ttl = 24 * 60 * 60 * 1000; // 24 hours
        url = `${BASE}/stock/recommendation?symbol=${symbol}&token=${FINNHUB_KEY}`;
        break;

      case 'peers':
        cacheKey = `peers:${symbol}`;
        ttl = 24 * 60 * 60 * 1000; // 24 hours
        url = `${BASE}/stock/peers?symbol=${symbol}&token=${FINNHUB_KEY}`;
        break;

      case 'earnings-calendar': {
        const ecFrom = params.from || new Date().toISOString().slice(0, 10);
        const ecTo = params.to || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
        cacheKey = `ecal:${symbol}:${ecFrom}`;
        ttl = 6 * 60 * 60 * 1000; // 6 hours
        url = `${BASE}/calendar/earnings?symbol=${symbol}&from=${ecFrom}&to=${ecTo}&token=${FINNHUB_KEY}`;
        break;
      }

      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }) };
    }

    // Check cache
    const cached = getCached(cacheKey, ttl);
    if (cached) {
      return { statusCode: 200, headers, body: JSON.stringify(cached) };
    }

    // Fetch from Finnhub
    const resp = await fetch(url);
    if (!resp.ok) {
      return { statusCode: resp.status, headers, body: JSON.stringify({ error: `Finnhub returned ${resp.status}` }) };
    }

    const data = await resp.json();
    setCache(cacheKey, data);

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    console.error('Proxy error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
