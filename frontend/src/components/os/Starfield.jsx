import { useRef, useEffect, useCallback } from 'react';

/* Cosmic starfield: 3D stars + dust + slow auto-drift + mouse parallax.
   Pauses rAF when not visible (IntersectionObserver).
   Optimized: 180 stars, 30 dust particles. */
export default function Starfield({ className }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothMouse = useRef({ x: 0, y: 0 });
  const starsRef = useRef([]);
  const dustRef = useRef([]);
  const frameRef = useRef(null);
  const visibleRef = useRef(false);

  const init = useCallback((w, h) => {
    const stars = [];
    for (let i = 0; i < 180; i++) {
        stars.push({
          x: (Math.random() - 0.5) * 2.4,
          y: (Math.random() - 0.5) * 2.4,
          z: Math.random(),
          size: Math.random() * 2.2 + 0.4,
          brightness: Math.random() * 0.7 + 0.3,
          twinkleSpeed: Math.random() * 0.04 + 0.012,
          twinkleOffset: Math.random() * Math.PI * 2,
          hue: Math.random() > 0.82 ? (Math.random() > 0.5 ? 280 : 190) : 0,
          vx: (Math.random() - 0.5) * 0.00025,
          vy: (Math.random() - 0.5) * 0.00018,
        });
    }
    starsRef.current = stars;

    const dust = [];
    for (let i = 0; i < 30; i++) {
      dust.push({
        x: (Math.random() - 0.5) * 2.4,
        y: (Math.random() - 0.5) * 2.4,
        z: Math.random() * 0.5 + 0.3,
        size: Math.random() * 5 + 2,
        opacity: Math.random() * 0.16 + 0.03,
        hue: Math.random() > 0.5 ? 280 : 190,
        vx: (Math.random() - 0.5) * 0.0003,
        vy: (Math.random() - 0.5) * 0.0002,
      });
    }
    dustRef.current = dust;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init(w, h);
    };

    const onMouse = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    let time = 0;
    const draw = () => {
      if (!visibleRef.current) {
        frameRef.current = requestAnimationFrame(draw);
        return; // skip rendering when offscreen
      }
      time += 1;
      ctx.clearRect(0, 0, w, h);

      smoothMouse.current.x += (mouseRef.current.x - smoothMouse.current.x) * 0.06;
      smoothMouse.current.y += (mouseRef.current.y - smoothMouse.current.y) * 0.06;

      const mx = smoothMouse.current.x;
      const my = smoothMouse.current.y;
      const cx = w / 2;
      const cy = h / 2;

      // === DUST ===
      for (const d of dustRef.current) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x > 1.4) d.x = -1.4;
        if (d.x < -1.4) d.x = 1.4;
        if (d.y > 1.4) d.y = -1.4;
        if (d.y < -1.4) d.y = 1.4;

        const parallax = 1 - d.z * 0.4;
        const dx = cx + (d.x + mx * parallax * 0.18) * cx;
        const dy = cy + (d.y + my * parallax * 0.18) * cy;
        const r = d.size * (1 + d.z * 0.5);

        const grad = ctx.createRadialGradient(dx, dy, 0, dx, dy, r);
        grad.addColorStop(0, `hsla(${d.hue}, 60%, 65%, ${d.opacity})`);
        grad.addColorStop(1, `hsla(${d.hue}, 60%, 65%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // === STARS ===
      for (const s of starsRef.current) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x > 1.4) s.x = -1.4;
        if (s.x < -1.4) s.x = 1.4;
        if (s.y > 1.4) s.y = -1.4;
        if (s.y < -1.4) s.y = 1.4;

        const depth = 0.25 + s.z * 0.75;
        const parallax = depth;
        const sx = cx + (s.x + mx * parallax * 0.35) * cx * depth;
        const sy = cy + (s.y + my * parallax * 0.35) * cy * depth;

        const twinkle = 0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset);
        const alpha = s.brightness * (0.4 + twinkle * 0.6) * depth;
        const size = s.size * (0.4 + depth * 0.6);

        if (s.hue > 0) {
          ctx.fillStyle = `hsla(${s.hue}, 80%, 75%, ${alpha})`;
        } else {
          const g = Math.round(190 + alpha * 65);
          ctx.fillStyle = `rgba(${g},${g},${g + 12},${alpha})`;
        }
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();

        if (alpha > 0.45 && size > 0.8) {
          const glowR = size * (2.5 + depth);
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
          const gc = s.hue > 0
            ? `hsla(${s.hue}, 80%, 75%, ${alpha * 0.12})`
            : `rgba(180,200,255,${alpha * 0.10})`;
          glow.addColorStop(0, gc);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    // IntersectionObserver — pause rendering when offscreen
    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(canvas);

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouse);
    frameRef.current = requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
