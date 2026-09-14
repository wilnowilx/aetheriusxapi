import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useScrollAnimations() {
  useEffect(() => {
    // Refresh ScrollTrigger positions
    const refresh = () => {
      try { ScrollTrigger.refresh() } catch { /* noop */ }
    }
    const t1 = setTimeout(refresh, 500)
    const t2 = setTimeout(refresh, 2500)
    window.addEventListener('load', refresh)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refresh).catch(() => {})
    }

    // Entrance animations: add .visible class when elements scroll into view
    const animatedEls = document.querySelectorAll('[data-animate], [data-animate-card]')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          observer.unobserve(e.target)
        }
      })
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 })

    animatedEls.forEach(el => observer.observe(el))

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('load', refresh)
      observer.disconnect()
    }
  }, [])
}
