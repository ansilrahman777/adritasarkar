'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { NAV_LINKS, PROFILE } from '@/content/profile'

/*
 * Fixed site navigation.
 * - Theme follows the section under the bar (sections declare data-nav-theme), set as a
 *   data attribute → CSS only, no React render on scroll.
 * - Active link (scroll spy) gets the red glowing pill, which slides between links.
 * - Frosted background once the page has scrolled.
 */
export default function SiteNavigation() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('home')
  const headerRef = useRef(null)
  const toggleRef = useRef(null)
  const firstLinkRef = useRef(null)

  useEffect(() => {
    const header = headerRef.current
    const sections = NAV_LINKS.map(({ id }) => document.getElementById(id)).filter(Boolean)
    const themed = [...document.querySelectorAll('[data-nav-theme]')]

    // Active section: whichever crosses a band just above the middle of the viewport.
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id))
      },
      { rootMargin: '-40% 0px -55% 0px' }
    )
    sections.forEach((section) => spy.observe(section))

    // Theme: whichever themed block sits under the top 64px of the viewport.
    const theme = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) header.dataset.theme = entry.target.dataset.navTheme
        })
      },
      { rootMargin: '0px 0px -92% 0px' }
    )
    themed.forEach((block) => theme.observe(block))

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        header.dataset.scrolled = String(window.scrollY > 24)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      spy.disconnect()
      theme.disconnect()
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  // Close the mobile menu when resizing into the desktop layout.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)')
    const close = () => query.matches && setOpen(false)
    query.addEventListener('change', close)
    return () => query.removeEventListener('change', close)
  }, [])

  // While open: Escape / outside click close it, page scroll is locked, focus moves in.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      toggleRef.current?.focus()
    }
    const onPointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) setOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    firstLinkRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <header
      ref={headerRef}
      data-theme="dark"
      data-scrolled="false"
      className="site-nav group/nav fixed inset-x-0 top-0 z-50"
    >
      <nav
        aria-label="Primary"
        className="site-nav-bar mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10 lg:px-14"
      >
        <a href="#home" className="nav-ink rounded text-xl font-semibold tracking-tight [font-stretch:85%]">
          {PROFILE.firstName}
          <span className="text-crimson-500">.</span>
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map(({ id, label }) => {
            const isActive = active === id
            return (
              <li key={id} className="relative">
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    aria-hidden="true"
                    className="nav-pill absolute inset-0 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <a
                  href={`#${id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`relative block rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                    isActive ? 'text-white' : 'nav-ink-soft hover:nav-ink'
                  }`}
                >
                  {label}
                </a>
              </li>
            )
          })}
        </ul>

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
          className="nav-ink -mr-2 grid size-10 place-items-center rounded-full lg:hidden"
        >
          {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            data-nav-theme="dark"
            initial={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-x-4 top-[4.25rem] rounded-2xl bg-wine-950/95 p-2 ring-1 ring-white/10 backdrop-blur-md lg:hidden"
          >
            <ul>
              {NAV_LINKS.map(({ id, label }, index) => (
                <li key={id}>
                  <a
                    ref={index === 0 ? firstLinkRef : undefined}
                    href={`#${id}`}
                    aria-current={active === id ? 'true' : undefined}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-lg text-blush-100 transition-colors hover:bg-white/5 hover:text-white aria-[current]:text-white"
                  >
                    {label}
                    {active === id && <span aria-hidden="true" className="size-2 rounded-full bg-crimson-500 shadow-[0_0_10px_var(--color-crimson-500)]" />}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
