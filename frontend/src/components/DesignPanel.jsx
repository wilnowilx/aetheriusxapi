import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'

export const DesignContext = createContext(null)

const DEFAULTS = {
  logoScale: 1.0, logoY: -0.1, logoColor: '#0052FF', logoSize: 0.22, logoGap: 0.05,
  ring0Radius: 2.8, ring0Speed: 0.012, ring0FontSize: 56, ring0Opacity: 0.85, ring0YOffset: 0.55,
  ring1Radius: 2.55, ring1Speed: -0.018, ring1FontSize: 48, ring1Opacity: 0.75, ring1YOffset: -0.15,
  ring2Radius: 2.35, ring2Speed: 0.035, ring2FontSize: 36, ring2Opacity: 0.68, ring2YOffset: -0.65,
  gasAlpha: 0.12, gasSpeed: 0.08, coreScale: 1.3, coreBreathing: 0.03,
  wireframeOpacity: 0.35, particleCount: 20, particleAlpha: 0.5,
}

function loadParams() {
  try { const s = localStorage.getItem('aetherius-design'); return s ? { ...DEFAULTS, ...JSON.parse(s) } : { ...DEFAULTS } }
  catch { return { ...DEFAULTS } }
}
function saveParams(p) { try { localStorage.setItem('aetherius-design', JSON.stringify(p)) } catch {} }

export function DesignProvider({ children }) {
  const [params, setParams] = useState(loadParams)
  useEffect(() => saveParams(params), [params])
  const update = useCallback((key, val) => setParams(p => ({ ...p, [key]: val })), [])
  const reset = useCallback(() => setParams({ ...DEFAULTS }), [])
  return <DesignContext.Provider value={{ params, update, reset }}>{children}</DesignContext.Provider>
}

export function useDesign() { return useContext(DesignContext) }

function Slider({ label, value, onChange, min, max, step }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ color: '#22d3ee', fontFamily: 'monospace' }}>{typeof value === 'number' ? value.toFixed(step < 1 ? (step < 0.01 ? 3 : 2) : 0) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#a855f7', height: 4 }} />
    </div>
  )
}

function Section({ title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ marginBottom: 4 }}>
      <div onClick={() => setOpen(!open)}
        style={{ cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#d946ef', padding: '4px 0', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between' }}>
        <span>{title}</span><span>{open ? '-' : '+'}</span>
      </div>
      {open && <div style={{ padding: '4px 0' }}>{children}</div>}
    </div>
  )
}

export function DesignPanel() {
  const { params, update, reset } = useDesign()
  const [pos, setPos] = useState({ x: window.innerWidth - 280, y: 60 })
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const onDown = (e) => { setDragging(true); setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y }) }
  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging, offset])

  return (
    <div style={{ position: 'fixed', left: pos.x, top: pos.y, width: 260, maxHeight: '80vh', overflowY: 'auto', background: 'rgba(6,6,14,0.95)', border: '1px solid #1e293b', borderRadius: 8, padding: 12, zIndex: 9999, fontFamily: 'Inter, sans-serif', backdropFilter: 'blur(12px)', boxShadow: '0 0 30px rgba(168,85,247,0.15)' }}>
      <div onMouseDown={onDown} style={{ cursor: 'grab', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #1e293b' }}>
        <span style={{ fontSize: 13, fontWeight: 800, background: 'linear-gradient(90deg, #a855f7, #d946ef)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DESIGN MODE</span>
        <button onClick={reset} style={{ fontSize: 9, background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>Reset</button>
      </div>

      <Section title="Logo BASE">
        <Slider label="Size" value={params.logoSize} onChange={v => update('logoSize', v)} min={0.10} max={0.45} step={0.01} />
        <Slider label="Gap" value={params.logoGap} onChange={v => update('logoGap', v)} min={0.01} max={0.15} step={0.005} />
        <Slider label="Y Position" value={params.logoY} onChange={v => update('logoY', v)} min={-0.5} max={0.5} step={0.01} />
        <Slider label="Scale" value={params.logoScale} onChange={v => update('logoScale', v)} min={0.3} max={2.5} step={0.05} />
      </Section>

      <Section title="Ring 0 (White)">
        <Slider label="Radius" value={params.ring0Radius} onChange={v => update('ring0Radius', v)} min={1.5} max={4.0} step={0.05} />
        <Slider label="Speed" value={params.ring0Speed} onChange={v => update('ring0Speed', v)} min={-0.1} max={0.1} step={0.001} />
        <Slider label="Font Size" value={params.ring0FontSize} onChange={v => update('ring0FontSize', v)} min={12} max={80} step={1} />
        <Slider label="Opacity" value={params.ring0Opacity} onChange={v => update('ring0Opacity', v)} min={0.0} max={1.0} step={0.05} />
        <Slider label="Y Offset" value={params.ring0YOffset} onChange={v => update('ring0YOffset', v)} min={-2.0} max={2.0} step={0.05} />
      </Section>

      <Section title="Ring 1 (Magenta)">
        <Slider label="Radius" value={params.ring1Radius} onChange={v => update('ring1Radius', v)} min={1.5} max={4.0} step={0.05} />
        <Slider label="Speed" value={params.ring1Speed} onChange={v => update('ring1Speed', v)} min={-0.1} max={0.1} step={0.001} />
        <Slider label="Font Size" value={params.ring1FontSize} onChange={v => update('ring1FontSize', v)} min={12} max={80} step={1} />
        <Slider label="Opacity" value={params.ring1Opacity} onChange={v => update('ring1Opacity', v)} min={0.0} max={1.0} step={0.05} />
        <Slider label="Y Offset" value={params.ring1YOffset} onChange={v => update('ring1YOffset', v)} min={-2.0} max={2.0} step={0.05} />
      </Section>

      <Section title="Ring 2 (Cyan / Telemetry)">
        <Slider label="Radius" value={params.ring2Radius} onChange={v => update('ring2Radius', v)} min={1.5} max={4.0} step={0.05} />
        <Slider label="Speed" value={params.ring2Speed} onChange={v => update('ring2Speed', v)} min={-0.1} max={0.1} step={0.001} />
        <Slider label="Font Size" value={params.ring2FontSize} onChange={v => update('ring2FontSize', v)} min={12} max={80} step={1} />
        <Slider label="Opacity" value={params.ring2Opacity} onChange={v => update('ring2Opacity', v)} min={0.0} max={1.0} step={0.05} />
        <Slider label="Y Offset" value={params.ring2YOffset} onChange={v => update('ring2YOffset', v)} min={-2.0} max={2.0} step={0.05} />
      </Section>

      <Section title="Gas / Core">
        <Slider label="Gas Alpha" value={params.gasAlpha} onChange={v => update('gasAlpha', v)} min={0.0} max={0.5} step={0.01} />
        <Slider label="Gas Speed" value={params.gasSpeed} onChange={v => update('gasSpeed', v)} min={0.01} max={0.5} step={0.01} />
        <Slider label="Core Scale" value={params.coreScale} onChange={v => update('coreScale', v)} min={0.5} max={2.5} step={0.05} />
        <Slider label="Breathing" value={params.coreBreathing} onChange={v => update('coreBreathing', v)} min={0.0} max={0.15} step={0.005} />
      </Section>

      <Section title="Wireframe">
        <Slider label="Opacity" value={params.wireframeOpacity} onChange={v => update('wireframeOpacity', v)} min={0.0} max={1.0} step={0.05} />
      </Section>

      <Section title="Particles">
        <Slider label="Alpha" value={params.particleAlpha} onChange={v => update('particleAlpha', v)} min={0.0} max={1.0} step={0.05} />
      </Section>

      <div style={{ marginTop: 8, fontSize: 9, color: '#475569', textAlign: 'center' }}>
        Press <kbd style={{ background: '#1e293b', padding: '1px 4px', borderRadius: 3, color: '#94a3b8' }}>Ctrl+D</kbd> to toggle
      </div>
    </div>
  )
}
