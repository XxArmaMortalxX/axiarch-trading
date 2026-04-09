const { getStore } = require('@netlify/blobs');
function getBlobStore(name) { const s = process.env.NETLIFY_SITE_ID, t = process.env.NETLIFY_BLOBS_TOKEN; return (s && t) ? getStore({ name, siteID: s, token: t }) : getStore(name); }

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Axiarch Trading <picks@axiarchtrading.org>';
const SITE_URL = 'https://axiarchtrading.org';

async function sendEmail(to, subject, html) {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  return resp.json();
}

exports.handler = async (event) => {
  if (!RESEND_KEY) return { statusCode: 500, body: 'RESEND_API_KEY not configured' };

  try {
    // Get this week's performance data
    const perfStore = getBlobStore('performance');
    let history;
    try { history = await perfStore.get('history', { type: 'json' }); } catch { history = null; }

    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const weekPicks = (history?.picks || []).filter(p => new Date(p.flaggedDate) >= weekAgo);

    const activePicks = weekPicks.filter(p => p.signal && (p.signal.includes('BUY') || p.signal.includes('SELL')));
    const holds = weekPicks.filter(p => !p.signal || p.signal === 'HOLD');
    const wins = activePicks.filter(p => p.result === 'WIN').length;
    const losses = activePicks.filter(p => p.result === 'LOSS').length;
    const totalPicks = weekPicks.length;

    // Build picks table
    let picksHtml = '';
    weekPicks.sort((a, b) => (b.pctChange || 0) - (a.pctChange || 0)).forEach(pick => {
      const changeColor = pick.pctChange >= 0 ? '#00e676' : '#ff3b3b';
      const resultIcon = pick.result === 'WIN' ? '&#10003;' : pick.result === 'LOSS' ? '&#10007;' : '—';
      picksHtml += `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #163322;color:#00e676;font-weight:700;">$${pick.ticker}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #163322;color:#7fa893;font-size:12px;">${pick.signal || 'HOLD'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #163322;color:${changeColor};font-weight:600;">${pick.pctChange >= 0 ? '+' : ''}${(pick.pctChange || 0).toFixed(1)}%</td>
        <td style="padding:6px 8px;border-bottom:1px solid #163322;">${resultIcon}</td>
      </tr>`;
    });

    const dateRange = `${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    const html = `
    <div style="background:#050a08;color:#e0ece6;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;max-width:600px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#00e676;font-size:22px;margin:0;">AXIARCH WEEKLY RECAP</h1>
        <p style="color:#7fa893;font-size:13px;margin:4px 0 0;">${dateRange}</p>
      </div>

      <div style="display:flex;gap:16px;margin-bottom:24px;text-align:center;">
        <div style="flex:1;background:#0b1a14;border:1px solid #163322;border-radius:8px;padding:16px;">
          <div style="color:#e0ece6;font-size:28px;font-weight:800;">${totalPicks}</div>
          <div style="color:#7fa893;font-size:11px;text-transform:uppercase;">Picks Tracked</div>
        </div>
        <div style="flex:1;background:#0b1a14;border:1px solid #163322;border-radius:8px;padding:16px;">
          <div style="color:#00e676;font-size:28px;font-weight:800;">${wins}</div>
          <div style="color:#7fa893;font-size:11px;text-transform:uppercase;">Correct Calls</div>
        </div>
        <div style="flex:1;background:#0b1a14;border:1px solid #163322;border-radius:8px;padding:16px;">
          <div style="color:${losses > 0 ? '#ff3b3b' : '#7fa893'};font-size:28px;font-weight:800;">${losses}</div>
          <div style="color:#7fa893;font-size:11px;text-transform:uppercase;">Missed Calls</div>
        </div>
      </div>

      ${weekPicks.length > 0 ? `
      <div style="background:#0b1a14;border:1px solid #163322;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;font-family:'Courier New',monospace;">
          <tr style="color:#7fa893;font-size:11px;text-transform:uppercase;">
            <th style="text-align:left;padding:8px;">Ticker</th>
            <th style="text-align:left;padding:8px;">Signal</th>
            <th style="text-align:left;padding:8px;">Move</th>
            <th style="text-align:left;padding:8px;">Result</th>
          </tr>
          ${picksHtml}
        </table>
      </div>
      ` : '<p style="color:#7fa893;text-align:center;padding:20px;">No picks tracked this week.</p>'}

      ${holds.length > 0 ? `<p style="color:#7fa893;font-size:13px;text-align:center;margin-bottom:24px;">The algorithm also flagged ${holds.length} stocks as HOLD (no trade taken).</p>` : ''}

      <div style="text-align:center;margin:24px 0;">
        <a href="${SITE_URL}/performance" style="display:inline-block;background:#00e676;color:#000;font-weight:700;padding:12px 32px;border-radius:6px;text-decoration:none;font-size:14px;">View Full Performance</a>
      </div>
      <div style="text-align:center;margin:16px 0;">
        <a href="https://t.me/axiarchtradebot" style="display:inline-block;background:transparent;color:#00e676;border:1px solid #00e676;font-weight:600;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:13px;">Get Real-Time Alerts on Telegram</a>
      </div>
      <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #163322;">
        <p style="color:#4a6b58;font-size:11px;">Past performance does not guarantee future results. Not financial advice.</p>
      </div>
    </div>`;

    const subject = `Axiarch Week in Review: ${wins} wins, ${losses} losses, ${totalPicks} picks tracked`;

    // Get subscriber list
    const emailStore = getBlobStore('emails');
    let emailList;
    try { emailList = await emailStore.get('subscribers', { type: 'json' }); } catch { emailList = { emails: [] }; }
    if (!emailList?.emails?.length) return { statusCode: 200, body: 'No subscribers' };

    let sent = 0;
    for (let i = 0; i < emailList.emails.length; i += 5) {
      const batch = emailList.emails.slice(i, i + 5);
      await Promise.all(batch.map(sub => sendEmail(sub.email, subject, html).catch(() => {})));
      sent += batch.length;
      if (i + 5 < emailList.emails.length) await new Promise(r => setTimeout(r, 3000));
    }

    console.log(`Weekly recap sent to ${sent} subscribers`);
    return { statusCode: 200, body: JSON.stringify({ sent, picks: totalPicks, wins, losses }) };
  } catch (err) {
    console.error('Weekly recap error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
