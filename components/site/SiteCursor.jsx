'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const INTERACTIVE =
  'a[href], button, [role="button"], select, summary, label, input[type="checkbox"], input[type="radio"], input[type="submit"], input[type="button"]'
// Text fields keep the system I-beam so visitors can see where they are typing.
const TEXT_FIELD =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]), textarea, [contenteditable="true"]'
const HERO = '#home'
const RING_LAG_MS = 90 // time constant of the ring's easing; the dot has no lag

function setFlag(element, key, on) {
  if (on) element.dataset[key] = 'true'
  else delete element.dataset[key]
}

/*
 * Site-wide custom cursor (mouse / trackpad only).
 *
 * - Dot: exactly at the pointer. Ring: eases after it.
 * - Colours follow the section under the pointer (data-nav-theme): white on dark
 *   sections, ink + crimson on light ones.
 * - Grows and fills over links and buttons; hides over text fields (system I-beam).
 * - In the hero it mirrors the hero's live state (data-zone → direction arrow,
 *   data-locked → dashed "wait" ring while the intro or point-down plays).
 * - Native listeners + one rAF loop that stops once the ring settles: no React renders.
 * - Progressive: the system cursor is hidden only after this mounts, and only on
 *   devices with a fine pointer that can hover. Touch devices never see it.
 */
export default function SiteCursor() {
  const rootRef = useRef(null)
  const ringRef = useRef(null)
  const dotRef = useRef(null)

  useEffect(() => {
    const html = document.documentElement
    const root = rootRef.current
    const ring = ringRef.current
    const dot = dotRef.current
    const hero = document.querySelector(HERO)
    if (!root || !ring || !dot) return

    const fineQuery = window.matchMedia(FINE_POINTER)
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const pointer = { x: 0, y: 0 }
    const trail = { x: 0, y: 0 }
    let visible = false
    let frame = 0
    let last = 0
    let scrollFrame = 0

    /* ---------- motion ---------- */

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

    /* ---------- what is under the pointer ---------- */

    const readTarget = (element) => {
      if (!(element instanceof Element)) return
      const themed = element.closest('[data-nav-theme], .site-nav')
      root.dataset.theme = themed?.dataset.navTheme || themed?.dataset.theme || 'dark'
      root.dataset.region = element.closest(HERO) ? 'hero' : 'page'
      setFlag(root, 'hover', Boolean(element.closest(INTERACTIVE)))
      setFlag(root, 'text', Boolean(element.closest(TEXT_FIELD)))
    }

    // The hero publishes its live state on its own element; copy it for the CSS.
    const mirrorHero = () => {
      if (!hero) return
      if (hero.dataset.zone) root.dataset.zone = hero.dataset.zone
      else delete root.dataset.zone
      if ('locked' in hero.dataset) root.dataset.locked = ''
      else delete root.dataset.locked
    }
    const heroObserver = hero ? new MutationObserver(mirrorHero) : null
    heroObserver?.observe(hero, { attributes: true, attributeFilter: ['data-zone', 'data-locked'] })
    mirrorHero()

    /* ---------- events ---------- */

    const hide = () => {
      visible = false
      root.dataset.visible = 'false'
      delete root.dataset.down
    }

    const onMove = (event) => {
      if (!fineQuery.matches || event.pointerType === 'touch') return
      pointer.x = event.clientX
      pointer.y = event.clientY
      if (!visible) {
        // Appear where the pointer is, rather than flying in from the last position.
        visible = true
        trail.x = pointer.x
        trail.y = pointer.y
        root.dataset.visible = 'true'
        readTarget(event.target)
      }
      kick()
    }

    const onOver = (event) => readTarget(event.target)
    const onOut = (event) => {
      if (!event.relatedTarget) hide() // left the window
    }
    const onDown = (event) => {
      if (event.pointerType !== 'touch') root.dataset.down = 'true'
    }
    const onUp = () => delete root.dataset.down

    // Content scrolls under a still pointer: re-read what is now beneath it.
    const onScroll = () => {
      if (!visible || scrollFrame) return
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0
        readTarget(document.elementFromPoint(pointer.x, pointer.y))
      })
    }

    const syncEnabled = () => {
      if (fineQuery.matches) html.dataset.cursor = 'custom'
      else {
        delete html.dataset.cursor
        hide()
      }
    }

    syncEnabled()
    fineQuery.addEventListener('change', syncEnabled)
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerout', onOut, { passive: true })
    document.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('blur', hide)

    return () => {
      fineQuery.removeEventListener('change', syncEnabled)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('blur', hide)
      heroObserver?.disconnect()
      cancelAnimationFrame(frame)
      cancelAnimationFrame(scrollFrame)
      delete html.dataset.cursor
    }
  }, [])

  return (
    <div ref={rootRef} aria-hidden="true" data-visible="false" data-theme="dark" className="site-cursor">
      <div ref={ringRef} className="site-cursor-ring">
        <span className="site-cursor-shape" />
        <ChevronLeft data-glyph="left" strokeWidth={2.5} className="site-cursor-glyph" />
        <ChevronRight data-glyph="right" strokeWidth={2.5} className="site-cursor-glyph" />
      </div>
      <div ref={dotRef} className="site-cursor-dot">
        <span className="site-cursor-dot-shape" />
      </div>
    </div>
  )
}
