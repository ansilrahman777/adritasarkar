'use client'

import { Fragment } from 'react'
import { motion } from 'framer-motion'

export const EASE_OUT = [0.22, 1, 0.36, 1]
const VIEWPORT = { once: true, margin: '0px 0px -12% 0px' }

/*
 * Words arrive one after another out of a soft motion blur — the heading treatment
 * used throughout the reference. Text stays real, selectable HTML for SEO.
 * `underline` draws a crimson stroke under the first word once it has landed.
 */
export function RevealWords({ as = 'h2', text, className = '', underline = false, delay = 0 }) {
  const Tag = motion[as]
  const words = text.split(' ')

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      transition={{ staggerChildren: 0.07, delayChildren: delay }}
    >
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <motion.span
            className="relative inline-block will-change-transform"
            variants={{
              hidden: { opacity: 0, y: '0.45em', filter: 'blur(10px)', skewX: -6 },
              visible: {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                skewX: 0,
                transition: { duration: 0.75, ease: EASE_OUT },
              },
            }}
          >
            {word}
            {underline && index === 0 && (
              <motion.span
                aria-hidden="true"
                className="absolute -bottom-[0.12em] left-0 h-[0.07em] min-h-[3px] w-full origin-left rounded-full bg-crimson-500"
                variants={{
                  hidden: { scaleX: 0 },
                  visible: { scaleX: 1, transition: { duration: 0.7, ease: EASE_OUT, delay: 0.45 } },
                }}
              />
            )}
          </motion.span>
          {index < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  )
}

// Fade-up with a touch of blur for paragraphs, cards and groups.
export function Reveal({ as = 'div', children, className = '', delay = 0, y = 24, ...rest }) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={VIEWPORT}
      transition={{ duration: 0.8, ease: EASE_OUT, delay }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function Eyebrow({ children, tone = 'light', className = '' }) {
  const tones = {
    light: 'border-ink/10 bg-white/70 text-ink-soft',
    dark: 'border-white/15 bg-white/5 text-blush-100/80',
  }
  return (
    <Reveal
      as="p"
      y={10}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[0.68rem] tracking-[0.18em] uppercase ${tones[tone]} ${className}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-crimson-500" />
      {children}
    </Reveal>
  )
}

// Handwritten annotation that "writes" itself in from left to right.
export function ScriptNote({ children, className = '', delay = 0.2 }) {
  return (
    <motion.p
      className={`font-script text-ink-soft/80 ${className}`}
      initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.4 }}
      whileInView={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
      viewport={VIEWPORT}
      transition={{ duration: 1.6, ease: [0.45, 0, 0.25, 1], delay }}
    >
      {children}
    </motion.p>
  )
}
