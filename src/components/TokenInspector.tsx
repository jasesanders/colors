import { useState } from 'react'
import {
  type GeneratedTokens,
  type TokenResult,
  CONTRAST_STANDARDS,
  DARK_SURFACE,
  LIGHT_SURFACE,
  formatOklch,
} from '../color/utils'

interface Props {
  tokens: GeneratedTokens
  standardId: keyof typeof CONTRAST_STANDARDS
  onStandardChange: (id: keyof typeof CONTRAST_STANDARDS) => void
}

function StandardToggle({
  standardId,
  onStandardChange,
}: {
  standardId: keyof typeof CONTRAST_STANDARDS
  onStandardChange: (id: keyof typeof CONTRAST_STANDARDS) => void
}) {
  return (
    <div className="standard-toggle" role="group" aria-label="Accessibility target">
      {Object.entries(CONTRAST_STANDARDS).map(([key, standard]) => (
        <button
          key={key}
          className={`standard-toggle__btn${standardId === key ? ' standard-toggle__btn--active' : ''}`}
          onClick={() => onStandardChange(key as keyof typeof CONTRAST_STANDARDS)}
          title={standard.description}
          aria-pressed={standardId === key}
        >
          {standard.label}
        </button>
      ))}
    </div>
  )
}

function TokenRow({ token }: { token: TokenResult }) {
  const passLabel =
    token.passes === null ? (
      <span className="badge badge--neutral">Surface</span>
    ) : token.passes ? (
      <span className="badge badge--pass">PASS</span>
    ) : (
      <span className="badge badge--fail">FAIL</span>
    )

  return (
    <div className="token-row">
      <span
        className="token-swatch"
        style={token.gradient ? { backgroundImage: token.gradient.css } : { background: token.hex }}
      />
      <div className="token-row__main">
        <div className="token-row__line1">
          <code className="token-name">{token.tokenName}</code>
          <code className="token-hex">{token.hex}</code>
        </div>
        <div className="token-role">{token.role}</div>
      </div>
      <div className="token-row__end">
        {passLabel}
        <span className="token-contrast">
          {token.contrastRatio.toFixed(2)}:1
          {token.contrastTarget && (
            <span className="contrast-target"> (≥{token.contrastTarget}:1)</span>
          )}
        </span>
      </div>
    </div>
  )
}

function RulesPanel({ tokens }: { tokens: GeneratedTokens }) {
  const allTokens = [
    tokens.light.accent,
    tokens.light.accentContent,
    tokens.light.accentSoft,
    tokens.dark.accent,
    tokens.dark.accentContent,
    tokens.dark.accentSoft,
    tokens.filled,
  ]

  return (
    <div className="rules-panel">
      <h3 className="rules-panel__title">Rules applied</h3>

      <div className="rules-meta">
        <div className="rules-meta__row">
          <span className="rules-meta__label">Source color</span>
          <span className="rules-meta__value">
            <span className="inline-swatch" style={{ background: tokens.sourceHex }} />
            {tokens.sourceHex}
          </span>
        </div>
        <div className="rules-meta__row">
          <span className="rules-meta__label">Source OKLCH</span>
          <span className="rules-meta__value">{formatOklch(tokens.sourceOklch)}</span>
        </div>
        <div className="rules-meta__row">
          <span className="rules-meta__label">Light surface</span>
          <span className="rules-meta__value">
            <span
              className="inline-swatch inline-swatch--bordered"
              style={{ background: LIGHT_SURFACE }}
            />
            {LIGHT_SURFACE}
          </span>
        </div>
        <div className="rules-meta__row">
          <span className="rules-meta__label">Dark surface</span>
          <span className="rules-meta__value">
            <span className="inline-swatch" style={{ background: DARK_SURFACE }} />
            {DARK_SURFACE}
          </span>
        </div>
        <div className="rules-meta__row">
          <span className="rules-meta__label">Non-text target</span>
          <span className="rules-meta__value">
            {tokens.standard.label} for interactive controls ({tokens.standard.interactiveTarget}:1)
          </span>
        </div>
        <div className="rules-meta__row">
          <span className="rules-meta__label">Text target</span>
          <span className="rules-meta__value">
            {tokens.standard.label} for normal text ({tokens.standard.textTarget}:1)
          </span>
        </div>
      </div>

      <div className="rules-transformations">
        {allTokens.map((t) => (
          <div key={t.tokenName} className="transformation-entry">
            <div className="transformation-entry__header">
              <span className="inline-swatch" style={{ background: t.hex }} />
              <code className="token-name">{t.tokenName}</code>
            </div>
            <ul className="transformation-notes">
              {t.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="soft-disclaimer">
        <strong>Background tints</strong> are contextual surfaces, not text or interactive colors.
        Contrast requirements apply to the foreground content placed on them rather than
        requiring the tint itself to reach 3:1 or 4.5:1.
      </p>
    </div>
  )
}

export default function TokenInspector({ tokens, standardId, onStandardChange }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(tokens.cssVariables).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section className="token-inspector">
      <div className="token-inspector__header">
        <h2 className="section-title">Generated color system</h2>
        <StandardToggle standardId={standardId} onStandardChange={onStandardChange} />
      </div>

      <div className="token-tables">
        <div className="token-table-group">
          <h3 className="token-table-mode">☀ Light mode</h3>
          <div className="token-list">
            <TokenRow token={tokens.light.accent} />
            <TokenRow token={tokens.light.accentContent} />
            <TokenRow token={tokens.light.accentSoft} />
          </div>
        </div>

        <div className="token-table-group">
          <h3 className="token-table-mode">◗ Dark mode</h3>
          <div className="token-list">
            <TokenRow token={tokens.dark.accent} />
            <TokenRow token={tokens.dark.accentContent} />
            <TokenRow token={tokens.dark.accentSoft} />
          </div>
        </div>

        <div className="token-table-group">
          <h3 className="token-table-mode">◐ Filled button (shared, both themes)</h3>
          <div className="token-list">
            <TokenRow token={tokens.filled} />
          </div>
        </div>
      </div>

      <div className="css-vars-block">
        <div className="css-vars-header">
          <span>CSS custom properties</span>
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? '✓ Copied' : 'Copy tokens'}
          </button>
        </div>
        <pre className="css-vars-code">
          <code>{tokens.cssVariables}</code>
        </pre>
      </div>

      <RulesPanel tokens={tokens} />
    </section>
  )
}
