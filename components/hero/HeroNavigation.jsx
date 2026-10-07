'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#experience', label: 'Experience' },
  { href: '#projects', label: 'Projects' },
  { href: '#contact', label: 'Contact' },
]

export default function HeroNavigation() {
  const [open, setOpen] = useState(false)
  const headerRef = useRef(null)
  const toggleRef = useRef(null)
  const firstLinkRef = useRef(null)

  // Close when resizing into the desktop layout.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
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
    <header ref={headerRef} className="absolute inset-x-0 top-0 z-30">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10 md:py-7 lg:px-14"
      >
        <a
          href="#home"
          className="rounded text-xl font-semibold tracking-tight text-white [font-stretch:85%]"
        >
          Adrita
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className="rounded text-sm text-white/75 transition-colors hover:text-white"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
          className="-mr-2 grid size-10 place-items-center rounded-full text-white md:hidden"
        >
          {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute inset-x-4 top-[4.25rem] rounded-2xl bg-wine-950/95 p-2 ring-1 ring-white/10 backdrop-blur-md md:hidden"
          >
            <ul>
              {LINKS.map(({ href, label }, index) => (
                <li key={href}>
                  <a
                    ref={index === 0 ? firstLinkRef : undefined}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-lg text-blush-100 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {label}
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
