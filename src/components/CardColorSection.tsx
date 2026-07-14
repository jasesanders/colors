import { useEffect, useRef, useState } from 'react'
import { CARD_PRESETS, extractDominantHex } from '../color/cardImages'
import { deriveCardSurfaceToken, hexToRgb, type ContrastStandard, type TokenResult } from '../color/utils'
import { TokenRow } from './TokenInspector'

interface Props {
  filledHex: string
  filledOnColor: string
  standard: ContrastStandard
}

function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`
}

export default function CardColorSection({ filledHex, filledOnColor, standard }: Props) {
  const [presetIndex, setPresetIndex] = useState(0)
  const [customSrc, setCustomSrc] = useState<string | null>(null)
  const [customLabel, setCustomLabel] = useState<string | null>(null)
  const [dominantHex, setDominantHex] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeSrc = customSrc ?? CARD_PRESETS[presetIndex].src
  const activeLabel = customSrc ? customLabel ?? 'Uploaded image' : CARD_PRESETS[presetIndex].label
  const activeGenre = customSrc ? 'Uploaded image' : CARD_PRESETS[presetIndex].genre
  const activeTag = customSrc ? 'CUSTOM' : CARD_PRESETS[presetIndex].tag

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

  const cardSurface = dominantHex ? deriveCardSurfaceToken(dominantHex, standard, filledHex) : null

  const sourceToken: TokenResult | null = cardSurface
    ? {
        tokenName: '--card-source-hue',
        hex: cardSurface.sourceHex,
        oklch: cardSurface.sourceOklch,
        contrastRatio: 0,
        contrastTarget: null,
        passes: null,
        role: 'Dominant hue extracted from the image, unadjusted',
        notes: ['Extracted client-side via canvas pixel sampling, weighted by chroma per hue bucket.'],
      }
    : null

  const surfaceToken: TokenResult | null = cardSurface
    ? {
        tokenName: '--card-gradient-surface',
        hex: cardSurface.hex,
        oklch: cardSurface.oklch,
        contrastRatio: cardSurface.contrastRatio,
        contrastTarget: cardSurface.contrastTarget,
        passes: cardSurface.passes,
        role: `Card fade background — pairs with white text/metadata (${standard.label})`,
        notes: cardSurface.notes,
      }
    : null

  // Flat/solid from the bottom through the CTA button, then fades upward
  // and out to fully transparent — the scrim element is taller than the
  // text content box so the fade starts well above the title, not right at
  // its own top edge.
  const overlayCss = cardSurface
    ? `linear-gradient(to top, ${hexToRgba(cardSurface.hex, 1)} 0%, ${hexToRgba(cardSurface.hex, 1)} 26%, ${hexToRgba(cardSurface.hex, 0.85)} 55%, ${hexToRgba(cardSurface.hex, 0)} 100%)`
    : undefined

  return (
    <section className="card-color-section">
      <div className="token-inspector__header">
        <h2 className="section-title">Card colors</h2>
      </div>

      <p className="product-statement">
        A card's faded gradient is derived from the dominant hue in its own key art, not the
        Universe accent color. The dominant hue is extracted, then darkened (same OKLCH contrast
        engine as the rest of this system) until it passes {standard.label} for the white text/
        metadata sitting on top. The CTA button still uses the Universe's filled accent token.
      </p>

      <div className="card-demo-layout">
        <div className="card-preview-wrap">
          <div className="card-preview">
            <img ref={imgRef} src={activeSrc} alt={activeLabel} className="card-preview__img" />
            <div className="card-preview__scrim" style={{ backgroundImage: overlayCss }} />
            <div className="card-preview__star" aria-hidden="true">
              ☆
            </div>
            <div className="card-preview__body">
              <span
                className="card-preview__pill"
                style={{ background: hexToRgba(filledHex, 0.3) }}
              >
                {activeTag}
              </span>
              <h3 className="card-preview__title">{activeLabel}</h3>
              <p className="card-preview__desc">{activeGenre}</p>
              <button
                className="card-preview__cta"
                style={{ background: filledHex, color: filledOnColor }}
              >
                Start
              </button>
            </div>
          </div>

          <div className="card-picker-row">
            {CARD_PRESETS.map((preset, i) => (
              <button
                key={preset.id}
                className={`card-thumb${!customSrc && presetIndex === i ? ' card-thumb--active' : ''}`}
                style={{ backgroundImage: `url(${preset.src})` }}
                onClick={() => {
                  setCustomSrc(null)
                  setPresetIndex(i)
                }}
                title={preset.label}
                aria-label={preset.label}
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
          {sourceToken && surfaceToken ? (
            <div className="token-list">
              <TokenRow token={sourceToken} />
              <TokenRow token={surfaceToken} />
            </div>
          ) : (
            <p className="section-description">Extracting dominant hue…</p>
          )}
        </div>
      </div>
    </section>
  )
}
