// src/hooks/useTheme.js
import { useEffect } from 'react'

const FONT_SCALES = {
  small:  0.85,
  medium: 1.0,
  large:  1.2,
  xl:     1.4,
}

// Status-bar / address-bar tint per theme. Light keeps the sky-blue accent;
// dark uses the surface colour so the bar blends with the header instead of
// flashing a bright band above a near-black app.
const THEME_COLORS = { light: '#0ea5e9', dark: '#0f172a' }

export function useTheme(theme, fontSize = 'medium') {
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme])

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme
      meta.setAttribute('content', THEME_COLORS[resolved] ?? THEME_COLORS.light)
    }
    apply()
    // Only the 'system' setting needs to follow OS changes live.
    if (theme === 'system') {
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  useEffect(() => {
    const scale = FONT_SCALES[fontSize] ?? 1
    // Scale typography only (rem base), not the whole box model — using `zoom`
    // here magnified widths/padding too and pushed the layout off narrow screens.
    document.documentElement.style.fontSize = scale === 1 ? '' : `${16 * scale}px`
  }, [fontSize])
}
