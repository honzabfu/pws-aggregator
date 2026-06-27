// src/hooks/useTheme.js
import { useEffect } from 'react'

const FONT_SCALES = {
  small:  0.85,
  medium: 1.0,
  large:  1.2,
  xl:     1.4,
}

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
    const scale = FONT_SCALES[fontSize] ?? 1
    document.documentElement.style.zoom = scale === 1 ? '' : String(scale)
  }, [fontSize])
}
