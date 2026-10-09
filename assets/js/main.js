/*
  The only JavaScript on the site (vanilla, no dependencies, loaded with `defer`).
  Every feature degrades gracefully: with JS off, the nav is visible, all
  listings show, and the contact form posts normally.
*/
(function () {
  'use strict';

  /* 1. Mobile navigation ---------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* 2. Listing filters (/listings/) ------------------------------------------
     Each card carries data-status / data-city / data-beds / data-price
     (see _includes/listing-card.html). We just show or hide cards.
     At a few hundred listings, replace this with a JSON index + search. */
  var filters = document.querySelector('[data-filters]');

  if (filters) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-listing]'));
    var count = document.querySelector('[data-count]');
    var empty = document.querySelector('[data-empty]');

    var applyFilters = function () {
      var f = filters.elements;
      var status = f.status.value;
      var city = f.city.value;
      var minBeds = Number(f.beds.value) || 0;
      var maxPrice = Number(f.price.value) || Infinity;
      var shown = 0;

      cards.forEach(function (card) {
        var d = card.dataset;
        var match =
          (!status || d.status === status) &&
          (!city || d.city === city) &&
          (Number(d.beds) || 0) >= minBeds &&
          (Number(d.price) || 0) <= maxPrice;
        card.hidden = !match;
        if (match) { shown += 1; }
      });

      if (count) { count.textContent = shown + (shown === 1 ? ' home' : ' homes'); }
      if (empty) { empty.hidden = shown !== 0; }
    };

    filters.addEventListener('input', applyFilters);
    // Wait a tick so the form has actually reset before re-filtering.
    filters.addEventListener('reset', function () { setTimeout(applyFilters, 0); });
    applyFilters();
  }

  /* 3. Contact form (Formspree) ----------------------------------------------
     - Pre-fills agent / message from ?agent=slug&topic=text in the URL.
     - Submits in place with fetch; without fetch it falls back to a normal POST. */
  var form = document.querySelector('[data-contact-form]');

  if (form) {
    var params = new URLSearchParams(window.location.search);
    var agentParam = params.get('agent');
    var topicParam = params.get('topic');

    if (agentParam && form.elements.agent) { form.elements.agent.value = agentParam; }
    if (topicParam && !form.elements.message.value) {
      // .value (not innerHTML), so URL input can't inject markup.
      form.elements.message.value = "I'd like more information about " + topicParam + ".";
    }

    var statusEl = form.querySelector('[data-form-status]');
    var button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      if (!window.fetch) { return; }
      e.preventDefault();
      button.disabled = true;
      statusEl.textContent = 'Sending...';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          if (!response.ok) { throw new Error('Request failed'); }
          form.reset();
          statusEl.textContent = 'Thank you. Your message is on its way and we will reply soon.';
        })
        .catch(function () {
          statusEl.textContent = 'That did not send. Please try again, or email us directly.';
        })
        .then(function () { button.disabled = false; });
    });
  }
})();
