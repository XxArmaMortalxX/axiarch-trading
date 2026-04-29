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

    // Fresh start from Apr 15 — only include data from today onward
    const resetDate = '2026-04-15';
    const allPicks = [];
    if (history && history.picks) {
      for (const pick of history.picks) {
        if (pick.flaggedDate >= resetDate) {
          allPicks.push(pick);
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
