const { getBlobStore } = require('./lib/blobs');

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Fetch top Reddit mentions from ApeWisdom
async function fetchApeWisdom() {
  try {
    const resp = await fetch('https://apewisdom.io/api/v1.0/filter/all-stocks/page/1', {
      headers: { 'User-Agent': 'Axiarch/1.0' },
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.results || []).map(r => ({
      ticker: r.ticker,
      mentions: r.mentions || 0,
      upvotes: r.upvotes || 0,
      rank: r.rank || 999,
      rankChange: (r.rank_24h_ago || r.rank) - r.rank, // positive = rising
      mentions24hAgo: r.mentions_24h_ago || 0,
    }));
  } catch (err) {
    console.error('ApeWisdom fetch failed:', err.message);
    return [];
  }
}

// Fetch trending tickers from StockTwits
async function fetchStockTwitsTrending() {
  try {
    const resp = await fetch('https://api.stocktwits.com/api/2/trending/symbols.json', {
      headers: { 'User-Agent': 'Axiarch/1.0' },
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.symbols || []).map((s, i) => ({
      ticker: s.symbol,
      trendingRank: i + 1,
      trendingScore: s.trending_score || 0,
      watchlistCount: s.watchlist_count || 0,
    }));
  } catch (err) {
    console.error('StockTwits trending failed:', err.message);
    return [];
  }
}

// Fetch sentiment for a specific ticker from StockTwits
async function fetchStockTwitsSentiment(ticker) {
  try {
    const resp = await fetch(`https://api.stocktwits.com/api/2/streams/symbol/${ticker}.json`, {
      headers: { 'User-Agent': 'Axiarch/1.0' },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const messages = data.messages || [];
    let bullish = 0, bearish = 0;
    for (const msg of messages) {
      const sentiment = msg.entities?.sentiment?.basic;
      if (sentiment === 'Bullish') bullish++;
      else if (sentiment === 'Bearish') bearish++;
    }
    const total = bullish + bearish;
    return {
      messageCount: messages.length,
      bullish,
      bearish,
      sentiment: total > 0 ? Math.round((bullish / total) * 100) : 50, // % bullish
      sentimentLabel: total === 0 ? 'neutral' : bullish > bearish ? 'bullish' : bearish > bullish ? 'bearish' : 'neutral',
    };
  } catch {
    return null;
  }
}

// Calculate a unified social score (0-100)
function calcSocialScore(redditData, stocktwitsData, sentimentData) {
  let score = 0;

  // Reddit mentions (up to 40 points)
  if (redditData) {
    const mentions = redditData.mentions || 0;
    if (mentions >= 100) score += 40;
    else if (mentions >= 50) score += 30;
    else if (mentions >= 20) score += 22;
    else if (mentions >= 10) score += 15;
    else if (mentions >= 5) score += 8;

    // Bonus for rising rank
    const rankChange = redditData.rankChange || 0;
    if (rankChange > 10) score += 5;
    else if (rankChange > 3) score += 3;
  }

  // StockTwits trending (up to 30 points)
  if (stocktwitsData) {
    const rank = stocktwitsData.trendingRank;
    if (rank <= 5) score += 30;
    else if (rank <= 10) score += 22;
    else if (rank <= 20) score += 15;
    else if (rank <= 30) score += 8;
  }

  // Sentiment direction (up to 25 points)
  if (sentimentData && (sentimentData.bullish + sentimentData.bearish) >= 3) {
    const pct = sentimentData.sentiment; // % bullish
    if (pct >= 75) score += 25;
    else if (pct >= 60) score += 18;
    else if (pct >= 50) score += 12;
    else if (pct >= 40) score += 6;
    else score += 2; // very bearish still gets a tiny score for being talked about
  }

  return Math.min(100, score);
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Check Blobs cache first
  const store = getBlobStore('social');
  let cached;
  try {
    cached = await store.get('latest', { type: 'json' });
    if (cached && cached.fetchedAt && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS) {
      return { statusCode: 200, headers, body: JSON.stringify(cached) };
    }
  } catch { /* no cache */ }

  console.log('Fetching fresh social data...');

  // Fetch Reddit + StockTwits trending in parallel
  const [redditResults, stocktwitsTrending] = await Promise.all([
    fetchApeWisdom(),
    fetchStockTwitsTrending(),
  ]);

  // Build ticker map from both sources
  const tickerMap = {};

  for (const r of redditResults) {
    tickerMap[r.ticker] = { reddit: r, stocktwits: null, sentiment: null };
  }

  for (const s of stocktwitsTrending) {
    if (!tickerMap[s.ticker]) tickerMap[s.ticker] = { reddit: null, stocktwits: null, sentiment: null };
    tickerMap[s.ticker].stocktwits = s;
  }

  // Get sentiment for the top 15 most-mentioned tickers (rate limit friendly)
  const topTickers = Object.entries(tickerMap)
    .map(([ticker, data]) => ({
      ticker,
      importance: (data.reddit?.mentions || 0) + (data.stocktwits ? (31 - data.stocktwits.trendingRank) * 5 : 0),
    }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 15)
    .map(t => t.ticker);

  for (let i = 0; i < topTickers.length; i++) {
    const ticker = topTickers[i];
    const sentiment = await fetchStockTwitsSentiment(ticker);
    if (sentiment) {
      tickerMap[ticker].sentiment = sentiment;
    }
    // Small delay to respect StockTwits rate limits
    if (i < topTickers.length - 1) {
      await new Promise(r => setTimeout(r, 400));
    }
  }

  // Build final output
  const tickers = {};
  for (const [ticker, sources] of Object.entries(tickerMap)) {
    const socialScore = calcSocialScore(sources.reddit, sources.stocktwits, sources.sentiment);
    if (socialScore === 0) continue; // skip tickers with zero social signal

    tickers[ticker] = {
      socialScore,
      mentions: sources.reddit?.mentions || 0,
      mentionRank: sources.reddit?.rank || null,
      rankChange: sources.reddit?.rankChange || 0,
      trendingRank: sources.stocktwits?.trendingRank || null,
      sentiment: sources.sentiment?.sentiment ?? 50,
      sentimentLabel: sources.sentiment?.sentimentLabel || 'neutral',
      bullish: sources.sentiment?.bullish || 0,
      bearish: sources.sentiment?.bearish || 0,
    };
  }

  const result = {
    tickers,
    fetchedAt: Date.now(),
    sources: {
      reddit: redditResults.length,
      stocktwits: stocktwitsTrending.length,
    },
  };

  // Cache to Blobs
  try {
    await store.setJSON('latest', result);
  } catch (err) {
    console.error('Failed to cache social data:', err.message);
  }

  console.log(`Social data: ${Object.keys(tickers).length} tickers with social signals`);

  return { statusCode: 200, headers, body: JSON.stringify(result) };
};
