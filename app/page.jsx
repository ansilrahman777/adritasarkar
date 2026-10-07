import InteractiveHero from '@/components/hero/InteractiveHero'
import AboutSection from '@/components/sections/AboutSection'
import ContactSection from '@/components/sections/ContactSection'
import CredentialsSection from '@/components/sections/CredentialsSection'
import ExperienceSection from '@/components/sections/ExperienceSection'
import ExpertiseSection from '@/components/sections/ExpertiseSection'
import ProjectsSection from '@/components/sections/ProjectsSection'
import SkillsSection from '@/components/sections/SkillsSection'
import MotionRoot from '@/components/site/MotionRoot'
import SiteCursor from '@/components/site/SiteCursor'
import SiteFooter from '@/components/site/SiteFooter'
import SiteNavigation from '@/components/site/SiteNavigation'
import { CREDENTIALS, JOURNEY, PROFILE, SKILLS } from '@/content/profile'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: PROFILE.name,
  jobTitle: PROFILE.role,
  description: PROFILE.summary,
  url: siteUrl,
  ...(PROFILE.email && { email: `mailto:${PROFILE.email}` }),
  ...(PROFILE.linkedin && { sameAs: [PROFILE.linkedin] }),
  address: { '@type': 'PostalAddress', addressLocality: 'Dubai', addressCountry: 'AE' },
  worksFor: { '@type': 'Organization', name: PROFILE.currentRole.company },
  alumniOf: JOURNEY.filter((entry) => entry.kind === 'education').map((entry) => ({
    '@type': 'EducationalOrganization',
    name: entry.org,
  })),
  knowsAbout: SKILLS.groups.flatMap((group) => group.items),
  knowsLanguage: PROFILE.languages,
  hasCredential: CREDENTIALS.items.map((item) => ({
    '@type': 'EducationalOccupationalCredential',
    name: item.title,
    recognizedBy: { '@type': 'Organization', name: item.issuer },
  })),
}

export default function HomePage() {
  return (
    <MotionRoot>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <SiteNavigation />
      <main>
        <InteractiveHero />
        <AboutSection />
        <ExpertiseSection />
        <SkillsSection />
        <ExperienceSection />
        <ProjectsSection />
        <CredentialsSection />
        <ContactSection />
      </main>
      <SiteFooter />
      <SiteCursor />
    </MotionRoot>
  )
}
