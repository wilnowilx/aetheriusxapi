import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// === OUTER HALO ===
function OuterHalo() {
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    colorA: { value: new THREE.Color(0xa855f7) },
    colorB: { value: new THREE.Color(0xd946ef) },
  }), [])
  useFrame((state) => { uniforms.time.value = state.clock.elapsedTime })
  return (
    <mesh scale={1.4}>
      <sphereGeometry args={[2.2, 32, 32]} />
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
          uniform float time; uniform vec3 colorA; uniform vec3 colorB;
          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
            float pulse = 0.85 + 0.15 * sin(time * 0.4 + vWorldPos.y * 1.2);
            float wave = 0.5 + 0.5 * sin(time * 0.3 + vWorldPos.x * 1.8);
            vec3 col = mix(colorA, colorB, wave * 0.2);
            gl_FragColor = vec4(col, fresnel * pulse * 0.05);
          }
        `}
        side={THREE.BackSide} transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// === ATMOSPHERE GLOW ===
function AtmosphereGlow() {
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    colorA: { value: new THREE.Color(0x22d3ee) },
    colorB: { value: new THREE.Color(0xa855f7) },
  }), [])
  useFrame((state) => { uniforms.time.value = state.clock.elapsedTime })
  return (
    <mesh scale={1.15}>
      <sphereGeometry args={[2.2, 48, 48]} />
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
          uniform float time; uniform vec3 colorA; uniform vec3 colorB;
          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 1.4);
            float pulse = 0.88 + 0.12 * sin(time * 0.8 + vWorldPos.y * 2.0);
            float wave = 0.5 + 0.5 * sin(time * 0.5 + vWorldPos.x * 2.2 + vWorldPos.z * 1.3);
            vec3 col = mix(colorA, colorB, wave * 0.25);
            gl_FragColor = vec4(col, fresnel * pulse * 0.1);
          }
        `}
        side={THREE.BackSide} transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// === INNER CORE ===
function InnerCore() {
  const uniforms = useMemo(() => ({ time: { value: 0 } }), [])
  useFrame((state) => { uniforms.time.value = state.clock.elapsedTime })
  return (
    <mesh scale={0.85}>
      <sphereGeometry args={[2.2, 32, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vNormal; uniform float time;
          void main() {
            float rim = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1))), 2.0);
            float pulse = 0.85 + 0.15 * sin(time * 0.4);
            vec3 col = vec3(0.659, 0.333, 0.969);
            gl_FragColor = vec4(col, rim * pulse * 0.04);
          }
        `}
        side={THREE.FrontSide} transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// === WIREFRAME — visible structure ===
function VisibleWireframe() {
  const ref = useRef()
  const uniforms = useMemo(() => ({ time: { value: 0 } }), [])
  useFrame((state) => { uniforms.time.value = state.clock.elapsedTime })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2.2, 36, 24]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vPos; varying vec3 vWorldPos;
          uniform float time;
          void main() {
            vPos = position;
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vPos; varying vec3 vWorldPos;
          uniform float time;
          void main() {
            float pulse = 0.6 + 0.4 * sin(time * 0.5 + vWorldPos.y * 2.0);
            float fade = smoothstep(0.0, 0.3, abs(vPos.y));
            vec3 col = mix(vec3(0.659, 0.333, 0.969), vec3(0.133, 0.827, 0.933), 0.3 + 0.2 * sin(time * 0.3));
            gl_FragColor = vec4(col, 0.02 * pulse * fade);
          }
        `}
        wireframe transparent depthWrite={false}
      />
    </mesh>
  )
}

// === AGENT NODES — 100 endpoints ===
function AgentNodes() {
  const NODE_COUNT = 100
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
      const isFree = i >= 60
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
  useFrame((state) => { uniforms.time.value = state.clock.elapsedTime })
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
          varying vec3 vColor; varying float vAlpha; uniform float time;
          void main() {
            vColor = aColor;
            vec3 pos = position;
            pos += normalize(position) * sin(time * 1.5 + position.x * 2.5) * 0.025;
            vAlpha = 0.5 + 0.5 * sin(time * 2.5 + position.y * 1.8);
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
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

  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.12
    spriteRefs.current.forEach((sprite, i) => {
      if (sprite) {
        sprite.material.opacity = 0.3 + 0.2 * Math.sin(state.clock.elapsedTime * 1.5 + i * 1.2)
      }
    })
  })

  const labels = useMemo(() => {
    const d = liveData || {}
    return [
      { text: 'x402', color: '#a855f7', size: 1.2 },
      { text: `#${d.block || '—'}`, color: '#22d3ee', size: 0.65 },
      { text: `${d.gas || '—'} gwei`, color: '#c084fc', size: 0.55 },
      { text: d.volume || '$0.00', color: '#d946ef', size: 0.6 },
      { text: 'USDC', color: '#22d3ee', size: 0.7 },
      { text: 'BASE', color: '#a855f7', size: 0.6 },
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

// === DATA STREAM — particles flowing along orbital paths ===
function DataStream() {
  const groupRef = useRef()
  const uniforms = useMemo(() => ({ time: { value: 0 } }), [])
  useFrame((state) => {
    uniforms.time.value = state.clock.elapsedTime
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.06
  })

  const { positions, colors, sizes } = useMemo(() => {
    const count = 80
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
      // purple → cyan → magenta gradient
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
            varying vec3 vColor; varying float vAlpha; uniform float time;
            void main() {
              vColor = aColor;
              vAlpha = 0.4 + 0.6 * sin(time * 2.0 + position.x * 3.0);
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

// === MAIN GLOBE SCENE ===
function GlobeScene({ liveData }) {
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 0.3, 10.5], fov: 40 }}
      gl={{ alpha: true, antialias: !isMobile, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent' }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.05} />
      <group scale={1.3}>
        <VisibleWireframe />
        <OuterHalo />
        <AtmosphereGlow />
        <InnerCore />
        <AgentNodes />
        <OrbitRings />
        <OrbitalData liveData={liveData} />
        <DataStream />
      </group>
      {!isMobile && (
        <Stars radius={10} depth={30} count={400} factor={2} saturation={0.25} fade speed={0.2} />
      )}
      <OrbitControls
        autoRotate autoRotateSpeed={0.5}
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
