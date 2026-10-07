'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DESKTOP_QUERY } from './constants'

const INTERACTIVE = 'a[href], button, [role="button"], input, select, textarea, label'
const RING_LAG_MS = 90 // time constant of the ring's easing; the dot has no lag

/*
 * Custom cursor for the hero (desktop mouse only).
 *
 * - Dot: exactly at the pointer. Ring: eases after it.
 * - Its look follows the hero's live state through CSS — data-zone (left/right arrows),
 *   data-locked (dashed, slowly turning while the intro or point-down plays) — and its
 *   own data-hover / data-down for links and buttons. See globals.css "Hero custom cursor".
 * - Native listeners + one rAF loop that stops once the ring settles: no React renders.
 * - Progressive: the system cursor is hidden only after this has mounted, only inside
 *   the hero, and only on devices that match DESKTOP_QUERY.
 */
export default function HeroCursor({ heroRef }) {
  const rootRef = useRef(null)
  const ringRef = useRef(null)
  const dotRef = useRef(null)

  useEffect(() => {
    const hero = heroRef.current
    const root = rootRef.current
    const ring = ringRef.current
    const dot = dotRef.current
    if (!hero || !root || !ring || !dot) return

    const desktopQuery = window.matchMedia(DESKTOP_QUERY)
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const pointer = { x: 0, y: 0 }
    const trail = { x: 0, y: 0 }
    let inside = false
    let frame = 0
    let last = 0
    let scrollFrame = 0

    const paint = () => {
      dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`
      ring.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0)`
    }

    const tick = (now) => {
      const dt = Math.min(now - last, 64)
      last = now
      const k = motionQuery.matches ? 1 : 1 - Math.exp(-dt / RING_LAG_MS)
      trail.x += (pointer.x - trail.x) * k
      trail.y += (pointer.y - trail.y) * k
      const settled = Math.abs(pointer.x - trail.x) < 0.1 && Math.abs(pointer.y - trail.y) < 0.1
      if (settled) {
        trail.x = pointer.x
        trail.y = pointer.y
      }
      paint()
      frame = settled ? 0 : requestAnimationFrame(tick)
    }

    const kick = () => {
      if (frame) return
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }

    const isMouse = (event) => event.pointerType !== 'touch'

    const hide = () => {
      inside = false
      root.dataset.visible = 'false'
      delete root.dataset.hover
      delete root.dataset.down
    }

    const onMove = (event) => {
      if (!desktopQuery.matches || !isMouse(event)) return
      pointer.x = event.clientX
      pointer.y = event.clientY
      if (!inside) {
        // Appear where the pointer is, rather than flying in from the last position.
        inside = true
        trail.x = pointer.x
        trail.y = pointer.y
        root.dataset.visible = 'true'
      }
      kick()
    }

    const onOver = (event) => {
      const target = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null
      if (target && hero.contains(target)) root.dataset.hover = 'true'
      else delete root.dataset.hover
    }

    const onDown = (event) => {
      if (isMouse(event)) root.dataset.down = 'true'
    }
    const onUp = () => delete root.dataset.down

    // If the page scrolls the hero away under a still pointer, don't leave the cursor floating.
    const onScroll = () => {
      if (!inside || scrollFrame) return
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0
        const rect = hero.getBoundingClientRect()
        if (pointer.y < rect.top || pointer.y > rect.bottom) hide()
      })
    }

    const syncEnabled = () => {
      if (desktopQuery.matches) hero.dataset.cursor = 'custom'
      else {
        delete hero.dataset.cursor
        hide()
      }
    }

    syncEnabled()
    desktopQuery.addEventListener('change', syncEnabled)
    hero.addEventListener('pointermove', onMove, { passive: true })
    hero.addEventListener('pointerenter', onMove, { passive: true })
    hero.addEventListener('pointerleave', hide)
    hero.addEventListener('pointerover', onOver, { passive: true })
    hero.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('blur', hide)

    return () => {
      desktopQuery.removeEventListener('change', syncEnabled)
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerenter', onMove)
      hero.removeEventListener('pointerleave', hide)
      hero.removeEventListener('pointerover', onOver)
      hero.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('blur', hide)
      cancelAnimationFrame(frame)
      cancelAnimationFrame(scrollFrame)
      delete hero.dataset.cursor
    }
  }, [heroRef])

  return (
    <div ref={rootRef} aria-hidden="true" data-visible="false" className="hero-cursor">
      <div ref={ringRef} className="hero-cursor-ring">
        <span className="hero-cursor-shape" />
        <ChevronLeft data-glyph="left" strokeWidth={2.5} className="hero-cursor-glyph" />
        <ChevronRight data-glyph="right" strokeWidth={2.5} className="hero-cursor-glyph" />
      </div>
      <div ref={dotRef} className="hero-cursor-dot">
        <span className="hero-cursor-dot-shape" />
      </div>
    </div>
  )
}
