/* =========================================================================
   Neat'n'Even Beauty Clinic — site behaviour
   ========================================================================= */
(function () {
  'use strict';

  /* -----------------------------------------------------------------------
     CONFIG — the only part you need to edit
     -------------------------------------------------------------------- */
  var CONFIG = {
    // WhatsApp number in international format, digits only (no +, no spaces).
    whatsapp: '233551473359',

    // Where booking enquiries are emailed.
    notifyEmail: 'ayisijanet5@gmail.com',

    // FormSubmit needs no account: it posts straight to the address above.
    //
    // ONE-TIME ACTIVATION — the very first submission triggers a confirmation
    // email to that inbox. Nothing is delivered until the link in it is
    // clicked, so send one test enquiry yourself and confirm it.
    //
    // THEN SWAP THIS: after activating, FormSubmit emails you a random alias
    // like https://formsubmit.co/ajax/a1b2c3d4e5. Paste that here instead.
    // It works identically but keeps the address out of the page source,
    // where scrapers would otherwise harvest it for spam.
    formEndpoint: 'https://formsubmit.co/ajax/ayisijanet5@gmail.com'
  };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* -----------------------------------------------------------------------
     Footer year
     -------------------------------------------------------------------- */
  $$('#year').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* -----------------------------------------------------------------------
     Header: solid once scrolled
     -------------------------------------------------------------------- */
  var header = $('#siteHeader');
  var waFloat = $('#waFloat');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-solid', y > 40);
    if (waFloat) waFloat.classList.toggle('is-visible', y > 400);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* -----------------------------------------------------------------------
     Mobile navigation
     -------------------------------------------------------------------- */
  var navToggle = $('#navToggle');
  var mobileNav = $('#mobileNav');

  function setNav(open) {
    if (!navToggle || !mobileNav) return;
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileNav.classList.toggle('is-open', open);
    mobileNav.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('is-locked', open);
  }

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      setNav(navToggle.getAttribute('aria-expanded') !== 'true');
    });
  }
  if (mobileNav) {
    $$('a', mobileNav).forEach(function (a) {
      a.addEventListener('click', function () { setNav(false); });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileNav && mobileNav.classList.contains('is-open')) setNav(false);
  });
  // close the drawer if the viewport grows past the desktop breakpoint
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1000 && mobileNav && mobileNav.classList.contains('is-open')) setNav(false);
  });

  /* -----------------------------------------------------------------------
     Reveal on scroll
     -------------------------------------------------------------------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealAll(nodes) {
    nodes.forEach(function (el) { el.classList.add('is-in'); });
  }

  function observeReveals(nodes) {
    if (reduceMotion || !('IntersectionObserver' in window)) { revealAll(nodes); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    nodes.forEach(function (el) { io.observe(el); });

    // Safety net. Some environments (embedded webviews, aggressively throttled
    // tabs) never deliver the observer's first callback — which would leave the
    // page permanently blank, since .reveal starts at opacity 0. If nothing has
    // been revealed shortly after load, show everything and drop the animation.
    setTimeout(function () {
      if (!document.querySelector('.reveal.is-in')) {
        io.disconnect();
        revealAll(nodes);
      }
    }, 1200);
  }
  observeReveals($$('.reveal'));

  /* -----------------------------------------------------------------------
     Gallery — grid, filtering and lightbox
     -------------------------------------------------------------------- */
  var grid = $('#galleryGrid');
  var data = window.NNE_GALLERY;

  if (grid && data && data.length) {
    var filterBar = $('#filterBar');
    var emptyMsg = $('#galleryEmpty');
    var flat = [];

    data.forEach(function (cat) {
      cat.items.forEach(function (item) {
        flat.push({
          slug: cat.slug,
          label: cat.label,
          full: item.full,
          thumb: item.thumb,
          w: item.w, h: item.h, tw: item.tw, th: item.th
        });
      });
    });

    // --- filter chips ---
    var chips = [{ slug: 'all', label: 'All looks', count: flat.length }].concat(
      data.map(function (c) { return { slug: c.slug, label: c.label, count: c.items.length }; })
    );

    filterBar.innerHTML = chips.map(function (c) {
      return '<button class="filter-chip" type="button" data-filter="' + c.slug + '" ' +
             'aria-pressed="' + (c.slug === 'all') + '">' + c.label +
             '<span class="count">' + c.count + '</span></button>';
    }).join('');

    // --- tiles ---
    grid.innerHTML = flat.map(function (it, i) {
      return '<button class="masonry-item" type="button" data-index="' + i + '" ' +
             'data-slug="' + it.slug + '" aria-label="View ' + it.label + ' look ' + (i + 1) + ' full size">' +
             '<img src="' + it.thumb + '" alt="' + it.label + ' makeup by Neat\'n\'Even Beauty Clinic" ' +
             'width="' + it.tw + '" height="' + it.th + '" loading="lazy" decoding="async">' +
             '<span class="masonry-item__label">' + it.label + '</span>' +
             '</button>';
    }).join('');

    var tiles = $$('.masonry-item', grid);
    var current = 'all';

    function applyFilter(slug, push) {
      current = slug;
      var shown = 0;
      tiles.forEach(function (t) {
        var match = slug === 'all' || t.dataset.slug === slug;
        t.classList.toggle('is-hidden', !match);
        if (match) shown++;
      });
      $$('.filter-chip', filterBar).forEach(function (chip) {
        chip.setAttribute('aria-pressed', String(chip.dataset.filter === slug));
      });
      if (emptyMsg) emptyMsg.hidden = shown > 0;
      if (push) {
        history.replaceState(null, '', slug === 'all' ? location.pathname : '#' + slug);
      }
    }

    filterBar.addEventListener('click', function (e) {
      var chip = e.target.closest('.filter-chip');
      if (chip) applyFilter(chip.dataset.filter, true);
    });

    // deep link: gallery.html#bridal — on load and when the hash changes
    // (footer/service links pointing at the gallery while already on it)
    function filterFromHash(push) {
      var slug = (location.hash || '').replace('#', '');
      applyFilter(data.some(function (c) { return c.slug === slug; }) ? slug : 'all', push);
    }
    filterFromHash(false);
    window.addEventListener('hashchange', function () { filterFromHash(false); });

    // --- lightbox ---
    var lb = $('#lightbox');
    var lbImg = $('#lbImage');
    var lbCap = $('#lbCaption');
    var lastFocus = null;
    var lbIndex = 0;

    function visibleIndexes() {
      return tiles.reduce(function (acc, t, i) {
        if (!t.classList.contains('is-hidden')) acc.push(i);
        return acc;
      }, []);
    }

    function showAt(index) {
      var it = flat[index];
      if (!it) return;
      lbIndex = index;
      lbImg.src = it.full;
      lbImg.alt = it.label + ' makeup by Neat\'n\'Even Beauty Clinic';
      lbImg.width = it.w;
      lbImg.height = it.h;
      var order = visibleIndexes();
      lbCap.textContent = it.label + ' — ' + (order.indexOf(index) + 1) + ' of ' + order.length;
    }

    function openLightbox(index) {
      lastFocus = document.activeElement;
      showAt(index);
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      $('#lbClose').focus();
    }

    function closeLightbox() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      lbImg.removeAttribute('src'); // not src='', which refetches the page
      if (lastFocus) lastFocus.focus();
    }

    function step(dir) {
      var order = visibleIndexes();
      if (!order.length) return;
      var at = order.indexOf(lbIndex);
      showAt(order[(at + dir + order.length) % order.length]);
    }

    grid.addEventListener('click', function (e) {
      var tile = e.target.closest('.masonry-item');
      if (tile) openLightbox(Number(tile.dataset.index));
    });

    $('#lbClose').addEventListener('click', closeLightbox);
    $('#lbPrev').addEventListener('click', function () { step(-1); });
    $('#lbNext').addEventListener('click', function () { step(1); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Tab') {
        // keep focus inside the dialog
        var focusables = $$('button', lb);
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // swipe on touch devices
    var touchX = null;
    lb.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
      touchX = null;
    }, { passive: true });
  }

  /* -----------------------------------------------------------------------
     Booking form
     -------------------------------------------------------------------- */
  var form = $('#bookingForm');

  if (form) {
    var statusEl = $('#formStatus');
    var submitBtn = $('#submitBtn');
    var waBtn = $('#waSubmit');
    var dateField = $('#date');

    // don't offer dates in the past
    if (dateField) dateField.min = new Date().toISOString().split('T')[0];

    // prefill the service from e.g. contact.html?service=Bridal%20Makeup
    var wanted = new URLSearchParams(location.search).get('service');
    if (wanted) {
      var select = $('#service');
      var match = $$('option', select).find(function (o) {
        return o.textContent.trim().toLowerCase() === wanted.trim().toLowerCase();
      });
      if (match) select.value = match.value || match.textContent;
    }

    function setError(name, message) {
      var input = form.elements[name];
      var slot = $('[data-error-for="' + name + '"]', form);
      if (input && input.closest('.field')) input.closest('.field').classList.toggle('has-error', !!message);
      if (slot) slot.textContent = message || '';
    }

    function validate() {
      var ok = true;
      var v = function (n) { return (form.elements[n].value || '').trim(); };

      setError('name', ''); setError('email', ''); setError('phone', ''); setError('service', '');

      if (v('name').length < 2) { setError('name', 'Please tell us your name.'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))) {
        setError('email', 'Please enter a valid email address.'); ok = false;
      }
      if (v('phone').replace(/\D/g, '').length < 9) {
        setError('phone', 'Please enter a reachable phone number.'); ok = false;
      }
      if (!v('service')) { setError('service', 'Please choose a service.'); ok = false; }

      if (!ok) {
        var firstBad = $('.field.has-error input, .field.has-error select', form);
        if (firstBad) firstBad.focus();
      }
      return ok;
    }

    function values() {
      var g = function (n) { return (form.elements[n].value || '').trim(); };
      return {
        name: g('name'), email: g('email'), phone: g('phone'),
        service: g('service'), date: g('date'), location: g('location'),
        people: g('people'), message: g('message'), company: g('company')
      };
    }

    function showStatus(kind, text) {
      statusEl.className = 'form-status is-visible form-status--' + kind;
      statusEl.textContent = text;
    }

    function whatsappText(d) {
      var lines = [
        "Hello Neat'n'Even Beauty Clinic, I'd like to make a booking.",
        '',
        'Name: ' + d.name,
        'Phone: ' + d.phone,
        'Email: ' + d.email,
        'Service: ' + d.service
      ];
      if (d.date) lines.push('Date: ' + d.date);
      if (d.location) lines.push('Location: ' + d.location);
      if (d.people) lines.push('Number of faces: ' + d.people);
      if (d.message) lines.push('', 'Details: ' + d.message);
      return lines.join('\n');
    }

    // --- WhatsApp path ---
    waBtn.addEventListener('click', function () {
      if (!validate()) return;
      var d = values();
      var url = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(whatsappText(d));
      window.open(url, '_blank', 'noopener');
      showStatus('ok', 'Opening WhatsApp with your details filled in. If nothing happened, check your pop-up blocker.');
    });

    // --- email path ---
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;

      var d = values();
      if (d.company) return; // honeypot tripped — silently ignore

      if (!CONFIG.formEndpoint) {
        showStatus('err',
          'Email sending is not connected yet. Please use the "Send on WhatsApp" button below, ' +
          'or call 055 147 3359 — we will get straight back to you.');
        return;
      }

      var original = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Sending…</span>';

      var payload = new FormData();
      Object.keys(d).forEach(function (k) {
        if (k !== 'company' && d[k]) payload.append(k, d[k]);
      });
      payload.append('_subject', 'Booking enquiry — ' + d.service + ' — ' + d.name);
      // hitting reply in the inbox goes straight back to the client
      payload.append('_replyto', d.email);
      payload.append('_template', 'table');

      fetch(CONFIG.formEndpoint, {
        method: 'POST',
        body: payload,
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        return res.text().then(function (raw) {
          var data = {};
          try { data = JSON.parse(raw); } catch (e) { /* not JSON */ }
          return { res: res, data: data, raw: raw };
        });
      }).then(function (r) {
        // FormSubmit answers 200 OK with success:"false" when the address has
        // not been activated yet. Trusting res.ok alone told the client their
        // booking had been sent when nothing was delivered.
        if (!r.res.ok || String(r.data.success) === 'false') {
          throw new Error(r.data.message || 'Request failed: ' + r.res.status);
        }
        form.reset();
        showStatus('ok', 'Thank you — your enquiry is on its way. We usually reply the same day.');
      }).catch(function (err) {
        // exact reason for whoever maintains the site; visitors get the fallback
        if (window.console) console.warn('[booking form] not delivered:', err && err.message);
        showStatus('err',
          'Sorry — we could not send that just now. Please use the "Send on WhatsApp" ' +
          'button below, or call 055 147 3359. We will get straight back to you.');
      }).then(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = original;
      });
    });

    // clear the error as soon as someone starts fixing it
    ['name', 'email', 'phone', 'service'].forEach(function (n) {
      var el = form.elements[n];
      if (el) el.addEventListener('input', function () { setError(n, ''); });
    });
  }
})();
