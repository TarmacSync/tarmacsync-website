(() => {
  'use strict';
  const root = document.getElementById('product');
  if (!root) return;

  // Start with the concrete example. The overview explains the same components.
  const overview = {
    need: 'Your airport’s next purchase',
    purchase: 'Purchase scope, planning budget, and proposed funding',
    policy: 'Local thresholds, approval authority, and purchasing procedures',
    requirements: 'Applicable FAA guidance, funding terms, and grant status',
    options: 'Existing and cooperative agreements, alongside competitive methods',
    history: 'Prior projects, decisions, and equipment records',
    route: 'A candidate buying method',
    'route-detail': 'A working recommendation with the conditions your team needs to validate.',
    evidence: 'The relevant airport documents and source references behind the recommendation.',
    'open-budget': 'Which facts or document differences need clarification?',
    'open-inventory': 'Which procurement and contract conditions still need validation?',
    'open-funding': 'What funding and approval questions remain unresolved?',
    next: 'A practical next check, draft, or handoff',
    'next-detail': 'Keep the action connected to its supporting evidence and owner.',
    caption: 'Conceptual product design. Airport professionals validate the recommendation and retain decision authority.',
  };
  const example = {};
  Object.keys(overview).forEach((id) => {
    example[id] = root.querySelector('#ts-' + id).textContent;
  });
  const viewButtons = [...root.querySelectorAll('[data-view]')];
  root.querySelector('.product-toggle').hidden = false;
  viewButtons.forEach((button) => button.addEventListener('click', () => {
    const isExample = button.dataset.view === 'example';
    const values = isExample ? example : overview;
    Object.entries(values).forEach(([id, value]) => {
      root.querySelector('#ts-' + id).textContent = value;
    });
    root.querySelector('#ts-evidence-links').hidden = !isExample;
    viewButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
  }));

  const tabs = [...root.querySelectorAll('[data-stage]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
  const back = root.querySelector('[data-stage-back]');
  const next = root.querySelector('[data-stage-next]');
  let current = 0;
  function selectStage(index) {
    current = Math.max(0, Math.min(tabs.length - 1, index));
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === current));
      tab.tabIndex = i === current ? 0 : -1;
      panels[i].hidden = i !== current;
    });
    back.disabled = current === 0;
    next.hidden = current === tabs.length - 1;
  }
  root.querySelector('.purchase-tabs').hidden = false;
  root.querySelector('.purchase-control-buttons').hidden = false;
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectStage(index));
    tab.addEventListener('keydown', (event) => {
      let destination;
      if (event.key === 'ArrowRight') destination = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') destination = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') destination = 0;
      if (event.key === 'End') destination = tabs.length - 1;
      if (destination === undefined) return;
      event.preventDefault();
      selectStage(destination);
      tabs[destination].focus();
    });
  });
  function moveTo(index) {
    selectStage(index);
    panels[current].focus({ preventScroll: true });
  }
  back.addEventListener('click', () => moveTo(current - 1));
  next.addEventListener('click', () => moveTo(current + 1));
  root.querySelector('[data-stage-replay]').addEventListener('click', () => moveTo(0));

  // Open the actual tour's source records and drafts, rather than duplicate them.
  const script = window.TOUR_SCRIPT;
  const dialog = document.getElementById('product-evidence-dialog');
  if (!script || !dialog || typeof dialog.showModal !== 'function') return;
  root.querySelector('.purchase-drafts').hidden = false;
  const title = document.getElementById('product-dialog-title');
  const content = document.getElementById('product-dialog-content');
  const add = (tag, value, parent = content) => {
    const node = document.createElement(tag);
    node.textContent = value;
    parent.appendChild(node);
    return node;
  };
  root.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-source], [data-draft]');
    if (!trigger) return;
    const source = trigger.dataset.source && script.citations[trigger.dataset.source];
    const draft = trigger.dataset.draft && script.artifacts[trigger.dataset.draft];
    if (!source && !draft) return;
    event.preventDefault();
    content.replaceChildren();
    if (source) {
      title.textContent = source.label;
      add('p', source.source + ' · ' + source.ref);
      add('h3', 'Source summary used in the fictional demo');
      add('p', source.gist);
      add('h3', 'Edition and verification record');
      add('p', source.edition);
    } else {
      title.textContent = draft.title;
      add('p', draft.sub);
      draft.sections.forEach((section) => {
        add('h3', section.h);
        const list = add('ul', '');
        section.items.forEach((item) => add('li', item, list));
      });
      add('h3', 'Supporting sources');
      const links = add('div', '');
      links.className = 'evidence-links';
      draft.sources.forEach((id) => {
        const citation = script.citations[id];
        if (!citation) return;
        const link = add('a', citation.label, links);
        link.href = '/tour#beat=7';
        link.dataset.source = id;
      });
    }
    const full = add('p', '');
    const link = add('a', 'See the source in the full sweeper demonstration →', full);
    link.href = '/tour#beat=7';
    if (!dialog.open) dialog.showModal();
    else dialog.querySelector('button').focus();
    dialog.scrollTop = 0;
  });
})();
