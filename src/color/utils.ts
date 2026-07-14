/**
 * Universe Color System — Color Transformation Engine
 *
 * All color-logic is isolated here. UI components import from this module only.
 *
 * Pipeline:
 *   hex → linear sRGB → OKLab → OKLCH (for manipulation)
 *   OKLCH → OKLab → linear sRGB → sRGB → hex (for output, with gamut mapping)
 *
 * WCAG 2.1 contrast math is used for all accessibility checks.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OklchColor {
  l: number
  c: number
  h: number
}

export interface GradientStops {
  from: string
  to: string
  /** Ready-to-use CSS value, e.g. `linear-gradient(45deg, #fff, #000)`. */
  css: string
}

export interface TokenResult {
  tokenName: string
  hex: string
  oklch: OklchColor
  contrastRatio: number
  contrastTarget: number | null
  passes: boolean | null
  role: string
  notes: string[]
  /** For tokens meant to sit under text/icons of a fixed color (e.g. a filled button), which color that is. */
  onColor?: string
  /** Present only in gradient mode, and only for tokens eligible for a gradient treatment. */
  gradient?: GradientStops
}

export type ColorStyle = 'solid' | 'gradient'

export interface ContrastStandard {
  id: string
  label: string
  description: string
  /** Minimum contrast for colored text/icons that carry meaning (WCAG "normal text"). */
  textTarget: number
  /** Minimum contrast for non-text UI (borders, controls, selected states). */
  interactiveTarget: number
}

export interface GeneratedTokens {
  sourceHex: string
  sourceOklch: OklchColor
  standard: ContrastStandard
  colorStyle: ColorStyle
  light: {
    accent: TokenResult
    accentContent: TokenResult
    accentSoft: TokenResult
  }
  dark: {
    accent: TokenResult
    accentContent: TokenResult
    accentSoft: TokenResult
  }
  /** Shared across themes — background for filled/primary buttons, guaranteed to pair with accessible black or white text. */
  filled: TokenResult
  cssVariables: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const LIGHT_SURFACE = '#ffffff'
export const DARK_SURFACE = '#121212'

// WCAG 2.1 only defines a non-text (1.4.11) target at the AA level — there's
// no official AAA equivalent for UI components. For the AAA profile here we
// bump the interactive target up to what AA requires of text (4.5:1), as a
// stricter proxy, while the text target follows the real AAA figure (7:1).
export const CONTRAST_STANDARDS: Record<string, ContrastStandard> = {
  AA: {
    id: 'AA',
    label: 'WCAG AA',
    description: 'Standard web accessibility baseline.',
    textTarget: 4.5,
    interactiveTarget: 3.0,
  },
  AAA: {
    id: 'AAA',
    label: 'WCAG AAA',
    description: 'Enhanced contrast for maximum legibility.',
    textTarget: 7.0,
    interactiveTarget: 4.5,
  },
  // Not a WCAG level — AAA's 4.5:1 non-text figure is only borrowed from AA's
  // text target and can still look thin on a filled button. This pushes past
  // any official spec to a firmer floor for interactive elements.
  AAA_PLUS: {
    id: 'AAA+',
    label: 'WCAG AAA+',
    description: 'Beyond AAA — a firmer contrast floor for buttons and controls.',
    textTarget: 7.0,
    interactiveTarget: 6.0,
  },
}

export const DEFAULT_CONTRAST_STANDARD = CONTRAST_STANDARDS.AA

// A source color this close to fully neutral (gray/white/black) has no
// usable hue. Snap it to the same kind of "slightly less intense" neutral
// already used for surfaces — DARK_SURFACE for near-black, and its mirror
// for near-white — rather than a literal #ffffff/#000000.
export const ACHROMATIC_CHROMA_EPSILON = 0.005
export const NEAR_WHITE_FALLBACK = '#ededed'

// Gradient stops are a lightness spread around a token's own (already
// accessibility-adjusted) color, expressed as a fraction of the 0–1 OKLCH
// lightness range. Kept subtle for surfaces, a bit bolder for buttons/
// outlines, and unused entirely for text (see generateTokens).
export const SURFACE_GRADIENT_SPREAD = 0.08
export const BUTTON_GRADIENT_SPREAD = 0.2
export const GRADIENT_ANGLE_DEG = 45

// ─── sRGB ↔ Linear ───────────────────────────────────────────────────────────

function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function delinearize(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

// ─── Hex ↔ sRGB ──────────────────────────────────────────────────────────────

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((x) => x + x).join('') : h
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  }
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.round(clamp01(v) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// ─── OKLCH ↔ linear sRGB ─────────────────────────────────────────────────────
// Reference: https://bottosson.github.io/posts/oklab/

function linearRgbToOklab(
  r: number,
  g: number,
  b: number,
): { L: number; a: number; b: number } {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  }
}

function oklabToLinearRgb(
  L: number,
  a: number,
  b: number,
): { r: number; g: number; b: number } {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  return {
    r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  }
}

export function hexToOklch(hex: string): OklchColor {
  const { r, g, b } = hexToRgb(hex)
  const { L, a, b: bk } = linearRgbToOklab(
    linearize(r),
    linearize(g),
    linearize(b),
  )
  const c = Math.sqrt(a * a + bk * bk)
  let h = Math.atan2(bk, a) * (180 / Math.PI)
  if (h < 0) h += 360
  return { l: L, c, h }
}

/**
 * Convert OKLCH to hex, applying gamut mapping by binary-searching chroma reduction.
 * Returns the hex string AND the final OKLCH (which may have reduced chroma).
 */
export function oklchToHex(
  l: number,
  c: number,
  h: number,
): { hex: string; finalC: number; chromaReduced: boolean } {
  const hRad = h * (Math.PI / 180)

  const tryConvert = (chroma: number): { r: number; g: number; b: number } => {
    const a = chroma * Math.cos(hRad)
    const b = chroma * Math.sin(hRad)
    const lin = oklabToLinearRgb(l, a, b)
    return {
      r: delinearize(lin.r),
      g: delinearize(lin.g),
      b: delinearize(lin.b),
    }
  }

  const isInGamut = (rgb: { r: number; g: number; b: number }) =>
    rgb.r >= -0.0001 &&
    rgb.r <= 1.0001 &&
    rgb.g >= -0.0001 &&
    rgb.g <= 1.0001 &&
    rgb.b >= -0.0001 &&
    rgb.b <= 1.0001

  let rgb = tryConvert(c)

  if (isInGamut(rgb)) {
    return { hex: rgbToHex(rgb.r, rgb.g, rgb.b), finalC: c, chromaReduced: false }
  }

  let lo = 0
  let hi = c
  let bestC = 0
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    const testRgb = tryConvert(mid)
    if (isInGamut(testRgb)) {
      bestC = mid
      lo = mid
    } else {
      hi = mid
    }
  }

  rgb = tryConvert(bestC)
  return {
    hex: rgbToHex(rgb.r, rgb.g, rgb.b),
    finalC: bestC,
    chromaReduced: true,
  }
}

/**
 * Build a 45deg gradient centered on `oklch`, spreading lightness by
 * `spread` (a fraction of the 0–1 range) split evenly lighter/darker.
 * Hue and chroma are held constant; each stop is gamut-mapped independently.
 */
function buildGradient(oklch: OklchColor, spread: number): GradientStops {
  const half = spread / 2
  const { hex: from } = oklchToHex(clamp01(oklch.l + half), oklch.c, oklch.h)
  const { hex: to } = oklchToHex(clamp01(oklch.l - half), oklch.c, oklch.h)
  return { from, to, css: `linear-gradient(${GRADIENT_ANGLE_DEG}deg, ${from}, ${to})` }
}

/**
 * Guard against a source color with no usable hue (pure white, pure black,
 * or any near-neutral gray). Snaps it to the near-black or near-white
 * neutral fallback — it stays achromatic, just slightly darker or lighter
 * than the input.
 */
function sanitizeSourceOklch(oklch: OklchColor): OklchColor {
  if (oklch.c >= ACHROMATIC_CHROMA_EPSILON) return oklch
  return hexToOklch(oklch.l >= 0.5 ? NEAR_WHITE_FALLBACK : DARK_SURFACE)
}

/**
 * Validate + sanitize a hex color for use as the canonical source color.
 * Returns null if invalid, otherwise a hex guaranteed to be off pure white/black.
 */
export function sanitizeSourceHex(hex: string): string | null {
  const normalized = validateHex(hex)
  if (!normalized) return null
  const oklch = sanitizeSourceOklch(hexToOklch(normalized))
  return oklchToHex(oklch.l, oklch.c, oklch.h).hex
}

// ─── WCAG Contrast ───────────────────────────────────────────────────────────

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

export function wcagContrast(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1)
  const l2 = relativeLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// ─── Adjustment Engine ───────────────────────────────────────────────────────

interface AdjustResult {
  hex: string
  oklch: OklchColor
  notes: string[]
  sourceContrast: number
  finalContrast: number
}

/**
 * Adjust a source OKLCH color's lightness (and chroma if needed) until
 * it meets `targetContrast` against `surfaceHex`.
 *
 * mode='light' → darken (decrease L) to meet contrast against white
 * mode='dark'  → lighten (increase L) to meet contrast against dark surface
 */
function adjustForContrast(
  source: OklchColor,
  surfaceHex: string,
  targetContrast: number,
  mode: 'light' | 'dark',
): AdjustResult {
  const notes: string[] = []
  const { hex: sourceHex } = oklchToHex(source.l, source.c, source.h)
  const sourceContrast = wcagContrast(sourceHex, surfaceHex)

  if (sourceContrast >= targetContrast) {
    notes.push(
      `Source already passes ${targetContrast}:1 (${sourceContrast.toFixed(2)}:1). No adjustment required.`,
    )
    return {
      hex: sourceHex,
      oklch: source,
      notes,
      sourceContrast,
      finalContrast: sourceContrast,
    }
  }

  const sourceLPct = Math.round(source.l * 100)

  let lo = mode === 'light' ? 0 : source.l
  let hi = mode === 'light' ? source.l : 1
  let bestL = mode === 'light' ? 0 : 1

  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    const { hex } = oklchToHex(mid, source.c, source.h)
    const cr = wcagContrast(hex, surfaceHex)
    if (cr >= targetContrast) {
      bestL = mid
      if (mode === 'light') lo = mid
      else hi = mid
    } else if (mode === 'light') {
      hi = mid
    } else {
      lo = mid
    }
  }

  const { hex: finalHex, chromaReduced, finalC } = oklchToHex(
    bestL,
    source.c,
    source.h,
  )
  const finalContrast = wcagContrast(finalHex, surfaceHex)
  const finalLPct = Math.round(bestL * 100)

  if (mode === 'light') {
    notes.push(
      `Lightness reduced from ${sourceLPct}% to ${finalLPct}% to reach ${targetContrast}:1.`,
    )
  } else {
    notes.push(
      `Lightness increased from ${sourceLPct}% to ${finalLPct}% for dark-mode contrast.`,
    )
  }

  if (chromaReduced) {
    notes.push(
      `Chroma reduced from ${(source.c * 100).toFixed(1)} to ${(finalC * 100).toFixed(1)} after lightness adjustment to remain in sRGB gamut.`,
    )
  }

  return {
    hex: finalHex,
    oklch: { l: bestL, c: finalC, h: source.h },
    notes,
    sourceContrast,
    finalContrast,
  }
}

// ─── Soft Tint ───────────────────────────────────────────────────────────────

/**
 * Generate a soft contextual background tint from the source hue.
 * Light: very high L, low C (subtle against white)
 * Dark:  low L, low-medium C (subtle against #121212)
 */
function generateSoftTint(
  source: OklchColor,
  mode: 'light' | 'dark',
): { hex: string; oklch: OklchColor; notes: string[] } {
  let targetL: number
  let targetC: number
  const notes: string[] = []

  if (mode === 'light') {
    targetL = 0.96
    targetC = Math.min(source.c * 0.25, 0.04)
    notes.push(
      `Light soft tint: L raised to ${Math.round(targetL * 100)}%, C reduced to ${(targetC * 100).toFixed(1)} for subtle surface tint.`,
    )
  } else {
    targetL = 0.18
    targetC = Math.min(source.c * 0.35, 0.06)
    notes.push(
      `Dark soft tint: L set to ${Math.round(targetL * 100)}%, C reduced to ${(targetC * 100).toFixed(1)} for subtle dark surface tint.`,
    )
  }

  const { hex, finalC } = oklchToHex(targetL, targetC, source.h)
  return {
    hex,
    oklch: { l: targetL, c: finalC, h: source.h },
    notes,
  }
}

// ─── Filled Button Token ─────────────────────────────────────────────────────

// Not a text-contrast figure — a visibility floor. A filled button dark
// enough to pair with white text can otherwise sit so close to DARK_SURFACE
// (#121212) that its pill shape all but disappears. Mirrors, for dark
// buttons, the same intent as the near-white/near-black source-color guard
// above (sanitizeSourceOklch/NEAR_WHITE_FALLBACK): never let the token fully
// blend into the surface it's meant to be seen on.
export const DARK_BUTTON_MIN_SURFACE_CONTRAST = 1.5

interface FilledCandidate {
  hex: string
  oklch: OklchColor
  onColor: string
  notes: string[]
}

/**
 * If a dark (white-text) filled button is too close in luminance to
 * DARK_SURFACE, lighten it just enough to clear a minimum visibility floor —
 * capped so it never lightens past the point where white text would drop
 * below its own contrast target. Light (black-text) buttons are untouched;
 * they're never dark enough to blend into a near-black surface.
 */
function ensureDarkSurfaceVisibility(
  candidate: FilledCandidate,
  textTarget: number,
): FilledCandidate {
  if (candidate.onColor !== '#ffffff') return candidate

  const contrastVsDark = wcagContrast(candidate.hex, DARK_SURFACE)
  if (contrastVsDark >= DARK_BUTTON_MIN_SURFACE_CONTRAST) return candidate

  const { l, c, h } = candidate.oklch

  // Smallest L (searching upward from the current lightness) that clears the
  // visibility floor against DARK_SURFACE — contrast vs. a fixed dark
  // surface rises monotonically as L increases.
  let lo = l
  let hi = 1
  let minLForVisibility = 1
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    const { hex } = oklchToHex(mid, c, h)
    if (wcagContrast(hex, DARK_SURFACE) >= DARK_BUTTON_MIN_SURFACE_CONTRAST) {
      minLForVisibility = mid
      hi = mid
    } else {
      lo = mid
    }
  }

  // Largest L (searching upward from the current lightness) that still
  // keeps white text at or above its target — contrast vs. white falls
  // monotonically as L increases.
  lo = l
  hi = 1
  let maxLForText = l
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    const { hex } = oklchToHex(mid, c, h)
    if (wcagContrast(hex, '#ffffff') >= textTarget) {
      maxLForText = mid
      lo = mid
    } else {
      hi = mid
    }
  }

  const targetL = Math.min(minLForVisibility, maxLForText)
  if (targetL <= l) return candidate

  const { hex: finalHex, finalC } = oklchToHex(targetL, c, h)
  const reachedFloor = minLForVisibility <= maxLForText
  const note = reachedFloor
    ? `Lightened from ${Math.round(l * 100)}% to ${Math.round(targetL * 100)}% so the button stays visible (≥${DARK_BUTTON_MIN_SURFACE_CONTRAST}:1) against the dark surface, not just legible to its own text.`
    : `Lightened from ${Math.round(l * 100)}% to ${Math.round(targetL * 100)}% (as far as possible without dropping white text below ${textTarget}:1) — still short of the ${DARK_BUTTON_MIN_SURFACE_CONTRAST}:1 dark-surface visibility floor.`

  return {
    hex: finalHex,
    oklch: { l: targetL, c: finalC, h },
    onColor: candidate.onColor,
    notes: [...candidate.notes, note],
  }
}

/**
 * Generate the background token for filled/primary buttons.
 *
 * Unlike the surface-relative accent tokens, this token must work with a
 * fixed on-color (black or white) text/icon layer. If the source color
 * already lets black or white text reach 4.5:1, it's used as-is. Otherwise
 * lightness is nudged toward whichever direction (lighter, for black text,
 * or darker, for white text) reaches 4.5:1 with the smallest change from
 * the source — so the token stays as close as possible to the input color.
 * A final pass (ensureDarkSurfaceVisibility) guards against a dark button
 * blending into a dark page background.
 */
function generateFilledToken(source: OklchColor, textTarget: number): TokenResult {
  const { hex: sourceHex } = oklchToHex(source.l, source.c, source.h)
  const contrastWithWhite = wcagContrast(sourceHex, '#ffffff')
  const contrastWithBlack = wcagContrast(sourceHex, '#000000')

  let candidate: FilledCandidate

  if (contrastWithWhite >= textTarget || contrastWithBlack >= textTarget) {
    const onColor = contrastWithBlack >= contrastWithWhite ? '#000000' : '#ffffff'
    const contrastRatio = Math.max(contrastWithWhite, contrastWithBlack)
    candidate = {
      hex: sourceHex,
      oklch: source,
      onColor,
      notes: [
        `Source already supports ${onColor === '#000000' ? 'black' : 'white'} text at ${contrastRatio.toFixed(2)}:1. No adjustment required.`,
      ],
    }
  } else {
    // Lighten toward black-text territory, and separately darken toward
    // white-text territory — then keep whichever needed the smaller nudge.
    const lightened = adjustForContrast(source, '#000000', textTarget, 'dark')
    const darkened = adjustForContrast(source, '#ffffff', textTarget, 'light')

    const lightenDelta = Math.abs(lightened.oklch.l - source.l)
    const darkenDelta = Math.abs(darkened.oklch.l - source.l)
    const useLightened = lightenDelta <= darkenDelta

    const chosen = useLightened ? lightened : darkened
    const onColor = useLightened ? '#000000' : '#ffffff'

    candidate = {
      hex: chosen.hex,
      oklch: chosen.oklch,
      onColor,
      notes: [
        ...chosen.notes,
        `Nudged ${useLightened ? 'lighter' : 'darker'} (closest viable direction) so ${onColor === '#000000' ? 'black' : 'white'} text/icons reach ${textTarget}:1.`,
      ],
    }
  }

  const final = ensureDarkSurfaceVisibility(candidate, textTarget)
  const contrastRatio = wcagContrast(final.hex, final.onColor)

  return {
    tokenName: '--universe-accent-filled',
    hex: final.hex,
    oklch: final.oklch,
    contrastRatio,
    contrastTarget: textTarget,
    passes: contrastRatio >= textTarget,
    role: `Filled/primary button background — pairs with ${final.onColor === '#000000' ? 'black' : 'white'} text/icons`,
    onColor: final.onColor,
    notes: final.notes,
  }
}

// ─── Token Generator ─────────────────────────────────────────────────────────

/**
 * Generate the full set of Universe color tokens from a single canonical source hex.
 * All transformations are deterministic and OKLCH-based.
 */
export function generateTokens(
  sourceHex: string,
  standard: ContrastStandard = DEFAULT_CONTRAST_STANDARD,
  colorStyle: ColorStyle = 'solid',
): GeneratedTokens {
  const { textTarget, interactiveTarget } = standard
  const rawHex = sourceHex.startsWith('#') ? sourceHex : `#${sourceHex}`
  const sourceOklch = sanitizeSourceOklch(hexToOklch(rawHex))
  const normalizedHex = oklchToHex(sourceOklch.l, sourceOklch.c, sourceOklch.h).hex

  const lightAccentResult = adjustForContrast(
    sourceOklch,
    LIGHT_SURFACE,
    interactiveTarget,
    'light',
  )
  const lightAccentContrast = wcagContrast(lightAccentResult.hex, LIGHT_SURFACE)

  const lightContentResult = adjustForContrast(
    sourceOklch,
    LIGHT_SURFACE,
    textTarget,
    'light',
  )
  const lightContentContrast = wcagContrast(lightContentResult.hex, LIGHT_SURFACE)

  const lightSoftResult = generateSoftTint(sourceOklch, 'light')
  const lightSoftContrast = wcagContrast(lightSoftResult.hex, LIGHT_SURFACE)

  const darkAccentResult = adjustForContrast(
    sourceOklch,
    DARK_SURFACE,
    interactiveTarget,
    'dark',
  )
  const darkAccentContrast = wcagContrast(darkAccentResult.hex, DARK_SURFACE)

  const darkContentResult = adjustForContrast(
    sourceOklch,
    DARK_SURFACE,
    textTarget,
    'dark',
  )
  const darkContentContrast = wcagContrast(darkContentResult.hex, DARK_SURFACE)

  const darkSoftResult = generateSoftTint(sourceOklch, 'dark')
  const darkSoftContrast = wcagContrast(darkSoftResult.hex, DARK_SURFACE)

  const light: GeneratedTokens['light'] = {
    accent: {
      tokenName: '--universe-accent-light',
      hex: lightAccentResult.hex,
      oklch: lightAccentResult.oklch,
      contrastRatio: lightAccentContrast,
      contrastTarget: interactiveTarget,
      passes: lightAccentContrast >= interactiveTarget,
      role: 'Interactive controls, selected states, non-text UI',
      notes: lightAccentResult.notes,
    },
    accentContent: {
      tokenName: '--universe-accent-content-light',
      hex: lightContentResult.hex,
      oklch: lightContentResult.oklch,
      contrastRatio: lightContentContrast,
      contrastTarget: textTarget,
      passes: lightContentContrast >= textTarget,
      role: 'Colored text, links, icons requiring contrast',
      notes: lightContentResult.notes,
    },
    accentSoft: {
      tokenName: '--universe-accent-soft-light',
      hex: lightSoftResult.hex,
      oklch: lightSoftResult.oklch,
      contrastRatio: lightSoftContrast,
      contrastTarget: null,
      passes: null,
      role: 'Contextual surface tint (background only)',
      notes: lightSoftResult.notes,
    },
  }

  const dark: GeneratedTokens['dark'] = {
    accent: {
      tokenName: '--universe-accent-dark',
      hex: darkAccentResult.hex,
      oklch: darkAccentResult.oklch,
      contrastRatio: darkAccentContrast,
      contrastTarget: interactiveTarget,
      passes: darkAccentContrast >= interactiveTarget,
      role: 'Interactive controls, selected states, non-text UI',
      notes: darkAccentResult.notes,
    },
    accentContent: {
      tokenName: '--universe-accent-content-dark',
      hex: darkContentResult.hex,
      oklch: darkContentResult.oklch,
      contrastRatio: darkContentContrast,
      contrastTarget: textTarget,
      passes: darkContentContrast >= textTarget,
      role: 'Colored text, links, icons requiring contrast',
      notes: darkContentResult.notes,
    },
    accentSoft: {
      tokenName: '--universe-accent-soft-dark',
      hex: darkSoftResult.hex,
      oklch: darkSoftResult.oklch,
      contrastRatio: darkSoftContrast,
      contrastTarget: null,
      passes: null,
      role: 'Contextual surface tint (background only)',
      notes: darkSoftResult.notes,
    },
  }

  const filled = generateFilledToken(sourceOklch, textTarget)

  if (colorStyle === 'gradient') {
    light.accent.gradient = buildGradient(light.accent.oklch, BUTTON_GRADIENT_SPREAD)
    light.accentSoft.gradient = buildGradient(light.accentSoft.oklch, SURFACE_GRADIENT_SPREAD)
    dark.accent.gradient = buildGradient(dark.accent.oklch, BUTTON_GRADIENT_SPREAD)
    dark.accentSoft.gradient = buildGradient(dark.accentSoft.oklch, SURFACE_GRADIENT_SPREAD)
    filled.gradient = buildGradient(filled.oklch, BUTTON_GRADIENT_SPREAD)
    // accentContent (text/links) intentionally never gets a gradient.
  }

  const fmt = (t: TokenResult) => {
    const lines = [`  ${t.tokenName}: ${t.hex}; /* ${t.role} */`]
    if (t.gradient) lines.push(`  ${t.tokenName}-gradient: ${t.gradient.css};`)
    return lines.join('\n')
  }

  const cssVariables = `:root {\n${[
    fmt(light.accent),
    fmt(light.accentContent),
    fmt(light.accentSoft),
    '',
    fmt(dark.accent),
    fmt(dark.accentContent),
    fmt(dark.accentSoft),
    '',
    fmt(filled),
  ].join('\n')}\n}`

  return {
    sourceHex: normalizedHex,
    sourceOklch,
    standard,
    colorStyle,
    light,
    dark,
    filled,
    cssVariables,
  }
}

/**
 * Validate and normalize a hex color string. Returns null if invalid.
 */
export function validateHex(value: string): string | null {
  const trimmed = value.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    const full = trimmed.split('').map((x) => x + x).join('')
    return `#${full.toLowerCase()}`
  }
  return null
}

/**
 * Format OKLCH values for display.
 */
export function formatOklch(oklch: OklchColor): string {
  return `oklch(${(oklch.l * 100).toFixed(1)}% ${oklch.c.toFixed(3)} ${oklch.h.toFixed(1)}°)`
}

/**
 * Pick black or white — whichever has higher WCAG contrast — for text/icons
 * placed directly on top of `bgHex` (e.g. a filled accent-colored button).
 */
export function accessibleOnColor(bgHex: string): string {
  const whiteContrast = wcagContrast(bgHex, '#ffffff')
  const blackContrast = wcagContrast(bgHex, '#000000')
  return whiteContrast >= blackContrast ? '#ffffff' : '#000000'
}

// ─── Card Surface Token (image-derived) ─────────────────────────────────────

export interface CardSurfaceToken {
  /** Raw dominant hue extracted from the source image, unadjusted. */
  sourceHex: string
  sourceOklch: OklchColor
  /** Accessibility-adjusted hex, safe as a background under fixed white text. */
  hex: string
  oklch: OklchColor
  /** Contrast of `hex` against white (#ffffff), i.e. against the on-top text. */
  contrastRatio: number
  contrastTarget: number
  passes: boolean
  notes: string[]
}

// Not a WCAG figure — same spirit as DARK_BUTTON_MIN_SURFACE_CONTRAST above:
// a floor just high enough that the CTA button reads as a distinct shape
// against the card's own background hue, not full accessible contrast (the
// button's own text contrast already covers that). Image key art can easily
// land on a hue close to the Universe accent color (see e.g. a teal/cyan
// screenshot against a teal accent button), in which case the button all
// but disappears into the gradient.
export const MIN_CARD_VS_BUTTON_CONTRAST = 1.5

/**
 * If the card surface color is too close to the CTA button's color to read
 * as a distinct shape, darken (and mildly desaturate) the surface — never
 * the button — just enough to clear a minimum differentiation floor. Chroma
 * is scaled down alongside lightness so the darkening doesn't read as an
 * arbitrary hue shift. The button itself is never touched: it's a shared
 * Universe-level token used elsewhere, not something this one card should
 * override.
 */
function ensureCardButtonContrast(
  surface: { hex: string; oklch: OklchColor },
  buttonHex: string,
): { hex: string; oklch: OklchColor; note?: string } {
  const contrastVsButton = wcagContrast(surface.hex, buttonHex)
  if (contrastVsButton >= MIN_CARD_VS_BUTTON_CONTRAST) return surface

  const { l, c, h } = surface.oklch

  const chromaAt = (candidateL: number) => {
    const chromaScale = l > 0 ? 0.6 + 0.4 * (candidateL / l) : 1
    return c * chromaScale
  }

  // Largest L (smallest darkening step from the current surface) that
  // clears the floor — contrast vs. a fixed button color rises as the
  // surface darkens away from it in the typical case where the button
  // isn't itself near-black.
  let lo = 0
  let hi = l
  let bestL = 0
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    const { hex } = oklchToHex(mid, chromaAt(mid), h)
    if (wcagContrast(hex, buttonHex) >= MIN_CARD_VS_BUTTON_CONTRAST) {
      bestL = mid
      lo = mid
    } else {
      hi = mid
    }
  }

  const { hex: finalHex, finalC } = oklchToHex(bestL, chromaAt(bestL), h)
  return {
    hex: finalHex,
    oklch: { l: bestL, c: finalC, h },
    note: `Darkened from ${Math.round(l * 100)}% to ${Math.round(bestL * 100)}% lightness (chroma trimmed to match) so the CTA button stays visually distinct (≥${MIN_CARD_VS_BUTTON_CONTRAST}:1) from a similarly-hued card background.`,
  }
}

/**
 * Derive an accessible card-gradient surface color from a raw dominant hue
 * (e.g. extracted from a Universe's key art). The color is treated as a
 * background surface with fixed light (white) text/metadata on top — the
 * inverse relationship of the light-mode accent token above, but the same
 * underlying technique: darken (in OKLCH) via `adjustForContrast` until the
 * fixed foreground color reaches the standard's text contrast target.
 *
 * When `buttonHex` (the Universe's CTA color) is provided, a second pass
 * (ensureCardButtonContrast) guards against the card's own background
 * landing too close to the button's hue for the CTA to read as distinct.
 */
export function deriveCardSurfaceToken(
  dominantHex: string,
  standard: ContrastStandard = DEFAULT_CONTRAST_STANDARD,
  buttonHex?: string,
): CardSurfaceToken {
  const sourceOklch = hexToOklch(dominantHex)
  const result = adjustForContrast(sourceOklch, '#ffffff', standard.textTarget, 'light')

  let finalHex = result.hex
  let finalOklch = result.oklch
  const notes = [...result.notes]

  if (buttonHex) {
    const adjusted = ensureCardButtonContrast({ hex: finalHex, oklch: finalOklch }, buttonHex)
    if (adjusted.note) {
      finalHex = adjusted.hex
      finalOklch = adjusted.oklch
      notes.push(adjusted.note)
    }
  }

  const contrastRatio = wcagContrast(finalHex, '#ffffff')

  return {
    sourceHex: dominantHex,
    sourceOklch,
    hex: finalHex,
    oklch: finalOklch,
    contrastRatio,
    contrastTarget: standard.textTarget,
    passes: contrastRatio >= standard.textTarget,
    notes,
  }
}

/**
 * Color for accent-colored text/icons/borders that sit directly on a
 * surface (e.g. an outline button), rather than on a filled background.
 * The accent token is only guaranteed to meet the interactive (non-text UI)
 * target against its surface, so when it's reused as a text label it can
 * fall short of the text target. Keep the brand accent when it clears that
 * bar; otherwise fall back to whichever of black/white is accessible
 * against the surface.
 */
export function accessibleAccentOnSurface(
  accentHex: string,
  surfaceHex: string,
  textTarget: number,
): string {
  return wcagContrast(accentHex, surfaceHex) >= textTarget ? accentHex : accessibleOnColor(surfaceHex)
}
