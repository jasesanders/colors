import { useState } from 'react'
import { generateTokens } from './color/utils'
import ColorPickerSection from './components/ColorPickerSection'
import TokenInspector from './components/TokenInspector'
import AppPreview from './components/AppPreview'

const DEFAULT_HEX = '#cc1520'

export default function App() {
  const [sourceHex, setSourceHex] = useState(DEFAULT_HEX)
  const tokens = generateTokens(sourceHex)

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
          <ColorPickerSection value={sourceHex} onChange={setSourceHex} />
          <TokenInspector tokens={tokens} />
        </div>

        <div className="preview-panel">
          <AppPreview tokens={tokens} />
        </div>
      </main>
    </div>
  )
}
