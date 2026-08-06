import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeValue {
  theme: Theme
  toggle: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeValue>({ theme: 'light', toggle: () => {} })

const STORAGE_KEY = 'autogo:theme'

function initialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}
