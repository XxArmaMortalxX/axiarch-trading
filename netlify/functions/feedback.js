const { getStore } = require('@netlify/blobs');
function getBlobStore(name) { const s = process.env.NETLIFY_SITE_ID, t = process.env.NETLIFY_BLOBS_TOKEN; return (s && t) ? getStore({ name, siteID: s, token: t }) : getStore(name); }

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  if (event.httpMethod === 'POST') {
    try {
      const { name, message, type } = JSON.parse(event.body || '{}');

      if (!message || message.trim().length < 3) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message is required (min 3 chars)' }) };
      }
      if (message.length > 1000) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message too long (max 1000 chars)' }) };
      }

      const store = getBlobStore('feedback');
      let feedbackList;
      try { feedbackList = await store.get('posts', { type: 'json' }); } catch { feedbackList = null; }
      if (!feedbackList || !feedbackList.posts) feedbackList = { posts: [] };

      const post = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: (name || '').trim().slice(0, 50) || 'Anonymous',
        message: message.trim().slice(0, 1000),
        type: ['feature', 'bug', 'praise', 'question'].includes(type) ? type : 'feedback',
        timestamp: new Date().toISOString(),
        upvotes: 0,
      };

      feedbackList.posts.unshift(post);

      // Keep last 200 posts
      if (feedbackList.posts.length > 200) feedbackList.posts = feedbackList.posts.slice(0, 200);

      await store.setJSON('posts', feedbackList);

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, post }) };
    } catch (err) {
      console.error('Feedback submit error:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to submit feedback' }) };
    }
  }

  // GET — return all feedback
  if (event.httpMethod === 'GET') {
    try {
      const store = getBlobStore('feedback');
      let feedbackList;
      try { feedbackList = await store.get('posts', { type: 'json' }); } catch { feedbackList = null; }
      if (!feedbackList || !feedbackList.posts) feedbackList = { posts: [] };

      return {
        statusCode: 200,
        headers: { ...headers, 'Cache-Control': 'public, max-age=30' },
        body: JSON.stringify(feedbackList),
      };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};
