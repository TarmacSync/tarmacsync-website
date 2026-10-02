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
const REVIEWED = ['index.html', 'pricing.html', 'book-a-call.html'];

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

test('index.html: the how-it-works example is the demo’s purchase', () => {
  const t = visibleText('index.html');
  const ex = (t.match(/for example: “([^”]+)”/) || [])[1] || '';
  assert.match(ex, /runway (sweeper|broom)/i, 'example: "' + ex + '"');
  assert.match(ex, /AIP/);
});

if (failed) { console.error('\n' + failed + ' failing'); process.exit(1); }
console.log('\ncopy checks passed');
