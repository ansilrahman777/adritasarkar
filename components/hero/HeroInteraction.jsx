'use client'

import { useState } from 'react'
import { Hand, Pause, Play } from 'lucide-react'

/*
 * - Transparent tap surface for touch devices (desktop hover zones are handled on the
 *   <section>, so this layer never needs to intercept mouse movement).
 * - Keyboard equivalent of the greeting, visible only on focus.
 * - Pause control for the looping animation (WCAG 2.2.2).
 */
export default function HeroInteraction({ onTap, onGreet, onPauseChange }) {
  const [paused, setPaused] = useState(false)

  const updatePaused = (next) => {
    setPaused(next)
    onPauseChange(next)
  }

  const handleGreet = () => {
    if (paused) updatePaused(false)
    onGreet()
  }

  return (
    <>
      <div
        aria-hidden="true"
        onClick={paused ? undefined : onTap}
        className="absolute inset-0 z-10 touch-manipulation select-none [-webkit-tap-highlight-color:transparent]"
      />

      <div className="absolute bottom-5 left-5 z-30">
        <button
          type="button"
          onClick={handleGreet}
          className="sr-only inline-flex items-center gap-2 rounded-full bg-blush-100 px-4 py-2 text-sm font-medium text-wine-950 focus-visible:not-sr-only"
        >
          <Hand aria-hidden="true" className="size-4" />
          Say hello to Adrita
        </button>
      </div>

      <button
        type="button"
        aria-label="Pause animation"
        aria-pressed={paused}
        onClick={() => updatePaused(!paused)}
        className="absolute right-5 bottom-5 z-30 grid size-10 place-items-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
      >
        {paused ? (
          <Play aria-hidden="true" className="size-4" />
        ) : (
          <Pause aria-hidden="true" className="size-4" />
        )}
      </button>
    </>
  )
}
