/*
 * All portfolio copy lives here. Sourced from Adrita Sarkar's CV (Oct 2026).
 *
 * Before publishing, fill the fields marked ⚠ — the CV leaves them blank, and nothing
 * here is invented (no fake metrics, links or contact details).
 */

export const PROFILE = {
  name: 'Adrita Sarkar',
  firstName: 'Adrita',
  role: 'SEO Executive',
  tagline: 'Digital Marketing & Search Strategy',
  location: 'Dubai, UAE',
  timezone: 'GST · UTC+4',
  summary: 'Digital marketer focused on growth across brands through content, advertising and performance strategy.',
  currentRole: { title: 'Digital Marketing Executive', company: 'Falcon Group UAE' },
  careerStart: '2022-10', // first marketing role — drives "N+ years of experience"
  email: '', // ⚠ professional email — the contact form and footer link appear once set
  linkedin: '', // ⚠ full LinkedIn URL — shown in the footer once set
  languages: ['English'],
}

export function yearsOfExperience(now = new Date()) {
  const [year, month] = PROFILE.careerStart.split('-').map(Number)
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
  return Math.max(1, Math.floor(months / 12))
}

export const ABOUT = {
  greeting: 'Hello!',
  // ID-badge picture. Empty → a still of Adrita from her own center-look.mp4.
  // Or put a file in /public (e.g. '/about/adrita.jpg') to use that instead.
  badgePhoto: '',
  badgeStillAt: 0.9, // where in center-look.mp4 to take the still (0–1, eye contact near the end)
  paragraphs: [
    'I’m a digital marketer based in Dubai, currently Digital Marketing Executive at Falcon Group UAE — growing brands through content, advertising and performance strategy.',
    'Before moving to Dubai I spent nearly three years as Digital Marketing Manager at Hexadesigns in Kolkata, leading the team and running client campaigns across sectors.',
  ],
  facts: [
    { label: 'Based in', value: 'Dubai, UAE' },
    { label: 'Currently', value: 'Falcon Group UAE' },
    { label: 'Focus', value: 'SEO · SEM · Content' },
  ],
}

export const EXPERTISE = {
  eyebrow: 'My Expertise',
  title: 'Growing brands through search, content & data',
  intro:
    'Combining search, paid media, content and analytics into one strategy — so every channel feeds the next and growth compounds.',
  note: 'Turning searches into growth…',
  items: [
    {
      title: 'Search Engine Optimisation',
      body: 'Keyword and intent research, on-page optimisation and content that earns sustainable organic visibility.',
      tags: ['SEO', 'Content', 'Copywriting'],
    },
    {
      title: 'Search & Paid Media',
      body: 'Search engine marketing and PPC campaigns planned around intent, budget and measurable performance.',
      tags: ['SEM', 'PPC', 'Google Ads'],
    },
    {
      title: 'Social & Content',
      body: 'Social media marketing and content creation that keeps brands visible, consistent and worth following.',
      tags: ['Social media', 'Content creation'],
    },
    {
      title: 'Analytics & Optimisation',
      body: 'Google Analytics, A/B testing and conversion rate optimisation — plus email and automation to nurture leads.',
      tags: ['GA', 'A/B testing', 'CRO'],
    },
  ],
}

export const SKILLS = {
  eyebrow: 'Marketing Stack',
  title: 'Skills I work with',
  intro: 'Full-funnel digital marketing — from the first search to the final conversion.',
  groups: [
    { title: 'Search', items: ['Search engine optimisation (SEO)', 'Search engine marketing (SEM)', 'PPC'] },
    { title: 'Content & Social', items: ['Social media marketing', 'Content creation', 'Copywriting'] },
    { title: 'Lifecycle', items: ['Email marketing', 'Marketing automation'] },
    { title: 'Analytics & Optimisation', items: ['Google Analytics', 'A/B testing', 'Conversion rate optimisation'] },
  ],
}

// Chronological, oldest first — the journey scrolls left → right towards "now".
export const JOURNEY = [
  {
    kind: 'education',
    period: '2010 – 2015',
    title: 'Secondary School Certificate',
    org: 'Jodhpur Park Girls’ High School',
    place: 'Kolkata, India',
  },
  {
    kind: 'education',
    period: '2016 – 2017',
    title: 'Intermediate, Arts',
    org: 'Jadavpur Vidyapith',
    place: 'Kolkata, India',
  },
  {
    kind: 'education',
    period: '2017 – 2020',
    title: 'BSc Geography',
    org: 'Calcutta University',
    place: 'Kolkata, India',
  },
  {
    kind: 'education',
    period: '2021 – 2022',
    title: 'APDM in Digital Marketing',
    org: 'AIDM',
    place: 'India',
  },
  {
    kind: 'work',
    period: 'Oct 2022 – Jul 2025',
    title: 'Digital Marketing Manager',
    org: 'Hexadesigns',
    place: 'Kolkata, India',
    body: 'Team leadership and client campaigns across sectors.',
  },
  {
    kind: 'work',
    current: true,
    period: 'Aug 2025 – Present',
    title: 'Digital Marketing Executive',
    org: 'Falcon Group UAE',
    place: 'Dubai, UAE',
    body: 'Marketing across brands through content, advertising and performance strategy.',
  },
]

/*
 * Selected work, written only from what the CV states.
 * ⚠ Add documented campaign results (`results`) and links (`href`) when available.
 */
export const PROJECTS = {
  eyebrow: 'Selected Work',
  title: 'Work that defines my journey',
  intro: 'Multi-brand marketing in Dubai and client campaigns across sectors in Kolkata.',
  note: 'Detailed case studies with results are on the way…',
  items: [
    {
      tags: ['SEO', 'SEM', 'Content'],
      title: 'Multi-brand growth marketing',
      org: 'Falcon Group UAE',
      period: '2025 – Present',
      body: 'Marketing across the group’s brands through content, advertising and performance strategy.',
      skills: ['SEO', 'Paid search', 'Content', 'Analytics'],
      results: [],
      href: '',
    },
    {
      tags: ['Leadership', 'PPC', 'Social'],
      title: 'Client campaigns across sectors',
      org: 'Hexadesigns',
      period: '2022 – 2025',
      body: 'Led the digital marketing team and delivered client campaigns across a range of sectors.',
      skills: ['Team leadership', 'PPC', 'Social media', 'Email'],
      results: [],
      href: '',
    },
  ],
}

/*
 * Certificates are listed by issue date only — the CV notes these older certificates
 * have since expired, so nothing here claims they are current.
 */
export const CREDENTIALS = {
  eyebrow: 'Certifications',
  title: 'Professional credentials',
  note: { hover: 'Hover the track to pause · Google Skillshop certifications', touch: 'Swipe to browse · Google Skillshop certifications' },
  items: [
    { tag: 'Display Ads', title: 'Google Ads Display', issuer: 'Google', issued: 'Jul 2022', id: '119986938' },
    { tag: 'Analytics', title: 'Google Analytics Individual Qualification', issuer: 'Google', issued: 'Jul 2022', id: '89326192' },
    { tag: 'Shopping Ads', title: 'Shopping Ads', issuer: 'Google Digital Academy (Skillshop)', issued: 'Jul 2022', id: '121016558' },
    { tag: 'Search Ads', title: 'Google Ads Search', issuer: 'Google Digital Academy (Skillshop)', issued: 'Sep 2021', id: '' },
  ],
  coursesTitle: 'Additional courses',
  courses: [
    { title: 'Introduction to Digital Marketing', issuer: 'Great Learning', tag: 'Marketing' },
    { title: 'Introduction to Influencer Marketing', issuer: 'Great Learning', tag: 'Influencer' },
    { title: 'The Fundamentals of Digital Marketing', issuer: '', tag: 'Foundations' }, // ⚠ confirm issuer
  ],
  coursesNote: 'Always learning, always testing…',
}

export const CONTACT = {
  word: 'CONTACT',
  eyebrow: 'Reach out',
  title: 'Let’s grow something together',
  consent: 'I give permission to be contacted at this email address.',
}

export const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'contact', label: 'Contact' },
]
