#!/usr/bin/env node
// Writing rules for tarmacsync.com, enforced. A page joins REVIEWED once its copy has been refined;
// from then on it cannot drift back into noise. Run: node scripts/copy-check.cjs
//
// The rules:
//  1. Say it once. A disclosure ("pre-launch", "no project details required") appears once per page,
//     where it matters, not in every section.
//  2. A caveat sits next to the claim it qualifies. Section-wide footnotes that hedge everything above
//     them ("coverage depends on…", "check current text") are removed.
//  3. No sentence is repeated on the same page.
//  4. The product's language rules still apply: never "compliant", "approved", "guaranteed" or
//     "final determination"; cooperative contracts are candidates. (Pinned in tour-content-check too.)
//  5. One example story: the homepage uses the demo's purchase (a runway broom with AIP + local match).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const REVIEWED = ['index.html', 'pricing.html', 'book-a-call.html', 'security.html', 'terms.html', 'resources.html', 'airport-procurement-policy.html', 'cooperative-contracts-airports.html', 'accessibility.html'];

const BANNED = [
  /check current text/i,
  /Scope and timing are agreed with each airport/i,
  /Coverage depends on configured sources/i,
  /subject to airport review before use/i,
  /subject to (agreed scope|current product availability|project facts|confirmation)/i,
  /where available/i,
  /No customer savings result is claimed/i,
  /Do not assume card payment/i,
  /Changes remain subject to review/i,
  /not a procurement, grant, legal, FAA, or compliance determination/i,
  // Owner review of /pricing.html (2026-10-02): each of these was marked unnecessary.
  /How to evaluate the value/i,
  /Compare the work, not just the subscription/i,
  /Annual pricing, clearly stated/i,
  /For your airport’s purchasing review/i,
  /P-card rules/i,
  /Pricing effective August 2026/i,
  /We agree on availability, evaluation, and included support/i,
  /Procurement, grant, and legal decisions remain with the airport and its advisors/i,
  // Remaining pages (2026-10-04): unshipped promises, repeated confirm-with-the-source lines and disclaimer paragraphs.
  /upcoming TarmacSync worksheets/i,
  /Coming soon/i,
  /always confirm with your ADO, counsel/i,
  /Confirm the active edition, status, and applicability/i,
  /should be confirmed against FAA sources/i,
  /does not replace your procurement policy or staff/i,
  /without reservation/i,
  /Open captions embedded in the vision film/,
  // Owner review of /security (2026-10-04): hedging boilerplate removed; no new claims added.
  /No internet-based service can eliminate/i,
  /must be confirmed for the relevant product version/i,
  /and other applicable materials/i,
  /A note on risk/i,
  // Owner review of /book-a-call.html (2026-10-02): each of these was marked filler.
  /What we’ll cover/i,
  /A useful conversation, even if/i,
  /Choose a fit-conversation time/i,
  /Scope and annual pricing confirmed/i,
  /Pricing shown is for planning/i,
  /No sensitive data/i,
  /Pre-launch/i,
  /Pre-launch · Preparing/i,
  // Third pass: homepage + booking (2026-10-02).
  /Read it before your next project handoff/i,
  /Interactive demonstration/i,
  // Second owner pass (2026-10-02).
  /Pre-launch pricing/i,
  /We’ll confirm the fit with you/i,
  /No obligation to proceed/i,
  /No preparation required/i,
  /Bring your airport’s next purchase or project/i,
  // Plan-card bullets rewritten as benefits; the terse feature labels must not return.
  /Federal funding and grant context/i,
  /Decision-summary exports for airport review/i,
  /Approval workflow and activity tracking/i,
  /Support for complex, multi-source funding/i,
  /Guided setup with your airport’s local policy and thresholds/i,
  /Core procurement path review and cooperative candidate review/i,
  /\b(compliant|FAA-approved|guaranteed|final determination)\b/i,
];

let failed = 0;
const test = (name, fn) => {
  try { fn(); console.log('ok  ' + name); } catch (e) { failed++; console.error('FAIL ' + name + '\n' + e.message); }
};

const visibleText = (file) => {
  let s = fs.readFileSync(path.join(root, file), 'utf8');
  s = s.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<(script|style|noscript)[\s\S]*?<\/\1>/g, ' ');
  s = s.replace(/<header[\s\S]*?<\/header>|<footer[\s\S]*?<\/footer>/g, ' ');
  s = s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, '’');
  return s.replace(/\s+/g, ' ').trim();
};
const sentences = (text) => text.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => x.split(' ').length >= 6);

REVIEWED.forEach((file) => {
  const text = visibleText(file);
  test(file + ': no banned noise phrases', () => {
    const hits = BANNED.filter((re) => re.test(text)).map((re) => text.match(re)[0]);
    assert.deepEqual(hits, []);
  });
  test(file + ': each disclosure appears once', () => {
    assert.ok((text.match(/pre-launch/gi) || []).length <= 1, '"Pre-launch" appears ' + (text.match(/pre-launch/gi) || []).length + ' times');
    const req = text.match(/No (project details|project submission)[^.]*required/gi) || [];
    assert.ok(req.length <= 1, '"no project details required" appears ' + req.length + ' times: ' + req.join(' | '));
  });
  test(file + ': "no per-seat pricing" said at most twice', () => {
    const n = (text.match(/per-seat/gi) || []).length;
    assert.ok(n <= 2, '"per-seat" appears ' + n + ' times');
  });
  test(file + ': no sentence is repeated', () => {
    const seen = new Map();
    const dup = [];
    sentences(text).forEach((s) => { if (seen.has(s)) dup.push(s); seen.set(s, true); });
    assert.deepEqual(dup, []);
  });
});

test('pricing.html: says "no automatic renewal" once', () => {
  const t = visibleText('pricing.html');
  const n = (t.match(/automatic renewal/gi) || []).length;
  assert.equal(n, 1, '"automatic renewal" appears ' + n + ' times');
});

// Owner review (2026-10-05): the features read like a spec, not marketing. Headline numbers first,
// then one line per feature. Every number and cadence below is checked against the product repo:
// contract catalogs in data/*/*-airport-contracts.json, schedules in the product's vercel.json crons.
test('pricing.html: headline numbers, then one-line features, with no spec lists', () => {
  const raw = fs.readFileSync(path.join(root, 'pricing.html'), 'utf8');
  const stats = raw.match(/<div class="stat"><span class="stat-num">[^<]+<\/span><span class="stat-label">[^<]+<\/span><\/div>/g) || [];
  assert.equal(stats.length, 4, 'four headline numbers, found ' + stats.length);
  const strip = stats.join(' ');
  ['7,000+', '1,000+', 'SAM.gov', 'Advisory Circular'].forEach((w) => assert.ok(strip.includes(w), 'headline names: ' + w));
  assert.ok(!/\blive\b/i.test(strip), 'catalogs are checked weekly, not live');
  const cards = raw.match(/<article class="feature">[\s\S]*?<\/article>/g) || [];
  assert.equal(cards.length, 9, 'nine feature cards, found ' + cards.length);
  cards.forEach((c, i) => {
    assert.match(c, /^<article class="feature">\s*<h3>[^<]+<\/h3>\s*<p>[^<]+<\/p>\s*<\/article>$/, 'card ' + (i + 1) + ' is a title and one line');
    assert.ok(c.replace(/<[^>]+>/g, '').trim().split(/\s+/).length <= 22, 'card ' + (i + 1) + ' stays short');
  });
  const t = visibleText('pricing.html');
  ['vendor emails', 'best-matched', 'bid package'].forEach((w) => assert.ok(new RegExp(w, 'i').test(t), 'feature named: ' + w));
  assert.ok(!/Word export|procurement file checklist/i.test(t), 'the file-checklist line is gone (owner: not useful)');
  assert.ok(!/class="feature-group"|class="feature-num"/.test(raw), 'the spec-style groups are gone');
  assert.ok(!/\b(compliant|approved|guaranteed)\b/i.test(t), 'no forbidden vocabulary');
});

// Owner review (2026-10-05): every plan is the same product, so the cards show only the airport
// profile, the price and the call; the hero says once what every plan includes.
test('pricing.html: plan cards carry no feature list; the hero states what every plan includes', () => {
  const raw = fs.readFileSync(path.join(root, 'pricing.html'), 'utf8');
  const cards = raw.match(/<div class="tier" data-tier="[a-z]+">[\s\S]*?<\/a>\s*<\/div>/g) || [];
  assert.equal(cards.length, 3, 'three plan cards');
  cards.forEach((c) => assert.ok(!/<ul>/.test(c), 'no list inside a plan card'));
  assert.ok(!/Every capability listed below|Usage sized to/i.test(raw), 'the two owner-rejected lines are gone');
  assert.ok(!/Everything in (Field|Regional)/.test(raw), 'no "Everything in X, plus" ladder');
  const hero = raw.match(/<section class="hero">[\s\S]*?<\/section>/)[0];
  assert.match(hero, /<p class="hero-sub">[^<]*unlimited users[^<]*<\/p>/i, 'the hero says unlimited users, once, in one line');
});

// Marketing pass (2026-10-05): written for the airport manager who will buy.
test('pricing.html: one payment answer, a data-separation answer, and a closing call to action', () => {
  const raw = fs.readFileSync(path.join(root, 'pricing.html'), 'utf8');
  const qs = (raw.match(/<summary>([^<]+)<\/summary>/g) || []).map((s) => s.replace(/<\/?summary>/g, ''));
  assert.equal(qs.filter((q) => /\b(pay|credit card|W-9|purchase order)\b/i.test(q)).length, 1, 'payment is one question: ' + qs.join(' | '));
  assert.ok(!/may not be available/i.test(raw), 'no negative card line');
  assert.ok(qs.some((q) => /data/i.test(q) && /separate|other airports/i.test(q)), 'a manager can see their data is kept separate');
  assert.match(raw, /href="\/security"/, 'the data answer links to the Security page');
  assert.match(raw, /<section class="pricing-close"[\s\S]*href="\/book-a-call"[\s\S]*href="\/tour"/, 'the page ends with Book a call and Watch the demo');
  assert.ok(!/delivery-method decisions, and dependencies across packages/.test(raw), 'the program band is short');
});

test('book-a-call.html: a short button label, no agenda list, no repeated call facts', () => {
  const raw = fs.readFileSync(path.join(root, 'book-a-call.html'), 'utf8');
  assert.match(raw, /id="booking-link"[^>]*>\s*Book a time\b/, 'the button reads "Book a time"');
  assert.match(raw, /<strong>Or continue on your phone<\/strong>/, 'the QR block reads "Or continue on your phone"');
  assert.ok(!/class="agenda"|class="call-facts"|class="legal-note"/.test(raw), 'agenda, call-facts and legal-note blocks are gone');
  const t = visibleText('book-a-call.html');
  assert.ok(!/\bScoped\b/.test(t.replace(/Selected plan/gi, '')) || /id="selected-plan"[^>]*\bhidden\b/.test(raw), '"Scoped" is not shown without a plan');
  assert.match(raw, /id="selected-plan"[^>]*\bhidden\b/, 'the selected-plan box is hidden until a plan is chosen');
  assert.match(raw, /\.selected-plan\[hidden\]\s*\{\s*display:\s*none/, 'CSS lets [hidden] win over the box’s own display');
  assert.equal((t.match(/30 minutes/gi) || []).length, 1, '"30 minutes" is said once');
  assert.ok(!/\bOnline\b/.test(t), 'no "Online" chip');
});

test('index.html: the product preview and diagram retain the illustrative demo purchase', () => {
  const raw = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(raw, /class="hero-frame__title">Illustrative demo · runway sweeper replacement/);
  assert.match(raw, /purchase: 'Runway sweeper replacement/);
  assert.match(raw, /requirements: 'AIP planned, local match/);
  assert.match(raw, /id="product-model"/, 'saved demo back-links still resolve');
  assert.match(raw, /class="product-preview__link" href="\/tour"/);
  assert.equal((raw.match(/<details class="trust-proof">/g) || []).length, 3);
  assert.ok(!raw.includes('class="ts-workflow"'), 'no duplicate homepage workflow');
  assert.ok(!raw.includes('data-report-cta="closing"'), 'no duplicate closing report CTA');
});

if (failed) { console.error('\n' + failed + ' failing'); process.exit(1); }
console.log('\ncopy checks passed');
