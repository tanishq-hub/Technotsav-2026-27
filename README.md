# Technotsav 2026–27 — Space × AI

A single-page cinematic space experience built with Next.js, React, TypeScript, and Tailwind CSS 4. Visitors begin at the Sun and can select destinations across the Solar System. The Next.js application is the single maintained website implementation.

## Run locally

Install dependencies with npm, then start the development server:

    npm install
    npm run dev

Open http://localhost:3000.

## Build

    npm run lint
    npx tsc --noEmit
    npx next build --webpack

The webpack build command is used because the default Turbopack build can encounter an environment-specific process error.

## Vercel monitoring

The root layout includes Vercel Web Analytics and Speed Insights. Enable both in the Vercel project dashboard after linking the project to collect visit and Core Web Vitals data.

## Source layout

- src/app contains the app route, metadata, and global styles.
- src/components/planet-portal contains the immersive portal UI and canvas motion.
- src/lib/planets.ts contains the supplied remote asset URLs and planet facts.
- docs/DESIGN_SYSTEM.md documents the current visual implementation.
