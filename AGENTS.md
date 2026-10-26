# Technotsav Website Project Guide


## Project scope

- This application is the Technotsav 2026–27 festival website.
- `/` is the Home experience, `/events` is the immersive planet portal, and `/registration` is the registration information route.
- Registration details, participant/winner information, and other festival facts must come from the user; do not invent them.
- The experience begins at the Sun and follows the Solar System order through Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.
- The left-side destination list supports direct selection; the portal advances to the next body in that order.
- Current planet facts are provisional, concise science summaries and may be replaced by user-supplied copy. Keep facts accurate and do not add unsupported festival information.

## Architecture

- Use the existing Next.js App Router, React, TypeScript, and Tailwind CSS 4 setup.
- Keep route entry points in src/app; reusable experience UI belongs in src/components.
- Keep the Home and Registration solar-system artwork decorative and CSS-based in src/components/home; it must not add a canvas/3D dependency or intercept input.
- Use the Space video only as the loading-screen background. After the loading screen exits and Home is visible, preload the Sun video in the background. The Events route starts directly on the Sun video and does not play the Home intro.
- Keep confirmed college and Technotsav copy in src/lib/planets.ts until it is intentionally moved into a shared content module.
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
