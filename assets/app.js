/* ═══════ 视图切换：档案桌面 ⇄ 卷宗内页 ═══════ */
(function () {
  const desk = document.getElementById('desk');
  const archive = document.getElementById('archive');
  const music = document.getElementById('music');

  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }

  const ORDER = ['about', 'hole', 'notice', 'script', 'reviews', 'cards', 'end'];
  const NAMES = { about: '关于我', hole: '树洞', notice: '须知', script: '话术', reviews: '板评', cards: '卡类', end: '卷终' };
  let curIdx = 0;

  function setModule(sec) {
    document.querySelectorAll('#archive main section').forEach(s => { s.hidden = (s.id !== sec); });
    curIdx = ORDER.indexOf(sec);
    requestAnimationFrame(() => window.scrollTo(0, 0));
    toast('已打开「' + (NAMES[sec] || sec) + '」');
  }

  function openArchive(sec) {
    const first = archive.hidden;
    archive.hidden = false;
    desk.style.display = 'none';
    document.body.classList.remove('desk-on');
    document.body.classList.add('archive-on');
    setModule(sec);
    if (first) {
      if (window.__startAmbient) window.__startAmbient();
      music.classList.add('show');
    }
  }

  function backToDesk() {
    archive.hidden = true;
    desk.style.display = '';
    document.body.classList.add('desk-on');
    document.body.classList.remove('archive-on');
    window.scrollTo(0, 0);
    if (window.__stopAmbient) window.__stopAmbient();
    music.classList.remove('show', 'on');
  }

  document.querySelectorAll('[data-go]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); openArchive(el.dataset.go); });
  });
  document.getElementById('back-desk').addEventListener('click', backToDesk);

  /* 模块去向提示：已改为在模块文字里直接写明，不再注入角标 */

  /* 桌面两种墙面切换 */
  document.querySelectorAll('.mode-panel button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.mode-panel button').forEach(x => x.classList.toggle('on', x === b));
      desk.className = 'mode-' + b.dataset.mode;
    });
  });
})();

/* ===== 背景粒子（内页） ===== */
(function () {
  const cv = document.getElementById('bg');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W, H, DPR, parts = [];
  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * DPR; H = cv.height = innerHeight * DPR;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    parts = [...Array(34)].map(() => ({
      x: Math.random() * W, y: Math.random() * H,
      r: (Math.random() * 2 + .7) * DPR,
      vy: -(Math.random() * .3 + .08) * DPR,
      vx: (Math.random() - .5) * .18 * DPR,
      c: Math.random() < .34 ? '217,168,78' : (Math.random() < .55 ? '143,174,126' : '201,122,90'),
      a: Math.random() * .3 + .14, tw: Math.random() * Math.PI * 2
    }));
  }
  resize(); addEventListener('resize', resize);
  (function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.tw += .02;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      const a = p.a * (0.65 + 0.35 * Math.sin(p.tw));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
      ctx.fillStyle = `rgba(${p.c},${a})`; ctx.fill();
    }
    requestAnimationFrame(draw);
  })();
})();

/* ===== 自定义光标 ===== */
(function () {
  const cur = document.getElementById('cur');
  if (!cur || !matchMedia('(hover:hover) and (pointer:fine)').matches) { if (cur) cur.remove(); return; }
  addEventListener('mousemove', e => { cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px'; });
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('a,button,.svc,.card,.letter,.cup,.chip');
    cur.classList.toggle('big', !!t);
  });
})();

/* ===== 糖粒飘落（内页入座后） ===== */
function spawnSugar() {
  const box = document.getElementById('petals');
  if (!box || box.childElementCount) return;
  const sugar = ['linear-gradient(135deg,#f6f1de,#ffffff)', 'linear-gradient(135deg,#f3e3b8,#fbf4de)', 'linear-gradient(135deg,#e8cdb8,#f7ece2)'];
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('i'); p.className = 'petal';
    const s = 7 + Math.random() * 9;
    p.style.cssText = `left:${Math.random() * 100}vw;width:${s}px;height:${s}px;
      background:${sugar[i % 3]};--sway:${(Math.random() * 90 + 30) * (Math.random() < .5 ? -1 : 1)}px;
      animation-duration:${9 + Math.random() * 8}s;animation-delay:${-Math.random() * 14}s;
      opacity:${.45 + Math.random() * .4};border-radius:50%`;
    box.appendChild(p);
  }
}

/* ===== 环境音（WebAudio 合成） ===== */
(function () {
  const btn = document.getElementById('music');
  if (!btn) return;
  let actx = null, master = null, nodes = [], timer = null, playing = false;
  const SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

  function build() {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.gain.value = 0; master.connect(actx.destination);
    const filt = actx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 1500; filt.Q.value = .6;
    filt.connect(master);
    const pad = actx.createGain(); pad.gain.value = .05; pad.connect(filt);
    [130.81, 196.00, 261.63].forEach((f, i) => {
      const o = actx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      o.detune.value = i * 4 - 4;
      const lfo = actx.createOscillator(), lg = actx.createGain();
      lfo.frequency.value = .05 + i * .03; lg.gain.value = .022;
      lfo.connect(lg); lg.connect(pad.gain);
      o.connect(pad); o.start(); lfo.start();
      nodes.push(o, lfo);
    });
    nodes.push(pad, filt);
  }
  function pluck() {
    if (!playing) return;
    const t = actx.currentTime;
    const f = SCALE[Math.floor(Math.random() * SCALE.length)];
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.09, t + .02);
    g.gain.exponentialRampToValueAtTime(.0001, t + 2.6);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 2.7);
    timer = setTimeout(pluck, 1600 + Math.random() * 3200);
  }
  function start() {
    if (!actx) build();
    actx.resume();
    playing = true;
    master.gain.cancelScheduledValues(actx.currentTime);
    master.gain.setValueAtTime(master.gain.value, actx.currentTime);
    master.gain.linearRampToValueAtTime(.5, actx.currentTime + 3);
    clearTimeout(timer); timer = setTimeout(pluck, 900);
    btn.classList.remove('off'); btn.classList.add('on');
  }
  function stop() {
    playing = false; clearTimeout(timer);
    if (master) {
      master.gain.cancelScheduledValues(actx.currentTime);
      master.gain.setValueAtTime(master.gain.value, actx.currentTime);
      master.gain.linearRampToValueAtTime(0, actx.currentTime + .6);
    }
    btn.classList.add('off'); btn.classList.remove('on');
  }
  window.__startAmbient = start;
  window.__stopAmbient = stop;
  btn.addEventListener('click', () => { playing ? stop() : start(); });
})();

/* ===== 卡类 · 相遇计时（自 2024-03-10 起累计） ===== */
(function () {
  const d = document.getElementById('cd-d');
  if (!d) return;
  const START = new Date('2024-03-10T00:00:00+08:00').getTime();
  const pad = n => String(n).padStart(2, '0');
  function tick() {
    let t = Math.max(0, Date.now() - START);
    const days = Math.floor(t / 864e5); t -= days * 864e5;
    const h = Math.floor(t / 36e5); t -= h * 36e5;
    const m = Math.floor(t / 6e4); t -= m * 6e4;
    const s = Math.floor(t / 1e3);
    d.textContent = days;
    document.getElementById('cd-h').textContent = pad(h);
    document.getElementById('cd-m').textContent = pad(m);
    document.getElementById('cd-s').textContent = pad(s);
  }
  tick(); setInterval(tick, 1000);
})();

/* ===== 内页：滚动进度 + 卷宗高亮 + 入场 + 糖粒 ===== */
(function () {
  const prog = document.getElementById('prog');
  const archive = document.getElementById('archive');
  if (!archive) return;
  let sugarDone = false;
  const secs = [...document.querySelectorAll('#archive main section')];
  addEventListener('scroll', () => {
    if (archive.hidden || !prog) return;
    const h = document.documentElement;
    prog.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
  }, { passive: true });

  const io = new IntersectionObserver(es => {
    es.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('vis');
      en.target.querySelectorAll('[data-fx]').forEach((el, i2) => {
        setTimeout(() => el.classList.add('vis'), i2 * 90);
      });
      if (!sugarDone) { sugarDone = true; spawnSugar(); }
    });
  }, { threshold: .16 });
  document.querySelectorAll('#archive section').forEach(s => io.observe(s));
  document.querySelectorAll('#archive section [data-fx]').forEach(el => {
    if (!el.closest('[data-fx]')) io.observe(el);
  });
})();
