'use client'

import { useEffect, useRef } from 'react'
import {
  CLIPS,
  DESKTOP_QUERY,
  GLOW_SMOOTHING_MS,
  GLOW_TARGETS,
  HOLD_SIDE_LOOK,
  INITIAL_CLIP,
  INTRO_SEQUENCE,
  POINT_DELAY_MS,
  POINT_REPEAT,
  SIDE_CLIP_FOR_ZONE,
  ZONE_FOR_SIDE_CLIP,
  getZone,
  isSideClip,
} from '@/components/hero/constants'

/*
 * Interaction
 *
 *   load            → intro (center-look), played fully, LOCKED → rest
 *   cursor left     → look-left  → rest            (interrupts the other side)
 *   cursor right    → look-right → rest
 *   cursor center   → rest, immediately            (cuts a side look short)
 *   30s after intro → center-point, played fully, LOCKED → rest
 *   tap / keyboard  → replays the intro, LOCKED → rest
 *
 * "rest" = a due center-point if the timer has fired, otherwise working. When a lock
 * ends with the cursor already on a side, she looks that way instead of resting.
 *
 * All state lives in one plain object created once per mount; nothing here causes a
 * React render. Pointer work is batched to one rAF; the glow eases in its own rAF loop
 * that stops once settled; the 30s countdown pauses while it couldn't be seen.
 */
function createHeroController({ heroRef, videoRef, glowRef }) {
  const s = {
    clip: INITIAL_CLIP, // requested clip (intent, updated synchronously)
    zone: null, // zone under the cursor (desktop), null when outside the hero
    locked: true, // intro / center-point playing → cursor is ignored
    ready: false,
    paused: false,
    desktop: false,
    reducedMotion: false,
    pointerX: 0,
    pointerFrame: 0,
    pointDue: false,
    pointsPlayed: 0,
    timer: { armed: false, remaining: POINT_DELAY_MS, startedAt: 0, id: 0 },
    gates: { visible: true, inView: true },
    glow: { ...GLOW_TARGETS.focus },
    glowTarget: GLOW_TARGETS.focus,
    glowFrame: 0,
    glowLast: 0,
  }

  const setData = (key, value) => {
    const element = heroRef.current
    if (!element) return
    if (value == null) delete element.dataset[key]
    else element.dataset[key] = value
  }

  /* ---------- ambient glow (exponential ease, rAF only while moving) ---------- */

  function paintGlow() {
    const element = glowRef.current
    if (!element) return
    // The glow is 60% of the hero wide, so translateX in % of itself centres it at x.
    element.style.transform = `translate3d(${((s.glow.x - 0.3) / 0.6) * 100}%, 0, 0)`
    element.style.opacity = s.glow.o.toFixed(3)
  }

  function stepGlow(now) {
    const dt = Math.min(now - s.glowLast, 64)
    s.glowLast = now
    const k = 1 - Math.exp(-dt / GLOW_SMOOTHING_MS)
    s.glow.x += (s.glowTarget.x - s.glow.x) * k
    s.glow.o += (s.glowTarget.o - s.glow.o) * k
    const settled =
      Math.abs(s.glowTarget.x - s.glow.x) < 0.0008 && Math.abs(s.glowTarget.o - s.glow.o) < 0.002
    if (settled) s.glow = { ...s.glowTarget }
    paintGlow()
    s.glowFrame = settled ? 0 : requestAnimationFrame(stepGlow)
  }

  function setGlow(key) {
    s.glowTarget = GLOW_TARGETS[key] ?? GLOW_TARGETS.idle
    if (s.reducedMotion) {
      cancelAnimationFrame(s.glowFrame)
      s.glowFrame = 0
      s.glow = { ...s.glowTarget }
      paintGlow()
      return
    }
    if (!s.glowFrame) {
      s.glowLast = performance.now()
      s.glowFrame = requestAnimationFrame(stepGlow)
    }
  }

  /* ---------- 30s center-point countdown (pausable) ---------- */

  const canCount = () => !s.paused && s.gates.visible && s.gates.inView

  function pauseTimer() {
    const t = s.timer
    if (!t.id) return
    clearTimeout(t.id)
    t.id = 0
    t.remaining = Math.max(0, t.remaining - (performance.now() - t.startedAt))
  }

  function runTimer() {
    const t = s.timer
    if (!t.armed || t.id || !canCount()) return
    t.startedAt = performance.now()
    t.id = setTimeout(() => {
      t.id = 0
      t.armed = false
      requestPoint()
    }, t.remaining)
  }

  function armTimer() {
    const t = s.timer
    if (t.armed || s.pointDue) return
    if (!POINT_REPEAT && s.pointsPlayed > 0) return
    t.armed = true
    t.remaining = POINT_DELAY_MS
    runTimer()
  }

  const syncTimer = () => (canCount() ? runTimer() : pauseTimer())

  /* ---------- state machine ---------- */

  function go(clip) {
    s.clip = clip
    videoRef.current?.play(clip)
  }

  function lock() {
    s.locked = true
    setData('locked', '')
    setGlow('focus')
  }

  function unlock() {
    s.locked = false
    setData('locked', null)
  }

  function playPoint() {
    s.pointDue = false
    s.pointsPlayed += 1
    lock()
    go(CLIPS.CENTER_POINT)
  }

  // Timer fired: point now if she is at rest, otherwise as soon as she gets there.
  function requestPoint() {
    s.pointDue = true
    if (!s.locked && !s.paused && s.clip === CLIPS.WORKING) playPoint()
  }

  function rest({ followCursor = false } = {}) {
    if (s.pointDue && !s.paused) return playPoint()
    const side = followCursor && s.desktop && !s.paused ? SIDE_CLIP_FOR_ZONE[s.zone] : null
    if (side) {
      go(side)
      setGlow(s.zone)
      return
    }
    go(CLIPS.WORKING)
    setGlow(s.desktop ? (s.zone ?? 'idle') : 'idle')
  }

  function applyZone(zone) {
    if (s.locked || !s.ready || s.paused) return
    const side = SIDE_CLIP_FOR_ZONE[zone]
    if (side) {
      if (s.clip !== side) go(side)
      return
    }
    if (zone === 'center' && isSideClip(s.clip)) rest()
  }

  /* ---------- handlers ---------- */

  function flushPointer() {
    s.pointerFrame = 0
    const width = document.documentElement.clientWidth || window.innerWidth
    const zone = getZone(s.pointerX / width, s.zone)
    if (zone === s.zone) return
    s.zone = zone
    setData('zone', zone)
    if (!s.locked) setGlow(zone)
    applyZone(zone)
  }

  function onPointerMove(event) {
    if (!s.desktop || event.pointerType === 'touch') return
    s.pointerX = event.clientX
    if (!s.pointerFrame) s.pointerFrame = requestAnimationFrame(flushPointer)
  }

  function onPointerLeave() {
    cancelAnimationFrame(s.pointerFrame)
    s.pointerFrame = 0
    s.zone = null
    setData('zone', null)
    if (s.locked) return
    setGlow('idle')
    // A held side look has nothing to hold for once the cursor is gone.
    if (HOLD_SIDE_LOOK && isSideClip(s.clip)) rest()
  }

  // Tap (touch) / keyboard button: replay the intro, only from rest.
  function greet() {
    if (!s.ready || s.locked || s.paused || s.clip !== CLIPS.WORKING) return
    lock()
    go(INTRO_SEQUENCE[0])
  }

  function onTap() {
    if (!s.desktop) greet() // desktop uses hover zones
  }

  function setPaused(paused) {
    s.paused = paused
    if (paused) {
      videoRef.current?.pause()
      pauseTimer()
      return
    }
    videoRef.current?.resume()
    runTimer()
    if (s.pointDue && !s.locked && s.clip === CLIPS.WORKING) playPoint()
  }

  function onReady() {
    s.ready = true
  }

  // Exposes the on-screen clip to CSS (e.g. the scroll cue reacts to center-point).
  function onClipStart(clip) {
    setData('clip', clip)
  }

  function onClipEnd(clip) {
    if (clip !== s.clip) return // stale or duplicate event

    const introIndex = INTRO_SEQUENCE.indexOf(clip)
    if (introIndex !== -1) {
      const next = INTRO_SEQUENCE[introIndex + 1]
      if (next) return go(next)
      unlock()
      armTimer()
      return rest({ followCursor: true })
    }

    if (clip === CLIPS.CENTER_POINT) {
      unlock()
      armTimer() // no-op unless POINT_REPEAT
      return rest({ followCursor: true })
    }

    if (isSideClip(clip)) {
      if (HOLD_SIDE_LOOK && !s.pointDue && s.zone === ZONE_FOR_SIDE_CLIP[clip]) return // hold
      return rest()
    }
  }

  /* ---------- environment (re-entrant for React Strict Mode) ---------- */

  function mount() {
    const desktopQuery = window.matchMedia(DESKTOP_QUERY)
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateEnv = () => {
      s.desktop = desktopQuery.matches
      s.reducedMotion = motionQuery.matches
      s.zone = null
      setData('zone', null)
    }
    updateEnv()
    paintGlow()
    desktopQuery.addEventListener('change', updateEnv)
    motionQuery.addEventListener('change', updateEnv)

    const onVisibility = () => {
      s.gates.visible = !document.hidden
      syncTimer()
    }
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)

    let observer
    if ('IntersectionObserver' in window && heroRef.current) {
      observer = new IntersectionObserver(([entry]) => {
        s.gates.inView = entry.isIntersecting
        syncTimer()
      })
      observer.observe(heroRef.current)
    }

    return () => {
      desktopQuery.removeEventListener('change', updateEnv)
      motionQuery.removeEventListener('change', updateEnv)
      document.removeEventListener('visibilitychange', onVisibility)
      observer?.disconnect()
      pauseTimer()
      cancelAnimationFrame(s.pointerFrame)
      cancelAnimationFrame(s.glowFrame)
      s.pointerFrame = 0
      s.glowFrame = 0
    }
  }

  return {
    mount,
    api: Object.freeze({
      pointerHandlers: { onPointerMove, onPointerLeave },
      videoHandlers: { onReady, onClipStart, onClipEnd },
      onTap,
      greet,
      setPaused,
    }),
  }
}

export function useHeroInteraction({ heroRef, videoRef, glowRef }) {
  const controllerRef = useRef(null)
  if (!controllerRef.current) {
    controllerRef.current = createHeroController({ heroRef, videoRef, glowRef })
  }
  const controller = controllerRef.current

  useEffect(() => controller.mount(), [controller])

  return controller.api
}
