import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// NOTE (2026-09-07): scroll-driven ENTRANCE animations removed on purpose.
// gsap.from() hides elements until their trigger fires; with Lenis +
// lazy-loaded 3D content shifting layout, trigger positions went stale and
// whole card grids stayed invisible. Content renders visible by default now.
// This hook only keeps ScrollTrigger position data fresh (harmless).
export function useScrollAnimations() {
  useEffect(() => {
    const refresh = () => {
      try { ScrollTrigger.refresh() } catch { /* noop */ }
    }
    const t1 = setTimeout(refresh, 500)
    const t2 = setTimeout(refresh, 2500)
    window.addEventListener('load', refresh)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refresh).catch(() => {})
    }
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('load', refresh)
    }
  }, [])
}
