# Universe Color System — CMS POC

A proof of concept for Fandom's CMS: pick one canonical "Universe" color and
automatically derive accessible, role-specific light/dark theme tokens from
it — plus a second, independent pipeline that derives an accessible card
gradient straight from a piece of key art. Both live-preview in the app.

## Universe accent color

1. **Pick a source color** — a hex value representing a Universe (e.g. a
   franchise's brand color). The picker stays pinned to the top of the
   viewport while you scroll (with a stronger shadow once it's actually
   stuck), so it's always at hand.
2. **Generate tokens** — the source color is converted to
   [OKLCH](https://bottosson.github.io/posts/oklab/) and adjusted to produce
   tokens for both light and dark mode, each meeting WCAG contrast targets:
   - **accent** — interactive controls, non-text UI (≥3:1 at AA)
   - **accent-content** — colored text, links, icons (≥4.5:1 at AA)
   - **accent-soft** — contextual background tint (no contrast requirement)
   - **filled** — shared filled/primary button background, guaranteed to
     pair with accessible black or white text. It also carries a
     visibility floor against a dark page surface, so a button dark enough
     to pair with white text is nudged lighter just enough to stay visible
     against `DARK_SURFACE` rather than blending into it.
3. **Choose a standard** — WCAG AA, AAA, or an above-spec "AAA+" that pushes
   the non-text contrast floor further for buttons/controls.
4. **Choose a style** — solid tokens, or a subtle gradient variant built
   around each token's own (already accessibility-adjusted) color.
5. **Inspect and preview** — see the generated tokens, the transformations
   applied to reach them, exportable CSS custom properties, and a live phone
   mockup in both light and dark mode.

## Card colors

Cards (key art + metadata + a CTA) need a different treatment: the CTA
button comes from the Universe's `filled` token above, but the card's own
faded gradient is derived from the **dominant hue in its key art**, not the
Universe color.

1. **Extract a dominant hue** — client-side, via canvas pixel sampling
   (a downscaled image is bucketed by OKLCH hue, weighted by chroma, so
   saturated pixels outweigh washed-out ones). Pick from a handful of
   real example images (sourced from fandom.com/utilities) or upload your
   own.
2. **Make it an accessible surface** — the extracted hue is treated as a
   background with fixed light (white) text/metadata on top and darkened,
   using the same OKLCH contrast engine as the Universe tokens, until it
   passes the active WCAG standard.
3. **Keep the CTA legible against its own card** — if the resulting card
   background lands too close (in WCAG contrast terms — luminance, not
   hue) to the Universe's CTA button color, the card background is
   darkened and mildly desaturated further, just enough that the button
   still reads as a distinct shape. The button itself is never adjusted.
4. **Inspect the result** — original vs. adjusted hex, contrast ratio, and
   pass/fail, using the same token-row UI as the Universe token inspector.

All color math (hex ↔ OKLCH conversion, gamut mapping, contrast
adjustment) lives in [`src/color/utils.ts`](src/color/utils.ts). Dominant-hue
extraction and the card key-art presets live in
[`src/color/cardImages.ts`](src/color/cardImages.ts).

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build     # type-check and build for production
npm run lint       # run eslint
npm run preview   # preview the production build
```

## Stack

React + TypeScript + Vite. UI font is Rubik; monospace tokens/code use the
system mono stack.
