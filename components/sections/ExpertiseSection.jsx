'use client'

import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { Eyebrow, Reveal, RevealWords, ScriptNote } from '@/components/motion/Reveal'
import { EXPERTISE } from '@/content/profile'

// Resting tilt per card, alternating like tags pinned by hand.
const TILTS = [4, -5, 3, -4, 5]

/*
 * One hanging tag. Its own scroll progress (entering → reaching 45% of the viewport)
 * drives everything: it swings upright, sharpens, and fills from paper-white to crimson.
 * Pure motion values — scrolling never re-renders React.
 */
function TagCard({ item, index, cardRef }) {
  const reduce = useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: cardRef, offset: ['start 95%', 'start 45%'] })
  const tilt = TILTS[index % TILTS.length]

  const rotate = useTransform(p, [0, 1], reduce ? [tilt, tilt] : [tilt * 3.2, tilt])
  const y = useTransform(p, [0, 1], reduce ? [0, 0] : [70, 0])
  const blur = useTransform(p, [0, 0.7], reduce ? [0, 0] : [6, 0])
  const filter = useMotionTemplate`blur(${blur}px)`
  const opacity = useTransform(p, [0, 0.5], [0.35, 1])
  const fill = useTransform(p, [0.55, 0.9], [0, 1])
  const color = useTransform(p, [0.55, 0.9], ['#1d0f12', '#ffffff'])

  return (
    <motion.article
      ref={cardRef}
      style={{ rotate, y, filter, opacity, color }}
      className="tag-card relative w-[82%] sm:w-[68%] lg:w-[46%]"
      data-index={index}
    >
      <div className="tag-card-body relative overflow-hidden rounded-[1.6rem] p-6 pt-9 sm:p-7 sm:pt-10">
        <motion.div aria-hidden="true" style={{ opacity: fill }} className="tag-card-fill absolute inset-0" />
        <span aria-hidden="true" className="tag-pin absolute top-3.5 left-1/2 size-3.5 -translate-x-1/2 rounded-full" />
        <div className="relative">
          <p className="font-mono text-xs tracking-[0.2em] opacity-60">{String(index + 1).padStart(2, '0')}</p>
          <h3 className="mt-2 text-xl leading-tight font-semibold tracking-tight sm:text-[1.4rem]">{item.title}</h3>
          <p className="mt-3 text-[0.95rem] leading-relaxed opacity-75">{item.body}</p>
          <ul className="mt-5 flex flex-wrap gap-1.5" aria-label={`${item.title} tags`}>
            {item.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-current/20 px-2.5 py-0.5 text-xs opacity-80">
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.article>
  )
}

/*
 * Dashed connector through the real card positions (re-measured on resize), so it
 * stays attached at every breakpoint. Revealed by a mask that grows with scroll.
 */
function buildPath(board, cards) {
  const origin = board.getBoundingClientRect()
  // offsetTop/Left ignore the cards' scroll transforms → stable anchors.
  const boxes = cards.map((card) => ({
    x: card.offsetLeft,
    y: card.offsetTop,
    w: card.offsetWidth,
    h: card.offsetHeight,
  }))

  let d = ''
  for (let i = 0; i < boxes.length - 1; i += 1) {
    const a = boxes[i]
    const b = boxes[i + 1]
    const end = { x: b.x + b.w / 2, y: b.y + 14 } // the next card's pin
    const overlap = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
    const start =
      overlap > Math.min(a.w, b.w) * 0.5
        ? { x: a.x + a.w / 2, y: a.y + a.h - 6 } // stacked → leave from the bottom
        : end.x < a.x
          ? { x: a.x + 8, y: a.y + a.h * 0.55 } // next is left → leave from the left edge
          : { x: a.x + a.w - 8, y: a.y + a.h * 0.55 }
    const c1 = { x: start.x + (end.x - start.x) * 0.55, y: start.y }
    const c2 = { x: end.x, y: start.y + (end.y - start.y) * 0.45 }
    d += `M${start.x} ${start.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y - 10} `
  }
  return { d: d.trim(), width: origin.width, height: board.offsetHeight }
}

function TagBoard() {
  const boardRef = useRef(null)
  const cardRefs = useRef(EXPERTISE.items.map(() => ({ current: null })))
  const [path, setPath] = useState(null)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({ target: boardRef, offset: ['start 75%', 'end 60%'] })
  const draw = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0, 1])

  useEffect(() => {
    const board = boardRef.current
    const cards = cardRefs.current.map((ref) => ref.current).filter(Boolean)
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setPath(buildPath(board, cards)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(board)
    cards.forEach((card) => observer.observe(card))
    document.fonts?.ready.then(measure)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={boardRef} className="tag-board relative">
      {path && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-visible"
          width={path.width}
          height={path.height}
          viewBox={`0 0 ${path.width} ${path.height}`}
        >
          <defs>
            <mask id="tag-path-mask" maskUnits="userSpaceOnUse">
              <motion.path d={path.d} stroke="#fff" strokeWidth="6" fill="none" style={{ pathLength: draw }} />
            </mask>
          </defs>
          <path
            d={path.d}
            mask="url(#tag-path-mask)"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="5 7"
            strokeLinecap="round"
            className="text-ink/35"
          />
        </svg>
      )}

      {EXPERTISE.items.map((item, index) => (
        <TagCard key={item.title} item={item} index={index} cardRef={cardRefs.current[index]} />
      ))}
    </div>
  )
}

export default function ExpertiseSection() {
  return (
    <section
      id="expertise"
      data-nav-theme="light"
      aria-labelledby="expertise-title"
      className="relative bg-paper pt-16 pb-28 text-ink sm:pt-20 lg:pb-40"
    >
      <div className="mx-auto grid max-w-7xl gap-16 px-6 md:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10 lg:px-14">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Eyebrow>{EXPERTISE.eyebrow}</Eyebrow>
          <RevealWords
            text={EXPERTISE.title}
            className="mt-5 max-w-[16ch] text-[clamp(2.3rem,4.2vw,3.75rem)] leading-[1.02] font-bold tracking-[-0.03em]"
          />
          <span id="expertise-title" className="sr-only">
            Expertise
          </span>
          <Reveal as="p" delay={0.15} className="mt-6 max-w-[30rem] text-lg leading-relaxed text-ink-soft">
            {EXPERTISE.intro}
          </Reveal>

          {/* Hand-drawn arrow towards the tags. */}
          <motion.svg
            aria-hidden="true"
            viewBox="0 0 160 90"
            className="mt-8 hidden h-20 w-40 text-ink/40 lg:block"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.path
              d="M6 10 C 40 80, 100 80, 148 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1, transition: { duration: 1.2, delay: 0.4 } } }}
            />
            <motion.path
              d="M136 34 L149 40 L140 52"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 1.5 } } }}
            />
          </motion.svg>

          <ScriptNote className="mt-6 hidden text-3xl lg:block">{EXPERTISE.note}</ScriptNote>
        </div>

        <TagBoard />
      </div>
    </section>
  )
}
