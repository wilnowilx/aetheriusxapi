import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'

// === STAGES (brand colors — shared, dependency-free) ===
import { STAGES } from './flowStages'

function basePos(i) {
  return [-7 + i * 3.5, Math.sin(i * 1.1) * 0.7, 0]
}

function explodedPos(i, e, out) {
  const b = basePos(i)
  out[0] = b[0] * (1 + 0.12 * e)
  out[1] = b[1] + Math.sin(i * 1.7) * 2.4 * e
  out[2] = Math.cos(i * 1.3) * 2.6 * e
  return out
}

function makeLabelTexture(text, color) {
  const canvas = document.createElement('canvas')
  canvas.width = 512; canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 512, 128)
  ctx.font = '700 56px Inter, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 24
  ctx.fillText(text, 256, 64)
  const t = new THREE.CanvasTexture(canvas)
  t.anisotropy = 4
  return t
}

function makeGlowTexture(color) {
  const canvas = document.createElement('canvas')
  canvas.width = 128; canvas.height = 128
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64)
  g.addColorStop(0, color)
  g.addColorStop(0.35, color + 'aa')
  g.addColorStop(1, 'transparent')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

// === NODES — one distinct form per stage (x402/Base-inspired) ===
// Agent: octahedron (autonomous facets) · Challenge: toll ring (the 402 gate)
// Sign: torus knot (cryptographic binding) · Settle: compressing discs
// (Base layers reaching finality) · Data: packet cube with bright core
function FlowNodes({ flow, selected, onSelect }) {
  const groupRefs = useRef([])
  const spinRefs = useRef([])
  const glowRefs = useRef([])
  const ringRef = useRef()
  const labels = useMemo(() => STAGES.map(s => makeLabelTexture(s.label, s.color)), [])
  const glows = useMemo(() => STAGES.map(s => makeGlowTexture(s.color)), [])
  const tmp = useMemo(() => [0, 0, 0], [])

  useFrame((state, delta) => {
    const e = flow.explode
    const t = state.clock.elapsedTime
    groupRefs.current.forEach((g, i) => {
      if (!g) return
      explodedPos(i, e, tmp)
      const breathe = 1 + Math.sin(t * 1.6 + i) * 0.04
      const hover = flow.hover === i ? 1.22 : 1
      const target = breathe * (selected === i ? 1.35 : hover)
      const cur = g.scale.x + (target - g.scale.x) * Math.min(1, delta * 10)
      g.position.set(tmp[0], tmp[1] + Math.sin(t * 0.9 + i * 2.0) * 0.12, tmp[2])
      g.scale.setScalar(cur)
      const sp = spinRefs.current[i]
      if (sp) {
        if (i === 0) sp.rotation.y = t * 0.5
        else if (i === 1) sp.rotation.x = t * 0.7
        else if (i === 2) { sp.rotation.x = t * 0.4; sp.rotation.y = t * 0.55; sp.scale.setScalar(1 + Math.sin(t * 2.2) * 0.06) }
        else if (i === 3) { sp.rotation.y = t * 0.9; sp.position.y = Math.sin(t * 1.8) * 0.07 }
        else { sp.rotation.y = -t * 0.5; sp.rotation.x = t * 0.2 }
      }
      const gm = glowRefs.current[i]
      if (gm) gm.opacity = selected === i ? 0.95 : 0.5 + Math.sin(t * 1.6 + i) * 0.08
    })
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8
      if (selected >= 0 && groupRefs.current[selected]) {
        ringRef.current.position.copy(groupRefs.current[selected].position)
        ringRef.current.visible = true
      } else {
        ringRef.current.visible = false
      }
    }
  })

  const hit = (i) => ({
    onClick: (ev) => { ev.stopPropagation(); onSelect(i) },
    onPointerOver: (ev) => { ev.stopPropagation(); flow.hover = i; document.body.style.cursor = 'pointer' },
    onPointerOut: () => { flow.hover = -1; document.body.style.cursor = 'auto' },
  })

  return (
    <group>
      {STAGES.map((s, i) => (
        <group key={s.id} ref={el => { groupRefs.current[i] = el }}>
          <sprite scale={[3.2, 3.2, 1]}>
            <spriteMaterial ref={el => { glowRefs.current[i] = el }} map={glows[i]} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.55} />
          </sprite>
          <group ref={el => { spinRefs.current[i] = el }} {...hit(i)}>
            {i === 0 && (<>
              <mesh><octahedronGeometry args={[0.62, 0]} /><meshBasicMaterial color={s.color} wireframe transparent opacity={0.85} /></mesh>
              <mesh><octahedronGeometry args={[0.3, 0]} /><meshBasicMaterial color={s.color} transparent opacity={0.9} /></mesh>
            </>)}
            {i === 1 && (<>
              <mesh><torusGeometry args={[0.55, 0.15, 12, 40]} /><meshBasicMaterial color={s.color} wireframe transparent opacity={0.8} /></mesh>
              <mesh><sphereGeometry args={[0.16, 16, 16]} /><meshBasicMaterial color={s.color} transparent opacity={0.95} /></mesh>
            </>)}
            {i === 2 && (<>
              <mesh><torusKnotGeometry args={[0.4, 0.13, 80, 12]} /><meshBasicMaterial color={s.color} wireframe transparent opacity={0.75} /></mesh>
              <mesh><sphereGeometry args={[0.17, 16, 16]} /><meshBasicMaterial color={s.color} transparent opacity={0.95} /></mesh>
            </>)}
            {i === 3 && (<>
              {[-0.24, 0, 0.24].map((y, k) => (
                <mesh key={k} position={[0, y, 0]}>
                  <cylinderGeometry args={[0.52 - k * 0.04, 0.52 - k * 0.04, 0.1, 28]} />
                  <meshBasicMaterial color={s.color} wireframe={k !== 1} transparent opacity={k === 1 ? 0.9 : 0.7} />
                </mesh>
              ))}
            </>)}
            {i === 4 && (<>
              <mesh><boxGeometry args={[0.62, 0.62, 0.62]} /><meshBasicMaterial color={s.color} wireframe transparent opacity={0.85} /></mesh>
              <mesh><boxGeometry args={[0.28, 0.28, 0.28]} /><meshBasicMaterial color={0xffffff} transparent opacity={0.9} /></mesh>
            </>)}
          </group>
          <sprite position={[0, 1.2, 0]} scale={[2.6, 0.65, 1]}>
            <spriteMaterial map={labels[i]} transparent depthWrite={false} opacity={0.95} />
          </sprite>
        </group>
      ))}
      <mesh ref={ringRef} visible={false}>
        <torusGeometry args={[1.0, 0.03, 8, 64]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

// === EDGES (live lines following exploded nodes) ===
function FlowEdges({ flow }) {
  const SEG = 4
  const PTS = 24
  const ref = useRef()
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(SEG * PTS * 2 * 3)
    const colors = new Float32Array(SEG * PTS * 2 * 3)
    const cA = new THREE.Color(), cB = new THREE.Color()
    for (let s = 0; s < SEG; s++) {
      cA.set(STAGES[s].color); cB.set(STAGES[s + 1].color)
      for (let p = 0; p < PTS; p++) {
        const t = p / PTS
        const c = cA.clone().lerp(cB, t)
        for (let k = 0; k < 2; k++) {
          const idx = (s * PTS * 2 + p * 2 + k) * 3
          colors[idx] = c.r; colors[idx + 1] = c.g; colors[idx + 2] = c.b
        }
      }
    }
    return { positions, colors }
  }, [])
  const a = useMemo(() => [0, 0, 0], [])
  const b = useMemo(() => [0, 0, 0], [])

  useFrame((state) => {
    const attr = ref.current
    if (!attr) return
    const e = flow.explode
    const t = state.clock.elapsedTime
    for (let s = 0; s < SEG; s++) {
      explodedPos(s, e, a); explodedPos(s + 1, e, b)
      // gentle mid sag animated
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - 0.35 - Math.sin(t * 1.2 + s) * 0.08, mz = (a[2] + b[2]) / 2
      for (let p = 0; p < PTS; p++) {
        const q0 = p / PTS, q1 = (p + 1) / PTS
        const lerp = (q, o) => {
          // quadratic bezier a -> m -> b
          const x = (1 - q) * (1 - q) * a[0] + 2 * (1 - q) * q * mx + q * q * b[0]
          const y = (1 - q) * (1 - q) * a[1] + 2 * (1 - q) * q * my + q * q * b[1]
          const z = (1 - q) * (1 - q) * a[2] + 2 * (1 - q) * q * mz + q * q * b[2]
          o[0] = x; o[1] = y; o[2] = z
        }
        const p0 = [0, 0, 0], p1 = [0, 0, 0]
        lerp(q0, p0); lerp(q1, p1)
        const base = (s * PTS * 2 + p * 2) * 3
        positions[base] = p0[0]; positions[base + 1] = p0[1]; positions[base + 2] = p0[2]
        positions[base + 3] = p1[0]; positions[base + 4] = p1[1]; positions[base + 5] = p1[2]
      }
    }
    attr.needsUpdate = true
  })

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute ref={ref} attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  )
}

// === PARTICLES (value flowing agent -> data) ===
function FlowParticles({ flow, count }) {
  const ref = useRef()
  const seeds = useMemo(() => {
    const arr = new Float32Array(count)
    for (let i = 0; i < count; i++) arr[i] = Math.random()
    return arr
  }, [count])
  const positions = useMemo(() => new Float32Array(count * 3), [count])
  const tmp = useMemo(() => ({ a: [0, 0, 0], b: [0, 0, 0] }), [])

  useFrame((state, delta) => {
    const attr = ref.current
    if (!attr) return
    const speed = flow.active ? 0.55 : 0.06
    const dt = Math.min(delta, 0.05)
    const e = flow.explode
    for (let i = 0; i < count; i++) {
      seeds[i] = (seeds[i] + speed * dt * (0.7 + (i % 5) * 0.12)) % 1
      const t = seeds[i] * 4
      const s = Math.min(3, Math.floor(t))
      const q = t - s
      explodedPos(s, e, tmp.a); explodedPos(s + 1, e, tmp.b)
      const idx = i * 3
      positions[idx] = tmp.a[0] + (tmp.b[0] - tmp.a[0]) * q
      positions[idx + 1] = tmp.a[1] + (tmp.b[1] - tmp.a[1]) * q + Math.sin(state.clock.elapsedTime * 2 + i) * 0.06
      positions[idx + 2] = tmp.a[2] + (tmp.b[2] - tmp.a[2]) * q
    }
    attr.needsUpdate = true
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute ref={ref} attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={0xe879f9} size={0.09} transparent opacity={flow.active ? 0.95 : 0.4} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  )
}

// === SCENE ===
function FlowScene({ flow, selected, onSelect, frameloop }) {
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
  }, [])
  return (
    <Canvas
      camera={{ position: [0, 1.6, 18], fov: 40 }}
      frameloop={frameloop}
      gl={{ alpha: true, antialias: !isMobile, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent' }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.4} />
      <Stars radius={40} depth={12} count={isMobile ? 250 : 700} factor={3} saturation={0.4} fade speed={0.5} />
      <FlowEdges flow={flow} />
      <FlowParticles flow={flow} count={isMobile ? 90 : 240} />
      <FlowNodes flow={flow} selected={selected} onSelect={onSelect} />
      {!isMobile && (
        <OrbitControls
          autoRotate autoRotateSpeed={0.45}
          enableZoom={false} enablePan={false} enableDamping dampingFactor={0.1}
          rotateSpeed={0.4} minPolarAngle={Math.PI * 0.3} maxPolarAngle={Math.PI * 0.7}
        />
      )}
    </Canvas>
  )
}

export default FlowScene
