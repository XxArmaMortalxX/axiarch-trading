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

      case 'profile':
        cacheKey = `profile:${symbol}`;
        ttl = 24 * 60 * 60 * 1000; // 24 hours
        url = `${BASE}/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`;
        break;

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
