const { getStore } = require('@netlify/blobs');
function getBlobStore(name) { const s = process.env.NETLIFY_SITE_ID, t = process.env.NETLIFY_BLOBS_TOKEN; return (s && t) ? getStore({ name, siteID: s, token: t }) : getStore(name); }

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Axiarch Trading <picks@axiarchtrading.live>';

function formatPicksHTML(picks, stats) {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  let html = `
  <div style="background:#050a08;color:#e0ece6;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;max-width:600px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="color:#00e676;font-size:24px;margin:0;">AXIARCH DAILY PICKS</h1>
      <p style="color:#7fa893;font-size:14px;margin:4px 0 0;">${date}</p>
    </div>

    <div style="background:#0b1a14;border:1px solid #163322;border-radius:8px;padding:20px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="color:#7fa893;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">
          <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #163322;">#</th>
          <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #163322;">Ticker</th>
          <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #163322;">Signal</th>
          <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #163322;">Score</th>
          <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #163322;">Sources</th>
        </tr>`;

  const medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
  picks.slice(0, 10).forEach((pick, i) => {
    const rank = i < 3 ? medals[i] : `#${i + 1}`;
    const signalColor = pick.signal?.includes('BUY') ? '#00e676' : pick.signal?.includes('SELL') ? '#ff3b3b' : '#7fa893';
    html += `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #0f2119;color:#7fa893;">${rank}</td>
          <td style="padding:8px;border-bottom:1px solid #0f2119;font-weight:700;color:#00e676;">$${pick.ticker}</td>
          <td style="padding:8px;border-bottom:1px solid #0f2119;color:${signalColor};font-weight:600;">${pick.signal || 'HOLD'}</td>
          <td style="padding:8px;border-bottom:1px solid #0f2119;color:#e0ece6;">${pick.score}</td>
          <td style="padding:8px;border-bottom:1px solid #0f2119;color:#7fa893;font-size:12px;">${pick.sources?.join(', ') || ''}</td>
        </tr>`;
  });

  html += `
      </table>
    </div>`;

  if (stats) {
    html += `
    <div style="display:flex;gap:16px;margin-bottom:20px;text-align:center;">
      <div style="flex:1;background:#0b1a14;border:1px solid #163322;border-radius:8px;padding:12px;">
        <div style="color:#00e676;font-size:20px;font-weight:800;">${stats.winRate}%</div>
        <div style="color:#7fa893;font-size:11px;text-transform:uppercase;">Win Rate</div>
      </div>
      <div style="flex:1;background:#0b1a14;border:1px solid #163322;border-radius:8px;padding:12px;">
        <div style="color:#00e676;font-size:20px;font-weight:800;">+${stats.avgReturn}%</div>
        <div style="color:#7fa893;font-size:11px;text-transform:uppercase;">Avg Return</div>
      </div>
      <div style="flex:1;background:#0b1a14;border:1px solid #163322;border-radius:8px;padding:12px;">
        <div style="color:#00e676;font-size:20px;font-weight:800;">+${stats.bestPick?.pct || '0'}%</div>
        <div style="color:#7fa893;font-size:11px;text-transform:uppercase;">Best Pick</div>
      </div>
    </div>`;
  }

  html += `
    <div style="text-align:center;margin:24px 0;">
      <a href="https://axiarchtrading.org/screener" style="display:inline-block;background:#00e676;color:#000;font-weight:700;padding:12px 32px;border-radius:6px;text-decoration:none;font-size:14px;">View Live Screener</a>
    </div>

    <div style="text-align:center;margin:20px 0;padding:16px;background:#0b1a14;border:1px solid #163322;border-radius:8px;">
      <p style="color:#7fa893;font-size:13px;margin:0 0 8px;">Get real-time alerts on Telegram:</p>
      <a href="https://t.me/axiarchtradebot" style="display:inline-block;background:transparent;color:#00e676;border:1px solid #00e676;font-weight:600;padding:8px 20px;border-radius:6px;text-decoration:none;font-size:13px;">Join Telegram Channel</a>
    </div>

    <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #163322;">
      <p style="color:#4a6b58;font-size:11px;margin:0;">Not financial advice. Day trading involves substantial risk of loss. Past performance does not guarantee future results.</p>
      <p style="color:#4a6b58;font-size:11px;margin:8px 0 0;">Powered by Axiarch Algorithm</p>
    </div>
  </div>`;

  return html;
}

async function sendEmail(to, subject, html) {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  });
  return resp.json();
}

exports.handler = async (event) => {
  if (!RESEND_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY not configured' }) };
  }

  try {
    // Get picks data
    const siteUrl = process.env.URL || 'https://axiarchtrading.org';
    const picksResp = await fetch(`${siteUrl}/picks.json`);
    if (!picksResp.ok) throw new Error('Could not load picks.json');
    const picksData = await picksResp.json();

    if (!picksData.picks || picksData.picks.length === 0) {
      return { statusCode: 200, body: 'No picks to send' };
    }

    // Get subscriber list
    const store = getBlobStore('emails');
    let emailList;
    try { emailList = await store.get('subscribers', { type: 'json' }); } catch { emailList = null; }
    if (!emailList || !emailList.emails || emailList.emails.length === 0) {
      console.log('No subscribers to email');
      return { statusCode: 200, body: 'No subscribers' };
    }

    const html = formatPicksHTML(picksData.picks, picksData.stats);
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const subject = `Axiarch Daily Picks — ${date} | ${picksData.picks.length} Stocks Flagged`;

    let sent = 0, failed = 0;

    // Send in batches of 5 with delay
    for (let i = 0; i < emailList.emails.length; i += 5) {
      const batch = emailList.emails.slice(i, i + 5);
      const results = await Promise.all(
        batch.map(async (sub) => {
          try {
            const result = await sendEmail(sub.email, subject, html);
            if (result.id) { sent++; return true; }
            console.error(`Failed to send to ${sub.email}:`, result);
            failed++;
            return false;
          } catch (err) {
            console.error(`Error sending to ${sub.email}:`, err.message);
            failed++;
            return false;
          }
        })
      );
      // Rate limit: 2 req/sec on Resend free tier
      if (i + 5 < emailList.emails.length) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    console.log(`Daily email sent: ${sent} delivered, ${failed} failed, ${emailList.emails.length} total subscribers`);

    return {
      statusCode: 200,
      body: JSON.stringify({ sent, failed, total: emailList.emails.length }),
    };
  } catch (err) {
    console.error('Daily email error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
