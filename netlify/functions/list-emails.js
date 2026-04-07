const { getStore } = require('@netlify/blobs');
function getBlobStore(name) { const s = process.env.NETLIFY_SITE_ID, t = process.env.NETLIFY_BLOBS_TOKEN; return (s && t) ? getStore({ name, siteID: s, token: t }) : getStore(name); }

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  // Simple auth: require a secret key in the query string
  const key = (event.queryStringParameters || {}).key;
  if (key !== process.env.ADMIN_KEY) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const store = getBlobStore('emails');
  let emailList;
  try {
    emailList = await store.get('subscribers', { type: 'json' });
  } catch {
    emailList = { emails: [] };
  }

  if (!emailList || !emailList.emails) emailList = { emails: [] };

  // Sort newest first
  emailList.emails.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const format = (event.queryStringParameters || {}).format;

  // CSV export
  if (format === 'csv') {
    const csv = 'email,source,timestamp\n' + emailList.emails.map(e => `${e.email},${e.source},${e.timestamp}`).join('\n');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="axiarch-emails.csv"' },
      body: csv,
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      total: emailList.emails.length,
      emails: emailList.emails,
    }),
  };
};
