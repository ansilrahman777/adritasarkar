'use client'

import { useRef } from 'react'
import { useHeroInteraction } from '@/hooks/useHeroInteraction'
import { INITIAL_CLIP } from './constants'
import HeroContent from './HeroContent'
import HeroInteraction from './HeroInteraction'
import HeroVideo from './HeroVideo'

/*
 * Layers (bottom → top):
 *   z-0   HeroVideo        — clips + readability scrims
 *   z-[5] glow             — soft light that drifts toward the selected zone
 *   z-10  HeroInteraction  — transparent tap surface (touch)
 *   z-20  HeroContent      — copy (pointer-events: none except links)
 *   z-30  controls
 * The site navigation is fixed above everything (components/site/SiteNavigation).
 *
 * Stacked (phones, portrait tablets): copy on top, character frame below.
 * Split (landscape ≥ 640px): the video fills the hero; copy sits in its left negative space.
 *
 * Zone detection is one pointer handler on the <section>, so nothing blocks links.
 * Live state is exposed to CSS as data-clip / data-zone / data-locked
 * (data-locked starts set: the intro plays fully before the cursor does anything).
 * This component never re-renders after mount.
 */
export default function InteractiveHero() {
  const heroRef = useRef(null)
  const videoRef = useRef(null)
  const glowRef = useRef(null)
  const { pointerHandlers, videoHandlers, onTap, greet, setPaused } = useHeroInteraction({
    heroRef,
    videoRef,
    glowRef,
  })

  return (
    <section
      id="home"
      ref={heroRef}
      data-clip={INITIAL_CLIP}
      data-locked=""
      data-nav-theme="dark"
      aria-labelledby="hero-title"
      className="hero-backdrop relative isolate flex min-h-svh w-full flex-col overflow-hidden pb-20 split:block split:pb-0"
      {...pointerHandlers}
    >
      <HeroVideo ref={videoRef} {...videoHandlers} />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5] overflow-hidden mix-blend-soft-light"
      >
        <div ref={glowRef} className="hero-glow" />
      </div>

      <HeroInteraction onTap={onTap} onGreet={greet} onPauseChange={setPaused} />
      <HeroContent />
    </section>
  )
}
