import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// === OUTER HALO ===
function OuterHalo() {
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    colorA: { value: new THREE.Color(0xa855f7) },
    colorB: { value: new THREE.Color(0xd946ef) },
  }), [])
  useFrame((state, delta) => { uniforms.time.value += delta * 0.4 })
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
  useFrame((state, delta) => { uniforms.time.value += delta * 0.8 })
  return (
    <mesh scale={1.15}>
      <sphereGeometry args={[2.2, 32, 24]} />
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
  useFrame((state, delta) => { uniforms.time.value += delta * 0.4 })
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

// === WIREFRAME — visible structure with pulse-on-impact ===
function VisibleWireframe({ impactPoints }) {
  const ref = useRef()
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    // 8 impact slots: position (xyz) + intensity + decay
    impact0: { value: new THREE.Vector3(0, 0, 0) }, i0t: { value: 0 },
    impact1: { value: new THREE.Vector3(0, 0, 0) }, i1t: { value: 0 },
    impact2: { value: new THREE.Vector3(0, 0, 0) }, i2t: { value: 0 },
    impact3: { value: new THREE.Vector3(0, 0, 0) }, i3t: { value: 0 },
    impact4: { value: new THREE.Vector3(0, 0, 0) }, i4t: { value: 0 },
    impact5: { value: new THREE.Vector3(0, 0, 0) }, i5t: { value: 0 },
    impact6: { value: new THREE.Vector3(0, 0, 0) }, i6t: { value: 0 },
    impact7: { value: new THREE.Vector3(0, 0, 0) }, i7t: { value: 0 },
  }), [])

  useFrame((state, delta) => {
    uniforms.time.value += delta * 0.5
    // Feed impact points into shader
    if (impactPoints) {
      for (let i = 0; i < 8 && i < impactPoints.length; i++) {
        const pt = impactPoints[i]
        uniforms[`impact${i}`].value.copy(pt.position)
        uniforms[`${i}t`].value = pt.intensity
      }
    }
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2.2, 36, 24]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vPos; varying vec3 vWorldPos;
          uniform float time;
          uniform vec3 impact0, impact1, impact2, impact3, impact4, impact5, impact6, impact7;
          uniform float i0t, i1t, i2t, i3t, i4t, i5t, i6t, i7t;
          void main() {
            vPos = position;
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vPos; varying vec3 vWorldPos;
          uniform float time;
          uniform vec3 impact0, impact1, impact2, impact3, impact4, impact5, impact6, impact7;
          uniform float i0t, i1t, i2t, i3t, i4t, i5t, i6t, i7t;

          float impactPulse(vec3 worldPos, vec3 impactPos, float intensity) {
            float dist = length(worldPos - impactPos);
            // Expanding ring from impact point
            float ring = abs(dist - time * 1.5 * intensity);
            float ringPulse = exp(-ring * 3.0) * intensity;
            // Proximity glow
            float prox = exp(-dist * 1.8) * intensity * 0.5;
            return ringPulse + prox;
          }

          void main() {
            float pulse = 0.6 + 0.4 * sin(time * 0.5 + vWorldPos.y * 2.0);
            float fade = smoothstep(0.0, 0.3, abs(vPos.y));

            // Accumulate impact pulses
            float impacts = 0.0;
            impacts += impactPulse(vWorldPos, impact0, i0t);
            impacts += impactPulse(vWorldPos, impact1, i1t);
            impacts += impactPulse(vWorldPos, impact2, i2t);
            impacts += impactPulse(vWorldPos, impact3, i3t);
            impacts += impactPulse(vWorldPos, impact4, i4t);
            impacts += impactPulse(vWorldPos, impact5, i5t);
            impacts += impactPulse(vWorldPos, impact6, i6t);
            impacts += impactPulse(vWorldPos, impact7, i7t);
            impacts = clamp(impacts, 0.0, 1.5);

            // Base wireframe color (purple → cyan)
            vec3 baseCol = mix(vec3(0.659, 0.333, 0.969), vec3(0.133, 0.827, 0.933), 0.3 + 0.2 * sin(time * 0.3));
            // Impact color (white-blue flash)
            vec3 impactCol = mix(vec3(0.0, 0.322, 1.0), vec3(1.0, 1.0, 1.0), 0.6);
            vec3 col = mix(baseCol, impactCol, impacts * 0.7);

            float alpha = 0.045 * pulse * fade + impacts * 0.15;
            gl_FragColor = vec4(col, alpha);
          }
        `}
        wireframe transparent depthWrite={false}
      />
    </mesh>
  )
}

// === BASE CORE — 3D nucleus emitting energy ===
function BaseCore() {
  const groupRef = useRef()
  const elapsed = useRef(0)

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 128
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 512, 128)
    ctx.font = 'bold 72px monospace'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillStyle = '#0052FF'
    ctx.shadowColor = '#0052FF'; ctx.shadowBlur = 30
    ctx.fillText('BASE', 256, 64)
    ctx.shadowBlur = 0
    ctx.fillText('BASE', 256, 64)
    return new THREE.CanvasTexture(canvas)
  }, [])

  useFrame((state, delta) => {
    elapsed.current += delta
    if (groupRef.current) {
      groupRef.current.rotation.y = elapsed.current * 0.2
      const s = 1 + 0.03 * Math.sin(elapsed.current * 2)
      groupRef.current.scale.set(s, s, s)
    }
  })

  return (
    <group ref={groupRef}>
      <sprite scale={[2.2, 0.55, 1]}>
        <spriteMaterial
          map={texture}
          transparent
          blending={THREE.AdditiveBlending}
          opacity={0.85}
          depthWrite={false}
        />
      </sprite>
      <mesh>
        <sphereGeometry args={[0.4, 16, 12]} />
        <meshBasicMaterial color={0x0052FF} transparent opacity={0.08} />
      </mesh>
    </group>
  )
}

// === ENERGY PARTICLES — travel center → wireframe, pulse on impact ===
function EnergyParticles({ liveData, onImpact }) {
  const PARTICLE_COUNT = 40
  const elapsed = useRef(0)
  const pointsRef = useRef()
  const WIRE_RADIUS = 2.2

  const state = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const vel = new Float32Array(PARTICLE_COUNT * 3)
    const col = new Float32Array(PARTICLE_COUNT * 3)
    const sz = new Float32Array(PARTICLE_COUNT)
    const life = new Float32Array(PARTICLE_COUNT)
    const maxLife = new Float32Array(PARTICLE_COUNT)
    const hit = new Uint8Array(PARTICLE_COUNT) // track if already triggered impact
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.3
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.3
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = 1.0 + Math.random() * 0.7
      vel[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed
      vel[i * 3 + 2] = Math.cos(phi) * speed
      const t = Math.random()
      col[i * 3] = 0.0 * (1 - t) + 0.659 * t
      col[i * 3 + 1] = 0.322 * (1 - t) + 0.333 * t
      col[i * 3 + 2] = 1.0 * (1 - t) + 0.969 * t
      sz[i] = 0.02 + Math.random() * 0.03
      life[i] = Math.random() * 3
      maxLife[i] = 2.5 + Math.random() * 1.5
    }
    return { positions: pos, velocities: vel, colors: col, sizes: sz, lifetimes: life, maxLifetimes: maxLife, hit }
  }, [])

  const uniforms = useMemo(() => ({ time: { value: 0 } }), [])

  useFrame((context, delta) => {
    elapsed.current += delta
    uniforms.time.value = elapsed.current
    const { positions, velocities, lifetimes, maxLifetimes, hit } = state
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      lifetimes[i] += delta
      if (lifetimes[i] >= maxLifetimes[i]) {
        // Reset
        positions[i * 3] = (Math.random() - 0.5) * 0.3
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.3
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const speed = 1.0 + Math.random() * 0.7
        velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
        velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed
        velocities[i * 3 + 2] = Math.cos(phi) * speed
        lifetimes[i] = 0
        maxLifetimes[i] = 2.5 + Math.random() * 1.5
        hit[i] = 0
        continue
      }
      positions[i * 3] += velocities[i * 3] * delta
      positions[i * 3 + 1] += velocities[i * 3 + 1] * delta
      positions[i * 3 + 2] += velocities[i * 3 + 2] * delta

      // Check wireframe collision
      const dist = Math.sqrt(
        positions[i * 3] ** 2 +
        positions[i * 3 + 1] ** 2 +
        positions[i * 3 + 2] ** 2
      )
      if (dist >= WIRE_RADIUS && !hit[i]) {
        hit[i] = 1
        if (onImpact) {
          onImpact({
            position: new THREE.Vector3(
              positions[i * 3],
              positions[i * 3 + 1],
              positions[i * 3 + 2]
            ),
            intensity: 1.0
          })
        }
      }
    }
    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true
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
          varying vec3 vColor; varying float vAlpha; uniform float time;
          void main() {
            vColor = aColor;
            vAlpha = 0.6 + 0.4 * sin(time * 3.0 + position.x * 5.0);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (400.0 / -mv.z);
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
          varying vec3 vColor; varying float vAlpha; uniform float time;
          void main() {
            vColor = aColor;
            vec3 pos = position;
            pos += normalize(position) * sin(time * 1.0 + position.x * 2.5) * 0.025;
            vAlpha = 0.5 + 0.5 * sin(time * 1.6 + position.y * 1.8);
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
        sprite.material.opacity = isHovered ? 0.9 : (0.45 + 0.2 * Math.sin(elapsed.current * 1.5 + i * 1.2))
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

// === DATA STREAM — particles flowing along orbital paths ===
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

// === IMPACT MANAGER — manages 8 impact slots ===
function ImpactManager({ onImpactsReady }) {
  const impactQueue = useRef([])
  const impactSlots = useRef(
    Array.from({ length: 8 }, () => ({
      position: new THREE.Vector3(),
      intensity: 0,
      active: false,
      age: 0,
    }))
  )

  useFrame((state, delta) => {
    // Process queue
    while (impactQueue.current.length > 0 && impactSlots.current.some(s => !s.active)) {
      const pt = impactQueue.current.shift()
      const slot = impactSlots.current.find(s => !s.active)
      if (slot) {
        slot.position.copy(pt.position)
        slot.intensity = pt.intensity
        slot.active = true
        slot.age = 0
      }
    }
    // Decay active impacts
    const decaySpeed = 1.5
    impactSlots.current.forEach(slot => {
      if (slot.active) {
        slot.age += delta
        slot.intensity = Math.max(0, 1.0 - slot.age * decaySpeed)
        if (slot.intensity <= 0) {
          slot.active = false
        }
      }
    })
    // Pass to parent
    onImpactsReady(impactSlots.current.filter(s => s.active).map(s => ({
      position: s.position,
      intensity: s.intensity,
    })))
  })

  // Expose addImpact
  useEffect(() => {
    window.__aetherius_addImpact = (pt) => {
      impactQueue.current.push(pt)
    }
    return () => { delete window.__aetherius_addImpact }
  }, [])

  return null
}

// === MAIN GLOBE SCENE ===
function GlobeScene({ liveData, paused }) {
  const [impactPoints, setImpactPoints] = useState([])
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
  }, [])

  const handleImpact = useCallback((pt) => {
    if (window.__aetherius_addImpact) {
      window.__aetherius_addImpact(pt)
    }
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 0.3, 10.5], fov: 40 }}
      gl={{ alpha: true, antialias: !isMobile, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent' }}
      dpr={[1, 1.5]}
      frameloop={paused ? 'demand' : 'always'}
    >
      <ambientLight intensity={0.05} />
      <group scale={1.3}>
        <VisibleWireframe impactPoints={impactPoints} />
        <BaseCore />
        <EnergyParticles liveData={liveData} onImpact={handleImpact} />
        <ImpactManager onImpactsReady={setImpactPoints} />
        <OuterHalo />
        <AtmosphereGlow />
        <InnerCore />
        <AgentNodes />
        <OrbitRings />
        <OrbitalData liveData={liveData} />
        <DataStream />
      </group>
      {!isMobile && (
        <Stars radius={10} depth={20} count={250} factor={2} saturation={0.25} fade speed={0.15} />
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
