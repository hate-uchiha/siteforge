// SiteForge runtime. No dependencies, no build step.
(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var navToggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  var callbar = document.querySelector('.callbar');
  var forms = document.querySelectorAll('form.quote-form');

  // Mobile navigation
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Header shadow + mobile call bar after the hero
  var onScroll = function () {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-stuck', y > 8);
    if (callbar) callbar.classList.toggle('is-visible', y > 420);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Scroll reveal
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in');
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
      );
      reveals.forEach(function (el) {
        io.observe(el);
      });
    } else {
      reveals.forEach(function (el) {
        el.classList.add('is-in');
      });
    }
  }

  // Highlight today's row in the opening hours table
  document.querySelectorAll('.hours tr[data-day]').forEach(function (row) {
    var day = new Date().getDay();
    var map = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
    if (row.getAttribute('data-day') === map[day]) row.classList.add('today');
  });

  // Quote forms. Post to the endpoint in data-endpoint, or show a demo notice.
  forms.forEach(function (form) {
    var status = form.querySelector('.form-status');
    var endpoint = form.getAttribute('data-endpoint');

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!status) return;

      if (form.getAttribute('data-demo') === 'true' || !endpoint) {
        status.className = 'form-status ok';
        status.textContent = 'Demo only. Connect a form endpoint to receive this enquiry.';
        return;
      }

      var data = new FormData(form);
      var button = form.querySelector('button[type="submit"]');
      var original = button ? button.textContent : '';

      if (button) {
        button.disabled = true;
        button.textContent = 'Sending...';
      }
      status.className = 'form-status';
      status.textContent = '';

      fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Request failed');
          form.reset();
          status.className = 'form-status ok';
          status.textContent = 'Thanks. We will be in touch shortly.';
        })
        .catch(function () {
          status.className = 'form-status err';
          status.textContent = 'Something went wrong. Please call us instead.';
        })
        .finally(function () {
          if (button) {
            button.disabled = false;
            button.textContent = original;
          }
        });
    });
  });
})();
