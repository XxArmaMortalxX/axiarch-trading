# Axiarch Site — Setup Guide

## Auto-Deploy via GitHub Actions

For automatic deploys on every push, add one GitHub secret:

1. Go to: https://github.com/XxArmaMortalxX/axiarch-trading/settings/secrets/actions
2. Click **New repository secret**
3. Name: `NETLIFY_AUTH_TOKEN`
4. Value: Get from https://app.netlify.com/user/applications → Personal access tokens

That's it. Every push to `main` auto-deploys to https://axiarchtrading.netlify.app

## Email Signup → HubSpot

The `netlify/functions/subscribe.js` function captures emails and adds them to HubSpot.

Set these env vars in Netlify dashboard (Site settings → Environment variables):
- `MATON_API_KEY` — your Maton API key
- `HUBSPOT_CONN_ID` — `eb372eba-d569-4945-b567-acfd4daeb01f`

## Daily Auto-Update

`site-updater.js` (in the workspace) runs automatically at 9:05 AM ET Mon–Fri via Windows Task Scheduler:
- Rebuilds `picks.json` from latest research data
- Commits + pushes to GitHub
- Triggers Netlify deploy

The site shows fresh picks every morning automatically.

## Manual Commands

```bash
# Run research bots manually
node research-bots/run-all.js

# Update site manually
node site-updater.js

# Send Telegram picks post
node telegram-scheduler.js --morning

# Send Gmail digest
node gmail-digest.js --fresh
```
