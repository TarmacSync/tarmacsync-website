# Contributing

This repository is small on purpose. Keep changes narrow, readable, and easy to review.

## Working principles

- Prefer direct HTML/CSS edits over introducing abstractions.
- Preserve the existing visual language unless the task explicitly calls for a redesign.
- Avoid adding dependencies, build tooling, or framework migration without a clear approved reason.
- Keep marketing copy aligned with the current product position and pilot stage.
- Do not turn this repo into the application repo. The website should stay lightweight.

## Change types that belong here

- Landing page messaging and CTA updates
- Legal page updates
- Metadata and SEO improvements
- Waitlist form improvements
- Brand asset updates
- Search indexing files such as `robots.txt` and `sitemap.xml`

## Change types that do not belong here

- Pathfinder product logic
- Dashboard or authenticated app features
- Procurement intelligence code
- Large content libraries or internal documentation

Those belong in the main TarmacSync application repository.

## Recommended workflow

1. Create a branch.
2. Make the smallest change that solves the problem.
3. Test locally with `vercel dev` when the API route is involved.
4. Review the pages manually in a browser.
5. Verify form submission behavior if the waitlist flow changed.
6. Open a PR with screenshots when the UI changed.

## Content review checklist

- The headline is clear in the first screenful.
- CTAs match the current go-to-market stage.
- The copy does not overclaim product readiness or regulatory authority.
- Legal pages and waitlist messaging stay consistent.
- Links, canonical URLs, and metadata are correct.

## Technical review checklist

- No broken asset paths
- No malformed HTML
- No mixed-content or hardcoded localhost URLs
- No secrets committed to the repo
- No dependency added without approval
- No silent changes to legal text without date updates

