/* ShipSafe SDK — interactivity */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ========== Nav shadow on scroll ========== */
  const nav = $('.nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ========== Hamburger / mobile nav ========== */
  const hamburger = $('#hamburger');
  const navLinks = $('#navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
  }

  /* ========== Smooth scroll for anchor links ========== */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ========== Reveal on scroll ========== */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));

  /* ========== Hero scenario: Ocho Rios pier-runner ==========
     Real setting: passenger at Island Village, ship departs Turtle Bay
     Pier at 3:00 PM. Alert state is driven by BUFFER = (departure time
     − simulated time) − walking ETA. Walker position is decoupled from
     pill state — in states 1–2 the walker lingers at Island Village
     while buffer shrinks, so the product's "nudge before you lose track
     of time" value prop actually lands visually. Each state plays for
     ~2.8s; full loop ≈ 20s. */
  const phoneScreen = $('.phone-screen');
  const etaValue = $('#etaMinutes');
  const etaPill = $('#etaPill');
  const etaPillLabel = $('#etaPillLabel');
  const etaPillIcon = $('#etaPillIcon');
  const etaProgress = $('#etaProgress');
  const etaClock = $('#etaClock');
  const etaRouteName = $('#etaRouteName');
  const etaRouteDist = $('#etaRouteDist');
  const etaPace = $('#etaPace');
  const etaUpdated = $('#etaUpdated');

  // Icon set — each state gets a distinct glyph so meaning doesn't rely on color alone (WCAG 1.4.1)
  const ICONS = {
    monitor: '<circle cx="12" cy="12" r="2"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>',
    check:   '<path d="M5 13l4 4L19 7"/>',
    clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    warn:    '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18.5v.01"/>',
    anchor:  '<circle cx="12" cy="6" r="2"/><path d="M12 8v12M6 12h12M5 17a8 8 0 0014 0"/>'
  };

  const SCENARIO = [
    { simTime: '2:00 PM', pos:  0, eta: 15, buffer: 45, state: 'good', pill: 'Monitoring', icon: 'monitor', route: 'Enjoying Ocho Rios',             dist: '1.2 km to ship', pace: 'Pace idle' },
    { simTime: '2:20 PM', pos:  0, eta: 15, buffer: 25, state: 'good', pill: 'On Track',   icon: 'check',   route: 'Heads-up: 25 min to departure',  dist: '1.2 km to ship', pace: 'Pace idle' },
    { simTime: '2:32 PM', pos:  8, eta: 14, buffer: 14, state: 'good', pill: 'On Track',   icon: 'check',   route: 'Head to Main Street',            dist: '1.1 km to ship', pace: 'Pace 4.2 km/h' },
    { simTime: '2:38 PM', pos: 25, eta: 11, buffer: 11, state: 'warn', pill: 'Leave Soon', icon: 'clock',   route: 'Head north on Main St',          dist: '870 m to ship',  pace: 'Pace 4.5 km/h' },
    { simTime: '2:46 PM', pos: 55, eta:  7, buffer:  7, state: 'warn', pill: 'Leave Soon', icon: 'clock',   route: 'Pass the Yacht Harbour Marina',  dist: '530 m to ship',  pace: 'Pace 4.8 km/h' },
    { simTime: '2:54 PM', pos: 82, eta:  3, buffer:  3, state: 'bad',  pill: 'Go Now',     icon: 'warn',    route: 'Final approach to Pier 3',       dist: '210 m to ship',  pace: 'Pace 5.4 km/h' },
    { simTime: '2:59 PM', pos: 99, eta:  0, buffer:  1, state: 'good', pill: 'Arriving',   icon: 'anchor',  route: 'Just in time — welcome aboard',  dist: 'At the pier',    pace: 'Boarding now' }
  ];

  const heroWalker = document.getElementById('heroWalker');
  const heroRouteFull = document.getElementById('heroRouteFull');
  const heroRouteWalked = document.getElementById('heroRouteWalked');
  let pathTotalLen = 0;
  if (heroRouteFull && typeof heroRouteFull.getTotalLength === 'function') {
    try { pathTotalLen = heroRouteFull.getTotalLength(); } catch { pathTotalLen = 0; }
  }
  const updateWalker = (pct) => {
    if (!heroWalker || !heroRouteFull || !pathTotalLen) return;
    const clamped = Math.max(0, Math.min(100, pct));
    const pt = heroRouteFull.getPointAtLength((clamped / 100) * pathTotalLen);
    heroWalker.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
    if (heroRouteWalked) {
      heroRouteWalked.style.strokeDashoffset = String(1 - clamped / 100);
    }
  };

  let idx = 0, secondsTick = 0;
  const setState = (s) => {
    if (!etaValue) return;
    etaValue.textContent = s.eta === 0 ? '<1' : s.eta;
    if (etaPillLabel) etaPillLabel.textContent = s.pill;
    if (etaPillIcon) etaPillIcon.innerHTML = ICONS[s.icon] || ICONS.monitor;
    etaPill.className = 'phone-pill ' + (s.state === 'warn' ? 'warn' : s.state === 'bad' ? 'bad' : '');
    if (phoneScreen) phoneScreen.dataset.alert = s.state;
    etaProgress.style.width = s.pos + '%';
    if (s.state === 'warn')      etaProgress.style.background = 'linear-gradient(90deg, #facc15, #ff5c3a)';
    else if (s.state === 'bad')  etaProgress.style.background = 'linear-gradient(90deg, #ff5c3a, #ef4444)';
    else                         etaProgress.style.background = 'linear-gradient(90deg, #2dd4bf, #84cc16)';
    etaRouteName.textContent = s.route;
    etaRouteDist.textContent = s.dist;
    etaPace.textContent = s.pace;
    if (etaClock) etaClock.textContent = s.simTime;
    updateWalker(s.pos);
  };

  if (etaValue) {
    setState(SCENARIO[0]);
    setInterval(() => {
      idx = (idx + 1) % SCENARIO.length;
      setState(SCENARIO[idx]);
      secondsTick = 0;
    }, 2800);
    setInterval(() => {
      secondsTick++;
      if (etaUpdated) etaUpdated.textContent = `Updated ${secondsTick}s ago`;
    }, 1000);
  }

  /* ========== GoTime demo flip ========== */
  const GOTIME = [
    { name: 'Return to Ship',       meta: 'MS Ocean Voyager · Departs 3:00 PM', min: 12, status: 'On Track',    cls: 'pier' },
    { name: 'Island Food Tour',     meta: 'Harbor Square · Departs 2:30 PM',    min:  8, status: 'Leave Soon',  cls: 'warn' },
    { name: 'Snorkeling Adventure', meta: 'Beach Pier · Departs 3:45 PM',       min: 22, status: 'On Track',    cls: 'pier' }
  ];
  const GOTIME_ALT = [
    { name: 'Return to Ship',       meta: 'MS Ocean Voyager · Departs 3:00 PM', min: 10, status: 'On Track',    cls: 'pier' },
    { name: 'Island Food Tour',     meta: 'Harbor Square · Departs 2:30 PM',    min:  3, status: "It's Go Time", cls: 'go'   },
    { name: 'Snorkeling Adventure', meta: 'Beach Pier · Departs 3:45 PM',       min: 20, status: 'On Track',    cls: 'pier' }
  ];
  const goNodes = $$('.gotime-demo .dest');
  let goFlip = false;
  const renderGo = (arr) => {
    goNodes.forEach((node, i) => {
      const d = arr[i]; if (!d) return;
      node.className = 'dest ' + d.cls;
      node.querySelector('.dest-name').textContent = d.name;
      node.querySelector('.dest-meta').textContent = d.meta;
      node.querySelector('.status').textContent = d.status;
      node.querySelector('.eta-min').innerHTML = `${d.min} <span style="color:var(--ink-mute);font-size:12px;font-weight:500;">min</span>`;
    });
  };
  if (goNodes.length) {
    renderGo(GOTIME);
    setInterval(() => {
      goFlip = !goFlip;
      renderGo(goFlip ? GOTIME_ALT : GOTIME);
    }, 3200);
    let goSec = 0;
    setInterval(() => {
      goSec = (goSec + 1) % 10;
      const up = $('#gotimeUpdated');
      if (up) up.textContent = `Updated ${goSec + 1}s ago`;
    }, 1000);
  }

  /* ========== Lightbox ========== */
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxCaption = $('#lightboxCaption');
  let lightboxReturnFocus = null;

  const openLightbox = (src, alt, caption) => {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightboxCaption.textContent = caption || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    lightbox.focus();
  };
  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    lightboxImg.src = '';
    if (lightboxReturnFocus && typeof lightboxReturnFocus.focus === 'function') {
      lightboxReturnFocus.focus();
    }
    lightboxReturnFocus = null;
  };

  $$('.zoomable').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      lightboxReturnFocus = el;
      const src = el.dataset.zoomSrc || el.querySelector('img')?.src;
      const alt = el.querySelector('img')?.alt;
      const caption = el.dataset.zoomCaption || '';
      openLightbox(src, alt, caption);
    });
  });
  $$('[data-lightbox-close]').forEach((el) => {
    el.addEventListener('click', closeLightbox);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox?.classList.contains('open')) closeLightbox();
  });

  /* ========== Animated stat counters ========== */
  const animNum = (el) => {
    const target = parseFloat(el.dataset.target);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const dur = 1400;
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(target * eased);
      el.textContent = prefix + v.toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const numIo = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (e.isIntersecting) {
        animNum(e.target);
        numIo.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  $$('[data-target]').forEach((el) => numIo.observe(el));
})();
