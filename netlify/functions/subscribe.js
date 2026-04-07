// Netlify Function: Email Subscription Handler
// Stores emails in Netlify Blobs + optional webhook forwarding

const { getBlobStore } = require('./lib/blobs');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { email, source = 'website' } = JSON.parse(event.body);

    if (!email || !email.includes('@')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Valid email required' }) };
    }

    const entry = {
      email,
      source,
      timestamp: new Date().toISOString(),
    };

    // Store in Netlify Blobs (persistent)
    const store = getBlobStore('emails');
    let emailList;
    try {
      emailList = await store.get('subscribers', { type: 'json' });
    } catch {
      emailList = { emails: [] };
    }
    if (!emailList || !emailList.emails) emailList = { emails: [] };

    // Avoid duplicates
    if (!emailList.emails.some(e => e.email === email)) {
      emailList.emails.push(entry);
      await store.setJSON('subscribers', emailList);
      console.log(`New subscriber: ${email} (source: ${source}) — total: ${emailList.emails.length}`);
    } else {
      console.log(`Duplicate subscriber skipped: ${email}`);
    }

    // Optional: forward to webhook if configured
    const MATON_WEBHOOK = process.env.MATON_WEBHOOK_URL;
    if (MATON_WEBHOOK) {
      await fetch(MATON_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entry, event: 'axiarch_signup' }),
      }).catch(() => {});
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Subscribed!' }),
    };
  } catch (error) {
    console.error('Subscription error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Subscription failed. Please try again.' }) };
  }
};