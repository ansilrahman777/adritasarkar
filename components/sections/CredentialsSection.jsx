'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { BadgeCheck } from 'lucide-react'
import { EASE_OUT, Eyebrow, Reveal, RevealWords, ScriptNote } from '@/components/motion/Reveal'
import { CREDENTIALS } from '@/content/profile'

// The track loops by shifting exactly one copy's width; 4 copies cover screens up to ~2.5k px.
const COPIES = 4

// Copies after the first exist only for the seamless loop: hidden from assistive tech,
// and removed entirely on touch devices (CSS), where the track is swiped instead.
function CredentialCard({ item, copy }) {
  return (
    <li
      aria-hidden={copy > 0 ? 'true' : undefined}
      data-copy={copy}
      className="cred-item relative shrink-0 snap-start pt-10"
    >
      <span aria-hidden="true" className="absolute top-0 left-1/2 h-10 w-px -translate-x-1/2 bg-ink/20" />
      <span aria-hidden="true" className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-ink/30 ring-4 ring-paper" />
      <article className="cred-card w-[16.5rem] rounded-2xl border border-ink/[0.07] bg-white p-5 sm:w-[18rem]">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[0.68rem] font-medium tracking-[0.18em] text-crimson-500 uppercase">{item.tag}</p>
          <BadgeCheck aria-hidden="true" className="size-4 text-ink/30" />
        </div>
        <h3 className="mt-3 min-h-[2.6em] text-[1.05rem] leading-snug font-semibold tracking-tight text-ink">{item.title}</h3>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="font-mono text-[0.62rem] tracking-[0.16em] text-ink-soft/70 uppercase">Issued by</dt>
            <dd className="text-ink/80">{item.issuer}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <div>
              <dt className="font-mono text-[0.62rem] tracking-[0.16em] text-ink-soft/70 uppercase">Issued</dt>
              <dd className="text-ink/80">{item.issued}</dd>
            </div>
            {item.id && (
              <div className="text-right">
                <dt className="font-mono text-[0.62rem] tracking-[0.16em] text-ink-soft/70 uppercase">Credential</dt>
                <dd className="font-mono text-xs text-ink/70">{item.id}</dd>
              </div>
            )}
          </div>
        </dl>
      </article>
    </li>
  )
}

export default function CredentialsSection() {
  const sectionRef = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  // A little extra sideways drift tied to page scroll, on top of the looping glide.
  const drift = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['6%', '-6%'])

  return (
    <section
      id="credentials"
      ref={sectionRef}
      data-nav-theme="light"
      aria-labelledby="credentials-title"
      className="relative overflow-hidden border-t border-ink/[0.06] bg-paper py-24 text-ink sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-14">
        <Eyebrow>{CREDENTIALS.eyebrow}</Eyebrow>
        <RevealWords
          text={CREDENTIALS.title}
          underline
          className="mt-5 text-[clamp(2.2rem,4.6vw,3.75rem)] leading-[1.05] font-bold tracking-[-0.03em]"
        />
        <span id="credentials-title" className="sr-only">
          Credentials
        </span>
      </div>

      <Reveal className="relative mt-14" y={30}>
        <motion.div style={{ x: drift }} className="cred-drift">
          <div className="cred-viewport relative">
            {/* The rail the cards hang from. */}
            <div aria-hidden="true" className="absolute inset-x-0 top-1.5 h-px bg-ink/15" />
            {/* gap + equal trailing padding → each copy is exactly 1/COPIES of the width. */}
            <ul className="cred-track flex w-max gap-5 pr-5" aria-label="Certifications">
              {Array.from({ length: COPIES }, (_, copy) =>
                CREDENTIALS.items.map((item) => (
                  <CredentialCard key={`${copy}-${item.title}`} item={item} copy={copy} />
                ))
              )}
            </ul>
          </div>
        </motion.div>
      </Reveal>

      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-14">
        <ScriptNote className="mt-8 text-2xl sm:text-right">
          <span className="no-hover:hidden">{CREDENTIALS.note.hover}</span>
          <span className="can-hover:hidden">{CREDENTIALS.note.touch}</span>
        </ScriptNote>

        <div className="mt-20">
          <Reveal as="h3" className="text-2xl font-semibold tracking-tight">
            {CREDENTIALS.coursesTitle}
          </Reveal>
          <ul className="mt-6 divide-y divide-ink/[0.08] border-y border-ink/[0.08]">
            {CREDENTIALS.courses.map((course, index) => (
              <motion.li
                key={course.title}
                initial={{ opacity: 0, x: -24, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.7, ease: EASE_OUT, delay: index * 0.08 }}
                className="course-row grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 py-5 sm:grid-cols-[2fr_1fr_auto]"
              >
                <p className="font-medium">{course.title}</p>
                <p className="col-start-1 row-start-2 text-sm text-ink-soft sm:col-start-auto sm:row-start-auto">
                  {course.issuer || '—'}
                </p>
                <span className="row-span-2 rounded-full border border-ink/10 bg-white px-3 py-1 text-xs text-ink/70 sm:row-span-1">
                  {course.tag}
                </span>
              </motion.li>
            ))}
          </ul>
          <ScriptNote className="mt-6 text-2xl">{CREDENTIALS.coursesNote}</ScriptNote>
        </div>
      </div>
    </section>
  )
}
