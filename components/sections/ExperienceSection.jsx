'use client'

import { useEffect, useRef } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { Briefcase, GraduationCap, MapPin } from 'lucide-react'
import { EASE_OUT, Eyebrow, RevealWords } from '@/components/motion/Reveal'
import { JOURNEY } from '@/content/profile'

const HORIZONTAL_QUERY = '(min-width: 768px)'

function JourneyCard({ entry, index }) {
  const isWork = entry.kind === 'work'
  const Icon = isWork ? Briefcase : GraduationCap
  const tone = entry.current
    ? 'bg-crimson-500 text-white shadow-[0_30px_60px_-28px_rgb(212_33_61/0.75)] ring-1 ring-white/10'
    : isWork
      ? 'bg-white text-ink shadow-[0_24px_50px_-30px_rgb(29_15_18/0.35)] ring-1 ring-ink/[0.06]'
      : 'bg-paper-2 text-ink ring-1 ring-ink/[0.08]'

  return (
    <motion.li
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.75, ease: EASE_OUT }}
      className="journey-item relative shrink-0 pl-9 md:w-[21rem] md:pt-12 md:pl-0 lg:w-[23rem]"
    >
      {/* Timeline dot: left rail on phones, top rail when horizontal. */}
      <span
        aria-hidden="true"
        className={`absolute top-7 left-0 grid size-5 place-items-center rounded-full md:top-0 md:left-6 ${
          entry.current ? 'bg-crimson-500' : 'bg-paper ring-2 ring-ink/15'
        }`}
      >
        {entry.current && <span className="absolute inset-0 animate-ping rounded-full bg-crimson-500/50 motion-reduce:animate-none" />}
        <span className={`size-1.5 rounded-full ${entry.current ? 'bg-white' : 'bg-ink/40'}`} />
      </span>

      <article className={`flex h-full flex-col rounded-[1.6rem] p-6 sm:p-7 ${tone}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs tracking-[0.12em] uppercase opacity-70">{entry.period}</p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-current/15 px-2.5 py-1 text-[0.7rem] font-medium">
            <Icon aria-hidden="true" className="size-3.5" />
            {entry.current ? 'Now' : isWork ? 'Work' : 'Education'}
          </span>
        </div>
        <h3 className={`mt-6 leading-tight font-semibold tracking-tight ${isWork ? 'text-2xl' : 'text-xl'}`}>{entry.title}</h3>
        <p className="mt-1.5 font-medium opacity-85">{entry.org}</p>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm opacity-65">
          <MapPin aria-hidden="true" className="size-3.5" />
          {entry.place}
        </p>
        {entry.body && <p className="mt-5 leading-relaxed opacity-80">{entry.body}</p>}
        <p aria-hidden="true" className="mt-auto pt-6 font-mono text-[0.65rem] tracking-[0.2em] opacity-40">
          {String(index + 1).padStart(2, '0')} / {String(JOURNEY.length).padStart(2, '0')}
        </p>
      </article>
    </motion.li>
  )
}

/*
 * Pinned horizontal scroll (md+): the section is made exactly as tall as the track's
 * overflow plus one viewport, the inner frame sticks, and vertical progress maps to the
 * track's translateX. On phones it is a normal vertical timeline whose rail draws itself.
 */
export default function ExperienceSection() {
  const sectionRef = useRef(null)
  const frameRef = useRef(null)
  const trackRef = useRef(null)
  const counterRef = useRef(null)
  const distanceRef = useRef(0)
  const horizontalRef = useRef(false)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const { scrollYProgress: railProgress } = useScroll({ target: trackRef, offset: ['start 75%', 'end 75%'] })

  const x = useTransform(scrollYProgress, (p) => (horizontalRef.current ? -p * distanceRef.current : 0))
  const lineFill = useTransform(scrollYProgress, [0, 1], [0, 1])
  const backdropX = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['8%', '-38%'])

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (!counterRef.current || !horizontalRef.current) return
    const current = Math.min(JOURNEY.length, Math.floor(p * JOURNEY.length) + 1)
    counterRef.current.textContent = String(current).padStart(2, '0')
  })

  useEffect(() => {
    const section = sectionRef.current
    const frame = frameRef.current
    const track = trackRef.current
    const query = window.matchMedia(HORIZONTAL_QUERY)

    let raf = 0
    const measure = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        horizontalRef.current = query.matches
        if (!query.matches) {
          distanceRef.current = 0
          section.style.height = ''
          return
        }
        const distance = Math.max(0, track.scrollWidth - frame.clientWidth)
        distanceRef.current = distance
        section.style.height = `${distance + frame.offsetHeight}px`
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    observer.observe(frame)
    query.addEventListener('change', measure)
    return () => {
      observer.disconnect()
      query.removeEventListener('change', measure)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section
      id="experience"
      ref={sectionRef}
      data-nav-theme="light"
      aria-labelledby="experience-title"
      className="relative border-t border-ink/[0.06] bg-paper text-ink"
    >
      <div
        ref={frameRef}
        className="relative py-24 md:sticky md:top-0 md:flex md:h-svh md:flex-col md:justify-center md:overflow-hidden md:py-0"
      >
        {/* The journey, literally: drifts the opposite way as you scroll. */}
        <motion.p
          aria-hidden="true"
          style={{ x: backdropX }}
          className="journey-backdrop pointer-events-none absolute bottom-[3svh] left-0 hidden text-[10vw] leading-none font-bold tracking-[-0.04em] whitespace-nowrap select-none md:block"
        >
          Kolkata → Dubai
        </motion.p>

        <div className="relative mx-auto flex w-full max-w-7xl items-end justify-between gap-6 px-6 md:px-10 lg:px-14">
          <div>
            <Eyebrow>Experience</Eyebrow>
            <RevealWords
              text="My career journey"
              underline
              className="mt-5 text-[clamp(2.2rem,4.6vw,3.75rem)] leading-[1.05] font-bold tracking-[-0.03em]"
            />
            <span id="experience-title" className="sr-only">
              Experience and education
            </span>
          </div>
          <p aria-hidden="true" className="hidden font-mono text-sm text-ink-soft md:block">
            <span ref={counterRef} className="text-ink">
              01
            </span>{' '}
            / {String(JOURNEY.length).padStart(2, '0')}
          </p>
        </div>

        <div className="relative mt-12 md:mt-14">
          {/* Horizontal rail (md+) filling with progress. */}
          <div aria-hidden="true" className="absolute top-2.5 right-0 left-0 hidden h-px bg-ink/10 md:block">
            <motion.div style={{ scaleX: lineFill }} className="h-full origin-left bg-crimson-500" />
          </div>
          {/* Vertical rail (phones) drawing with scroll. */}
          <div aria-hidden="true" className="absolute top-0 bottom-0 left-[calc(1.5rem+0.6rem)] w-px bg-ink/10 md:hidden">
            <motion.div style={{ scaleY: railProgress }} className="h-full w-full origin-top bg-crimson-500" />
          </div>

          <motion.ol
            ref={trackRef}
            style={{ x }}
            className="journey-track flex flex-col gap-6 will-change-transform md:w-max md:flex-row md:items-start"
          >
            {JOURNEY.map((entry, index) => (
              <JourneyCard key={`${entry.org}-${entry.period}`} entry={entry} index={index} />
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  )
}
