import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DesignProvider, DesignPanel } from './DesignPanel'

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

// === FLUID LOADING — single card flip + big bang reveal ===
function FluidLoader({ onComplete }) {
  const [digit, setDigit] = useState(3)
  const [phase, setPhase] = useState('counting') // counting → bigbang → done
  const [bigbangProgress, setBigbangProgress] = useState(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Countdown: 7→0
  useEffect(() => {
    let count = 3
    const iv = setInterval(() => {
      count--
      if (count >= 0) setDigit(count)
      if (count <= 0) {
        clearInterval(iv)
        setPhase('bigbang')
      }
    }, 600)
    return () => clearInterval(iv)
  }, [])

  // Big bang: radial burst expanding from center
  useEffect(() => {
    if (phase !== 'bigbang') return
    let start = null
    const DURATION = 1200
    let raf
    // Sound: warm thump + whoosh
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      const ac = new AC()
      if (ac.state === 'running') {
        const t0 = ac.currentTime
        const master = ac.createGain(); master.gain.value = 0.1; master.connect(ac.destination)
        const osc = ac.createOscillator(); osc.type = 'sine'
        osc.frequency.setValueAtTime(55, t0); osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.4)
        const g = ac.createGain(); g.gain.setValueAtTime(0.6, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.8)
        osc.connect(g); g.connect(master); osc.start(t0); osc.stop(t0 + 0.8)
        // shimmer
        const s = ac.createOscillator(); s.type = 'triangle'
        s.frequency.setValueAtTime(440, t0 + 0.1)
        const sg = ac.createGain(); sg.gain.setValueAtTime(0, t0); sg.gain.linearRampToValueAtTime(0.2, t0 + 0.15); sg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6)
        s.connect(sg); sg.connect(master); s.start(t0 + 0.1); s.stop(t0 + 0.6)
        setTimeout(() => { try { ac.close() } catch {} }, 1500)
      } else { try { ac.close() } catch {} }
    } catch {}
    const animate = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / DURATION, 1)
      const ease = p * p
      setBigbangProgress(ease)
      if (p < 1) raf = requestAnimationFrame(animate)
      else { setPhase('done'); onCompleteRef.current?.() }
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#010005',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'done' ? 0 : 1,
      transition: 'opacity 0.3s ease-out',
      pointerEvents: phase === 'done' ? 'none' : 'auto',
    }}>
      {/* Big bang: expanding radial ring — toned down */}
      {phase === 'bigbang' && (
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width: bigbangProgress * 200 + 'vmax',
          height: bigbangProgress * 200 + 'vmax',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: `1px solid rgba(168,85,247,${(1 - bigbangProgress) * 0.15})`,
          boxShadow: `0 0 ${bigbangProgress * 15}px rgba(168,85,247,${(1 - bigbangProgress) * 0.06}), inset 0 0 ${bigbangProgress * 8}px rgba(34,211,238,${(1 - bigbangProgress) * 0.03})`,
        }} />
      )}
      {phase === 'bigbang' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 50%, rgba(168,85,247,${(1 - bigbangProgress) * 0.06}) 0%, transparent 50%)`,
        }} />
      )}

      {/* Single card */}
      <div style={{
        width: 90, height: 110,
        background: phase === 'bigbang'
          ? `linear-gradient(180deg, rgba(168,85,247,${0.12 * (1 - bigbangProgress)}) 0%, rgba(168,85,247,${0.04 * (1 - bigbangProgress)}) 100%)`
          : 'linear-gradient(180deg, rgba(168,85,247,0.08) 0%, rgba(168,85,247,0.03) 100%)',
        border: `1px solid rgba(168,85,247,${phase === 'bigbang' ? 0.1 * (1 - bigbangProgress) : 0.2})`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        transform: phase === 'bigbang' ? `scale(${1 + bigbangProgress * 2})` : 'scale(1)',
        opacity: phase === 'bigbang' ? 1 - bigbangProgress : 1,
        transition: 'none',
      }}>
        {/* Horizontal split line */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(0,0,0,0.5)' }} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '3rem', fontWeight: 800,
          color: '#a855f7',
          textShadow: '0 0 24px rgba(168,85,247,0.5)',
        }}>
          {digit}
        </span>
      </div>

      {/* Brand text — brighter + glow */}
      <div style={{
        marginTop: 28, textAlign: 'center',
        opacity: phase === 'bigbang' ? 1 - bigbangProgress : 0.9,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.75rem', letterSpacing: '0.35em', fontWeight: 700,
          color: '#c084fc',
          textShadow: '0 0 20px rgba(168,85,247,0.7), 0 0 40px rgba(168,85,247,0.4), 0 0 80px rgba(168,85,247,0.2)',
        }}>AETHERIUS</div>
      </div>

      {/* Particle stars around card */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(24)].map((_, i) => {
          const size = 1 + Math.random() * 2
          const angle = (i / 24) * Math.PI * 2
          const dist = 15 + Math.random() * 25
          const x = 50 + Math.cos(angle) * dist
          const y = 50 + Math.sin(angle) * dist
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `${x}%`, top: `${y}%`,
              width: size, height: size,
              borderRadius: '50%',
              background: i % 3 === 0 ? '#a855f7' : i % 3 === 1 ? '#22d3ee' : '#ffffff',
              opacity: 0.3 + Math.random() * 0.5,
              animation: `loaderStar ${1.5 + Math.random() * 2}s ease-in-out ${Math.random() * 1.5}s infinite alternate`,
              boxShadow: `0 0 ${size * 3}px ${i % 3 === 0 ? 'rgba(168,85,247,0.6)' : i % 3 === 1 ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.4)'}`,
            }} />
          )
        })}
        <style>{`
          @keyframes loaderStar {
            0% { opacity: 0.08; transform: scale(0.6); }
            100% { opacity: 0.35; transform: scale(1.1); }
          }
        `}</style>
      </div>

      {/* Bottom */}
      <div style={{ position: 'absolute', bottom: 28, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.45rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.06)' }}>
        CH—402 · BASE · 2026
      </div>
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
            rgba(168,85,247,0.04) 20%, rgba(217,70,239,0.05) 45%,
            rgba(34,211,238,0.02) 65%, transparent 100%);
          animation-delay: 0s; animation-duration: 24s;
        }
        .void-aurora--2 {
          top: 18%;
          background: linear-gradient(225deg, transparent 0%,
            rgba(34,211,238,0.03) 25%, rgba(168,85,247,0.04) 50%,
            rgba(236,72,153,0.02) 75%, transparent 100%);
          animation-delay: -8s; animation-duration: 28s;
        }
        .void-aurora--3 {
          top: 2%; height: 30%;
          background: linear-gradient(180deg,
            rgba(217,70,239,0.02) 0%, rgba(168,85,247,0.015) 35%, transparent 65%);
          animation-delay: -16s; animation-duration: 34s;
        }
        @keyframes auroraBreath {
          0%, 100% { opacity: 0.02; transform: translateX(-4%) scaleY(1); }
          25% { opacity: 0.06; transform: translateX(3%) scaleY(1.05); }
          50% { opacity: 0.03; transform: translateX(-2%) scaleY(0.95); }
          75% { opacity: 0.07; transform: translateX(5%) scaleY(1.03); }
        }

        .void-rays {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 100%; height: 100%; pointer-events: none;
        }
        .void-ray {
          position: absolute; top: 50%; left: 50%;
          width: 2px; height: 60vh;
          transform-origin: top center;
          filter: blur(18px); opacity: 0;
          animation: rayPulse 14s ease-in-out infinite;
        }
        .void-ray--1 {
          background: linear-gradient(180deg, rgba(168,85,247,0.06) 0%, transparent 100%);
          transform: translate(-50%, 0) rotate(-22deg); animation-delay: 0s;
        }
        .void-ray--2 {
          background: linear-gradient(180deg, rgba(34,211,238,0.05) 0%, transparent 100%);
          transform: translate(-50%, 0) rotate(12deg); animation-delay: -3s;
        }
        .void-ray--3 {
          background: linear-gradient(180deg, rgba(217,70,239,0.04) 0%, transparent 100%);
          transform: translate(-50%, 0) rotate(-6deg); animation-delay: -7s;
        }
        .void-ray--4 {
          background: linear-gradient(180deg, rgba(236,72,153,0.03) 0%, transparent 100%);
          transform: translate(-50%, 0) rotate(28deg); animation-delay: -10s;
        }
        @keyframes rayPulse {
          0%, 100% { opacity: 0; }
          25% { opacity: 0.06; }
          50% { opacity: 0.03; }
          75% { opacity: 0.08; }
        }

        .void-nebula {
          position: absolute; border-radius: 50%;
          filter: blur(180px); mix-blend-mode: screen;
          opacity: 0.04; animation: nebulaPulse 25s ease-in-out infinite;
        }
        .void-nebula--1 {
          width: 1500px; height: 900px; top: -22%; left: -15%;
          background: radial-gradient(ellipse, rgba(168,85,247,0.10) 0%, rgba(217,70,239,0.06) 45%, transparent 70%);
          animation-delay: 0s; animation-duration: 35s;
        }
        .void-nebula--2 {
          width: 1300px; height: 750px; top: 25%; right: -15%;
          background: radial-gradient(ellipse, rgba(34,211,238,0.08) 0%, rgba(168,85,247,0.05) 50%, transparent 70%);
          animation-delay: -12s; animation-duration: 30s;
        }
        .void-nebula--3 {
          width: 1100px; height: 650px; bottom: 12%; left: 5%;
          background: radial-gradient(ellipse, rgba(236,72,153,0.07) 0%, rgba(217,70,239,0.04) 55%, transparent 70%);
          animation-delay: -20s; animation-duration: 42s;
        }
        @keyframes nebulaPulse {
          0%, 100% { opacity: 0.03; transform: scale(1) translate(0, 0); }
          33% { opacity: 0.06; transform: scale(1.02) translate(4px, -2px); }
          66% { opacity: 0.04; transform: scale(0.99) translate(-2px, 1px); }
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
        .void-pulse--1 { border-color: rgba(168,85,247,0.08); animation: voidPulse 16s ease-out infinite; }
        .void-pulse--2 { border-color: rgba(34,211,238,0.06); animation: voidPulse 16s ease-out infinite 8s; }
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
  const [designOpen, setDesignOpen] = useState(false)
  const heroRef = useRef(null)

  // Ctrl+D toggle for Design Panel
  useEffect(() => {
    const handler = (e) => { if (e.ctrlKey && e.key === 'd') { e.preventDefault(); setDesignOpen(v => !v) } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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
    <DesignProvider>
    <>
      {designOpen && <DesignPanel />}
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
            background: 'radial-gradient(circle at 50% 48%, rgba(168,85,247,0.03) 0%, rgba(217,70,239,0.02) 20%, rgba(34,211,238,0.01) 40%, transparent 60%)',
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
                <GlobeScene liveData={liveData} paused={globePaused} />
              </div>
            </Suspense>
          </GlobeBoundary>
        ) : (
            <GlobeCSSFallback />
          )}
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          opacity: 0.4, animation: 'scrollBounce 2s ease-in-out infinite',
        }}>
          <div style={{ width: 2, height: 24, background: 'linear-gradient(180deg, rgba(168,85,247,0.6), transparent)', borderRadius: 1 }} />
        </div>

        {/* Content — text lives in orbital bands */}
        <div className="hero-fade" style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center',
          padding: '0 24px', gap: 0,
        }}>
        </div>

        {/* Launch OS — full-width bottom gradient + edge particles + floating chevron */}
        {/* Full-width gradient — more intense */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
          background: 'linear-gradient(0deg, rgba(217,70,239,0.35) 0%, rgba(168,85,247,0.18) 25%, rgba(168,85,247,0.06) 55%, transparent 100%)',
          pointerEvents: 'none', zIndex: 4,
        }} />
        {/* Edge particles — small dots emanating upward from the bottom edge */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
          pointerEvents: 'none', zIndex: 4, overflow: 'hidden',
        }}>
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className="edge-particle" style={{
              position: 'absolute',
              bottom: -4,
              left: `${5 + (i / 18) * 90 + (Math.sin(i * 2.3) * 3)}%`,
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              borderRadius: '50%',
              background: i % 3 === 0 ? '#d946ef' : i % 3 === 1 ? '#a855f7' : '#ec4899',
              opacity: 0,
              animation: `edgeParticleRise ${2.5 + (i % 5) * 0.6}s ${(i * 0.18) % 2}s infinite ease-out`,
            }} />
          ))}
        </div>
        {/* Clickable area with ▽ chevron + LAUNCH OS text — bigger */}
        <div className="hero-launch-btn" role="button" tabIndex={0}
          onClick={() => document.getElementById('ae-os')?.scrollIntoView({ behavior: 'smooth' })}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('ae-os')?.scrollIntoView({ behavior: 'smooth' }) }}
          style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            padding: '16px 48px 12px', borderRadius: '50% 50% 0 0 / 40% 40% 0 0',
            background: 'transparent',
            border: 'none', cursor: 'pointer', zIndex: 5,
            transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(-50%) translateY(-4px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(-50%) translateY(0)' }}
        >
          {/* ▽ chevron pointing down — bigger */}
          <svg width="36" height="20" viewBox="0 0 36 20" fill="none" style={{ opacity: 0.85 }}>
            <path d="M2 2L18 17L34 2" stroke="url(#launchGrad)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="launchGrad" x1="18" y1="2" x2="18" y2="17" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#d946ef"/>
                <stop offset="100%" stopColor="#a855f7"/>
              </linearGradient>
            </defs>
          </svg>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '1rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #d946ef 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.16em',
            textAlign: 'center',
          }}>LAUNCH OS</span>
        </div>

        <style>{`
          @keyframes holoPulse {
            0% { opacity: 0.15; transform: scale(0.98); }
            100% { opacity: 0.4; transform: scale(1.02); }
          }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
          @keyframes launchBtnFloat {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            50% { transform: translateX(-50%) translateY(-6px); }
          }
          @keyframes edgeParticleRise {
            0% { transform: translateY(0); opacity: 0; }
            10% { opacity: 0.9; }
            100% { transform: translateY(-110px); opacity: 0; }
          }
          .hero-launch-btn:hover {
            animation: none !important;
          }
          @media (max-width: 768px) {
            #hero { padding: 80px 0 36px !important; }
          }
        `}</style>
      </section>
    </>
    </DesignProvider>
  )
}

export default Hero
