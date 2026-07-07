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

export interface TokenResult {
  tokenName: string
  hex: string
  oklch: OklchColor
  contrastRatio: number
  contrastTarget: number | null
  passes: boolean | null
  role: string
  notes: string[]
}

export interface GeneratedTokens {
  sourceHex: string
  sourceOklch: OklchColor
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
  cssVariables: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const LIGHT_SURFACE = '#ffffff'
export const DARK_SURFACE = '#121212'
export const INTERACTIVE_CONTRAST_TARGET = 3.0
export const TEXT_CONTRAST_TARGET = 4.5

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

// ─── Token Generator ─────────────────────────────────────────────────────────

/**
 * Generate the full set of Universe color tokens from a single canonical source hex.
 * All transformations are deterministic and OKLCH-based.
 */
export function generateTokens(sourceHex: string): GeneratedTokens {
  const normalizedHex = sourceHex.startsWith('#') ? sourceHex : `#${sourceHex}`
  const sourceOklch = hexToOklch(normalizedHex)

  const lightAccentResult = adjustForContrast(
    sourceOklch,
    LIGHT_SURFACE,
    INTERACTIVE_CONTRAST_TARGET,
    'light',
  )
  const lightAccentContrast = wcagContrast(lightAccentResult.hex, LIGHT_SURFACE)

  const lightContentResult = adjustForContrast(
    sourceOklch,
    LIGHT_SURFACE,
    TEXT_CONTRAST_TARGET,
    'light',
  )
  const lightContentContrast = wcagContrast(lightContentResult.hex, LIGHT_SURFACE)

  const lightSoftResult = generateSoftTint(sourceOklch, 'light')
  const lightSoftContrast = wcagContrast(lightSoftResult.hex, LIGHT_SURFACE)

  const darkAccentResult = adjustForContrast(
    sourceOklch,
    DARK_SURFACE,
    INTERACTIVE_CONTRAST_TARGET,
    'dark',
  )
  const darkAccentContrast = wcagContrast(darkAccentResult.hex, DARK_SURFACE)

  const darkContentResult = adjustForContrast(
    sourceOklch,
    DARK_SURFACE,
    TEXT_CONTRAST_TARGET,
    'dark',
  )
  const darkContentContrast = wcagContrast(darkContentResult.hex, DARK_SURFACE)

  const darkSoftResult = generateSoftTint(sourceOklch, 'dark')
  const darkSoftContrast = wcagContrast(darkSoftResult.hex, DARK_SURFACE)

  const light = {
    accent: {
      tokenName: '--universe-accent-light',
      hex: lightAccentResult.hex,
      oklch: lightAccentResult.oklch,
      contrastRatio: lightAccentContrast,
      contrastTarget: INTERACTIVE_CONTRAST_TARGET,
      passes: lightAccentContrast >= INTERACTIVE_CONTRAST_TARGET,
      role: 'Interactive controls, selected states, non-text UI',
      notes: lightAccentResult.notes,
    },
    accentContent: {
      tokenName: '--universe-accent-content-light',
      hex: lightContentResult.hex,
      oklch: lightContentResult.oklch,
      contrastRatio: lightContentContrast,
      contrastTarget: TEXT_CONTRAST_TARGET,
      passes: lightContentContrast >= TEXT_CONTRAST_TARGET,
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

  const dark = {
    accent: {
      tokenName: '--universe-accent-dark',
      hex: darkAccentResult.hex,
      oklch: darkAccentResult.oklch,
      contrastRatio: darkAccentContrast,
      contrastTarget: INTERACTIVE_CONTRAST_TARGET,
      passes: darkAccentContrast >= INTERACTIVE_CONTRAST_TARGET,
      role: 'Interactive controls, selected states, non-text UI',
      notes: darkAccentResult.notes,
    },
    accentContent: {
      tokenName: '--universe-accent-content-dark',
      hex: darkContentResult.hex,
      oklch: darkContentResult.oklch,
      contrastRatio: darkContentContrast,
      contrastTarget: TEXT_CONTRAST_TARGET,
      passes: darkContentContrast >= TEXT_CONTRAST_TARGET,
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

  const fmt = (t: TokenResult) => `  ${t.tokenName}: ${t.hex}; /* ${t.role} */`

  const cssVariables = `:root {\n${[
    fmt(light.accent),
    fmt(light.accentContent),
    fmt(light.accentSoft),
    '',
    fmt(dark.accent),
    fmt(dark.accentContent),
    fmt(dark.accentSoft),
  ].join('\n')}\n}`

  return {
    sourceHex: normalizedHex,
    sourceOklch,
    light,
    dark,
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
