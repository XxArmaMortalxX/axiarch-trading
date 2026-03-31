/**
 * Netlify Function: subscribe.js
 * Captures email signups → adds to HubSpot CRM as contacts
 */
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let email;
  try {
    const body = JSON.parse(event.body || '{}');
    email = body.email?.trim().toLowerCase();
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!email || !email.includes('@')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email' }) };
  }

  const MATON_KEY = process.env.MATON_API_KEY;
  const HUB_CONN = process.env.HUBSPOT_CONN_ID || 'eb372eba-d569-4945-b567-acfd4daeb01f';

  try {
    // Check if contact already exists
    const searchRes = await fetch('https://gateway.maton.ai/hubspot/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MATON_KEY}`,
        'Content-Type': 'application/json',
        'X-Maton-Connection-Id': HUB_CONN
      },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }]
      })
    });
    const searchData = await searchRes.json();

    if (searchData?.results?.length > 0) {
      // Already subscribed — update their status
      await fetch(`https://gateway.maton.ai/hubspot/crm/v3/objects/contacts/${searchData.results[0].id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${MATON_KEY}`,
          'Content-Type': 'application/json',
          'X-Maton-Connection-Id': HUB_CONN
        },
        body: JSON.stringify({ properties: { hs_lead_status: 'IN_PROGRESS', lifecyclestage: 'subscriber' } })
      });
      return { statusCode: 200, body: JSON.stringify({ ok: true, existing: true }) };
    }

    // Create new contact
    const createRes = await fetch('https://gateway.maton.ai/hubspot/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MATON_KEY}`,
        'Content-Type': 'application/json',
        'X-Maton-Connection-Id': HUB_CONN
      },
      body: JSON.stringify({
        properties: {
          email,
          hs_lead_status: 'NEW',
          lifecyclestage: 'subscriber',
          source: 'axiarchtrading.netlify.app',
          jobtitle: 'Retail Trader',
          hs_content_membership_notes: 'Signed up for free pre-market picks via axiarchtrading.netlify.app'
        }
      })
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('HubSpot error:', err);
      return { statusCode: 200, body: JSON.stringify({ ok: true, note: 'fallback' }) };
    }

    const contact = await createRes.json();
    console.log('New subscriber:', email, '| HubSpot ID:', contact.id);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, id: contact.id })
    };
  } catch (err) {
    console.error('Subscribe error:', err.message);
    // Return 200 anyway — don't show errors to users
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }
};
