# Adrita Sarkar — Portfolio

Next.js (App Router) · JavaScript/JSX · Tailwind CSS v4 · Framer Motion

## Setup

1. Place the hero clips in `public/hero/`:
   `center-look.mp4`, `working.mp4`, `look-left.mp4`, `look-right.mp4`, `center-point.mp4`
2. `npm install`
3. `npm run dev`

Set `NEXT_PUBLIC_SITE_URL` for canonical/OG URLs.

## Before publishing — `content/profile.js`

All copy lives in this one file, written from the CV. Fields marked ⚠ are blank because
the CV leaves them blank (nothing is invented):

- `PROFILE.email` — the contact form and footer email appear once set
- `PROFILE.linkedin` — footer link appears once set
- `PROJECTS.items[].results` / `href` — add documented campaign results and case-study links
- `CREDENTIALS.courses` — confirm the issuer of *The Fundamentals of Digital Marketing*
- `ABOUT.badgePhoto` — optional photo for the ID badge (defaults to a still from `center-look.mp4`)

## Sections and motion

| Section | Motion (from the reference video) |
| --- | --- |
| Hero | Video-driven character (see below) |
| About | Lanyard ID badge swings in and sways; name highlight sweep; wave into the light sections |
| Expertise | Pinned tag cards tilt in ghosted, fill crimson as they reach view; dashed path draws itself with scroll |
| Skills | Grouped chips blur-stagger in |
| Experience | **Pinned horizontal scroll** (md+) through education → Hexadesigns → Falcon Group; vertical timeline on phones |
| Projects | Cards blur-rise in, lift on hover |
| Credentials | Cards hanging from a rail glide sideways, pause on hover; swipeable on touch |
| Contact | Giant letters expand from thin bars, pin, and the red form slides over them (opens the visitor's email app) |
| Footer | Giant wordmark trails echoes while scrolling fast |
| Nav | Fixed; colours follow the section beneath; red pill slides to the active section |

Everything respects `prefers-reduced-motion`.

## Hero interaction

| Trigger | Clip |
| --- | --- |
| Page load | `center-look`, always played to the end (cursor ignored) → `working` |
| Cursor left 30% | `look-left` → `working` |
| Cursor right 30% | `look-right` → `working` |
| Cursor center | `working` (immediately) |
| 30 s after the intro | `center-point`, played to the end (cursor ignored) → `working` |
| Tap (touch) / keyboard | replays `center-look` |
| **Mute / Sound on** button | sound is on by default; the button mutes or unmutes |

**Sound (on by default).** The hero always tries to play with sound. Browsers only allow
that once the visitor has interacted with the site, so on most first visits the video plays
silently, the button pulses **Sound on**, and the visitor's first click, tap or key press
anywhere turns sound on (moving the mouse or scrolling doesn't count — browser rule). The
**Mute** button is always there. Only the clip on screen is audible, its audio crossfades
with each switch, and it stops whenever the hero is scrolled away or the tab is hidden.

**Cursor.** On mouse/trackpad devices the whole site uses a custom cursor
(`components/site/SiteCursor.jsx`, styles under "Custom cursor" in `globals.css`): a dot
plus an easing ring that turns white on dark sections and ink/crimson on light ones, grows
over links and buttons, and steps aside for the system I-beam in text fields. In the hero
it also shows which way Adrita will look (left/right arrows) and turns dashed while the
intro or point-down plays. Touch devices keep their normal behaviour.

Hero settings — `components/hero/constants.js`:

- **Intro length** — nothing to change; it always plays to the video's real end.
- **Replaced a video file** — bump `CLIP_VERSION` (clips are cached for 7 days).
- **More intro clips** — add to `INTRO_SEQUENCE`.
- **Point-down timing** — `POINT_DELAY_MS`, `POINT_REPEAT`.

Crop tuning in `app/globals.css`: `--hero-focus-x` (hero), `--badge-focus` (badge still).

## Encoding for seamless switching

All clips: identical resolution, frame rate and framing; H.264 `yuv420p`;
`-movflags +faststart`; no audio. Every clip should start (and ideally end) on the
exact first frame of `working.mp4`.
