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

      case 'candles':
        const fromTs = from || Math.floor(Date.now() / 1000) - 45 * 86400;
        const toTs = to || Math.floor(Date.now() / 1000);
        const res = resolution || 'D';
        cacheKey = `candles:${symbol}:${res}:${fromTs}`;
        ttl = 30 * 60 * 1000; // 30 minutes
        url = `${BASE}/stock/candle?symbol=${symbol}&resolution=${res}&from=${fromTs}&to=${toTs}&token=${FINNHUB_KEY}`;
        break;

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
    console.error('Finnhub proxy error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
