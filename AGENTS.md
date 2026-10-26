# Technotsav Website Project Guide


## Project scope

- This application is the Technotsav 2026–27 festival website.
- `/` is the Home experience, `/events` is the immersive planet portal, and `/registration` is the registration information route.
- Registration details, participant/winner information, and other festival facts must come from the user; do not invent them.
- The Events experience begins at Mercury and follows the planets through Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. The Sun video belongs to Registration.
- The left-side destination list supports direct selection; the portal advances to the next body in that order.
- Current planet facts are provisional, concise science summaries and may be replaced by user-supplied copy. Keep facts accurate and do not add unsupported festival information.

## Architecture

- Use the existing Next.js App Router, React, TypeScript, and Tailwind CSS 4 setup.
- Keep route entry points in src/app; reusable experience UI belongs in src/components.
- Use src/components/shared/SiteHeader.tsx and CustomCursor.tsx for the common fixed brand lockup, IST countdown, route navigation, and pointer treatment across Home, Events, and Registration. Route-specific controls may be supplied to the shared header without replacing its common structure.
- On Home, keep the logo assets visually centered through the loading screen, then dock the same lockup into the shared header after loading; honor reduced-motion preferences.
- Use the local `public/solar_system_v2.mp4` video as the muted, looping Home hero background; use the Sun R2 video as the Registration background. Keep decorative CSS artwork where applicable; do not add a canvas/3D dependency for Home or Registration.
- Use the Space video as the loading-screen background while preloading the local Home solar-system video. Once Home is active, preload the Sun and Mercury videos in parallel for Registration and Events. Events starts directly on Mercury and does not play the Home intro.
- Keep confirmed planet facts and About copy in src/lib/planets.ts; keep the confirmed event lineup and contact details in src/lib/festival.ts; keep detailed inter-collegiate event-panel copy in src/lib/events.ts.
- The Home-only Technotsav Guide is a lazy-loaded, local preset-answer interface, not live AI. Use only confirmed copy from `src/data/guide-responses.ts`; keep conversation state in component memory and do not add network calls or persistent chat storage.
- Shared media URLs and planet data live in src/lib/planets.ts.
- Keep browser interaction in the focused client component src/components/planet-portal/PlanetPortal.tsx.
- Keep the canvas portal renderer lightweight and do not add a 3D engine or external JavaScript/CSS libraries.
- Keep the project app as the only maintained website implementation; do not add a parallel standalone HTML site.

## Experience design

- Follow the supplied Planet Jumping brief for the full-screen portal, typography, exact media URLs, planet transitions, and responsive layout.
- Keep content readable against the media and preserve accessible names and focus visibility.
- Keep supplied content separate from implementation and do not add unsupported destinations or navigation claims.

## Animation and interaction

- The portal canvas provides the masked, screen-locked media window and subtle pointer tilt. Reveal the selected planet's first frame before starting playback; playback should begin near 80% reveal.
- Planet media may idle-preload only one next destination in solar order. Explicit selection aborts that work and takes priority; skip background preloading on Save-Data and slow 2G connections.
- Respect prefers-reduced-motion; retain a useful static presentation and working travel controls.
- Pause the canvas loop while the page is hidden.
- Support click and touch activation and visible keyboard focus.

## Accessibility and performance

- Use semantic landmarks, real buttons and links, and meaningful accessible labels.
- Keep all videos muted, inline, and controlled by JavaScript. Preload only what the current route needs, plus at most one next planet while idle.
- Show the shared college/contact footer on Home and Registration; in Events, show it as the final scroll panel over Neptune's video.
- Cap canvas pixel ratio at 2 and redraw only while the page is visible.
- Handle media load/play failures without trapping the page behind the preloader.
- Avoid unrelated dependencies and backend functionality.

## Verification

- Run the available lint, TypeScript validation, and production build commands when requested.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
