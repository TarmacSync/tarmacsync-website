# Deployment

This repository is deployed as a static site with one Vercel serverless function.

## Platform assumptions

- Hosting: Vercel
- Primary domain: `www.tarmacsync.com`
- API route: `api/waitlist.js`
- Email delivery: Resend

## Required environment variables

Set these in Vercel for Preview and Production:

- `RESEND_API_KEY`
- `WAITLIST_FROM_EMAIL`
- `WAITLIST_TO_EMAIL` (should be `hello@tarmacsync.com` or your internal notification address)

Optional — the waitlist still works without them, but extra integrations won't activate:

- `CONFIRMATION_FROM_EMAIL` (defaults to `hello@tarmacsync.com`; used as the From address for the applicant confirmation email)
- `ZOHO_XNQSJSDP` — Zoho Web-to-Lead form parameter 1
- `ZOHO_XMIWTLD` — Zoho Web-to-Lead form parameter 2

Expected behavior:

- Missing variables cause the waitlist endpoint to return `503`.
- Invalid origin causes the waitlist endpoint to return `403`.

## Pre-deploy checklist

1. Review `index.html`, `privacy.html`, and `terms.html`.
2. Confirm the canonical domain is still `https://www.tarmacsync.com/`.
3. Confirm `og:image` and favicon paths exist.
4. Confirm `robots.txt` and `sitemap.xml` still match the live domain.
5. If legal copy changed, update the effective date in the page body.
6. If waitlist flow changed, verify `api/waitlist.js` still validates:
   - method
   - origin
   - payload shape
   - honeypot field
   - required env vars

## Deploy flow

Typical Vercel flow:

```bash
vercel
vercel --prod
```

If the project is already linked, Preview deploys should happen automatically through Git integration.

## Post-deploy verification

Check these items in the live deployment:

1. Home page loads correctly on desktop and mobile.
2. Privacy and terms pages load directly.
3. Favicon and OG preview image resolve.
4. Waitlist submission succeeds with a real test email.
5. `robots.txt` is reachable.
6. `sitemap.xml` is reachable.
7. Schema markup is still present in the home page source.

## Search operations

After important public-page changes:

1. Confirm the sitemap is current.
2. Submit or resubmit the sitemap in Google Search Console.
3. Use URL Inspection for the homepage if immediate re-crawl is needed.

## Rollback

If a deployment breaks the public site or waitlist flow:

1. Roll back to the previous known-good Vercel deployment.
2. Verify the waitlist endpoint with a test submission.
3. Check whether the issue was content-only, asset-path-related, or env-related.
4. Redeploy only after reproducing and fixing the issue locally.

