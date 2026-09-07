# Website credibility, conversion, and SEO review

Reviewed September 7, 2026. Local baseline: `website-improvement-2026-09-06`, commit `d0ddc40`.

## Recommendation

Keep the report-first acquisition strategy and the existing visual design. The revised branch is ready for a hosted Preview check. Production release still needs hosted verification of report delivery, booking, and analytics. No conversion-rate improvement is claimed without measured visitor outcomes.

## Implemented in this review

- Hero explains that TarmacSync brings procurement intelligence to U.S. airports and names policy, funding, contracts, and the next action.
- Pre-launch disclosure remains visible, with shorter wording.
- Product explanation has a proper H2 and recognizes unknown cost as a valid starting point.
- Illustrative purchase has a clearer headline and fewer repetitive caveats; its manually prepared status and unverified sources remain explicit.
- The contextual conversation link no longer silently assigns the visitor to the Field tier.
- Prices remain unchanged. Pricing metadata now describes annual budget planning and the $2,400 starting price.
- Removed fixed passenger ranges presented alongside FAA category labels. The pricing FAQ links to FAA category definitions and explains that hub categories use a share of national enplanements.
- Sitemap modification dates updated for the two changed content pages only.
- Fixed booking footer overflow with wrapping and added an accessible label to the mobile back link.

## Verification completed

- Browser metadata review: 17 content pages have a title, description, canonical URL, English language attribute, and exactly one H1. Google verification file and redirect stubs are not content pages.
- Homepage structured data parses successfully; loaded images have no broken resources across those content pages.
- Homepage, pricing, booking, and trust page pass the existing geometry, text-spacing, keyboard, and menu checks at the suite's 320/375/768/1280/1440 widths.
- The audit command still exits nonzero solely because the local static server returns 404 for Vercel's injected analytics endpoint. This is not reported as a fully green hosted audit.
- Responsive screenshots captured at 375/768/1440 for homepage, pricing, and booking. Reduced motion used for full-page capture to expose content without scroll animation timing artifacts.
- Booking overflow reproduced at 320 pixels with normal and increased text spacing; neither overflow remains after the fix.
- Expanded example opens correctly. Follow-up consent remains unchecked and optional.
- All four pricing query parameters display the matching name and annual price on the booking page.
- No page JavaScript exceptions in the responsive browser pass.
- `git diff --check` passes.

## Scope and release checks

No forms submitted, meetings booked, or production changes published in this review. Browser rendering is not a WCAG certification. End-to-end email delivery, external booking completion, field performance, indexing, and conversion measurement were not exercised.

Use Vercel Preview to verify the real analytics asset, report endpoint and delivery, booking destination, and responsive presentation before promoting. Keep claims about released functionality aligned with the actual evaluation scope. Existing secondary pages need ongoing product-availability review as features ship.

The highest-value next marketing evidence is a consented airport evaluation showing one purchase, the sources checked, the correction made, and the next useful action. Do not invent customer logos, savings, testimonials, or successful outcomes to fill that gap.

## Sources for factual corrections

- FAA category definitions: https://www.faa.gov/airports/planning_capacity/categories
- Google sitemap and accurate modification dates: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Live homepage and pricing inspected: https://www.tarmacsync.com/ and https://www.tarmacsync.com/pricing.html

Screenshots and temporary audit utilities: `/private/tmp/tarmacsync-website-review/`.
