import { useRef, useEffect, useMemo } from 'react';

/* Animated wave graph with particles emanating from the wave line.
   Uses canvas for performance (20fps for particles, SVG for the wave). */
export default function WaveGraph({ data, color = '#a855f7', secondaryColor = '#d946ef', height = 70 }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const frameRef = useRef(null);
  const timeRef = useRef(0);

  // Generate wave path points from data
  const wavePoints = useMemo(() => {
    if (!data || data.length < 2) return [];
    const mx = Math.max(...data, 1);
    return data.map((v, i) => ({
      x: i / (data.length - 1),
      y: 1 - (v / mx) * 0.75 - 0.1,
    }));
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || wavePoints.length === 0) return;
    const ctx = canvas.getContext('2d');
    let w, h;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = rect.width;
      h = height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Parse color to rgb
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };
    const c1 = hexToRgb(color);
    const c2 = hexToRgb(secondaryColor);

    const draw = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      ctx.clearRect(0, 0, w, h);

      // === WAVE ===
      // Draw animated wave with time-based ripple
      ctx.beginPath();
      for (let i = 0; i < wavePoints.length; i++) {
        const pt = wavePoints[i];
        const px = pt.x * w;
        // Add subtle sine ripple that moves along the wave
        const ripple = Math.sin(pt.x * 8 + t * 2) * 2 + Math.sin(pt.x * 12 - t * 1.5) * 1;
        const py = pt.y * h + ripple;

        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          // Smooth curve through points
          const prev = wavePoints[i - 1];
          const prevPx = prev.x * w;
          const prevRipple = Math.sin(prev.x * 8 + t * 2) * 2 + Math.sin(prev.x * 12 - t * 1.5) * 1;
          const prevPy = prev.y * h + prevRipple;
          const cpx = (prevPx + px) / 2;
          ctx.bezierCurveTo(cpx, prevPy, cpx, py, px, py);
        }
      }
      // Glow
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.restore();

      // Main line
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 1;
      ctx.stroke();

      // === FILL under wave ===
      const lastPt = wavePoints[wavePoints.length - 1];
      ctx.lineTo(lastPt.x * w, h);
      ctx.lineTo(wavePoints[0].x * w, h);
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
      fillGrad.addColorStop(0, `rgba(${c1.r},${c1.g},${c1.b},0.12)`);
      fillGrad.addColorStop(1, `rgba(${c1.r},${c1.g},${c1.b},0)`);
      ctx.fillStyle = fillGrad;
      ctx.globalAlpha = 1;
      ctx.fill();

      // === PARTICLES ===
      // Spawn new particles along the wave periodically
      if (Math.random() < 0.35) {
        const idx = Math.floor(Math.random() * wavePoints.length);
        const pt = wavePoints[idx];
        const ripple = Math.sin(pt.x * 8 + t * 2) * 2 + Math.sin(pt.x * 12 - t * 1.5) * 1;
        const useSecondary = Math.random() > 0.6;
        const rgb = useSecondary ? c2 : c1;
        particlesRef.current.push({
          x: pt.x * w,
          y: pt.y * h + ripple,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -(Math.random() * 1.5 + 0.5),
          life: 1,
          decay: Math.random() * 0.015 + 0.008,
          size: Math.random() * 2.5 + 0.5,
          r: rgb.r, g: rgb.g, b: rgb.b,
        });
      }

      // Update and draw particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.02; // slight upward drift
        p.vx *= 0.99;
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = p.life * 0.8;
        const size = p.size * p.life;

        // Glow
        ctx.beginPath();
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
        glow.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${alpha * 0.3})`);
        glow.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
        ctx.fillStyle = glow;
        ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cap particle count
      if (particles.length > 120) {
        particles.splice(0, particles.length - 120);
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [wavePoints, color, secondaryColor, height]);

  if (!data || data.length < 2) return null;

  return (
    <div style={{ position: 'relative', height, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
