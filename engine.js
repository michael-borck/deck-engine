/* deck-engine — a small, dependency-free HTML slide engine.

   Origin: adapted from Dylan Davis's AI-Foundations deck, with permission.
   See NOTICE.md. Extended with chapters, presenter, timer, print and a
   configurable landscape/portrait canvas.

   Keys: Right/Space/PageDown/Down next · Left/PageUp/Up back · Home/End
         1..N jump to a chapter · N presenter · M notes · T timer
         R reset timer · B or . blank · F fullscreen
   URL:  #12 opens slide 12 · ?print lays out every slide for PDF export

   Config (set window.DECK_CONFIG before loading this file):
     chapters:     [{ label, time, accent }]
     chapterNoun:  'SESSION'
     navNumbers:   true
     stage:        { orientation: 'landscape' | 'portrait',
                     width, height, sizes: { landscape: {width,height}, portrait: {...} } }
     presenter:    { name: 'deck-presenter' }
*/
(function () {
  'use strict';

  var PRESETS = {
    landscape: { width: 1280, height: 720 },
    portrait: { width: 720, height: 1280 }
  };

  var cfg = window.DECK_CONFIG || {};
  var legacy = window.DECK_CH || [];
  var chapters = (cfg.chapters && cfg.chapters.length ? cfg.chapters : legacy).map(function (c) {
    return {
      label: c.label || '',
      time: c.time || '',
      accent: c.accent || c.acc || ''
    };
  });
  if (!chapters.length) {
    chapters = [{ label: cfg.chapterNoun || 'DECK', time: '', accent: '' }];
  }

  var noun = cfg.chapterNoun || 'SESSION';
  var navNumbers = cfg.navNumbers !== false;
  var stageCfg = cfg.stage || {};
  var defaultOrient = stageCfg.orientation === 'portrait' ? 'portrait' : 'landscape';
  var sizes = {
    landscape: { width: PRESETS.landscape.width, height: PRESETS.landscape.height },
    portrait: { width: PRESETS.portrait.width, height: PRESETS.portrait.height }
  };
  if (stageCfg.width && stageCfg.height) {
    sizes[defaultOrient] = { width: +stageCfg.width, height: +stageCfg.height };
  }
  if (stageCfg.sizes) {
    Object.keys(stageCfg.sizes).forEach(function (key) {
      var s = stageCfg.sizes[key];
      if (s && s.width && s.height) sizes[key] = { width: +s.width, height: +s.height };
    });
  }

  var $ = function (q, el) { return (el || document).querySelector(q); };
  var $$ = function (q, el) { return Array.prototype.slice.call((el || document).querySelectorAll(q)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  };

  var stage = $('#stage');
  var slides = $$('.slide');
  if (!stage || !slides.length) return;

  var chOf = function (sl) { return +(sl.dataset.ch || 0); };
  var orientOf = function (sl) {
    return sl.dataset.orientation === 'portrait' || sl.dataset.orientation === 'landscape'
      ? sl.dataset.orientation
      : defaultOrient;
  };
  var sizeOf = function (sl) { return sizes[orientOf(sl)] || sizes[defaultOrient]; };
  slides.forEach(function (sl) { sl.dataset.orientation = orientOf(sl); });
  var chStart = chapters.map(function (_, c) {
    return slides.findIndex(function (sl) { return chOf(sl) === c; });
  });

  function stepsOf(sl) {
    if (sl.dataset.steps !== undefined) return +sl.dataset.steps;
    var els = $$('[data-s]', sl);
    return els.length ? Math.max.apply(null, els.map(function (e) { return +e.dataset.s; })) : 0;
  }
  var minOf = function (sl) { return sl.dataset.mode === 'spot' ? 1 : 0; };
  var titleOf = function (sl) {
    if (sl.dataset.title) return sl.dataset.title;
    var t = $('.t', sl);
    return t ? t.textContent.trim() : '';
  };

  function apply(sl, step, all) {
    sl.dataset.cur = step;
    $$('[data-s]', sl).forEach(function (e) {
      var n = +e.dataset.s;
      if (sl.dataset.mode === 'spot') {
        e.classList.toggle('lit', all || n === step);
        e.classList.toggle('dimd', !all && n !== step);
      } else {
        e.classList.toggle('on', all || n <= step);
      }
    });
  }

  /* ---------- print mode ---------- */
  if (new URLSearchParams(location.search).has('print')) {
    document.body.classList.add('print');
    var pageStyle = document.createElement('style');
    pageStyle.textContent =
      '@page land{size:' + sizes.landscape.width + 'px ' + sizes.landscape.height + 'px;margin:0}' +
      '@page port{size:' + sizes.portrait.width + 'px ' + sizes.portrait.height + 'px;margin:0}' +
      '@page{size:' + sizes[defaultOrient].width + 'px ' + sizes[defaultOrient].height + 'px;margin:0}';
    document.head.appendChild(pageStyle);
    slides.forEach(function (sl) {
      var c = chapters[chOf(sl)] || chapters[0];
      var size = sizeOf(sl);
      sl.dataset.orientation = orientOf(sl);
      sl.style.width = size.width + 'px';
      sl.style.height = size.height + 'px';
      sl.style.page = orientOf(sl) === 'portrait' ? 'port' : 'land';
      if (c && c.accent) sl.style.setProperty('--acc', c.accent);
      else sl.style.removeProperty('--acc');
      var ps = sl.dataset.printStep;
      apply(sl, ps !== undefined ? +ps : stepsOf(sl), ps === undefined);
    });
    return;
  }

  /* ---------- chrome ---------- */
  var nav = $('#nav');
  chapters.forEach(function (c, n) {
    var d = document.createElement('div');
    d.className = 'nv';
    var num = navNumbers ? String(n + 1).padStart(2, '0') + ' ' : '';
    d.innerHTML = '<span class="bar"></span><span class="lb">' + esc(num + c.label) +
      (c.time ? '<span class="tm">' + esc(c.time) + '</span>' : '') + '</span>';
    nav.appendChild(d);
  });
  var nvs = $$('.nv', nav);
  $('#ct').textContent = slides.length;

  var i = 0;
  var s = 0;
  var h = parseInt(location.hash.slice(1), 10);
  if (h >= 1 && h <= slides.length) i = h - 1;
  s = minOf(slides[i]);

  /* ---------- notes drawer (M) ---------- */
  var drawer = document.createElement('div');
  drawer.id = 'notes-drawer';
  document.body.appendChild(drawer);
  var toast = document.createElement('div');
  toast.id = 'deck-toast';
  document.body.appendChild(toast);
  var toastT = null;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove('on'); }, 6000);
  }
  var anyNotes = !!$('aside.notes');
  function updateDrawer() {
    if (!drawer.classList.contains('on')) return;
    var n = $('aside.notes', slides[i]);
    drawer.innerHTML = '<div class="dh">' + (i + 1) + ' · ' + esc(titleOf(slides[i])) +
      ' <span>M to hide</span></div>' +
      (n ? n.innerHTML
        : anyNotes ? '<p>No notes for this slide.</p>'
        : '<p>This copy has no speaker notes. Open the source deck instead.</p>');
  }
  function toggleDrawer() {
    drawer.classList.toggle('on');
    updateDrawer();
  }

  /* ---------- fit and orientation ---------- */
  var curW = sizes[defaultOrient].width;
  var curH = sizes[defaultOrient].height;
  function fit() {
    var k = Math.min(innerWidth / curW, innerHeight / curH);
    stage.style.transform = 'scale(' + k + ')';
  }
  function setStage(sl) {
    var o = orientOf(sl);
    var size = sizes[o] || sizes[defaultOrient];
    curW = size.width;
    curH = size.height;
    stage.dataset.orientation = o;
    stage.style.width = curW + 'px';
    stage.style.height = curH + 'px';
    stage.style.setProperty('--sw', curW + 'px');
    stage.style.setProperty('--sh', curH + 'px');
    fit();
  }

  function render() {
    var sl = slides[i];
    var ci = chOf(sl);
    var c = chapters[ci] || chapters[0];
    if (c && c.accent) document.documentElement.style.setProperty('--acc', c.accent);
    else document.documentElement.style.removeProperty('--acc');
    setStage(sl);
    slides.forEach(function (x, n) {
      x.classList.toggle('cur', n === i);
      x.setAttribute('aria-hidden', n === i ? 'false' : 'true');
    });
    nvs.forEach(function (n, x) {
      n.classList.toggle('cur', x === ci);
      n.classList.toggle('done', x < ci);
    });
    $('#cn').textContent = i + 1;
    apply(sl, s);
    history.replaceState(null, '', '#' + (i + 1));
    showTimer();
    updatePresenter();
    updateDrawer();
  }

  function go(dir) {
    var sl = slides[i];
    if (dir > 0) {
      if (s < stepsOf(sl)) s++;
      else if (i < slides.length - 1) { i++; s = minOf(slides[i]); }
    } else {
      if (s > minOf(sl)) s--;
      else if (i > 0) { i--; s = stepsOf(slides[i]); }
    }
    render();
  }
  function jump(n) {
    if (n >= 0 && n < slides.length) { i = n; s = minOf(slides[i]); render(); }
  }

  /* ---------- exercise timer ---------- */
  var tEl = $('#timer');
  var tm = { slide: -1, left: 0, run: false, last: 0 };
  var fmt = function (sec) {
    var a = Math.abs(Math.round(sec));
    var m = Math.floor(a / 60);
    var r = a % 60;
    return (sec < 0 ? '+' : '') + m + ':' + String(r).padStart(2, '0');
  };
  function showTimer() {
    var vis = tm.slide === i || tm.run;
    tEl.classList.toggle('show', vis);
    tEl.classList.toggle('paused', vis && !tm.run);
    tEl.classList.toggle('over', tm.left < 0);
    tEl.textContent = fmt(tm.left);
  }
  function toggleTimer() {
    var mins = +slides[i].dataset.min || 0;
    if (tm.slide !== i) {
      if (!mins) return;
      tm.slide = i;
      tm.left = mins * 60;
      tm.run = true;
      tm.last = Date.now();
    } else {
      tm.run = !tm.run;
      tm.last = Date.now();
    }
    showTimer();
  }
  function resetTimer() {
    tm.slide = -1;
    tm.left = 0;
    tm.run = false;
    showTimer();
  }
  setInterval(function () {
    if (tm.run) {
      var now = Date.now();
      tm.left -= (now - tm.last) / 1000;
      tm.last = now;
      showTimer();
    }
    tickPresenter();
  }, 250);

  /* ---------- presenter window ---------- */
  var pw = null;
  var t0 = Date.now();
  var PRESENTER = '<!doctype html><html><head><meta charset="utf-8"><title>Presenter</title><style>' +
    'body{margin:0;background:#0A0C10;color:#ECE7DB;font:16px/1.5 system-ui,sans-serif;display:flex;flex-direction:column;height:100vh}' +
    'header{display:flex;gap:28px;align-items:baseline;padding:16px 24px;border-bottom:1px solid rgba(236,231,219,.15);font-family:ui-monospace,monospace;font-size:13px;letter-spacing:.1em;color:rgba(236,231,219,.6)}' +
    'header b{color:var(--acc,#E8B54D);font-size:22px}' +
    '#ttl{font:600 26px/1.25 Georgia,serif;padding:18px 24px 4px}' +
    '#step{padding:0 24px;font-family:ui-monospace,monospace;font-size:12px;letter-spacing:.12em;color:rgba(236,231,219,.5)}' +
    '#notes{flex:1;overflow:auto;padding:12px 24px 24px;font-size:19px}' +
    '#notes ul{padding-left:22px}#notes li{margin:6px 0}#notes p{margin:8px 0}' +
    '#notes .none{color:rgba(236,231,219,.4)}' +
    'footer{padding:12px 24px;border-top:1px solid rgba(236,231,219,.15);color:rgba(236,231,219,.6);font-size:15px}' +
    '.grow{flex:1}#ex.over{color:#E5745A}button{background:none;border:1px solid rgba(236,231,219,.3);color:inherit;border-radius:6px;padding:2px 10px;cursor:pointer;font:inherit}' +
    '</style></head><body>' +
    '<header><span><b id="pn"></b> / <span id="pt"></span></span><span id="pch"></span><span class="grow"></span>' +
    '<span>ELAPSED <b id="el">0:00</b> <button id="rs">reset</button></span><span>EXERCISE <b id="ex">-</b></span><span>CLOCK <b id="ck"></b></span></header>' +
    '<div id="ttl"></div><div id="step"></div><div id="notes"></div>' +
    '<footer>NEXT &nbsp; <span id="nx"></span></footer></body></html>';

  function openPresenter() {
    if (!anyNotes) {
      say('No speaker notes in this copy. Open the source deck instead.');
      return;
    }
    var name = (cfg.presenter && cfg.presenter.name) || 'deck-presenter';
    pw = window.open('', name, 'width=1000,height=720');
    if (!pw) {
      say('The presenter window was blocked. Allow pop-ups for this page and press N again, or press M to show the notes here.');
      return;
    }
    pw.document.open();
    pw.document.write(PRESENTER);
    pw.document.close();
    pw.document.addEventListener('keydown', onKey);
    pw.document.getElementById('rs').onclick = function () { t0 = Date.now(); };
    t0 = Date.now();
    updatePresenter();
  }
  function updatePresenter() {
    if (!pw || pw.closed) return;
    var d = pw.document;
    var sl = slides[i];
    var nx = slides[i + 1];
    var ci = chOf(sl);
    var c = chapters[ci] || chapters[0];
    if (c && c.accent) d.documentElement.style.setProperty('--acc', c.accent);
    else d.documentElement.style.removeProperty('--acc');
    d.getElementById('pn').textContent = i + 1;
    d.getElementById('pt').textContent = slides.length;
    d.getElementById('pch').textContent = noun + ' ' + String(ci + 1).padStart(2, '0') + ' · ' + c.label;
    d.getElementById('ttl').textContent = titleOf(sl);
    var st = stepsOf(sl);
    d.getElementById('step').textContent = st ? 'STEP ' + s + ' OF ' + st : '';
    var n = $('aside.notes', sl);
    d.getElementById('notes').innerHTML = n ? n.innerHTML : '<p class="none">No notes for this slide.</p>';
    d.getElementById('nx').textContent = nx ? titleOf(nx) : 'End of deck';
    tickPresenter();
  }
  function tickPresenter() {
    if (!pw || pw.closed) return;
    var d = pw.document;
    d.getElementById('el').textContent = fmt((Date.now() - t0) / 1000);
    d.getElementById('ck').textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    var ex = d.getElementById('ex');
    ex.textContent = tm.slide >= 0 ? fmt(tm.left) + (tm.run ? '' : ' ‖') : '-';
    ex.className = tm.left < 0 ? 'over' : '';
  }

  /* ---------- input ---------- */
  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (['ArrowRight', 'PageDown', ' ', 'ArrowDown'].indexOf(k) !== -1) { e.preventDefault(); go(1); }
    else if (['ArrowLeft', 'PageUp', 'ArrowUp'].indexOf(k) !== -1) { e.preventDefault(); go(-1); }
    else if (k === 'Home') { e.preventDefault(); jump(0); }
    else if (k === 'End') { e.preventDefault(); jump(slides.length - 1); }
    else if (/^[1-9]$/.test(k) && +k <= chapters.length) {
      var n = chStart[+k - 1];
      if (n >= 0) { e.preventDefault(); jump(n); }
    }
    else if (k === 'n' || k === 'N') openPresenter();
    else if (k === 'm' || k === 'M') toggleDrawer();
    else if (k === 't' || k === 'T') toggleTimer();
    else if (k === 'r' || k === 'R') resetTimer();
    else if (k === 'b' || k === 'B' || k === '.') $('#blank').classList.toggle('on');
    else if (k === 'f' || k === 'F') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    }
  }
  addEventListener('keydown', onKey);

  var tx = null;
  addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    tx = null;
  });
  addEventListener('resize', fit);
  addEventListener('hashchange', function () {
    var n = parseInt(location.hash.slice(1), 10);
    if (n >= 1 && n <= slides.length) jump(n - 1);
  });

  fit();
  render();
})();
