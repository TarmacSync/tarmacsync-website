#!/usr/bin/env node
// Node-only guards for the demo tour copy and timeline. No browser required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
let failed = 0;
const test = (name, fn) => {
  try { fn(); console.log('ok  ' + name); }
  catch (e) { failed++; console.error('FAIL ' + name + '\n' + e.message); }
};

const script = require('../assets/tour/tour-script.js');

const shippedFiles = ['tour.html', 'assets/tour/tour-script.js', 'assets/tour/tour-state.js', 'assets/tour/tour-ui.js', 'assets/tour/tour.css']
  .filter((p) => fs.existsSync(path.join(root, p)));

// The internal product name and one named consortium must never appear in shipped copy. The
// patterns are assembled from pieces so those words are not written out in this public repo.
const CODENAME = new RegExp(['path', 'finder'].join(''), 'i');
const NAMED_CONSORTIUM = new RegExp(['source', 'well'].join(''), 'i');

const FORBIDDEN = [
  [CODENAME, 'internal product name'],
  [NAMED_CONSORTIUM, 'named consortium'],
  [/\bcompliant\b/i, 'forbidden vocabulary'],
  [/\bapproved\b/i, 'forbidden vocabulary'],
  [/FAA-approved/i, 'forbidden vocabulary'],
  [/\bguarantee[sd]?\b/i, 'forbidden vocabulary'],
  [/final determination/i, 'forbidden vocabulary'],
  [/recommended path/i, 'forbidden vocabulary'],
  [/use this contract/i, 'forbidden vocabulary'],
  [/eligible without validation/i, 'forbidden vocabulary'],
  [/(?<!may )\b(?:is|are|be)\s+eligible\b/i, 'bare eligibility claim'],
  [/\b(OMNIA|NASPO|TIPS-USA|Oshkosh|Vammas|Wausau|Aebi|Schmidt)\b/, 'real consortium or vendor'],
];

function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}

test('script has six exchanges with the required shape', () => {
  assert.equal(script.beats.length, 6);
  const ids = new Set();
  script.beats.forEach((b) => {
    assert.ok(b.id && !ids.has(b.id), 'unique id ' + b.id); ids.add(b.id);
    assert.ok(b.label && b.user.length > 10, 'label and user text ' + b.id);
    assert.ok(Array.isArray(b.reply.paras) && b.reply.paras.length >= 2, 'reply paragraphs ' + b.id);
    b.reply.paras.forEach((p) => assert.ok(p.text.length > 20, 'paragraph text ' + b.id));
    assert.ok(Array.isArray(b.file), 'file ops ' + b.id);
  });
  assert.equal(script.candidates, undefined, 'no cooperative candidates in the competitive-bid scenario');
  assert.ok(script.tables && script.tables.sequence, 'sequence table exists');
  assert.deepEqual(Object.keys(script.artifacts).sort(), ['ado', 'bideval', 'checklist', 'memo']);
});

test('every reply has at most three source chips and every id resolves', () => {
  script.beats.forEach((b) => {
    assert.ok(b.reply.sources.length >= 1 && b.reply.sources.length <= 3, 'chip count ' + b.id);
    b.reply.sources.forEach((id) => assert.ok(script.citations[id], 'unknown citation ' + id));
    (b.reply.artifacts || []).forEach((id) => assert.ok(script.artifacts[id], 'unknown artifact ' + id));
  });
  Object.entries(script.citations).forEach(([id, c]) => {
    ['label', 'source', 'ref', 'gist', 'edition', 'checked'].forEach((k) => assert.ok(c[k], id + ' missing ' + k));
  });
});

test('no forbidden vocabulary, product codename, or real names anywhere shipped', () => {
  const corpus = [
    ...shippedFiles.map((p) => [p, read(p)]),
    ['script-strings', strings(script).join('\n')],
  ];
  corpus.forEach(([name, text]) => {
    FORBIDDEN.forEach(([re, why]) => {
      const m = text.match(re);
      assert.ok(!m, name + ' contains "' + (m && m[0]) + '" (' + why + ')');
    });
  });
});

test('$150,000 appears only in strings that also say "edition"', () => {
  strings(script).filter((s) => s.includes('$150,000')).forEach((s) => {
    assert.match(s, /edition/i, 'stale threshold without currency note: ' + s.slice(0, 80));
  });
  shippedFiles.filter((p) => !p.endsWith('tour-script.js')).forEach((p) => {
    assert.ok(!read(p).includes('$150,000'), p + ' mentions $150,000');
  });
  assert.match(script.citations.sat.gist, /\$350,000/);
  assert.match(script.citations.sat.gist, /\$150,000/);
});

test('federal share arithmetic and citations are consistent', () => {
  assert.equal(650000 * 0.9, 585000);
  assert.equal(650000 - 585000, 65000);
  const text = strings(script.beats).join('\n');
  assert.match(text, /\$585,000/);
  assert.match(text, /\$65,000/);
  assert.match(text, /90%/);
  assert.match(script.citations.t47.ref, /Table 4-7/);
});

test('demonstration is labeled fictional', () => {
  assert.match(script.banner, /fictional/i);
  assert.match(script.airport.name, /fictional/i);
  if (fs.existsSync(path.join(root, 'assets/tour/tour.css'))) assert.match(read('tour.html'), /fictional/i);
});

test('language rules: uses "likely buying path" and names sealed competitive bidding', () => {
  const text = strings(script.beats).join('\n');
  assert.match(text, /likely buying path/);
  assert.match(text, /sealed/i);
});

test('scenario is AIP + local match with competitive bidding: no cooperative content anywhere shipped', () => {
  const coop = /cooperative|consortium|NPC-4471|MRC-2210|candidate agreement|piggyback/i;
  assert.ok(!coop.test(strings(script).join('\n')), 'script');
  ['tour.html', 'assets/tour/tour-ui.js', 'assets/tour/tour.css'].forEach((p) => assert.ok(!coop.test(read(p)), p));
  const section = read('index.html').match(/<section[^>]*id="interactive-demo"[\s\S]*?<\/section>/)[0];
  assert.ok(!coop.test(section), 'homepage demo section');
});

test('sealed bids are described from 2 CFR 200.320 and the Handbook, including what happens after bid opening', () => {
  const u15 = script.citations.u15;
  assert.match(u15.gist, /lowest responsive and responsible bidder/i);
  assert.match(u15.gist, /reject/i);
  assert.match(u15.edition, /200\.320\(b\)\(1\)\(ii\)/, 'current eCFR lettering recorded');
  assert.match(script.citations.u8.gist, /only one bid/i);
  assert.match(script.citations.u8.gist, /apparent low bidder/i);
  assert.match(script.citations.u24.ref, /200\.326/);
  const route = script.beats[3], bids = script.beats[4];
  assert.equal(route.reply.table, 'sequence');
  assert.ok(route.reply.sources.includes('u15'));
  const bidText = bids.reply.paras.map((p) => (p.lead || '') + ' ' + p.text).join(' ');
  assert.match(bidText, /only one bid/i);
  assert.match(bidText, /writing before award/i);
  assert.match(bidText, /cost analysis/i);
  assert.match(bidText, /\$610,000/);
  assert.ok(!/must (re-?bid|reject)|required to reject/i.test(bidText), 'no invented over-estimate rule');
  const rows = script.tables.sequence.rows.map((r) => r[1]);
  const order = ['Notice of intent', 'Advertise', 'Open bids', 'grant application', 'grant offer', 'Award'];
  let last = -1;
  order.forEach((k) => { const i = rows.findIndex((r) => r.includes(k)); assert.ok(i > last, k + ' in Table 5-4 order'); last = i; });
  const be = strings(script.artifacts.bideval).join(' ');
  assert.match(be, /responsive/); assert.match(be, /responsible/);
  assert.match(be, /cost analysis/i); assert.match(be, /Document the reason/i);
});

const S = require('../assets/tour/tour-state.js');

test('timeline has eight marks, increasing, and runs about two minutes', () => {
  const tl = S.timeline(script);
  assert.equal(tl.marks.length, 8);
  assert.equal(tl.marks[0].at, 0);
  for (let i = 1; i < tl.marks.length; i++) assert.ok(tl.marks[i].at > tl.marks[i - 1].at, 'mark ' + i);
  assert.ok(tl.total >= 90000 && tl.total <= 180000, 'total ms ' + tl.total);
});

test('start state is the landing screen; final state is complete', () => {
  const s0 = S.stateAt(script, 0);
  assert.equal(s0.landing, true);
  assert.equal(s0.messages.length, 0);
  assert.equal(s0.file.known.length, 0);
  const end = S.stateAt(script, 1e9);
  assert.equal(end.ended, true);
  assert.equal(end.messages.length, 12);
  assert.ok(end.messages.filter((m) => m.role === 'assistant').every((m) => m.complete));
  assert.equal(end.file.phase, 'Ready · Build the record');
  const cip = end.file.known.find((k) => k.key === 'cip');
  assert.equal(cip.value, '$610,000');
  assert.ok(cip.flag, 'discrepancy is flagged, not resolved');
  const groups = new Set(end.file.open.map((o) => o.group));
  assert.deepEqual([...groups].sort(), ['application', 'award', 'now', 'solicitation']);
  assert.equal(end.file.open.find((o) => o.key === 'use').done, true);
});

test('at each exchange mark, all earlier exchanges are complete and nothing later has started', () => {
  const tl = S.timeline(script);
  for (let k = 1; k <= 6; k++) {
    const st = S.stateAt(script, tl.marks[k].at);
    assert.equal(st.messages.length, 2 * (k - 1), 'messages at mark ' + k);
    assert.ok(st.messages.filter((m) => m.role === 'assistant').every((m) => m.complete));
    assert.equal(st.markIndex, k);
  }
});

test('state is monotonic in time: messages never disappear and open items are never re-opened', () => {
  const total = S.timeline(script).total;
  let prevMsgs = 0, prevDone = 0, prevKnown = 0;
  for (let t = 0; t <= total; t += 250) {
    const st = S.stateAt(script, t);
    assert.ok(st.messages.length >= prevMsgs, 'messages shrank at ' + t);
    const done = st.file.open.filter((o) => o.done).length;
    assert.ok(done >= prevDone, 'done items shrank at ' + t);
    assert.ok(st.file.known.length >= prevKnown, 'known shrank at ' + t);
    prevMsgs = st.messages.length; prevDone = done; prevKnown = st.file.known.length;
  }
});

test('stateAt is pure: same input, same output, and scrubbing back reproduces earlier state', () => {
  const a = JSON.stringify(S.stateAt(script, 47000));
  S.stateAt(script, 100000);
  const b = JSON.stringify(S.stateAt(script, 47000));
  assert.equal(a, b);
});

test('mid-stream reveal is a strict prefix of the full reply', () => {
  const tl = S.timeline(script);
  const seg = tl.byBeat[1].stream;
  const st = S.stateAt(script, Math.round((seg.start + seg.end) / 2));
  const m = st.messages[3];
  assert.equal(m.role, 'assistant');
  assert.equal(m.complete, false);
  const full = S.replyLength(m.reply);
  assert.ok(m.reveal > 0 && m.reveal < full);
  const flat = (paras) => paras.map((p) => (p.lead ? p.lead + ' ' : '') + p.text).join('|');
  const part = S.revealParas(m.reply, m.reveal).filter((p) => p.started);
  const whole = S.revealParas(m.reply, full);
  assert.ok(flat(whole).startsWith(flat(part).replace(/\s+$/, '')), 'prefix property');
  assert.equal(S.revealParas(m.reply, full).reduce((n, p) => n + (p.lead ? p.lead.length + 1 : 0) + p.text.length, 0), full);
});

test('the documents beat shows documents in the composer before the message is sent', () => {
  const tl = S.timeline(script);
  const d = tl.byBeat[2].docs;
  const early = S.stateAt(script, d.start + 10);
  assert.equal(early.composer.docs.length, 1);
  const late = S.stateAt(script, d.end - 10);
  assert.equal(late.composer.docs.length, 4);
  const sent = S.stateAt(script, tl.byBeat[2].think.start + 10);
  assert.equal(sent.composer.text, '');
  assert.equal(sent.messages[4].docs.length, 4);
});

test('the opening answer does not call FOD debris equipment ineligible: it cites Table L-2 row i', () => {
  assert.ok(script.citations.l2i, 'l2i citation exists');
  assert.match(script.citations.l2i.ref, /Table L-2/);
  assert.match(script.citations.l2i.gist, /500,000/);
  assert.match(script.citations.l2i.gist, /40,000/);
  const first = script.beats[0].reply;
  assert.ok(first.sources.includes('l2i'), 'first reply cites the power sweeper rule');
  const text = first.paras.map((p) => (p.lead || '') + ' ' + p.text).join(' ');
  assert.match(text, /power vacuum sweeper/i);
  assert.ok(!/debris sweeping is different/i.test(text), 'the old overstatement is gone');
});

test('every citation is reachable: a reply chip or a draft Sources list', () => {
  const reachable = new Set();
  script.beats.forEach((b) => b.reply.sources.forEach((id) => reachable.add(id)));
  Object.values(script.artifacts).forEach((a) => {
    assert.ok(Array.isArray(a.sources) && a.sources.length >= 1, a.title + ' lists its sources');
    a.sources.forEach((id) => { assert.ok(script.citations[id], 'unknown source ' + id); reachable.add(id); });
  });
  Object.keys(script.citations).forEach((id) => assert.ok(reachable.has(id), 'citation ' + id + ' is not shown anywhere'));
});

test('citations stay faithful: Buy American ref covers the Appendix X sections it relies on; AC letters not attributed to the Handbook', () => {
  assert.match(script.citations.x1.ref, /X-4/);
  assert.match(script.citations.x1.ref, /Table X-2/);
  assert.match(script.citations.m1d.gist, /traffic volume/i);
  assert.match(script.citations.m1d.gist, /registry/i);
});

test('wherever Buy American paths are listed, all three are named, not two', () => {
  const text = strings(script.artifacts.checklist).join(' ');
  assert.match(text, /certif/i);
  assert.match(text, /conformance list/i);
  assert.match(text, /waiver/i);
});

test('internal docs are not deployed: .vercelignore excludes docs/', () => {
  assert.ok(fs.existsSync(path.join(root, '.vercelignore')), '.vercelignore exists');
  assert.match(read('.vercelignore'), /^docs\/?$/m);
});

test('regulatory currency: cost-and-price rule carries the current eCFR number; small-hub share notes the FY2025-26 nonhub 95%', () => {
  const u = script.citations.u21;
  assert.match(u.label, /200\.324/, 'chip uses the current eCFR section');
  assert.match(u.ref, /200\.323/, 'and names the Handbook numbering it came from');
  assert.match(u.edition, /eCFR/);
  const t = script.citations.t47.gist;
  assert.match(t, /nonhub/i);
  assert.match(t, /2025/);
  assert.match(t, /small hubs?[^.]*\b90%|90%[^.]*small hubs?/i, 'states small hubs stay at 90%');
  assert.match(script.citations.u15.edition, /current eCFR/);
});

test('homepage: the static illustrative example is gone and the demo is linked instead', () => {
  const home = read('index.html');
  assert.ok(!home.includes('sample-snapshot'), 'no anchor to the removed example');
  assert.ok(!/Illustrative, manually prepared example/.test(home), 'old example copy removed');
  assert.ok(!/\$180,000/.test(home), 'old $180,000 example removed');
  assert.match(home, /href="\/tour\.html"[^>]*data-tour-cta="hero"/);
  assert.match(home, /href="\/tour\.html"[^>]*data-tour-cta="section"/);
  assert.match(home, /fictional/i);
  assert.ok(!CODENAME.test(home), 'codename not on the homepage');
});

test('continuity: the demo uses the homepage\'s five stages, in the same order and words', () => {
  const home = read('index.html');
  assert.equal(script.stages.length, 5);
  script.stages.forEach((s) => {
    assert.ok(home.includes(s.label), 'homepage workflow says "' + s.label + '"');
    assert.ok(home.includes(s.key), 'homepage workflow says ' + s.key);
  });
  const order = script.stages.map((s) => home.indexOf(s.key));
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'same order as the homepage');
  let prev = -1;
  script.beats.forEach((b) => {
    assert.ok(Number.isInteger(b.stage) && b.stage >= prev && b.stage <= 4, 'stage is non-decreasing: ' + b.id);
    prev = b.stage;
  });
  assert.equal(new Set(script.beats.map((b) => b.stage)).size, 5, 'every stage is shown');
  const phases = [];
  script.beats.forEach((b) => b.file.forEach((o) => { if (o.op === 'phase') phases.push(o.value); }));
  script.stages.forEach((s) => assert.ok(phases.some((p) => p.startsWith(s.key[0] + s.key.slice(1).toLowerCase() + ' · ' + s.label)), 'Project file phase for ' + s.key));
});

test('continuity: stateAt exposes the stage, from none at the start to all five done at the finish', () => {
  assert.equal(S.stateAt(script, 0).stage, -1);
  assert.equal(S.stateAt(script, 0).stagesDone, 0);
  const tl = S.timeline(script);
  const seen = [];
  for (let t = 0; t <= tl.total; t += 250) { const s = S.stateAt(script, t); seen.push(s.stagesDone); }
  for (let i = 1; i < seen.length; i++) assert.ok(seen[i] >= seen[i - 1], 'stagesDone never decreases');
  const end = S.stateAt(script, 1e9);
  assert.equal(end.stagesDone, 5);
  assert.equal(S.stateAt(script, tl.marks[3].at).stage, 1, 'documents beat is stage 2, Understand');
});

test('continuity: every demo entry point on the homepage uses the same name and links to the demo', () => {
  const home = read('index.html');
  ['hero', 'vision', 'section', 'workflow'].forEach((where) => {
    const m = home.match(new RegExp('<a[^>]*data-tour-cta="' + where + '"[^>]*>([\\s\\S]*?)</a>'));
    assert.ok(m, 'entry point ' + where + ' exists');
    assert.match(m[0], /href="\/tour\.html"/);
    assert.match(m[1].replace(/<[^>]+>/g, ''), /2-minute demo/, where + ' says "2-minute demo"');
  });
});

test('quiet chrome: no header label, footer tagline or disclosure footnote; the banner still says fictional and scripted', () => {
  const t = read('tour.html');
  assert.ok(!/header-label|2-minute demo/.test(t), 'no label in the header');
  assert.ok(!/Human judgment/.test(t), 'no tagline in the footer');
  assert.ok(!/class="disclosure"|Regulatory references paraphrase/.test(t), 'no footnote under the controls');
  assert.match(t, /id="banner"[^>]*>[^<]*fictional airport and documents[^<]*scripted, not live AI/i, 'the banner keeps the disclosure');
});

test('continuity: the demo page mirrors the site header CTA and hands people back to the site', () => {
  const t = read('tour.html');
  const header = t.match(/<header class="tour-header"[\s\S]*?<\/header>/)[0];
  assert.match(header, /class="header-cta"[^>]*href="\/book-a-call\.html"[^>]*>Book a call</);
  assert.match(header, /<a class="brand" href="\/" aria-label="TarmacSync home">/, 'the logo is the way back to the site');
  assert.ok(!/Back to (tarmacsync\.com|site)|class="exit/.test(t), 'no "back to the site" button: the demo is already on the site');
  assert.ok(!/free report|data-report-cta|\/#report/.test(t.replace(/<noscript>[\s\S]*?<\/noscript>/, '')), 'no report offer left on the demo page');
  assert.match(t, /id="stages"/);
  assert.match(t, /href="\/#product-model"/, 'finish card links back to How TarmacSync works');
  assert.match(t, /id="replay"/);
});

test('scenario timing: AIP is planned but not applied for; nothing implies a pending application', () => {
  const all = strings(script).join('\n');
  assert.ok(!/grant decision|decision is (still )?(pending|open)/i.test(all), 'no "grant decision pending" framing anywhere');
  assert.match(script.beats[0].user, /haven’t applied/);
  const funding = script.beats[0].file.find((o) => o.key === 'funding');
  assert.match(funding.value, /not yet applied/i);
  assert.match(strings(script.artifacts.memo).join(' '), /has not yet applied/);
});

test('sequencing: costs before the grant (Table 3-60), the entitlement exception, and the ADO check', () => {
  const c = script.citations.t360;
  assert.ok(c, 't360 citation exists');
  assert.match(c.ref, /Table 3-60/);
  assert.match(c.gist, /after the grant/i);
  assert.match(c.gist, /entitlement/i);
  assert.match(c.edition, /47110/, 'statute check is recorded');
  const b = script.beats[1];
  assert.ok(b.reply.sources.includes('t360'), 'second reply cites it');
  const text = b.reply.paras.map((p) => p.text).join(' ');
  assert.match(text, /after the grant is executed/i);
  assert.match(text, /entitlement/i);
  assert.match(text, /ADO/);
  const funds = script.beats.flatMap((x) => x.file).filter((o) => o.op === 'open' && o.key === 'funds');
  assert.equal(funds.length, 1, 'the funds open item is defined once, where it is explained');
  assert.equal(funds[0].group, 'now', 'route not chosen yet, so it is not filed under "before the solicitation"');
  assert.match(strings(script.artifacts.ado).join(' '), /before the grant is executed/i);
});

test('sequencing copy is route-neutral: it is about incurring a cost, so it must not assume a bid or solicitation', () => {
  const second = script.beats[1].reply.paras.map((p) => p.text).join(' ');
  const funds = script.beats.flatMap((x) => x.file).find((o) => o.op === 'open' && o.key === 'funds');
  [['second reply', second], ['funds open item', funds.text]].forEach(([name, text]) => {
    assert.ok(!/\bbid(s|ding)?\b|solicit/i.test(text), name + ' assumes formal competition: "' + text.slice(0, 80) + '"');
  });
  assert.match(second, /order or sign a contract|commit/i, 'names what actually incurs the cost');
  const ado = strings(script.artifacts.ado).join(' ');
  assert.match(ado, /order or sign a contract/i, 'the ADO question is about incurring a cost, not a particular route');
});

test('grant sequence (Handbook Table 5-4, 5-6): bids feed the application; the application is a named gate', () => {
  const c = script.citations.t54;
  assert.ok(c, 't54 citation exists');
  assert.match(c.ref, /Table 5-4/);
  assert.match(c.ref, /Table 5-6/);
  assert.match(c.gist, /actual bid or negotiated/i);
  const docs = script.beats[2].reply.paras.map((p) => p.text).join(' ');
  assert.match(docs, /grant application/i, 'documents reply explains what goes into the application');
  const ops = script.beats.flatMap((b) => b.file).filter((o) => o.op === 'open');
  const g = (k) => ops.filter((o) => o.key === k).pop().group;
  assert.equal(g('price'), 'application');
  assert.equal(g('match'), 'application');
  ['provisions', 'basis', 'budget'].forEach((k) => assert.equal(g(k), 'solicitation', k + ' is settled before a solicitation'));
  assert.equal(g('adonotice'), 'award');
  assert.match(strings(script.artifacts.ado).join(' '), /ACIP/);
  assert.match(strings(script.artifacts.ado).join(' '), /notice of intent/i);
  const all = [script.artifacts.memo, script.artifacts.checklist, script.artifacts.ado];
  all.forEach((a) => assert.ok(a.sources.includes('t360'), a.title + ' cites the timing rule'));
});

test('early commitment is framed as the airport\'s risk and reimbursability, not ADO permission', () => {
  const all = strings(script).join('\n');
  assert.ok(!/may we place an order|whether any order or contract may precede/i.test(all), 'no "ADO permits" framing');
  assert.match(script.beats[1].reply.paras.map((p) => p.text).join(' '), /own risk/i);
  assert.match(script.beats[1].reply.paras.map((p) => p.text).join(' '), /reimbursed/i);
});

test('the independent estimate precedes bids; solicitation carries the provisions and Buy American certificate', () => {
  const cl = strings(script.artifacts.checklist).join(' ');
  assert.match(cl, /Independent \(engineer’s\) estimate, made before bids are received/i);
  assert.match(cl, /Buy American provision and certificate in the solicitation/i);
  assert.match(cl, /basis for award/i);
  assert.match(cl, /federal contract provisions/i);
  assert.ok(!/assurances in the airport’s grant agreement/.test(strings(script).join('\n')), 'no grant agreement exists yet for this project');
});

test('review round: over-budget remedies, Table 5-4 as a list, current 200.327 numbering, bid validity', () => {
  const bids = script.beats[4].reply.paras.map((p) => p.text).join(' ');
  assert.match(bids, /reject all bids/i);
  assert.match(bids, /alternates ordered by available funding/i);
  assert.match(bids, /how much AIP funding is available/i);
  const seq = script.tables.sequence;
  assert.match(seq.note, /not a mandated sequence/i);
  assert.match(seq.rows[0][2], /^If entitlement funds are used/);
  assert.match(script.citations.t54.gist, /Among the common key steps/);
  assert.match(script.citations.u24.label, /200\.327/);
  strings(script).filter((s) => s.includes('200.326')).forEach((s) => assert.match(s, /reproduces this as/, 'stale 200.326: ' + s.slice(0, 70)));
  assert.match(strings(script.artifacts.checklist).join(' '), /Bid validity period/);
  assert.match(strings(script.artifacts.memo).join(' '), /37 Disadvantaged Business Enterprises/);
  assert.ok(!/by any route|commit to any route|grant is programmed/i.test(strings(script).join('\n')), 'cooperative-era and "programmed" wording gone');
});

test('state and local law: a sourced note in the route reply, the file and the checklist, with no invented state rule', () => {
  const c = script.citations.u10a;
  assert.ok(c, 'u10a citation exists');
  assert.match(c.label, /200\.318\(a\)/);
  assert.match(c.gist, /State, local/i);
  assert.match(c.gist, /conform to applicable Federal law/i);
  const route = script.beats[3];
  assert.ok(route.reply.sources.includes('u10a'), 'route reply cites 200.318(a)');
  const text = route.reply.paras.map((p) => p.text).join(' ');
  assert.match(text, /state/i);
  assert.match(text, /counsel/i);
  assert.ok(!/\b\d+[- ]day|bid bond of|percent bid security/i.test(text), 'no specific state requirement invented');
  const open = script.beats.flatMap((b) => b.file).find((o) => o.op === 'open' && o.key === 'statelaw');
  assert.ok(open && open.group === 'solicitation', 'state and local requirements are an open item before the solicitation');
  assert.match(strings(script.artifacts.checklist).join(' '), /state public-bidding/i);
  assert.match(strings(script.artifacts.memo).join(' '), /state/i);
});

test('homepage path example tells the same story as the demo', () => {
  const card = read('index.html').match(/<article class="path-card path-card-output">[\s\S]*?<\/article>/)[0];
  assert.ok(!/cooperative|\$180K|operating funds/i.test(card), 'no leftover cooperative / $180K / operating-funds example');
  assert.match(card, /\$650K/);
  assert.match(card, /AIP \+ local match/);
  assert.match(card, /Sealed competitive bids/);
  assert.match(card, /\$610K/, 'the open issue is the demo\'s capital plan difference');
});

test('end of the demo: Book a call is the primary action, with a visible email fallback, and no report offer', () => {
  const t = read('tour.html');
  const finish = t.match(/<section class="finish"[\s\S]*?<\/section>/)[0];
  assert.match(finish, /<a class="button" href="\/book-a-call\.html"[^>]*>Book a call/);
  assert.match(finish, /Prefer email\?[\s\S]*contact@tarmacsync\.com/, 'the address is shown as text');
  assert.match(finish, /href="mailto:contact@tarmacsync\.com"[^>]*data-contact-cta="tour_email"|data-contact-cta="tour_email"[^>]*href="mailto:contact@tarmacsync\.com"/);
  assert.ok(!/data-report-cta|\/#report/.test(finish), 'finish card has no report link');
  assert.match(t.match(/<noscript>[\s\S]*?<\/noscript>/)[0], /book-a-call/, 'the no-JavaScript fallback offers the same route');
  const analytics = read('assets/funnel-analytics.js');
  assert.match(analytics, /data-contact-cta/, 'email clicks are measured');
  assert.match(analytics, /book-a-call\.html/, 'booking clicks are measured');
});

test('the tour page no longer points at the removed homepage anchor', () => {
  assert.ok(!read('tour.html').includes('sample-snapshot'));
});

if (failed) { console.error('\n' + failed + ' failing'); process.exit(1); }
console.log('\ncontent checks passed');
