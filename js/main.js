document.addEventListener('DOMContentLoaded', function () {
  // Scroll animations with IntersectionObserver
  var animatedEls = document.querySelectorAll('[data-animate]');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    animatedEls.forEach(function (el) { observer.observe(el); });
  } else {
    animatedEls.forEach(function (el) { el.classList.add('visible'); });
  }

  // Navbar scroll effect
  var navbar = document.getElementById('navbar');
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        if (window.scrollY > 50) {
          navbar.classList.add('nav-scrolled');
        } else {
          navbar.classList.remove('nav-scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  });

  // Mobile menu toggle
  var hamburger = document.getElementById('hamburger');
  var navLinks = document.getElementById('navLinks');
  hamburger.addEventListener('click', function () {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
  });
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
    });
  });

  // Hero phone mockup animation
  var heroAnim = document.getElementById('heroAnimation');
  if (heroAnim && 'IntersectionObserver' in window) {
    var heroObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          heroAnim.classList.add('animated');
          startHeroPhoneAnimation();
          heroObserver.unobserve(heroAnim);
        }
      });
    }, { threshold: 0.3 });
    heroObserver.observe(heroAnim);
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});

// ========================================
// Hero phone animation — walker + alerts
// ========================================
function startHeroPhoneAnimation() {
  var awayPath = [
    [138, 60], [138, 68], [100, 68], [100, 122],
    [47, 122], [47, 176], [8, 176], [8, 230]
  ];
  var returnPath = [
    [8, 230], [47, 230], [47, 176], [100, 176],
    [100, 122], [138, 122], [138, 68], [138, 60]
  ];

  var AWAY_DURATION = 17000;
  var RETURN_DURATION = 10000;
  var START_DELAY = 800;

  var walkerDot = document.getElementById('heroWalkerDot');
  var walkerGlow = document.getElementById('heroWalkerGlow');
  var walkerInner = document.getElementById('heroWalkerInner');
  var routeWalked = document.getElementById('heroRouteWalked');
  var phoneScreen = document.getElementById('heroPhoneScreen');
  var etaTime = document.getElementById('heroEtaTime');
  var alertBanner = document.getElementById('heroAlertBanner');
  var alertIcon = document.getElementById('heroAlertIcon');
  var alertTitle = document.getElementById('heroAlertTitle');
  var alertDesc = document.getElementById('heroAlertDesc');
  var progressFill = document.getElementById('heroProgressFill');

  if (!walkerDot) return;

  var stages = [
    { time: 800, alertClass: 'alert-green', icon: '\u2713', title: "You're On Track", desc: 'Plenty of time. Enjoy the port!', progress: 8 },
    { time: 6000, alertClass: 'alert-green', icon: '\u2713', title: 'On Time', desc: 'Walking at a good pace.', progress: 30 },
    { time: 11000, alertClass: 'alert-yellow', icon: '!', title: 'Heads Up', desc: "You're cutting it close.", progress: 55 },
    { time: 15000, alertClass: 'alert-orange', icon: '\u26A0', title: 'Turn Back Now', desc: 'Head directly to pier.', progress: 65 },
    { time: 20000, alertClass: 'alert-red', icon: '\u26A0', title: 'DEPARTURE IMMINENT', desc: 'Run to pier immediately.', progress: 85 },
    { time: 25000, alertClass: 'alert-safe', icon: '\u2713', title: 'You Made It!', desc: 'Welcome back aboard.', progress: 100 }
  ];

  function getPathLength(path) {
    var len = 0;
    for (var i = 1; i < path.length; i++) {
      var dx = path[i][0] - path[i-1][0];
      var dy = path[i][1] - path[i-1][1];
      len += Math.sqrt(dx*dx + dy*dy);
    }
    return len;
  }

  function getPointAtFraction(path, frac) {
    frac = Math.max(0, Math.min(1, frac));
    var totalLen = getPathLength(path);
    var targetDist = frac * totalLen;
    var traveled = 0;
    for (var i = 1; i < path.length; i++) {
      var dx = path[i][0] - path[i-1][0];
      var dy = path[i][1] - path[i-1][1];
      var segLen = Math.sqrt(dx*dx + dy*dy);
      if (traveled + segLen >= targetDist) {
        var segFrac = (targetDist - traveled) / segLen;
        return [path[i-1][0] + dx * segFrac, path[i-1][1] + dy * segFrac];
      }
      traveled += segLen;
    }
    return path[path.length - 1];
  }

  function buildPathStr(path, frac) {
    var totalLen = getPathLength(path);
    var targetDist = frac * totalLen;
    var d = 'M' + path[0][0] + ',' + path[0][1];
    var traveled = 0;
    for (var i = 1; i < path.length; i++) {
      var dx = path[i][0] - path[i-1][0];
      var dy = path[i][1] - path[i-1][1];
      var segLen = Math.sqrt(dx*dx + dy*dy);
      if (traveled + segLen >= targetDist) {
        var segFrac = (targetDist - traveled) / segLen;
        var px = path[i-1][0] + dx * segFrac;
        var py = path[i-1][1] + dy * segFrac;
        d += ' L' + px.toFixed(1) + ',' + py.toFixed(1);
        break;
      }
      d += ' L' + path[i][0] + ',' + path[i][1];
      traveled += segLen;
    }
    return d;
  }

  // Stage transitions
  stages.forEach(function(stage) {
    setTimeout(function() {
      phoneScreen.className = 'hero-phone-screen ' + stage.alertClass;
      alertIcon.textContent = stage.icon;
      alertTitle.textContent = stage.title;
      alertDesc.textContent = stage.desc;
      progressFill.style.width = stage.progress + '%';
      alertBanner.classList.remove('hero-alert-flash');
      void alertBanner.offsetWidth;
      alertBanner.classList.add('hero-alert-flash');
    }, stage.time);
  });

  // ETA countdown
  function startEtaCountdown() {
    var etaStart = performance.now();
    var totalDuration = 25000;
    var startSecs = 720;
    function tick(now) {
      var elapsed = Math.min((now - etaStart) / totalDuration, 1);
      var secs = Math.round(startSecs * (1 - elapsed));
      var m = Math.floor(secs / 60);
      var s = secs % 60;
      etaTime.innerHTML = m + ':' + (s < 10 ? '0' : '') + s + '<span>min</span>';
      if (elapsed < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Walker animation
  var animStart = null;
  function animateWalker(now) {
    if (!animStart) animStart = now;
    var elapsed = now - animStart;
    var pos;
    if (elapsed < AWAY_DURATION) {
      var frac = Math.min(elapsed / AWAY_DURATION, 1);
      var eased = 1 - Math.pow(1 - frac, 2);
      pos = getPointAtFraction(awayPath, eased);
      routeWalked.setAttribute('d', buildPathStr(awayPath, eased));
    } else {
      var returnElapsed = elapsed - AWAY_DURATION;
      var frac = Math.min(returnElapsed / RETURN_DURATION, 1);
      var eased = frac < 0.5 ? 2*frac*frac : 1 - Math.pow(-2*frac+2,2)/2;
      pos = getPointAtFraction(returnPath, eased);
      routeWalked.setAttribute('d', buildPathStr(returnPath, eased));
    }
    walkerDot.setAttribute('cx', pos[0]);
    walkerDot.setAttribute('cy', pos[1]);
    walkerGlow.setAttribute('cx', pos[0]);
    walkerGlow.setAttribute('cy', pos[1]);
    walkerInner.setAttribute('cx', pos[0]);
    walkerInner.setAttribute('cy', pos[1]);
    if (elapsed < AWAY_DURATION + RETURN_DURATION) {
      requestAnimationFrame(animateWalker);
    }
  }

  routeWalked.setAttribute('d', 'M138,60');

  setTimeout(function() {
    requestAnimationFrame(animateWalker);
    startEtaCountdown();
  }, START_DELAY);
}
