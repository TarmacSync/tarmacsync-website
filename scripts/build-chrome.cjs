#!/usr/bin/env node
// The site header and footer are defined here once and rendered into every page that uses the
// shared layout. The 404 is a focused layout and is left alone; the demo and the booking page
// keep their own focused headers but take the shared footer. Run `node scripts/build-chrome.cjs` after
// editing a template; `--check` fails if any page has drifted. Paths are absolute so the markup
// is identical wherever it is rendered.
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const EXCLUDED = new Set(['404.html']);
const FOOTER_ONLY = new Set(['tour.html', 'book-a-call.html']);

const NAV = [
  ['/#product', 'Product', ''],
  ['/tour.html', 'Demo', ' data-tour-cta="nav"'],
  ['/pricing.html', 'Pricing', ''],
  ['/book-a-call.html', 'Contact', ''],
];

const header = (file) => {
  const links = NAV.map(([href, label, extra]) => {
    const current = href === '/' + file ? ' aria-current="page"' : '';
    return '        <a href="' + href + '"' + current + extra + '>' + label + '</a>';
  }).join('\n');
  return `<header class="site-header" id="site-header" data-site-header>
    <div class="site-header__inner">
      <a class="site-header__brand" href="/" aria-label="TarmacSync home">
        <img class="site-header__logo" src="/assets/tarmacsync-logo-sm.png" alt="TarmacSync" width="190" height="46">
      </a>
      <nav id="site-nav" class="site-nav" aria-label="Primary navigation" data-site-nav>
${links}
        <a class="site-nav__program" href="/#report" data-report-cta="mobile_nav">Get the free report</a>
      </nav>
      <a class="site-header__cta" href="/#report" data-report-cta="header"><span class="site-header__cta-full">Get the free report</span><span class="site-header__cta-short">Get the report</span></a>
      <button class="site-menu" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-nav" data-site-menu><span class="site-menu__lines" aria-hidden="true"><span></span><span></span><span></span></span></button>
    </div>
  </header>`;
};

const FOOTER_LINKS = [
  ['/privacy.html', 'Privacy'], ['/terms.html', 'Terms'], ['/accessibility.html', 'Accessibility'], ['/book-a-call.html', 'Contact'],
];
const LINKEDIN = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>';
const footer = () => `<footer class="site-footer">
    <div class="site-footer__inner">
      <a href="/" aria-label="TarmacSync home"><img class="site-footer__logo site-footer__logo--icon" src="/assets/tarmacsync-icon-sm.png" alt="TarmacSync" width="56" height="56" loading="lazy"></a>
      <div class="site-footer__links">${FOOTER_LINKS.map(([h, l]) => '<a href="' + h + '">' + l + '</a>').join('')}</div>
      <a class="site-footer__social" href="https://www.linkedin.com/company/tarmacsync/" aria-label="TarmacSync on LinkedIn (opens in a new tab)" target="_blank" rel="noopener noreferrer">${LINKEDIN}</a>
    </div>
  </footer>`;

const pages = fs.readdirSync(root).filter((f) => f.endsWith('.html') && !f.startsWith('google') && !EXCLUDED.has(f));
let drift = [];
pages.forEach((f) => {
  const p = path.join(root, f);
  const src = fs.readFileSync(p, 'utf8');
  let out = FOOTER_ONLY.has(f) ? src : src.replace(/<header[\s>][\s\S]*?<\/header>/, () => header(f));
  out = out.replace(/<footer[\s>][\s\S]*?<\/footer>/, () => footer());
  if (out !== src) drift.push(f);
  if (!process.argv.includes('--check') && out !== src) fs.writeFileSync(p, out);
});

if (process.argv.includes('--check')) {
  if (drift.length) { console.error('Header/footer differ from scripts/build-chrome.cjs on: ' + drift.join(', ') + '. Run: node scripts/build-chrome.cjs'); process.exit(1); }
  console.log('chrome matches on ' + pages.length + ' pages');
} else {
  console.log('rendered header and footer into ' + drift.length + ' of ' + pages.length + ' pages');
}
