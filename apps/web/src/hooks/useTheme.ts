import { useState, useEffect } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'trauma-platform-theme'
const THEME_EVENT = 'themechange'

function getInitialTheme(): Theme {
  // 1. Persisted preference
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // localStorage unavailable (e.g. SSR / private mode)
  }

  // 2. System preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light'
    }
  }

  // 3. Default to dark
  return 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore
  }
  // Emit custom event so map components can switch tile layers
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme } }))
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // Apply on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}

// Helper to read current theme without the hook (for map components, etc.)
export function getCurrentTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // ignore
  }
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

// Helper to get the correct tile URL based on current theme
export function getMapTileUrl(theme: Theme): string {
  return theme === 'light'
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
}
