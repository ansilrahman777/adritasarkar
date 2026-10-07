'use client'

import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { PROFILE, yearsOfExperience } from '@/content/profile'

const ECHOES = [1, 2, 3]

function EchoLayer({ velocity, depth }) {
  const y = useTransform(velocity, [-2500, 0, 2500], [-26 * depth, 0, 26 * depth], { clamp: true })
  const opacity = useTransform(velocity, [-1500, -150, 0, 150, 1500], [0.55 / depth, 0, 0, 0, 0.55 / depth])
  return (
    <motion.span aria-hidden="true" style={{ y, opacity }} className="wordmark-echo absolute inset-0 motion-reduce:hidden">
      {PROFILE.firstName.toLowerCase()}
    </motion.span>
  )
}

/*
 * The wordmark trails copies of itself in the direction of travel, proportional to
 * scroll speed, and collapses back into one when scrolling stops. The echoes always
 * render (identical server/client markup) and are hidden by CSS for reduced motion.
 */
function Wordmark() {
  const { scrollY } = useScroll()
  const velocity = useSpring(useVelocity(scrollY), { damping: 40, stiffness: 300 })

  return (
    <p className="wordmark relative text-center leading-[0.8] font-extrabold tracking-[-0.05em] text-white select-none">
      {ECHOES.map((depth) => (
        <EchoLayer key={depth} velocity={velocity} depth={depth} />
      ))}
      <span className="relative">{PROFILE.firstName.toLowerCase()}</span>
    </p>
  )
}

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer data-nav-theme="dark" className="relative overflow-hidden bg-[#0b0205] px-6 pt-20 pb-8 font-mono text-[0.78rem] text-white/70 md:px-10 lg:px-14">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-3">
        <div>
          <p className="text-white">Search &amp; Performance Marketing</p>
          <p className="mt-1">SEO · SEM · PPC</p>
          <p>Content &amp; Social · Analytics &amp; CRO</p>
        </div>
        <div className="sm:text-center">
          <p className="text-white" suppressHydrationWarning>
            {yearsOfExperience()}+ years of experience
          </p>
          <a href="#experience" className="mt-1 inline-block underline decoration-white/30 underline-offset-4 hover:text-white">
            View journey
          </a>
        </div>
        <div className="sm:text-right">
          <p className="text-white">Based in {PROFILE.location}</p>
          <p className="mt-1">{PROFILE.timezone}</p>
          {PROFILE.email && (
            <a href={`mailto:${PROFILE.email}`} className="mt-1 inline-block underline decoration-white/30 underline-offset-4 hover:text-white">
              {PROFILE.email}
            </a>
          )}
          {PROFILE.linkedin && (
            <a
              href={PROFILE.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block underline decoration-white/30 underline-offset-4 hover:text-white"
            >
              LinkedIn
            </a>
          )}
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-[100rem] sm:mt-20">
        <Wordmark />
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p suppressHydrationWarning>
          © {year} {PROFILE.name} · {PROFILE.tagline}
        </p>
        <a href="#home" className="inline-flex items-center gap-1.5 rounded hover:text-white">
          Back to top <ArrowUp aria-hidden="true" className="size-3.5" />
        </a>
      </div>
    </footer>
  )
}
