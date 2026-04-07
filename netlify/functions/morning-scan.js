const { getStore } = require('@netlify/blobs');

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE = 'https://finnhub.io/api/v1';

// Same watchlist as the frontend
const WATCHLIST = [
  'FFIE','MULN','NKLA','ATER','CLOV','WKHS','LCID','NIO','RIVN',
  'SOFI','PLTR','AMC','GME','MARA','RIOT','SNDL','TLRY','PLUG',
  'FCEL','QS','GOEV','DNA','IONQ','RGTI','QUBT','SMCI','KULR',
  'GSAT','OPEN','RDFN','WISH','BYND','SPCE','LAZR','VUZI',
  'AFRM','UPST','HOOD','DKNG','PENN','RKLB','LUNR','APLD',
  'CLSK','CORZ','SOUN','BKKT','ASTS','TSLA','NVDA','AAPL',
  'MSFT','META','GOOGL','AMD','INTC','MU','SNAP','COIN',
  'SQ','PYPL','ROKU','ABNB','UBER','DASH','NET','CRWD',
];

// ── Technical indicator helpers (mirrors frontend logic) ──

function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcEMA(data, period) {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcRelativeVolume(volumes) {
  if (!volumes || volumes.length < 11) return null;
  const recent = volumes.slice(-1)[0];
  const avg = volumes.slice(-11, -1).reduce((a, b) => a + b, 0) / 10;
  return avg > 0 ? recent / avg : null;
}

function axiarchScore(quote, candles) {
  if (!candles || !candles.c || candles.c.length < 21) return 0;

  const closes = candles.c;
  const rsi = calcRSI(closes);
  const ema9 = calcEMA(closes, 9);
  const ema21 = calcEMA(closes, 21);
  const rvol = calcRelativeVolume(candles.v);
  const price = quote.c;
  const change = quote.dp || 0;

  let score = 0;

  // Technical (40%)
  if (rsi !== null) {
    if (rsi >= 30 && rsi <= 70) score += 15;
    else if (rsi < 30) score += 20; // oversold = opportunity
    else score += 5;
  }
  if (ema9 && ema21 && ema9 > ema21) score += 20; // bullish crossover

  // Momentum (25%)
  if (change > 5) score += 25;
  else if (change > 2) score += 18;
  else if (change > 0) score += 10;

  // Volume (20%)
  if (rvol && rvol > 3) score += 20;
  else if (rvol && rvol > 1.5) score += 12;
  else if (rvol && rvol > 1) score += 6;

  // Volatility (15%) — ATR-based
  if (candles.h && candles.l && candles.h.length >= 14) {
    const atrValues = [];
    for (let i = candles.h.length - 14; i < candles.h.length; i++) {
      atrValues.push(candles.h[i] - candles.l[i]);
    }
    const atr = atrValues.reduce((a, b) => a + b, 0) / 14;
    const atrPct = price > 0 ? (atr / price) * 100 : 0;
    if (atrPct > 5) score += 15;
    else if (atrPct > 3) score += 10;
    else if (atrPct > 1) score += 5;
  }

  return Math.min(score, 100);
}

// ── Yahoo Finance candle fetcher (free, no key needed) ──

async function fetchYahooCandles(symbol) {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 45 * 86400;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${from}&period2=${to}&interval=1d`;
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!resp.ok) return null;
    const json = await resp.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;
    const timestamps = result.timestamp;
    const quotes = result.indicators?.quote?.[0];
    if (!timestamps || !quotes) return null;
    return {
      c: quotes.close.filter(v => v !== null),
      h: quotes.high.filter(v => v !== null),
      l: quotes.low.filter(v => v !== null),
      o: quotes.open.filter(v => v !== null),
      v: quotes.volume.filter(v => v !== null),
    };
  } catch { return null; }
}

// ── Finnhub quote fetch ──

async function fetchQuote(symbol) {
  const url = `${FINNHUB_BASE}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data.c || data.c === 0) return null;
    return data;
  } catch { return null; }
}

// ── Main handler ──

exports.handler = async (event) => {
  if (!FINNHUB_KEY) {
    return { statusCode: 500, body: 'FINNHUB_API_KEY not configured' };
  }

  console.log('Morning scan starting...');
  const results = [];

  // Process in batches of 5 to respect rate limits
  for (let i = 0; i < WATCHLIST.length; i += 5) {
    const batch = WATCHLIST.slice(i, i + 5);
    const batchResults = await Promise.all(
      batch.map(async (symbol) => {
        try {
          const [quote, candles] = await Promise.all([
            fetchQuote(symbol),
            fetchYahooCandles(symbol),
          ]);
          if (!quote) return null;
          const score = axiarchScore(quote, candles);
          return {
            ticker: symbol,
            price: quote.c,
            change: quote.dp || 0,
            score,
          };
        } catch (err) {
          console.error(`Error scanning ${symbol}:`, err.message);
          return null;
        }
      })
    );
    results.push(...batchResults.filter(Boolean));

    // Small delay between batches to avoid rate limiting
    if (i + 5 < WATCHLIST.length) {
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  // Sort by score descending, take top 5
  results.sort((a, b) => b.score - a.score);
  const top5 = results.slice(0, 5);

  if (top5.length === 0) {
    console.log('No valid scan results');
    return { statusCode: 200, body: 'No results' };
  }

  // Save to Netlify Blobs
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const store = getStore('performance');

  const morningData = {
    date: today,
    scannedAt: new Date().toISOString(),
    tickersScanned: results.length,
    picks: top5.map(p => ({
      ticker: p.ticker,
      entryPrice: p.price,
      score: p.score,
      change: p.change,
    })),
  };

  await store.setJSON(`morning-${today}`, morningData);

  console.log(`Morning scan complete. Top 5: ${top5.map(p => `${p.ticker}(${p.score})`).join(', ')}`);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Morning scan saved', picks: top5 }),
  };
};
