# Deployment

This repository is deployed as a static site with one Vercel serverless function.

## Platform assumptions

- Hosting: Vercel
- Primary domain: `www.tarmacsync.com`
- API route: `api/report-download.js`
- Email delivery: Brevo

## Required environment variables

Set these in Vercel for Preview and Production:

- `BREVO_API_KEY`
- `BREVO_REPORT_LIST_ID`
- `BREVO_REPORT_TEMPLATE_ID`
- `BREVO_SENDER_EMAIL`
- `REPORT_TEST_EMAIL`
- `REPORT_PUBLIC_DELIVERY_ENABLED` (must remain `false` until Omar approves launch)

Legacy Resend/Zoho variables may remain for rollback reference but are not used by the homepage report flow.

Expected behavior:

- Missing variables cause the report endpoint to return `503`.
- Invalid origin causes the report endpoint to return `403`.
- Public delivery remains server-blocked unless `REPORT_PUBLIC_DELIVERY_ENABLED=true`.
- When disabled, only the exact allowlisted test address in `REPORT_TEST_EMAIL` can proceed.

## Pre-deploy checklist

1. Review `index.html`, `privacy.html`, and `terms.html`.
2. Confirm the canonical domain is still `https://www.tarmacsync.com/`.
3. Confirm `og:image` and favicon paths exist.
4. Confirm `robots.txt` and `sitemap.xml` still match the live domain.
5. If legal copy changed, update the effective date in the page body.
6. If report flow changed, verify `api/report-download.js` still validates:
   - method
   - origin
   - payload shape
   - honeypot field
   - required env vars
   - allowlisted test recipient
   - duplicate suppression

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
5. Report submission succeeds only with the allowlisted test email.
6. A repeated report request is suppressed.
7. `robots.txt` is reachable.
8. `sitemap.xml` is reachable.
9. Schema markup is still present in the home page source.

## Search operations

After important public-page changes:

1. Confirm the sitemap is current.
2. Submit or resubmit the sitemap in Google Search Console.
3. Use URL Inspection for the homepage if immediate re-crawl is needed.

## Rollback

If a deployment breaks the public site or report flow:

1. Roll back to the previous known-good Vercel deployment.
2. Verify the report endpoint with the allowlisted test submission.
3. Check whether the issue was content-only, asset-path-related, or env-related.
4. Redeploy only after reproducing and fixing the issue locally.

