#!/usr/bin/env node
// Generates sitemap.xml from the pages themselves: every page that is not noindex, not the 404,
// and not a verification file. <lastmod> is the page's last git commit date, or today when the
// file has uncommitted changes. Run `node scripts/build-sitemap.cjs` after changing pages;
// `--check` fails if the sitemap lists different URLs than the pages imply.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const ORIGIN = 'https://www.tarmacsync.com';
const PRIORITY = ['index.html', 'tour.html', 'pricing.html', 'book-a-call.html'];

const pages = fs.readdirSync(root)
  .filter((f) => f.endsWith('.html') && f !== '404.html' && !f.startsWith('google'))
  .filter((f) => !/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(fs.readFileSync(path.join(root, f), 'utf8')))
  .sort((a, b) => {
    const ia = PRIORITY.indexOf(a), ib = PRIORITY.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a.localeCompare(b);
  });

const git = (args) => { try { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim(); } catch { return ''; } };
const today = new Date().toISOString().slice(0, 10);
const dirty = new Set(git(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()));
const lastmod = (f) => (dirty.has(f) ? today : git(['log', '-1', '--format=%cs', '--', f]) || today);

const url = (f) => ORIGIN + '/' + (f === 'index.html' ? '' : f.replace(/\.html$/, ''));
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages.map((f) => '  <url>\n    <loc>' + url(f) + '</loc>\n    <lastmod>' + lastmod(f) + '</lastmod>\n  </url>').join('\n') + '\n</urlset>\n';

if (process.argv.includes('--check')) {
  const have = [...fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const want = pages.map(url);
  const missing = want.filter((u) => !have.includes(u)), extra = have.filter((u) => !want.includes(u));
  if (missing.length || extra.length || have.join() !== want.join()) {
    console.error('sitemap.xml is out of date. Missing: ' + (missing.join(', ') || 'none') + '. Extra: ' + (extra.join(', ') || 'none') + '. Run: node scripts/build-sitemap.cjs');
    process.exit(1);
  }
  console.log('sitemap matches the pages (' + want.length + ' URLs)');
} else {
  fs.writeFileSync(path.join(root, 'sitemap.xml'), xml);
  console.log('wrote sitemap.xml with ' + pages.length + ' URLs');
}
