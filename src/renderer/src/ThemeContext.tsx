import React, { createContext, useContext, useEffect, useState } from 'react'
import { themes, defaultTheme, type AppTheme } from './themes'

interface ThemeContextValue {
  theme: AppTheme
  setThemeById: (id: string) => void
  allThemes: AppTheme[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'terminal-app:theme-id'

export function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [theme, setTheme] = useState<AppTheme>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY)
    return themes.find((t) => t.id === savedId) ?? defaultTheme
  })

  useEffect(() => {
    // Refleja los colores de UI como variables CSS para que todo el chrome
    // (tabs, bordes, fondo) se actualice junto con el terminal.
    const root = document.documentElement
    root.style.setProperty('--ui-background', theme.ui.background)
    root.style.setProperty('--ui-surface', theme.ui.surface)
    root.style.setProperty('--ui-border', theme.ui.border)
    root.style.setProperty('--ui-text', theme.ui.text)
    root.style.setProperty('--ui-text-muted', theme.ui.textMuted)
    root.style.setProperty('--ui-accent', theme.ui.accent)
  }, [theme])

  const setThemeById = (id: string): void => {
    const next = themes.find((t) => t.id === id)
    if (!next) return
    setTheme(next)
    localStorage.setItem(STORAGE_KEY, id)
  }

  return <ThemeContext.Provider value={{ theme, setThemeById, allThemes: themes }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de un ThemeProvider')
  return ctx
}
