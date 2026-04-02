// Netlify Function: Email Subscription Handler
// Stores emails in environment variable or sends to webhook

exports.handler = async (event, context) => {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, source = 'website' } = JSON.parse(event.body);
    
    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Valid email required' })
      };
    }

    // Log the signup
    console.log('Email signup:', email, 'from', source);
    
    // Option 1: Send to Maton webhook (if configured)
    const MATON_WEBHOOK = process.env.MATON_WEBHOOK_URL;
    if (MATON_WEBHOOK) {
      await fetch(MATON_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          source,
          timestamp: new Date().toISOString(),
          event: 'axiarch_signup'
        })
      });
    }
    
    // Option 2: Send to HubSpot (if configured)
    const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
    if (HUBSPOT_TOKEN) {
      await fetch('https://api.hubapi.com/contacts/v1/contact/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: [
            { property: 'email', value: email },
            { property: 'axiarch_source', value: source },
            { property: 'axiarch_signup_date', value: new Date().toISOString() }
          ]
        })
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Subscribed! Check your email for confirmation.' 
      })
    };
    
  } catch (error) {
    console.error('Subscription error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Subscription failed. Please try again.' })
    };
  }
};