const { getStore } = require('@netlify/blobs');
function getBlobStore(name) { const s = process.env.NETLIFY_SITE_ID, t = process.env.NETLIFY_BLOBS_TOKEN; return (s && t) ? getStore({ name, siteID: s, token: t }) : getStore(name); }

// Analyzes which indicator combinations predict winners
// Run manually or on schedule to generate insights
exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  const store = getBlobStore('performance');
  let history;
  try { history = await store.get('history', { type: 'json' }); } catch { history = null; }
  if (!history?.picks?.length) {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Not enough data yet' }) };
  }

  const picks = history.picks;
  const activePicks = picks.filter(p => p.signal && (p.signal.includes('BUY') || p.signal.includes('SELL')));

  if (activePicks.length < 5) {
    return { statusCode: 200, headers, body: JSON.stringify({ message: `Only ${activePicks.length} active picks — need at least 5 for analysis` }) };
  }

  // Analyze patterns
  const analysis = {
    totalPicks: picks.length,
    activeTrades: activePicks.length,
    holdSignals: picks.length - activePicks.length,
    wins: activePicks.filter(p => p.result === 'WIN').length,
    losses: activePicks.filter(p => p.result === 'LOSS').length,
    winRate: 0,
    avgWinReturn: 0,
    avgLossReturn: 0,
    avgReturn: 0,

    // By signal type
    bySignal: {},
    // By score range
    byScoreRange: {},
    // By social score
    bySocial: { withSocial: { count: 0, wins: 0 }, withoutSocial: { count: 0, wins: 0 } },
    // Best performing days
    byDay: {},

    insights: [],
  };

  // Win rate
  analysis.winRate = activePicks.length > 0 ? Math.round((analysis.wins / activePicks.length) * 100) : 0;

  // Average returns
  const winPicks = activePicks.filter(p => p.result === 'WIN');
  const lossPicks = activePicks.filter(p => p.result === 'LOSS');
  analysis.avgWinReturn = winPicks.length > 0 ? (winPicks.reduce((s, p) => s + Math.abs(p.pctChange), 0) / winPicks.length).toFixed(2) : 0;
  analysis.avgLossReturn = lossPicks.length > 0 ? (lossPicks.reduce((s, p) => s + Math.abs(p.pctChange), 0) / lossPicks.length).toFixed(2) : 0;
  analysis.avgReturn = activePicks.length > 0 ? (activePicks.reduce((s, p) => s + p.pctChange, 0) / activePicks.length).toFixed(2) : 0;

  // By signal type
  for (const pick of activePicks) {
    const sig = pick.signal;
    if (!analysis.bySignal[sig]) analysis.bySignal[sig] = { count: 0, wins: 0, avgReturn: 0, returns: [] };
    analysis.bySignal[sig].count++;
    if (pick.result === 'WIN') analysis.bySignal[sig].wins++;
    analysis.bySignal[sig].returns.push(pick.pctChange);
  }
  for (const [sig, data] of Object.entries(analysis.bySignal)) {
    data.winRate = Math.round((data.wins / data.count) * 100);
    data.avgReturn = (data.returns.reduce((s, r) => s + r, 0) / data.returns.length).toFixed(2);
    delete data.returns;
  }

  // By score range
  for (const pick of activePicks) {
    const range = pick.score >= 70 ? '70+' : pick.score >= 50 ? '50-69' : '30-49';
    if (!analysis.byScoreRange[range]) analysis.byScoreRange[range] = { count: 0, wins: 0 };
    analysis.byScoreRange[range].count++;
    if (pick.result === 'WIN') analysis.byScoreRange[range].wins++;
  }

  // Social vs no social
  for (const pick of activePicks) {
    const hasSocial = (pick.socialScore || 0) > 20;
    const key = hasSocial ? 'withSocial' : 'withoutSocial';
    analysis.bySocial[key].count++;
    if (pick.result === 'WIN') analysis.bySocial[key].wins++;
  }

  // Generate insights
  if (analysis.winRate > 60) analysis.insights.push(`Strong overall win rate: ${analysis.winRate}%`);
  if (analysis.winRate < 40 && activePicks.length >= 10) analysis.insights.push(`Win rate below 40% — consider tightening signal thresholds`);

  const strongBuy = analysis.bySignal['STRONG BUY'];
  if (strongBuy && strongBuy.winRate > 70) analysis.insights.push(`STRONG BUY signals are hitting at ${strongBuy.winRate}% — high conviction`);

  if (analysis.bySocial.withSocial.count >= 3) {
    const socialWR = Math.round((analysis.bySocial.withSocial.wins / analysis.bySocial.withSocial.count) * 100);
    const noSocialWR = analysis.bySocial.withoutSocial.count > 0
      ? Math.round((analysis.bySocial.withoutSocial.wins / analysis.bySocial.withoutSocial.count) * 100) : 0;
    if (socialWR > noSocialWR + 10) analysis.insights.push(`Social signals add value: ${socialWR}% win rate with social vs ${noSocialWR}% without`);
    if (socialWR < noSocialWR - 10) analysis.insights.push(`Social signals may be noise: ${socialWR}% win rate with social vs ${noSocialWR}% without`);
  }

  // Save analysis
  try {
    await store.setJSON('analytics', { ...analysis, generatedAt: new Date().toISOString() });
  } catch {}

  console.log(`Analytics: ${analysis.winRate}% win rate, ${analysis.activeTrades} active trades, ${analysis.insights.length} insights`);
  return { statusCode: 200, headers, body: JSON.stringify(analysis) };
};
