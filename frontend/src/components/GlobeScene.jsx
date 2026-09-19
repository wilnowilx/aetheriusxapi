import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useDesign } from './DesignPanel'

// === TEXT BAND RINGS — Saturn-style orbital rings OUTSIDE the Dyson sphere ===
// Los anillos orbitan FUERA del wireframe (r > 2.2), como los anillos de Saturno.
// Visibles por encima de toda la estructura. Sin sombras, cara al usuario.
// Arquitectura: Core(0.38) → Gas(1.2-1.5) → Wireframe(2.2) → **BANDS(2.5/2.3/2.1→outside)** → Halo(2.65)
const TextBandRings = ({ liveData }) => {
  const groupRef = useRef()
  const [cyanText, setCyanText] = useState('70+ ENDPOINTS  40 FREE  VM ONLINE')
  const { params: dp } = useDesign() || { params: {} }

  // Real telemetry — use /v1/telemetry (same as OS MetricsWindow)
  useEffect(() => {
    let alive = true
    const fetchTelemetry = async () => {
      try {
        const base = 'https://34-156-149-38.sslip.io/aetherapi'
        // Fetch telemetry + base-stats in parallel for rich data
        const [telRes, statsRes] = await Promise.allSettled([
          fetch(`${base}/v1/telemetry`),
          fetch(`${base}/v1/x402/base-stats`),
        ])
        if (!alive) return
        const tel = telRes.status === 'fulfilled' && telRes.value.ok ? await telRes.value.json() : {}
        const stats = statsRes.status === 'fulfilled' && statsRes.value.ok ? await statsRes.value.json() : {}
        const totals = tel.totals || {}
        const calls = totals.calls || 0
        const avgLat = totals.avg_latency_ms || 0
        const endpoints = Object.keys(tel.endpoint_hits || {}).length || 70
        const block = stats.block_number || stats.block || ''
        const gas = stats.gas_price_gwei || stats.gas_price || ''
        const parts = []
        parts.push(`${endpoints}+ ENDPOINTS`)
        parts.push('40 FREE')
        if (avgLat > 0) parts.push(`${Math.round(avgLat)}ms`)
        if (block) parts.push(`BLK ${block}`)
        if (gas) parts.push(`GAS ${gas}`)
        if (calls > 0) parts.push(`${calls} CALLS`)
        const text = parts.join('  ')
        setCyanText(text)
      } catch {
        // keep last known
      }
    }
    fetchTelemetry()
    const id = setInterval(fetchTelemetry, 500) // 500ms for smooth update
    return () => { alive = false; clearInterval(id) }
  }, [])

  // Single phrase per ring — uses design panel params for live tuning
  const ringsConfig = useMemo(() => [
    {
      radius: dp.ring0Radius ?? 2.8,
      tilt: 0.22,
      yOffset: dp.ring0YOffset ?? 0.55,
      speed: dp.ring0Speed ?? 0.012,
      bandWidth: 0.38,
      color: '#ffffff',
      opacity: dp.ring0Opacity ?? 0.85,
      fontSize: dp.ring0FontSize ?? 56,
      phrase: 'THE MARKETPLACE THAT LIVES',
    },
    {
      radius: dp.ring1Radius ?? 2.55,
      tilt: -0.12,
      yOffset: dp.ring1YOffset ?? -0.15,
      speed: dp.ring1Speed ?? -0.018,
      bandWidth: 0.30,
      color: '#d946ef',
      opacity: dp.ring1Opacity ?? 0.75,
      fontSize: dp.ring1FontSize ?? 48,
      phrase: 'API INFRASTRUCTURE FOR AI AGENTS THAT PAY',
    },
    {
      radius: dp.ring2Radius ?? 2.35,
      tilt: 0.06,
      yOffset: dp.ring2YOffset ?? -0.65,
      speed: dp.ring2Speed ?? 0.035,
      bandWidth: 0.24,
      color: '#22d3ee',
      opacity: dp.ring2Opacity ?? 0.68,
      fontSize: dp.ring2FontSize ?? 36,
      phrase: cyanText,
    },
  ], [cyanText, dp.ring0Radius, dp.ring0Speed, dp.ring0FontSize, dp.ring0Opacity, dp.ring0YOffset,
       dp.ring1Radius, dp.ring1Speed, dp.ring1FontSize, dp.ring1Opacity, dp.ring1YOffset,
       dp.ring2Radius, dp.ring2Speed, dp.ring2FontSize, dp.ring2Opacity, dp.ring2YOffset])

  // Canvas textures — mathematical tile repetition (no overlap or corruption)
  const ringTextures = useMemo(() =>
    ringsConfig.map(ring => {
      const canvas = document.createElement('canvas')
      canvas.width = 2048
      canvas.height = 120
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const font = `900 ${ring.fontSize}px 'JetBrains Mono', 'Fira Code', monospace`
      ctx.font = font
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'

      const phraseW = ctx.measureText(ring.phrase).width
      // Generous spacing so phrases never collide
      const gap = Math.max(160, phraseW * 0.45)
      const stride = phraseW + gap

      // PASS 1: Soft glow
      ctx.shadowBlur = 10
      ctx.shadowColor = ring.color
      ctx.fillStyle = ring.color
      ctx.globalAlpha = 0.3
      for (let x = 0; x < canvas.width + stride; x += stride) {
        ctx.fillText(ring.phrase, x, canvas.height / 2)
      }

      // PASS 2: Crisp solid core text
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1.0
      ctx.fillStyle = '#ffffff'
      for (let x = 0; x < canvas.width + stride; x += stride) {
        ctx.fillText(ring.phrase, x, canvas.height / 2)
      }

      ctx.globalAlpha = 1
      const tex = new THREE.CanvasTexture(canvas)
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.ClampToEdgeWrapping
      tex.repeat.set(1, 1)
      tex.anisotropy = 4
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      return tex
    })
  , [ringsConfig])

  const [hoveredRing, setHoveredRing] = useState(null)

  useFrame((state, delta) => {
    if (groupRef.current) {
      ringsConfig.forEach((ring, i) => {
        const ringGroup = groupRef.current.children[i]
        if (ringGroup) {
          const paused = hoveredRing === i
          if (!paused) ringGroup.rotation.y += delta * ring.speed
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {ringsConfig.map((ring, ringIdx) => (
        <group key={ringIdx} position={[0, ring.yOffset, 0]} rotation={[ring.tilt, 0, 0]}>
          <mesh
            onPointerOver={(e) => { e.stopPropagation(); setHoveredRing(ringIdx); document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { setHoveredRing(null); document.body.style.cursor = 'auto' }}
            onClick={() => {}}
          >
            <cylinderGeometry args={[ring.radius, ring.radius, ring.bandWidth, 128, 1, true]} />
            <shaderMaterial
              uniforms={{
                uMap: { value: ringTextures[ringIdx] },
                uOpacity: { value: ring.opacity },
              }}
              vertexShader={`
                varying vec2 vUv;
                void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `}
              fragmentShader={`
                uniform sampler2D uMap;
                uniform float uOpacity;
                varying vec2 vUv;
                void main() {
                  vec4 texColor = texture2D(uMap, vUv);
                  float faceFactor = gl_FrontFacing ? 1.0 : 0.05; // backface nearly invisible — no shadows
                  gl_FragColor = vec4(texColor.rgb, texColor.a * uOpacity * faceFactor);
                }
              `}
              transparent
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// === OUTER HALO ===
function OuterHalo() {
  const uniforms = useMemo(() => ({
    colorA: { value: new THREE.Color(0xa855f7) },
    colorB: { value: new THREE.Color(0xd946ef) },
  }), [])
  return (
    <mesh scale={1.4}>
      <sphereGeometry args={[2.2, 24, 18]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal; varying vec3 vWorldPos;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vNormal; varying vec3 vWorldPos;
          uniform vec3 colorA; uniform vec3 colorB;
          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
            vec3 col = mix(colorA, colorB, 0.15);
            gl_FragColor = vec4(col, fresnel * 0.05);
          }
        `}
        side={THREE.BackSide} transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// === UNIFIED HALO — fusión de OuterHalo + AtmosphereGlow para performance ===
// Un solo mesh con shader unificado: fresnel + pulse + wave. Un draw call menos.
function UnifiedHalo() {
  const uniforms = useMemo(() => ({
    colorA: { value: new THREE.Color(0x22d3ee) },
    colorB: { value: new THREE.Color(0xa855f7) },
    colorC: { value: new THREE.Color(0xd946ef) },
  }), [])
  return (
    <mesh>
      <sphereGeometry args={[2.65, 28, 20]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vPos; varying vec3 vNormal; varying vec3 vWorldPos;
          void main() {
            vPos = position;
            vNormal = normalize(normalMatrix * normal);
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vPos; varying vec3 vNormal; varying vec3 vWorldPos;
          uniform vec3 colorA; uniform vec3 colorB; uniform vec3 colorC;
          void main() {
            float dist = length(vPos) / 2.65;
            float radial = pow(1.0 - dist, 2.0);
            float polar = pow(abs(vPos.y / 2.65), 2.0);
            vec3 col = mix(colorA, colorB, 0.15);
            col += polar * vec3(0.2, 0.08, 0.35) * 0.5;
            float alpha = radial * 0.10 * (1.0 + polar * 0.8);
            alpha *= smoothstep(1.0, 0.3, dist);
            gl_FragColor = vec4(col, alpha);
          }
        `}
        side={THREE.FrontSide} transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// === INNER CORE ===
function InnerCore() {
  return (
    <mesh scale={0.85}>
      <sphereGeometry args={[2.2, 32, 32]} />
      <shaderMaterial
        vertexShader={`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vNormal;
          void main() {
            float rim = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1))), 2.0);
            vec3 col = vec3(0.659, 0.333, 0.969);
            gl_FragColor = vec4(col, rim * 0.04);
          }
        `}
        side={THREE.FrontSide} transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// === WIREFRAME — fully static, no pulse, no color flicker ===
function VisibleWireframe() {
  const ref = useRef()

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2.2, 36, 24]} />
      <shaderMaterial
        vertexShader={`
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vPos;

          float polarGlow(vec3 pos) {
            return pow(abs(pos.y / 2.2), 2.5) * 0.6;
          }

          void main() {
            // STATIC: no time uniform, no sin(), no pulse — fixed color
            float fade = smoothstep(0.0, 0.3, abs(vPos.y));

            vec3 staticColor = vec3(0.0, 0.72, 0.92); // fixed cyan, no purple shift

            float polar = polarGlow(vPos);
            vec3 col = staticColor;
            col += polar * vec3(0.12, 0.06, 0.25);

            float alpha = (0.18 + polar * 0.08) * fade;
            gl_FragColor = vec4(col, alpha);
          }
        `}
        wireframe transparent depthWrite={true}
      />
    </mesh>
  )
}

// === PULSAR CORE — tiny ambient particles near the nucleus ===
// Reduced to 10 dim particles — user reported aggressive destellos
function PulsarCore({ gasUniforms }) {
  const COUNT = 10
  const ref = useRef()
  const elapsed = useRef(0)

  const state = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const seed = new Float32Array(COUNT * 3) // speedX, speedY, speedZ
    const col = new Float32Array(COUNT * 3)
    const sz = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 0.2 + Math.random() * 0.4
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta) * 1.8
      pos[i*3+1] = r * Math.cos(phi) * 0.6
      pos[i*3+2] = r * Math.sin(phi) * Math.sin(theta) * 0.8
      seed[i*3]   = 1.0 + Math.random() * 2.5
      seed[i*3+1] = 0.8 + Math.random() * 2.0
      seed[i*3+2] = 1.0 + Math.random() * 2.5
      // Very dim cyan — no white-hot
      col[i*3] = 0.1; col[i*3+1] = 0.5; col[i*3+2] = 0.7
      sz[i] = 0.012 + Math.random() * 0.015 // much smaller
    }
    return { positions: pos, seeds: seed, colors: col, sizes: sz }
  }, [])

  useFrame((_, delta) => {
    elapsed.current += delta
    const t = elapsed.current
    const pos = ref.current?.geometry?.attributes?.position?.array
    if (!pos) return
    for (let i = 0; i < COUNT; i++) {
      const sx = state.seeds[i*3]
      const sy = state.seeds[i*3+1]
      const sz = state.seeds[i*3+2]
      // Very subtle vibration (reduced from 0.05 to 0.015)
      pos[i*3]   = state.positions[i*3]   + Math.sin(t * sx + i * 0.7) * 0.015
      pos[i*3+1] = state.positions[i*3+1] + Math.cos(t * sy + i * 1.1) * 0.012
      pos[i*3+2] = state.positions[i*3+2] + Math.sin(t * sz + i * 0.9) * 0.015
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref} renderOrder={2}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[state.positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[state.colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[state.sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        uniforms={gasUniforms}
        vertexShader={`
          attribute float aSize; attribute vec3 aColor;
          varying vec3 vColor; varying float vAlpha;
          void main() {
            vColor = aColor;
            vAlpha = 1.0;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (180.0 / -mv.z); // smaller size multiplier
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          varying vec3 vColor; varying float vAlpha;
          void main() {
            vec2 uv = gl_PointCoord * 2.0 - 1.0;
            float d = abs(uv.x) + abs(uv.y) * 0.5;
            if (d > 1.0) discard;
            float glow = pow(1.0 - d, 3.0); // softer falloff
            float core = pow(1.0 - d, 8.0); // tinier core
            vec3 col = mix(vColor, vec3(1.0), core * 0.3); // less white
            col += vec3(0.2, 0.4, 0.6) * glow * 0.2; // dimmer accent
            gl_FragColor = vec4(col, glow * vAlpha * 0.35); // much dimmer
          }
        `}
        transparent depthWrite={false} blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}

// === BASE CORE — estrella viva de la esfera de Dyson ===
// El núcleo BASE pulsa: respiración continua + latido en cada ráfaga de flujo.
// flowRef: { intensity (0.6–1.8), pulse (0–1) } — lo escribe el ticker de flujo ≤500ms.
function BaseCore({ flowRef }) {
  const groupRef = useRef()
  const elapsed = useRef(0)
  const { params: dp } = useDesign() || { params: {} }

  // Base 3D Logo: Built with precision box geometry primitives for 100% flawless alignment
  const baseLogoBlocks = useMemo(() => {
    const s = dp.logoSize ?? 0.22        // block size from design panel
    const g = dp.logoGap ?? 0.05         // gap from design panel
    const d = 0.07        // depth

    const totalW = 4 * s + 3 * g
    const startX = -totalW / 2 + s / 2
    const tabSize = s * 0.42

    return {
      size: [s, s, d],
      lMainPos: [startX, s / 2, 0],
      lTabPos: [startX - s / 2 + tabSize / 2, s - tabSize / 2, 0],
      tabSize: [tabSize, tabSize, d],
      squares: [
        { pos: [startX + (s + g), s / 2, 0] },
        { pos: [startX + 2 * (s + g), s / 2, 0] },
        { pos: [startX + 3 * (s + g), s / 2, 0] },
      ],
    }
  }, [dp.logoSize, dp.logoGap])

  useFrame((state, delta) => {
    elapsed.current += delta
    const flow = flowRef?.current || { intensity: 1, pulse: 0.3 }
    flow.pulse = Math.max(0.25, (flow.pulse || 0) - delta * 1.6)
    if (groupRef.current) {
      // Parallax: núcleo suspendido, no pegado a la malla
      groupRef.current.rotation.y = elapsed.current * 0.08
      groupRef.current.rotation.x = Math.sin(elapsed.current * 0.12) * 0.08

      // BREATHING: respiración orgánica + design panel controls
      const breath = Math.sin(elapsed.current * 1.5)
      const breathY = Math.sin(elapsed.current * 0.9) * (dp.coreBreathing ?? 0.03)
      const beat = 0
      const sc = dp.coreScale ?? 1.3
      const s = sc * (1 + 0.03 * breath + 0.08 * beat)
      groupRef.current.scale.set(s, s, s)
      groupRef.current.position.y = breathY

      // 3D Logo materials — subtle opacity pulse for solid blocks
      const logoGroup = groupRef.current.children[0]
      if (logoGroup?.isGroup) {
        logoGroup.children.forEach(child => {
          if (child?.material) {
            child.material.opacity = 1.0
          }
        })
      }
    }
  })

  // Gas — ultra-subtle ambient glow, no aggressive swirl
  const gasUniforms = useMemo(() => ({ time: { value: 0 }, flow: { value: 1 } }), [])
  useFrame((_, delta) => {
    gasUniforms.time.value += delta * (dp.gasSpeed ?? 0.08)
    gasUniforms.flow.value = flowRef?.current?.intensity || 1
  })

  return (
    <group ref={groupRef} scale={1.3}>
      {/* Fog interior: nebulosa volumétrica — CYAN GLOW, dentro del wireframe */}
      <mesh renderOrder={0}>
        <sphereGeometry args={[1.5, 24, 18]} />
        <shaderMaterial
          uniforms={gasUniforms}
          vertexShader={`varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`
            varying vec3 vPos; uniform float time; uniform float flow;
            void main(){
              float dist = length(vPos) / 1.5;
              float fog1 = pow(1.0 - dist, 2.0) * pow(dist, 0.4) * 1.5;
              float fog2 = pow(1.0 - dist, 0.8) * 0.4;
              float fog = fog1 + fog2;
              float swirl = sin(vPos.x*3.0+time*0.2)*sin(vPos.y*2.5+time*0.15)*sin(vPos.z*2.0+time*0.18);
              float turbulence = 0.7 + 0.15 * swirl; // barely moves
              vec3 col = mix(vec3(0.0,0.25,0.8), vec3(0.0,0.6,0.9), dist*0.5);
              float alpha = fog * turbulence * ${(dp.gasAlpha ?? 0.12).toFixed(3)} * (0.5 + 0.5*flow);
              gl_FragColor = vec4(col, alpha);
            }`}
           transparent depthWrite={false} blending={THREE.NormalBlending} side={THREE.BackSide}
        />
      </mesh>
      {/* Nebula envelope: gas fino envolvente — CYAN GLOW */}
      <mesh renderOrder={1}>
        <sphereGeometry args={[1.2, 20, 14]} />
        <shaderMaterial
          uniforms={gasUniforms}
          vertexShader={`varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`
            varying vec3 vPos; uniform float time; uniform float flow;
            void main(){
              float dist = length(vPos) / 1.2;
              float radial = pow(1.0 - dist, 2.5);
              float swirl = sin(vPos.x*3.0+time*0.25)*sin(vPos.y*2.5+time*0.2)*sin(vPos.z*2.0+time*0.22);
              float tendrils = 0.7 + 0.15 * swirl; // barely moves
              float noise = tendrils * 0.7 + 0.3;
              vec3 col = mix(vec3(0.0,0.3,0.8), vec3(0.0,0.7,0.9), noise*0.3);
              float alpha = radial * noise * ${(dp.gasAlpha ?? 0.12).toFixed(3)} * (0.4 + 0.6*flow);
              alpha *= smoothstep(1.0, 0.15, dist);
              gl_FragColor = vec4(col, alpha);
            }`}
           transparent depthWrite={false} blending={THREE.NormalBlending} side={THREE.FrontSide}
        />
      </mesh>
      {/* BASE Logo built with primitive boxes for 100% precise baseline alignment */}
      <group renderOrder={-1} position={[0, dp.logoY ?? -0.1, 0]}>
        {/* L-Shape Main vertical block */}
        <mesh position={baseLogoBlocks.lMainPos}>
          <boxGeometry args={baseLogoBlocks.size} />
          <meshBasicMaterial color={dp.logoColor ?? '#0052FF'} transparent opacity={0.95} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
        {/* L-Shape Top-left Tab */}
        <mesh position={baseLogoBlocks.lTabPos}>
          <boxGeometry args={baseLogoBlocks.tabSize} />
          <meshBasicMaterial color={dp.logoColor ?? '#0052FF'} transparent opacity={0.95} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
        {/* 3 Square blocks */}
        {baseLogoBlocks.squares.map((block, i) => (
          <mesh key={i} position={block.pos}>
            <boxGeometry args={baseLogoBlocks.size} />
            <meshBasicMaterial color={dp.logoColor ?? '#0052FF'} transparent opacity={0.95} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
        {/* "BASE" label below the logo blocks */}
        <sprite position={[0, -0.22, 0]} scale={[0.45, 0.1, 1]}>
          <spriteMaterial
            map={(() => {
              const c = document.createElement('canvas')
              c.width = 256; c.height = 64
              const ctx = c.getContext('2d')
              ctx.clearRect(0, 0, 256, 64)
              ctx.font = "bold 38px 'JetBrains Mono', monospace"
              ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
              ctx.shadowColor = '#0052FF'; ctx.shadowBlur = 8
              ctx.fillStyle = '#0052FF'
              ctx.globalAlpha = 0.9
              ctx.fillText('BASE', 128, 32)
              const tex = new THREE.CanvasTexture(c)
              tex.minFilter = THREE.LinearFilter
              return tex
            })()}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      </group>
      {/* PULSAR CORE: cluster de partículas vibrantes que dan forma al núcleo */}
      <PulsarCore gasUniforms={gasUniforms} />
      {/* BASE galaxia: núcleo denso pequeño con swirl — se diluye en la malla */}
      <mesh>
        <sphereGeometry args={[0.38, 32, 24]} />
        <shaderMaterial
          uniforms={gasUniforms}
          vertexShader={`varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`
            varying vec3 vPos; uniform float time; uniform float flow;
            void main(){
              float dist = length(vPos) / 0.38;
              float radial = pow(1.0 - dist, 3.0);
              float swirl = sin(vPos.x*8.0+time*0.4)*sin(vPos.y*6.0+time*0.25)*sin(vPos.z*5.0+time*0.3);
              float noise = 0.7 + 0.3*swirl;
              vec3 deepBlue = vec3(0.0,0.2,0.85);
              vec3 coreCyan = vec3(0.0,0.65,1.0);
              vec3 col = mix(deepBlue, coreCyan, (1.0-dist)*0.6 + noise*0.15);
              col += vec3(0.05,0.25,0.35) * (1.0-dist) * 0.4;
              float alpha = radial * 0.85 * noise * (0.75 + 0.25*flow);
              alpha *= smoothstep(1.0, 0.5, dist);
              gl_FragColor = vec4(col, alpha);
            }`}
           transparent depthWrite={false} blending={THREE.NormalBlending} side={THREE.FrontSide}
        />
      </mesh>
      {/* Gas 2: manto medio — bright cyan→blue */}
      <mesh>
        <sphereGeometry args={[0.62, 24, 18]} />
        <shaderMaterial
          uniforms={gasUniforms}
          vertexShader={`varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`
            varying vec3 vPos; uniform float time; uniform float flow;
            void main(){
              float dist = length(vPos) / 0.62;
              float radial = pow(1.0 - dist, 2.4);
              vec3 col = mix(vec3(0.0,0.7,1.0), vec3(0.12,0.5,0.9), dist*0.5);
              float alpha = radial * 0.35 * (0.7+0.35*flow);
              alpha *= smoothstep(1.0, 0.4, dist);
              gl_FragColor = vec4(col, alpha);
            }`}
           transparent depthWrite={false} blending={THREE.NormalBlending} side={THREE.FrontSide}
        />
      </mesh>
      {/* Gas 3: velo galaxia exterior */}
      <mesh>
        <sphereGeometry args={[0.88, 16, 12]} />
        <shaderMaterial
          uniforms={gasUniforms}
          vertexShader={`varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`
            varying vec3 vPos; uniform float time;
            void main(){
              float dist = length(vPos) / 0.88;
              float radial = pow(1.0 - dist, 3.2);
              vec3 col = mix(vec3(0.0,0.6,1.0), vec3(0.12,0.8,0.75), dist*0.4);
              float alpha = radial * 0.20;
              alpha *= smoothstep(1.0, 0.3, dist);
              gl_FragColor = vec4(col, alpha);
            }`}
           transparent depthWrite={false} blending={THREE.NormalBlending} side={THREE.FrontSide}
        />
      </mesh>
      {/* Aura intermedia 3D: entre gas y malla */}
      <mesh>
        <sphereGeometry args={[1.45, 20, 16]} />
        <shaderMaterial
          uniforms={gasUniforms}
          vertexShader={`varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`
            varying vec3 vPos; uniform float time;
            void main(){
              float dist = length(vPos) / 1.45;
              float radial = pow(1.0 - dist, 2.0) * pow(dist, 0.3);
              float phase = sin(time*0.2 + 2.0)*0.5+0.5;
              vec3 col = mix(vec3(0.0,0.55,0.95), vec3(0.12,0.75,0.8), dist*0.5+phase*0.10);
              float alpha = radial * 0.10;
              gl_FragColor = vec4(col, alpha);
            }`}
           transparent depthWrite={false} blending={THREE.NormalBlending} side={THREE.FrontSide}
        />
      </mesh>
    </group>
  )
}

// === PULSAR ENGINE — REMOVED (no sparks) ===
// === COSMIC DUST FIELD + NEBULA CLOUDS — profundidad 3D real ===
// Polvo fino disperso + nubes de nebulosa flotantes en 3D alrededor de la esfera Dyson.
function CosmicDustField() {
  const COUNT = 200 // Optimized from 350 — still ambient, less GPU
  const NEBULA_COUNT = 6
  const ref = useRef()
  const nebulaRef = useRef([])
  const elapsed = useRef(0)

  const state = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const col = new Float32Array(COUNT * 3)
    const sz = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      // Fuera de la esfera Dyson (r > 4.8) — NUNCA la ocultan
      const r = 4.8 + Math.random() * 12.0
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i*3+2] = r * Math.cos(phi)
      const t = Math.random()
      if (t < 0.5) { col[i*3]=0.0; col[i*3+1]=0.85; col[i*3+2]=1.0 }      // cian vivo
      else if (t < 0.8) { col[i*3]=0.0; col[i*3+1]=0.4; col[i*3+2]=1.0 }   // azul base
      else { col[i*3]=0.1; col[i*3+1]=0.9; col[i*3+2]=0.7 }                // verde-teal
      sz[i] = 0.012 + Math.random() * 0.02
    }
    return { positions: pos, colors: col, sizes: sz }
  }, [])

  // Nebula cloud data: 3D positions + sizes + colors (fuera de la esfera Dyson: r > 5.5)
  const nebulaData = useMemo(() => {
    return Array.from({ length: NEBULA_COUNT }, () => {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 5.5 + Math.random() * 8.5
      const hue = Math.random()
      let color
      if (hue < 0.4) color = [0.0, 0.82, 1.0]          // cian vivo
      else if (hue < 0.7) color = [0.0, 0.45, 0.95]    // azul base
      else color = [0.1, 0.88, 0.72]                   // verde-teal
      return {
        position: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ],
        scale: 1.8 + Math.random() * 2.5,
        color,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        bobSpeed: 0.1 + Math.random() * 0.2,
        bobAmp: 0.2 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2
      }
    })
  }, [])

  useFrame((_, delta) => {
    elapsed.current += delta
    if (ref.current) {
      ref.current.rotation.y = elapsed.current * 0.008
    }
    nebulaRef.current.forEach((mesh, i) => {
      if (!mesh) return
      const nd = nebulaData[i]
      const t = elapsed.current
      mesh.position.x = nd.position[0] + Math.sin(t * nd.rotSpeed + nd.phase) * nd.bobAmp
      mesh.position.y = nd.position[1] + Math.cos(t * nd.bobSpeed + nd.phase) * nd.bobAmp * 0.6
      mesh.position.z = nd.position[2] + Math.sin(t * nd.rotSpeed * 0.7 + nd.phase * 1.3) * nd.bobAmp * 0.4
    })
  })

  return (
    <group ref={ref}>
      {/* Dust particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[state.positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[state.colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[state.sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={`
            attribute float aSize; attribute vec3 aColor; varying vec3 vColor;
            void main() {
              vColor = aColor;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = aSize * (350.0 / -mv.z);
              gl_Position = projectionMatrix * mv;
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            void main() {
              float d = length(gl_PointCoord - vec2(0.5));
              if (d > 0.5) discard;
              float g = pow(1.0 - d * 2.0, 1.8);
              gl_FragColor = vec4(vColor, g * 0.2);
            }
          `}
          transparent depthWrite={false} blending={THREE.AdditiveBlending}
        />
      </points>
      {/* Nebula clouds: 3D billboards floating in space */}
      {nebulaData.map((nd, i) => (
        <mesh
          key={i}
          ref={el => nebulaRef.current[i] = el}
          position={nd.position}
        >
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            uniforms={{
              color: { value: new THREE.Color(nd.color[0], nd.color[1], nd.color[2]) },
              scaleVal: { value: nd.scale }
            }}
            vertexShader={`
              uniform float scaleVal;
              varying vec2 vUv;
              void main() {
                vUv = uv;
                vec4 mvPos = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
                mvPos.xy += (uv - 0.5) * scaleVal;
                gl_Position = projectionMatrix * mvPos;
              }
            `}
            fragmentShader={`
              uniform vec3 color;
              varying vec2 vUv;
              void main() {
                vec2 center = vUv - 0.5;
                float dist = length(center);
                // ESTRICTO MÁSCARA CIRCULAR: obliga a alpha 0.0 antes de dist = 0.45
                float edgeMask = smoothstep(0.45, 0.12, dist);
                float radial = pow(max(0.0, 1.0 - dist * 2.1), 2.2);
                float turb = sin(vUv.x * 12.0) * sin(vUv.y * 10.0) * 0.25 + 0.75;
                float alpha = radial * turb * 0.10 * edgeMask;
                if (alpha < 0.002) discard;
                gl_FragColor = vec4(color, alpha);
              }
            `}
             transparent depthWrite={false} blending={THREE.NormalBlending} side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// === ENERGY PARTICLES — operaciones reales: núcleo → borde interno ===
// Cada partícula nace en el núcleo BASE y muere al tocar la cáscara (Dyson:
// la energía se absorbe, nada cruza hacia afuera). El flujo se modula con
// flowRef (ticker ≤500ms derivado de USDC/mercado): intensidad, velocidad,
// tamaño y color (verde USDC vs azul→púrpura mercado). 36 pts para 60fps.
function EnergyParticles({ liveData, onImpact, flowRef }) {
  const PARTICLE_COUNT = 20 // reduced from 35 to cut destellos
  const elapsed = useRef(0)
  const pointsRef = useRef()
  const WIRE_RADIUS = 2.2
  const WIRE_RADIUS_SQ = WIRE_RADIUS * WIRE_RADIUS

  // Erupción solar: nace EXACTO del sprite, velocidad para llegar al borde en ~1.2s
  const spawnVelocity = (out) => {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const flow = Math.max(0.5, Math.min(1.8, flowRef?.current?.intensity || 1))
    const speed = (1.6 + Math.random() * 1.0) * (0.9 + 0.3 * flow)
    out[0] = Math.sin(phi) * Math.cos(theta) * speed
    out[1] = Math.sin(phi) * Math.sin(theta) * speed
    out[2] = Math.cos(phi) * speed
  }

  // Partículas visibles: estrictamente cian y azul base, perfectamente perceptibles
  const paintKind = (col, sz, i) => {
    if (Math.random() < 0.5) {
      col[i * 3] = 0.0; col[i * 3 + 1] = 0.85; col[i * 3 + 2] = 1.0 // cian vivo
      sz[i] = 0.04 + Math.random() * 0.03
    } else {
      col[i * 3] = 0.0; col[i * 3 + 1] = 0.4; col[i * 3 + 2] = 1.0  // azul base
      sz[i] = 0.035 + Math.random() * 0.03
    }
  }

  const state = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const vel = new Float32Array(PARTICLE_COUNT * 3)
    const col = new Float32Array(PARTICLE_COUNT * 3)
    const sz = new Float32Array(PARTICLE_COUNT)
    const life = new Float32Array(PARTICLE_COUNT)
    const maxLife = new Float32Array(PARTICLE_COUNT)
    const hit = new Uint8Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Nace pegado al sprite (radio 0.08)
      const r0 = Math.random() * 0.08
      const th0 = Math.random() * Math.PI * 2
      const ph0 = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r0 * Math.sin(ph0) * Math.cos(th0)
      pos[i * 3 + 1] = r0 * Math.sin(ph0) * Math.sin(th0)
      pos[i * 3 + 2] = r0 * Math.cos(ph0)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = 1.6 + Math.random() * 1.0
      vel[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed
      vel[i * 3 + 2] = Math.cos(phi) * speed
      paintKind(col, sz, i)
      life[i] = Math.random() * 1.5
      maxLife[i] = 1.8 + Math.random() * 0.8
    }
    return { positions: pos, velocities: vel, colors: col, sizes: sz, lifetimes: life, maxLifetimes: maxLife, hit }
  }, [])

  const uniforms = useMemo(() => ({ time: { value: 0 }, flow: { value: 1 } }), [])

  // Burst: cuando pulse === 1 (nuevo bloque) lanzar ráfaga
  const lastBurst = useRef(0)
  useFrame((context, delta) => {
    elapsed.current += delta
    uniforms.time.value = elapsed.current
    const flow = Math.max(0.5, Math.min(1.8, flowRef?.current?.intensity || 1))
    uniforms.flow.value = flow
    const isBurst = flowRef?.current?.pulse > 0.95 && elapsed.current - lastBurst.current > 1.2
    if (isBurst) lastBurst.current = elapsed.current
    const { positions, velocities, colors, sizes, lifetimes, maxLifetimes, hit } = state
    const tmp = [0, 0, 0]
    let visualsDirty = false
    let burstCount = isBurst ? 2 : 0
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      lifetimes[i] += delta
      // Burst fuerza respawn inmediato en varias partículas
      const forceRespawn = burstCount > 0 && lifetimes[i] > 0.15
      if (lifetimes[i] >= maxLifetimes[i] || forceRespawn) {
        if (forceRespawn) burstCount--
        const rr = Math.random() * 0.08
        const tth = Math.random() * Math.PI * 2
        const pph = Math.acos(2 * Math.random() - 1)
        positions[i * 3] = rr * Math.sin(pph) * Math.cos(tth)
        positions[i * 3 + 1] = rr * Math.sin(pph) * Math.sin(tth)
        positions[i * 3 + 2] = rr * Math.cos(pph)
        spawnVelocity(tmp)
        velocities[i * 3] = tmp[0]
        velocities[i * 3 + 1] = tmp[1]
        velocities[i * 3 + 2] = tmp[2]
        paintKind(colors, sizes, i)
        visualsDirty = true
        lifetimes[i] = 0
        maxLifetimes[i] = 1.8 + Math.random() * 0.8
        hit[i] = 0
        continue
      }
      // Difuminar al acercarse al borde: desacelerar y expandir
      const d = Math.sqrt(positions[i * 3]*positions[i * 3]+positions[i * 3+1]*positions[i * 3+1]+positions[i * 3+2]*positions[i * 3+2])
      const nearEdge = d > 1.6 ? (d - 1.6) / 0.6 : 0
      if (nearEdge > 0) {
        velocities[i * 3] *= (1 - nearEdge * 0.08)
        velocities[i * 3 + 1] *= (1 - nearEdge * 0.08)
        velocities[i * 3 + 2] *= (1 - nearEdge * 0.08)
        sizes[i] = sizes[i] * (1 + nearEdge * 0.8)
      }
      positions[i * 3] += velocities[i * 3] * delta
      positions[i * 3 + 1] += velocities[i * 3 + 1] * delta
      positions[i * 3 + 2] += velocities[i * 3 + 2] * delta

      // Choque EXACTO contra borde interno Dyson (r=2.2) — clamp a superficie y difumina
      const distSq = positions[i * 3] * positions[i * 3]
                    + positions[i * 3 + 1] * positions[i * 3 + 1]
                    + positions[i * 3 + 2] * positions[i * 3 + 2]
      if (distSq >= WIRE_RADIUS_SQ) {
        if (!hit[i]) {
          hit[i] = 1
          // Clamp exacto a la superficie interna
          const d = Math.sqrt(distSq)
          const s = WIRE_RADIUS / d
          positions[i * 3] *= s
          positions[i * 3 + 1] *= s
          positions[i * 3 + 2] *= s
          velocities[i * 3] = 0; velocities[i * 3 + 1] = 0; velocities[i * 3 + 2] = 0
          if (onImpact) {
            onImpact({
              position: new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]),
              intensity: 1.0
            })
          }
          // Vida suficiente para disiparse VISIBLE en la red (no desaparecer de golpe)
          lifetimes[i] = maxLifetimes[i] - 0.8
        } else {
          // Ya impactada: se desvanece RÁPIDO contra la malla (NO crecer)
          sizes[i] *= 0.92  // shrink, not grow — prevents flash explosion
          // No se mueve más
        }
      }
    }
    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true
      if (visualsDirty) {
        pointsRef.current.geometry.attributes.aColor.needsUpdate = true
        pointsRef.current.geometry.attributes.aSize.needsUpdate = true
      }
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[state.positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[state.colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[state.sizes, 1]} />
      </bufferGeometry>
        <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          attribute float aSize; attribute vec3 aColor;
          varying vec3 vColor; varying float vAlpha; uniform float time; uniform float flow;
          void main() {
            vColor = aColor;
            float dist = length(position);
            float travel = clamp(dist / 2.2, 0.0, 1.0);
            // PARTS visible through entire journey — fade gently at edge, don't vanish
            float edgeFade = 1.0 - smoothstep(0.5, 0.95, travel) * 0.6;
            vAlpha = 0.5 * (0.8 + 0.15 * flow) * edgeFade; // reduced from 0.8
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float sz = aSize * (1.0 + travel * 0.3);
            gl_PointSize = sz * (1.0 + 0.3 * flow) * (220.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          varying vec3 vColor; varying float vAlpha;
          void main() {
            vec2 uv = gl_PointCoord * 2.0 - 1.0;
            float r = length(uv);
            if (r > 1.0) discard; // Strict circular boundary — NO SQUARES

            float ax = abs(uv.x);
            float ay = abs(uv.y);
            float spikeX = smoothstep(0.18, 0.0, ay) * pow(1.0 - ax, 2.0);
            float spikeY = smoothstep(0.18, 0.0, ax) * pow(1.0 - ay, 2.0);
            float starCross = max(spikeX, spikeY);

            float centerGlow = pow(1.0 - r, 3.0);
            float hotCore = pow(1.0 - r, 8.0);
            vec3 hotColor = mix(vColor, vec3(1.0), hotCore * 0.5);
            float alpha = (starCross * 0.15 + centerGlow * 0.2) * vAlpha; // reduced from 0.3+0.3

            gl_FragColor = vec4(hotColor, alpha);
          }
        `}
        transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// === AGENT NODES — 60 endpoints (optimizado 100→60 para 60fps) ===
function AgentNodes() {
  const NODE_COUNT = 45 // Optimized from 60
  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(NODE_COUNT * 3)
    const col = new Float32Array(NODE_COUNT * 3)
    const sz = new Float32Array(NODE_COUNT)
    for (let i = 0; i < NODE_COUNT; i++) {
      const phi = Math.acos(-1 + (2 * i) / NODE_COUNT)
      const theta = Math.sqrt(NODE_COUNT * Math.PI) * phi
      const r = 2.35
      pos[i * 3] = r * Math.cos(theta) * Math.sin(phi)
      pos[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi)
      pos[i * 3 + 2] = r * Math.cos(phi)
      const isFree = i >= 36
      if (isFree) {
        col[i * 3] = 0.133; col[i * 3 + 1] = 0.827; col[i * 3 + 2] = 0.933
      } else {
        const c = new THREE.Color().setHSL(0.75 + Math.random() * 0.1, 0.7, 0.6)
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
      }
      sz[i] = isFree ? 0.09 : 0.055
    }
    return { positions: pos, colors: col, sizes: sz }
  }, [])
  const uniforms = useMemo(() => ({ time: { value: 0 } }), [])
  useFrame((state, delta) => { uniforms.time.value += delta * 1.5 })
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          attribute float aSize; attribute vec3 aColor;
          varying vec3 vColor; varying float vAlpha;
          void main() {
            vColor = aColor;
            vAlpha = 0.6;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (360.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          varying vec3 vColor; varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float glow = pow(1.0 - d * 2.0, 2.0);
            gl_FragColor = vec4(vColor, glow * vAlpha * 0.8);
          }
        `}
        transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// === ORBIT RINGS ===
function OrbitRings() {
  return (
    <group>
      {[
        { radius: 2.5, tilt: Math.PI / 2, color: 0xa855f7, opacity: 0.07 },
        { radius: 2.7, tilt: Math.PI / 2 + 0.18, color: 0x22d3ee, opacity: 0.05 },
        { radius: 2.9, tilt: Math.PI / 2 + 0.35, color: 0xd946ef, opacity: 0.04 },
      ].map((r, i) => (
        <mesh key={i} rotation={[r.tilt, 0, i * 0.3]}>
          <torusGeometry args={[r.radius, 0.005, 8, 160]} />
          <meshBasicMaterial color={r.color} transparent opacity={r.opacity} />
        </mesh>
      ))}
    </group>
  )
}

// === ORBITAL DATA — real x402 metrics orbiting the globe ===
function OrbitalData({ liveData }) {
  const groupRef = useRef()
  const spriteRefs = useRef([])
  const elapsed = useRef(0)
  const [hovered, setHovered] = useState(null)

  const labels = useMemo(() => {
    const d = liveData || {}
    return [
      { text: 'x402', color: '#c084fc', size: 1.2 },
      { text: `#${d.block || '—'}`, color: '#0052FF', size: 0.65 },
      { text: `${d.gas || '—'} gwei`, color: '#c084fc', size: 0.55 },
      { text: d.volume || '$0.00', color: '#d946ef', size: 0.6 },
      { text: 'USDC', color: '#10b981', size: 0.7 },
      { text: 'BASE', color: '#0052FF', size: 0.85 },
    ]
  }, [liveData])

  const textures = useMemo(() =>
    labels.map(l => {
      const canvas = document.createElement('canvas')
      canvas.width = 512; canvas.height = 128
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, 512, 128)
      ctx.font = `bold ${Math.round(l.size * 80)}px monospace`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillStyle = l.color
      ctx.shadowColor = l.color; ctx.shadowBlur = 20
      ctx.fillText(l.text, 256, 64)
      return new THREE.CanvasTexture(canvas)
    })
  , [labels])

  useFrame((state, delta) => {
    elapsed.current += delta
    if (groupRef.current) groupRef.current.rotation.y = elapsed.current * 0.12
    spriteRefs.current.forEach((sprite, i) => {
      if (sprite) {
        const isHovered = hovered === i
        sprite.material.opacity = isHovered ? 0.9 : 0.45
        const targetScale = isHovered ? labels[i].size * 2.4 : labels[i].size * 1.8
        sprite.scale.x += (targetScale - sprite.scale.x) * 0.1
      }
    })
  })

  return (
    <group ref={groupRef}>
      {textures.map((tex, i) => {
        const angle = (i / textures.length) * Math.PI * 2
        const ring = i % 3
        const r = 2.6 + ring * 0.25
        const tilt = 0.12 * ring
        return (
          <sprite
            key={i}
            ref={el => { spriteRefs.current[i] = el }}
            position={[r * Math.cos(angle), r * Math.sin(angle) * Math.sin(tilt), r * Math.sin(angle) * Math.cos(tilt)]}
            scale={[labels[i].size * 1.8, labels[i].size * 0.45, 1]}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(i); document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { setHovered(null); document.body.style.cursor = 'auto' }}
          >
            <spriteMaterial
              map={tex}
              transparent
              blending={THREE.AdditiveBlending}
              opacity={0.35}
              depthWrite={false}
            />
          </sprite>
        )
      })}
    </group>
  )
}

// === DATA STREAM — particles flowing along orbital paths (optimizado 80→50) ===
function DataStream() {
  const groupRef = useRef()
  const uniforms = useMemo(() => ({ time: { value: 0 } }), [])
  const elapsed = useRef(0)
  useFrame((state, delta) => {
    elapsed.current += delta
    uniforms.time.value = elapsed.current
    if (groupRef.current) groupRef.current.rotation.y = elapsed.current * 0.06
  })

  const { positions, colors, sizes } = useMemo(() => {
    const count = 30 // Optimized from 50
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const ring = i % 3
      const r = 2.55 + ring * 0.22
      const tilt = 0.15 * ring
      pos[i * 3] = r * Math.cos(angle)
      pos[i * 3 + 1] = r * Math.sin(angle) * Math.sin(tilt)
      pos[i * 3 + 2] = r * Math.sin(angle) * Math.cos(tilt)
      const t = i / count
      col[i * 3] = 0.659 * (1 - t) + 0.133 * t
      col[i * 3 + 1] = 0.333 * (1 - t) + 0.827 * t
      col[i * 3 + 2] = 0.969 * (1 - t) + 0.933 * t
      sz[i] = 0.015 + Math.random() * 0.025
    }
    return { positions: pos, colors: col, sizes: sz }
  }, [])

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={`
            attribute float aSize; attribute vec3 aColor;
            varying vec3 vColor; varying float vAlpha;
            void main() {
              vColor = aColor;
              vAlpha = 0.5;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = aSize * (280.0 / -mv.z);
              gl_Position = projectionMatrix * mv;
            }
          `}
          fragmentShader={`
            varying vec3 vColor; varying float vAlpha;
            void main() {
              float d = length(gl_PointCoord - vec2(0.5));
              if (d > 0.5) discard;
              float glow = pow(1.0 - d * 2.0, 1.5);
              gl_FragColor = vec4(vColor, glow * vAlpha * 0.7);
            }
          `}
          transparent depthWrite={false} blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

// === IMPACT MANAGER — REMOVED (no sparks) ===
// === COSMIC COMETS — estelas fugaces brutalismo cósmico ===
function CosmicComets() {
  const ref = useRef()
  const elapsed = useRef(0)
  const { positions, colors, sizes } = useMemo(() => {
    const count = 2
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const r = 4 + Math.random() * 2
      pos[i * 3] = r * Math.cos(angle)
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3
      pos[i * 3 + 2] = r * Math.sin(angle)
      // Comet colors: cyan / magenta / amber
      const t = Math.random()
      if (t < 0.4) { col[i * 3] = 0.13; col[i * 3 + 1] = 0.82; col[i * 3 + 2] = 0.93 }
      else if (t < 0.7) { col[i * 3] = 0.84; col[i * 3 + 1] = 0.27; col[i * 3 + 2] = 0.93 }
      else { col[i * 3] = 0.83; col[i * 3 + 1] = 0.66; col[i * 3 + 2] = 0.32 }
      sz[i] = 0.03 + Math.random() * 0.02
    }
    return { positions: pos, colors: col, sizes: sz }
  }, [])
  const uniforms = useMemo(() => ({ time: { value: 0 } }), [])
  useFrame((_, delta) => {
    elapsed.current += delta
    uniforms.time.value = elapsed.current
    if (ref.current) ref.current.rotation.y = elapsed.current * 0.02
    // Comet flicker
    const sz = ref.current?.geometry?.attributes?.aSize
    if (sz) {
      for (let i = 0; i < 2; i++) {
        sz.array[i] = 0.03
      }
      sz.needsUpdate = true
    }
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`attribute float aSize; attribute vec3 aColor; varying vec3 vColor; varying float vAlpha; void main(){vColor=aColor; vAlpha=0.6; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*(500.0/-mv.z); gl_Position=projectionMatrix*mv;}`}
        fragmentShader={`varying vec3 vColor; varying float vAlpha; void main(){ float d=length(gl_PointCoord-vec2(0.5)); if(d>0.5)discard; float g=pow(1.0-d*2.0,1.5); gl_FragColor=vec4(vColor,g*vAlpha);}`}
        transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// === REPUTATION PARTICLES — Partículas de eventos Anchored/BatchAnchored ===
import ReputationParticles from './ReputationParticles'

// === COSMIC UNIVERSE — el universo 3D que rodea la esfera ===
// Cuando giras la esfera, sientes que flota en una dimensión infinita.
// Estrellas lejanas en múltiples capas de profundidad + nubes de nebulosa orgánicas.
function CosmicUniverse() {
  // TWO LAYERED SYSTEMS: distant stars + organic nebula clouds
  // Camera: z=10.5, FOV=40°. Stars must be CLOSER and BIGGER to be visible.
  const STAR_COUNT = 400
  const NEBULA_COUNT = 24
  const groupRef = useRef()
  const nebulaRef = useRef([])
  const elapsed = useRef(0)

  // ─── LAYER 1: Starfield ──────────────────────────────────────────
  // Stars at r=6-28 — CLOSE enough to be visible at FOV=40°
  // Point sizes 0.04-0.12 with 380.0 divisor for clear visibility
  const starState = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3)
    const col = new Float32Array(STAR_COUNT * 3)
    const sz = new Float32Array(STAR_COUNT)
    const rnd = () => Math.random()
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = rnd() * Math.PI * 2
      const phi = Math.acos(2 * rnd() - 1)
      // 3 depth layers visible from FOV 40° at z=10.5:
      // near (6-12): clearly visible, medium (12-20): visible, far (20-28): faint
      const layer = rnd()
      let r, baseSize
      if (layer < 0.45) { r = 6 + rnd() * 6; baseSize = 0.03 }       // near — subtle
      else if (layer < 0.80) { r = 12 + rnd() * 8; baseSize = 0.02 } // medium
      else { r = 20 + rnd() * 8; baseSize = 0.015 }                  // far — dimmest
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i*3+2] = r * Math.cos(phi)
      // Color palette: white, cyan, blue-white, warm accents
      const t = rnd()
      if (t < 0.40) { col[i*3]=0.95; col[i*3+1]=0.97; col[i*3+2]=1.0 }     // bright blue-white
      else if (t < 0.55) { col[i*3]=0.3; col[i*3+1]=0.95; col[i*3+2]=1.0 }  // vivid cyan
      else if (t < 0.68) { col[i*3]=1.0; col[i*3+1]=1.0; col[i*3+2]=1.0 }   // pure white
      else if (t < 0.78) { col[i*3]=0.6; col[i*3+1]=0.8; col[i*3+2]=1.0 }   // soft blue
      else if (t < 0.88) { col[i*3]=0.95; col[i*3+1]=0.35; col[i*3+2]=0.9 } // magenta
      else { col[i*3]=1.0; col[i*3+1]=0.82; col[i*3+2]=0.55 }               // warm gold
      sz[i] = baseSize + rnd() * 0.015
    }
    return { positions: pos, colors: col, sizes: sz }
  }, [])

  // ─── LAYER 2: Nebula clouds as circular point sprites (ZERO square artifacts) ───
  const nebulaPointsState = useMemo(() => {
    const count = 12
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    const noiseParams = new Float32Array(count * 2)
    const rnd = () => Math.random()
    for (let i = 0; i < count; i++) {
      const theta = rnd() * Math.PI * 2
      const phi = Math.acos(2 * rnd() - 1)
      const r = rnd() < 0.65 ? 6 + rnd() * 8 : 14 + rnd() * 9
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i*3+2] = r * Math.cos(phi)

      const palette = rnd()
      let c = [0.0, 0.8, 1.0]
      if (palette < 0.25) c = [0.0, 0.82, 1.0]
      else if (palette < 0.45) c = [0.1, 0.92, 0.7]
      else if (palette < 0.60) c = [0.05, 0.55, 0.95]
      else if (palette < 0.78) c = [0.15, 0.75, 0.88]
      else c = [0.35, 0.15, 0.8]
      col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2]

      sz[i] = 120.0 + rnd() * 140.0
      noiseParams[i*2] = 2.0 + rnd() * 3.0
      noiseParams[i*2+1] = rnd() * 100.0
    }
    return { positions: pos, colors: col, sizes: sz, noise: noiseParams }
  }, [])

  useFrame((_, delta) => {
    elapsed.current += delta
    const t = elapsed.current
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.0018
      groupRef.current.rotation.x = Math.sin(t * 0.0012) * 0.012
    }
  })

  // Shared FBM noise GLSL
  const fbmGLSL = `
    float hash21(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * vnoise(p);
        p = p * 2.1 + vec2(37.0, 17.0);
        a *= 0.5;
      }
      return v;
    }
  `

  return (
    <group ref={groupRef}>
      {/* ─── Starfield ─── */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starState.positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[starState.colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[starState.sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={`
            attribute float aSize;
            attribute vec3 aColor;
            varying vec3 vColor;
            varying float vDist;
            void main() {
              vColor = aColor;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vDist = -mv.z;
              gl_PointSize = aSize * (500.0 / vDist);
              gl_Position = projectionMatrix * mv;
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying float vDist;
            void main() {
              float d = length(gl_PointCoord - vec2(0.5));
              if (d > 0.5) discard;
              float glow = pow(1.0 - d * 2.0, 1.8);
              float core = pow(1.0 - d * 2.0, 8.0);
              vec3 col = vColor + vec3(1.0) * core * 0.4;
              float distFade = clamp(1.0 - (vDist - 6.0) / 30.0, 0.35, 1.0);
              gl_FragColor = vec4(col, glow * distFade);
            }
          `}
          transparent depthWrite={false} blending={THREE.AdditiveBlending}
        />
      </points>

      {/* ─── Nebula clouds as circular point sprites (100% CERO cuadrados) ─── */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nebulaPointsState.positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[nebulaPointsState.colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[nebulaPointsState.sizes, 1]} />
          <bufferAttribute attach="attributes-aNoise" args={[nebulaPointsState.noise, 2]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={`
            attribute float aSize;
            attribute vec3 aColor;
            attribute vec2 aNoise;
            varying vec3 vColor;
            varying vec2 vNoiseParams;
            varying float vDist;
            void main() {
              vColor = aColor;
              vNoiseParams = aNoise;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vDist = -mv.z;
              gl_PointSize = aSize * (400.0 / vDist);
              gl_Position = projectionMatrix * mv;
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying vec2 vNoiseParams;
            varying float vDist;

            ${fbmGLSL}

            void main() {
              vec2 coord = gl_PointCoord - vec2(0.5);
              float dist = length(coord);
              if (dist > 0.5) discard; // Hardware circular clip — ZERO square artifacts!

              float uvDist = dist * 2.0;
              vec2 noiseCoord = coord * vNoiseParams.x + vNoiseParams.y;
              float n = fbm(noiseCoord);

              float warpedDist = uvDist + n * 0.45 - 0.2;
              float radial = pow(max(0.0, 1.0 - warpedDist * 2.0), 2.2);

              float filaments = fbm(noiseCoord * 1.8);
              filaments = smoothstep(0.2, 0.8, filaments);

              float edgeMask = smoothstep(1.0, 0.15, uvDist);
              float alpha = radial * (0.35 + filaments * 0.65) * 0.12 * edgeMask;
              if (alpha < 0.001) discard;

              float distFade = clamp(1.0 - (vDist - 6.0) / 28.0, 0.3, 1.0);
              alpha *= distFade;

              vec3 col = vColor + vec3(filaments * 0.1, n * 0.05, filaments * 0.08);
              gl_FragColor = vec4(col, alpha);
            }
          `}
          transparent depthWrite={false} blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

// === MAIN GLOBE SCENE ===
function GlobeScene({ liveData, paused }) {
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
  }, [])

  const handleImpact = useCallback((pt) => {
    if (window.__aetherius_addImpact) {
      window.__aetherius_addImpact(pt)
    }
  }, [])

  // === FLOW TICKER (≤500ms) — USDC/mercado → intensidad del núcleo ===
  // El endpoint pesado (base-stats) llega cada ~6s; aquí interpolamos una
  // señal rápida cada 400ms para que el flujo NUNCA se congele: el núcleo
  // late y las partículas nacen con el pulso actual. Cambio de bloque = latido.
  const flowRef = useRef({ intensity: 1, pulse: 0.4, block: null })
  useEffect(() => {
    const tick = () => {
      const d = liveData || {}
      const vol = parseFloat(String(d.volume || '').replace(/[^0-9.]/g, '')) || 0
      const gas = parseFloat(String(d.gas || '').replace(/[^0-9.]/g, '')) || 0
      let f = 0.9 + Math.min(vol / 500, 0.5) + Math.min(gas / 50, 0.25) + Math.random() * 0.15
      f = Math.max(0.6, Math.min(1.8, f))
      const cur = flowRef.current
      cur.intensity = f
      if (d.block && d.block !== '—' && d.block !== cur.block) {
        cur.block = d.block
        cur.pulse = 1 // latido: bloque nuevo = ráfaga de operaciones
      } else {
        cur.pulse = Math.max(0.3, (cur.pulse || 0.3) * 0.94)
      }
    }
    tick()
    const id = setInterval(tick, 400)
    return () => clearInterval(id)
  }, [liveData])

  // Memoized Canvas props: fresh inline objects on every render would make R3F
  // re-apply them (camera snap) and fight OrbitControls. Stable identities.
  const cameraProps = useMemo(() => ({ position: [0, 0.3, 10.5], fov: 40 }), [])
  const glProps = useMemo(() => ({ alpha: true, antialias: !isMobile, powerPreference: 'high-performance' }), [isMobile])
  const canvasStyle = useMemo(() => ({ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent' }), [])
  const dprRange = useMemo(() => [1, 1.5], [])

  return (
    <Canvas
      camera={cameraProps}
      gl={glProps}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={canvasStyle}
      dpr={dprRange}
      frameloop={paused ? 'demand' : 'always'}
    >
      <ambientLight intensity={0.05} />
      <group scale={1.3}>
        {/* CAPA 1: Core + Gas (innermost — energy source) */}
        <BaseCore flowRef={flowRef} />
        {/* CAPA 2: Energy particles — flowing from core outward to wireframe */}
        <EnergyParticles liveData={liveData} onImpact={handleImpact} flowRef={flowRef} />
        {/* CAPA 3: Text rings — OUTSIDE wireframe (Saturn-style orbital bands) */}
        <TextBandRings liveData={liveData} />
        {/* CAPA 4: Wireframe DYSON — the Dyson sphere structure */}
        <VisibleWireframe />
        {/* CAPA 5: Outer layers — halo, agents, streams */}
        <UnifiedHalo />
        <InnerCore />
        <AgentNodes />
        <DataStream />
        <ReputationParticles />
      </group>
      {!isMobile && (
        <>
          <CosmicUniverse />
          <Stars radius={12} depth={30} count={350} factor={1.2} saturation={0.15} fade speed={0.12} />
          <Stars radius={8} depth={15} count={180} factor={0.6} saturation={0.2} fade speed={0.08} />
          <Stars radius={20} depth={50} count={80} factor={0.5} saturation={0.1} fade speed={0.05} />
          <CosmicDustField />
          <CosmicComets />
        </>
      )}
      <OrbitControls
        autoRotate autoRotateSpeed={1.0}
        enableZoom={false} enablePan={false}
        enableDamping dampingFactor={0.08}
        rotateSpeed={0.5}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.75}
      />
    </Canvas>
  )
}

export default GlobeScene
