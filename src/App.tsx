import { useState } from 'react'
import { CONTRAST_STANDARDS, generateTokens, sanitizeSourceHex, type ColorStyle } from './color/utils'
import ColorPickerSection from './components/ColorPickerSection'
import TokenInspector from './components/TokenInspector'
import AppPreview from './components/AppPreview'

const DEFAULT_HEX = '#cc1520'

export default function App() {
  const [sourceHex, setSourceHex] = useState(DEFAULT_HEX)
  const [standardId, setStandardId] = useState<keyof typeof CONTRAST_STANDARDS>('AA')
  const [colorStyle, setColorStyle] = useState<ColorStyle>('solid')
  const tokens = generateTokens(sourceHex, CONTRAST_STANDARDS[standardId], colorStyle)

  function handleSourceChange(hex: string) {
    setSourceHex(sanitizeSourceHex(hex) ?? hex)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__eyebrow">CMS · Design System</div>
          <h1 className="app-header__title">Universe Color System</h1>
          <p className="app-header__subtitle">
            Proof of concept — one canonical color in, accessible role-specific tokens out.
          </p>
        </div>
      </header>

      <main className="app-main">
        <div className="cms-panel">
          <ColorPickerSection value={sourceHex} onChange={handleSourceChange} />
          <TokenInspector tokens={tokens} standardId={standardId} onStandardChange={setStandardId} />
        </div>

        <div className="preview-panel">
          <AppPreview tokens={tokens} colorStyle={colorStyle} onColorStyleChange={setColorStyle} />
        </div>
      </main>
    </div>
  )
}
