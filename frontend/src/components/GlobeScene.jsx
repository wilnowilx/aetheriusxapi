import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// === TEXT BAND RINGS — Saturno: el texto ES el anillo, banda ancha ===
// CylinderGeometry con canvas texture envuelto. El texto fluye SOBRE la banda,
// no flota disperso. Cada anillo es una banda visible con el texto pintado.
const TextBandRings = ({ liveData }) => {
  const groupRef = useRef()
  const elapsed = useRef(0)

  // Horizontales subyacentes, ángulos distintos que NO convergen — como Saturno visto de frente
  const ringsConfig = useMemo(() => {
    const d = liveData || {}
    return [
      // ANILLO 1 EXTERIOR: "THE MARKETPLACE THAT LIVES" — banda blanca, casi horizontal
      {
        radius: 3.6,
        tilt: 0.18, // ~10° — casi horizontal
        yOffset: 0.45,
        speed: 0.025,
        bandWidth: 0.42,
        color: '#ffffff',
        opacity: 0.9,
        fontSize: 44,
        text: 'THE MARKETPLACE   THAT LIVES   ',
      },
      // ANILLO 2 INTERMEDIO: subtítulo — banda magenta, ángulo distinto
      {
        radius: 3.05,
        tilt: 0.32, // ~18° — ligeramente más inclinado
        yOffset: -0.15,
        speed: -0.035, // dirección opuesta para dinamismo
        bandWidth: 0.36,
        color: '#d946ef',
        opacity: 0.78,
        fontSize: 34,
        text: 'API INFRASTRUCTURE   FOR AI AGENTS   THAT PAY   ',
      },
      // ANILLO 3 INTERIOR: métricas vivas — banda cian, otro ángulo
      {
        radius: 2.55,
        tilt: 0.12, // ~7° — casi plano
        yOffset: -0.55,
        speed: 0.04,
        bandWidth: 0.32,
        color: '#22d3ee',
        opacity: 0.68,
        fontSize: 28,
        text: `${d.endpoints || '100+'} ENDPOINTS   ${d.freeEndpoints || '40'} FREE   ${d.latency || '—'}   `,
      },
    ]
  }, [liveData])

  // Canvas 4096×160 — neon premium: bloom real + nítido frontal
  const ringTextures = useMemo(() =>
    ringsConfig.map(ring => {
      const canvas = document.createElement('canvas')
      canvas.width = 4096
      canvas.height = 160
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const font = `900 ${ring.fontSize * 1.35}px 'JetBrains Mono', 'Fira Code', monospace`
      ctx.font = font
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const phrase = ring.text
      const phraseW = ctx.measureText(phrase).width
      const repeats = Math.ceil((canvas.width + phraseW) / phraseW)
      const startOffset = (canvas.width - phraseW * repeats) / 2 + phraseW / 2
      // Neon layers: bloom externo + bloom medio + núcleo sólido
      ctx.shadowColor = ring.color
      ctx.shadowBlur = 48
      ctx.fillStyle = ring.color
      for (let i = 0; i < repeats; i++) ctx.fillText(phrase, startOffset + i * phraseW, canvas.height / 2)
      ctx.shadowBlur = 22
      for (let i = 0; i < repeats; i++) ctx.fillText(phrase, startOffset + i * phraseW, canvas.height / 2)
      ctx.shadowBlur = 0
      ctx.fillStyle = ring.color === '#ffffff' ? '#ffffff' : ring.color
      for (let i = 0; i < repeats; i++) ctx.fillText(phrase, startOffset + i * phraseW, canvas.height / 2)
      // Highlight central ultra fino para legibilidad
      ctx.fillStyle = '#ffffff'
      ctx.globalAlpha = 0.85
      for (let i = 0; i < repeats; i++) ctx.fillText(phrase, startOffset + i * phraseW, canvas.height / 2)
      ctx.globalAlpha = 1
      const tex = new THREE.CanvasTexture(canvas)
      tex.anisotropy = 8
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      return tex
    })
  , [ringsConfig])

  // Textura espejo: mismo texto pero desenfocado y tenue — reflejo elegante
  const mirrorTextures = useMemo(() =>
    ringsConfig.map(ring => {
      const canvas = document.createElement('canvas')
      canvas.width = 4096
      canvas.height = 160
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.font = `900 ${ring.fontSize * 1.35}px 'JetBrains Mono', 'Fira Code', monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const phrase = ring.text
      const phraseW = ctx.measureText(phrase).width
      const repeats = Math.ceil((canvas.width + phraseW) / phraseW)
      const startOffset = (canvas.width - phraseW * repeats) / 2 + phraseW / 2
      ctx.shadowColor = ring.color
      ctx.shadowBlur = 28
      ctx.fillStyle = ring.color
      ctx.globalAlpha = 0.35
      for (let i = 0; i < repeats; i++) ctx.fillText(phrase, startOffset + i * phraseW, canvas.height / 2)
      ctx.globalAlpha = 1
      const tex = new THREE.CanvasTexture(canvas)
      tex.anisotropy = 4
      return tex
    })
  , [ringsConfig])

  const [hoveredRing, setHoveredRing] = useState(null)
  const neonPulse = useRef(0)

  useFrame((state, delta) => {
    elapsed.current += delta
    neonPulse.current += delta
    if (groupRef.current) {
      ringsConfig.forEach((ring, i) => {
        const ringGroup = groupRef.current.children[i]
        if (ringGroup) {
          const paused = hoveredRing === i
          if (!paused) ringGroup.rotation.y += delta * ring.speed
          // Neon respira: opacidad del material pulsa sutil
          const frontMesh = ringGroup.children[0]
          if (frontMesh?.material) {
            const breath = 0.88 + 0.12 * Math.sin(neonPulse.current * 0.7 + i * 1.2)
            frontMesh.material.opacity = (hoveredRing === i ? 1 : ring.opacity) * breath
          }
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {ringsConfig.map((ring, ringIdx) => (
        <group key={ringIdx} position={[0, ring.yOffset, 0]} rotation={[ring.tilt, 0, 0]}>
          {/* Cara frontal nítida + reflejo trasero blur elegante */}
          <mesh
            onPointerOver={(e) => { e.stopPropagation(); setHoveredRing(ringIdx); document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { setHoveredRing(null); document.body.style.cursor = 'auto' }}
            onClick={() => { if (window.__aetherius_addImpact) window.__aetherius_addImpact({ position: new THREE.Vector3(ring.radius, ring.yOffset, 0), intensity: 0.8 }) }}
          >
            <cylinderGeometry args={[ring.radius, ring.radius, ring.bandWidth, 128, 1, true]} />
            <meshBasicMaterial
              map={ringTextures[ringIdx]}
              transparent
              opacity={ring.opacity}
              side={THREE.FrontSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
          {/* Reflejo trasero: espejo desenfocado tenue */}
          <mesh>
            <cylinderGeometry args={[ring.radius, ring.radius, ring.bandWidth, 128, 1, true]} />
            <meshBasicMaterial
              map={mirrorTextures[ringIdx]}
              transparent
              opacity={0.22}
              side={THREE.BackSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
          {/* Borde de brillo sutil en los bordes de la banda */}
          <mesh>
            <torusGeometry args={[ring.radius, ring.bandWidth * 0.06, 6, 128]} />
            <meshBasicMaterial
              color={ring.color}
              transparent
              opacity={ring.opacity * 0.12}
              depthWrite={false}
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

// === UNIFIED HALO — fusión de OuterHalo + AtmosphereGlow para performance ===
// Un solo mesh con shader unificado: fresnel + pulse + wave. Un draw call menos.
function UnifiedHalo() {
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    colorA: { value: new THREE.Color(0x22d3ee) },
    colorB: { value: new THREE.Color(0xa855f7) },
    colorC: { value: new THREE.Color(0xd946ef) },
  }), [])
  useFrame((state, delta) => { uniforms.time.value += delta * 0.6 })
  return (
    <mesh scale={1.15}>
      <sphereGeometry args={[2.2, 28, 20]} />
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
          uniform float time; uniform vec3 colorA; uniform vec3 colorB; uniform vec3 colorC;
          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 1.8);
            float pulse = 0.85 + 0.15 * sin(time * 0.6 + vWorldPos.y * 1.5);
            float wave = 0.5 + 0.5 * sin(time * 0.4 + vWorldPos.x * 2.0 + vWorldPos.z * 1.2);
            vec3 col = mix(colorA, colorB, wave * 0.3);
            col = mix(col, colorC, 0.15 * sin(time * 0.3 + vWorldPos.y));
            gl_FragColor = vec4(col, fresnel * pulse * 0.08);
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
        uniforms[`i${i}t`].value = pt.intensity
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
            float ring = abs(dist - time * 0.9 * intensity);
            float ringPulse = exp(-ring * 1.5) * intensity;
            float prox = exp(-dist * 0.9) * intensity * 0.7;
            return (ringPulse*0.6 + prox) * intensity;
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
            col += vec3(0.10, 0.06, 0.015) * impacts; // filo ámbar duna en la captura

            float alpha = 0.045 * pulse * fade + impacts * 0.38;
            gl_FragColor = vec4(col, alpha);
          }
        `}
        wireframe transparent depthWrite={false}
      />
    </mesh>
  )
}

// === BASE CORE — estrella viva de la esfera de Dyson ===
// El núcleo BASE pulsa: respiración continua + latido en cada ráfaga de flujo.
// flowRef: { intensity (0.6–1.8), pulse (0–1) } — lo escribe el ticker de flujo ≤500ms.
function BaseCore({ flowRef }) {
  const groupRef = useRef()
  const elapsed = useRef(0)

  // Texto BASE 3D: el sprite fluye mejor que el emblema geométrico.
  // El pulso vivo (flowRef) se mantiene: respiración + latido por bloque.
  const baseLogoTexture = useMemo(() => {
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
    const flow = flowRef?.current || { intensity: 1, pulse: 0.3 }
    // El latido decae; la respiración nunca muere (el núcleo siempre vive)
    flow.pulse = Math.max(0.25, (flow.pulse || 0) - delta * 1.8)
    if (groupRef.current) {
      groupRef.current.rotation.y = elapsed.current * (0.15 + 0.15 * flow.intensity)
      groupRef.current.rotation.x = elapsed.current * 0.1
      const breath = Math.sin(elapsed.current * 1.8)
      const s = 1 + 0.06 * breath + 0.22 * flow.pulse
      groupRef.current.scale.set(s, s, s)
      // Brillo del sprite también pulsa
      const spriteMat = groupRef.current.children[0]?.material
      if (spriteMat) spriteMat.opacity = 0.75 + 0.2 * breath + 0.15 * flow.pulse
    }
  })

  // Gas sincronizado: pulsa con el mismo flowRef del núcleo
  const gasUniforms = useMemo(() => ({ time: { value: 0 }, flow: { value: 1 }, pulse: { value: 0 } }), [])
  useFrame((_, delta) => {
    gasUniforms.time.value += delta * 0.5
    gasUniforms.flow.value = flowRef?.current?.intensity || 1
    // Pulsación sincronizada con el latido del BASE (0.25→1.0)
    gasUniforms.pulse.value = flowRef?.current?.pulse || 0.3
  })

  return (
    <group ref={groupRef} scale={1.3}>
      <sprite scale={[2.2, 0.55, 1]}>
        <spriteMaterial
          map={baseLogoTexture}
          transparent
          blending={THREE.AdditiveBlending}
          opacity={0.9}
          depthWrite={false}
        />
      </sprite>
      {/* BASE galaxia: núcleo denso pequeño con swirl — se diluye en la malla */}
      <mesh>
        <sphereGeometry args={[0.38, 32, 24]} />
        <shaderMaterial
          uniforms={gasUniforms}
          vertexShader={`varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`
            varying vec3 vPos; uniform float time; uniform float flow; uniform float pulse;
            void main(){
              float dist = length(vPos) / 0.38;
              float radial = pow(1.0 - dist, 3.0);
              float swirl = sin(vPos.x*8.0+time*0.8)*sin(vPos.y*6.0+time*0.5)*sin(vPos.z*5.0+time*0.6);
              float noise = 0.7 + 0.3*swirl;
              float beat = 0.6 + 0.4*pulse;
              vec3 deepBlue = vec3(0.0,0.15,0.9);
              vec3 coreCyan = vec3(0.08,0.6,1.0);
              vec3 col = mix(deepBlue, coreCyan, (1.0-dist)*0.6 + noise*0.15);
              col += vec3(0.25,0.08,0.45) * (1.0-dist) * 0.4;
              float alpha = radial * 0.75 * noise * (0.75 + 0.4*flow) * beat;
              alpha *= smoothstep(1.0, 0.5, dist);
              gl_FragColor = vec4(col, alpha);
            }`}
          transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.FrontSide}
        />
      </mesh>
      {/* Gas 2: manto medio sutil — turquesa→violeta, muere en 1/3 a la malla */}
      <mesh>
        <sphereGeometry args={[0.62, 24, 18]} />
        <shaderMaterial
          uniforms={gasUniforms}
          vertexShader={`varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`
            varying vec3 vPos; uniform float time; uniform float flow; uniform float pulse;
            void main(){
              float dist = length(vPos) / 0.62;
              float radial = pow(1.0 - dist, 2.4);
              float beat = 0.55 + 0.45*pulse;
              vec3 col = mix(vec3(0.06,0.42,0.92), vec3(0.5,0.22,0.88), dist*0.5);
              float alpha = radial * 0.28 * beat * (0.7+0.35*flow);
              alpha *= smoothstep(1.0, 0.4, dist);
              gl_FragColor = vec4(col, alpha);
            }`}
          transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.FrontSide}
        />
      </mesh>
      {/* Gas 3: velo galaxia exterior tenue */}
      <mesh>
        <sphereGeometry args={[0.88, 16, 12]} />
        <shaderMaterial
          uniforms={gasUniforms}
          vertexShader={`varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`
            varying vec3 vPos; uniform float time; uniform float pulse;
            void main(){
              float dist = length(vPos) / 0.88;
              float radial = pow(1.0 - dist, 3.2);
              float beat = 0.5 + 0.5*pulse;
              vec3 col = mix(vec3(0.45,0.2,0.85), vec3(0.75,0.28,0.65), dist*0.4);
              float alpha = radial * 0.14 * beat;
              alpha *= smoothstep(1.0, 0.3, dist);
              gl_FragColor = vec4(col, alpha);
            }`}
          transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.FrontSide}
        />
      </mesh>
      {/* Aura intermedia 3D: entre gas y malla */}
      <mesh>
        <sphereGeometry args={[1.45, 20, 16]} />
        <shaderMaterial
          uniforms={gasUniforms}
          vertexShader={`varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`
            varying vec3 vPos; uniform float time; uniform float pulse;
            void main(){
              float dist = length(vPos) / 1.45;
              float radial = pow(1.0 - dist, 2.0) * pow(dist, 0.3);
              float beat = 0.4 + 0.6*pulse;
              float phase = sin(time*0.4 + 2.0)*0.5+0.5;
              vec3 col = mix(vec3(0.12,0.3,0.8), vec3(0.45,0.2,0.75), dist*0.5+phase*0.15);
              float alpha = radial * 0.07 * beat;
              gl_FragColor = vec4(col, alpha);
            }`}
          transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.FrontSide}
        />
      </mesh>
    </group>
  )
}

// === ENERGY PARTICLES — operaciones reales: núcleo → borde interno ===
// Cada partícula nace en el núcleo BASE y muere al tocar la cáscara (Dyson:
// la energía se absorbe, nada cruza hacia afuera). El flujo se modula con
// flowRef (ticker ≤500ms derivado de USDC/mercado): intensidad, velocidad,
// tamaño y color (verde USDC vs azul→púrpura mercado). 36 pts para 60fps.
function EnergyParticles({ liveData, onImpact, flowRef }) {
  const PARTICLE_COUNT = 52
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

  // Partículas visibles: más grandes, con estela. Verde USDC vs azul→púrpura mercado
  const paintKind = (col, sz, i) => {
    if (Math.random() < 0.42) {
      col[i * 3] = 0.08; col[i * 3 + 1] = 0.85; col[i * 3 + 2] = 0.55
      sz[i] = 0.055 + Math.random() * 0.045
    } else {
      const t = Math.random()
      col[i * 3] = 0.15 * (1 - t) + 0.78 * t
      col[i * 3 + 1] = 0.45 * (1 - t) + 0.35 * t
      col[i * 3 + 2] = 1.0 * (1 - t) + 0.97 * t
      sz[i] = 0.04 + Math.random() * 0.04
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
    let burstCount = isBurst ? 8 : 0
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
          // Vida corta para disiparse en la red (no fiesta superior)
          lifetimes[i] = maxLifetimes[i] - 0.35
        } else {
          // Ya impactada: se expande y se desvanece contra la malla
          sizes[i] *= 1.06
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
            float edgeDissolve = 1.0 - smoothstep(0.65, 1.0, travel);
            vAlpha = (0.7 + 0.3 * sin(time * 2.0 + dist * 4.0)) * (0.9 + 0.25 * flow) * (0.3 + 0.7 * edgeDissolve);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float sz = aSize * (1.0 + travel * 1.2);
            gl_PointSize = sz * (0.9 + 0.6 * flow) * (480.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          varying vec3 vColor; varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float glow = pow(1.0 - d * 2.0, 1.4);
            float core = 1.0 - smoothstep(0.0, 0.3, d);
            vec3 col = vColor + core * 0.6;
            gl_FragColor = vec4(col, glow * vAlpha);
          }
        `}
        transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// === AGENT NODES — 60 endpoints (optimizado 100→60 para 60fps) ===
function AgentNodes() {
  const NODE_COUNT = 60
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
    const count = 50
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

// === IMPACTS BRIDGE — holds impact state INSIDE Canvas ===
// setImpactPoints used to live in the <Canvas> wrapper: every frame produced a
// new array → wrapper re-rendered 60x/s recreating the inline camera prop →
// R3F re-applied the camera each frame and fought OrbitControls autoRotate to
// a standstill ("moves a little, then freezes"). Keeping the state here means
// per-frame updates only reconcile Canvas children — the camera is untouched.
function GlobeImpacts() {
  const [impactPoints, setImpactPoints] = useState([])
  const lastSig = useRef('')

  // Only notify when the active set actually changes (idle frames send nothing)
  const handleImpactsReady = useCallback((pts) => {
    let sig = pts.length + ':'
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      sig += p.position.x.toFixed(1) + ',' + p.position.y.toFixed(1) + ',' + p.position.z.toFixed(1) + ',' + p.intensity.toFixed(2) + ';'
    }
    if (sig !== lastSig.current) {
      lastSig.current = sig
      setImpactPoints(pts)
    }
  }, [])

  return (
    <>
      <VisibleWireframe impactPoints={impactPoints} />
      <ImpactManager onImpactsReady={handleImpactsReady} />
    </>
  )
}

// === COSMIC COMETS — estelas fugaces brutalismo cósmico ===
function CosmicComets() {
  const ref = useRef()
  const elapsed = useRef(0)
  const { positions, colors, sizes } = useMemo(() => {
    const count = 8
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
      sz[i] = 0.08 + Math.random() * 0.06
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
      for (let i = 0; i < 8; i++) {
        sz.array[i] = 0.06 + 0.05 * Math.sin(elapsed.current * 2 + i * 1.5)
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
        vertexShader={`attribute float aSize; attribute vec3 aColor; varying vec3 vColor; varying float vAlpha; uniform float time; void main(){vColor=aColor; vAlpha=0.6+0.4*sin(time*1.2+position.x*2.0); vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*(500.0/-mv.z); gl_Position=projectionMatrix*mv;}`}
        fragmentShader={`varying vec3 vColor; varying float vAlpha; void main(){ float d=length(gl_PointCoord-vec2(0.5)); if(d>0.5)discard; float g=pow(1.0-d*2.0,1.5); gl_FragColor=vec4(vColor,g*vAlpha);}`}
        transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
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
        <GlobeImpacts />
        <BaseCore flowRef={flowRef} />
        <EnergyParticles liveData={liveData} onImpact={handleImpact} flowRef={flowRef} />
        <UnifiedHalo />
        <InnerCore />
        <AgentNodes />
        <TextBandRings liveData={liveData} />
        <DataStream />
      </group>
      {!isMobile && (
        <>
          <Stars radius={12} depth={30} count={600} factor={3} saturation={0.3} fade speed={0.12} />
          <Stars radius={8} depth={15} count={300} factor={1.5} saturation={0.5} fade speed={0.08} />
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
