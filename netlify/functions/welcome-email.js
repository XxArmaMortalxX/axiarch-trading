const { getStore } = require('@netlify/blobs');
function getBlobStore(name) { const s = process.env.NETLIFY_SITE_ID, t = process.env.NETLIFY_BLOBS_TOKEN; return (s && t) ? getStore({ name, siteID: s, token: t }) : getStore(name); }

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Axiarch Trading <picks@axiarchtrading.org>';
const SITE_URL = 'https://axiarchtrading.org';

async function sendEmail(to, subject, html) {
  if (!RESEND_KEY) return null;
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  return resp.json();
}

function emailWrapper(content) {
  return `
  <div style="background:#050a08;color:#e0ece6;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;max-width:600px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="color:#00e676;font-size:22px;margin:0;">AXIARCH</h1>
      <p style="color:#4a6b58;font-size:11px;margin:4px 0 0;letter-spacing:0.15em;">TRADING INTELLIGENCE</p>
    </div>
    ${content}
    <div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #163322;">
      <p style="color:#4a6b58;font-size:11px;">Not financial advice. Day trading involves substantial risk.</p>
      <a href="https://t.me/axiarchtradebot" style="color:#00e676;font-size:12px;text-decoration:none;">Join our Telegram</a>
    </div>
  </div>`;
}

const EMAILS = {
  welcome: {
    subject: 'Welcome to Axiarch — Here\'s How to Use It',
    html: emailWrapper(`
      <h2 style="color:#e0ece6;font-size:20px;margin-bottom:16px;">You're in. Let's make money.</h2>
      <p style="color:#7fa893;font-size:14px;line-height:1.7;">
        Axiarch scans 65+ stocks every day using 6 technical indicators + social sentiment from Reddit and StockTwits. Here's how to get the most out of it:
      </p>
      <div style="background:#0b1a14;border:1px solid #163322;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="color:#e0ece6;font-size:14px;margin:0 0 12px;"><strong style="color:#00e676;">1. Check the Screener</strong></p>
        <p style="color:#7fa893;font-size:13px;margin:0 0 16px;">Every morning, the scanner ranks stocks by our composite score. Higher score = more indicators agree. Look for BUY or STRONG BUY signals.</p>
        <p style="color:#e0ece6;font-size:14px;margin:0 0 12px;"><strong style="color:#00e676;">2. Click Any Ticker</strong></p>
        <p style="color:#7fa893;font-size:13px;margin:0 0 16px;">Get the full Axiarch Strategy breakdown — plain English explanation of what the indicators mean, exact entry/stop/target prices, and a risk level rating.</p>
        <p style="color:#e0ece6;font-size:14px;margin:0 0 12px;"><strong style="color:#00e676;">3. Use the Social Filter</strong></p>
        <p style="color:#7fa893;font-size:13px;margin:0;">Click "Social Buzz" to see which stocks Reddit and StockTwits are talking about. When social buzz + technical signals align, that's a high-conviction setup.</p>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${SITE_URL}/screener" style="display:inline-block;background:#00e676;color:#000;font-weight:700;padding:12px 32px;border-radius:6px;text-decoration:none;font-size:14px;">Open the Screener</a>
      </div>
      <p style="color:#7fa893;font-size:13px;text-align:center;">
        Pro tip: Join our <a href="https://t.me/axiarchtradebot" style="color:#00e676;text-decoration:none;">Telegram channel</a> for real-time alerts.
      </p>
    `),
  },

  day3: {
    subject: 'Axiarch: This Week\'s Top Picks Are In',
    html: emailWrapper(`
      <h2 style="color:#e0ece6;font-size:20px;margin-bottom:16px;">Here's what the algorithm flagged this week.</h2>
      <p style="color:#7fa893;font-size:14px;line-height:1.7;">
        Every pick is tracked from flag time to close. No cherry-picking, no hindsight. Here's our verified track record:
      </p>
      <div style="background:#0b1a14;border:1px solid #163322;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
        <div style="display:inline-block;margin:0 16px;">
          <div style="color:#00e676;font-size:28px;font-weight:800;">9/9</div>
          <div style="color:#7fa893;font-size:11px;text-transform:uppercase;">Winning Picks</div>
        </div>
        <div style="display:inline-block;margin:0 16px;">
          <div style="color:#00e676;font-size:28px;font-weight:800;">+24.3%</div>
          <div style="color:#7fa893;font-size:11px;text-transform:uppercase;">Avg Return</div>
        </div>
      </div>
      <p style="color:#7fa893;font-size:14px;line-height:1.7;">
        The scanner runs every morning at 9:30 AM ET. The best setups are stocks that appear on <strong style="color:#e0ece6;">both</strong> the social buzz radar and the technical screener.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${SITE_URL}/performance" style="display:inline-block;background:#00e676;color:#000;font-weight:700;padding:12px 32px;border-radius:6px;text-decoration:none;font-size:14px;">See All Verified Picks</a>
      </div>
      <div style="text-align:center;margin:16px 0;">
        <a href="${SITE_URL}/screener" style="display:inline-block;background:transparent;color:#00e676;border:1px solid #00e676;font-weight:600;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:13px;">Check Today's Scanner</a>
      </div>
    `),
  },

  day7: {
    subject: 'Ready to Level Up? Axiarch Pro is Here',
    html: emailWrapper(`
      <h2 style="color:#e0ece6;font-size:20px;margin-bottom:16px;">You've been using Axiarch for a week.</h2>
      <p style="color:#7fa893;font-size:14px;line-height:1.7;">
        By now you've seen how the scanner works — real-time technical analysis, social sentiment, and plain-English trade strategies. Here's what Pro unlocks:
      </p>
      <div style="background:#0b1a14;border:1px solid #00e676;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="color:#e0ece6;font-size:14px;margin:0 0 10px;"><span style="color:#00e676;">&#10003;</span> Live scanning with your own Finnhub API key</p>
        <p style="color:#e0ece6;font-size:14px;margin:0 0 10px;"><span style="color:#00e676;">&#10003;</span> Unlimited watchlist tickers</p>
        <p style="color:#e0ece6;font-size:14px;margin:0 0 10px;"><span style="color:#00e676;">&#10003;</span> Daily picks emailed before market open</p>
        <p style="color:#e0ece6;font-size:14px;margin:0 0 10px;"><span style="color:#00e676;">&#10003;</span> Priority Telegram alerts</p>
        <p style="color:#e0ece6;font-size:14px;margin:0;"><span style="color:#00e676;">&#10003;</span> 7-day free trial — cancel anytime</p>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${SITE_URL}/go" style="display:inline-block;background:#00e676;color:#000;font-weight:700;padding:14px 36px;border-radius:6px;text-decoration:none;font-size:15px;">Start Free 7-Day Trial</a>
      </div>
      <p style="color:#7fa893;font-size:13px;text-align:center;">
        $29/mo after trial. No commitment. Cancel anytime.
      </p>
    `),
  },
};

// Called by subscribe.js when a new email is captured
// Also runs on a schedule to send day 3 and day 7 emails
exports.handler = async (event) => {
  if (!RESEND_KEY) {
    return { statusCode: 500, body: 'RESEND_API_KEY not configured' };
  }

  const store = getBlobStore('emails');

  // Check if triggered with a specific email (immediate welcome)
  if (event.httpMethod === 'POST') {
    try {
      const { email } = JSON.parse(event.body || '{}');
      if (email) {
        const result = await sendEmail(email, EMAILS.welcome.subject, EMAILS.welcome.html);
        // Track drip status
        const dripStore = getBlobStore('drip');
        let dripData;
        try { dripData = await dripStore.get('status', { type: 'json' }); } catch { dripData = { users: {} }; }
        if (!dripData || !dripData.users) dripData = { users: {} };
        dripData.users[email] = { welcomeSent: new Date().toISOString(), day3Sent: null, day7Sent: null };
        await dripStore.setJSON('status', dripData);
        console.log(`Welcome email sent to ${email}`);
        return { statusCode: 200, body: JSON.stringify({ sent: true, result }) };
      }
    } catch (err) {
      console.error('Welcome email error:', err);
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  // Scheduled: check for day 3 and day 7 emails to send
  try {
    const dripStore = getBlobStore('drip');
    let dripData;
    try { dripData = await dripStore.get('status', { type: 'json' }); } catch { dripData = { users: {} }; }
    if (!dripData || !dripData.users) return { statusCode: 200, body: 'No drip data' };

    const now = Date.now();
    let day3Sent = 0, day7Sent = 0;

    for (const [email, status] of Object.entries(dripData.users)) {
      if (!status.welcomeSent) continue;
      const welcomeTime = new Date(status.welcomeSent).getTime();
      const daysSince = (now - welcomeTime) / (1000 * 60 * 60 * 24);

      // Day 3 email
      if (daysSince >= 3 && !status.day3Sent) {
        await sendEmail(email, EMAILS.day3.subject, EMAILS.day3.html);
        dripData.users[email].day3Sent = new Date().toISOString();
        day3Sent++;
        await new Promise(r => setTimeout(r, 2000)); // rate limit
      }

      // Day 7 email
      if (daysSince >= 7 && !status.day7Sent) {
        await sendEmail(email, EMAILS.day7.subject, EMAILS.day7.html);
        dripData.users[email].day7Sent = new Date().toISOString();
        day7Sent++;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    await dripStore.setJSON('status', dripData);
    console.log(`Drip check: ${day3Sent} day-3 emails, ${day7Sent} day-7 emails sent`);
    return { statusCode: 200, body: JSON.stringify({ day3Sent, day7Sent }) };
  } catch (err) {
    console.error('Drip schedule error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
