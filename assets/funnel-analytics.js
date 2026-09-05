(function () {
  'use strict';

  function track(name) {
    if (typeof window.va === 'function') {
      window.va('event', { name: name });
    }
  }

  document.addEventListener('click', function (event) {
    var target = event.target.closest ? event.target.closest('a,button') : null;
    if (!target) return;

    if (target.matches('[data-report-cta]')) {
      track('report_cta_click');
    }

    if (target.matches('[data-support-packet-cta], a[href*="/procurement-support-packet.html"]')) {
      track('evaluation_guide_click');
    }

    var href = target.getAttribute('href') || '';
    if (target.id === 'booking-link' || href.indexOf('/book-a-call.html') !== -1 || href.indexOf('zohobookings.eu') !== -1) {
      track('booking_intent_click');
    }
  });

  var reportForm = document.getElementById('report-form');
  if (reportForm) {
    reportForm.addEventListener('submit', function () {
      track('report_request_submitted');
    });
  }

  window.addEventListener('tarmacsync:report-success', function () {
    track('report_request_success');
  });
})();
