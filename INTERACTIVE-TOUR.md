# Demo tour

`/tour.html` is a scripted walkthrough of one fictional airport purchase. It is not live AI,
not a second procurement engine, and it takes no input. Everything shown is illustrative: the
airport and its documents are invented and labeled fictional on the page. No vendor or contract
is named.

## What a visitor sees

A chat and a live Project file, autoplaying for about two minutes: a small-hub Part 139 airport
replaces a snow-and-ice runway broom with AIP and a local match, before applying for the grant.
TarmacSync asks the question that decides eligibility, explains the grant timing, reads four
documents (flagging a $610,000 vs $650,000 difference and an out-of-date Form 5100-141), lays out
sealed competitive bidding and the Handbook's key steps (Table 5-4: advertise, open bids, grant
application with actual bid amounts, grant acceptance, award), covers what happens if only one bid
arrives or bids exceed the budget, and produces four review drafts.

The scenario deliberately avoids a cooperative contract: whether one satisfies AIP depends on how
the base contract was solicited, which a two-minute demo cannot settle honestly. Controls: pause, restart, scrubber with jump
points, 0.75x/1x/1.5x speed, skip to end, full transcript.

## Continuity with the homepage

The demo is the second half of "How TarmacSync works", not a separate product.

- **Same five stages, same words.** `stages` in `tour-script.js` (START · Describe the need,
  UNDERSTAND · Apply context, ROUTE · Find the path, CHECK · Validate the route, READY · Build
  the record) must match the workflow section in `index.html`. A test in
  `scripts/tour-content-check.cjs` compares them, so editing one without the other fails.
  The demo shows them as a tracker above the chat, and the Project file's Phase uses them.
- **One name at every entry point:** "Watch the 2-minute demo" on the hero button, the link under
  the vision film, the demo section, and the bridge at the end of "How TarmacSync works". All use
  `data-tour-cta` (hero, vision, section, workflow) so `funnel-analytics.js` records
  `interactive_tour_click`. A test enforces the name and the link.
- **Hand-back:** the demo header carries the same "Get the free report" CTA as the site header;
  the finish card links to the report, to booking, back to "How TarmacSync works", and offers
  "Watch again".
- The old static example section on the homepage (`#sample-snapshot`, the $180,000 sweeper) was
  removed in favour of the demo section (`#interactive-demo`). A separate sample remains on
  `procurement-support-packet.html`.

## Files

- `assets/tour/tour-script.js` copy, citations, documents, the bid-sequence table, drafts. Edit copy here.
- `assets/tour/tour-state.js` pure timeline and `stateAt(script, ms)`.
- `assets/tour/tour-ui.js` rendering, player, dialogs, analytics events.
- `assets/tour/tour.css`, `tour.html`.
- `scripts/tour-content-check.cjs` copy and timeline guards (Node only).
- `scripts/tour-check.cjs` browser behavior (Playwright).

## Editing rules

- Say TarmacSync. Never the internal codename.
- Every regulatory statement needs a citation id in `citations`, at most three chips per reply.
- Paraphrase only. Cite 2 CFR 200 by section, not paragraph letter.
- The Handbook edition on file shows a stale simplified acquisition threshold ($150,000); the
  current federal figure is $350,000. The copy flags the difference; do not remove that note.
- No vendor selection, award or fund obligation. Do not state rules the sources don't contain
  (for example, there is no Handbook rule for bids over the estimate; the copy states only what
  2 CFR 200.320, Table U-8, Table 3-67 and §3-105 support).
- Do not add real airport, consortium or vendor names. The content check has a denylist.
- Mobile: keep every tap target at least 44px on phones, and keep `.scroller` `position:relative`.
  Without it the table's screen-reader-only caption escapes the scroll pane and leaves a long blank
  scroll after the finish (the browser test "no phantom scroll" guards this). Full-page screenshots
  resize the viewport, which distorts `dvh` layouts, so measure `scrollHeight` instead of trusting one.

## Run the checks

    python3 -m http.server 8094 --bind 127.0.0.1
    # in another terminal
    BASE_URL=http://127.0.0.1:8094 npm run test:tour
    BASE_URL=http://127.0.0.1:8094 PAGES="tour.html" npm run a11y

## Before this goes in front of buyers

Re-verify against current text: 49 USC 47109 (federal share), 2 CFR 200.320 and 200.323, the
federal simplified acquisition threshold, the Grant Assurance numbering in the airport's grant
agreement, and the current advisory circular editions. Then have an airport procurement
professional read the copy against the Handbook citations.

## Deployment

Preview only. Do not alias to production without a separate release decision. The first-pass
tour is kept by the maintainer outside this repository.
