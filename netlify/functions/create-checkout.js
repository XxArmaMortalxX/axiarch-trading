const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRO_PRICE_ID) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID env vars.' }),
    };
  }

  try {
    const { email } = JSON.parse(event.body || '{}');

    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.URL || 'https://axiarch.netlify.app'}/pricing?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${process.env.URL || 'https://axiarch.netlify.app'}/pricing?status=cancelled`,
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 7,
      },
    };

    // Pre-fill email if provided
    if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url, sessionId: session.id }),
    };
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
