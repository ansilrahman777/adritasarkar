'use client'

import { motion } from 'framer-motion'
import { EASE_OUT, Eyebrow, Reveal, RevealWords } from '@/components/motion/Reveal'
import { SKILLS } from '@/content/profile'

const chip = {
  hidden: { opacity: 0, y: 12, filter: 'blur(6px)', scale: 0.96 },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1, transition: { duration: 0.55, ease: EASE_OUT } },
}

export default function SkillsSection() {
  return (
    <section
      id="skills"
      data-nav-theme="light"
      aria-labelledby="skills-title"
      className="relative border-t border-ink/[0.06] bg-paper py-24 text-ink sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-14">
        <Eyebrow>{SKILLS.eyebrow}</Eyebrow>
        <RevealWords
          text={SKILLS.title}
          underline
          className="mt-5 text-[clamp(2.2rem,4.6vw,3.75rem)] leading-[1.05] font-bold tracking-[-0.03em]"
        />
        <span id="skills-title" className="sr-only">
          Skills
        </span>
        <Reveal as="p" delay={0.1} className="mt-4 max-w-[36rem] text-lg text-ink-soft">
          {SKILLS.intro}
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 md:gap-6">
          {SKILLS.groups.map((group, groupIndex) => (
            <Reveal
              key={group.title}
              delay={groupIndex * 0.08}
              className="skill-group rounded-[1.5rem] border border-ink/[0.07] bg-white/80 p-6 shadow-[0_20px_50px_-30px_rgb(29_15_18/0.25)] sm:p-8"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-semibold tracking-tight">{group.title}</h3>
                <span aria-hidden="true" className="font-mono text-xs text-ink-soft/60">
                  {String(groupIndex + 1).padStart(2, '0')}
                </span>
              </div>
              <motion.ul
                className="mt-5 flex flex-wrap gap-2"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                transition={{ staggerChildren: 0.06, delayChildren: 0.15 + groupIndex * 0.05 }}
              >
                {group.items.map((item) => (
                  <motion.li
                    key={item}
                    variants={chip}
                    className="skill-chip rounded-full border border-ink/10 bg-paper px-3.5 py-1.5 text-sm text-ink/85"
                  >
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
