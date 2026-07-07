import { useState } from 'react'
import type { GeneratedTokens } from '../color/utils'

interface Props {
  tokens: GeneratedTokens
}

function PhonePreview({
  mode,
  accent,
  accentContent,
  accentSoft,
}: {
  mode: 'light' | 'dark'
  accent: string
  accentContent: string
  accentSoft: string
}) {
  const [favorited, setFavorited] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const isDark = mode === 'dark'
  const surface = isDark ? '#121212' : '#ffffff'
  const text = isDark ? '#f0f0f0' : '#111111'
  const textMuted = isDark ? '#888888' : '#666666'
  const textFaint = isDark ? '#444444' : '#cccccc'
  const border = isDark ? '#2a2a2a' : '#ebebeb'
  const cardBg = isDark ? '#1e1e1e' : '#f8f8f8'
  const navBg = isDark ? '#171717' : '#ffffff'

  const tabs = ['overview', 'updates', 'wiki']

  return (
    <div
      className="phone-frame"
      style={
        {
          '--accent': accent,
          '--accent-content': accentContent,
          '--accent-soft': accentSoft,
          '--surface': surface,
          '--text': text,
          '--text-muted': textMuted,
          '--text-faint': textFaint,
          '--border': border,
          '--card-bg': cardBg,
          '--nav-bg': navBg,
        } as React.CSSProperties
      }
    >
      <div className="phone-status-bar">
        <span style={{ color: textMuted, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
          9:41
        </span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <svg width="16" height="11" viewBox="0 0 16 11" fill={textMuted}>
            <rect x="0" y="4" width="3" height="7" rx="1" />
            <rect x="4" y="2" width="3" height="9" rx="1" />
            <rect x="8" y="0" width="3" height="11" rx="1" />
            <rect x="12" y="0" width="4" height="11" rx="1" opacity="0.3" />
          </svg>
          <svg width="15" height="11" viewBox="0 0 15 11" fill={textMuted}>
            <path d="M7.5 2.2C9.7 2.2 11.7 3.1 13.1 4.6L14.5 3.1C12.7 1.2 10.2 0 7.5 0S2.3 1.2.5 3.1l1.4 1.5C3.3 3.1 5.3 2.2 7.5 2.2z" />
            <path d="M7.5 5.5c1.4 0 2.7.6 3.6 1.5l1.4-1.5C11.2 4.1 9.4 3.3 7.5 3.3S3.8 4.1 2.5 5.5l1.4 1.5C4.8 6.1 6.1 5.5 7.5 5.5z" />
            <circle cx="7.5" cy="9.5" r="1.5" />
          </svg>
          <svg width="25" height="11" viewBox="0 0 25 11" fill="none">
            <rect
              x=".5"
              y=".5"
              width="21"
              height="10"
              rx="2.5"
              stroke={textMuted}
              strokeOpacity=".35"
            />
            <rect x="22.5" y="3.5" width="2" height="4" rx="1" fill={textMuted} fillOpacity=".4" />
            <rect x="1.5" y="1.5" width={isDark ? 14 : 18} height="8" rx="1.5" fill={accent} />
          </svg>
        </div>
      </div>

      <div
        className="phone-hero"
        style={{
          background: `linear-gradient(165deg, ${isDark ? '#1c0505' : '#2a0808'} 0%, #0a0a0a 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 40% 60%, ${accent}22 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <div className="hero-logo-mark" style={{ color: accent }}>
          <svg viewBox="0 0 80 40" fill="none" width="80" height="40">
            <text
              x="0"
              y="32"
              fontFamily="Georgia, serif"
              fontSize="36"
              fontWeight="bold"
              fill={accent}
              opacity="0.9"
            >
              RE
            </text>
          </svg>
        </div>

        <div className="hero-meta" style={{ color: '#ffffff' }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              textShadow: '0 1px 8px #00000099',
            }}
          >
            Resident Evil
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Universe</div>
        </div>
      </div>

      <div
        className="phone-meta-row"
        style={{ background: surface, borderBottom: `1px solid ${border}` }}
      >
        <div className="phone-fancount" style={{ color: textMuted, fontSize: 12 }}>
          <span style={{ color: accent, marginRight: 4 }}>★</span>
          2.4M fans · Action · Survival Horror
        </div>
        <div className="phone-actions">
          <button
            className={`btn-favorite${favorited ? ' btn-favorite--active' : ''}`}
            onClick={() => setFavorited((f) => !f)}
            style={
              {
                '--btn-accent': accent,
                '--btn-soft': accentSoft,
              } as React.CSSProperties
            }
            aria-label={favorited ? 'Unfavorite' : 'Favorite'}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={favorited ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {favorited ? 'Favorited' : 'Favorite'}
          </button>
          <button
            className="btn-secondary"
            style={{ color: textMuted, borderColor: border }}
            aria-label="More options"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="phone-tabs" style={{ background: navBg, borderBottom: `1px solid ${border}` }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`phone-tab${activeTab === tab ? ' phone-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
            style={
              {
                color: activeTab === tab ? accentContent : textMuted,
                '--tab-accent': accent,
              } as React.CSSProperties
            }
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="phone-content" style={{ background: surface }}>
        <div
          className="phone-card phone-card--accent"
          style={{
            background: accentSoft,
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: accentContent,
              marginBottom: 4,
            }}
          >
            Latest drop
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: text, lineHeight: 1.3 }}>
            Resident Evil 4 Remake
          </div>
          <div style={{ fontSize: 13, color: textMuted, marginTop: 4, lineHeight: 1.4 }}>
            Separate Ways DLC now available · Village expansion teased
          </div>
          <button
            className="card-link"
            style={{ color: accentContent, marginTop: 8, fontSize: 13, fontWeight: 600 }}
            aria-label="Read more about Resident Evil 4 Remake"
          >
            Read more →
          </button>
        </div>

        <div
          className="phone-card"
          style={{
            background: cardBg,
            borderRadius: 12,
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: textFaint,
              marginBottom: 4,
            }}
          >
            Community
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: text, lineHeight: 1.3 }}>
            Beginner&apos;s survival guide
          </div>
          <div style={{ fontSize: 13, color: textMuted, marginTop: 4, lineHeight: 1.4 }}>
            Umbrella lore, enemy weaknesses, and route planning
          </div>
        </div>
      </div>

      <div className="phone-bottom-nav" style={{ background: navBg, borderTop: `1px solid ${border}` }}>
        {[
          { label: 'Home', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', active: false },
          { label: 'Library', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20', active: false },
          { label: 'Universe', icon: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z', active: true },
          { label: 'Profile', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', active: false },
        ].map((item) => (
          <button
            key={item.label}
            className="bottom-nav-item"
            style={{ color: item.active ? accent : textFaint }}
            aria-label={item.label}
            aria-current={item.active ? 'page' : undefined}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={item.active ? 2.5 : 1.8}
            >
              <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 10, marginTop: 2 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function AppPreview({ tokens }: Props) {
  return (
    <section className="app-preview-section">
      <h2 className="section-title">Live app previews</h2>

      <p className="product-statement">
        Fandom platform surfaces are monochrome-first. Universe context provides color.
        One canonical Universe color is transformed into accessible, role-specific light and
        dark theme tokens by the design system.
      </p>

      <div className="preview-pair">
        <div className="preview-column">
          <div className="preview-mode-label">☀ Light mode</div>
          <PhonePreview
            mode="light"
            accent={tokens.light.accent.hex}
            accentContent={tokens.light.accentContent.hex}
            accentSoft={tokens.light.accentSoft.hex}
          />
        </div>
        <div className="preview-column">
          <div className="preview-mode-label">◗ Dark mode</div>
          <PhonePreview
            mode="dark"
            accent={tokens.dark.accent.hex}
            accentContent={tokens.dark.accentContent.hex}
            accentSoft={tokens.dark.accentSoft.hex}
          />
        </div>
      </div>
    </section>
  )
}
