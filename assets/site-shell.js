(function () {
  document.querySelectorAll('[data-site-header]').forEach(function (header) {
    var menu = header.querySelector('[data-site-menu]');
    var nav = header.querySelector('[data-site-nav]');

    function closeMenu() {
      if (!menu || !nav) return;
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', 'Open menu');
      nav.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    if (menu && nav) {
      menu.addEventListener('click', function () {
        var isOpen = menu.getAttribute('aria-expanded') !== 'true';
        menu.setAttribute('aria-expanded', String(isOpen));
        menu.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        nav.classList.toggle('is-open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });
      nav.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', closeMenu); });
      window.addEventListener('resize', function () { if (window.innerWidth > 860) closeMenu(); });
      document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeMenu(); });
    }

    function syncHeader() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });
  });

  // Skip-to-content: move focus to <main> rather than relying on fragment navigation,
  // which leaves focus on <body> in Chromium and does not reliably bypass the header.
  document.querySelectorAll('.skip-link').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var id = link.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      event.preventDefault();
      target.focus();
      history.replaceState(null, '', id);
    });
  });
})();
