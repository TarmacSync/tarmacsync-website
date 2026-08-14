# TarmacSync Website

Static marketing site and waitlist endpoint for `tarmacsync.com`.

This repository is intentionally small. It contains the public landing page, legal pages, search/indexing assets, brand assets, and a single serverless endpoint that forwards waitlist submissions through Resend.

## What is in this repo

- `index.html` - primary landing page
- `privacy.html` - privacy policy page
- `terms.html` - terms of service page
- `assets/` - logos, favicon, social preview image, founder image
- `robots.txt` - crawler directives
- `sitemap.xml` - sitemap for search engines
- `api/waitlist.js` - Vercel serverless function for the waitlist form

## Stack

- Static HTML/CSS/vanilla JavaScript
- Vercel for hosting and serverless functions
- Resend for waitlist email delivery

No framework, bundler, or package manager is required for this site in its current form.

## Local development

Because this repo uses a Vercel-style `api/` route, the simplest way to run it locally is with the Vercel dev server.

Prerequisites:

- Node.js 18+ recommended
- Vercel CLI installed or runnable through `npx`

Run locally:

```bash
vercel dev
```

Then open:

```text
http://127.0.0.1:3000
```

If you only need to inspect the static pages, you can also serve the folder with any static server, but the waitlist form will not work unless the API route is running in a Vercel-compatible environment.

## Environment variables

The waitlist endpoint requires:

- `RESEND_API_KEY`
- `WAITLIST_FROM_EMAIL`
- `WAITLIST_TO_EMAIL`

Optional:

- `CONFIRMATION_FROM_EMAIL` (defaults to `hello@tarmacsync.com`; sends applicant confirmation)
- `ZOHO_XNQSJSDP` and `ZOHO_XMIWTLD` — Zoho CRM Web-to-Lead form parameters

Behavior:

- If any of these are missing, `api/waitlist.js` returns `503`.
- The endpoint validates request origin against the current host.
- A honeypot field (`website`) is used to ignore obvious spam bots.

## Waitlist flow

1. Visitor submits the waitlist form.
2. Browser sends `POST /api/waitlist`.
3. The endpoint validates method, origin, payload shape, and email format.
4. The endpoint sends a plain-text message through Resend to the internal team.
5. The endpoint sends a confirmation email to the applicant from `hello@tarmacsync.com`.
6. If Zoho Web-to-Lead env vars are set, the lead is forwarded to Zoho CRM (best-effort).
7. The endpoint returns JSON success or failure.

## Deployment

This repo is intended for Vercel deployment.

Minimum production checklist:

1. Set the three waitlist environment variables in Vercel.
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

