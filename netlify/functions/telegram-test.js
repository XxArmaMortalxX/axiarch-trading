const fs = require('fs');
const path = require('path');

function formatPicksMessage(data) {
  const { picks, stats } = data;
  const top10 = picks.slice(0, 10);
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const medals = ['🥇', '🥈', '🥉'];

  let msg = `📊 *AXIARCH DAILY PICKS*\n${date}\n\n`;

  top10.forEach((pick, i) => {
    const medal = i < 3 ? medals[i] : `#${i + 1}`;
    const sources = pick.sources.join(', ');
    msg += `${medal} *$${pick.ticker}* — Score ${pick.score}/50\n`;
    msg += `    Sources: ${sources}\n`;
    if (i < 5) {
      msg += `    Signal: ${pick.signal}\n`;
    }
    msg += '\n';
  });

  msg += '━━━━━━━━━━━━━━━━━━━━\n\n';

  if (stats) {
    msg += `📈 *Win Rate:* ${stats.winRate}% | *Avg Return:* +${stats.avgReturn}%\n`;
    if (stats.bestPick) {
      msg += `🏆 *Best Pick:* $${stats.bestPick.ticker} +${stats.bestPick.pct}% (${stats.bestPick.date})\n`;
    }
    msg += `😱 *Fear & Greed:* ${stats.fearGreed} (${stats.fearGreedLabel})\n\n`;
  }

  msg += `🔗 [View Live Screener](https://axiarch.netlify.app/screener)\n`;
  msg += `📡 Powered by Axiarch Algorithm`;

  return msg;
}

async function sendTelegramMessage(token, chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  });

  const result = await resp.json();
  if (!result.ok) {
    throw new Error(`Telegram API error: ${result.description}`);
  }
  return result;
}

// Manual test endpoint — hit /.netlify/functions/telegram-test to send a test message
exports.handler = async (event) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;

  if (!token || !chatId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Missing env vars',
        needed: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHANNEL_ID'],
        help: 'Set these in Netlify Dashboard > Site configuration > Environment variables',
      }),
    };
  }

  try {
    const picksPath = path.resolve(__dirname, '../../picks.json');
    const picksData = JSON.parse(fs.readFileSync(picksPath, 'utf8'));

    const message = formatPicksMessage(picksData);
    const result = await sendTelegramMessage(token, chatId, message);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: `Test message sent to ${chatId}`,
        telegramResponse: result,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
