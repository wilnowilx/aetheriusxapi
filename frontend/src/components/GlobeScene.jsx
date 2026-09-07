import React, { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// === ATMOSPHERIC GLOW SHADER (rim-light halo, no postprocessing needed) ===
function AtmosphereGlow() {
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    glowColor: { value: new THREE.Color(0xa855f7) },
    accentColor: { value: new THREE.Color(0xd946ef) }
  }), [])

  useFrame((state) => {
    uniforms.time.value = state.clock.elapsedTime
  })

  return (
    <mesh scale={1.07}>
      <sphereGeometry args={[2.2, 48, 48]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vWorldPos;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vNormal;
          varying vec3 vWorldPos;
          uniform float time;
          uniform vec3 glowColor;
          uniform vec3 accentColor;
          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 1.3);
            float pulse = 0.9 + 0.1 * sin(time * 1.2 + vWorldPos.y * 2.0);
            float wave = 0.5 + 0.5 * sin(time * 0.8 + vWorldPos.x * 3.0 + vWorldPos.z * 2.0);
            vec3 col = mix(glowColor, accentColor, wave * 0.35);
            float alpha = fresnel * pulse * 0.32;
            gl_FragColor = vec4(col, alpha);
          }
        `}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// === INNER CORE GLOW ===
function InnerCore() {
  const uniforms = useMemo(() => ({
    time: { value: 0 }
  }), [])

  useFrame((state) => {
    uniforms.time.value = state.clock.elapsedTime
  })

  return (
    <mesh scale={0.82}>
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
          varying vec3 vNormal;
          uniform float time;
          void main() {
            float rim = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1))), 2.0);
            float pulse = 0.8 + 0.2 * sin(time * 0.6);
            vec3 col = vec3(0.44, 0.21, 0.73);
            gl_FragColor = vec4(col, rim * pulse * 0.14);
          }
        `}
        side={THREE.FrontSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// === GLOBE WIREFRAME (static mesh — the GROUP orbits, not pieces) ===
function GlobeWireframe() {
  return (
    <mesh>
      <sphereGeometry args={[2.2, 48, 32]} />
      <meshBasicMaterial color={0xa855f7} wireframe transparent opacity={0.04} />
    </mesh>
  )
}

// === AGENT NODES (100 endpoints) ===
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
        col[i * 3] = 0.06; col[i * 3 + 1] = 0.72; col[i * 3 + 2] = 0.51
      } else {
        const c = new THREE.Color().setHSL(0.75 + Math.random() * 0.1, 0.7, 0.6)
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
      }
      sz[i] = isFree ? 0.1 : 0.06
    }
    return { positions: pos, colors: col, sizes: sz }
  }, [])

  const uniforms = useMemo(() => ({ time: { value: 0 } }), [])

  useFrame((state) => {
    uniforms.time.value = state.clock.elapsedTime
  })

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
          attribute float aSize;
          attribute vec3 aColor;
          varying vec3 vColor;
          varying float vAlpha;
          uniform float time;
          void main() {
            vColor = aColor;
            vec3 pos = position;
            pos += normalize(position) * sin(time * 2.0 + position.x * 3.0) * 0.03;
            vAlpha = 0.6 + 0.4 * sin(time * 3.0 + position.y * 2.0);
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = aSize * (380.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float glow = 1.0 - d * 2.0;
            glow = pow(glow, 1.8);
            gl_FragColor = vec4(vColor, glow * vAlpha * 0.9);
          }
        `}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// === ORBIT RINGS ===
function OrbitRings() {
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          rotation={[Math.PI / 2 + i * 0.2, 0, i * 0.35]}
        >
          <torusGeometry args={[2.8 + i * 0.35, 0.008, 8, 128]} />
          <meshBasicMaterial color={0xa855f7} transparent opacity={0.12 - i * 0.03} />
        </mesh>
      ))}
    </group>
  )
}

// === x402 CENTER TEXT ===
function X402Center() {
  const spriteRef = useRef()
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 256
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 512, 256)
    ctx.font = 'bold 150px monospace'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillStyle = '#d946ef'; ctx.shadowColor = '#d946ef'; ctx.shadowBlur = 44
    ctx.fillText('x402', 256, 100)
    ctx.font = '40px sans-serif'; ctx.fillStyle = '#a855f7'; ctx.shadowBlur = 22
    ctx.fillText('Protocol', 256, 185)
    return new THREE.CanvasTexture(canvas)
  }, [])

  useFrame((state) => {
    if (spriteRef.current) {
      spriteRef.current.material.opacity = 0.7 + 0.3 * Math.sin(state.clock.elapsedTime * 1.5)
    }
  })

  return (
    <sprite ref={spriteRef} scale={[2.1, 1.05, 1]}>
      <spriteMaterial map={texture} transparent blending={THREE.AdditiveBlending} opacity={0.85} depthWrite={false} />
    </sprite>
  )
}

// === MAIN GLOBE SCENE ===
// Camera z=9.5 with group scale=1.25: globe appears big,
// orbit rings (r=3.5 max) fit inside viewport without clipping.
// Visible width at z=0 with fov=40: 2*9.5*tan(20°)≈6.94.
// Ring max diameter = 3.5*2 = 7.0 → just fits with scale 1.25.
function GlobeScene() {
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(pointer: coarse)').matches ||
           window.innerWidth < 768
  }, [])
  return (
    <Canvas
      camera={{ position: [0, 0.3, 9.5], fov: 40 }}
      gl={{ alpha: true, antialias: !isMobile, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent' }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.1} />
      <group scale={1.25}>
        <GlobeWireframe />
        <AtmosphereGlow />
        <InnerCore />
        <AgentNodes />
        <X402Center />
        <OrbitRings />
      </group>
      {!isMobile && (
        <Stars radius={8} depth={20} count={250} factor={2} saturation={0.5} fade speed={0.5} />
      )}
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.8}
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.75}
      />
    </Canvas>
  )
}

export default GlobeScene
