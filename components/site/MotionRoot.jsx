'use client'

import { MotionConfig } from 'framer-motion'

// Honour prefers-reduced-motion for every Framer Motion animation on the page.
export default function MotionRoot({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
