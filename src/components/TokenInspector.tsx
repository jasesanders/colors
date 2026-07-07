import { useState } from 'react'
import {
  type GeneratedTokens,
  type TokenResult,
  DARK_SURFACE,
  INTERACTIVE_CONTRAST_TARGET,
  LIGHT_SURFACE,
  TEXT_CONTRAST_TARGET,
  formatOklch,
} from '../color/utils'

interface Props {
  tokens: GeneratedTokens
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
    <tr className="token-row">
      <td>
        <span className="token-swatch" style={{ background: token.hex }} />
      </td>
      <td>
        <code className="token-name">{token.tokenName}</code>
      </td>
      <td>
        <code className="token-hex">{token.hex}</code>
      </td>
      <td className="token-role">{token.role}</td>
      <td className="token-contrast">
        {token.contrastRatio.toFixed(2)}:1
        {token.contrastTarget && (
          <span className="contrast-target"> (≥{token.contrastTarget}:1)</span>
        )}
      </td>
      <td>{passLabel}</td>
    </tr>
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
          <span className="rules-meta__label">3:1 non-text target</span>
          <span className="rules-meta__value">
            WCAG AA for interactive controls ({INTERACTIVE_CONTRAST_TARGET}:1)
          </span>
        </div>
        <div className="rules-meta__row">
          <span className="rules-meta__label">4.5:1 text target</span>
          <span className="rules-meta__value">
            WCAG AA for normal text ({TEXT_CONTRAST_TARGET}:1)
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

export default function TokenInspector({ tokens }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(tokens.cssVariables).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section className="token-inspector">
      <h2 className="section-title">Generated color system</h2>

      <div className="token-tables">
        <div className="token-table-group">
          <h3 className="token-table-mode">☀ Light mode</h3>
          <table className="token-table">
            <thead>
              <tr>
                <th></th>
                <th>Token</th>
                <th>Value</th>
                <th>Role</th>
                <th>Contrast</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <TokenRow token={tokens.light.accent} />
              <TokenRow token={tokens.light.accentContent} />
              <TokenRow token={tokens.light.accentSoft} />
            </tbody>
          </table>
        </div>

        <div className="token-table-group">
          <h3 className="token-table-mode">◗ Dark mode</h3>
          <table className="token-table">
            <thead>
              <tr>
                <th></th>
                <th>Token</th>
                <th>Value</th>
                <th>Role</th>
                <th>Contrast</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <TokenRow token={tokens.dark.accent} />
              <TokenRow token={tokens.dark.accentContent} />
              <TokenRow token={tokens.dark.accentSoft} />
            </tbody>
          </table>
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
