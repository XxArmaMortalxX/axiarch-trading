const { getStore } = require('@netlify/blobs');
function getBlobStore(name) { const s = process.env.NETLIFY_SITE_ID, t = process.env.NETLIFY_BLOBS_TOKEN; return (s && t) ? getStore({ name, siteID: s, token: t }) : getStore(name); }

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE = 'https://finnhub.io/api/v1';

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

// Determine if the pick was a win based on signal direction
function evaluateResult(signal, pctChange) {
  const isBullish = signal === 'BUY' || signal === 'STRONG BUY';
  const isBearish = signal === 'SELL' || signal === 'STRONG SELL';

  if (isBullish && pctChange > 0) return 'WIN';
  if (isBearish && pctChange < 0) return 'WIN';
  if (isBullish && pctChange < 0) return 'LOSS';
  if (isBearish && pctChange > 0) return 'LOSS';
  return 'NEUTRAL'; // HOLD signals or 0% change
}

exports.handler = async (event) => {
  if (!FINNHUB_KEY) {
    return { statusCode: 500, body: 'FINNHUB_API_KEY not configured' };
  }

  const store = getBlobStore('performance');
  const today = new Date().toISOString().split('T')[0];

  // Read morning picks
  let morningData;
  try {
    morningData = await store.get(`morning-${today}`, { type: 'json' });
  } catch {
    console.log(`No morning scan found for ${today}`);
    return { statusCode: 200, body: 'No morning data to check' };
  }

  if (!morningData || !morningData.picks || morningData.picks.length === 0) {
    console.log('Morning data is empty');
    return { statusCode: 200, body: 'No picks to check' };
  }

  console.log(`Checking ${morningData.picks.length} morning picks...`);

  // Get close prices for each pick
  const results = [];
  for (const pick of morningData.picks) {
    const quote = await fetchQuote(pick.ticker);
    if (!quote) {
      console.error(`Failed to get quote for ${pick.ticker}`);
      continue;
    }

    const closePrice = quote.c;
    const pctChange = pick.entryPrice > 0
      ? ((closePrice - pick.entryPrice) / pick.entryPrice * 100)
      : 0;
    const pctRounded = Math.round(pctChange * 100) / 100;
    const signal = pick.signal || 'HOLD';
    const result = evaluateResult(signal, pctRounded);

    results.push({
      ticker: pick.ticker,
      flaggedDate: today,
      score: pick.score,
      signal: signal,
      bias: pick.bias || 'NEUTRAL',
      sources: ['Axiarch Screener'],
      entryPrice: pick.entryPrice,
      closePrice: closePrice,
      pctChange: pctRounded,
      result: result, // WIN, LOSS, or NEUTRAL
      socialScore: pick.socialScore || 0,
      mentions: pick.mentions || 0,
      sentiment: pick.sentiment,
      tracked: true,
      trackedAt: new Date().toISOString(),
    });

    // Small delay between quotes
    await new Promise(r => setTimeout(r, 500));
  }

  if (results.length === 0) {
    return { statusCode: 200, body: 'No results to save' };
  }

  // Read existing performance history
  let history;
  try {
    history = await store.get('history', { type: 'json' });
  } catch {
    history = { picks: [] };
  }

  if (!history || !history.picks) {
    history = { picks: [] };
  }

  // Add today's results (avoid duplicates for same date)
  const existingDates = new Set(history.picks.map(p => `${p.ticker}-${p.flaggedDate}`));
  const newPicks = results.filter(r => !existingDates.has(`${r.ticker}-${r.flaggedDate}`));
  history.picks.push(...newPicks);

  // Keep last 90 days of data
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  history.picks = history.picks.filter(p => new Date(p.flaggedDate) >= cutoff);

  await store.setJSON('history', history);

  const wins = results.filter(r => r.result === 'WIN').length;
  const losses = results.filter(r => r.result === 'LOSS').length;
  const neutral = results.filter(r => r.result === 'NEUTRAL').length;
  console.log(`Afternoon check complete. ${results.length} picks: ${wins} wins, ${losses} losses, ${neutral} neutral`);
  console.log(results.map(r => `${r.ticker}(${r.signal}): ${r.pctChange > 0 ? '+' : ''}${r.pctChange}% → ${r.result}`).join(', '));

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Afternoon check saved', results, summary: { wins, losses, neutral } }),
  };
};
