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

  /* ========== Hero ETA animation ========== */
  const etaValue = $('#etaMinutes');
  const etaPill = $('#etaPill');
  const etaProgress = $('#etaProgress');
  const etaClock = $('#etaClock');
  const etaRouteName = $('#etaRouteName');
  const etaRouteDist = $('#etaRouteDist');
  const etaPace = $('#etaPace');
  const etaUpdated = $('#etaUpdated');

  const SCRIPT = [
    { min: 18, pill: 'Monitoring', state: 'good', pct: 18, route: 'Continue on Main St',       dist: '1.3 km', pace: 'Pace 4.2 km/h' },
    { min: 15, pill: 'On Track',   state: 'good', pct: 32, route: 'Turn right onto Harbor Rd', dist: '980 m',  pace: 'Pace 4.4 km/h' },
    { min: 12, pill: 'On Track',   state: 'good', pct: 48, route: 'Continue on Harbor Rd',     dist: '720 m',  pace: 'Pace 4.5 km/h' },
    { min:  9, pill: 'Leave Soon', state: 'warn', pct: 66, route: 'Stay left at fork',         dist: '540 m',  pace: 'Pace 4.6 km/h' },
    { min:  6, pill: 'Leave Soon', state: 'warn', pct: 78, route: 'Cross pedestrian bridge',   dist: '380 m',  pace: 'Pace 4.7 km/h' },
    { min:  3, pill: 'Go Now',     state: 'bad',  pct: 92, route: 'Pier 3 — final approach',   dist: '180 m',  pace: 'Pace 5.1 km/h' },
    { min:  1, pill: 'Arriving',   state: 'good', pct: 99, route: 'Welcome back aboard',       dist: '40 m',   pace: 'Pace 4.9 km/h' }
  ];

  let idx = 0, secondsTick = 0;
  const setEta = (s) => {
    if (!etaValue) return;
    etaValue.textContent = s.min;
    etaPill.textContent = s.pill;
    etaPill.className = 'phone-pill ' + (s.state === 'warn' ? 'warn' : s.state === 'bad' ? 'bad' : '');
    etaProgress.style.width = s.pct + '%';
    if (s.state === 'warn')      etaProgress.style.background = 'linear-gradient(90deg, #facc15, #ff5c3a)';
    else if (s.state === 'bad')  etaProgress.style.background = 'linear-gradient(90deg, #ff5c3a, #ef4444)';
    else                         etaProgress.style.background = 'linear-gradient(90deg, #2dd4bf, #84cc16)';
    etaRouteName.textContent = s.route;
    etaRouteDist.textContent = s.dist;
    etaPace.textContent = s.pace;
  };
  const tickClock = () => {
    if (!etaClock) return;
    const d = new Date();
    etaClock.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  tickClock();
  setInterval(tickClock, 30_000);
  if (etaValue) {
    setEta(SCRIPT[0]);
    setInterval(() => {
      idx = (idx + 1) % SCRIPT.length;
      setEta(SCRIPT[idx]);
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
