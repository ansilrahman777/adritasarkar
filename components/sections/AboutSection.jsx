'use client'

import { useEffect, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { BarChart3, MapPin, Megaphone, PenLine, Search } from 'lucide-react'
import { CLIPS, CLIP_SRC } from '@/components/hero/constants'
import { EASE_OUT, Reveal, RevealWords } from '@/components/motion/Reveal'
import { ABOUT, PROFILE } from '@/content/profile'

const FLOATING_ICONS = [
  { Icon: Search, label: 'SEO' },
  { Icon: Megaphone, label: 'Paid media' },
  { Icon: PenLine, label: 'Content' },
  { Icon: BarChart3, label: 'Analytics' },
]

/*
 * Badge picture: a paused still of Adrita looking at the camera, taken from her own
 * center-look.mp4 (already cached by the hero). Loads only when the badge nears view.
 */
function BadgePhoto() {
  const videoRef = useRef(null)

  useEffect(() => {
    if (ABOUT.badgePhoto) return
    const video = videoRef.current
    if (!video) return

    const seekToStill = () => {
      if (Number.isFinite(video.duration)) video.currentTime = video.duration * ABOUT.badgeStillAt
    }
    video.addEventListener('loadedmetadata', seekToStill, { once: true })

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        video.src = CLIP_SRC[CLIPS.CENTER_LOOK]
        video.load()
        observer.disconnect()
      },
      { rootMargin: '600px 0px' }
    )
    observer.observe(video)
    return () => {
      observer.disconnect()
      video.removeEventListener('loadedmetadata', seekToStill)
    }
  }, [])

  if (ABOUT.badgePhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={ABOUT.badgePhoto} alt="" loading="lazy" className="badge-photo h-full w-full" />
    )
  }

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      preload="metadata"
      tabIndex={-1}
      aria-hidden="true"
      disablePictureInPicture
      className="badge-photo pointer-events-none h-full w-full"
    />
  )
}

function LanyardBadge({ progress }) {
  const reduce = useReducedMotion()
  // Swings in from a tilted, lowered position and settles as the section arrives.
  const rawRotate = useTransform(progress, [0, 1], reduce ? [-2, -2] : [-11, -2])
  const rawY = useTransform(progress, [0, 1], reduce ? [0, 0] : [140, 0])
  const rotate = useSpring(rawRotate, { stiffness: 60, damping: 9, mass: 0.8 })
  const y = useSpring(rawY, { stiffness: 80, damping: 18 })

  /*
   * Strap, clip and card hang from one pivot 45vh above the clip (beyond the section's
   * top edge, so the strap seems to come down from the hero). Scroll drives the swing-in;
   * .badge-sway adds a slow idle pendulum around the same pivot.
   */
  return (
    <div className="relative mx-auto w-full max-w-[17rem] pt-28 sm:max-w-[19rem] sm:pt-36">
      <motion.figure style={{ rotate, y }} className="relative w-full origin-[50%_-45vh]">
        <div className="badge-sway origin-[50%_-45vh]">
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute bottom-[calc(100%-0.75rem)] left-1/2 h-[45vh] w-24 -translate-x-1/2"
          >
            <defs>
              <linearGradient id="lanyard-strap" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#3d0913" />
                <stop offset="1" stopColor="#e0344f" />
              </linearGradient>
            </defs>
            <path d="M30 0 L47 100 M70 0 L53 100" stroke="url(#lanyard-strap)" strokeWidth="9" fill="none" vectorEffect="non-scaling-stroke" />
          </svg>
          <div aria-hidden="true" className="relative mx-auto -mb-2 h-7 w-10 rounded-t-lg rounded-b-sm bg-gradient-to-b from-zinc-200 to-zinc-500 shadow-md" />
          <div className="badge-card relative overflow-hidden rounded-[1.75rem] p-3 pb-5">
          <div aria-hidden="true" className="mx-auto mb-3 h-2.5 w-16 rounded-full bg-black/40 ring-1 ring-white/10" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-wine-800">
            <BadgePhoto />
            <div aria-hidden="true" className="badge-gloss pointer-events-none absolute inset-0" />
          </div>
          <figcaption className="px-2 pt-4 text-left">
            <p className="text-lg leading-tight font-semibold text-white">{PROFILE.name}</p>
            <p className="mt-0.5 text-sm text-blush-100/75">{PROFILE.role}</p>
            <div className="mt-3 flex items-center justify-between font-mono text-[0.62rem] tracking-[0.14em] text-blush-100/55 uppercase">
              <span>{PROFILE.currentRole.company}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin aria-hidden="true" className="size-3" /> DXB
              </span>
            </div>
            <div aria-hidden="true" className="badge-barcode mt-3 h-6 rounded-sm opacity-60" />
          </figcaption>
          </div>
        </div>
      </motion.figure>
    </div>
  )
}

function Sparkle({ className, progress }) {
  const reduce = useReducedMotion()
  const rotate = useTransform(progress, [0, 1], reduce ? [0, 0] : [-45, 90])
  return (
    <motion.svg aria-hidden="true" viewBox="0 0 40 40" style={{ rotate }} className={className}>
      <path d="M20 0 C21 13 27 19 40 20 C27 21 21 27 20 40 C19 27 13 21 0 20 C13 19 19 13 20 0Z" fill="currentColor" />
    </motion.svg>
  )
}

export default function AboutSection() {
  const sectionRef = useRef(null)
  const { scrollYProgress: enter } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start 0.25'],
  })
  const { scrollYProgress: through } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const reduce = useReducedMotion()
  const waveBackX = useTransform(through, [0, 1], reduce ? ['0%', '0%'] : ['-6%', '2%'])
  const [firstLine, ...rest] = ABOUT.paragraphs

  return (
    <section
      id="about"
      ref={sectionRef}
      data-nav-theme="dark"
      aria-labelledby="about-title"
      className="about-backdrop relative overflow-hidden pb-36 sm:pb-44"
    >
      <Sparkle progress={through} className="absolute bottom-40 left-[6%] size-10 text-crimson-500/80 sm:size-14" />
      <Sparkle progress={through} className="absolute top-32 right-[8%] size-5 text-coral-400/60" />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 md:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:px-14">
        <LanyardBadge progress={enter} />

        <div className="relative z-10">
          <RevealWords
            as="h2"
            text={ABOUT.greeting}
            className="text-[clamp(3rem,8vw,6.5rem)] leading-none font-bold tracking-[-0.03em] text-white"
          />
          <span id="about-title" className="sr-only">
            About {PROFILE.name}
          </span>

          <Reveal as="p" delay={0.1} className="mt-6 max-w-[34rem] text-lg leading-relaxed text-blush-100/85 md:text-xl">
            Hi, my name is{' '}
            <span className="relative inline-block font-semibold whitespace-nowrap text-wine-950">
              <motion.span
                aria-hidden="true"
                className="absolute -inset-x-1.5 -inset-y-0.5 -z-0 origin-left rounded-md bg-blush-100"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.5 }}
              />
              <span className="relative">{PROFILE.name}</span>
            </span>
            . {firstLine}
          </Reveal>

          {rest.map((paragraph, index) => (
            <Reveal key={index} as="p" delay={0.2 + index * 0.1} className="mt-4 max-w-[34rem] leading-relaxed text-blush-100/70">
              {paragraph}
            </Reveal>
          ))}

          <dl className="mt-10 grid max-w-[34rem] grid-cols-1 gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
            {ABOUT.facts.map((fact, index) => (
              <Reveal key={fact.label} delay={0.25 + index * 0.08} y={14}>
                <dt className="font-mono text-[0.65rem] tracking-[0.16em] text-blush-100/50 uppercase">{fact.label}</dt>
                <dd className="mt-1 font-medium text-white">{fact.value}</dd>
              </Reveal>
            ))}
          </dl>

          <ul aria-label="Focus areas" className="mt-10 flex gap-3">
            {FLOATING_ICONS.map(({ Icon, label }, index) => (
              <motion.li
                key={label}
                title={label}
                initial={{ opacity: 0, scale: 0.6, y: 12 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.4 + index * 0.08 }}
                className="float-chip grid size-12 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-sm"
                style={{ '--float-delay': `${index * -0.7}s` }}
              >
                <Icon aria-hidden="true" className="size-5" />
                <span className="sr-only">{label}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* Wave into the light sections; the back layer drifts for depth. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 sm:h-36">
        <motion.svg style={{ x: waveBackX }} viewBox="0 0 1440 160" preserveAspectRatio="none" className="absolute bottom-0 left-[-5%] h-full w-[110%] text-paper/35">
          <path d="M0 70 C 240 10 420 130 720 80 C 1000 34 1200 120 1440 60 L1440 160 L0 160Z" fill="currentColor" />
        </motion.svg>
        <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="absolute bottom-0 h-full w-full text-paper">
          <path d="M0 110 C 300 40 520 150 820 100 C 1080 56 1260 130 1440 90 L1440 160 L0 160Z" fill="currentColor" />
        </svg>
      </div>
    </section>
  )
}
