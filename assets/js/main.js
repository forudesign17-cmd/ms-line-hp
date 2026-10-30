/* =========================================================
   M・Sライン株式会社 共通JS（依存ライブラリなし）
   ========================================================= */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 1. ヘッダー：スクロールで白背景＋影 ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 2. スマホ用メニュー ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var gnav = document.getElementById('gnav');
  function setMenu(open) {
    if (!menuBtn || !gnav) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    gnav.classList.toggle('is-open', open);
    document.body.classList.toggle('is-menu-open', open);
    document.querySelectorAll('main, .closing, .site-footer, .site-header .logo, .skip-link').forEach(function (el) {
      el.inert = open;
    });
    if (open) {
      var first = gnav.querySelector('a');
      if (first) first.focus();
    }
  }
  if (menuBtn && gnav) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Tab' && menuBtn.getAttribute('aria-expanded') === 'true') {
        var links = Array.from(gnav.querySelectorAll('a'));
        var focusable = [menuBtn].concat(links);
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuBtn.focus();
      }
    });
    gnav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    window.matchMedia('(min-width: 768px)').addEventListener('change', function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  /* ---------- 3. スクロールで要素を表示 ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 3-2. 動きの演出（「線が走る」） ---------- */
  var still = reduceMotion.matches || !('IntersectionObserver' in window);

  // トップの見出し「近くて、確か。」を1文字ずつせり上げる（読み上げは元の文のまま）
  var heroTitle = document.querySelector('.hero__title');
  if (heroTitle && !still) {
    heroTitle.setAttribute('aria-label', heroTitle.textContent.replace(/\s+/g, ''));
    var first = heroTitle.firstChild;
    if (first && first.nodeType === 3) {
      var line = document.createElement('span');
      line.className = 'char-line';
      line.setAttribute('aria-hidden', 'true');
      Array.from(first.textContent.trim()).forEach(function (c, i) {
        var s = document.createElement('span');
        s.className = 'char';
        s.style.setProperty('--i', i);
        s.textContent = c;
        line.appendChild(s);
      });
      heroTitle.replaceChild(line, first);
      Array.from(heroTitle.querySelectorAll('.hero__title-sub')).forEach(function (el) { el.setAttribute('aria-hidden', 'true'); });
    }
  }

  // 写真はシャッターのように開く。見出しは線が引かれてからせり上がる
  var wipes = document.querySelectorAll('.about__photo, .card__img, .service-detail__img, .base-card__img, .base__photo, .work__img');
  wipes.forEach(function (el) { el.classList.add('wipe'); });
  var inTargets = Array.from(wipes).concat(Array.from(document.querySelectorAll('.section-head, .base__map, .numbers')));
  function countUp(el) {
    var comma = el.textContent.indexOf(',') !== -1;
    var to = parseInt(el.textContent.replace(/,/g, ''), 10);
    if (isNaN(to)) return;
    var from = to >= 1000 ? to - 40 : 0;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 1400, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      var v = Math.round(from + (to - from) * eased);
      el.textContent = comma ? v.toLocaleString('en-US') : String(v);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (still) {
    inTargets.forEach(function (el) { el.classList.add('is-in'); });
    document.querySelectorAll('.base__map svg').forEach(function (svg) { if (svg.pauseAnimations) svg.pauseAnimations(); });
  } else {
    var mio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        if (entry.target.classList.contains('numbers')) {
          entry.target.querySelectorAll('.numbers__value').forEach(countUp);
        }
        mio.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    inTargets.forEach(function (el) { mio.observe(el); });
  }

  // 上部のライン（読み進めた量）、ヘッダーの出し入れ、写真のゆるやかな視差
  if (!still) {
    var bar = document.createElement('div');
    bar.className = 'scroll-line';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    // ファーストビューの視差：写真は遅れて大きくなり、文字は逆にゆっくり下がって薄れる
    var words = document.querySelectorAll('[data-word]');
    var heroBox = document.querySelector('.hero, .page-hero');
    var heroMedia = heroBox && heroBox.querySelector('.hero__media, picture');
    var heroBody = heroBox && heroBox.querySelector('.hero__body, .page-hero__body');
    if (!heroMedia) heroBox = null;
    var lastY = window.scrollY;
    var ticking = false;
    function onMotionScroll() {
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
      if (header && !document.body.classList.contains('is-menu-open')) {
        var hide = y > lastY && y > window.innerHeight * 0.6;
        header.classList.toggle('is-hidden', hide);
      }
      if (heroBox) {
        var h = heroBox.offsetHeight;
        if (y <= h * 1.2) {
          var p = Math.min(y / h, 1);
          heroMedia.style.transform = 'translate3d(0,' + (y * 0.5).toFixed(1) + 'px,0) scale(' + (1 + p * 0.1).toFixed(4) + ')';
          if (heroBody) {
            heroBody.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(1) + 'px,0)';
            heroBody.style.opacity = Math.max(0, 1 - p * 1.15).toFixed(3);
          }
        }
      }
      words.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          el.style.setProperty('--p', ((window.innerHeight - r.top) / (window.innerHeight + r.height)).toFixed(3));
        }
      });
      lastY = y;
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(onMotionScroll); ticking = true; }
    }, { passive: true });
    onMotionScroll();
    // キーボードでヘッダー内にフォーカスが来たら必ず見せる
    if (header) header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });
  }

  /* ---------- 4. ヒーロー動画（使う場合のみ） ---------- */
  var videos = document.querySelectorAll('.hero__video');
  function handleVideos() {
    videos.forEach(function (v) {
      if (reduceMotion.matches) { v.pause(); v.removeAttribute('autoplay'); }
      else if (v.offsetParent !== null) { v.play().catch(function () {}); }
      else { v.pause(); }
    });
  }
  if (videos.length) {
    handleVideos();
    reduceMotion.addEventListener('change', handleVideos);
    window.matchMedia('(max-width: 767px)').addEventListener('change', handleVideos);
  }

  /* ---------- 5. 事業内容：ページ内ナビの現在地 ---------- */
  var navLinks = document.querySelectorAll('.service-nav__link');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) sio.observe(sec);
    });
  }
})();
