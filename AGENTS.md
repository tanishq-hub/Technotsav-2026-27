# Planet Jumping Project Guide


## Project scope

- This application is a single-page immersive space portal experience.
- The route is implemented in the Next.js App Router and is the single source of truth for the website.
- The experience begins at the Sun and follows the Solar System order through Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.
- The left-side destination list supports direct selection; the portal advances to the next body in that order.
- Current planet facts are provisional, concise science summaries and may be replaced by user-supplied copy. Keep facts accurate and do not add unsupported festival information.

## Architecture

- Use the existing Next.js App Router, React, TypeScript, and Tailwind CSS 4 setup.
- Keep route entry points in src/app; reusable experience UI belongs in src/components.
- Shared media URLs and planet data live in src/lib/planets.ts.
- Keep browser interaction in the focused client component src/components/planet-portal/PlanetPortal.tsx.
- Keep the canvas portal renderer lightweight and do not add a 3D engine or external JavaScript/CSS libraries.
- Keep the project app as the only maintained website implementation; do not add a parallel standalone HTML site.

## Experience design

- Follow the supplied Planet Jumping brief for the full-screen portal, typography, exact media URLs, planet transitions, and responsive layout.
- Keep content readable against the media and preserve accessible names and focus visibility.
- Keep supplied content separate from implementation and do not add unsupported destinations or navigation claims.

## Animation and interaction

- The portal canvas provides the masked, screen-locked media window and subtle pointer tilt.
- Respect prefers-reduced-motion; retain a useful static presentation and working travel controls.
- Pause the canvas loop while the page is hidden.
- Support click and touch activation and visible keyboard focus.

## Accessibility and performance

- Use semantic landmarks, real buttons and links, and meaningful accessible labels.
- Keep all videos muted, inline, preloaded, and controlled by JavaScript.
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
