const { getStore } = require('@netlify/blobs');
function getBlobStore(name) { const s = process.env.NETLIFY_SITE_ID, t = process.env.NETLIFY_BLOBS_TOKEN; return (s && t) ? getStore({ name, siteID: s, token: t }) : getStore(name); }

// Reddit OAuth: requires REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD
// Create a "script" app at https://www.reddit.com/prefs/apps

const SITE_URL = 'https://axiarchtrading.org';

async function getRedditToken() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;

  if (!clientId || !clientSecret || !username || !password) return null;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const resp = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Axiarch/1.0',
    },
    body: `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  });
  const data = await resp.json();
  return data.access_token || null;
}

async function postToReddit(token, subreddit, title, body) {
  const resp = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Axiarch/1.0',
    },
    body: `kind=self&sr=${subreddit}&title=${encodeURIComponent(title)}&text=${encodeURIComponent(body)}`,
  });
  return resp.json();
}

function formatRedditPost(picks, performance) {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  let body = `I built a sentiment scanner that runs overnight and flags stocks based on Reddit buzz + technical analysis + social sentiment.\n\n`;
  body += `Here are today's top picks from the algorithm:\n\n`;
  body += `| Ticker | Score | Signal | Social |\n`;
  body += `|--------|-------|--------|--------|\n`;

  for (const pick of picks) {
    const socialInfo = pick.socialScore > 0 ? `${pick.socialScore} (${pick.mentions} mentions)` : 'Low';
    body += `| $${pick.ticker} | ${pick.score} | ${pick.signal || 'HOLD'} | ${socialInfo} |\n`;
  }

  if (performance) {
    body += `\n---\n\n`;
    body += `**Track record so far:**\n\n`;
    body += `- Correct calls: ${performance.wins}\n`;
    body += `- Missed calls: ${performance.losses}\n`;
    body += `- Total tracked: ${performance.total}\n`;
  }

  body += `\n---\n\n`;
  body += `The algorithm scores stocks on 6 technical indicators + Reddit/StockTwits social sentiment. Higher score = more indicators agree.\n\n`;
  body += `Full scanner: [axiarchtrading.org/screener](${SITE_URL}/screener)\n\n`;
  body += `*Not financial advice. Always do your own research.*`;

  const title = `AI Scanner Top Picks for ${date} — here's what the algorithm flagged`;

  return { title, body };
}

exports.handler = async (event) => {
  const token = await getRedditToken();
  if (!token) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Reddit credentials not configured. Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD' }) };
  }

  try {
    // Get today's morning scan
    const store = getBlobStore('performance');
    const today = new Date().toISOString().split('T')[0];
    let morningData;
    try { morningData = await store.get(`morning-${today}`, { type: 'json' }); } catch { morningData = null; }

    if (!morningData?.picks?.length) {
      return { statusCode: 200, body: 'No morning picks to post' };
    }

    // Get performance history for track record
    let history;
    try { history = await store.get('history', { type: 'json' }); } catch { history = null; }
    const activePicks = (history?.picks || []).filter(p => p.signal && (p.signal.includes('BUY') || p.signal.includes('SELL')));
    const performance = activePicks.length > 0 ? {
      wins: activePicks.filter(p => p.result === 'WIN').length,
      losses: activePicks.filter(p => p.result === 'LOSS').length,
      total: activePicks.length,
    } : null;

    const { title, body } = formatRedditPost(morningData.picks, performance);

    // Post to target subreddits
    const subreddits = ['Daytrading', 'Pennystock'];
    const results = [];

    for (const sub of subreddits) {
      try {
        const result = await postToReddit(token, sub, title, body);
        results.push({ subreddit: sub, success: !result.json?.errors?.length, data: result });
        await new Promise(r => setTimeout(r, 5000)); // delay between posts
      } catch (err) {
        results.push({ subreddit: sub, success: false, error: err.message });
      }
    }

    console.log(`Reddit post results:`, results.map(r => `r/${r.subreddit}: ${r.success ? 'OK' : 'FAILED'}`).join(', '));

    return { statusCode: 200, body: JSON.stringify({ results }) };
  } catch (err) {
    console.error('Reddit post error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
