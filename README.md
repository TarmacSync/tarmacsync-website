# TarmacSync Website

Static marketing site and waitlist endpoint for `tarmacsync.com`.

This repository is intentionally small. It contains the public landing page, legal pages, search/indexing assets, brand assets, the approved Airport Infrastructure Delivery Gap report, and a guarded report-request serverless endpoint using Brevo.

## What is in this repo

- `index.html` - primary landing page
- `privacy.html` - privacy policy page
- `terms.html` - terms of service page
- `assets/` - logos, favicon, social preview image, founder image
- `robots.txt` - crawler directives
- `sitemap.xml` - sitemap for search engines
- `functions/api/report-download.js` - guarded Cloudflare Pages Function for report requests and Brevo delivery
- `_redirects` - retired-page redirects; `scripts/build-pages.cjs` builds `dist/` and its `_headers`

## Stack

- Static HTML/CSS/vanilla JavaScript
- Cloudflare Pages for hosting and the function
- Brevo for report delivery and future consented nurture

No framework, bundler, or package manager is required for this site in its current form.

## Local development

Run the built site and the function together with Wrangler:

```bash
npm run build
npx wrangler pages dev dist
```

Then open the URL it prints (default `http://127.0.0.1:8788`). Put local values for the report
variables in `.dev.vars` (ignored by git) if you need the form to reach Brevo.

If you only need to inspect the static pages, any static server works; the report form will not.

## Environment variables

The report endpoint requires:

- `BREVO_API_KEY`
- `BREVO_REPORT_LIST_ID`
- `BREVO_REPORT_TEMPLATE_ID`
- `BREVO_SENDER_EMAIL`
- `REPORT_TEST_EMAIL`
- `REPORT_PUBLIC_DELIVERY_ENABLED`

Optional:

- `CONFIRMATION_FROM_EMAIL` (defaults to `hello@tarmacsync.com`; sends applicant confirmation)
- `ZOHO_XNQSJSDP` and `ZOHO_XMIWTLD` — Zoho CRM Web-to-Lead form parameters

Behavior:

- If any of these are missing, `api/report-download.js` returns `503`.
- The endpoint validates request origin against the current host.
- A honeypot field (`website`) is used to ignore obvious spam bots.

## Report-request flow

1. Visitor requests The Airport Infrastructure Delivery Gap report.
2. Browser sends `POST /api/report-download`.
3. The endpoint validates method, origin, payload, email, honeypot, and the server-side launch gate.
4. While public delivery is disabled, only `REPORT_TEST_EMAIL` is accepted.
5. Brevo sends the transactional report email and adds the contact to the dedicated report list only after successful delivery.
6. Repeat requests for a delivered address return `already-delivered` and do not send again.
7. Follow-up consent is stored separately and is not implied by report delivery.

## Deployment

This repo deploys to Cloudflare Pages; see `DEPLOYMENT.md`.

Minimum production checklist:

1. Set the report/Brevo environment variables as secrets on the Pages project.
2. Confirm the production domain is `https://www.tarmacsync.com`.
3. Verify `robots.txt` and `sitemap.xml` match the live canonical domain.
4. Submit the sitemap in Google Search Console after deployment.
5. Smoke test the waitlist form in Preview and Production.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the operational checklist.

## Editing guidance

- Keep the site static unless there is a clear reason to add application complexity.
- Preserve canonical URLs, Open Graph tags, favicon paths, and schema markup.
- Treat legal pages as controlled content. Update effective dates intentionally.
- Avoid adding build tools, frameworks, or dependencies unless there is a concrete operational benefit.

## QA checklist

Before publishing changes:

1. Open `index.html`, `privacy.html`, and `terms.html` in a browser.
2. Check mobile and desktop layout.
3. Verify logo, favicon, and OG image paths.
4. Submit a real or test waitlist entry in Preview.
5. Confirm the API returns a meaningful error when env vars are missing.
6. Confirm canonical, title, description, and structured data still match the product.
7. Confirm `robots.txt` and `sitemap.xml` still point to the correct domain.

## Accessibility checks

A reusable accessibility sweep lives in `scripts/a11y-sweep.cjs`. It runs the
mechanical checks that an automated axe scan cannot cover:

- Horizontal overflow at 320/375/768/1280/1440px (WCAG 1.4.10 reflow)
- Skip-link keyboard behavior (WCAG 2.4.1 bypass blocks)
- WCAG 1.4.12 text-spacing override (no overflow)
- Forced-colors / high-contrast rendering
- Mobile-menu keyboard activation (`aria-expanded` + `aria-controls`)
- Console / page errors

It serves the repo on a built-in static server, or you can point `BASE_URL` at a
deployed host. It requires Playwright as a dev-only dependency:

```bash
npm install
npm run a11y                                      # sweep every page locally
BASE_URL=https://www.tarmacsync.com npm run a11y  # sweep a deployed host
PAGES="index.html,pricing.html" npm run a11y      # sweep a subset
```

Exits 0 when every check passes; exits 1 and prints a JSON report when any check
fails. The Playwright dependency is development-only and does not affect the
shipped static site.

## Housekeeping docs

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [SECURITY.md](./SECURITY.md)

