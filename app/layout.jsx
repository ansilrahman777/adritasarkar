import { Bricolage_Grotesque, Caveat, JetBrains_Mono } from 'next/font/google'
import { PROFILE } from '@/content/profile'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz', 'wdth'],
  display: 'swap',
  variable: '--font-bricolage',
})

// Handwritten annotations ("Turning searches into growth…").
const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500'],
  display: 'swap',
  variable: '--font-caveat',
})

// Footer / form micro-copy.
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-jetbrains',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const description = `${PROFILE.name} is an SEO Executive and digital marketer based in ${PROFILE.location} — SEO, SEM, PPC, content and analytics for brand growth.`

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${PROFILE.name} — SEO Executive in Dubai | Digital Marketing & Search Strategy`,
    template: `%s | ${PROFILE.firstName}`,
  },
  description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'profile',
    url: '/',
    siteName: PROFILE.name,
    title: `${PROFILE.name} — SEO Executive`,
    description,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PROFILE.name} — SEO Executive`,
    description,
  },
  robots: { index: true, follow: true },
}

export const viewport = {
  themeColor: '#22050c',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${caveat.variable} ${mono.variable}`}>
      <body className="bg-wine-950 font-sans text-blush-100 antialiased">
        <a
          href="#about"
          className="sr-only rounded-full bg-blush-100 px-4 py-2 text-sm font-medium text-wine-950 focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60]"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
