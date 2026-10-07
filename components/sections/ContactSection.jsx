'use client'

import { useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, Mail, MapPin } from 'lucide-react'
import { CONTACT, PROFILE } from '@/content/profile'

/*
 * One giant letter. It starts as a thin vertical bar low in the frame and expands to
 * full width as the section rises — staggered left to right, like the reference.
 */
function GiantLetter({ char, index, total, progress }) {
  const reduce = useReducedMotion()
  const start = 0.1 + (index / total) * 0.35
  const end = start + 0.45
  const scaleX = useTransform(progress, [start, end], reduce ? [1, 1] : [0.08, 1])
  const y = useTransform(progress, [start, end], reduce ? ['0%', '0%'] : ['45%', '0%'])
  const opacity = useTransform(progress, [start, start + 0.12], reduce ? [1, 1] : [0, 1])

  return (
    <motion.span aria-hidden="true" style={{ scaleX, y, opacity }} className="giant-letter inline-block origin-bottom">
      {char}
    </motion.span>
  )
}

function ContactForm() {
  const [status, setStatus] = useState('')
  const cardRef = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: cardRef, offset: ['start end', 'start 35%'] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [140, 0])
  const rotateX = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [14, 0])

  // No backend: compose an email in the visitor's mail app, addressed to Adrita.
  const handleSubmit = (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (!PROFILE.email) {
      setStatus('The contact email hasn’t been set up yet — please check back soon.')
      return
    }
    const name = `${data.get('firstName')} ${data.get('lastName')}`.trim()
    const subject = `Portfolio enquiry from ${name}`
    const body = `${data.get('message')}\n\n— ${name}\n${data.get('email')}`
    window.location.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setStatus('Opening your email app with the message ready to send…')
  }

  const field =
    'peer w-full border-0 border-b border-white/35 bg-transparent px-0 pt-6 pb-2 text-white placeholder-transparent outline-none transition-colors focus:border-white'
  const label =
    'pointer-events-none absolute top-6 left-0 text-white/70 transition-all peer-focus:top-0 peer-focus:text-xs peer-focus:text-white peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs'

  return (
    <motion.div
      ref={cardRef}
      style={{ y, rotateX, transformPerspective: 1200 }}
      className="contact-card relative mx-auto grid max-w-6xl gap-12 overflow-hidden rounded-[2rem] p-7 text-white sm:p-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:p-14"
    >
      <div>
        <p className="font-mono text-xs tracking-[0.22em] text-white/70 uppercase">{CONTACT.eyebrow}</p>
        <h2 id="contact-title" className="mt-4 text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.02em]">
          {CONTACT.title}
        </h2>
        <ul className="mt-8 space-y-3 text-white/85">
          <li className="inline-flex items-center gap-2">
            <MapPin aria-hidden="true" className="size-4" />
            {PROFILE.location} · {PROFILE.timezone}
          </li>
          {PROFILE.email && (
            <li>
              <a href={`mailto:${PROFILE.email}`} className="inline-flex items-center gap-2 underline decoration-white/40 underline-offset-4 hover:decoration-white">
                <Mail aria-hidden="true" className="size-4" />
                {PROFILE.email}
              </a>
            </li>
          )}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6" aria-describedby="contact-status">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="relative">
            <input id="firstName" name="firstName" required autoComplete="given-name" placeholder="First name" className={field} />
            <label htmlFor="firstName" className={label}>First name</label>
          </div>
          <div className="relative">
            <input id="lastName" name="lastName" autoComplete="family-name" placeholder="Last name" className={field} />
            <label htmlFor="lastName" className={label}>Last name</label>
          </div>
        </div>
        <div className="relative">
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="Email" className={field} />
          <label htmlFor="email" className={label}>Email</label>
        </div>
        <div className="relative">
          <textarea id="message" name="message" required rows={4} placeholder="Your message" className={`${field} resize-none`} />
          <label htmlFor="message" className={label}>Your message</label>
        </div>
        <label className="flex items-start gap-3 text-sm text-white/80">
          <input type="checkbox" name="consent" required className="mt-0.5 size-4 shrink-0 accent-white" />
          {CONTACT.consent}
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-crimson-600 transition-transform hover:-translate-y-0.5 focus-visible:outline-white"
          >
            Send message
            <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
          <p id="contact-status" role="status" aria-live="polite" className="text-sm text-white/85">
            {status}
          </p>
        </div>
      </form>
    </motion.div>
  )
}

/*
 * The word sits at the top of a sticky frame, so it is on screen for the whole intro:
 * letters expand as the section rises, the frame pins, and the form slides over it.
 */
export default function ContactSection() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'start start'] })
  const letters = CONTACT.word.split('')

  return (
    <section
      id="contact"
      ref={sectionRef}
      data-nav-theme="dark"
      aria-labelledby="contact-title"
      className="contact-backdrop relative"
    >
      <div className="sticky top-0 flex h-svh items-start justify-center overflow-hidden pt-[16svh]">
        <p
          aria-hidden="true"
          className="giant-word flex leading-[0.8] font-extrabold tracking-[-0.02em] text-white uppercase select-none"
        >
          {letters.map((char, index) => (
            <GiantLetter key={`${char}-${index}`} char={char} index={index} total={letters.length} progress={scrollYProgress} />
          ))}
        </p>
      </div>

      <div className="relative z-10 -mt-[48svh] px-4 pb-28 sm:px-6 md:px-10">
        <ContactForm />
      </div>
    </section>
  )
}
