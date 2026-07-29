# Security

## Scope

This repository contains a public marketing site and a waitlist submission endpoint.

It does not contain the authenticated TarmacSync application. Security expectations should match that scope.

## Sensitive areas

- `api/waitlist.js`
- Vercel environment variables
- Brand/domain metadata that affects phishing or impersonation risk

## Current protections

The waitlist endpoint currently includes:

- Method restriction to `POST`
- Basic same-origin validation using `Origin` and host headers
- Payload-shape validation
- Email-format validation
- Honeypot spam field
- No-store cache headers

## Operational rules

- Never commit API keys or email credentials.
- Keep `RESEND_API_KEY`, `WAITLIST_FROM_EMAIL`, and `WAITLIST_TO_EMAIL` in Vercel environment variables only.
- Do not widen CORS behavior without a clear reason.
- Do not add third-party scripts casually; every external script expands the trust boundary.
- Treat legal and metadata changes as production-sensitive because they affect public trust.

## Reporting

If you discover a security issue, report it privately to:

`contact@tarmacsync.com`

Do not open a public issue for an unpatched vulnerability.

