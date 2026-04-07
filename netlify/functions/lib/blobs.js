const { getStore } = require('@netlify/blobs');

// Helper to get a Netlify Blobs store that works with manual deploys.
// When deployed via `netlify deploy --dir=dist`, the Blobs environment
// isn't auto-configured, so we pass siteID and token explicitly.
function getBlobStore(name) {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_TOKEN;

  if (siteID && token) {
    return getStore({ name, siteID, token });
  }

  // Fallback: works when deployed via Netlify's build system
  return getStore(name);
}

module.exports = { getBlobStore };
