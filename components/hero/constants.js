// Single source of truth for the hero's clips, zones and timing.

/*
 * ┌─ WHERE TO CHANGE THINGS ──────────────────────────────────────────────────────┐
 * │ Intro gets longer/shorter → nothing to change. It always plays to its real    │
 * │                             end (the video's `ended` event), at any length.   │
 * │ Replaced any video file   → bump CLIP_VERSION (busts the 7-day browser cache) │
 * │ More intro clips          → add them to INTRO_SEQUENCE (each plays fully)     │
 * │ Point-down delay / repeat → POINT_DELAY_MS / POINT_REPEAT                     │
 * └───────────────────────────────────────────────────────────────────────────────┘
 */
export const CLIP_VERSION = '1'

export const CLIPS = Object.freeze({
  WORKING: 'working',
  LOOK_LEFT: 'look-left',
  LOOK_RIGHT: 'look-right',
  CENTER_LOOK: 'center-look',
  CENTER_WAVE: 'center-wave',
  CENTER_POINT: 'center-point',
})

export const CLIP_SRC = Object.freeze(
  Object.fromEntries(
    Object.values(CLIPS).map((clip) => [clip, `/hero/${clip}.mp4?v=${CLIP_VERSION}`])
  )
)

/*
 * Interaction map
 *
 *   page load        → INTRO_SEQUENCE, played fully, cursor ignored → working
 *   cursor left      → look-left  → working
 *   cursor right     → look-right → working
 *   cursor center    → working (immediately, crossfaded)
 *   30s after intro  → center-point, played fully, cursor ignored → working
 *   tap / keyboard   → replays the intro (touch & keyboard users)
 */

// Played on every load, start to finish, before any cursor interaction is accepted.
// e.g. [CLIPS.CENTER_LOOK, CLIPS.CENTER_WAVE] to wave afterwards.
export const INTRO_SEQUENCE = Object.freeze([CLIPS.CENTER_LOOK])
export const INITIAL_CLIP = INTRO_SEQUENCE[0]

// center-point plays this long after the intro ends. The countdown only runs while the
// hero is on screen, the tab is visible and the animation isn't paused. If she is mid
// side-look when it fires, the point waits until that look finishes.
export const POINT_DELAY_MS = 30_000
// false → once per visit. true → again every POINT_DELAY_MS after each point.
export const POINT_REPEAT = false

export const SIDE_CLIP_FOR_ZONE = Object.freeze({
  left: CLIPS.LOOK_LEFT,
  right: CLIPS.LOOK_RIGHT,
})

export const ZONE_FOR_SIDE_CLIP = Object.freeze({
  [CLIPS.LOOK_LEFT]: 'left',
  [CLIPS.LOOK_RIGHT]: 'right',
})

export const isSideClip = (clip) => clip in ZONE_FOR_SIDE_CLIP

/*
 * When a side clip ends while the cursor is still on that side:
 *   false → crossfade back to working (default)
 *   true  → hold the last frame until the cursor moves to another zone
 */
export const HOLD_SIDE_LOOK = false

// Invisible desktop zones: 0–30% left, 30–70% center, 70–100% right.
export const ZONE_SPLITS = Object.freeze({ left: 0.3, right: 0.7 })
// A boundary must be crossed by this much to switch, so hovering on a line can't flicker.
export const ZONE_HYSTERESIS = 0.025

export function getZone(ratio, previous = null) {
  const leftEdge =
    ZONE_SPLITS.left +
    (previous === 'left' ? ZONE_HYSTERESIS : previous === 'center' ? -ZONE_HYSTERESIS : 0)
  const rightEdge =
    ZONE_SPLITS.right +
    (previous === 'right' ? -ZONE_HYSTERESIS : previous === 'center' ? ZONE_HYSTERESIS : 0)
  if (ratio < leftEdge) return 'left'
  if (ratio < rightEdge) return 'center'
  return 'right'
}

// Hover zones only for real pointer devices at md+ (mirrors the `hover-desktop` CSS variant).
export const DESKTOP_QUERY = '(min-width: 768px) and (hover: hover) and (pointer: fine)'

// The intro streams first; these are fetched afterwards, one at a time.
export function getPreloadOrder(mode) {
  const introRest = INTRO_SEQUENCE.slice(1)
  return mode === 'desktop'
    ? [...introRest, CLIPS.LOOK_LEFT, CLIPS.LOOK_RIGHT, CLIPS.CENTER_POINT, INITIAL_CLIP]
    : [...introRest, CLIPS.CENTER_POINT, INITIAL_CLIP]
}

// Clips kept decoded in the two spare buffers while idle, so the next switch is instant.
export const WARM_CLIPS = Object.freeze({
  desktop: [CLIPS.LOOK_LEFT, CLIPS.LOOK_RIGHT],
  touch: [CLIPS.CENTER_POINT, INITIAL_CLIP],
})

export const CROSSFADE_MS = 260 // into a reaction
export const RETURN_FADE_MS = 360 // back to working
export const CLIP_LOAD_TIMEOUT_MS = 8000 // max wait for a clip's FIRST FRAME (not its length)

/*
 * Ambient light that drifts toward the selected zone (not the cursor).
 * x = horizontal centre as a fraction of hero width, o = opacity.
 */
export const GLOW_TARGETS = Object.freeze({
  idle: { x: 0.62, o: 0.35 },
  left: { x: 0.2, o: 0.55 },
  center: { x: 0.55, o: 0.5 },
  right: { x: 0.84, o: 0.55 },
  focus: { x: 0.62, o: 0.75 },
})
export const GLOW_SMOOTHING_MS = 220
