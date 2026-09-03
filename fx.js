/* AEX-FX v1 — ambient particles + pulse rings. Zero dependencies, self-styled.
   Usage: <script src="fx.js"></script> (optionally set window.AEX_FX first).
   NOTE: mirrored at dashboard/fx.js (StaticFiles can't serve parent paths,
   so both copies must stay in sync — keep them byte-identical). */
(function () {
  var cfg = Object.assign({ n: 70, speed: 1, pulses: true, maxR: 2.2 },
    window.AEX_FX || {});
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  } catch (e) { /* keep motion */ }
  var st = document.createElement('style');
  st.textContent = 'canvas#aex-fx{position:fixed;inset:0;z-index:0;pointer-events:none}'
    + 'body>*:not(canvas#aex-fx){position:relative;z-index:1}';
  document.head.appendChild(st);
  var cv = document.createElement('canvas');
  cv.id = 'aex-fx';
  document.body.prepend(cv);
  var ctx = cv.getContext('2d');
  var W = 0, H = 0;
  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener('resize', size);
  var hues = [268, 285, 300, 320];
  function spawn(anywhere) {
    return {
      x: Math.random() * W, y: anywhere ? Math.random() * H : H + 6,
      r: 0.6 + Math.random() * cfg.maxR,
      vy: -((0.08 + Math.random() * 0.3) * cfg.speed * 3),
      vx: (Math.random() - 0.5) * 0.15,
      a: 0.15 + Math.random() * 0.5,
      h: hues[(Math.random() * hues.length) | 0],
      tw: Math.random() * 6.28
    };
  }
  var P = [];
  for (var i = 0; i < cfg.n; i++) P.push(spawn(true));
  var rings = [];
  var running = true;
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) requestAnimationFrame(tick);
  });
  setInterval(function () {
    if (!running || !cfg.pulses || !P.length) return;
    var p = P[(Math.random() * P.length) | 0];
    rings.push({ x: p.x, y: p.y, r: 2, a: 0.35, h: p.h });
    if (rings.length > 8) rings.shift();
  }, 2600);
  function tick() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    var j, p, g;
    for (j = 0; j < P.length; j++) {
      p = P[j];
      p.y += p.vy; p.x += p.vx; p.tw += 0.03;
      if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
      if (p.x < -6) p.x = W + 6; if (p.x > W + 6) p.x = -6;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fillStyle = 'hsla(' + p.h + ',90%,70%,' +
        (p.a * (0.6 + 0.4 * Math.sin(p.tw))).toFixed(3) + ')';
      ctx.fill();
    }
    for (j = rings.length - 1; j >= 0; j--) {
      g = rings[j]; g.r += 1.1; g.a -= 0.006;
      if (g.a <= 0) { rings.splice(j, 1); continue; }
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, 6.283);
      ctx.strokeStyle = 'hsla(' + g.h + ',90%,72%,' + g.a.toFixed(3) + ')';
      ctx.lineWidth = 1.2; ctx.stroke();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
