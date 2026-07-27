import { useEffect, useRef, useState } from 'react'
import { extractDominantHex } from '../color/cardImages'
import {
  deriveAccentForSurface,
  hexToRgb,
  type CardSurfaceToken,
  type ContrastStandard,
  type TokenResult,
} from '../color/utils'
import { TokenRow } from './TokenInspector'

interface Props {
  standard: ContrastStandard
  /** Universe-level filled/primary button token — used for the CTA when the toggle is on. */
  filledHex: string
  filledOnColor: string
  filledGradientCss?: string
}

interface TitlePreset {
  id: string
  brand: string
  title: string
  meta: string
  next: string
  episode: string
  src: string
}

// Reuses the same key-art served for the card section — here each image
// stands in as the hero backdrop of a *title* page. The accent is derived
// from the backdrop, not from a Universe-level color.
const TITLE_PRESETS: TitlePreset[] = [
  {
    id: 'dune',
    brand: 'LEGENDARY',
    title: 'Dune: Part Two',
    meta: '2024 · PG-13 · 2h 46m',
    next: 'The Southern Reaches',
    episode: 'CH 3',
    src: '/card-samples/dune.webp',
  },
  {
    id: 'one-piece',
    brand: 'TOEI ANIMATION',
    title: 'One Piece',
    meta: '1999 · TV-14 · 20 Seasons',
    next: 'The Sanctuary',
    episode: 'S1 · E3',
    src: '/card-samples/one-piece.webp',
  },
  {
    id: 'cyberpunk',
    brand: 'CD PROJEKT RED',
    title: 'Cyberpunk 2077',
    meta: '2020 · Mature · Game',
    next: 'Phantom Liberty',
    episode: 'ACT 2',
    src: '/card-samples/cyberpunk.webp',
  },
  {
    id: 'crossover-battle',
    brand: 'FANDOM',
    title: 'Crossover Battle',
    meta: 'Community · Versus',
    next: 'Round of 16',
    episode: 'BRACKET',
    src: '/card-samples/crossover-battle.webp',
  },
  {
    id: 'grow-a-garden',
    brand: 'ROBLOX',
    title: 'Grow a Garden',
    meta: '2024 · E · Game',
    next: 'Autumn Harvest',
    episode: 'WAVE 5',
    src: '/card-samples/grow-a-garden.webp',
  },
]

const TABS = ['Overview', 'Discussions', 'Where to Watch']

function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`
}

function TitlePhone({
  mode,
  preset,
  src,
  brand,
  title,
  meta,
  next,
  episode,
  scrimAccent,
  tabAccent,
  useUniverseCta,
  filledHex,
  filledOnColor,
  filledGradientCss,
}: {
  mode: 'light' | 'dark'
  preset: TitlePreset
  src: string
  brand: string
  title: string
  meta: string
  next: string
  episode: string
  /** Accent darkened against white — hero scrim base + accent text on the white Update button. */
  scrimAccent: string
  /** Accent adapted to this theme's content surface — tab text + underline. */
  tabAccent: string
  useUniverseCta: boolean
  filledHex: string
  filledOnColor: string
  filledGradientCss?: string
}) {
  const [activeTab, setActiveTab] = useState(0)
  void preset

  const isDark = mode === 'dark'
  const surface = isDark ? '#121212' : '#ffffff'
  const bodyText = isDark ? '#d6d6d6' : '#333333'
  const tabInactive = isDark ? '#7c7c7c' : '#8a8a8a'
  const tabBorder = isDark ? '#2a2a2a' : '#ececec'

  // The opaque accent at the bottom, fading up and out so the backdrop reads
  // through the top of the hero. Solid through the title/metadata block.
  const scrimCss = `linear-gradient(to top, ${hexToRgba(scrimAccent, 1)} 0%, ${hexToRgba(
    scrimAccent,
    1,
  )} 24%, ${hexToRgba(scrimAccent, 0.7)} 52%, ${hexToRgba(scrimAccent, 0)} 100%)`

  return (
    <div className={`title-phone${isDark ? ' title-phone--dark' : ''}`} style={{ background: surface }}>
      <div className="title-hero">
        <img src={src} alt={title} className="title-hero__img" />
        <div className="title-hero__scrim" style={{ backgroundImage: scrimCss }} />

        <div className="title-hero__topbar">
          <button className="title-chip title-chip--round" aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="title-chip title-chip--pill">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </div>
        </div>

        <div className="title-hero__body">
          <div className="title-hero__row">
            <img src={src} alt="" className="title-hero__poster" aria-hidden="true" />
            <div className="title-hero__headings">
              <div className="title-hero__brand">{brand}</div>
              <h3 className="title-hero__name">{title}</h3>
              <div className="title-hero__meta">{meta}</div>
            </div>
          </div>

          <div className="title-hero__nextrow">
            <div className="title-hero__nextcol">
              <div className="title-hero__next">
                <span className="title-hero__next-label">Next:</span> {next}
              </div>
              <div className="title-progress" aria-hidden="true">
                <div className="title-progress__fill" style={{ width: '38%' }} />
              </div>
            </div>
            <div className="title-hero__ep">{episode}</div>
            {useUniverseCta ? (
              <button
                className="title-update title-update--filled"
                style={{
                  color: filledOnColor,
                  ...(filledGradientCss
                    ? { backgroundImage: filledGradientCss }
                    : { background: filledHex }),
                }}
              >
                Update
              </button>
            ) : (
              <button className="title-update" style={{ color: scrimAccent }}>
                Update
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="title-tabs" style={{ borderBottomColor: tabBorder }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`title-tab${activeTab === i ? ' title-tab--active' : ''}`}
            onClick={() => setActiveTab(i)}
            style={
              {
                color: activeTab === i ? tabAccent : tabInactive,
                '--title-tab-accent': tabAccent,
              } as React.CSSProperties
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="title-content">
        <p className="title-content__body" style={{ color: bodyText }}>
          After the devastating events of the previous chapter, the world is in ruins. With the
          help of remaining allies, the heroes assemble once more to undo the damage.
        </p>
      </div>
    </div>
  )
}

export default function TitlePreview({ standard, filledHex, filledOnColor, filledGradientCss }: Props) {
  const [presetIndex, setPresetIndex] = useState(1)
  const [customSrc, setCustomSrc] = useState<string | null>(null)
  const [customLabel, setCustomLabel] = useState<string | null>(null)
  const [dominantHex, setDominantHex] = useState<string | null>(null)
  const [useUniverseCta, setUseUniverseCta] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const preset = TITLE_PRESETS[presetIndex]
  const activeSrc = customSrc ?? preset.src
  const brand = customSrc ? 'UPLOADED' : preset.brand
  const title = customSrc ? customLabel ?? 'Uploaded image' : preset.title
  const meta = customSrc ? 'Derived from your image' : preset.meta
  const next = customSrc ? 'Up Next' : preset.next
  const episode = customSrc ? 'NEW' : preset.episode

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    function run() {
      if (!img) return
      try {
        setDominantHex(extractDominantHex(img))
      } catch {
        setDominantHex(null)
      }
    }

    if (img.complete && img.naturalWidth > 0) {
      run()
    } else {
      img.addEventListener('load', run, { once: true })
      return () => img.removeEventListener('load', run)
    }
  }, [activeSrc])

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCustomSrc(reader.result as string)
      setCustomLabel(file.name)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // The dominant hue, resolved for each theme's content surface — darkened
  // against white for light mode, lightened against #121212 for dark. The
  // light value doubles as the hero scrim base (white title/metadata sit on
  // it) in both phones, since the hero image is theme-independent.
  const light: CardSurfaceToken | null = dominantHex
    ? deriveAccentForSurface(dominantHex, standard, 'light')
    : null
  const dark: CardSurfaceToken | null = dominantHex
    ? deriveAccentForSurface(dominantHex, standard, 'dark')
    : null

  const scrimAccent = light?.hex ?? '#333333'

  const sourceToken: TokenResult | null = light
    ? {
        tokenName: '--title-source-hue',
        hex: light.sourceHex,
        oklch: light.sourceOklch,
        contrastRatio: 0,
        contrastTarget: null,
        passes: null,
        role: 'Dominant hue extracted from the hero backdrop, unadjusted',
        notes: ['Extracted client-side via canvas pixel sampling, weighted by chroma per hue bucket.'],
      }
    : null

  const lightToken: TokenResult | null = light
    ? {
        tokenName: '--title-accent-light',
        hex: light.hex,
        oklch: light.oklch,
        contrastRatio: light.contrastRatio,
        contrastTarget: light.contrastTarget,
        passes: light.passes,
        role: `Light: hero scrim base, "Update" text, tabs (${standard.label} vs. white)`,
        notes: light.notes,
      }
    : null

  const darkToken: TokenResult | null = dark
    ? {
        tokenName: '--title-accent-dark',
        hex: dark.hex,
        oklch: dark.oklch,
        contrastRatio: dark.contrastRatio,
        contrastTarget: dark.contrastTarget,
        passes: dark.passes,
        role: `Dark: tab text + underline on the dark content surface (${standard.label} vs. #121212)`,
        notes: dark.notes,
      }
    : null

  const commonPhoneProps = {
    preset,
    src: activeSrc,
    brand,
    title,
    meta,
    next,
    episode,
    scrimAccent,
    useUniverseCta,
    filledHex,
    filledOnColor,
    filledGradientCss,
  }

  return (
    <section className="title-preview-section">
      <div className="token-inspector__header">
        <h2 className="section-title">Title pages</h2>
        <label className="title-cta-toggle">
          <input
            type="checkbox"
            checked={useUniverseCta}
            onChange={(e) => setUseUniverseCta(e.target.checked)}
          />
          <span className="title-cta-toggle__track" aria-hidden="true">
            <span className="title-cta-toggle__thumb" />
          </span>
          <span className="title-cta-toggle__label">Universe accent CTA</span>
        </label>
      </div>

      <p className="product-statement">
        A title page isn't tied to a Universe, so its accent is derived from the title's own hero
        backdrop instead. The dominant hue is extracted, then run through the same OKLCH contrast
        engine — darkened against white for light mode, lightened against the dark surface for dark
        mode — until it clears {standard.label}. That accent anchors the opaque bottom of the hero
        scrim, the accent text on the light &ldquo;Update&rdquo; button, and the tab controls.
        Toggle <em>Universe accent CTA</em> to swap the Update button for the shared Universe
        filled-button token — same treatment as a Universe page&rsquo;s primary action.
      </p>

      <div className="card-demo-layout">
        <div className="title-preview-wrap">
          {/* Hidden source image drives dominant-hue extraction. */}
          <img ref={imgRef} src={activeSrc} alt="" className="title-extract-src" aria-hidden="true" />

          <div className="title-phones">
            <div className="title-phone-col">
              <div className="preview-mode-label">☀ Light mode</div>
              <TitlePhone mode="light" tabAccent={scrimAccent} {...commonPhoneProps} />
            </div>
            <div className="title-phone-col">
              <div className="preview-mode-label">◗ Dark mode</div>
              <TitlePhone mode="dark" tabAccent={dark?.hex ?? scrimAccent} {...commonPhoneProps} />
            </div>
          </div>

          <div className="card-picker-row title-picker-row">
            {TITLE_PRESETS.map((p, i) => (
              <button
                key={p.id}
                className={`card-thumb${!customSrc && presetIndex === i ? ' card-thumb--active' : ''}`}
                style={{ backgroundImage: `url(${p.src})` }}
                onClick={() => {
                  setCustomSrc(null)
                  setPresetIndex(i)
                }}
                title={p.title}
                aria-label={p.title}
                aria-pressed={!customSrc && presetIndex === i}
              />
            ))}
            <button
              className={`card-thumb card-thumb--upload${customSrc ? ' card-thumb--active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              title="Upload your own image"
              aria-label="Upload your own image"
            >
              +
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="card-readout">
          {sourceToken && lightToken && darkToken ? (
            <div className="token-list">
              <TokenRow token={sourceToken} />
              <TokenRow token={lightToken} />
              <TokenRow token={darkToken} />
            </div>
          ) : (
            <p className="section-description">Extracting accent from backdrop…</p>
          )}
        </div>
      </div>
    </section>
  )
}
