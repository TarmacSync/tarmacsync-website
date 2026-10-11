// Exercise the actual homepage handlers without requiring a browser installation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const tour = require('../assets/tour/tour-script.js');

class Element {
  constructor() { this.hidden = false; this.dataset = {}; this.attributes = {}; this.events = {}; this.children = []; this.textContent = ''; }
  addEventListener(name, handler) { this.events[name] = handler; }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name]; }
  appendChild(child) { this.children.push(child); }
  replaceChildren() { this.children = []; }
  focus() { focused = this; }
  showModal() { this.open = true; }
  fire(name, event = {}) { this.events[name](event); }
}
let focused;
const elements = new Map();
const el = (key) => {
  if (!elements.has(key)) elements.set(key, new Element());
  return elements.get(key);
};
const tabs = Array.from({ length: 5 }, (_, i) => {
  const tab = el('tab-' + i);
  tab.dataset.stage = String(i);
  tab.setAttribute('aria-controls', 'purchase-panel-' + i);
  return tab;
});
const views = ['overview', 'example'].map((view) => {
  const button = el('view-' + view); button.dataset.view = view; return button;
});
const root = el('product');
root.querySelector = el;
root.querySelectorAll = (key) => key === '[data-view]' ? views : tabs;
const dialog = el('product-evidence-dialog');
dialog.querySelector = () => el('close');
const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
for (const match of html.matchAll(/id="(ts-[^"]+)"[^>]*>([^<]*)</g)) el('#' + match[1]).textContent = match[2];
const context = {
  document: { getElementById: (key) => key === 'product' ? root : el(key), createElement: () => new Element() },
  window: { TOUR_SCRIPT: tour },
};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '..', 'assets/homepage-product.js'), 'utf8'), context);

views[0].fire('click');
assert.equal(el('#ts-route').textContent, 'A candidate buying method');
assert.equal(el('#ts-evidence-links').hidden, true);
views[1].fire('click');
assert.equal(el('#ts-route').textContent, 'Sealed competitive bids');
assert.equal(el('#ts-evidence-links').hidden, false);
assert.match(el('#ts-purchase').textContent, /\$650,000/);
console.log('ok  example → overview → example retains the actual scenario');

tabs[0].fire('keydown', { key: 'End', preventDefault() {} });
assert.equal(focused, tabs[4]);
assert.equal(el('purchase-panel-4').hidden, false);
assert.equal(el('[data-stage-next]').hidden, true);
assert.equal(tabs[0].tabIndex, -1);
tabs[4].fire('keydown', { key: 'ArrowRight', preventDefault() {} });
assert.equal(focused, tabs[0]);
assert.equal(el('purchase-panel-0').hidden, false);
el('[data-stage-next]').fire('click');
assert.equal(el('purchase-panel-1').hidden, false);
el('[data-stage-back]').fire('click');
assert.equal(el('purchase-panel-0').hidden, false);
assert.equal(el('[data-stage-back]').disabled, true);
tabs[3].fire('click');
el('[data-stage-replay]').fire('click');
assert.equal(el('purchase-panel-0').hidden, false);
assert.equal(focused, el('purchase-panel-0'));
assert.equal(el('[data-stage-next]').hidden, false);
console.log('ok  keyboard, Back, Next, and Replay keep selection, visibility, and focus consistent');

const click = (dataset) => {
  const trigger = new Element(); trigger.dataset = dataset;
  root.fire('click', { target: { closest: () => trigger }, preventDefault() {} });
};
const texts = (node) => [node.textContent, ...node.children.flatMap(texts)];
click({ source: 'u15' });
assert.equal(dialog.open, true);
assert.equal(el('product-dialog-title').textContent, tour.citations.u15.label);
assert.ok(texts(el('product-dialog-content')).includes(tour.citations.u15.gist));
for (const key of ['memo', 'checklist', 'ado', 'bideval']) {
  click({ draft: key });
  assert.equal(el('product-dialog-title').textContent, tour.artifacts[key].title);
  const rendered = texts(el('product-dialog-content'));
  for (const section of tour.artifacts[key].sections) {
    assert.ok(rendered.includes(section.h));
    section.items.forEach((item) => assert.ok(rendered.includes(item)));
  }
}
console.log('ok  evidence and all four review drafts come from the canonical tour records');
