#!/usr/bin/env node
/**
 * TarmacSync website accessibility sweep.
 *
 * Runs mechanical accessibility checks that automated axe scans cannot cover:
 *   - horizontal overflow at 320/375/768/1280/1440 (WCAG 1.4.10 reflow)
 *   - skip-link keyboard behavior (WCAG 2.4.1 bypass blocks)
 *   - WCAG 1.4.12 text-spacing override (no overflow)
 *   - forced-colors / high-contrast rendering
 *   - mobile-menu keyboard activation (aria-expanded + aria-controls)
 *   - console / page errors
 *
 * Serves the repo root on a built-in static server unless BASE_URL is set,
 * so it can sweep a local checkout or a deployed host.
 *
 * Usage:
 *   npm run a11y                        # serve the repo and sweep every page
 *   BASE_URL=https://www.tarmacsync.com npm run a11y   # sweep a deployed host
 *   PAGES="index.html,pricing.html" npm run a11y        # sweep a subset
 *
 * Exit 0 when every check passes; exit 1 when any check fails.
 *
 * Requires: playwright (devDependency). Install with `npm install`.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = parseInt(process.env.A11Y_PORT || '8077', 10);
const BASE = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

const ALL_PAGES = [
  'index.html',
  'founding-airports.html',
  'pricing.html',
  'security.html',
  'airport-procurement-intelligence.html',
  'aip-procurement.html',
  'cooperative-contracts-airports.html',
  'airport-procurement-policy.html',
  'resources.html',
  'privacy.html',
  'terms.html',
  'government-customer-addendum.html',
  'data-processing-addendum.html',
  'procurement-support-packet.html',
  'product-roadmap.html',
  'pilot-program-brief.html',
  'accessibility.html',
  'non-discrimination.html',
  'privacy-choices.html',
];

const PAGES = (process.env.PAGES ? process.env.PAGES.split(',') : ALL_PAGES)
  .map((p) => p.trim())
  .filter(Boolean);

const VIEWPORTS = [320, 375, 768, 1280, 1440];

const TEXT_SPACING_CSS =
  '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }';

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon',
};

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let p = decodeURIComponent(url.pathname);
    if (p === '/') p = '/index.html';
    const fp = path.join(ROOT, p);
    if (!fp.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream',
    });
    fs.createReadStream(fp).pipe(res);
  });
}

async function main() {
  const failures = [];
  const consoleErrors = [];

  let server;
  if (!process.env.BASE_URL) {
    server = createServer();
    await new Promise((resolve) => server.listen(PORT, resolve));
  }

  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  async function overflow(viewport) {
    const r = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    return r.sw > r.cw ? `${r.sw} > ${r.cw}` : null;
  }

  // 1. Horizontal overflow (all pages, all viewports).
  for (const p of PAGES) {
    for (const w of VIEWPORTS) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`${BASE}/${p}`, { waitUntil: 'load' });
      const over = await overflow(w);
      if (over) failures.push(`overflow ${p} @${w}px: ${over}`);
    }
  }

  // 2. Skip link keyboard behavior (representative pages that carry it).
  const skipPages = PAGES.filter((p) =>
    ['index.html', 'security.html', 'privacy.html', 'data-processing-addendum.html'].includes(p),
  );
  for (const p of skipPages) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/${p}`, { waitUntil: 'load' });
    await page.keyboard.press('Tab');
    const first = await page.evaluate(
      () => (document.activeElement || {}).className || '',
    );
    if (!String(first).includes('skip-link')) {
      failures.push(`skip-link ${p}: first Tab did not focus the skip link`);
      continue;
    }
    await page.keyboard.press('Enter');
    const after = await page.evaluate(
      () => (document.activeElement || {}).id || '',
    );
    if (after !== 'main-content') {
      failures.push(`skip-link ${p}: Enter moved focus to "${after}", expected #main-content`);
    }
  }

  // 3. WCAG 1.4.12 text-spacing override (no overflow).
  for (const p of PAGES) {
    for (const w of [320, 1280]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`${BASE}/${p}`, { waitUntil: 'load' });
      await page.addStyleTag({ content: TEXT_SPACING_CSS });
      const over = await overflow(w);
      if (over) failures.push(`text-spacing ${p} @${w}px: ${over}`);
    }
  }

  // 4. Forced-colors rendering.
  for (const p of PAGES) {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/${p}`, { waitUntil: 'load' });
    const ok = await page.evaluate(() => {
      const m = document.querySelector('main');
      return !!m && m.getBoundingClientRect().width > 0 && m.textContent.trim().length > 0;
    });
    if (!ok) failures.push(`forced-colors ${p}: <main> did not render`);
    await page.emulateMedia({ forcedColors: 'none' });
  }

  // 5. Mobile-menu keyboard activation (shell pages only).
  if (PAGES.includes('index.html')) {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/index.html`, { waitUntil: 'load' });
    const menu = '[data-site-menu]';
    const nav = '[data-site-nav]';
    const controls = await page.evaluate((s) => document.querySelector(s).getAttribute('aria-controls'), menu);
    const navId = await page.evaluate((s) => document.querySelector(s).id, nav);
    if (controls !== 'site-nav' || navId !== 'site-nav') {
      failures.push(`mobile-menu: aria-controls="${controls}" / nav id="${navId}" (expected site-nav)`);
    }
    await page.evaluate((s) => document.querySelector(s).focus(), menu);
    await page.keyboard.press('Enter');
    const expanded = await page.evaluate((s) => document.querySelector(s).getAttribute('aria-expanded'), menu);
    const visible = await page.evaluate(
      (s) => getComputedStyle(document.querySelector(s)).display !== 'none',
      nav,
    );
    if (expanded !== 'true' || !visible) {
      failures.push(`mobile-menu: Enter did not open the menu (expanded=${expanded}, visible=${visible})`);
    }
    await page.keyboard.press('Escape');
    const closed = await page.evaluate((s) => document.querySelector(s).getAttribute('aria-expanded'), menu);
    if (closed !== 'false') {
      failures.push(`mobile-menu: Escape did not close the menu (expanded=${closed})`);
    }
  }

  await browser.close();
  if (server) server.close();

  const report = {
    base: BASE,
    pagesChecked: PAGES.length,
    checksPassed: failures.length === 0 && consoleErrors.length === 0,
    failures,
    consoleErrors,
  };
  console.log(JSON.stringify(report, null, 2));
  process.exit(failures.length || consoleErrors.length ? 1 : 0);
}

main().catch((err) => {
  console.error('a11y-sweep crashed:', err);
  process.exit(1);
});
