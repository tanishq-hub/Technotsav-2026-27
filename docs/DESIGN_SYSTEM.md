# Technotsav Website Design System


## Direction

The website has three routes: a cinematic Home page, a full-screen planet portal at `/events`, and a Registration information page. Home uses the looping local `public/solar_system_v2.mp4` video as its hero background. Events starts at Mercury and follows the planets outward through a rounded canvas window. Registration uses the Sun video. Visitors can advance in sequence or select a planet directly. The portal uses supplied video assets and a simulated perspective effect instead of a 3D renderer.

## Tokens

Defined in src/app/globals.css:

| Token | Value | Use |
| --- | --- | --- |
| --portal-black | #090807 | Main background and fallback |
| --portal-white | #FFFFFF | Primary text and focus outline |
| --portal-muted | rgba(255, 255, 255, .78) | Secondary copy |
| --portal-line | rgba(255, 255, 255, .48) | Dividers |

The Home experience uses scoped color tokens in `src/components/home/home-experience.css`:

| Token | Value | Use |
| --- | --- | --- |
| --space-black | #060810 | Home background |
| --blue | #71bcff | Electric-blue atmosphere |
| --orange | #ff7c3b | Solar energy |
| --gold | #f2c86f | Countdown and restrained highlights |

## Typography

- Interface and body: SF Pro when locally available, with Arial and sans-serif fallbacks.
- Planet display titles: Aalto when locally available, with Arial Narrow and sans-serif fallbacks.
- Preloader numerals use SF Pro Thin where available.

## Media and composition

- Intro and portal video backgrounds fill their viewport with object-fit: cover.
- Portal media is sampled onto a fixed, full-screen canvas and clipped to the live portal button bounds.
- The media remains screen-locked while the rounded window tilts.
- Planet media paths and facts are centralized in src/lib/planets.ts. Active media is loaded on selection; while idle, at most one next planet is prefetched in solar order. Explicit planet selection cancels that work and takes priority.
- During the Space loading screen, preload the local Home solar-system video. Once Home is active, preload the Sun and Mercury entry videos in parallel for Registration and Events. Events has no Space intro and starts directly at Mercury.
- Home starts the looping local `solar_system_v2.mp4` background after the Space intro; hero content appears two seconds after playback starts. Registration uses the looping Sun R2 video.
- The shared footer shows the college, venue, email, Instagram handle, and website on all routes. Events reveals it as a final panel over Neptune's video.
- Confirmed 2026–27 event names and contact details live in src/lib/festival.ts and are shown on Home. Detailed inter-collegiate rules and event-panel copy live in src/lib/events.ts.
- Home includes an on-demand Technotsav Guide panel. It is labeled as preset answers rather than live AI, uses confirmed content only, and keeps messages in memory until the panel closes or Home unmounts. Its chunk is loaded only when opened.

## Motion and accessibility

- Entrance, portal reveal, planet switch, and cursor motion follow the supplied timing and easing direction.
- Reduced-motion mode pauses intro video playback, simplifies ambient motion, disables pointer tilt, and shortens transitions while keeping content and controls usable.
- Touch screens retain destination selection and the travel button without pointer tilt or custom cursor.
- The portal canvas is decorative; the travel button exposes its destination through an accessible name.
