'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { EASE_OUT, Eyebrow, Reveal, RevealWords, ScriptNote } from '@/components/motion/Reveal'
import { PROJECTS } from '@/content/profile'

function ProjectCard({ project, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40, filter: 'blur(10px)', rotate: index % 2 ? 1.5 : -1.5 }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', rotate: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.85, ease: EASE_OUT, delay: index * 0.12 }}
      className="project-card group relative flex flex-col rounded-[1.6rem] border border-ink/[0.07] bg-white p-7 sm:p-9"
    >
      <p className="font-mono text-[0.7rem] font-medium tracking-[0.18em] text-crimson-500 uppercase">
        {project.tags.join(' • ')}
      </p>
      <h3 className="mt-4 text-2xl leading-tight font-semibold tracking-tight sm:text-[1.75rem]">{project.title}</h3>
      <p className="mt-2 text-sm text-ink-soft">
        {project.org} · {project.period}
      </p>
      <p className="mt-5 leading-relaxed text-ink/75">{project.body}</p>

      {project.results.length > 0 && (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {project.results.map((result) => (
            <li key={result.label} className="rounded-2xl bg-paper p-4">
              <p className="text-2xl font-bold text-crimson-500">{result.value}</p>
              <p className="mt-1 text-sm text-ink-soft">{result.label}</p>
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Skills used">
        {project.skills.map((skill) => (
          <li key={skill} className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs text-ink/75">
            {skill}
          </li>
        ))}
      </ul>

      {project.href && (
        <a
          href={project.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink underline decoration-crimson-500/40 underline-offset-4 transition-colors hover:decoration-crimson-500"
        >
          View case study <ArrowUpRight aria-hidden="true" className="size-4" />
        </a>
      )}
    </motion.article>
  )
}

export default function ProjectsSection() {
  return (
    <section
      id="projects"
      data-nav-theme="light"
      aria-labelledby="projects-title"
      className="relative border-t border-ink/[0.06] bg-paper py-24 text-ink sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-14">
        <Eyebrow>{PROJECTS.eyebrow}</Eyebrow>
        <RevealWords
          text={PROJECTS.title}
          underline
          className="mt-5 max-w-[18ch] text-[clamp(2.2rem,4.6vw,3.75rem)] leading-[1.05] font-bold tracking-[-0.03em]"
        />
        <span id="projects-title" className="sr-only">
          Projects
        </span>
        <Reveal as="p" delay={0.1} className="mt-4 max-w-[36rem] text-lg text-ink-soft">
          {PROJECTS.intro}
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {PROJECTS.items.map((project, index) => (
            <ProjectCard key={project.title} project={project} index={index} />
          ))}
        </div>

        <ScriptNote className="mt-12 text-center text-2xl sm:text-3xl">{PROJECTS.note}</ScriptNote>
      </div>
    </section>
  )
}
