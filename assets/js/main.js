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

  /* ---------- 6. お問い合わせフォーム（contact.html のみ） ---------- */
  var form = document.querySelector('[data-contact-form]');
  if (form) {
    // 採用ページから来たとき（contact.html?type=recruit）は「採用・応募について」を選んでおく
    if (new URLSearchParams(location.search).get('type') === 'recruit') {
      var typeSelect = form.querySelector('select');
      if (typeSelect) typeSelect.value = '採用・応募について';
    }
    var done = document.getElementById('form-done');
    var errorBox = document.getElementById('form-error');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorBox.textContent = '';

      // 迷惑メール対策：ハニーポット欄に入力があれば送信しない
      if (form.querySelector('[name="_gotcha"]').value) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var action = form.getAttribute('action') || '';
      if (!action || action.indexOf('YOUR_FORM_ID') !== -1) {
        errorBox.textContent = 'フォームは準備中です。お電話（086-236-7500）でご相談ください。';
        return;
      }

      var btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      btn.textContent = '送信しています…';

      fetch(action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error('send failed');
        return res.json();
      }).then(function (result) {
        if (result.ok !== true) throw new Error('send failed');
        form.hidden = true;
        done.hidden = false;
        done.setAttribute('tabindex', '-1');
        done.focus();
      }).catch(function () {
        errorBox.textContent = '送信できませんでした。時間をおいて再度お試しいただくか、お電話（086-236-7500）でご連絡ください。';
        btn.disabled = false;
        btn.textContent = '送信する';
      });
    });
  }
})();
