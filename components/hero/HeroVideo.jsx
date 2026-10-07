'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import {
  CLIPS,
  CLIP_LOAD_TIMEOUT_MS,
  CLIP_SRC,
  CROSSFADE_MS,
  DESKTOP_QUERY,
  INITIAL_CLIP,
  RETURN_FADE_MS,
  WARM_CLIPS,
  getPreloadOrder,
} from './constants'

/*
 * Rendering architecture
 * ----------------------
 * Three persistent <video> elements, never re-created:
 *   - `working`  : permanently holds working.mp4 (loops, never changes src)
 *   - buffer A/B : every other clip, swapped as double buffers
 *
 * A clip is decoded in a hidden buffer, started, and only revealed once its first
 * frame is painted. The outgoing video stays opaque underneath during the crossfade,
 * so the background never flashes through. Any switch can interrupt another; stale
 * async work is discarded via a token. Only one element plays at a time.
 *
 * Sound (on by default)
 * ---------------------
 * The hero always tries to play with sound. Browsers only allow that after the visitor
 * has interacted with the site, so on most first visits play() is refused: the clip
 * then plays muted, the sound state becomes 'pending', and the visitor's first click,
 * tap or key press anywhere turns sound on. Mute (setSound(false)) is always available.
 * Only the clip on screen is ever audible, and on a switch its audio crossfades with
 * the picture. iOS ignores `volume`, so there the old clip's audio is cut instead.
 *
 * Sound states reported through onSoundState: 'on' | 'pending' | 'off'.
 *
 * Clip length is never assumed: a clip "finishes" on its real `ended` event.
 * All playback state lives in refs → no React re-renders during interaction.
 */

const HAVE_CURRENT_DATA = 2
const HIDDEN_STYLE = { opacity: 0 }

const clamp01 = (value) => Math.min(1, Math.max(0, value))
// `volume` throws outside [0, 1]; float maths can land a hair outside it.
function setVolume(video, value) {
  video.volume = clamp01(value)
}
// Events that count as a user gesture for media (mouse, touch, keyboard).
const GESTURE_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']

function waitForEvent(target, types, timeoutMs) {
  return new Promise((resolve) => {
    let timer = 0
    function onEvent(event) {
      finish(event.type)
    }
    function finish(result) {
      clearTimeout(timer)
      types.forEach((type) => target.removeEventListener(type, onEvent))
      resolve(result)
    }
    types.forEach((type) => target.addEventListener(type, onEvent))
    if (Number.isFinite(timeoutMs)) timer = setTimeout(() => finish('timeout'), timeoutMs)
  })
}

// Resolves true once the current frame can be displayed.
async function waitUntilDecodable(video, timeoutMs) {
  if (video.error) return false
  if (video.seeking) {
    const result = await waitForEvent(video, ['seeked', 'error'], timeoutMs)
    if (result !== 'seeked') return false
  }
  if (video.readyState >= HAVE_CURRENT_DATA) return true
  const result = await waitForEvent(video, ['loadeddata', 'canplay', 'error'], timeoutMs)
  return result === 'loadeddata' || result === 'canplay'
}

// Waits until the first frame has actually been composited.
function nextPaint(video) {
  return new Promise((resolve) => {
    const fallback = setTimeout(resolve, 120)
    const done = () => {
      clearTimeout(fallback)
      resolve()
    }
    if (typeof video.requestVideoFrameCallback === 'function') video.requestVideoFrameCallback(done)
    else requestAnimationFrame(() => requestAnimationFrame(done))
  })
}

async function safePlay(video) {
  try {
    await video.play()
    return 'playing'
  } catch (error) {
    // NotAllowedError = autoplay policy (e.g. sound without a gesture, iOS Low Power
    // Mode). AbortError = superseded by another call.
    return error?.name === 'NotAllowedError' ? 'blocked' : 'failed'
  }
}

// Starts muted (required for autoplay); sound is enabled later from a user gesture.
function hardenVideo(video) {
  video.muted = true
  video.defaultMuted = true
  video.playsInline = true
  video.controls = false
  video.setAttribute('muted', '')
  video.setAttribute('playsinline', '')
  video.setAttribute('webkit-playsinline', '')
  video.setAttribute('disablepictureinpicture', '')
  video.setAttribute('disableremoteplayback', '')
  video.setAttribute('x-webkit-airplay', 'deny')
  video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback')
}

const HeroVideo = forwardRef(function HeroVideo(
  { initialClip = INITIAL_CLIP, onReady, onClipStart, onClipEnd, onSoundState },
  ref
) {
  const containerRef = useRef(null)
  const workingRef = useRef(null)
  const bufferARef = useRef(null)
  const bufferBRef = useRef(null)

  const activeRef = useRef(null) // element currently on screen
  const activeClipRef = useRef(null)
  const pendingRef = useRef(null) // element being prepared by an in-flight play()
  const tokenRef = useRef(0) // increments per play(); stale async work bails out
  const hideTimerRef = useRef(0)
  const warmTimerRef = useRef(0)
  const reducedMotionRef = useRef(false)
  const sourcesRef = useRef({ ...CLIP_SRC }) // clip → blob URL once preloaded
  const blobUrlsRef = useRef([])
  const preloadControllerRef = useRef(null)
  const preloadedRef = useRef(false)
  const readyRef = useRef(false)
  const blockedRef = useRef(false) // autoplay refused entirely → retry on next gesture
  const gateRef = useRef({ page: true, inView: true })
  const callbacksRef = useRef({ onReady, onClipStart, onClipEnd, onSoundState })

  const soundRef = useRef(true) // sound wanted (default); false once the visitor mutes
  const soundBlockedRef = useRef(false) // browser refused sound → muted until a gesture
  const volumeControlRef = useRef(true) // false on iOS, where `volume` is read-only
  const audioFrameRef = useRef(0)

  useEffect(() => {
    callbacksRef.current = { onReady, onClipStart, onClipEnd, onSoundState }
  })

  // All helpers below read refs only, so their closures never go stale.
  const buffers = () => [bufferARef.current, bufferBRef.current].filter(Boolean)
  const allVideos = () => [workingRef.current, ...buffers()].filter(Boolean)
  const canPlay = () => gateRef.current.page && gateRef.current.inView
  const mode = () => (window.matchMedia(DESKTOP_QUERY).matches ? 'desktop' : 'touch')
  const fadeFor = (clip) =>
    reducedMotionRef.current ? 0 : clip === CLIPS.WORKING ? RETURN_FADE_MS : CROSSFADE_MS
  const audible = () => soundRef.current && !soundBlockedRef.current

  function load(video, clip) {
    if (video.dataset.clip === clip) return
    video.dataset.clip = clip
    video.src = sourcesRef.current[clip]
    video.load()
  }

  function hide(video) {
    if (video === pendingRef.current) return
    video.style.transitionDuration = '0ms'
    video.style.opacity = '0'
    video.style.zIndex = '0'
    video.muted = true
    if (!video.paused) video.pause()
  }

  /* ---------- sound ---------- */

  function reportSound() {
    const state = !soundRef.current ? 'off' : soundBlockedRef.current ? 'pending' : 'on'
    callbacksRef.current.onSoundState?.(state)
  }

  // Plays with sound when allowed; otherwise silently, flagged so the next gesture
  // restores it ('pending').
  async function playAudible(video) {
    let result = await safePlay(video)
    if (result === 'blocked' && !video.muted) {
      video.muted = true
      soundBlockedRef.current = true
      result = await safePlay(video)
    }
    if (result === 'playing') reportSound()
    return result
  }

  // The incoming clip's audio fades up while the outgoing clip's fades out.
  function crossfadeAudio(next, prev, duration) {
    cancelAnimationFrame(audioFrameRef.current)
    audioFrameRef.current = 0
    const outgoing = prev && prev !== next ? prev : null

    if (!audible()) {
      next.muted = true
      if (outgoing) outgoing.muted = true
      return
    }

    next.muted = false
    if (!duration || !volumeControlRef.current) {
      next.volume = 1
      if (outgoing) outgoing.muted = true
      return
    }

    const fromIn = next.volume // 0 when it started silently, see play()
    const fromOut = outgoing && !outgoing.muted ? outgoing.volume : 0
    let start = 0
    const step = (now) => {
      // Timed from the first frame: rAF timestamps can precede performance.now().
      if (!start) start = now
      const t = clamp01((now - start) / duration)
      setVolume(next, fromIn + (1 - fromIn) * t)
      if (outgoing) setVolume(outgoing, fromOut * (1 - t))
      if (t < 1) {
        audioFrameRef.current = requestAnimationFrame(step)
        return
      }
      audioFrameRef.current = 0
      if (outgoing) {
        outgoing.muted = true
        setVolume(outgoing, 1)
      }
    }
    audioFrameRef.current = requestAnimationFrame(step)
  }

  // iOS Safari only lets an element play with sound once a gesture has started it,
  // so hidden buffers are primed during the click that turns sound on.
  function primeForSound(video) {
    if (!video.getAttribute('src') || !video.paused) return
    video.muted = false
    video.play()?.catch(() => {})
    video.pause()
    video.muted = true
  }

  // Must be called from a user gesture (the sound button, or any tap while 'pending').
  function applySound(on) {
    soundRef.current = on
    soundBlockedRef.current = false
    cancelAnimationFrame(audioFrameRef.current)
    audioFrameRef.current = 0
    const active = activeRef.current

    allVideos().forEach((video) => {
      if (video === active) return
      if (video === pendingRef.current) {
        video.muted = !on // still hidden; its volume comes up when revealed
        return
      }
      video.muted = true
      if (on) primeForSound(video)
    })

    reportSound()
    if (!active) return
    active.volume = 1
    active.muted = !on
    if (on && canPlay() && active.paused && !active.ended) playAudible(active)
  }

  /* ---------- presentation ---------- */

  function present(next, fade) {
    const prev = activeRef.current
    const duration = prev ? fade : 0
    activeRef.current = next

    next.style.transitionDuration = `${duration}ms`
    next.style.zIndex = '2'
    next.style.opacity = '1'
    crossfadeAudio(next, prev, duration)

    allVideos().forEach((video) => {
      if (video !== next && video !== prev) hide(video)
    })

    clearTimeout(hideTimerRef.current)
    if (prev && prev !== next) {
      // Keep the outgoing frame opaque underneath until the fade completes.
      prev.style.zIndex = '1'
      hideTimerRef.current = setTimeout(() => {
        if (activeRef.current !== prev) hide(prev)
      }, duration + 34)
    }

    if (!readyRef.current) {
      readyRef.current = true
      containerRef.current.style.opacity = '1'
      callbacksRef.current.onReady?.()
      startPreload()
    }
  }

  // A clip that can't load/play must not stall the state machine: report it as finished.
  function skip(clip) {
    if (clip === CLIPS.WORKING) return
    setTimeout(() => callbacksRef.current.onClipEnd?.(clip), 0)
  }

  function pickVideo(clip) {
    if (clip === CLIPS.WORKING) return workingRef.current
    const free = buffers().filter((video) => video !== activeRef.current)
    const idleWarm = WARM_CLIPS[mode()]
    return (
      free.find((video) => video.dataset.clip === clip) ??
      free.find((video) => !idleWarm.includes(video.dataset.clip)) ??
      free[0] ??
      null
    )
  }

  // Keep likely-next clips decoded in whichever buffers are not on screen.
  function warmIdle() {
    if (!preloadedRef.current || pendingRef.current) return
    const clips = WARM_CLIPS[mode()]
    const held = new Set(buffers().map((video) => video.dataset.clip))
    const spare = buffers().filter(
      (video) => video !== activeRef.current && !clips.includes(video.dataset.clip)
    )
    clips.forEach((clip) => {
      if (held.has(clip)) return
      const video = spare.shift()
      if (!video) return
      hide(video)
      load(video, clip)
    })
  }

  function abandon(video, token) {
    if (video.dataset.owner !== String(token)) return
    if (pendingRef.current === video) pendingRef.current = null
    if (video !== activeRef.current) {
      video.muted = true
      if (!video.paused) video.pause()
    }
  }

  async function play(clip) {
    const video = pickVideo(clip)
    if (!video) return

    const token = ++tokenRef.current
    const isStale = () => token !== tokenRef.current
    clearTimeout(warmTimerRef.current)

    if (video === activeRef.current) {
      // Requested clip is already on screen (only possible for working).
      pendingRef.current = null
      if (canPlay() && video.paused && !video.ended) playAudible(video)
      return
    }

    pendingRef.current = video
    video.dataset.owner = String(token)
    load(video, clip)
    video.loop = clip === CLIPS.WORKING
    if (video.currentTime > 0) video.currentTime = 0
    // Silent until revealed; crossfadeAudio brings the volume up with the picture.
    video.muted = !audible()
    video.volume = !video.muted && volumeControlRef.current && activeRef.current ? 0 : 1

    const timeout = clip === CLIPS.WORKING ? Infinity : CLIP_LOAD_TIMEOUT_MS
    let ok = await waitUntilDecodable(video, timeout)
    if (!ok && !isStale() && video.currentSrc.startsWith('blob:')) {
      // Blob playback failed on this browser → fall back to the network URL once.
      sourcesRef.current[clip] = CLIP_SRC[clip]
      video.dataset.clip = ''
      load(video, clip)
      ok = await waitUntilDecodable(video, timeout)
    }
    if (isStale()) return abandon(video, token)
    if (!ok) {
      pendingRef.current = null
      return skip(clip)
    }

    const result = canPlay() ? await playAudible(video) : 'deferred'
    if (isStale()) return abandon(video, token)
    if (result === 'failed') {
      pendingRef.current = null
      video.pause()
      return skip(clip)
    }
    if (result === 'blocked') blockedRef.current = true
    if (result === 'playing') await nextPaint(video)
    if (isStale()) return abandon(video, token)

    pendingRef.current = null
    const fade = fadeFor(clip)
    present(video, fade)
    activeClipRef.current = clip
    if (!canPlay()) video.pause()
    callbacksRef.current.onClipStart?.(clip)

    // Autoplay refused: don't strand the visitor on a frozen frame behind a lock.
    if (result === 'blocked') return skip(clip)

    // Re-warm spare buffers once back at rest, after the crossfade has finished.
    if (clip === CLIPS.WORKING) {
      warmTimerRef.current = setTimeout(() => {
        if (token === tokenRef.current) warmIdle()
      }, fade + 60)
    }
  }

  function syncPlayback() {
    const video = activeRef.current
    if (!video || !readyRef.current) return
    if (canPlay()) {
      if (video.paused && !video.ended) {
        playAudible(video).then((result) => {
          blockedRef.current = result === 'blocked'
        })
      }
    } else if (!video.paused) {
      video.pause()
    }
  }

  async function startPreload() {
    // Respect Data Saver: clips then stream on demand instead.
    if (navigator.connection?.saveData) return
    const controller = new AbortController()
    preloadControllerRef.current = controller
    const { signal } = controller

    for (const clip of getPreloadOrder(mode())) {
      if (signal.aborted) return
      try {
        const response = await fetch(CLIP_SRC[clip], { signal })
        if (!response.ok) continue
        const blob = await response.blob()
        if (signal.aborted) return
        const url = URL.createObjectURL(blob)
        blobUrlsRef.current.push(url)
        sourcesRef.current[clip] = url
      } catch {
        if (signal.aborted) return
      }
    }
    preloadedRef.current = true
    if (activeClipRef.current === CLIPS.WORKING) warmIdle()
  }

  function handleEnded(event) {
    const video = event.currentTarget
    if (video !== activeRef.current) return
    const clip = activeClipRef.current
    if (clip === CLIPS.WORKING) {
      // Safety net — `loop` normally prevents this.
      video.currentTime = 0
      if (canPlay()) playAudible(video)
      return
    }
    callbacksRef.current.onClipEnd?.(clip)
  }

  function handleError(event) {
    const video = event.currentTarget
    if (video === activeRef.current && activeClipRef.current !== CLIPS.WORKING) {
      callbacksRef.current.onClipEnd?.(activeClipRef.current)
    }
  }

  // Boot: show the intro clip as soon as it can paint; working.mp4 loads alongside it.
  useEffect(() => {
    const working = workingRef.current
    const reactionBuffers = [bufferARef.current, bufferBRef.current]
    ;[working, ...reactionBuffers].forEach(hardenVideo)

    // iOS keeps `volume` fixed at 1, so audio crossfades fall back to a cut there.
    const probe = document.createElement('video')
    probe.volume = 0.5
    volumeControlRef.current = probe.volume === 0.5

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => {
      reducedMotionRef.current = motionQuery.matches
    }
    updateMotion()
    motionQuery.addEventListener('change', updateMotion)

    play(initialClip).catch(() => skip(initialClip))

    return () => {
      tokenRef.current += 1
      preloadControllerRef.current?.abort()
      clearTimeout(hideTimerRef.current)
      clearTimeout(warmTimerRef.current)
      cancelAnimationFrame(audioFrameRef.current)
      motionQuery.removeEventListener('change', updateMotion)
      ;[working, ...reactionBuffers].forEach((video) => {
        if (video) video.muted = true
      })
      reactionBuffers.forEach((video) => {
        if (!video) return
        video.pause()
        video.removeAttribute('src')
        video.dataset.clip = ''
        video.load()
      })
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      blobUrlsRef.current = []
      sourcesRef.current = { ...CLIP_SRC }
      activeRef.current = null
      activeClipRef.current = null
      pendingRef.current = null
      readyRef.current = false
      preloadedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pause when the tab is hidden or the hero is scrolled away (so audio never plays
  // over the rest of the page); resume the same clip after.
  useEffect(() => {
    const container = containerRef.current

    const onVisibility = () => {
      gateRef.current.page = !document.hidden
      syncPlayback()
    }
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)

    let observer
    if ('IntersectionObserver' in window && container) {
      observer = new IntersectionObserver(([entry]) => {
        gateRef.current.inView = entry.isIntersecting
        syncPlayback()
      })
      observer.observe(container)
    }

    // The first tap/click/key anywhere restores whatever the browser refused without a
    // gesture — including the default sound. The sound button handles its own clicks.
    const onGesture = (event) => {
      const onToggle = event.target instanceof Element && event.target.closest('[data-sound-toggle]')
      if (!onToggle && soundRef.current && soundBlockedRef.current) applySound(true)
      if (!blockedRef.current) return
      blockedRef.current = false
      syncPlayback()
    }
    GESTURE_EVENTS.forEach((type) => window.addEventListener(type, onGesture, { passive: true }))

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      observer?.disconnect()
      GESTURE_EVENTS.forEach((type) => window.removeEventListener(type, onGesture))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      play(clip) {
        play(clip).catch(() => skip(clip))
      },
      // Call from a click/tap handler: browsers only allow sound after a user gesture.
      setSound(on) {
        applySound(on)
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const videoProps = {
    muted: true,
    playsInline: true,
    preload: 'auto',
    controls: false,
    tabIndex: -1,
    draggable: false,
    'aria-hidden': true,
    style: HIDDEN_STYLE,
    className:
      'hero-video pointer-events-none absolute inset-0 h-full w-full select-none transition-opacity ease-[cubic-bezier(0.33,0,0.2,1)]',
    onEnded: handleEnded,
    onError: handleError,
    onContextMenu: (event) => event.preventDefault(),
  }

  /*
   * Stacked (phones, portrait tablets): a centred frame in the flow below the copy, so
   * Adrita and the laptop stay large. Split (landscape ≥ 640px): full-bleed behind the copy.
   * object-fit: cover never distorts; only the crop changes.
   */
  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Adrita, a 3D animated SEO Executive, working on her laptop"
      className="hero-frame relative z-0 order-2 mt-auto aspect-square max-h-[52svh] w-full transition-opacity duration-700 ease-out split:absolute split:inset-0 split:order-none split:mt-0 split:aspect-auto split:max-h-none"
      style={HIDDEN_STYLE}
    >
      <video ref={workingRef} src={CLIP_SRC[CLIPS.WORKING]} data-clip={CLIPS.WORKING} loop {...videoProps} />
      <video ref={bufferARef} {...videoProps} />
      <video ref={bufferBRef} {...videoProps} />
      <div aria-hidden="true" className="hero-scrim pointer-events-none absolute inset-0 z-[3]" />
    </div>
  )
})

export default HeroVideo
