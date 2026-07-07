# Universe Color System — CMS POC

A proof of concept for Fandom's CMS: pick one canonical "Universe" color and
automatically derive accessible, role-specific light/dark theme tokens from
it, with a live preview of how those tokens look in the app.

## How it works

1. **Pick a source color** — a hex value representing a Universe (e.g. a
   franchise's brand color).
2. **Generate tokens** — the source color is converted to
   [OKLCH](https://bottosson.github.io/posts/oklab/) and adjusted to produce
   six tokens (light/dark × accent/accent-content/accent-soft), each meeting
   WCAG 2.1 contrast targets:
   - **accent** — interactive controls, non-text UI (≥3:1)
   - **accent-content** — colored text, links, icons (≥4.5:1)
   - **accent-soft** — contextual background tint (no contrast requirement)
3. **Inspect and preview** — see the generated tokens, the transformations
   applied to reach them, exportable CSS custom properties, and a live phone
   mockup in both light and dark mode.

All color math (hex ↔ OKLCH conversion, gamut mapping, contrast
adjustment) lives in [`src/color/utils.ts`](src/color/utils.ts).

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build     # type-check and build for production
npm run lint       # run eslint
npm run preview   # preview the production build
```

## Stack

React + TypeScript + Vite.
