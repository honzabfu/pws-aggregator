// src/hooks/useTheme.js
import { useEffect } from 'react'

export function useTheme(theme) {
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme])
}
