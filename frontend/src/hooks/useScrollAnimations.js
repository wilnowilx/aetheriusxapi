import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useScrollAnimations(containerRef) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const sections = (containerRef?.current || document).querySelectorAll('[data-animate]')

      sections.forEach((section) => {
        const titles = section.querySelectorAll('.section-title')
        const descs = section.querySelectorAll('.section-desc')
        const cards = section.querySelectorAll('[data-animate-card]')
        const labels = section.querySelectorAll('.section-label')

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 20%',
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

    return () => ctx.revert()
  }, [containerRef])
}
