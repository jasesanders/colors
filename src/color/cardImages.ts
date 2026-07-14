/**
 * Card key-art samples + dominant-hue extraction.
 *
 * In place of a server-side pipeline (ffmpeg, etc.), dominant-hue extraction
 * runs client-side via canvas pixel sampling — the same idea (reduce an
 * image to its most prominent color), just in-browser.
 */

import { hexToOklch, oklchToHex, rgbToHex } from './utils'

export interface CardPreset {
  id: string
  label: string
  genre: string
  tag: string
  src: string
}

const SAMPLE_SIZE = 64
const HUE_BUCKETS = 24
const CHROMA_MIN = 0.02

/**
 * Downscale the image onto a small offscreen canvas, then bucket pixels by
 * OKLCH hue (weighted by chroma, so saturated pixels count more than
 * washed-out ones) to find the dominant hue family. Returns the average
 * color within the winning bucket. Falls back to the overall average color
 * if the image is entirely (near-)achromatic.
 */
export function extractDominantHex(image: HTMLImageElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE_SIZE
  canvas.height = SAMPLE_SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('2D canvas context unavailable')

  // Cover-fit into the square sample canvas so extraction isn't skewed by letterboxing.
  const scale = Math.max(SAMPLE_SIZE / image.naturalWidth, SAMPLE_SIZE / image.naturalHeight)
  const drawW = image.naturalWidth * scale
  const drawH = image.naturalHeight * scale
  ctx.drawImage(image, (SAMPLE_SIZE - drawW) / 2, (SAMPLE_SIZE - drawH) / 2, drawW, drawH)

  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)

  const bucketWeight = new Array(HUE_BUCKETS).fill(0)
  const bucketL = new Array(HUE_BUCKETS).fill(0)
  const bucketC = new Array(HUE_BUCKETS).fill(0)
  let fallbackWeight = 0
  let fallbackL = 0

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]
    if (alpha < 200) continue

    const hex = rgbToHex(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255)
    const oklch = hexToOklch(hex)

    fallbackWeight += 1
    fallbackL += oklch.l

    if (oklch.c < CHROMA_MIN) continue

    const bucket = Math.floor(oklch.h / (360 / HUE_BUCKETS)) % HUE_BUCKETS
    bucketWeight[bucket] += oklch.c
    bucketL[bucket] += oklch.l * oklch.c
    bucketC[bucket] += oklch.c * oklch.c
  }

  let bestBucket = -1
  let bestWeight = 0
  for (let b = 0; b < HUE_BUCKETS; b++) {
    if (bucketWeight[b] > bestWeight) {
      bestWeight = bucketWeight[b]
      bestBucket = b
    }
  }

  if (bestBucket === -1) {
    // Entirely (near-)achromatic image — fall back to average lightness, no hue.
    const avgL = fallbackWeight > 0 ? fallbackL / fallbackWeight : 0.5
    return oklchToHex(avgL, 0, 0).hex
  }

  const avgL = bucketL[bestBucket] / bucketWeight[bestBucket]
  const avgC = bucketC[bestBucket] / bucketWeight[bestBucket]
  const hueCenter = bestBucket * (360 / HUE_BUCKETS) + 360 / HUE_BUCKETS / 2

  return oklchToHex(avgL, avgC, hueCenter).hex
}

// ─── Key-art presets ─────────────────────────────────────────────────────────
// Real key-art sourced from fandom.com/utilities, served from /public so the
// dominant-hue extraction runs against actual photographic/illustrated
// texture instead of procedural placeholders.

export const CARD_PRESETS: CardPreset[] = [
  {
    id: 'grow-a-garden',
    label: 'Grow a Garden',
    genre: 'Crop calculator',
    tag: 'ROBLOX',
    src: '/card-samples/grow-a-garden.webp',
  },
  {
    id: 'one-piece',
    label: 'One Piece',
    genre: 'Devil fruit · ship · bounty',
    tag: 'ANIME',
    src: '/card-samples/one-piece.webp',
  },
  {
    id: 'crossover-battle',
    label: 'Crossover Battle',
    genre: 'Matchup builder',
    tag: 'GAMES',
    src: '/card-samples/crossover-battle.webp',
  },
  {
    id: 'dune',
    label: 'Dune',
    genre: 'Faction utility',
    tag: 'MOVIES',
    src: '/card-samples/dune.webp',
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    genre: 'Faction path planner',
    tag: 'GAMES',
    src: '/card-samples/cyberpunk.webp',
  },
]
