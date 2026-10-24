# Planet Jumping Design System


## Direction

A full-screen cinematic solar-system portal. The experience starts at the Sun and follows the planets outward through a rounded canvas window. Visitors can advance in sequence or select a destination directly. It uses supplied video assets and a simulated perspective effect instead of a 3D renderer.

## Tokens

Defined in src/app/globals.css:

| Token | Value | Use |
| --- | --- | --- |
| --portal-black | #090807 | Main background and fallback |
| --portal-white | #FFFFFF | Primary text and focus outline |
| --portal-muted | rgba(255, 255, 255, .78) | Secondary copy |
| --portal-line | rgba(255, 255, 255, .48) | Dividers |

## Typography

- Interface and body: SF Pro when locally available, with Arial and sans-serif fallbacks.
- Planet display titles: Aalto when locally available, with Arial Narrow and sans-serif fallbacks.
- Preloader numerals use SF Pro Thin where available.

## Media and composition

- Video backgrounds fill the viewport with object-fit: cover.
- Portal media is sampled onto a fixed, full-screen canvas and clipped to the live portal button bounds.
- The media remains screen-locked while the rounded window tilts.
- Planet media paths and facts are centralized in src/lib/planets.ts. Local supplied clips are loaded for the active planet and the next destination.

## Motion and accessibility

- Entrance, portal reveal, planet switch, and cursor motion follow the supplied timing and easing direction.
- Reduced-motion mode bypasses the video intro and tilt and shortens transitions.
- Touch screens retain destination selection and the travel button without pointer tilt or custom cursor.
- The portal canvas is decorative; the travel button exposes its destination through an accessible name.
