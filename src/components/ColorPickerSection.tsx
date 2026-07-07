import { useRef } from 'react'
import { validateHex } from '../color/utils'

interface Props {
  value: string
  onChange: (hex: string) => void
}

const PRESETS = [
  { hex: '#cc1520', label: 'Resident Evil' },
  { hex: '#005f9e', label: 'Star Wars' },
  { hex: '#f7c23e', label: 'Pokémon' },
  { hex: '#007744', label: 'Animal Crossing' },
  { hex: '#8b2fc9', label: 'Elden Ring' },
]

export default function ColorPickerSection({ value, onChange }: Props) {
  const hexInputRef = useRef<HTMLInputElement>(null)

  function handleHexInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const normalized = validateHex(raw)
    if (normalized) onChange(normalized)
  }

  function handleHexBlur(e: React.FocusEvent<HTMLInputElement>) {
    const normalized = validateHex(e.target.value)
    if (normalized) {
      e.target.value = normalized
      onChange(normalized)
    } else {
      e.target.value = value
    }
  }

  return (
    <section className="color-picker-section">
      <div className="section-label">Universe accent color</div>
      <h2 className="section-title">Canonical source color</h2>
      <p className="section-description">
        Choose one color that represents this Universe. Accessible light and dark
        theme variants are generated automatically.
      </p>

      <div className="picker-row">
        <div className="picker-control">
          <input
            type="color"
            className="native-color-picker"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Color picker"
          />
          <input
            ref={hexInputRef}
            type="text"
            className="hex-input"
            defaultValue={value}
            key={value}
            onChange={handleHexInput}
            onBlur={handleHexBlur}
            maxLength={7}
            spellCheck={false}
            aria-label="Hex color value"
            placeholder="#000000"
          />
        </div>

        <div className="preset-swatches">
          <span className="preset-label">Presets</span>
          {PRESETS.map((p) => (
            <button
              key={p.hex}
              className={`swatch-btn${value === p.hex ? ' swatch-btn--active' : ''}`}
              style={{ background: p.hex }}
              onClick={() => onChange(p.hex)}
              title={p.label}
              aria-label={`${p.label}: ${p.hex}`}
            />
          ))}
        </div>
      </div>

      <div className="source-preview" style={{ background: value }} aria-hidden="true" />
    </section>
  )
}
