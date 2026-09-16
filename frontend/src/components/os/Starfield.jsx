import { useRef, useEffect, useCallback } from 'react';

/* Cosmic starfield: 3D stars + dust particles reacting to mouse.
   Renders on a <canvas> that fills the OS section. */
export default function Starfield({ className }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const starsRef = useRef([]);
  const dustRef = useRef([]);
  const frameRef = useRef(null);

  const init = useCallback((w, h) => {
    // Stars: depth 0-1, x/y normalized -1..1
    const stars = [];
    for (let i = 0; i < 220; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: Math.random(),
        size: Math.random() * 1.8 + 0.3,
        brightness: Math.random() * 0.6 + 0.4,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.85 ? (Math.random() > 0.5 ? 280 : 190) : 0, // some purple/cyan stars
      });
    }
    starsRef.current = stars;

    // Dust particles: larger, slower, more transparent
    const dust = [];
    for (let i = 0; i < 40; i++) {
      dust.push({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: Math.random() * 0.5 + 0.3,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.0003 + 0.0001,
        opacity: Math.random() * 0.15 + 0.03,
        hue: Math.random() > 0.5 ? 280 : 190,
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
      w = canvas.parentElement?.offsetWidth || window.innerWidth;
      h = canvas.parentElement?.offsetHeight || window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init(w, h);
    };

    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseRef.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    let time = 0;
    const draw = () => {
      time += 1;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const cx = w / 2;
      const cy = h / 2;

      // Draw dust first (behind stars)
      for (const d of dustRef.current) {
        const parallax = 1 - d.z * 0.5;
        const dx = cx + (d.x + mx * parallax * 0.08) * cx;
        const dy = cy + (d.y + my * parallax * 0.08) * cy;
        // Slow drift
        d.x += d.speed * Math.sin(time * 0.003 + d.y * 5);
        d.y += d.speed * Math.cos(time * 0.002 + d.x * 5);
        if (d.x > 1.2) d.x = -1.2;
        if (d.x < -1.2) d.x = 1.2;
        if (d.y > 1.2) d.y = -1.2;
        if (d.y < -1.2) d.y = 1.2;

        const grad = ctx.createRadialGradient(dx, dy, 0, dx, dy, d.size * (1 + d.z));
        grad.addColorStop(0, `hsla(${d.hue}, 70%, 70%, ${d.opacity})`);
        grad.addColorStop(1, `hsla(${d.hue}, 70%, 70%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(dx, dy, d.size * (1 + d.z), 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw stars
      for (const s of starsRef.current) {
        const depth = 0.3 + s.z * 0.7; // 0.3-1.0
        const parallax = depth;
        const sx = cx + (s.x + mx * parallax * 0.15) * cx * depth;
        const sy = cy + (s.y + my * parallax * 0.15) * cy * depth;

        // Twinkle
        const twinkle = 0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset);
        const alpha = s.brightness * twinkle * depth;
        const size = s.size * (0.5 + depth * 0.5);

        if (s.hue > 0) {
          // Colored star
          ctx.fillStyle = `hsla(${s.hue}, 80%, 75%, ${alpha})`;
        } else {
          // White star
          const g = Math.round(200 + alpha * 55);
          ctx.fillStyle = `rgba(${g},${g},${g + 10},${alpha})`;
        }
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();

        // Glow for bright stars
        if (alpha > 0.5 && size > 1) {
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 3);
          const gc = s.hue > 0 ? `hsla(${s.hue}, 80%, 75%, ${alpha * 0.15})` : `rgba(200,210,255,${alpha * 0.12})`;
          glow.addColorStop(0, gc);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(sx, sy, size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', onMouse);

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouse);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'auto', zIndex: 0 }}
    />
  );
}
