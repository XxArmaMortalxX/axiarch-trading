const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Stripe not configured' }) };
  }

  const { session_id } = event.queryStringParameters || {};

  if (!session_id) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'session_id required' }),
    };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription', 'customer'],
    });

    const sub = session.subscription;
    const customer = session.customer;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: sub?.status || 'none',
        plan: 'pro',
        customerId: customer?.id || null,
        customerEmail: customer?.email || session.customer_email || null,
        currentPeriodEnd: sub?.current_period_end || null,
        cancelAtPeriodEnd: sub?.cancel_at_period_end || false,
      }),
    };
  } catch (err) {
    console.error('Subscription check error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
