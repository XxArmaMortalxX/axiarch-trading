const { getStore } = require('@netlify/blobs');
function getBlobStore(name) { const s = process.env.NETLIFY_SITE_ID, t = process.env.NETLIFY_BLOBS_TOKEN; return (s && t) ? getStore({ name, siteID: s, token: t }) : getStore(name); }

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300', // 5 minute cache
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const store = getBlobStore('performance');

    // Get accumulated history from Blobs
    let history;
    try {
      history = await store.get('history', { type: 'json' });
    } catch {
      history = null;
    }

    // Start with the static GEVO seed data
    const seedPicks = [
      {
        ticker: 'GEVO',
        flaggedDate: '2026-04-02',
        score: 74,
        signal: 'BUY',
        sources: ['Axiarch Screener'],
        entryPrice: 2.42,
        closePrice: 2.84,
        pctChange: 17.78,
        result: 'WIN',
        tracked: true,
        trackedAt: '2026-04-06T15:47:00.000Z',
      },
    ];

    // Merge: seed data + automated history (no duplicates)
    const allPicks = [...seedPicks];
    if (history && history.picks) {
      const existingKeys = new Set(allPicks.map(p => `${p.ticker}-${p.flaggedDate}`));
      for (const pick of history.picks) {
        const key = `${pick.ticker}-${pick.flaggedDate}`;
        if (!existingKeys.has(key)) {
          allPicks.push(pick);
          existingKeys.add(key);
        }
      }
    }

    // Sort by date descending
    allPicks.sort((a, b) => new Date(b.flaggedDate) - new Date(a.flaggedDate));

    // Also get today's morning picks if available
    const today = new Date().toISOString().split('T')[0];
    let todayPicks = null;
    try {
      todayPicks = await store.get(`morning-${today}`, { type: 'json' });
    } catch { /* no morning scan today */ }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        picks: allPicks,
        todayMorning: todayPicks,
        weeklyReports: [],
      }),
    };
  } catch (err) {
    console.error('Performance API error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
