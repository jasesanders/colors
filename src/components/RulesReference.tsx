import {
  ACHROMATIC_CHROMA_EPSILON,
  BUTTON_GRADIENT_SPREAD,
  CONTRAST_STANDARDS,
  DARK_BUTTON_MIN_SURFACE_CONTRAST,
  DARK_SURFACE,
  GRADIENT_ANGLE_DEG,
  LIGHT_SURFACE,
  MIN_CARD_VS_BUTTON_CONTRAST,
  SURFACE_GRADIENT_SPREAD,
} from '../color/utils'
import { CHROMA_MIN, HUE_BUCKETS, SAMPLE_SIZE } from '../color/cardImages'

function RuleRow({
  title,
  threshold,
  children,
}: {
  title: string
  threshold?: string
  children: React.ReactNode
}) {
  return (
    <div className="rule-row">
      <div className="rule-row__header">
        <h4 className="rule-row__title">{title}</h4>
        {threshold && <span className="rule-row__threshold">{threshold}</span>}
      </div>
      <p className="rule-row__body">{children}</p>
    </div>
  )
}

function RuleGroup({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rule-group">
      <div className="rule-group__heading">
        <div className="rule-group__eyebrow">{eyebrow}</div>
        <h3 className="rule-group__title">{title}</h3>
      </div>
      <div className="rule-group__body">{children}</div>
    </div>
  )
}

export default function RulesReference() {
  const aa = CONTRAST_STANDARDS.AA
  const aaa = CONTRAST_STANDARDS.AAA
  const aaaPlus = CONTRAST_STANDARDS.AAA_PLUS

  return (
    <section className="rules-reference">
      <div className="rules-reference__intro">
        <div className="section-label">Reference</div>
        <h2 className="section-title">How this all works</h2>
        <p className="section-description">
          Every rule this POC applies to go from "one color" or "one image" to a full,
          accessible set of tokens — in plain language. It's really just a handful of
          contrast thresholds plus one repeated move: nudge lightness (and, if needed,
          chroma) until a rule passes, changing as little as possible. Set the thresholds
          once, and everything below cascades automatically.
        </p>
      </div>

      <RuleGroup eyebrow="The baseline" title="Contrast standards">
        <div className="rules-table-wrap">
          <table className="rules-table">
            <thead>
              <tr>
                <th>Standard</th>
                <th>Text / colored icons</th>
                <th>Non-text UI (buttons, borders)</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{aa.label}</td>
                <td>≥{aa.textTarget}:1</td>
                <td>≥{aa.interactiveTarget}:1</td>
                <td>The standard web accessibility baseline.</td>
              </tr>
              <tr>
                <td>{aaa.label}</td>
                <td>≥{aaa.textTarget}:1</td>
                <td>≥{aaa.interactiveTarget}:1</td>
                <td>
                  WCAG has no official non-text figure at AAA — this borrows AA's text
                  target as a stricter proxy.
                </td>
              </tr>
              <tr>
                <td>{aaaPlus.label}</td>
                <td>≥{aaaPlus.textTarget}:1</td>
                <td>≥{aaaPlus.interactiveTarget}:1</td>
                <td>
                  Not an official WCAG level — a firmer floor for buttons/controls, past
                  what any spec requires.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="rule-group__footnote">
          Every ratio below is measured with the same formula browsers and tools like
          Lighthouse use: relative luminance of each color, compared as{' '}
          <code>(lighter + 0.05) / (darker + 0.05)</code>. Two surfaces never change:
          the light surface is always <code>{LIGHT_SURFACE}</code>, the dark surface is
          always <code>{DARK_SURFACE}</code>.
        </p>
      </RuleGroup>

      <RuleGroup eyebrow="One color in" title="Universe accent color → tokens">
        <RuleRow title="Interactive controls (accent)" threshold="≥ interactive target, vs. the page surface">
          Darkened for the light theme / lightened for the dark theme — only as far as
          needed to clear the active standard's non-text target.
        </RuleRow>
        <RuleRow title="Colored text &amp; icons (accent-content)" threshold="≥ text target, vs. the page surface">
          Same mechanism as the row above, just aimed at the stricter text target instead
          of the non-text one.
        </RuleRow>
        <RuleRow title="Soft background tint (accent-soft)" threshold="No contrast requirement">
          It's a background, not foreground content, so there's nothing to pass — instead
          it follows a fixed recipe: lightness pinned near white (96%) for light mode or
          near black (18%) for dark mode, with chroma capped low so it stays a subtle
          tint rather than a loud block of color.
        </RuleRow>
        <RuleRow title="Filled / primary button" threshold={`≥ text target with solid black or white text`}>
          Whichever of black or white text already works on the source color is used
          as-is. If neither does, lightness is nudged toward whichever direction (lighter
          for black text, darker for white text) needs the smaller change.
        </RuleRow>
        <RuleRow
          title="Dark button visibility floor"
          threshold={`≥${DARK_BUTTON_MIN_SURFACE_CONTRAST}:1 vs. the dark surface`}
        >
          A button dark enough to pair with white text can still be nearly invisible
          sitting on a near-black page. This is a floor for "can you tell the button is
          there," separate from text legibility — and it's capped so it never lightens
          past the point where its own white text would drop below target.
        </RuleRow>
        <RuleRow
          title="Near-white / near-black source colors"
          threshold={`chroma < ${ACHROMATIC_CHROMA_EPSILON}`}
        >
          A source this close to fully gray has no usable hue to work with, so it's
          snapped to a slightly-off-white or slightly-off-black neutral instead of a
          literal pure white or black — keeping it just barely visible against the
          surfaces it needs to sit on.
        </RuleRow>
        <RuleRow title="Out-of-gamut colors">
          Darkening or lightening a saturated color can overshoot what a screen can
          actually display (the sRGB gamut). When that happens, chroma is reduced just
          enough to bring the color back in range — never lightness, so the contrast
          math done above stays valid.
        </RuleRow>
        <RuleRow
          title="Gradient style"
          threshold={`±${(BUTTON_GRADIENT_SPREAD * 100) / 2}% buttons · ±${(SURFACE_GRADIENT_SPREAD * 100) / 2}% surfaces`}
        >
          When gradient mode is on, each token gets a {GRADIENT_ANGLE_DEG}° lightness
          spread centered on its own already-accessible color — a wider spread for
          buttons/outlines, a subtler one for background surfaces. Colored text never
          gets a gradient, so it stays flat and legible.
        </RuleRow>
      </RuleGroup>

      <RuleGroup eyebrow="One image in" title="Card colors → accessible gradient">
        <RuleRow
          title="Dominant hue extraction"
          threshold={`${SAMPLE_SIZE}×${SAMPLE_SIZE} sample · ${HUE_BUCKETS} hue buckets`}
        >
          The image is downscaled and sorted into {HUE_BUCKETS} hue buckets (15° each).
          Each pixel's vote is weighted by its own chroma, so vivid pixels count far more
          than washed-out ones — pixels below {CHROMA_MIN} chroma are ignored entirely.
          The heaviest bucket wins, and its pixels are averaged into one representative
          color. A fully gray image falls back to an average brightness with no hue.
        </RuleRow>
        <RuleRow title="Card background accessibility" threshold="≥ text target vs. white">
          The extracted hue is treated as a background with fixed white text/metadata on
          top, and darkened — the same mechanism as the accent-content rule above — until
          that text clears the active standard's text target.
        </RuleRow>
        <RuleRow
          title="CTA button vs. card background"
          threshold={`≥${MIN_CARD_VS_BUTTON_CONTRAST}:1 vs. the button color`}
        >
          If the Universe's button color sits too close (in luminance — not necessarily
          hue) to the card's own derived background, the card background is darkened and
          mildly desaturated further until the button reads as a distinct shape. The
          button itself is never touched — it's a shared, Universe-level token used
          elsewhere too.
        </RuleRow>
      </RuleGroup>

      <p className="rules-reference__closing">
        That's the whole ruleset. No hidden heuristics — just a short list of thresholds
        and one repeated move (nudge toward the target, prefer the smallest change,
        never break another constraint) applied a handful of times.
      </p>
    </section>
  )
}
