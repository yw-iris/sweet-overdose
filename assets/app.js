/* ===== 背景：糖粒与气泡上浮 ===== */
(function () {
  const cv = document.getElementById('bg'), ctx = cv.getContext('2d');
  let W, H, DPR, parts = [];
  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * DPR; H = cv.height = innerHeight * DPR;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    parts = [...Array(74)].map(() => ({
      x: Math.random() * W, y: Math.random() * H,
      r: (Math.random() * 2 + .7) * DPR,
      vy: -(Math.random() * .3 + .08) * DPR,
      vx: (Math.random() - .5) * .18 * DPR,
      c: Math.random() < .34 ? '255,199,107' : (Math.random() < .55 ? '168,236,210' : '255,179,167'),
      a: Math.random() * .45 + .18, tw: Math.random() * Math.PI * 2
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
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) { cur.remove(); return; }
  addEventListener('mousemove', e => { cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px'; });
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('a,button,.svc,.card,.letter,.cup,.chip');
    cur.classList.toggle('big', !!t);
  });
})();

/* ===== 开屏小字：逐字落墨 ===== */
(function () {
  const sub = document.querySelector('#boot .sub');
  if (!sub) return;
  const txt = sub.textContent.trim();
  sub.textContent = '';
  [...txt].forEach((c, i) => {
    const ch = (c === ' ') ? '\u00a0' : c, s = document.createElement('span');
    s.textContent = ch; s.dataset.c = ch;
    s.style.setProperty('--d', (2.4 + i * 0.085).toFixed(2) + 's');
    sub.appendChild(s);
  });
})();

/* ===== boot 终端 ===== */
(function () {
  const term = document.getElementById('term'), enter = document.getElementById('enter');
  const lines = [
    '<span class="p">&gt; 拂去尘埃 · 展开画卷 ...</span>',
    '&gt; 点亮 <span class="ok">檐下灯</span> / 洒落 <span class="ok">花瓣雨</span> / 研墨 <span class="ok">旧时字</span>',
    '&gt; 座隅候客：<span class="p">阿枯</span> · 白羊 · ENFP · 20 ... <span class="ok">已入座</span>',
    '&gt; 「总以为一打喷嚏，就是有人想我」',
    '&gt; 推门即可，<span class="ok">请慢些走</span>'
  ];
  let i = 0, j = 0;
  function step() {
    if (i >= lines.length) { enter.classList.add('show'); return; }
    const ln = lines[i];
    j += 3;
    term.innerHTML = lines.slice(0, i).join('<br>') + (i ? '<br>' : '') + ln.slice(0, Math.min(ln.length, j)) + '<span class="blink">▌</span>';
    if (j >= ln.length + 3) { i++; j = 0; setTimeout(step, 190); }
    else setTimeout(step, 28);
  }
  step();
  enter.addEventListener('click', () => {
    document.getElementById('boot').classList.add('gone');
    document.body.classList.remove('locked');
    spawnSugar();
    const t = document.getElementById('toast');
    t.textContent = '檐下灯已亮 · 欢迎入座'; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
  });
})();

/* ===== 糖粒 / 薄荷叶 飘落 ===== */
function spawnSugar() {
  const box = document.getElementById('petals');
  if (box.childElementCount) return;
  const sugar = ['linear-gradient(135deg,#eafaf3,#ffffff)', 'linear-gradient(135deg,#fff3d6,#fffaf0)', 'linear-gradient(135deg,#ffdfe4,#fff6f4)'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('i'); p.className = 'petal';
    const s = 7 + Math.random() * 9;
    p.style.cssText = `left:${Math.random() * 100}vw;width:${s}px;height:${s}px;
      background:${sugar[i % 3]};--sway:${(Math.random() * 90 + 30) * (Math.random() < .5 ? -1 : 1)}px;
      animation-duration:${9 + Math.random() * 8}s;animation-delay:${-Math.random() * 14}s;
      opacity:${.45 + Math.random() * .4};border-radius:50%`;
    box.appendChild(p);
  }
}

/* ===== 环境音：窗台午后（WebAudio 合成，无需音频文件） ===== */
(function () {
  const btn = document.getElementById('music');
  let actx = null, master = null, nodes = [], timer = null, playing = false;
  const SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

  function build() {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.gain.value = 0; master.connect(actx.destination);
    const filt = actx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 1500; filt.Q.value = .6;
    filt.connect(master);
    // 低频 pad
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
    btn.title = '环境音 · 窗台午后（点击关闭）';
  }
  function stop() {
    playing = false; clearTimeout(timer);
    if (master) {
      master.gain.cancelScheduledValues(actx.currentTime);
      master.gain.setValueAtTime(master.gain.value, actx.currentTime);
      master.gain.linearRampToValueAtTime(0, actx.currentTime + .6);
    }
    btn.classList.add('off'); btn.classList.remove('on');
    btn.title = '环境音 · 窗台午后（点击开启）';
  }

  document.getElementById('enter').addEventListener('click', () => {
    btn.classList.add('show');
    try { start(); } catch (e) { btn.classList.add('show', 'off'); }
  });
  btn.addEventListener('click', () => { playing ? stop() : start(); });
})();

/* ===== 滚动进度 + 卷宗高亮 + 入场 ===== */
(function () {
  const prog = document.getElementById('prog'), hudSec = document.getElementById('hud-sec');
  const secs = [...document.querySelectorAll('main section')];
  const navA = [...document.querySelectorAll('#sectors a')];
  const ids = ['卷首', '卷一', '卷二', '卷三', '卷四', '卷五', '卷终'];
  addEventListener('scroll', () => {
    const h = document.documentElement;
    prog.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
    let cur = 0;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * .45) cur = i; });
    hudSec.textContent = ids[cur] || '卷首';
    navA.forEach(a => a.classList.toggle('on', +a.dataset.s === cur));
  }, { passive: true });

  const io = new IntersectionObserver(es => {
    es.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('vis');
      en.target.querySelectorAll('[data-fx]').forEach((el, i2) => {
        setTimeout(() => el.classList.add('vis'), i2 * 90);
      });
    });
  }, { threshold: .16 });
  document.querySelectorAll('section').forEach(s => io.observe(s));
  document.querySelectorAll('section [data-fx]').forEach(el => {
    if (!el.closest('[data-fx]')) io.observe(el);
  });
  navA.forEach(a => a.addEventListener('click', e => e.stopPropagation()));
})();
