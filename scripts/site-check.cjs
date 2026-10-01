#!/usr/bin/env node
// Site-wide hygiene checks: image weight, caching, 404, deploy exclusions, sitemap, titles and
// share cards. Node only, no browser. Run: node scripts/site-check.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
let failed = 0;
const test = (name, fn) => {
  try { fn(); console.log('ok  ' + name); } catch (e) { failed++; console.error('FAIL ' + name + '\n' + e.message); }
};

const pages = fs.readdirSync(root).filter((f) => f.endsWith('.html') && !f.startsWith('google'));
const meta = (src, key) => {
  const m = src.match(new RegExp('<meta\\s+(?:name|property)="' + key.replace(/[:.]/g, '\\$&') + '"\\s+content="([^"]*)"', 'i'));
  return m ? m[1] : null;
};
const titleOf = (src) => (src.match(/<title>([^<]*)<\/title>/) || [])[1];
const isIndexable = (src) => !/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(src);
const indexable = pages.filter((f) => f !== '404.html' && isIndexable(read(f)));

test('images: small display sizes never load oversized files', () => {
  const offenders = [];
  [...pages, 'assets/tour/tour-ui.js'].forEach((f) => {
    const src = read(f);
    for (const m of src.matchAll(/<img\b[^>]*>/g)) {
      const src2 = (m[0].match(/\ssrc="([^"]+)"/) || [])[1];
      const w = Number((m[0].match(/\swidth="(\d+)"/) || [])[1]);
      if (!src2 || src2.startsWith('http') || src2.startsWith('data:') || !w || w > 300) continue;
      const file = src2.replace(/^\//, '');
      if (!exists(file)) continue;
      const kb = fs.statSync(path.join(root, file)).size / 1024;
      if (kb > 40) offenders.push(f + ' ' + file + ' is ' + Math.round(kb) + 'KB shown at ' + w + 'px');
    }
  });
  const ui = read('assets/tour/tour-ui.js');
  if (/tarmacsync-icon\.png/.test(ui)) offenders.push('tour-ui.js references the full-size icon');
  assert.deepEqual(offenders, []);
});

test('caching: images and fonts are cached for a day or more; scripts and styles stay revalidated', () => {
  const v = JSON.parse(read('vercel.json'));
  const rules = (v.headers || []).filter((h) => h.source !== '/(.*)');
  const cache = (h) => (h.headers.find((x) => x.key.toLowerCase() === 'cache-control') || {}).value || '';
  const long = rules.filter((h) => /max-age=(\d+)/.test(cache(h)) && Number(cache(h).match(/max-age=(\d+)/)[1]) >= 86400);
  assert.ok(long.length >= 1, 'a long cache rule for images and fonts exists');
  const joined = long.map((h) => h.source).join(' ');
  assert.match(joined, /png/); assert.match(joined, /woff2/);
  assert.ok(!/\bjs\b|\bcss\b/.test(joined), 'no long cache on js/css, which share filenames with their HTML');
});

test('404: a branded page exists, is noindex, and leads somewhere useful', () => {
  assert.ok(exists('404.html'), '404.html exists');
  const s = read('404.html');
  assert.match(s, /<meta\s+name="robots"\s+content="noindex/i);
  assert.match(s, /<h1[^>]*>[^<]*(not found|find that page)/i);
  ['href="/"', 'href="/tour.html"', 'href="/pricing.html"', 'href="/book-a-call.html"'].forEach((h) => assert.ok(s.includes(h), '404 links ' + h));
  assert.ok(!read('sitemap.xml').includes('404'), 'not in the sitemap');
});

test('deploy exclusions: internal docs, markdown and scripts are not served', () => {
  const lines = read('.vercelignore').split('\n').map((l) => l.trim()).filter(Boolean);
  ['docs/', 'scripts/', '*.md'].forEach((l) => assert.ok(lines.includes(l), '.vercelignore has ' + l));
});

test('sitemap: matches the generator, lists every indexable page, never a noindex page', () => {
  execFileSync('node', ['scripts/build-sitemap.cjs', '--check'], { cwd: root, stdio: 'pipe' });
  const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  indexable.forEach((f) => {
    const url = 'https://www.tarmacsync.com/' + (f === 'index.html' ? '' : f);
    assert.ok(locs.includes(url), f + ' is in the sitemap');
  });
  pages.filter((f) => !indexable.includes(f)).forEach((f) => assert.ok(!locs.some((l) => l.endsWith('/' + f)), f + ' is noindex but listed'));
  assert.ok(locs.includes('https://www.tarmacsync.com/tour.html'), 'the demo is indexable and listed');
  assert.ok(!exists('privacy-choices.html'), 'the redirect stub file is gone; vercel.json redirects it');
  assert.ok(read('vercel.json').includes('/privacy-choices.html'), 'the redirect remains');
});

test('titles: one format, within length, unique, and mirrored in the share cards', () => {
  const seen = new Set();
  indexable.forEach((f) => {
    const s = read(f);
    const t = titleOf(s);
    assert.ok(t.endsWith(' | TarmacSync'), f + ' title format: "' + t + '"');
    assert.ok(t.length <= 62, f + ' title is ' + t.length + ' characters');
    assert.ok(!seen.has(t), f + ' duplicate title'); seen.add(t);
    assert.ok(!/TarmacSync \| TarmacSync/.test(t), f + ' repeats the brand');
    assert.equal(meta(s, 'og:title'), t, f + ' og:title matches');
    assert.equal(meta(s, 'twitter:title'), t, f + ' twitter:title matches');
  });
});

test('share cards: every indexable page has a complete Open Graph and Twitter set', () => {
  const keys = ['og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
  indexable.forEach((f) => {
    const s = read(f);
    keys.forEach((k) => assert.ok(meta(s, k), f + ' is missing ' + k));
    assert.equal(meta(s, 'og:description'), meta(s, 'description'), f + ' og:description matches the page description');
    const url = 'https://www.tarmacsync.com/' + (f === 'index.html' ? '' : f);
    assert.equal(meta(s, 'og:url'), url, f + ' og:url');
  });
});

test('the demo is indexable and its booking page has a branded title', () => {
  assert.ok(isIndexable(read('tour.html')), 'tour.html is not noindex');
  assert.match(titleOf(read('book-a-call.html')), /Book a Fit Conversation \| TarmacSync/);
});

if (failed) { console.error('\n' + failed + ' failing'); process.exit(1); }
console.log('\nsite checks passed');
