#!/usr/bin/env node
// Browser tests for the demo tour. Uses the repo's Playwright and its virtual clock.
// No AI, email or API calls. Serve the repo first: python3 -m http.server 8094 --bind 127.0.0.1
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE = (process.env.BASE_URL || 'http://127.0.0.1:8094').replace(/\/$/, '');
const sections = [];
const section = (name, fn) => sections.push({ name, fn });
// Assembled from pieces so the internal product name is not written out in this public repo.
const CODENAME = new RegExp(['path', 'finder'].join(''), 'i');

async function fresh(browser, opts = {}) {
  const context = await browser.newContext({
    viewport: { width: opts.width || 1440, height: opts.height || 900 },
    reducedMotion: opts.reducedMotion ? 'reduce' : 'no-preference',
  });
  await context.route('**/_vercel/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await context.newPage();
  const errors = [], bad = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', (r) => { if (r.method() !== 'GET' || /\/api\//.test(r.url())) bad.push(r.method() + ' ' + r.url()); });
  const target = BASE + (opts.path || '/tour.html') + (opts.hash || '');
  if (opts.realClock) {
    // Synthesized wheel input is not delivered while the virtual clock is paused, so gesture tests run in real time.
    await page.goto(target);
  } else {
    await page.clock.install({ time: 0 });
    await page.goto(target);
    await page.clock.pauseAt(1000);
  }
  const advance = (ms) => page.clock.runFor(ms);
  return { context, page, errors, bad, advance };
}
const count = (page, sel) => page.locator(sel).count();

section('page loads with the fictional banner, no codename, no stray requests', async (browser) => {
  const { page, errors, bad, context } = await fresh(browser);
  assert.match(await page.locator('#banner').innerText(), /fictional/i);
  assert.ok(!CODENAME.test(await page.locator('body').innerText()), 'codename visible');
  assert.ok(!CODENAME.test(await page.content()), 'codename in DOM');
  assert.equal(await page.locator('#landing').isVisible(), true);
  assert.deepEqual(errors, [], 'console/page errors');
  assert.deepEqual(bad, [], 'non-GET or API requests');
  await context.close();
});

section('deep link to the start of exchange 3 shows two finished exchanges and the Project file', async (browser) => {
  const { page, context } = await fresh(browser, { hash: '#beat=3' });
  assert.equal(await count(page, '#thread > li.message.airport'), 2);
  assert.equal(await count(page, '#thread > li.message.assistant'), 2);
  assert.equal(await page.locator('#landing').isVisible(), false);
  const file = await page.locator('#file').innerText();
  assert.match(file, /Runway sweeper replacement/);
  assert.match(file, /Understand · Apply context/);
  assert.match(file, /Normal federal share/);
  assert.match(file, /90% of allowable costs/);
  assert.match(file, /You said/);
  await context.close();
});

section('final state: discrepancy flagged, open items grouped, drafts offered, finish card shown', async (browser) => {
  const { page, context } = await fresh(browser, { hash: '#beat=7' });
  assert.equal(await count(page, '#thread > li.message'), 12);
  const file = await page.locator('#file').innerText();
  assert.match(file, /\$610,000/);
  assert.match(file, /Differs from the \$650,000 allowance/);
  assert.match(file, /Before the solicitation/);
  assert.match(file, /Before the grant application/);
  assert.match(file, /Ready · Build the record/);
  assert.equal(await count(page, '.attachment'), 4);
  assert.equal(await page.locator('#finish').isVisible(), true);
  const cta = page.locator('#finish a.button');
  assert.equal(await cta.getAttribute('href'), '/book-a-call', 'the primary end-of-demo action is the booking page');
  assert.match(await cta.innerText(), /book a call/i);
  const email = page.locator('#finish [data-contact-cta="tour_email"]');
  assert.equal(await email.getAttribute('href'), 'mailto:contact@tarmacsync.com');
  assert.match(await page.locator('#finish').innerText(), /contact@tarmacsync\.com/, 'the address is visible text, not only a link');
  assert.equal(await count(page, '#finish [data-report-cta]'), 0, 'no report download offered as the next step');
  await context.close();
});

section('the bid sequence table shows the Handbook steps in order and names its source', async (browser) => {
  const { page, context } = await fresh(browser, { hash: '#beat=7' });
  const table = page.locator('table.sequence');
  assert.equal(await table.count(), 1);
  const text = await table.innerText();
  const at = (k) => text.indexOf(k);
  assert.ok(at('Advertise') > -1 && at('Advertise') < at('Open bids') && at('Open bids') < at('grant application') && at('grant application') < at('Award'), 'order');
  assert.match(await page.locator('.table-note').innerText(), /Table 5-4/);
  await context.close();
});

section('source chips: never more than three per reply', async (browser) => {
  const { page, context } = await fresh(browser, { hash: '#beat=7' });
  const groups = page.locator('.message.assistant .sources');
  const n = await groups.count();
  assert.equal(n, 6);
  for (let i = 0; i < n; i++) assert.ok((await groups.nth(i).locator('.source-chip').count()) <= 3);
  await context.close();
});

section('autoplay: composer types, then the message sends, then TarmacSync answers', async (browser) => {
  const { page, advance, context } = await fresh(browser);
  await advance(3500 + 1500);                        // landing, then partway through typing
  const partial = await page.locator('#composer-text').innerText();
  assert.ok(partial.length > 5 && partial.length < 150, 'typing in progress: ' + partial.length);
  assert.equal(await count(page, '#thread > li'), 0);
  await advance(3500);                               // typing done, sent, thinking, streaming
  assert.equal(await count(page, '#thread > li.message.airport'), 1);
  assert.equal(await page.locator('#composer-text').innerText(), '');
  await advance(10000);                              // first answer finished (~16.6 s), second exchange not yet sent (~21.7 s)
  assert.equal(await count(page, '#thread > li.message.assistant'), 1);
  assert.equal(await count(page, '.message.assistant .source-chip'), 3);
  await context.close();
});

section('pause holds the clock; play resumes; the label follows', async (browser) => {
  const { page, advance, context } = await fresh(browser);
  await advance(6000);
  assert.equal((await page.locator('#play').innerText()).trim(), 'Pause');
  await page.locator('#play').click();
  const frozen = await page.locator('#clock').innerText();
  await advance(5000);
  assert.equal(await page.locator('#clock').innerText(), frozen, 'paused clock must not move');
  assert.equal((await page.locator('#play').innerText()).trim(), 'Play');
  await page.locator('#play').click();
  await advance(3000);
  assert.notEqual(await page.locator('#clock').innerText(), frozen);
  await context.close();
});

section('playing to the end stops, shows the finish card, and offers Replay', async (browser) => {
  const { page, advance, context } = await fresh(browser);
  await advance(200000);
  assert.equal(await count(page, '#thread > li.message'), 12);
  assert.equal(await page.locator('#finish').isVisible(), true);
  assert.equal((await page.locator('#play').innerText()).trim(), 'Replay');
  assert.match(await page.locator('#clock').innerText(), /^(\d+:\d\d) \/ \1$/);
  await context.close();
});

section('restart clears everything and plays from the start', async (browser) => {
  const { page, advance, context } = await fresh(browser);
  await advance(60000);
  assert.ok((await count(page, '#thread > li')) > 2);
  await page.locator('#restart').click();
  assert.equal(await count(page, '#thread > li'), 0);
  assert.equal(await page.locator('#landing').isVisible(), true);
  assert.equal((await page.locator('#play').innerText()).trim(), 'Pause');
  await advance(2000);
  assert.equal(await count(page, '#thread > li'), 0);
  await context.close();
});

section('scrubbing backward mid-reply leaves no duplicates or stale extras', async (browser) => {
  const { page, advance, context } = await fresh(browser);
  await advance(200000);
  await page.locator('#ticks button[data-mark="2"]').click();
  assert.equal(await count(page, '#thread > li.message'), 2);
  assert.equal(await count(page, '.attachment'), 0);
  assert.equal(await count(page, 'table.sequence'), 0);
  assert.equal(await page.locator('#finish').isVisible(), false);
  assert.equal((await page.locator('#play').innerText()).trim(), 'Play');
  const file = await page.locator('#file').innerText();
  assert.ok(!/Ready · Build the record/.test(file), 'file rolled back too');
  assert.equal(await count(page, '.cursor'), 0, 'no typing cursor when nothing is streaming');
  await page.locator('#scrub').focus();
  await page.keyboard.press('End');
  assert.equal(await count(page, '#thread > li.message'), 12);
  assert.equal(await count(page, '.attachment'), 4);
  await page.keyboard.press('Home');
  assert.equal(await count(page, '#thread > li'), 0);
  await context.close();
});

section('speed toggle changes how fast time passes', async (browser) => {
  const a = await fresh(browser); const b = await fresh(browser);
  await b.page.locator('#speed').click();
  assert.equal((await b.page.locator('#speed').innerText()).trim(), '1.5×');
  await a.advance(20000); await b.advance(20000);
  const secs = async (p) => { const [m, s] = (await p.locator('#clock').innerText()).split(' / ')[0].split(':').map(Number); return m * 60 + s; };
  assert.ok((await secs(b.page)) > (await secs(a.page)) + 5, 'faster clock');
  await a.context.close(); await b.context.close();
});

section('hash restores a paused position; bad hashes fall back to the start', async (browser) => {
  const ok = await fresh(browser, { hash: '#beat=3' });
  assert.equal((await ok.page.locator('#play').innerText()).trim(), 'Play');
  await ok.advance(5000);
  assert.equal(await count(ok.page, '#thread > li'), 4, 'restored position stays paused');
  await ok.context.close();
  for (const h of ['#beat=99', '#beat=-1', '#beat=abc', '#beat=', '#unknown']) {
    const bad = await fresh(browser, { hash: h });
    assert.equal(await count(bad.page, '#thread > li'), 0, h);
    assert.equal((await bad.page.locator('#play').innerText()).trim(), 'Pause', h);
    assert.deepEqual(bad.errors, [], h);
    await bad.context.close();
  }
});

section('the hash follows playback', async (browser) => {
  const { page, advance, context } = await fresh(browser);
  await advance(40000);
  assert.match(page.url(), /#beat=[2-4]$/);
  await context.close();
});

section('reduced motion shows the finished state, paused, with a play control', async (browser) => {
  const { page, context, advance } = await fresh(browser, { reducedMotion: true });
  assert.equal(await count(page, '#thread > li.message'), 12);
  assert.equal(await page.locator('#finish').isVisible(), true);
  assert.equal((await page.locator('#play').innerText()).trim(), 'Play the walkthrough');
  await page.locator('#play').click();
  assert.equal(await count(page, '#thread > li'), 0);
  await advance(6000);
  assert.ok((await page.locator('#clock').innerText()).startsWith('0:0'), 'plays from the start');
  await context.close();
});

const clockSeconds = async (page) => { const [m, s] = (await page.locator('#clock').innerText()).split(' / ')[0].split(':').map(Number); return m * 60 + s; };

section('scrolling up to reread never pauses the demo: it stops auto-scroll and offers Jump to latest', async (browser) => {
  const { page, context } = await fresh(browser, { hash: '#beat=5', realClock: true });
  await page.waitForTimeout(300);
  await page.locator('#play').click();
  await page.waitForTimeout(600);
  assert.equal((await page.locator('#play').innerText()).trim(), 'Pause', 'playing before the gesture');
  await page.locator('#scroller').hover();
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(300);
  assert.equal((await page.locator('#play').innerText()).trim(), 'Pause', 'a wheel scroll must not pause');
  const c1 = await clockSeconds(page);
  const top = await page.locator('#scroller').evaluate((n) => n.scrollTop);
  await page.waitForTimeout(1500);
  assert.ok((await clockSeconds(page)) > c1, 'the demo kept playing while the viewer read');
  assert.ok((await page.locator('#scroller').evaluate((n) => n.scrollTop)) <= top + 2, 'view is not dragged back down');
  assert.equal(await page.locator('#jump-latest').isVisible(), true, 'a way back to the live end is offered');
  await page.locator('#jump-latest').click();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#jump-latest').isVisible(), false);
  assert.equal((await page.locator('#play').innerText()).trim(), 'Pause', 'still playing');
  await page.locator('#scroller').evaluate((n) => { n.scrollTop = 0; });   // scrollbar-style scroll
  await page.waitForTimeout(300);
  assert.equal((await page.locator('#play').innerText()).trim(), 'Pause', 'a scrollbar drag must not pause either');
  await context.close();
});

section('only Pause, the end, an open dialog or a hidden tab stop the demo: scrubbing and jumping keep its state', async (browser) => {
  const { page, context } = await fresh(browser, { hash: '#beat=2', realClock: true });
  await page.waitForTimeout(300);
  await page.locator('#play').click();
  await page.locator('#ticks button[data-mark="4"]').click();
  await page.waitForTimeout(300);
  assert.equal((await page.locator('#play').innerText()).trim(), 'Pause', 'jumping while playing keeps playing');
  const c1 = await clockSeconds(page);
  await page.waitForTimeout(1500);
  assert.ok((await clockSeconds(page)) > c1, 'and time keeps moving from the new point');
  await page.locator('#scrub').focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  assert.equal((await page.locator('#play').innerText()).trim(), 'Pause', 'scrubbing while playing keeps playing');
  await page.locator('#play').click();                       // the viewer presses Pause
  await page.locator('#ticks button[data-mark="2"]').click();
  await page.waitForTimeout(300);
  assert.equal((await page.locator('#play').innerText()).trim(), 'Play', 'jumping while paused stays paused');
  await context.close();
});

section('a hidden tab does not fast-forward the demo', async (browser) => {
  const { page, advance, context } = await fresh(browser);
  await advance(5000);
  const before = await page.locator('#clock').innerText();
  assert.ok(!before.startsWith('0:00'), 'time was advancing before the tab was hidden: ' + before);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await advance(30000);
  assert.equal(await page.locator('#clock').innerText(), before, 'no progress while hidden');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await advance(1000);
  const [m, s] = (await page.locator('#clock').innerText()).split(' / ')[0].split(':').map(Number);
  assert.ok(m * 60 + s <= 12, 'time resumed normally, not by a jump');
  await context.close();
});

section('whole messages are announced to assistive tech, not characters', async (browser) => {
  const { page, advance, context } = await fresh(browser);
  await advance(26000);
  const status = await page.locator('#status').innerText();
  assert.match(status, /^(Airport team|TarmacSync): /);
  assert.ok(status.length > 40);
  await context.close();
});

section('a source chip opens the citation with edition and check date, and closes with Escape', async (browser) => {
  const { page, context } = await fresh(browser, { hash: '#beat=3' });
  const chip = page.locator('.message.assistant').first().locator('.source-chip').first();
  await chip.click();
  const dlg = page.locator('#detail-dialog');
  assert.equal(await dlg.evaluate((n) => n.open), true);
  const text = await dlg.innerText();
  assert.match(text, /Table M-1/);
  assert.match(text, /AIP Handbook/);
  assert.match(text, /Change 1/);
  assert.match(text, /checked/i);
  assert.match(text, /paraphrase/i);
  await page.keyboard.press('Escape');
  assert.equal(await dlg.evaluate((n) => n.open), false);
  await context.close();
});

section('opening a dialog while playing pauses; closing resumes only if it was playing', async (browser) => {
  const a = await fresh(browser);
  await a.advance(30000);
  await a.page.locator('.message.assistant .source-chip').first().click();
  const t1 = await a.page.locator('#clock').innerText();
  await a.advance(8000);
  assert.equal(await a.page.locator('#clock').innerText(), t1, 'clock frozen behind dialog');
  await a.page.locator('#close-detail').click();
  await a.advance(3000);
  assert.notEqual(await a.page.locator('#clock').innerText(), t1, 'resumed after close');
  await a.context.close();

  const b = await fresh(browser, { hash: '#beat=7' });
  await b.page.locator('.attachment').first().click();
  await b.page.keyboard.press('Escape');
  await b.advance(4000);
  assert.equal((await b.page.locator('#play').innerText()).trim(), 'Play', 'a paused viewer stays paused');
  await b.context.close();
});

section('all four review drafts open, say "Not decided" or draft status, and stay fictional', async (browser) => {
  const { page, context } = await fresh(browser, { hash: '#beat=7' });
  const titles = [];
  for (let i = 0; i < 4; i++) {
    await page.locator('.attachment').nth(i).click();
    const text = await page.locator('#detail-dialog').innerText();
    titles.push(await page.locator('#detail-title').innerText());
    assert.match(text, /fictional/i);
    assert.match(text, /Not a purchase authorization|Not decided/);
    assert.ok(!CODENAME.test(text));
    await page.keyboard.press('Escape');
  }
  assert.deepEqual(titles, ['Route memo', 'Pre-solicitation readiness checklist', 'Questions for the ADO', 'Bid evaluation and grant application checklist']);
  await context.close();
});

section('the route memo carries the federal share illustration and the assurances', async (browser) => {
  const { page, context } = await fresh(browser, { hash: '#beat=7' });
  await page.locator('.attachment').first().click();
  const text = await page.locator('#detail-body').innerText();
  assert.match(text, /90% of allowable costs/);
  assert.match(text, /\$585,000 federal and about \$65,000 local/);
  assert.match(text, /34 Policies, Standards, and Specifications/);
  assert.match(text, /April 2025 set/);
  await context.close();
});

section('the full transcript is readable in one dialog', async (browser) => {
  const { page, context } = await fresh(browser);
  await page.locator('#transcript').click();
  const text = await page.locator('#detail-body').innerText();
  assert.match(text, /airport team/i);   // labels are upper-cased by CSS, so match case-insensitively
  assert.match(text, /tarmacsync/i);
  assert.match(text, /We need to replace our runway sweeper/);
  assert.match(text, /Go with sealed bids/);
  assert.match(text, /likely buying path/);
  await context.close();
});

section('focus moves into the dialog and returns to the chip on close', async (browser) => {
  const { page, context } = await fresh(browser, { hash: '#beat=7' });
  const chip = page.locator('.message.assistant').first().locator('.source-chip').first();
  await chip.focus(); await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.closest('dialog') !== null), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains('source-chip')), true);
  await context.close();
});

section('no horizontal overflow at 320, 375, 768 and 1440 across start, middle and end', async (browser) => {
  for (const width of [320, 375, 768, 1440]) {
    for (const hash of ['', '#beat=3', '#beat=7']) {
      const { page, context } = await fresh(browser, { width, height: 900, hash });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 0, width + ' ' + (hash || 'start') + ' overflows by ' + overflow);
      await context.close();
    }
  }
});

section('on a phone the Project file is a collapsible bar that reports its counts', async (browser) => {
  const { page, context } = await fresh(browser, { width: 390, height: 844, hash: '#beat=7' });
  const toggle = page.locator('#file-toggle');
  assert.match(await toggle.innerText(), /Project file · \d+ known · \d+ open/);
  assert.equal(await page.locator('#file').isVisible(), false);
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('#file').isVisible(), true);
  await context.close();
});

section('keyboard: skip link, controls and chips are reachable', async (browser) => {
  const { page, context } = await fresh(browser, { hash: '#beat=7' });
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Skip to the demonstration');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content');
  for (const sel of ['#play', '#restart', '#scrub', '#speed', '#skip', '#transcript']) {
    await page.locator(sel).focus();
    assert.equal(await page.evaluate(() => document.activeElement.matches(':focus-visible')), true, sel);
  }
  await context.close();
});

section('clicking inside the dialog (including its margins) does not close it; the backdrop does', async (browser) => {
  const { page, context } = await fresh(browser, { hash: '#beat=3' });
  await page.locator('.message.assistant').first().locator('.source-chip').first().click();
  const dlg = page.locator('#detail-dialog');
  const t = await page.locator('#detail-title').boundingBox();
  await page.mouse.click(t.x - 8, t.y + 4);
  assert.equal(await dlg.evaluate((n) => n.open), true, 'click in the title margin keeps it open');
  const box = await dlg.boundingBox();
  await page.mouse.click(box.x + box.width + 10, box.y + 20);
  assert.equal(await dlg.evaluate((n) => n.open), false, 'click on the backdrop closes it');
  await context.close();
});

section('restart keeps playing', async (browser) => {
  const { page, context } = await fresh(browser, { hash: '#beat=5', realClock: true });
  await page.waitForTimeout(300);
  await page.locator('#play').click();
  await page.waitForTimeout(500);
  await page.locator('#restart').click();
  await page.waitForTimeout(600);
  assert.equal((await page.locator('#play').innerText()).trim(), 'Pause', 'restart keeps playing');
  await context.close();
});

section('phone: opening the Project file brings it into view', async (browser) => {
  const { page, context } = await fresh(browser, { width: 375, height: 667, hash: '#beat=7' });
  await page.locator('#file-toggle').scrollIntoViewIfNeeded();
  await page.locator('#file-toggle').click();
  const r = await page.locator('#file').boundingBox();
  assert.ok(r.y >= 0 && r.y < 667 - 80, 'file body starts on screen, not below the fold: y=' + r.y);
  await context.close();
});

section('drafts list their sources', async (browser) => {
  const { page, context } = await fresh(browser, { hash: '#beat=7' });
  await page.locator('.attachment').first().click();
  const text = await page.locator('#detail-body').innerText();
  assert.match(text, /Sources/);
  assert.match(text, /Assurance 34: Policies, Standards, and Specifications/);
  assert.match(text, /Table 4-7/);
  await context.close();
});

section('speed cycles 1x, 1.5x, 0.75x and 0.75x really is slower', async (browser) => {
  const a = await fresh(browser); const c = await fresh(browser);
  const seen = [];
  for (let i = 0; i < 3; i++) {
    await c.page.locator('#speed').click();
    seen.push((await c.page.locator('#speed').innerText()).trim());
  }
  assert.deepEqual(seen, ['1.5×', '0.75×', '1×']);
  await c.page.locator('#speed').click(); await c.page.locator('#speed').click();   // 1.5x then 0.75x
  assert.equal((await c.page.locator('#speed').innerText()).trim(), '0.75×');
  assert.match(await c.page.locator('#speed').getAttribute('aria-label'), /0\.75×/);
  await a.advance(20000); await c.advance(20000);
  const secs = async (p) => { const [m, s] = (await p.locator('#clock').innerText()).split(' / ')[0].split(':').map(Number); return m * 60 + s; };
  assert.ok((await secs(c.page)) < (await secs(a.page)) - 3, 'slower clock');
  await a.context.close(); await c.context.close();
});

section('scrubbing to the middle of a reply shows a partial reply, one cursor, and no extras', async (browser) => {
  const { page, context } = await fresh(browser);
  const setScrub = (v) => page.locator('#scrub').evaluate((n, val) => { n.value = String(val); n.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  await setScrub(29400);
  assert.equal(await count(page, '#thread > li.message.airport'), 2);
  assert.equal(await count(page, '#thread > li.message.assistant'), 2);
  assert.equal(await count(page, '.cursor'), 1);
  assert.equal(await count(page, '.message.assistant:last-child .source-chip'), 0, 'no extras on the unfinished reply');
  await setScrub(5000);
  assert.equal(await count(page, '#thread > li'), 0);
  assert.equal(await count(page, '.cursor'), 0);
  await setScrub(29400);
  assert.equal(await count(page, '#thread > li'), 4, 'no duplicates after scrubbing back in');
  await context.close();
});

section('stage tracker: the five homepage stages light up in order as the demo plays', async (browser) => {
  const { page, context } = await fresh(browser);
  const items = page.locator('#stages > li');
  assert.equal(await items.count(), 5);
  const names = await items.allInnerTexts();
  ['START', 'UNDERSTAND', 'ROUTE', 'CHECK', 'READY'].forEach((k, i) => assert.match(names[i], new RegExp(k)));
  assert.equal(await count(page, '#stages .is-current'), 0, 'nothing current on the landing screen');
  const at = (mark) => page.locator('#ticks button[data-mark="' + mark + '"]').click();
  await at(1);                                             // start of exchange 1
  assert.match(await page.locator('#stages .is-current').innerText(), /START/);
  await at(3);                                             // documents: stage 2
  assert.match(await page.locator('#stages .is-current').innerText(), /UNDERSTAND/);
  assert.equal(await count(page, '#stages .is-done'), 1);
  assert.equal(await page.locator('#stages .is-current').getAttribute('aria-current'), 'step');
  await at(6);                                             // path and file: stage 5
  assert.match(await page.locator('#stages .is-current').innerText(), /READY/);
  assert.equal(await count(page, '#stages .is-done'), 4);
  await at(7);                                             // finish: all done
  assert.equal(await count(page, '#stages .is-done'), 5);
  assert.equal(await count(page, '#stages .is-current'), 0);
  await context.close();
});

section('continuity: header mirrors the site CTA; the finish card leads back into the site and can replay', async (browser) => {
  const { page, context } = await fresh(browser, { hash: '#beat=7' });
  assert.equal(await page.locator('.header-cta').getAttribute('href'), '/book-a-call');
  assert.match(await page.locator('.header-cta').innerText(), /^book a call$/i);
  assert.ok(!/free report/i.test(await page.locator('header').innerText()), 'no report offer anywhere in the demo header');
  const links = await page.locator('#finish a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  assert.ok(links.includes('/book-a-call'), 'Book a call');
  assert.ok(links.includes('mailto:contact@tarmacsync.com'), 'email fallback');
  assert.ok(!links.includes('/#report'), 'no report download at the end of the demo');
  assert.ok(links.includes('/#product-model'), 'back to How TarmacSync works');
  await page.locator('#replay').click();
  assert.equal(await count(page, '#thread > li'), 0);
  assert.equal((await page.locator('#play').innerText()).trim(), 'Pause');
  await context.close();
});

section('phone: the stage tracker fits and names the current stage', async (browser) => {
  const { page, context } = await fresh(browser, { width: 375, height: 800, hash: '#beat=4' });
  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, 'no overflow');
  assert.match(await page.locator('#stage-caption').innerText(), /Stage 3 of 5/);
  assert.match(await page.locator('#stage-caption').innerText(), /ROUTE/);
  await context.close();
});

section('no phantom scroll: after the finish the document ends at the footer, on desktop and phone', async (browser) => {
  for (const width of [1440, 390]) {
    const { page, context } = await fresh(browser, { width, height: width === 390 ? 844 : 900, hash: '#beat=7' });
    const { gap, scrollable } = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        gap: doc.scrollHeight - (document.querySelector('.site-footer').getBoundingClientRect().bottom + scrollY),
        scrollable: doc.scrollHeight - innerHeight,
      };
    });
    // A page shorter than the window has nothing to scroll, so slack below the footer is not blank scroll.
    assert.ok(scrollable <= 0 || gap <= 8, width + 'px wide: ' + Math.round(gap) + 'px of blank scroll below the footer');
    if (width !== 390) {
      const footerTop = await page.evaluate(() => document.querySelector('.site-footer').getBoundingClientRect().top + scrollY);
      assert.ok(footerTop >= 900 - 8, width + 'px wide: the demo should fill the first screen and the footer sit below it (footer starts at ' + Math.round(footerTop) + 'px of 900)');
    }
    await context.close();
  }
});

section('phone controls: touch-sized, no overlapping first mark, sensible order', async (browser) => {
  const { page, context } = await fresh(browser, { width: 390, height: 844, hash: '#beat=4' });
  const marks = await page.locator('#ticks button').evaluateAll((bs) => bs.map((b) => b.dataset.mark));
  assert.deepEqual(marks, ['1', '2', '3', '4', '5', '6', '7'], 'the Start mark overlapped the first exchange; Restart covers it');
  for (const b of await page.locator('#ticks button').all()) {
    const r = await b.boundingBox();
    assert.ok(r.width >= 44 && r.height >= 44, 'tick ' + (await b.getAttribute('data-mark')) + ' is ' + Math.round(r.width) + 'x' + Math.round(r.height));
  }
  assert.ok((await page.locator('#scrub').boundingBox()).height >= 44, 'scrubber is at least 44px tall');
  const y = async (sel) => { const r = await page.locator(sel).boundingBox(); return r.y + r.height / 2; };
  assert.ok(Math.abs((await y('#clock')) - (await y('#restart'))) < 30, 'clock sits beside Restart, not orphaned below');
  assert.ok(Math.abs((await y('#speed')) - (await y('#skip'))) < 30, 'speed sits beside Skip');
  await context.close();
});

section('phone: finish card links, Watch again and footer links are tappable', async (browser) => {
  const { page, context } = await fresh(browser, { width: 390, height: 844, hash: '#beat=7' });
  await page.evaluate(() => { const s = document.getElementById('scroller'); s.scrollTop = s.scrollHeight; });
  for (const sel of ['#finish .button', '#finish a.subtle', '#replay', '.site-footer a']) {
    for (const el of await page.locator(sel).all()) {
      const r = await el.boundingBox();
      assert.ok(r.height >= 44, sel + ' "' + (await el.innerText()).trim() + '" is only ' + Math.round(r.height) + 'px tall');
    }
  }
  await context.close();
});

section('phone: logo, label and Book a call share one row even at 320px', async (browser) => {
  const { page, context } = await fresh(browser, { width: 320, height: 568 });
  const a = await page.locator('.header-cta').boundingBox();
  const b = await page.locator('.brand').boundingBox();
  assert.ok(Math.abs((a.y + a.height / 2) - (b.y + b.height / 2)) < 12, 'CTA and logo are on different rows (' + Math.round(a.y) + ' vs ' + Math.round(b.y) + ')');
  assert.ok(a.height >= 40, 'Book a call stays a comfortable touch target (' + Math.round(a.height) + 'px)');
  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0);
  await context.close();
});

section('phone: the opened Project file does not repeat its own title', async (browser) => {
  const { page, context } = await fresh(browser, { width: 390, height: 844, hash: '#beat=4' });
  await page.locator('#file-toggle').click();
  assert.equal(await page.locator('#file .file-head').isVisible(), false);
  await context.close();
});

section('homepage product section: the toggle swaps the scenario and the layout holds on desktop and phones', async (browser) => {
  {
    const { page, context } = await fresh(browser, { width: 1280, height: 900, path: '/index.html' });
    assert.equal((await page.locator('#ts-route').innerText()).trim(), 'A path that fits your purchase');
    await page.locator('#product [data-view="example"]').click();
    assert.equal((await page.locator('#ts-route').innerText()).trim(), 'Sealed competitive bids');
    assert.match(await page.locator('#ts-purchase').innerText(), /\$650,000/);
    assert.equal(await page.locator('#product [data-view="example"]').getAttribute('aria-pressed'), 'true');
    await page.locator('#product [data-view="overview"]').click();
    assert.equal((await page.locator('#ts-route').innerText()).trim(), 'A path that fits your purchase');
    await context.close();
  }
  for (const width of [390, 320]) {
    const { page, context } = await fresh(browser, { width, height: 844, path: '/index.html' });
    await page.locator('#product').scrollIntoViewIfNeeded();
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, width + 'px: no sideways scroll');
    for (const v of ['overview', 'example']) {
      const box = await page.locator('#product [data-view="' + v + '"]').boundingBox();
      assert.ok(box.height >= 44 && box.x >= 0 && box.x + box.width <= width, width + 'px: the ' + v + ' toggle is a full-size tap target on screen');
    }
    await context.close();
  }
});

section('homepage closing line: one sentence on one line, with space before its button', async (browser) => {
  for (const width of [1440, 1280]) {
    const { page, context } = await fresh(browser, { width, height: 900, path: '/index.html' });
    const r = await page.evaluate(() => {
      const h = document.querySelector('[aria-label="Call to action"] h2'), b = document.querySelector('[aria-label="Call to action"] .btn');
      return { lines: Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight)), gap: b.getBoundingClientRect().top - h.getBoundingClientRect().bottom };
    });
    assert.equal(r.lines, 1, width + 'px: the closing sentence takes ' + r.lines + ' lines');
    assert.ok(r.gap >= 20, width + 'px: only ' + Math.round(r.gap) + 'px between the sentence and the button');
    await context.close();
  }
});

section('pricing: the profile sentence sits on one line on desktop and wraps cleanly on a phone', async (browser) => {
  for (const [width, oneLine] of [[1440, true], [1280, true], [390, false]]) {
    const { page, context } = await fresh(browser, { width, height: 900, path: '/pricing.html' });
    const lines = await page.locator('.tier-heading h2').evaluate((h) => Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight)));
    if (oneLine) assert.equal(lines, 1, width + 'px wide: the sentence takes ' + lines + ' lines');
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, width + 'px: no sideways scroll');
    await context.close();
  }
});

section('homepage on a phone: the demo buttons are real, tappable buttons and the five stages all fit on screen', async (browser) => {
  for (const width of [390, 320]) {
    const { page, context } = await fresh(browser, { width, height: 844, path: '/index.html' });
    for (const where of ['vision', 'workflow']) {
      const btn = page.locator('[data-tour-cta="' + where + '"]');
      await btn.scrollIntoViewIfNeeded();
      assert.equal((await btn.innerText()).trim().replace(/\s*→$/, ''), 'Watch the demo', where + ' button label');
      assert.ok((await btn.boundingBox()).height >= 44, width + 'px: ' + where + ' button is at least 44px tall');
      assert.match(await btn.evaluate((a) => getComputedStyle(a).display), /flex|block/, where + ' looks like a button, not a text link');
    }
    const stages = page.locator('#product-model .ts-button');
    assert.equal(await stages.count(), 5);
    for (let i = 0; i < 5; i++) {
      const box = await stages.nth(i).boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width, width + 'px: stage ' + (i + 1) + ' is fully on screen (x ' + Math.round(box.x) + ', width ' + Math.round(box.width) + ')');
      assert.ok(box.height >= 44, 'stage ' + (i + 1) + ' is a comfortable tap target');
    }
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, width + 'px: no sideways scroll');
    await context.close();
  }
});

// SECTIONS-END

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  let failed = 0;
  try {
    for (const s of sections) {
      try { await s.fn(browser); console.log('ok  ' + s.name); }
      catch (e) { failed++; console.error('FAIL ' + s.name + '\n' + (e.stack || e.message).split('\n').slice(0, 4).join('\n')); }
    }
  } finally { await browser.close(); }
  console.log(failed ? '\n' + failed + ' failing' : '\nbrowser checks passed');
  process.exit(failed ? 1 : 0);
})();
