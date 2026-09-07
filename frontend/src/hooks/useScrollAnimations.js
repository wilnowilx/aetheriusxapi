import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useScrollAnimations(containerRef) {
  useEffect(() => {
    let ctx = null
    let timers = []
    try {
      ctx = gsap.context(() => {
        const sections = (containerRef?.current || document).querySelectorAll('[data-animate]')

        sections.forEach((section) => {
          const titles = section.querySelectorAll('.section-title')
          const descs = section.querySelectorAll('.section-desc')
          const cards = section.querySelectorAll('[data-animate-card]')
          const labels = section.querySelectorAll('.section-label')

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          })

          if (labels.length) {
            tl.from(labels, {
              y: 20,
              opacity: 0,
              duration: 0.6,
              ease: 'power3.out',
            })
          }

          if (titles.length) {
            tl.from(titles, {
              y: 40,
              opacity: 0,
              duration: 0.8,
              ease: 'power3.out',
            }, labels.length ? '-=0.3' : 0)
          }

          if (descs.length) {
            tl.from(descs, {
              y: 30,
              opacity: 0,
              duration: 0.7,
              ease: 'power3.out',
            }, '-=0.5')
          }

          if (cards.length) {
            tl.from(cards, {
              y: 50,
              opacity: 0,
              duration: 0.6,
              stagger: 0.08,
              ease: 'power3.out',
            }, '-=0.4')
          }
        })
      }, containerRef)

      // Trigger positions go stale when async content (lazy globe, fonts)
      // changes layout height AFTER setup. Refresh at every stage so no
      // section ever stays hidden with a dead trigger.
      const refresh = () => {
        try { ScrollTrigger.refresh() } catch { /* noop */ }
      }
      timers.push(setTimeout(refresh, 500))
      timers.push(setTimeout(refresh, 2000))
      window.addEventListener('load', refresh)
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(refresh).catch(() => {})
      }

      // Last-resort safety net: after 4s, any section still stuck at
      // opacity 0 (dead trigger) is forced visible. Content > animation.
      timers.push(setTimeout(() => {
        try {
          const root = containerRef?.current || document
          root.querySelectorAll('[data-animate] .section-title, [data-animate] .section-desc, [data-animate] .section-label, [data-animate-card]').forEach((el) => {
            const op = parseFloat(window.getComputedStyle(el).opacity)
            if (op === 0) {
              const rect = el.getBoundingClientRect()
              if (rect.top < window.innerHeight && rect.bottom > 0) {
                gsap.set(el, { opacity: 1, y: 0 })
              }
            }
          })
        } catch { /* noop */ }
      }, 4000))

      return () => {
        timers.forEach(clearTimeout)
        window.removeEventListener('load', refresh)
        if (ctx) ctx.revert()
      }
    } catch (err) {
      if (typeof console !== 'undefined') console.error('[AETHERIUS] scroll animations disabled:', err)
      return () => {
        timers.forEach(clearTimeout)
      }
    }
  }, [containerRef])
}
