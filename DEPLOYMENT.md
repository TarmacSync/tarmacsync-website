# Deployment

This repository is deployed as a static site with one Cloudflare Pages Function, on Cloudflare
Pages (free plan). It moved from Vercel in October 2026.

## Platform assumptions

- Hosting: Cloudflare Pages, project `tarmacsync-website`
- Primary domain: `www.tarmacsync.com`; `tarmacsync.com` redirects to it with a zone Redirect Rule
  (Pages `_redirects` cannot match on host)
- Function: `functions/api/report-download.js`, served at `/api/report-download`
- Email delivery: Brevo
- Analytics: Cloudflare Web Analytics, enabled on the Pages project (no script tag in the pages)

## What is deployed

`npm run build` copies an allowlist of public files (every `.html`, `assets/`, `robots.txt`,
`sitemap.xml`, `_redirects`) into `dist/` and writes `dist/_headers`. Docs, markdown, scripts and
config are never uploaded. Functions deploy from `functions/`.

Cloudflare Pages serves `/pricing` from `pricing.html` and redirects `/pricing.html` to `/pricing`
by default. No single file may exceed 25 MiB.

## Required environment variables

Set these on the Pages project (Settings → Variables and Secrets), Production, as **secrets**:

- `BREVO_API_KEY`
- `BREVO_REPORT_LIST_ID`
- `BREVO_REPORT_TEMPLATE_ID`
- `BREVO_SENDER_EMAIL`
- `BREVO_WEEKLY_LIST_ID` (optional; enables the weekly list)
- `REPORT_TEST_EMAIL`
- `REPORT_PUBLIC_DELIVERY_ENABLED` (must remain `false` until Omar approves launch)

Expected behavior:

- Missing variables cause the report endpoint to return `503`.
- Invalid origin causes the report endpoint to return `403`.
- Public delivery remains server-blocked unless `REPORT_PUBLIC_DELIVERY_ENABLED=true`.
- When disabled, only the exact allowlisted test address in `REPORT_TEST_EMAIL` can proceed.

## Pre-deploy checklist

1. Run `npm run test:site`, `npm run test:functions`, `npm run test:tour` and `npm run test:copy`.
2. Review `index.html`, `privacy.html`, and `terms.html`.
3. Confirm the canonical domain is still `https://www.tarmacsync.com/`.
4. Confirm `og:image` and favicon paths exist.
5. Confirm `robots.txt` and `sitemap.xml` still match the live domain.
6. If legal copy changed, update the effective date in the page body.
7. If the report flow changed, confirm `functions/api/report-download.js` still validates method,
   origin, payload shape, honeypot field, required env vars, allowlisted test recipient, and
   duplicate suppression. `scripts/functions-check.mjs` covers most of these.

## Deploy flow

```bash
npx wrangler login                 # once per machine
npm run build
npx wrangler pages deploy dist --project-name tarmacsync-website --branch main
```

`--branch main` publishes to production; any other branch name gives a preview URL on
`*.tarmacsync-website.pages.dev`.

## Post-deploy verification

Check these items in the live deployment:

1. Home page loads correctly on desktop and mobile.
2. Privacy and terms pages load directly.
3. Favicon and OG preview image resolve.
4. `https://tarmacsync.com/pricing` redirects to `https://www.tarmacsync.com/pricing`.
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

1. In the Pages project's Deployments list, roll back to the previous known-good deployment.
2. Verify the report endpoint with the allowlisted test submission.
3. Check whether the issue was content-only, asset-path-related, or env-related.
4. Redeploy only after reproducing and fixing the issue locally.
