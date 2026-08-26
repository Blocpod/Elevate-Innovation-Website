# Elevate Innovation — website redesign

A ground-up rebuild of elevateinnovation.com, benchmarked against runrobrun.com's design and motion caliber, built entirely from Elevate's own brand assets, capabilities-deck content, and client work.

## Stack

- Vite + TypeScript (static, no framework runtime)
- GSAP + ScrollTrigger (scroll choreography, pinned process sequence)
- Lenis (smooth scrolling)
- Canvas 2D (hero particle mark)
- Google Fonts: Archivo (variable width/weight) + IBM Plex Mono

## Run

```bash
npm install
npm run dev      # http://localhost:5199 (port set in .claude/launch.json)
npm run build    # production build in dist/
```

## Design system

- Paper `#e6e4df`, ink `#16181a`, brand navy `#094e79`, brand orange `#f16725` (sampled from the Elevate logo)
- Display: Archivo wdth 125 / wght 900, all caps
- Labels/body: IBM Plex Mono, uppercase, justified
- 1440px container, hairline rules, corner registration crosses, film-grain overlay

## Signature moments

1. Pixel-grid dissolve intro (CNC raster motif, ink + orange cells)
2. Hero "Λ" mark assembled from hundreds of pointer-reactive fabrication units (canvas)
3. Pinned, scroll-scrubbed Design → Develop → Deliver process sequence on brand navy
4. Full-orange footer framed with design-tool selection handles + pixel Λ wordmark

## Content sources

All copy, statistics, client names, and imagery derive from the 2025 Product Guide and 2024 Capabilities deck published on the original Squarespace site (archived in `~/elevate-site-audit/`). Web image crops live in `public/media/` (baked slide text removed via cropping/compositing).

## QA

`qa/shoot.mjs [desktop|laptop|tablet|mobile]` captures full-page scroll sweeps via Playwright; `qa/interact.mjs` exercises hovers, nav anchors, and collects console errors. Contact sheets are written to `qa/`.
