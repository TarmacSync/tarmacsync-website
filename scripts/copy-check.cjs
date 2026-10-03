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
const REVIEWED = ['index.html', 'pricing.html', 'book-a-call.html', 'aip-procurement.html'];

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

test('pricing.html: states what every purchase delivers, from the demo, and says "no automatic renewal" once', () => {
  const t = visibleText('pricing.html');
  ['route memo', 'readiness checklist', 'ADO', 'bid evaluation checklist'].forEach((w) => assert.ok(new RegExp(w, 'i').test(t), 'value section names: ' + w));
  const n = (t.match(/automatic renewal/gi) || []).length;
  assert.equal(n, 1, '"automatic renewal" appears ' + n + ' times');
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

test('aip-procurement.html: a sourced guide, with its structured data matching what is on the page', () => {
  const raw = fs.readFileSync(path.join(root, 'aip-procurement.html'), 'utf8');
  const text = visibleText('aip-procurement.html');
  assert.match(raw, /<title>AIP Procurement: Steps, Bids, and Grant Timing \| TarmacSync<\/title>/);
  assert.match(raw, /<h1[^>]*>AIP procurement: the key steps, sealed bids, and grant timing<\/h1>/);
  assert.ok(text.split(' ').length >= 1300, 'a real guide, not a landing blurb (' + text.split(' ').length + ' words)');
  // Facts that must be present, each traced to a source reviewed for the demo.
  ['\\$350,000', '\\$15,000', '49 USC 47110', '2 CFR 200\\.320', 'Table 5-4', 'notify the ADO in writing', 'apparent low bidder', 'engineer’s estimate', 'Buy American', 'Last reviewed'].forEach((p) => assert.match(text, new RegExp(p), 'missing: ' + p));
  const rows = (raw.match(/<tr>/g) || []).length;
  assert.ok(rows >= 8, 'the key-steps table and the thresholds table are present (' + rows + ' rows)');
  assert.ok(/ecfr\.gov/.test(raw) && /faa\.gov\/airports\/aip/.test(raw), 'official sources are linked');
  assert.ok(!/cooperative|Sourcewell|Pathfinder/i.test(text), 'no cooperative-contract or internal-name content in this guide');
  // Structured data: valid, and the FAQ markup is exactly the visible FAQ.
  const ld = [...raw.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const types = ld.flatMap((o) => (o['@graph'] || [o]).map((i) => i['@type']));
  ['Article', 'BreadcrumbList', 'FAQPage'].forEach((ty) => assert.ok(types.includes(ty), 'JSON-LD includes ' + ty));
  const faq = ld.flatMap((o) => o['@graph'] || [o]).find((i) => i['@type'] === 'FAQPage');
  const ldQs = faq.mainEntity.map((q) => q.name);
  const faqSec = (raw.match(/<section[^>]*id="faq"[\s\S]*?<\/section>/) || [''])[0];
  const pageQs = [...faqSec.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
  assert.deepEqual(ldQs, pageQs, 'FAQ structured data lists exactly the visible questions');
  faq.mainEntity.forEach((q, i) => {
    const visible = (faqSec.split(/<h3[^>]*>/)[i + 1] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    assert.ok(visible.includes(q.acceptedAnswer.text.slice(0, 40)), 'answer ' + (i + 1) + ' on the page starts the same as the structured data');
  });
  assert.match(raw, /<a[^>]*class="btn[^"]*"[^>]*href="\/tour"[^>]*>Watch the demo<\/a>/, 'the guide ends by pointing at the demo');
  // Corrections from the independent accuracy review (2026-10-03): each wrong or overstated claim stays out.
  assert.ok(!/hold (them|bids)|bids held|held until/i.test(text), 'the Handbook says nothing about holding bids until the grant is accepted');
  assert.ok(!/any gap is the sponsor/i.test(text), 'the over-estimate answer must not say the grant already caps the federal share when bids are opened first');
  assert.ok(!/Does the ADO have to sign off[\s\S]{0,60}Not in every case/i.test(text), 'the ADO is notified or may review; it does not sign off the award');
  assert.ok(!/some printed editions/i.test(text), 'the current Handbook itself still shows $150,000');
  assert.match(text, /not the programmed amount/, 'the Handbook directs the grant to be based on the actual bid amounts');
  assert.match(text, /self-certify/, 'the micro-purchase row mentions self-certification');
  assert.match(text, /newer editions/, 'the page tells readers to check for newer Handbook editions');
});

test('index.html: the how-it-works example is the demo’s purchase', () => {
  const t = visibleText('index.html');
  const ex = (t.match(/for example: “([^”]+)”/) || [])[1] || '';
  assert.match(ex, /runway (sweeper|broom)/i, 'example: "' + ex + '"');
  assert.match(ex, /AIP/);
});

if (failed) { console.error('\n' + failed + ' failing'); process.exit(1); }
console.log('\ncopy checks passed');
