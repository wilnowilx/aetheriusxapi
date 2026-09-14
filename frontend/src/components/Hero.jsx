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

// === FLUID LOADING — 6.5s card-flip clock + radial reveal ===
// Black screen. Flip-clock digits count down. At 6.5s → reveal.
function FluidLoader({ onComplete }) {
  const [digits, setDigits] = useState([6, 5])
  const [phase, setPhase] = useState('counting') // counting → reveal → done
  const [revealProgress, setRevealProgress] = useState(0)
  const onCompleteRef = useRef(onComplete)
  const containerRef = useRef(null)
  onCompleteRef.current = onComplete

  // Audio: single warm tone at reveal
  const playRevealSound = useCallback(() => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      const ac = new AC()
      if (ac.state !== 'running') { try { ac.close() } catch {} return }
      const t0 = ac.currentTime
      const master = ac.createGain()
      master.gain.value = 0.08
      master.connect(ac.destination)
      // warm pad
      const osc = ac.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(110, t0)
      osc.frequency.exponentialRampToValueAtTime(220, t0 + 1.2)
      const g = ac.createGain()
      g.gain.setValueAtTime(0, t0)
      g.gain.linearRampToValueAtTime(1, t0 + 0.3)
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.5)
      osc.connect(g); g.connect(master); osc.start(t0); osc.stop(t0 + 1.5)
      // shimmer
      const osc2 = ac.createOscillator()
      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(330, t0)
      const g2 = ac.createGain()
      g2.gain.setValueAtTime(0, t0)
      g2.gain.linearRampToValueAtTime(0.3, t0 + 0.2)
      g2.gain.exponentialRampToValueAtTime(0.001, t0 + 1.0)
      osc2.connect(g2); g2.connect(master); osc2.start(t0); osc2.stop(t0 + 1.0)
      setTimeout(() => { try { ac.close() } catch {} }, 2000)
    } catch {}
  }, [])

  // Countdown: flip digits every 1s from 6→1
  useEffect(() => {
    let count = 6
    const iv = setInterval(() => {
      count--
      if (count >= 1) {
        setDigits([count, count + 1]) // [current, previous]
      }
      if (count <= 0) {
        clearInterval(iv)
        setPhase('reveal')
        playRevealSound()
      }
    }, 1000)
    return () => clearInterval(iv)
  }, [playRevealSound])

  // Reveal animation: radial wipe from center over 1.5s
  useEffect(() => {
    if (phase !== 'reveal') return
    let start = null
    const DURATION = 1500
    let raf
    const animate = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / DURATION, 1)
      const ease = p * p * (3 - 2 * p) // smoothstep
      setRevealProgress(ease)
      if (p < 1) {
        raf = requestAnimationFrame(animate)
      } else {
        setPhase('done')
        onCompleteRef.current?.()
      }
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [phase, onCompleteRef])

  // Container opacity — fade out when done
  const containerOpacity = phase === 'done' ? 0 : 1

  return (
    <div ref={containerRef} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#010005',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: containerOpacity,
      transition: 'opacity 0.4s ease-out',
      pointerEvents: phase === 'done' ? 'none' : 'auto',
    }}>
      {/* Radial reveal mask */}
      {phase === 'reveal' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 50%, transparent ${revealProgress * 120}%, rgba(1,0,5,0.98) ${revealProgress * 120 + 5}%)`,
          zIndex: 1,
        }} />
      )}

      {/* Card-flip clock digits */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        position: 'relative', zIndex: 2,
      }}>
        {digits.map((digit, idx) => {
          const isCurrent = idx === 0
          return (
            <div key={isCurrent ? 'cur' : 'prev'} style={{
              width: 72, height: 96,
              position: 'relative',
              perspective: '400px',
            }}>
              {/* Card face */}
              <div style={{
                width: '100%', height: '100%',
                background: isCurrent
                  ? 'linear-gradient(180deg, rgba(168,85,247,0.08) 0%, rgba(168,85,247,0.03) 50%, rgba(168,85,247,0.06) 100%)'
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isCurrent ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}>
                {/* Horizontal split line */}
                <div style={{
                  position: 'absolute', left: 0, right: 0, top: '50%',
                  height: 1, background: 'rgba(0,0,0,0.5)', zIndex: 1,
                }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '2.8rem', fontWeight: 800,
                  color: isCurrent ? '#a855f7' : 'rgba(255,255,255,0.15)',
                  textShadow: isCurrent ? '0 0 20px rgba(168,85,247,0.4)' : 'none',
                  transition: 'all 0.3s ease-out',
                }}>
                  {isCurrent ? digit : digits[1]}
                </span>
              </div>
            </div>
          )
        })}
        {/* Separator dot */}
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#a855f7',
          boxShadow: '0 0 12px rgba(168,85,247,0.6)',
          margin: '0 4px',
          animation: 'loaderPulse 1s ease-in-out infinite',
        }} />
      </div>

      {/* Brand + status text */}
      <div style={{
        position: 'relative', zIndex: 2,
        marginTop: 32, textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.65rem', letterSpacing: '0.3em',
          color: 'rgba(168,85,247,0.5)',
          textTransform: 'uppercase',
        }}>
          AETHERIUS
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.55rem', letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.12)',
          marginTop: 8,
        }}>
          INITIALIZING BASE MAINNET
        </div>
      </div>

      {/* Bottom status bar */}
      <div style={{
        position: 'absolute', bottom: 32, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', zIndex: 2,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.5rem', letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.08)',
        }}>
          CH—402 · BASE · 2026
        </div>
      </div>

      <style>{`
        @keyframes loaderPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
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
      <div className="void-comets">
        <div className="void-comet void-comet--1" />
        <div className="void-comet void-comet--2" />
        <div className="void-comet void-comet--3" />
      </div>
      <div className="void-pulse void-pulse--1" />
      <div className="void-pulse void-pulse--2" />
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
            radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 35% 65%, rgba(255,255,255,0.35) 0%, transparent 100%),
            radial-gradient(1px 1px at 55% 15%, rgba(255,255,255,0.38) 0%, transparent 100%),
            radial-gradient(1px 1px at 75% 50%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 80%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 25% 92%, rgba(255,255,255,0.32) 0%, transparent 100%),
            radial-gradient(1px 1px at 60% 35%, rgba(255,255,255,0.38) 0%, transparent 100%),
            radial-gradient(1px 1px at 42% 78%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 18% 45%, rgba(255,255,255,0.35) 0%, transparent 100%),
            radial-gradient(1px 1px at 82% 55%, rgba(255,255,255,0.28) 0%, transparent 100%);
          background-size: 200px 200px;
          animation: voidDrift 100s linear infinite;
        }
        .void-stars--mid {
          background-image:
            radial-gradient(1.5px 1.5px at 20% 35%, rgba(168,85,247,0.6) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 55% 75%, rgba(34,211,238,0.45) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 75% 25%, rgba(217,70,239,0.45) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 40% 60%, rgba(168,85,247,0.4) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 85% 65%, rgba(236,72,153,0.35) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 22% 50%, rgba(168,85,247,0.5) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 70% 50%, rgba(34,211,238,0.4) 0%, transparent 100%);
          background-size: 350px 350px;
          animation: voidDrift 180s linear infinite reverse;
        }
        .void-stars--near {
          background-image:
            radial-gradient(2.5px 2.5px at 30% 45%, rgba(34,211,238,0.6) 0%, transparent 100%),
            radial-gradient(3px 3px at 70% 30%, rgba(168,85,247,0.6) 0%, transparent 100%),
            radial-gradient(2.5px 2.5px at 50% 80%, rgba(217,70,239,0.45) 0%, transparent 100%),
            radial-gradient(2px 2px at 20% 70%, rgba(236,72,153,0.4) 0%, transparent 100%);
          background-size: 500px 500px;
          animation: voidTwinkle 7s ease-in-out infinite alternate, voidDrift 250s linear infinite;
        }
        @keyframes voidDrift { from { transform: translateY(0); } to { transform: translateY(-200px); } }
        @keyframes voidTwinkle { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

        .void-aurora {
          position: absolute; width: 130%; height: 45%; left: -15%;
          filter: blur(110px); mix-blend-mode: screen; opacity: 0;
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
          filter: blur(180px); mix-blend-mode: screen;
          opacity: 0.25; animation: nebulaPulse 25s ease-in-out infinite;
        }
        .void-nebula--1 {
          width: 1500px; height: 900px; top: -22%; left: -15%;
          background: radial-gradient(ellipse, rgba(168,85,247,0.28) 0%, rgba(217,70,239,0.20) 45%, transparent 70%);
          animation-delay: 0s; animation-duration: 35s;
        }
        .void-nebula--2 {
          width: 1300px; height: 750px; top: 25%; right: -15%;
          background: radial-gradient(ellipse, rgba(34,211,238,0.22) 0%, rgba(168,85,247,0.16) 50%, transparent 70%);
          animation-delay: -12s; animation-duration: 30s;
        }
        .void-nebula--3 {
          width: 1100px; height: 650px; bottom: 12%; left: 5%;
          background: radial-gradient(ellipse, rgba(236,72,153,0.20) 0%, rgba(217,70,239,0.12) 55%, transparent 70%);
          animation-delay: -20s; animation-duration: 42s;
        }
        .void-nebula--4 {
          width: 1700px; height: 1000px; bottom: -15%; left: -18%;
          background: radial-gradient(ellipse, rgba(168,85,247,0.18) 0%, rgba(34,211,238,0.10) 50%, transparent 70%);
          animation-delay: -8s; animation-duration: 33s;
        }
        .void-nebula--5 {
          width: 1600px; height: 950px; top: -10%; right: -20%;
          background: radial-gradient(ellipse, rgba(34,211,238,0.16) 0%, rgba(236,72,153,0.12) 45%, rgba(168,85,247,0.08) 70%, transparent 85%);
          animation-delay: -15s; animation-duration: 38s;
        }
        @keyframes nebulaPulse {
          0%, 100% { opacity: 0.3; transform: scale(1) translate(0, 0); }
          33% { opacity: 0.65; transform: scale(1.08) translate(15px, -8px); }
          66% { opacity: 0.4; transform: scale(0.95) translate(-8px, 6px); }
        }

        .void-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 50%,
            transparent 25%, rgba(1,0,5,0.3) 55%,
            rgba(1,0,5,0.7) 80%, rgba(1,0,5,0.92) 100%);
        }
        .void-comets { position: absolute; inset: 0; overflow: hidden; }
        .void-comet {
          position: absolute; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(34,211,238,0.8) 40%, rgba(255,255,255,0.9) 70%, transparent);
          filter: blur(0.5px); opacity: 0;
        }
        .void-comet--1 { top: 22%; width: 180px; animation: cometShoot 18s linear infinite; animation-delay: 0s; }
        .void-comet--2 { top: 58%; width: 140px; animation: cometShoot 22s linear infinite; animation-delay: -7s; }
        .void-comet--3 { top: 38%; width: 200px; animation: cometShoot 16s linear infinite; animation-delay: -12s; }
        @keyframes cometShoot {
          0% { transform: translateX(-200px); opacity: 0; }
          5% { opacity: 0.7; }
          15% { opacity: 0.3; }
          20%, 100% { transform: translateX(120vw); opacity: 0; }
        }
        .void-pulse {
          position: absolute; border-radius: 50%; border: 1px solid;
          left: 50%; top: 50%; width: 300px; height: 300px;
          transform: translate(-50%,-50%) scale(0.5); opacity: 0;
        }
        .void-pulse--1 { border-color: rgba(168,85,247,0.15); animation: voidPulse 12s ease-out infinite; }
        .void-pulse--2 { border-color: rgba(34,211,238,0.12); animation: voidPulse 12s ease-out infinite 6s; }
        @keyframes voidPulse {
          0% { transform: translate(-50%,-50%) scale(0.5); opacity: 0.4; }
          100% { transform: translate(-50%,-50%) scale(3.5); opacity: 0; }
        }

        .void-dust {
          position: absolute; inset: 0; opacity: 0.12;
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

// === CSS GLOBE FALLBACK — when WebGL is unavailable (strict fingerprinting
// blockers, old devices). Never show a dead hero: slow orbital rings + glow.
function GlobeCSSFallback() {
  return (
    <div style={{
      position: 'absolute', inset: '-12%', pointerEvents: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '52vmin', height: '52vmin', borderRadius: '50%', position: 'relative',
        background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, rgba(34,211,238,0.05) 45%, transparent 70%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '1px solid rgba(168,85,247,0.22)', borderTopColor: 'rgba(0,82,255,0.55)',
          animation: 'cssSpin 26s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: '7%', borderRadius: '50%',
          border: '1px dashed rgba(34,211,238,0.18)',
          animation: 'cssSpinRev 44s linear infinite',
        }} />
        <div style={{ position: 'absolute', inset: '-4%', animation: 'cssSpin 12s linear infinite' }}>
          <div style={{
            position: 'absolute', top: '6%', left: '50%', width: 6, height: 6,
            borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 12px #22d3ee',
          }} />
        </div>
        <div style={{ position: 'absolute', inset: '10%', animation: 'cssSpinRev 18s linear infinite' }}>
          <div style={{
            position: 'absolute', bottom: '10%', left: '50%', width: 5, height: 5,
            borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 10px #a855f7',
          }} />
        </div>
        <style>{`@keyframes cssSpin{to{transform:rotate(360deg)}}@keyframes cssSpinRev{to{transform:rotate(-360deg)}}`}</style>
      </div>
    </div>
  )
}

// === MAIN HERO ===
function Hero() {
  const liveData = useLiveData()
  const [globePaused, setGlobePaused] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [webglOK, setWebglOK] = useState(true)
  const heroRef = useRef(null)

  // WebGL availability probe — strict fingerprinting blockers (Brave Shields)
  // return a null context. Detect once, fall back to the CSS globe.
  useEffect(() => {
    try {
      const c = document.createElement('canvas')
      const gl = c.getContext('webgl2') || c.getContext('webgl')
      if (!gl) setWebglOK(false)
    } catch {
      setWebglOK(false)
    }
  }, [])

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

  // Safety: never trap the page behind the loader — force reveal after 8s
  useEffect(() => {
    if (loaded) return
    const t = setTimeout(() => setLoaded(true), 8000)
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
      {!loaded && <FluidLoader onComplete={handleLoaded} />}
      <CosmicSound />

      <section id="hero" ref={heroRef} style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
        padding: '80px 24px 60px',
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

          {webglOK ? (
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
        ) : (
            <GlobeCSSFallback />
          )}
        </div>

        {/* x402 badge — arriba, fuera del centro del globo */}
        <div style={{
          position: 'absolute', top: 90, left: '50%', transform: 'translateX(-50%)',
          zIndex: 15,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 20,
          background: 'rgba(168,85,247,0.06)',
          border: '1px solid rgba(168,85,247,0.15)',
          backdropFilter: 'blur(12px)',
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.72rem', fontWeight: 700,
            color: '#a855f7',
            letterSpacing: '0.08em',
          }}>x402</span>
          <span style={{
            width: 1, height: 12, background: 'rgba(168,85,247,0.3)',
          }} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6rem',
            color: '#d946ef',
            letterSpacing: '0.1em',
          }}>PROTOCOL</span>
        </div>

        {/* Content — minimal: scroll cue only. Text lives in orbital bands now. */}
        <div className="hero-fade" style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center',
          padding: '0 24px', gap: 0,
        }}>
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
