const { getStore } = require('@netlify/blobs');
function getBlobStore(name) { const s = process.env.NETLIFY_SITE_ID, t = process.env.NETLIFY_BLOBS_TOKEN; return (s && t) ? getStore({ name, siteID: s, token: t }) : getStore(name); }

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

function generateSignal(quote, candles, socialData) {
  const price = quote.c;
  if (!candles || !candles.c || candles.c.length < 15) return { signal: 'HOLD', bias: 'NEUTRAL' };
  const closes = candles.c, volumes = candles.v;
  const rsi = calcRSI(closes) || 50;
  const ema9 = calcEMA(closes, 9);
  const ema21 = calcEMA(closes, 21);
  const rvol = calcRelativeVolume(volumes) || 1;
  const changePct = quote.dp || 0;
  let bull = 0, bear = 0;

  // RSI — more granular
  if (rsi < 25) bull += 3;
  else if (rsi < 30) bull += 2;
  else if (rsi < 40) bull += 1;
  else if (rsi > 80) bear += 3;
  else if (rsi > 70) bear += 2;
  else if (rsi > 60) bear += 1;

  // EMA alignment
  if (ema9 && ema21) {
    if (price > ema9 && ema9 > ema21) bull += 2;
    else if (price > ema9) bull += 1;
    else if (price > ema21) bull += 0.5;
    else if (price < ema9 && ema9 < ema21) bear += 2;
    else if (price < ema9) bear += 1;
    else if (price < ema21) bear += 0.5;
  }

  // Volume confirmation
  if (rvol > 2 && changePct > 0) bull += 1.5;
  else if (rvol > 1.5 && changePct > 0) bull += 1;
  else if (rvol > 2 && changePct < 0) bear += 1.5;
  else if (rvol > 1.5 && changePct < 0) bear += 1;

  // Daily momentum
  if (changePct > 5) bull += 1.5;
  else if (changePct > 2) bull += 1;
  else if (changePct > 0) bull += 0.5;
  else if (changePct < -5) bear += 1.5;
  else if (changePct < -2) bear += 1;
  else if (changePct < 0) bear += 0.5;

  // Social sentiment
  if (socialData) {
    const sentiment = socialData.sentiment;
    const score = socialData.socialScore || 0;
    if (score > 40 && sentiment > 65) bull += 1;
    else if (score > 40 && sentiment < 35) bear += 1;
    else if (score > 20) {
      if (sentiment > 55) bull += 0.5;
      else if (sentiment < 45) bear += 0.5;
    }
  }

  let signal;
  if (bull >= bear + 3) signal = 'STRONG BUY';
  else if (bull >= bear + 1.5) signal = 'BUY';
  else if (bear >= bull + 3) signal = 'STRONG SELL';
  else if (bear >= bull + 1.5) signal = 'SELL';
  else signal = 'HOLD';

  const bias = bull > bear + 0.5 ? 'LONG' : bear > bull + 0.5 ? 'SHORT' : 'NEUTRAL';

  return { signal, bias };
}

function axiarchScore(quote, candles, socialData) {
  if (!candles || !candles.c || candles.c.length < 21) return 0;

  const closes = candles.c;
  const rsi = calcRSI(closes);
  const ema9 = calcEMA(closes, 9);
  const ema21 = calcEMA(closes, 21);
  const rvol = calcRelativeVolume(candles.v);
  const price = quote.c;
  const change = quote.dp || 0;

  let score = 0;

  // Technical (35%)
  if (rsi !== null) {
    if (rsi >= 30 && rsi <= 70) score += 13;
    else if (rsi < 30) score += 18;
    else score += 4;
  }
  if (ema9 && ema21 && ema9 > ema21) score += 17;

  // Momentum (20%)
  if (change > 5) score += 20;
  else if (change > 2) score += 14;
  else if (change > 0) score += 8;

  // Volume (15%)
  if (rvol && rvol > 3) score += 15;
  else if (rvol && rvol > 1.5) score += 9;
  else if (rvol && rvol > 1) score += 4;

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

  // Social (15%)
  if (socialData && socialData.socialScore) {
    score += Math.round(socialData.socialScore * 0.15);
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

  // Fetch social data from our own API
  let socialMap = {};
  try {
    const socialResp = await fetch(`${process.env.URL || 'https://axiarchtrading.netlify.app'}/.netlify/functions/social-data`);
    if (socialResp.ok) {
      const socialData = await socialResp.json();
      socialMap = socialData.tickers || {};
      console.log(`Social data loaded: ${Object.keys(socialMap).length} tickers`);
    }
  } catch (err) {
    console.error('Social data fetch failed (continuing without):', err.message);
  }

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
          const social = socialMap[symbol] || null;
          const score = axiarchScore(quote, candles, social);
          const { signal, bias } = generateSignal(quote, candles, social);
          return {
            ticker: symbol,
            price: quote.c,
            change: quote.dp || 0,
            score,
            signal,
            bias,
            socialScore: social?.socialScore || 0,
            mentions: social?.mentions || 0,
            sentiment: social?.sentiment ?? null,
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
  const store = getBlobStore('performance');

  const morningData = {
    date: today,
    scannedAt: new Date().toISOString(),
    tickersScanned: results.length,
    picks: top5.map(p => ({
      ticker: p.ticker,
      entryPrice: p.price,
      score: p.score,
      signal: p.signal,
      bias: p.bias,
      change: p.change,
      socialScore: p.socialScore,
      mentions: p.mentions,
      sentiment: p.sentiment,
    })),
  };

  await store.setJSON(`morning-${today}`, morningData);

  console.log(`Morning scan complete. Top 5: ${top5.map(p => `${p.ticker}(${p.score})`).join(', ')}`);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Morning scan saved', picks: top5 }),
  };
};
