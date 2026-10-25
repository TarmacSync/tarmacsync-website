#!/usr/bin/env node
// Builds the Cloudflare Pages upload: copies the public files on ALLOW into the output directory
// (default dist/) and writes _headers. An allowlist, not an ignore list, so a new internal file
// is private until someone decides to publish it. Functions deploy from functions/, not from here.
// Run: node scripts/build-pages.cjs [outDir]
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(root, 'dist'));

const ALLOW = [
  (f) => f.endsWith('.html'),
  (f) => ['robots.txt', 'sitemap.xml', '_redirects'].includes(f),
  (f) => f.startsWith('assets/'),
];

const files = [];
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).forEach((e) => {
  const rel = dir ? dir + '/' + e.name : e.name;
  if (e.name.startsWith('.') || ['node_modules', 'dist'].includes(rel)) return;
  if (e.isDirectory()) walk(rel); else if (ALLOW.some((ok) => ok(rel))) files.push(rel);
});
walk('');

fs.rmSync(out, { recursive: true, force: true });
files.forEach((f) => {
  fs.mkdirSync(path.dirname(path.join(out, f)), { recursive: true });
  fs.copyFileSync(path.join(root, f), path.join(out, f));
});

// Images and fonts are cached for a day. Scripts and styles are not: they keep their filenames
// across deploys, so a long cache would pair a new page with an old script.
const LONG = /\.(png|jpg|jpeg|webp|svg|ico|woff2)$/;
const headers = [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  ...files.filter((f) => LONG.test(f)).sort().flatMap((f) => [
    '/' + f,
    '  Cache-Control: public, max-age=86400, stale-while-revalidate=604800',
  ]),
];
fs.writeFileSync(path.join(out, '_headers'), headers.join('\n') + '\n');
console.log('built ' + files.length + ' files into ' + out);
