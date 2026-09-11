import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const GlobeScene = React.lazy(() => import('./GlobeScene'))

class GlobeBoundary extends React.Component {
  constructor(props) { super(props); this.state = { crashed: false } }
  static getDerivedStateFromError() { return { crashed: true } }
  componentDidCatch(err) { if (typeof console !== 'undefined') console.error('[AETHERIUS] globe crashed:', err) }
  render() {
    if (this.state.crashed) return <div style={{ position: 'absolute', inset: '10%', background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(217,70,239,0.15) 45%, transparent 70%)', borderRadius: '50%' }} />
    return this.props.children
  }
}

// === SUPERNOVA — single fluid explosion ===
function SupernovaLoader({ onComplete }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const overlayRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    ctx.scale(dpr, dpr)
    const w = window.innerWidth, h = window.innerHeight
    const cx = w / 2, cy = h / 2

    let running = true
    const startTime = performance.now()
    const TOTAL_DURATION = 1500 // ms

    const draw = (now) => {
      if (!running) return
      const elapsed = now - startTime
      const t = Math.min(elapsed / TOTAL_DURATION, 1) // 0→1 normalized

      ctx.clearRect(0, 0, w, h)

      // --- Phase 1: Implosion (t 0→0.35) — particles contract to center ---
      if (t < 0.35) {
        const p = t / 0.35 // 0→1 within this phase
        const eased = 1 - (1 - p) * (1 - p) // ease-out quad
        const particleCount = 80
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2 + eased * 0.8
          const startDist = 180 + (i % 5) * 40
          const dist = startDist * (1 - eased)
          const x = cx + Math.cos(angle) * dist
          const y = cy + Math.sin(angle) * dist
          const alpha = eased * 0.8
          const size = 1 + eased * 1.5
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0,82,255,${alpha})`
          ctx.fill()
        }
        // Central glow building
        const glowR = 15 + eased * 40
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
        glow.addColorStop(0, `rgba(0,82,255,${eased * 0.6})`)
        glow.addColorStop(0.5, `rgba(168,85,247,${eased * 0.3})`)
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, w, h)
      }

      // --- Phase 2: 4-point sparkle flash + expansion (✦) ---
      if (t >= 0.3 && t < 0.85) {
        const p = (t - 0.3) / 0.55 // 0→1

        // Flash intensity — peaks at p=0.1, fades by p=0.4
        const flashIntensity = p < 0.1
          ? p / 0.1 // rise
          : Math.max(0, 1 - (p - 0.1) / 0.3) // decay

        // Central glow behind the sparkle
        const glowR = 80 + p * 300
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
        glow.addColorStop(0, `rgba(255,255,255,${flashIntensity * 0.7})`)
        glow.addColorStop(0.12, `rgba(0,82,255,${flashIntensity * 0.45})`)
        glow.addColorStop(0.35, `rgba(168,85,247,${flashIntensity * 0.15})`)
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, w, h)

        // 4-point sparkle — long thin points, concave waist (like ✦)
        const R = (60 + p * 340) * (Math.max(w, h) / 800)
        const waist = R * 0.10
        const starAlpha = flashIntensity

        ctx.save()
        ctx.translate(cx, cy)

        // Filled sparkle body (white core → blue edge)
        const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, R)
        bodyGrad.addColorStop(0, `rgba(255,255,255,${0.95 * starAlpha})`)
        bodyGrad.addColorStop(0.25, `rgba(0,82,255,${0.75 * starAlpha})`)
        bodyGrad.addColorStop(0.6, `rgba(168,85,247,${0.35 * starAlpha})`)
        bodyGrad.addColorStop(1, 'rgba(168,85,247,0)')
        ctx.fillStyle = bodyGrad
        ctx.beginPath()
        ctx.moveTo(0, -R)
        ctx.quadraticCurveTo(waist, -waist, R, 0)
        ctx.quadraticCurveTo(waist, waist, 0, R)
        ctx.quadraticCurveTo(-waist, waist, -R, 0)
        ctx.quadraticCurveTo(-waist, -waist, 0, -R)
        ctx.closePath()
        ctx.fill()

        // Crisp edge stroke
        ctx.strokeStyle = `rgba(255,255,255,${0.5 * starAlpha})`
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Long lens-flare spikes (vertical + horizontal)
        const spikeLen = R * 1.5
        const spikeW = 2 + (1 - p) * 2
        let lg = ctx.createLinearGradient(0, -spikeLen, 0, spikeLen)
        lg.addColorStop(0, 'rgba(0,82,255,0)')
        lg.addColorStop(0.5, `rgba(255,255,255,${0.55 * starAlpha})`)
        lg.addColorStop(1, 'rgba(0,82,255,0)')
        ctx.strokeStyle = lg
        ctx.lineWidth = spikeW
        ctx.beginPath()
        ctx.moveTo(0, -spikeLen)
        ctx.lineTo(0, spikeLen)
        ctx.stroke()
        lg = ctx.createLinearGradient(-spikeLen, 0, spikeLen, 0)
        lg.addColorStop(0, 'rgba(168,85,247,0)')
        lg.addColorStop(0.5, `rgba(255,255,255,${0.4 * starAlpha})`)
        lg.addColorStop(1, 'rgba(168,85,247,0)')
        ctx.strokeStyle = lg
        ctx.lineWidth = spikeW * 0.8
        ctx.beginPath()
        ctx.moveTo(-spikeLen, 0)
        ctx.lineTo(spikeLen, 0)
        ctx.stroke()

        ctx.restore()

        // One faint expanding ring (continuity into the globe reveal)
        const ringRadius = p * Math.max(w, h) * 0.55
        const ringAlpha = Math.max(0, 0.35 * (1 - p * p)) * flashIntensity
        ctx.beginPath()
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0,82,255,${ringAlpha})`
        ctx.lineWidth = 2 + (1 - p) * 5
        ctx.stroke()

        // Scattered particles from center
        const scattered = 40
        for (let i = 0; i < scattered; i++) {
          const angle = (i / scattered) * Math.PI * 2 + p * 0.3
          const dist = p * (150 + (i % 7) * 80)
          const x = cx + Math.cos(angle) * dist
          const y = cy + Math.sin(angle) * dist
          const alpha = Math.max(0, (1 - p) * 0.5)
          const size = 0.8 + (1 - p) * 1.2
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fillStyle = i % 3 === 0
            ? `rgba(0,82,255,${alpha})`
            : i % 3 === 1
            ? `rgba(168,85,247,${alpha * 0.7})`
            : `rgba(217,70,239,${alpha * 0.5})`
          ctx.fill()
        }
      }

      // --- Phase 3: Fade out (t 0.7→1.0) ---
      if (t >= 0.7) {
        const p = (t - 0.7) / 0.3
        const fadeAlpha = p * p // accelerating fade
        ctx.fillStyle = `rgba(1,0,5,${fadeAlpha})`
        ctx.fillRect(0, 0, w, h)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)

    // Complete after animation
    const timer = setTimeout(() => {
      running = false
      cancelAnimationFrame(animRef.current)
      onCompleteRef.current?.()
    }, TOTAL_DURATION + 100)

    return () => { running = false; cancelAnimationFrame(animRef.current); clearTimeout(timer) }
  }, [])

  return (
    <div ref={overlayRef} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#010005',
    }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

// === COSMIC VOID ===
function CosmicVoid() {
  return (
    <div className="cosmos-void" aria-hidden="true">
      <div className="void-stars void-stars--far" />
      <div className="void-stars void-stars--mid" />
      <div className="void-stars void-stars--near" />
      <div className="void-aurora void-aurora--1" />
      <div className="void-aurora void-aurora--2" />
      <div className="void-aurora void-aurora--3" />
      <div className="void-rays">
        <div className="void-ray void-ray--1" />
        <div className="void-ray void-ray--2" />
        <div className="void-ray void-ray--3" />
        <div className="void-ray void-ray--4" />
      </div>
      <div className="void-nebula void-nebula--1" />
      <div className="void-nebula void-nebula--2" />
      <div className="void-nebula void-nebula--3" />
      <div className="void-vignette" />
      <div className="void-dust" />

      <style>{`
        .cosmos-void {
          position: fixed; inset: 0; z-index: -2;
          pointer-events: none; overflow: hidden;
          background: radial-gradient(ellipse at 50% 55%,
            rgba(8,4,22,1) 0%, rgba(4,2,14,1) 30%,
            rgba(2,1,8,1) 60%, rgba(1,0,5,1) 100%);
        }
        .void-stars { position: absolute; inset: 0; background-repeat: repeat; }
        .void-stars--far {
          background-image:
            radial-gradient(0.8px 0.8px at 12% 18%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(0.8px 0.8px at 34% 62%, rgba(255,255,255,0.25) 0%, transparent 100%),
            radial-gradient(0.8px 0.8px at 56% 14%, rgba(255,255,255,0.28) 0%, transparent 100%),
            radial-gradient(0.8px 0.8px at 78% 48%, rgba(255,255,255,0.2) 0%, transparent 100%),
            radial-gradient(0.8px 0.8px at 91% 82%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(0.8px 0.8px at 24% 91%, rgba(255,255,255,0.22) 0%, transparent 100%),
            radial-gradient(0.8px 0.8px at 67% 34%, rgba(255,255,255,0.28) 0%, transparent 100%),
            radial-gradient(0.8px 0.8px at 43% 76%, rgba(255,255,255,0.2) 0%, transparent 100%);
          background-size: 280px 280px;
          animation: voidDrift 120s linear infinite;
        }
        .void-stars--mid {
          background-image:
            radial-gradient(1.2px 1.2px at 18% 32%, rgba(168,85,247,0.5) 0%, transparent 100%),
            radial-gradient(1.2px 1.2px at 52% 71%, rgba(34,211,238,0.35) 0%, transparent 100%),
            radial-gradient(1.2px 1.2px at 74% 22%, rgba(217,70,239,0.4) 0%, transparent 100%),
            radial-gradient(1.2px 1.2px at 38% 58%, rgba(168,85,247,0.35) 0%, transparent 100%),
            radial-gradient(1.2px 1.2px at 86% 64%, rgba(236,72,153,0.3) 0%, transparent 100%);
          background-size: 400px 400px;
          animation: voidDrift 200s linear infinite reverse;
        }
        .void-stars--near {
          background-image:
            radial-gradient(2px 2px at 28% 42%, rgba(34,211,238,0.5) 0%, transparent 100%),
            radial-gradient(2.5px 2.5px at 68% 28%, rgba(168,85,247,0.55) 0%, transparent 100%),
            radial-gradient(2px 2px at 48% 78%, rgba(217,70,239,0.4) 0%, transparent 100%),
            radial-gradient(1.8px 1.8px at 14% 62%, rgba(236,72,153,0.35) 0%, transparent 100%);
          background-size: 600px 600px;
          animation: voidTwinkle 8s ease-in-out infinite alternate, voidDrift 300s linear infinite;
        }
        @keyframes voidDrift { from { transform: translateY(0); } to { transform: translateY(-200px); } }
        @keyframes voidTwinkle { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

        .void-aurora {
          position: absolute; width: 130%; height: 40%; left: -15%;
          filter: blur(90px); mix-blend-mode: screen; opacity: 0;
          animation: auroraBreath 20s ease-in-out infinite;
        }
        .void-aurora--1 {
          top: 8%;
          background: linear-gradient(135deg, transparent 0%,
            rgba(168,85,247,0.12) 20%, rgba(217,70,239,0.15) 45%,
            rgba(34,211,238,0.08) 65%, transparent 100%);
          animation-delay: 0s; animation-duration: 24s;
        }
        .void-aurora--2 {
          top: 18%;
          background: linear-gradient(225deg, transparent 0%,
            rgba(34,211,238,0.08) 25%, rgba(168,85,247,0.12) 50%,
            rgba(236,72,153,0.06) 75%, transparent 100%);
          animation-delay: -8s; animation-duration: 28s;
        }
        .void-aurora--3 {
          top: 2%; height: 30%;
          background: linear-gradient(180deg,
            rgba(217,70,239,0.06) 0%, rgba(168,85,247,0.04) 35%, transparent 65%);
          animation-delay: -16s; animation-duration: 34s;
        }
        @keyframes auroraBreath {
          0%, 100% { opacity: 0.3; transform: translateX(-4%) scaleY(1); }
          25% { opacity: 0.65; transform: translateX(3%) scaleY(1.12); }
          50% { opacity: 0.45; transform: translateX(-2%) scaleY(0.88); }
          75% { opacity: 0.75; transform: translateX(5%) scaleY(1.08); }
        }

        .void-rays {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 100%; height: 100%; pointer-events: none;
        }
        .void-ray {
          position: absolute; top: 50%; left: 50%;
          width: 1.5px; height: 55vh;
          transform-origin: top center;
          filter: blur(25px); opacity: 0;
          animation: rayPulse 14s ease-in-out infinite;
        }
        .void-ray--1 {
          background: linear-gradient(180deg, rgba(168,85,247,0.2) 0%, transparent 100%);
          transform: translate(-50%, 0) rotate(-22deg); animation-delay: 0s;
        }
        .void-ray--2 {
          background: linear-gradient(180deg, rgba(34,211,238,0.15) 0%, transparent 100%);
          transform: translate(-50%, 0) rotate(12deg); animation-delay: -3s;
        }
        .void-ray--3 {
          background: linear-gradient(180deg, rgba(217,70,239,0.14) 0%, transparent 100%);
          transform: translate(-50%, 0) rotate(-6deg); animation-delay: -7s;
        }
        .void-ray--4 {
          background: linear-gradient(180deg, rgba(236,72,153,0.12) 0%, transparent 100%);
          transform: translate(-50%, 0) rotate(28deg); animation-delay: -10s;
        }
        @keyframes rayPulse {
          0%, 100% { opacity: 0; }
          25% { opacity: 0.5; }
          50% { opacity: 0.2; }
          75% { opacity: 0.6; }
        }

        .void-nebula {
          position: absolute; border-radius: 50%;
          filter: blur(120px); mix-blend-mode: screen;
          opacity: 0; animation: nebulaPulse 22s ease-in-out infinite;
        }
        .void-nebula--1 {
          width: 900px; height: 550px; top: -12%; left: -8%;
          background: radial-gradient(ellipse, rgba(168,85,247,0.12) 0%, rgba(217,70,239,0.08) 40%, transparent 70%);
          animation-delay: 0s; animation-duration: 26s;
        }
        .void-nebula--2 {
          width: 700px; height: 480px; top: 20%; right: -8%;
          background: radial-gradient(ellipse, rgba(34,211,238,0.08) 0%, rgba(168,85,247,0.06) 45%, transparent 70%);
          animation-delay: -9s; animation-duration: 22s;
        }
        .void-nebula--3 {
          width: 600px; height: 400px; bottom: 8%; left: 15%;
          background: radial-gradient(ellipse, rgba(236,72,153,0.08) 0%, rgba(217,70,239,0.04) 50%, transparent 70%);
          animation-delay: -15s; animation-duration: 30s;
        }
        @keyframes nebulaPulse {
          0%, 100% { opacity: 0.3; transform: scale(1) translate(0, 0); }
          33% { opacity: 0.6; transform: scale(1.05) translate(10px, -6px); }
          66% { opacity: 0.4; transform: scale(0.97) translate(-6px, 5px); }
        }

        .void-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 50%,
            transparent 25%, rgba(1,0,5,0.3) 55%,
            rgba(1,0,5,0.7) 80%, rgba(1,0,5,0.92) 100%);
        }
        .void-dust {
          position: absolute; inset: 0; opacity: 0.04;
          mix-blend-mode: soft-light;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  )
}

// === COSMIC AMBIENT SOUND ===
function CosmicSound() {
  const audioCtxRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const nodesRef = useRef({})

  const toggleSound = useCallback(() => {
    if (playing) {
      const { gain } = nodesRef.current
      if (gain) {
        gain.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.5)
        setTimeout(() => { try { audioCtxRef.current?.suspend() } catch {} }, 500)
      }
      setPlaying(false)
      return
    }

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      ctx.resume()

      const gain = ctx.createGain()
      gain.gain.value = 0
      gain.connect(ctx.destination)

      const osc1 = ctx.createOscillator()
      osc1.type = 'sine'; osc1.frequency.value = 55
      const g1 = ctx.createGain(); g1.gain.value = 0.12
      osc1.connect(g1); g1.connect(gain); osc1.start()

      const osc2 = ctx.createOscillator()
      osc2.type = 'sine'; osc2.frequency.value = 82.5
      const g2 = ctx.createGain(); g2.gain.value = 0.06
      osc2.connect(g2); g2.connect(gain); osc2.start()

      const osc3 = ctx.createOscillator()
      osc3.type = 'triangle'; osc3.frequency.value = 165
      const g3 = ctx.createGain(); g3.gain.value = 0.02
      const lfo = ctx.createOscillator()
      lfo.type = 'sine'; lfo.frequency.value = 0.1
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.015
      lfo.connect(lfoGain); lfoGain.connect(g3.gain); lfo.start()
      osc3.connect(g3); g3.connect(gain); osc3.start()

      const bufferSize = ctx.sampleRate * 2
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.015
      const noise = ctx.createBufferSource()
      noise.buffer = noiseBuffer; noise.loop = true
      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = 'lowpass'; noiseFilter.frequency.value = 200
      noise.connect(noiseFilter); noiseFilter.connect(gain); noise.start()

      nodesRef.current = { gain, osc1, osc2, osc3, lfo, noise }
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1)
      setPlaying(true)
    } catch (e) {
      console.warn('[AETHERIUS] audio init failed:', e)
    }
  }, [playing])

  return (
    <button
      onClick={toggleSound}
      aria-label={playing ? 'Mute ambient sound' : 'Play ambient sound'}
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 800,
        width: 44, height: 44, borderRadius: '50%',
        background: 'rgba(10,10,20,0.6)',
        border: '1px solid rgba(168,85,247,0.15)',
        backdropFilter: 'blur(12px)',
        color: playing ? 'var(--purple-light)' : 'var(--text-muted)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s ease',
        boxShadow: playing ? '0 0 20px rgba(168,85,247,0.15)' : 'none',
      }}
    >
      {playing ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 010 7.07" />
          <path d="M19.07 4.93a10 10 0 010 14.14" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  )
}

const API_BASE = 'https://34-156-149-38.sslip.io/aetherapi'

// === LIVE DATA HOOK ===
function useLiveData() {
  const [data, setData] = useState({
    block: '—', gas: '—', volume: '$0.00',
    endpoints: '100+', freeEndpoints: '40',
    latency: '—', status: 'connecting',
  })

  useEffect(() => {
    const ping = async () => {
      const start = performance.now()
      try {
        const r = await fetch(`${API_BASE}/v1/x402/base-stats`)
        const elapsed = Math.round(performance.now() - start)
        const d = await r.json()
        setData({
          block: d.block_number || d.block || '—',
          gas: d.gas_price_gwei || d.gas_price || '—',
          volume: d.total_volume_usdc != null ? `$${d.total_volume_usdc.toFixed(2)}` : '$0.00',
          endpoints: '100+',
          freeEndpoints: '40',
          latency: `${elapsed}ms`,
          status: elapsed < 600 ? 'live' : 'slow',
        })
      } catch {
        setData(p => ({ ...p, status: 'retry' }))
      }
    }
    const t1 = setTimeout(ping, 1500)
    const iv = setInterval(ping, 6000)
    return () => { clearTimeout(t1); clearInterval(iv) }
  }, [])

  return data
}

// === MAIN HERO ===
function Hero() {
  const liveData = useLiveData()
  const [globePaused, setGlobePaused] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const heroRef = useRef(null)

  // IntersectionObserver: pause globe when hero scrolls off-screen
  useEffect(() => {
    if (!heroRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setGlobePaused(!entry.isIntersecting),
      { threshold: 0.05 }
    )
    observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  // Stable loader callback (inline arrow would restart the canvas effect)
  const handleLoaded = useCallback(() => setLoaded(true), [])

  // Safety: never trap the page behind the loader — force reveal after 4s
  useEffect(() => {
    if (loaded) return
    const t = setTimeout(() => setLoaded(true), 4000)
    return () => clearTimeout(t)
  }, [loaded])

  useEffect(() => {
    let tween
    try {
      gsap.registerPlugin(ScrollTrigger)
      tween = gsap.to('#hero .hero-fade', {
        y: -50, opacity: 0.05, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 30%', scrub: 0.8 },
      })
    } catch {}
    return () => { try { tween?.scrollTrigger?.kill(); tween?.kill() } catch {} }
  }, [])

  return (
    <>
      {!loaded && <SupernovaLoader onComplete={handleLoaded} />}
      <CosmicSound />

      <section id="hero" ref={heroRef} style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
        padding: '80px 0 60px',
        isolation: 'isolate', zIndex: 0,
      }}>
        <CosmicVoid />

        {/* Globe — no transforms, just flex centering */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', width: '100%', height: '100%',
            background: 'radial-gradient(circle at 50% 48%, rgba(168,85,247,0.06) 0%, rgba(217,70,239,0.04) 20%, rgba(34,211,238,0.02) 40%, transparent 60%)',
            filter: 'blur(60px)',
            animation: 'holoPulse 8s ease-in-out infinite alternate',
          }} />

          <GlobeBoundary>
            <Suspense fallback={
              <div style={{ width: 280, height: 280, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
                animation: 'pulse 3s ease-in-out infinite' }} />
            }>
              <div style={{ position: 'absolute', inset: '-12%', pointerEvents: 'auto' }}>
                <GlobeScene liveData={liveData} paused={false} />
              </div>
            </Suspense>
          </GlobeBoundary>
        </div>

        {/* Content — no transforms */}
        <div className="hero-fade" style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center',
          padding: '0 24px', gap: 0,
        }}>
          {/* x402 badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            background: 'rgba(0,82,255,0.06)',
            border: '1px solid rgba(0,82,255,0.12)',
            marginBottom: 20,
            backdropFilter: 'blur(10px)',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.72rem', fontWeight: 700,
              color: '#0052FF',
              letterSpacing: '0.08em',
            }}>x402</span>
            <span style={{
              width: 1, height: 12, background: 'rgba(0,82,255,0.2)',
            }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.6rem',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.1em',
            }}>PROTOCOL</span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 7.5vw, 6.5rem)',
            lineHeight: 0.92, letterSpacing: '-0.04em',
            fontWeight: 300, color: 'rgba(255,255,255,0.9)', margin: 0,
            textShadow: '0 0 80px rgba(168,85,247,0.12), 0 0 40px rgba(34,211,238,0.06)',
            fontFamily: "'Inter', sans-serif",
          }}>The Marketplace<br/>That Lives</h1>

          <div style={{
            fontSize: 'clamp(0.85rem, 1.8vw, 1.3rem)',
            marginTop: 16, fontWeight: 300,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.02em',
          }}>API infrastructure for AI agents that pay</div>

          {/* Live metrics */}
          <div style={{
            display: 'flex', gap: 24, marginTop: 32,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.06em',
          }}>
            <span>{liveData.endpoints} endpoints</span>
            <span style={{ color: 'rgba(168,85,247,0.4)' }}>·</span>
            <span>{liveData.freeEndpoints} free</span>
            <span style={{ color: 'rgba(168,85,247,0.4)' }}>·</span>
            <span style={{ color: liveData.status === 'live' ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.25)' }}>
              {liveData.latency}
            </span>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="hero-cue" role="button" tabIndex={0}
          onClick={() => document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' })}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' }) }}
          style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            cursor: 'pointer', zIndex: 5,
          }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.5rem', letterSpacing: '0.35em',
            color: 'rgba(168,85,247,0.3)',
          }}>SCROLL</span>
          <svg className="cue-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(168,85,247,0.25)" strokeWidth="1.5"><path d="M6 9l6 6 6-6" strokeLinejoin="round" strokeLinecap="round"/></svg>
        </div>

        <style>{`
          @keyframes holoPulse {
            0% { opacity: 0.4; transform: scale(0.97); }
            100% { opacity: 1; transform: scale(1.03); }
          }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
          .hero-cue .cue-chev { animation: cueDrop 2s ease-in-out infinite; }
          @keyframes cueDrop {
            0%, 100% { transform: translateY(0); opacity: 0.2; }
            50% { transform: translateY(6px); opacity: 0.6; }
          }
          @media (max-width: 768px) {
            #hero { padding: 80px 0 36px !important; }
          }
        `}</style>
      </section>
    </>
  )
}

export default Hero
