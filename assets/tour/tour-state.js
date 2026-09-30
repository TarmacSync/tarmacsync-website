(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TourState = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const T = { CPS_USER: 55, CPS_REPLY: 75, LANDING: 3500, SEND: 500, THINK: 900, DOCS: 3200, HOLD: 1600, END: 2500 };
  const cache = new WeakMap();

  function replyLength(reply) {
    return reply.paras.reduce((n, p) => n + (p.lead ? p.lead.length + 1 : 0) + p.text.length, 0);
  }

  // How much of each paragraph is visible when `count` characters have been revealed.
  function revealParas(reply, count) {
    let left = count;
    return reply.paras.map((p) => {
      const leadFull = p.lead || '';
      const leadCost = leadFull ? leadFull.length + 1 : 0;
      const lead = leadFull.slice(0, Math.max(0, Math.min(left, leadFull.length)));
      const text = p.text.slice(0, Math.max(0, Math.min(left - leadCost, p.text.length)));
      left = Math.max(0, left - leadCost - p.text.length);
      return { lead, text, started: lead.length > 0 || text.length > 0 };
    });
  }

  function buildTimeline(script) {
    const segs = [], byBeat = [], fires = [], marks = [{ label: 'Start', at: 0 }];
    let t = T.LANDING;
    segs.push({ beat: -1, phase: 'landing', start: 0, end: T.LANDING });
    script.beats.forEach((b, i) => {
      const by = {};
      marks.push({ label: b.label, at: t });
      const add = (phase, ms) => {
        const s = { beat: i, phase, start: t, end: t + ms };
        segs.push(s); by[phase] = s; t += ms;
      };
      add('compose', Math.round((b.user.length / T.CPS_USER) * 1000));
      if (b.docs && b.docs.length) add('docs', T.DOCS);
      add('send', T.SEND);
      add('think', T.THINK);
      add('stream', Math.round((replyLength(b.reply) / T.CPS_REPLY) * 1000));
      add('hold', T.HOLD);
      byBeat.push(by);
      (b.file || []).forEach((op) => {
        const span = by.stream.end - by.stream.start;
        const at = op.when === 'send' ? by.think.start : by.stream.start + (op.at == null ? 1 : op.at) * span;
        fires.push({ at, op, order: fires.length });
      });
    });
    marks.push({ label: 'Finish', at: t });
    segs.push({ beat: script.beats.length, phase: 'end', start: t, end: t + T.END });
    t += T.END;
    fires.sort((a, b) => a.at - b.at || a.order - b.order);
    return { segs, byBeat, fires, marks, total: t };
  }

  function timeline(script) {
    let tl = cache.get(script);
    if (!tl) { tl = buildTimeline(script); cache.set(script, tl); }
    return tl;
  }

  function upsert(list, item) {
    const i = list.findIndex((x) => x.key === item.key);
    if (i >= 0) list[i] = item; else list.push(item);
  }

  function applyOp(file, op) {
    switch (op.op) {
      case 'purchase': file.purchase = op.value; break;
      case 'phase': file.phase = op.value; break;
      case 'next': file.next = op.value; break;
      case 'known': upsert(file.known, { key: op.key, label: op.label, value: op.value, tag: op.tag, note: op.note || '', flag: op.flag || '' }); break;
      case 'open': upsert(file.open, { key: op.key, group: op.group, text: op.text, done: false }); break;
      case 'close': file.open.forEach((o) => { if (o.key === op.key) o.done = true; }); break;
      default: throw new Error('unknown file op ' + op.op);
    }
  }

  function stateAt(script, ms) {
    const tl = timeline(script);
    const t = Math.max(0, Math.min(ms, tl.total));
    const seg = tl.segs.find((s) => t >= s.start && t < s.end) || tl.segs[tl.segs.length - 1];
    let markIndex = 0;
    tl.marks.forEach((m, i) => { if (t >= m.at) markIndex = i; });
    const state = {
      t, total: tl.total, phase: seg.phase, beat: seg.beat, ended: t >= tl.total,
      landing: seg.phase === 'landing', finish: seg.phase === 'end' || t >= tl.total, markIndex,
      composer: { text: '', docs: [] }, messages: [], file: null, stage: -1, stagesDone: 0,
    };
    script.beats.forEach((b, i) => {
      const by = tl.byBeat[i];
      if (t < by.compose.start) return;
      state.stage = b.stage;
      if (t < by.think.start) {
        const chars = t >= by.compose.end ? b.user.length : Math.floor(((t - by.compose.start) / 1000) * T.CPS_USER);
        state.composer.text = b.user.slice(0, Math.min(chars, b.user.length));
        if (by.docs && t >= by.docs.start) {
          const n = b.docs.length;
          const shown = t >= by.docs.end ? n : Math.min(n, 1 + Math.floor((t - by.docs.start) / (T.DOCS / n)));
          state.composer.docs = b.docs.slice(0, shown);
        }
        return;
      }
      const total = replyLength(b.reply);
      const s = by.stream;
      const revealed = t >= s.end ? total : t < s.start ? 0 : Math.floor(((t - s.start) / 1000) * T.CPS_REPLY);
      state.messages.push({ role: 'airport', beat: i, text: b.user, docs: b.docs || [] });
      state.messages.push({
        role: 'assistant', beat: i, thinking: t < s.start, thinkLabel: b.thinkLabel || 'Working',
        reveal: Math.min(revealed, total), complete: t >= s.end, reply: b.reply,
      });
    });
    // Stages before the current one are done; at the finish every stage is done and none is current.
    state.stagesDone = state.finish ? script.stages.length : Math.max(state.stage, 0);
    if (state.finish) state.stage = -1;
    const file = { purchase: '', phase: '', next: '', known: [], open: [] };
    tl.fires.forEach((f) => { if (f.at <= t) applyOp(file, f.op); });
    state.file = file;
    return state;
  }

  return { T, timeline, stateAt, revealParas, replyLength };
});
