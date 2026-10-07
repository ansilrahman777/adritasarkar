'use client'

import { motion } from 'framer-motion'
import { ArrowDown, MousePointer2 } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1]

// Supporting lines fade up. The headline only slides (no opacity: 0) so it can
// count as the LCP element immediately.
const reveal = (delay) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE, delay },
})

/*
 * Desktop: a three-segment track with a pointer. Idle, it demonstrates the zones;
 * while the cursor is over the hero it mirrors the live zone (data-zone on the hero).
 */
function ZoneIndicator() {
  return (
    <span aria-hidden="true" className="zone-hint hidden hover-desktop:inline-flex">
      <span className="zone-track">
        <span className="zone-seg" data-seg="left" />
        <span className="zone-seg" data-seg="center" />
        <span className="zone-seg" data-seg="right" />
      </span>
      <MousePointer2 className="zone-pointer" strokeWidth={2.25} />
    </span>
  )
}

// Touch: a soft tap ripple.
function TapIndicator() {
  return (
    <span aria-hidden="true" className="tap-hint hover-desktop:hidden">
      <span className="tap-ring" />
      <span className="tap-dot" />
    </span>
  )
}

export default function HeroContent() {
  return (
    <>
      <div className="pointer-events-none relative z-20 order-1 w-full px-6 pt-20 text-center md:px-10 md:pt-28 split:mx-auto split:flex split:min-h-svh split:max-w-7xl split:flex-col split:justify-center split:pt-20 split:pb-28 split:text-left short:pt-16 short:pb-16 lg:px-14">
        <div className="mx-auto max-w-xl split:mx-0 split:max-w-[min(36rem,42vw)]">
          <h1 id="hero-title" className="text-white [text-shadow:0_2px_24px_rgb(34_5_12/0.35)]">
            <motion.span
              initial={{ y: 18 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, ease: EASE }}
              className="block text-[clamp(2.25rem,min(6vw,11svh),6rem)] leading-[0.92] font-semibold tracking-[-0.03em]"
            >
              Hi, I’m Adrita
            </motion.span>
            <motion.span
              {...reveal(0.15)}
              className="mt-3 block text-[clamp(1.4rem,min(3.4vw,6svh),3.25rem)] leading-none font-light tracking-[-0.01em] text-white/85 [font-stretch:78%] split:mt-5 short:mt-2"
            >
              SEO Executive
            </motion.span>
          </h1>

          <motion.p
            {...reveal(0.3)}
            className="mt-4 text-base text-blush-100/80 md:text-lg split:mt-6 short:mt-3"
          >
            Digital Marketing & Search Strategy
          </motion.p>

          <motion.p
            {...reveal(0.6)}
            className="mt-5 inline-flex items-center gap-3 text-sm text-blush-100/70 split:mt-12 short:mt-5"
          >
            <ZoneIndicator />
            <TapIndicator />
            <span className="hidden hover-desktop:inline">Move your cursor to interact</span>
            <span className="hover-desktop:hidden">Tap Adrita to say hi</span>
          </motion.p>
        </div>
      </div>

      <a
        href="#about"
        className="scroll-cue absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 rounded-full px-3 py-1 text-xs text-white split:bottom-8 short:bottom-3"
      >
        <span>Scroll to explore</span>
        <span className="scroll-cue-icon grid size-8 place-items-center rounded-full bg-white/10 ring-1 ring-white/25">
          <ArrowDown aria-hidden="true" className="size-4 motion-safe:animate-cue" />
        </span>
      </a>
    </>
  )
}
