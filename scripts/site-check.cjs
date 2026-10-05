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
  ['href="/"', 'href="/tour"', 'href="/pricing"', 'href="/book-a-call"'].forEach((h) => assert.ok(s.includes(h), '404 links ' + h));
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
    const url = 'https://www.tarmacsync.com/' + (f === 'index.html' ? '' : f.replace(/\.html$/, ''));
    assert.ok(locs.includes(url), f + ' is in the sitemap');
  });
  pages.filter((f) => !indexable.includes(f)).forEach((f) => assert.ok(!locs.some((l) => l.endsWith('/' + f)), f + ' is noindex but listed'));
  assert.ok(locs.includes('https://www.tarmacsync.com/tour'), 'the demo is indexable and listed');
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
    const url = 'https://www.tarmacsync.com/' + (f === 'index.html' ? '' : f.replace(/\.html$/, ''));
    assert.equal(meta(s, 'og:url'), url, f + ' og:url');
  });
});

test('the demo is indexable and its booking page has a branded title', () => {
  assert.ok(isIndexable(read('tour.html')), 'tour.html is not noindex');
  assert.match(titleOf(read('book-a-call.html')), /Book a Fit Conversation \| TarmacSync/);
});

// Every page, including the demo, carries the full header and footer.
const chromePages = pages;
const between = (src, tag) => (src.match(new RegExp('<' + tag + '[\\s>][\\s\\S]*?</' + tag + '>')) || [''])[0];
const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

test('structure: header, footer and main tags are balanced on every page', () => {
  const bad = [];
  pages.forEach((f) => {
    const s = read(f);
    ['header', 'footer', 'main'].forEach((t) => {
      const open = (s.match(new RegExp('<' + t + '[\\s>]', 'g')) || []).length;
      const close = (s.match(new RegExp('</' + t + '>', 'g')) || []).length;
      if (open !== close) bad.push(f + ' <' + t + '> opens ' + open + ', closes ' + close);
    });
  });
  assert.deepEqual(bad, []);
});

test('chrome: one header and one footer, rendered from scripts/build-chrome.cjs, on every shared-layout page', () => {
  execFileSync('node', ['scripts/build-chrome.cjs', '--check'], { cwd: root, stdio: 'pipe' });
  const nav = ['/tour', '/pricing', '/book-a-call', '/#report'];
  const foot = ['/', '/privacy', '/terms', '/accessibility', '/book-a-call'];
  chromePages.forEach((f) => {
    const s = read(f);
    const h = between(s, 'header'), ft = between(s, 'footer');
    assert.deepEqual(hrefs(between(h, 'nav')), nav, f + ' nav links');
    assert.ok(hrefs(ft).slice(0, foot.length).join() === foot.join(), f + ' footer links');
    assert.ok(h.includes('data-site-header') && h.includes('data-site-menu'), f + ' header has the menu behaviour hooks');
    assert.ok(!/mailto:/.test(h + ft), f + ' chrome leads to the booking page, not a mail link');
  });
  const current = (f) => (between(read(f), 'header').match(/aria-current="page"/g) || []).length;
  assert.equal(current('pricing.html'), 1); assert.equal(current('resources.html'), 0); assert.equal(current('security.html'), 0);
});

test('footer: only the legal links and Contact; no pages whose content changes quickly', () => {
  pages.forEach((f) => {
    const ft = between(read(f), 'footer');
    ['/product-roadmap', '/procurement-support-packet', '/security'].forEach((h) => assert.ok(!hrefs(ft).includes(h), f + ' footer links ' + h));
  });
});

test('footer: the demo and booking pages show the same footer as every other page', () => {
  const canonical = (f) => between(read(f), 'footer').replace(/\s+/g, ' ');
  assert.equal(canonical('tour.html'), canonical('pricing.html'));
  assert.equal(canonical('book-a-call.html'), canonical('pricing.html'), 'booking footer matches');
  assert.equal(canonical('404.html'), canonical('pricing.html'), '404 footer matches');
  assert.ok(read('book-a-call.html').includes('assets/site-shell.css'), 'the booking page loads the shared stylesheet');
  assert.ok(!/getElementById\("year"\)/.test(read('book-a-call.html')), 'no script writes to the removed footer year');
  assert.ok(read('tour.html').includes('assets/site-shell.css'), 'the demo loads the shared stylesheet');
  assert.ok(!/tour-footer/.test(read('tour.html') + read('assets/tour/tour.css')), 'the old demo footer is gone');
});

test('header: the mobile menu button is a 44px touch target on every page', () => {
  const css = read('assets/site-shell.css');
  const rule = (css.match(/\.site-menu\s*\{([^}]*)\}/) || [, ''])[1];
  assert.match(rule, /width:\s*44px/); assert.match(rule, /height:\s*44px/);
});

test('footer: links and the social icon are touch-sized (44px) in the shared stylesheet', () => {
  const css = read('assets/site-shell.css');
  const rule = (sel) => (css.match(new RegExp(sel.replace(/[.[\]]/g, '\\$&') + '\\s*\\{([^}]*)\\}')) || [, ''])[1];
  assert.match(rule('.site-footer__links a'), /min-height:\s*44px/);
  assert.match(rule('.site-footer__social'), /width:\s*44px/);
  assert.match(rule('.site-footer__social'), /height:\s*44px/);
});

test('chrome: pages using the shared layout load its stylesheet and script', () => {
  chromePages.forEach((f) => {
    const s = read(f);
    assert.ok(s.includes('assets/site-shell.css'), f + ' loads site-shell.css');
    assert.ok(s.includes('assets/site-shell.js'), f + ' loads site-shell.js');
  });
});

test('naming: one name for the booking and the evaluation guide', () => {
  const visible = (s) => [...s.matchAll(/<a\b[^>]*>([^<]*)<\/a>/g)].map((m) => m[1].trim());
  const banned = [/^Evaluate TarmacSync$/, /^Book a fit conversation$/, /^Discuss /, /^Evaluation Guide$/, /^View the Evaluation Guide$/, /^TarmacSync Evaluation Guide$/, /Talk it through/i];
  const hits = [];
  pages.forEach((f) => visible(read(f)).forEach((t) => banned.forEach((b) => { if (b.test(t)) hits.push(f + ': "' + t + '"'); })));
  assert.deepEqual(hits, []);
});

test('retired pages: roadmap, evaluation guide and intelligence page are gone, redirected, and unlinked', () => {
  const retired = { 'product-roadmap.html': '/', 'procurement-support-packet.html': '/pricing', 'airport-procurement-intelligence.html': '/', 'aip-procurement.html': '/' };
  const redirects = JSON.parse(read('vercel.json')).redirects;
  Object.entries(retired).forEach(([file, dest]) => {
    assert.ok(!exists(file), file + ' still exists');
    const r = redirects.find((x) => x.source === '/' + file);
    assert.ok(r && r.destination === dest && r.statusCode === 301, file + ' redirects 301 to ' + dest);
    pages.forEach((f) => assert.ok(!read(f).includes(file), f + ' still links ' + file));
    assert.ok(!read('assets/funnel-analytics.js').includes(file), 'analytics still tracks ' + file);
  });
});

test('clean URLs: the site serves and announces /pricing, never /pricing.html', () => {
  const v = JSON.parse(read('vercel.json'));
  assert.equal(v.cleanUrls, true, 'vercel.json turns on cleanUrls (it also redirects /x.html to /x)');
  const names = pages.map((f) => f.replace(/\.html$/, ''));
  const stray = [];
  [...pages, 'sitemap.xml', 'assets/funnel-analytics.js', 'assets/tour/tour-script.js'].forEach((f) => {
    const s = read(f);
    names.forEach((n) => {
      if (new RegExp('/' + n + '\\.html(?![\\w-])').test(s)) stray.push(f + ' still announces /' + n + '.html');
    });
  });
  assert.deepEqual(stray, []);
  (v.redirects || []).forEach((r) => assert.ok(!/\.html/.test(r.destination), 'redirect destination ' + r.destination + ' is clean'));
  const sources = (v.redirects || []).map((r) => r.source);
  ['founding-airports', 'pilot-program-brief', 'privacy-choices', 'product-roadmap', 'procurement-support-packet', 'airport-procurement-intelligence', 'aip-procurement'].forEach((n) => {
    assert.ok(sources.includes('/' + n + '.html') && sources.includes('/' + n), n + ' redirects from both the old .html and the clean path');
  });
  indexable.forEach((f) => {
    const s = read(f);
    const url = 'https://www.tarmacsync.com/' + (f === 'index.html' ? '' : f.replace(/\.html$/, ''));
    assert.equal((s.match(/<link\s+rel="canonical"\s+href="([^"]+)"/) || [])[1], url, f + ' canonical');
  });
});

// SEO pass (2026-10-05). Owner: no new visible pages or text, so everything here is markup only.
test('seo: pricing structured data states the visible prices and the visible FAQ, word for word', () => {
  const s = fs.readFileSync(path.join(root, 'pricing.html'), 'utf8');
  const blocks = (s.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []).map((b) => JSON.parse(b.replace(/<\/?script[^>]*>/g, '')));
  const graph = blocks.flatMap((b) => b['@graph'] || [b]);
  const offers = graph.flatMap((g) => g.offers || []);
  const visiblePrices = [...s.matchAll(/<div class="tier-price">\$([\d,]+)<\/div>/g)].map((m) => m[1].replace(/,/g, ''));
  assert.equal(visiblePrices.length, 3, 'three visible prices');
  assert.deepEqual(offers.map((o) => String(o.price)).sort(), [...visiblePrices].sort(), 'structured prices match the plan cards');
  offers.forEach((o) => assert.equal(o.priceCurrency, 'USD'));
  const faq = graph.find((g) => g['@type'] === 'FAQPage');
  assert.ok(faq, 'the pricing FAQ is marked up');
  const visibleQs = [...s.matchAll(/<summary>([^<]+)<\/summary>/g)].map((m) => m[1]);
  assert.deepEqual(faq.mainEntity.map((q) => q.name), visibleQs, 'marked-up questions are exactly the visible ones');
  const strip = (h) => h.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/&#39;|’/g, "'").replace(/\s+/g, ' ').trim();
  const visibleAs = [...s.matchAll(/<div class="faq-answer">([\s\S]*?)<\/div>/g)].map((m) => strip(m[1]));
  faq.mainEntity.forEach((q, i) => assert.equal(strip(q.acceptedAnswer.text), visibleAs[i], 'answer ' + (i + 1) + ' matches the page'));
});

test('seo: the homepage hero image loads first and has a phone-sized version', () => {
  const s = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const img = s.match(/<img src="assets\/hero-demo-frame\.webp"[^>]*>/)[0];
  assert.match(img, /fetchpriority="high"/, 'the largest image above the fold is fetched first');
  assert.ok(!/loading="lazy"/.test(img), 'never lazy-loaded');
  const set = (img.match(/srcset="([^"]+)"/) || [, ''])[1];
  assert.match(set, /hero-demo-frame-1320\.webp 1320w/, 'a 1320px version for phones');
  assert.ok(fs.existsSync(path.join(root, 'assets/hero-demo-frame-1320.webp')), 'the smaller file exists');
  assert.match(img, /sizes="[^"]+"/, 'sizes tells the browser which to pick');
});

test('seo: meta descriptions fit in a search result (160 characters or fewer)', () => {
  pages.filter((f) => f !== '404.html').forEach((f) => {
    const d = (fs.readFileSync(path.join(root, f), 'utf8').match(/<meta name="description" content="([^"]*)"/) || [, ''])[1];
    assert.ok(d.length > 50 && d.length <= 160, f + ' description is ' + d.length + ' characters');
  });
  const p = fs.readFileSync(path.join(root, 'pricing.html'), 'utf8');
  assert.ok(!/availability confirmed before purchase/.test(p), 'pricing description drops the removed noise');
});

if (failed) { console.error('\n' + failed + ' failing'); process.exit(1); }
console.log('\nsite checks passed');
