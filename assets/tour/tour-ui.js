(function () {
  'use strict';
  const D = window.TOUR_SCRIPT;
  const S = window.TourState;
  const $ = (id) => document.getElementById(id);
  const tl = S.timeline(D);
  const GROUPS = [['now', 'Needed now'], ['solicitation', 'Before the solicitation'], ['application', 'Before the grant application'], ['award', 'Before award']];

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function fmt(ms) {
    const s = Math.round(ms / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  /* ---------- conversation ---------- */
  function buildAirport(m) {
    const li = el('li', 'message airport');
    li.setAttribute('role', 'group'); li.setAttribute('aria-label', 'Airport team');
    li.append(el('p', null, m.text));
    if (m.docs.length) {
      const ul = el('ul', 'attach');
      m.docs.forEach((d) => { const c = el('li', 'doc-chip'); c.append(el('b', null, d.kind), el('span', null, d.name)); ul.append(c); });
      li.append(ul);
    }
    return li;
  }
  function buildAssistant(m) {
    const li = el('li', 'message assistant');
    li.setAttribute('role', 'group'); li.setAttribute('aria-label', 'TarmacSync');
    const mark = el('img', 'assistant-mark'); mark.src = 'assets/tarmacsync-icon.png'; mark.alt = ''; mark.width = 26; mark.height = 26;
    const body = el('div', 'message-body');
    const thinking = el('div', 'thinking');
    thinking.append(el('i'), el('i'), el('i'), el('span', null, ''));
    const paras = el('div', 'paras');
    m.reply.paras.forEach(() => { const p = el('p'); p.append(el('strong'), el('span')); paras.append(p); });
    body.append(thinking, paras, el('div', 'extras'));
    li.append(mark, body);
    return li;
  }
  function updateAssistant(li, m) {
    const thinking = li.querySelector('.thinking');
    thinking.hidden = !m.thinking;
    thinking.lastChild.textContent = m.thinkLabel + '…';
    const parts = S.revealParas(m.reply, m.reveal);
    let lastStarted = -1;
    parts.forEach((p, i) => { if (p.started) lastStarted = i; });
    parts.forEach((p, i) => {
      const node = li.querySelector('.paras').children[i];
      node.hidden = !p.started;
      node.firstChild.textContent = p.lead;
      node.lastChild.textContent = (p.lead && p.text ? ' ' : '') + p.text;
      node.classList.toggle('cursor', !m.complete && !m.thinking && i === lastStarted);
    });
    const extras = li.querySelector('.extras');
    if (m.complete && !extras.dataset.built) { buildExtras(extras, D.beats[m.beat].reply); extras.dataset.built = '1'; }
    if (!m.complete && extras.dataset.built) { extras.replaceChildren(); delete extras.dataset.built; }
  }
  function dataTable(id) {
    const spec = D.tables[id];
    const wrap = el('div', 'table-wrap');
    wrap.append(el('p', 'table-note', spec.note));
    const t = el('table', 'data-table ' + id);
    t.append(el('caption', 'sr-only', spec.caption));
    const head = el('thead'); const hr = el('tr');
    spec.columns.forEach((h) => { const th = el('th', null, h); th.scope = 'col'; hr.append(th); });
    head.append(hr); t.append(head);
    const body = el('tbody');
    spec.rows.forEach((row) => {
      const tr = el('tr');
      row.forEach((cell, i) => tr.append(el('td', i === 1 ? 'strong-cell' : null, cell)));
      body.append(tr);
    });
    t.append(body); wrap.append(t);
    return wrap;
  }
  function buildExtras(node, reply) {
    if (reply.table) node.append(dataTable(reply.table));
    if (reply.artifacts) {
      const wrap = el('div', 'artifacts');
      reply.artifacts.forEach((id) => {
        const b = el('button', 'attachment'); b.type = 'button'; b.dataset.artifact = id;
        b.append(el('span', 'att-title', D.artifacts[id].title), el('span', 'att-sub', 'Review draft · open to read'));
        wrap.append(b);
      });
      node.append(wrap);
    }
    if (reply.sources && reply.sources.length) {
      const wrap = el('div', 'sources');
      wrap.append(el('span', 'sources-label', 'Sources'));
      reply.sources.forEach((id) => {
        const b = el('button', 'source-chip', D.citations[id].label); b.type = 'button'; b.dataset.source = id;
        wrap.append(b);
      });
      node.append(wrap);
    }
  }
  function renderThread(st) {
    const list = $('thread');
    while (list.children.length > st.messages.length) list.lastElementChild.remove();
    st.messages.forEach((m, i) => {
      let node = list.children[i];
      if (node && node.dataset.role !== m.role) { while (list.children.length > i) list.lastElementChild.remove(); node = null; }
      if (!node) {
        node = m.role === 'airport' ? buildAirport(m) : buildAssistant(m);
        node.dataset.role = m.role;
        list.append(node);
      }
      if (m.role === 'assistant') updateAssistant(node, m);
    });
  }

  /* ---------- composer ---------- */
  function renderComposer(st) {
    const text = $('composer-text');
    if (text.textContent !== st.composer.text) text.textContent = st.composer.text;
    $('composer').classList.toggle('is-empty', !st.composer.text && !st.composer.docs.length);
    const docs = $('composer-docs');
    if (docs.children.length !== st.composer.docs.length) {
      docs.replaceChildren();
      st.composer.docs.forEach((d) => { const c = el('span', 'doc-chip'); c.append(el('b', null, d.kind), el('span', null, d.name)); docs.append(c); });
    }
  }

  /* ---------- Project file ---------- */
  let fileSig = '', prevKeys = new Set();
  function renderFile(st, animate) {
    const f = st.file;
    const sig = JSON.stringify(f);
    const toggle = $('file-toggle');
    const openCount = f.open.filter((o) => !o.done).length;
    toggle.textContent = 'Project file · ' + f.known.length + ' known · ' + openCount + ' open';
    if (sig === fileSig) return;
    fileSig = sig;
    const root = $('file');
    root.replaceChildren();
    root.append(el('p', 'file-head', 'Project file'));

    const purchase = el('section');
    purchase.append(el('h3', null, 'Purchase'));
    purchase.append(el('p', f.purchase ? 'file-purchase' : 'empty', f.purchase || 'Not yet described'));
    if (f.phase) purchase.append(el('p', 'file-phase', 'Phase · ' + f.phase));
    root.append(purchase);

    const known = el('section');
    const kh = el('h3', null, 'Known '); kh.append(el('span', 'count', String(f.known.length)));
    known.append(kh);
    if (!f.known.length) known.append(el('p', 'empty', 'Nothing recorded yet.'));
    else {
      const ul = el('ul', 'facts');
      f.known.forEach((k) => {
        const li = el('li', 'fact' + (animate && !prevKeys.has('k:' + k.key) ? ' is-new' : ''));
        li.append(el('div', 'fact-label', k.label), el('div', 'fact-value', k.value));
        const meta = el('div', 'fact-meta');
        meta.append(el('span', 'tag', k.tag));
        if (k.flag) meta.append(el('span', 'flag', k.flag));
        if (k.note) meta.append(el('span', null, k.note));
        li.append(meta); ul.append(li);
      });
      known.append(ul);
    }
    root.append(known);

    const open = el('section');
    const oh = el('h3', null, 'Open '); oh.append(el('span', 'count', String(openCount)));
    open.append(oh);
    if (!f.open.length) open.append(el('p', 'empty', 'Nothing open yet.'));
    GROUPS.forEach(([g, label]) => {
      const items = f.open.filter((o) => o.group === g);
      if (!items.length) return;
      open.append(el('h4', null, label));
      const ul = el('ul', 'opens');
      items.forEach((o) => {
        const li = el('li', 'open-item' + (o.done ? ' done' : '') + (animate && !prevKeys.has('o:' + o.key) ? ' is-new' : ''));
        li.append(el('span', null, o.text)); ul.append(li);
      });
      open.append(ul);
    });
    root.append(open);

    if (f.next) {
      const next = el('section', 'next');
      next.append(el('h3', null, 'Next best action'), el('p', null, f.next));
      root.append(next);
    }
    prevKeys = new Set([...f.known.map((k) => 'k:' + k.key), ...f.open.map((o) => 'o:' + o.key)]);
  }

  /* ---------- controls ---------- */
  function renderTicks() {
    const list = $('ticks');
    tl.marks.forEach((m, i) => {
      // The Start mark sits 3.5 s from the first exchange, so on a phone the two hit areas would
      // overlap. Restart and dragging the scrubber to the left edge already cover it.
      if (i === 0) return;
      const li = el('li'); li.style.left = (m.at / tl.total) * 100 + '%';
      const b = el('button'); b.type = 'button'; b.dataset.mark = String(i);
      b.setAttribute('aria-label', 'Jump to: ' + m.label);
      li.append(b); list.append(li);
    });
  }
  function renderStages() {
    const list = $('stages');
    D.stages.forEach((s, i) => {
      const li = el('li', 'stage-item');
      li.append(el('span', 'stage-num', String(i + 1)), el('span', 'stage-key', s.key), el('span', 'stage-name', s.label));
      list.append(li);
    });
  }
  function updateStages(st) {
    document.querySelectorAll('#stages > li').forEach((li, i) => {
      const done = i < st.stagesDone, current = i === st.stage;
      li.classList.toggle('is-done', done);
      li.classList.toggle('is-current', current);
      if (current) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    const s = D.stages[st.stage];
    $('stage-caption').textContent = s ? 'Stage ' + (st.stage + 1) + ' of ' + D.stages.length + ' · ' + s.key + ' — ' + s.label
      : st.finish ? 'All five stages complete' : '';
  }
  function renderControls(st) {
    $('scrub').max = String(tl.total);
    $('scrub').value = String(Math.round(st.t));
    $('scrub').setAttribute('aria-valuetext', 'Moment ' + (st.markIndex + 1) + ' of ' + tl.marks.length + ': ' + tl.marks[st.markIndex].label);
    $('clock').textContent = fmt(st.t) + ' / ' + fmt(tl.total);
    document.querySelectorAll('#ticks button').forEach((b) => {
      b.setAttribute('aria-current', Number(b.dataset.mark) === st.markIndex ? 'true' : 'false');
    });
  }

  function render(t, animate) {
    const st = S.stateAt(D, t);
    $('landing').hidden = st.messages.length > 0;
    renderThread(st);
    renderComposer(st);
    renderFile(st, animate);
    $('finish').hidden = !st.finish;
    updateStages(st);
    renderControls(st);
    return st;
  }

  /* ---------- player ---------- */
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const track = (name) => { if (typeof window.va === 'function') window.va('event', { name }); };
  const scroller = $('scroller');
  const SPEEDS = [1, 1.5, 0.75];
  let t = 0, playing = true, speed = 1, last = 0, overlay = false, lastWrite = 0, following = true;
  function updateJump() { $('jump-latest').hidden = following || !playing; }
  let markShown = -1, announcedIdx = -1, tracked = new Set(), completed = false;

  function playLabel(st) {
    if (st.ended) return reduced.matches ? 'Play the walkthrough' : 'Replay';
    return playing ? 'Pause' : 'Play';
  }
  function announce(st) {
    let idx = -1;
    st.messages.forEach((m, i) => { if (m.role === 'airport' || m.complete) idx = i; });
    if (idx > announcedIdx && st.messages[idx]) {
      const m = st.messages[idx];
      const text = m.role === 'airport' ? m.text : m.reply.paras.map((p) => (p.lead ? p.lead + ' ' : '') + p.text).join(' ');
      $('status').textContent = (m.role === 'airport' ? 'Airport team: ' : 'TarmacSync: ') + text;
    }
    announcedIdx = idx;
  }
  function syncHash(st) {
    if (st.markIndex === markShown) return;
    markShown = st.markIndex;
    const url = location.pathname + location.search + (markShown ? '#beat=' + markShown : '');
    try { history.replaceState(null, '', url); } catch (e) { /* ignore */ }
    if (playing && !tracked.has(markShown)) { tracked.add(markShown); track('tour_beat_' + markShown); }
  }
  function draw(animate, follow) {
    const st = render(t, animate);
    $('play').textContent = playLabel(st);
    announce(st);
    syncHash(st);
    if (follow && following) { scroller.scrollTop = scroller.scrollHeight; lastWrite = scroller.scrollTop; }
    updateJump();
    if (st.ended && !completed) { completed = true; track('tour_complete'); }
    if (!st.ended) completed = false;
    return st;
  }
  function seek(ms, keepPlaying) {
    t = Math.max(0, Math.min(tl.total, ms));
    if (!keepPlaying) playing = false;
    lastWrite = 0;   // the thread may shrink, which moves scrollTop without the viewer scrolling
    following = true;
    draw(false, true);
  }
  function setPlaying(v) {
    if (v && t >= tl.total) { t = 0; announcedIdx = -1; tracked = new Set(); lastWrite = 0; }
    playing = v;
    draw(false, false);
  }
  function frame(now) {
    const dt = Math.min(64, Math.max(0, now - last));
    last = now;
    if (playing && !document.hidden && !overlay) {
      t = Math.min(tl.total, t + dt * speed);
      const st = draw(true, true);
      if (st.ended) playing = false;
    }
    window.requestAnimationFrame(frame);
  }

  $('play').addEventListener('click', () => setPlaying(!playing || t >= tl.total));
  $('restart').addEventListener('click', () => { announcedIdx = -1; tracked = new Set(); t = 0; playing = true; lastWrite = 0; following = true; track('tour_restart'); draw(false, false); });
  $('replay').addEventListener('click', () => $('restart').click());
  $('skip').addEventListener('click', () => seek(tl.total, false));
  $('speed').addEventListener('click', () => {
    speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    const label = speed + '×';
    $('speed').textContent = label;
    $('speed').setAttribute('aria-label', 'Playback speed ' + label);
  });
  // Scrubbing and jumping keep the player's state: playing keeps playing from the new point, and a
  // viewer who pressed Pause stays paused.
  $('scrub').addEventListener('input', (e) => seek(Number(e.target.value), true));
  $('ticks').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-mark]');
    if (b) seek(tl.marks[Number(b.dataset.mark)].at, true);
  });
  $('file-toggle').addEventListener('click', () => {
    const open = !$('file-wrap').classList.contains('open');
    $('file-wrap').classList.toggle('open', open);
    $('file-toggle').setAttribute('aria-expanded', String(open));
    if (open) $('file').scrollIntoView({ block: 'nearest' });   // on a phone the sheet opens below the fold
  });
  document.addEventListener('visibilitychange', () => { last = performance.now(); });

  // Reading back never stops the demo. Scrolling up only stops auto-scroll, so the view is not dragged
  // down while someone reads, and a "Jump to latest" button brings them back to the live end. The
  // demo itself stops only on Pause, at the end, behind an open dialog, or in a hidden tab.
  const stopFollowing = () => { following = false; updateJump(); };
  scroller.addEventListener('wheel', (e) => { if (e.deltaY < 0) stopFollowing(); }, { passive: true });
  let touchY = 0;
  scroller.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  scroller.addEventListener('touchmove', (e) => { if (e.touches[0].clientY > touchY + 8) stopFollowing(); }, { passive: true });
  scroller.addEventListener('keydown', (e) => { if (['ArrowUp', 'PageUp', 'Home'].includes(e.key)) stopFollowing(); });
  // Catch-all: a scrollbar drag moves scrollTop above where the player last put it. Reaching the
  // bottom again by hand resumes following.
  scroller.addEventListener('scroll', () => {
    if (scroller.scrollTop < lastWrite - 24) stopFollowing();
    else if (scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop < 24 && !following) { following = true; updateJump(); }
  }, { passive: true });
  $('jump-latest').addEventListener('click', () => { following = true; scroller.scrollTop = scroller.scrollHeight; lastWrite = scroller.scrollTop; updateJump(); });

  // Overlays hook (dialogs) uses these.
  window.TourPlayer = {
    pauseForOverlay() { const was = playing; playing = false; overlay = true; draw(false, false); return was; },
    resumeFromOverlay(was) { overlay = false; if (was) setPlaying(true); else draw(false, false); },
    track,
  };

  function start() {
    const m = /^#beat=(\d+)$/.exec(location.hash);
    const n = m ? Number(m[1]) : -1;
    renderTicks();
    renderStages();
    if (n > 0 && n < tl.marks.length) { t = tl.marks[n].at; playing = false; }
    else if (reduced.matches) { t = tl.total; playing = false; }
    last = performance.now();
    draw(false, false);
    window.requestAnimationFrame(frame);
  }
  start();

  /* ---------- dialogs ---------- */
  const dlg = $('detail-dialog');
  let wasPlaying = false;

  function fillSource(id) {
    const c = D.citations[id];
    $('detail-eyebrow').textContent = 'Behind the answer';
    $('detail-title').textContent = c.label;
    const body = $('detail-body'); body.replaceChildren();
    const dl = el('dl');
    [['Source', c.source], ['Reference', c.ref], ['In short', c.gist], ['Edition', c.edition], ['Last checked', c.checked]].forEach(([k, v]) => {
      dl.append(el('dt', null, k), el('dd', null, v));
    });
    body.append(dl);
    body.append(el('p', 'sub', 'Paraphrase, not a quotation. Confirm against the source text before relying on it.'));
  }
  function fillArtifact(id) {
    const a = D.artifacts[id];
    $('detail-eyebrow').textContent = 'Review draft · fictional airport';
    $('detail-title').textContent = a.title;
    const body = $('detail-body'); body.replaceChildren();
    body.append(el('p', 'sub', a.sub));
    a.sections.forEach((s) => {
      body.append(el('h3', null, s.h));
      const ul = el('ul'); s.items.forEach((i) => ul.append(el('li', null, i))); body.append(ul);
    });
    body.append(el('h3', null, 'Sources'));
    const src = el('ul');
    a.sources.forEach((id) => { const c = D.citations[id]; src.append(el('li', null, c.label + ': ' + c.ref)); });
    body.append(src);
    body.append(el('p', 'sub', 'Paraphrased, not quoted. Confirm against the source text before relying on any of it.'));
  }
  function fillTranscript() {
    $('detail-eyebrow').textContent = 'Full conversation';
    $('detail-title').textContent = 'A fictional airport purchase';
    const body = $('detail-body'); body.replaceChildren();
    D.beats.forEach((b) => {
      const u = el('div', 'transcript-msg'); u.append(el('strong', null, 'Airport team'), el('p', null, b.user));
      if (b.docs) b.docs.forEach((d) => u.append(el('p', null, 'Attached: ' + d.name)));
      const r = el('div', 'transcript-msg'); r.append(el('strong', null, 'TarmacSync'));
      b.reply.paras.forEach((p) => r.append(el('p', null, (p.lead ? p.lead + ' ' : '') + p.text)));
      body.append(u, r);
    });
  }
  function openDialog(fill, eventName) {
    wasPlaying = window.TourPlayer.pauseForOverlay();
    fill();
    window.TourPlayer.track(eventName);
    dlg.showModal();
    dlg.scrollTop = 0;
  }
  dlg.addEventListener('close', () => { window.TourPlayer.resumeFromOverlay(wasPlaying); wasPlaying = false; });
  dlg.addEventListener('click', (e) => {
    // Only a click on the backdrop closes it. The dialog element also receives clicks on its own
    // padding, margins and scrollbar, so compare against its box rather than trusting e.target.
    if (e.target !== dlg) return;
    const r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
  });
  $('close-detail').addEventListener('click', () => dlg.close());
  $('transcript').addEventListener('click', () => openDialog(fillTranscript, 'tour_transcript_open'));
  document.addEventListener('click', (e) => {
    const s = e.target.closest('[data-source]');
    if (s) return openDialog(() => fillSource(s.dataset.source), 'tour_source_open');
    const a = e.target.closest('[data-artifact]');
    if (a) return openDialog(() => fillArtifact(a.dataset.artifact), 'tour_artifact_open');
  });
})();
