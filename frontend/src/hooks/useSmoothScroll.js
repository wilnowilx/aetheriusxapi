import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

export function useSmoothScroll() {
  const lenisRef = useRef(null)

  useEffect(() => {
    let lenis = null
    let onFrame = null
    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        touchMultiplier: 2,
        infinite: false,
      })

      lenisRef.current = lenis

      lenis.on('scroll', ScrollTrigger.update)

      onFrame = (time) => {
        lenis.raf(time * 1000)
      }
      gsap.ticker.add(onFrame)
      gsap.ticker.lagSmoothing(0)
    } catch (err) {
      if (typeof console !== 'undefined') console.error('[AETHERIUS] smooth scroll disabled:', err)
    }

    return () => {
      try {
        if (onFrame) gsap.ticker.remove(onFrame)
        if (lenis) lenis.destroy()
      } catch { /* noop */ }
    }
  }, [])

  return lenisRef
}
