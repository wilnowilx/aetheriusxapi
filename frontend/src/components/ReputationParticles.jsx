import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useReputationParticles } from '../hooks/useReputationStream'

const MAX_PARTICLES = 500

function ReputationParticlesCore({ reputationParticles }) {
  const pointsRef = useRef()
  const particleCount = reputationParticles.length

  const { positions, colors, sizes, alphas, types } = useMemo(() => {
    const pos = new Float32Array(MAX_PARTICLES * 3)
    const col = new Float32Array(MAX_PARTICLES * 3)
    const sz = new Float32Array(MAX_PARTICLES)
    const alpha = new Float32Array(MAX_PARTICLES)
    const type = new Float32Array(MAX_PARTICLES)

    for (let i = 0; i < MAX_PARTICLES; i++) {
      pos[i * 3] = 0
      pos[i * 3 + 1] = 0
      pos[i * 3 + 2] = 0
      col[i * 3] = 0
      col[i * 3 + 1] = 0
      col[i * 3 + 2] = 0
      sz[i] = 0
      alpha[i] = 0
      type[i] = 0
    }

    return { positions: pos, colors: col, sizes: sz, alphas: alpha, types: type }
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return

    const { positions, colors, sizes, alphas, types } = pointsRef.current.geometry.attributes

    for (let i = 0; i < Math.min(reputationParticles.length, MAX_PARTICLES); i++) {
      const p = reputationParticles[i]

      positions.array[i * 3] = p.position[0]
      positions.array[i * 3 + 1] = p.position[1]
      positions.array[i * 3 + 2] = p.position[2]

      const color = new THREE.Color(p.color)
      colors.array[i * 3] = color.r
      colors.array[i * 3 + 1] = color.g
      colors.array[i * 3 + 2] = color.b

      const lifeRatio = p.age / p.maxAge
      const birthFade = lifeRatio < 0.1 ? lifeRatio / 0.1 : 1
      const deathFade = lifeRatio > 0.7 ? (1 - lifeRatio) / 0.3 : 1
      const fade = Math.min(birthFade, deathFade)

      sizes.array[i] = p.size * (1 + lifeRatio * 0.5) * fade
      alphas.array[i] = fade * (0.6 + 0.4 * Math.sin(Date.now() * 0.003 + i))
      types.array[i] = p.isBatch ? 1 : 0
    }

    for (let i = reputationParticles.length; i < MAX_PARTICLES; i++) {
      alphas.array[i] = 0
      sizes.array[i] = 0
    }

    positions.needsUpdate = true
    colors.needsUpdate = true
    sizes.needsUpdate = true
    alphas.needsUpdate = true
    types.needsUpdate = true
  })

  return (
    <points ref={pointsRef} renderOrder={15}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aAlpha" args={[alphas, 1]} />
        <bufferAttribute attach="attributes-aType" args={[types, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={`
          attribute float aSize;
          attribute vec3 aColor;
          attribute float aAlpha;
          attribute float aType;
          varying vec3 vColor;
          varying float vAlpha;
          varying float vType;
          varying float vSize;
          void main() {
            vColor = aColor;
            vAlpha = aAlpha;
            vType = aType;
            vSize = aSize;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float perspective = 300.0 / -mv.z;
            gl_PointSize = aSize * perspective * (1.0 + vType * 0.5);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          varying float vAlpha;
          varying float vType;
          varying float vSize;
          void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            float dist = length(uv);
            if (dist > 0.5) discard;

            float ring = smoothstep(0.45, 0.0, dist);
            float core = pow(1.0 - dist * 2.0, 4.0);

            vec3 col = vColor;
            if (vType > 0.5) {
              // Batch particles: diamond/trail shape
              float ax = abs(uv.x);
              float ay = abs(uv.y);
              float diamond = 1.0 - max(ax, ay) * 2.0;
              col = mix(col, vec3(1.0), diamond * 0.5);
            } else {
              // Single particles: star shape
              float ax = abs(uv.x);
              float ay = abs(uv.y);
              float spikeX = smoothstep(0.25, 0.0, ay) * pow(1.0 - ax, 2.0);
              float spikeY = smoothstep(0.25, 0.0, ax) * pow(1.0 - ay, 2.0);
              col = mix(col, vec3(1.0), max(spikeX, spikeY) * 0.7 + core * 0.5);
            }

            float alpha = (ring * 0.6 + core * 0.4) * vAlpha;
            gl_FragColor = vec4(col, alpha);
          }
        `}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function ReputationParticles() {
  const reputationParticles = useReputationParticles()

  if (reputationParticles.length === 0) {
    return null
  }

  return <ReputationParticlesCore reputationParticles={reputationParticles} />
}

export default ReputationParticles