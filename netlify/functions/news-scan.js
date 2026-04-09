const { getStore } = require('@netlify/blobs');
function getBlobStore(name) { const s = process.env.NETLIFY_SITE_ID, t = process.env.NETLIFY_BLOBS_TOKEN; return (s && t) ? getStore({ name, siteID: s, token: t }) : getStore(name); }

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;

// Fetch company news from Finnhub
async function fetchNews(symbol) {
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]; // last 3 days
  const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_KEY}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data || []).slice(0, 5).map(article => ({
      headline: article.headline,
      source: article.source,
      url: article.url,
      summary: (article.summary || '').slice(0, 200),
      datetime: article.datetime,
    }));
  } catch { return []; }
}

// Simple sentiment from headlines (keyword-based)
function analyzeSentiment(headlines) {
  const bullishWords = ['surge', 'soar', 'rally', 'jump', 'gain', 'rise', 'bull', 'upgrade', 'beat', 'record', 'high', 'boom', 'buy', 'breakout', 'strong', 'growth', 'profit', 'positive'];
  const bearishWords = ['crash', 'plunge', 'drop', 'fall', 'sink', 'bear', 'downgrade', 'miss', 'low', 'warning', 'sell', 'risk', 'loss', 'negative', 'decline', 'weak', 'cut', 'layoff', 'fraud'];

  let bull = 0, bear = 0;
  for (const h of headlines) {
    const lower = h.headline.toLowerCase();
    for (const w of bullishWords) { if (lower.includes(w)) bull++; }
    for (const w of bearishWords) { if (lower.includes(w)) bear++; }
  }

  const total = bull + bear;
  if (total === 0) return { sentiment: 'neutral', score: 50, bull, bear };
  const pct = Math.round((bull / total) * 100);
  return {
    sentiment: pct > 60 ? 'bullish' : pct < 40 ? 'bearish' : 'neutral',
    score: pct,
    bull,
    bear,
  };
}

// Top tickers to scan news for (high social buzz or high score)
const PRIORITY_TICKERS = [
  'TSLA', 'NVDA', 'AAPL', 'AMD', 'INTC', 'META', 'GOOGL', 'MSFT',
  'AMC', 'GME', 'PLTR', 'SOFI', 'NIO', 'RIVN', 'COIN', 'SNAP',
  'IONQ', 'MARA', 'RIOT', 'SMCI',
];

exports.handler = async (event) => {
  if (!FINNHUB_KEY) {
    return { statusCode: 500, body: 'FINNHUB_API_KEY not configured' };
  }

  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  // Check cache
  const store = getBlobStore('news');
  let cached;
  try {
    cached = await store.get('latest', { type: 'json' });
    if (cached && cached.fetchedAt && (Date.now() - cached.fetchedAt) < 30 * 60 * 1000) { // 30 min cache
      return { statusCode: 200, headers, body: JSON.stringify(cached) };
    }
  } catch { /* no cache */ }

  console.log('Scanning news headlines...');
  const newsData = {};

  // Fetch news for priority tickers (rate limited)
  for (let i = 0; i < PRIORITY_TICKERS.length; i++) {
    const ticker = PRIORITY_TICKERS[i];
    const articles = await fetchNews(ticker);
    if (articles.length > 0) {
      const sentiment = analyzeSentiment(articles);
      newsData[ticker] = {
        articles,
        sentiment: sentiment.sentiment,
        sentimentScore: sentiment.score,
        bullCount: sentiment.bull,
        bearCount: sentiment.bear,
        articleCount: articles.length,
      };
    }
    // Finnhub rate limit: 60 calls/min
    if (i < PRIORITY_TICKERS.length - 1) {
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  const result = {
    tickers: newsData,
    fetchedAt: Date.now(),
    tickersScanned: PRIORITY_TICKERS.length,
    tickersWithNews: Object.keys(newsData).length,
  };

  try {
    await store.setJSON('latest', result);
  } catch (err) {
    console.error('Failed to cache news:', err.message);
  }

  console.log(`News scan: ${Object.keys(newsData).length} tickers with news`);
  return { statusCode: 200, headers, body: JSON.stringify(result) };
};
