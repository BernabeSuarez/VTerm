import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { AppConfig, ConfigPatch } from '../../shared/app-config'
import { themes, type AppTheme } from './themes'

const FALLBACK_CONFIG: AppConfig = {
  themeId: 'tokyo-night',
  defaultProfile: 'default',
  font: {
    family: 'Cascadia Code, Menlo, Consolas, "SF Mono", monospace',
    size: 14,
    weight: 400,
    weightBold: 700,
    cursorBlink: true
  }
}

interface ConfigContextValue {
  config: AppConfig
  loaded: boolean
  theme: AppTheme
  allThemes: AppTheme[]
  setThemeById: (id: string) => void
  setDefaultProfile: (id: string) => void
  updateFont: (patch: Partial<AppConfig['font']>) => void
}

const ConfigContext = createContext<ConfigContextValue | null>(null)

export function ConfigProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [config, setConfig] = useState<AppConfig>(FALLBACK_CONFIG)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    window.terminalAPI
      .loadConfig()
      .then((cfg) => {
        if (!active) return
        setConfig(cfg)
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])

  const theme = themes.find((t) => t.id === config.themeId) ?? themes[0]

  // Refleja los colores de UI como variables CSS para que todo el chrome
  // (tabs, bordes, fondo) se actualice junto con el terminal.
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--ui-background', theme.ui.background)
    root.style.setProperty('--ui-surface', theme.ui.surface)
    root.style.setProperty('--ui-border', theme.ui.border)
    root.style.setProperty('--ui-text', theme.ui.text)
    root.style.setProperty('--ui-text-muted', theme.ui.textMuted)
    root.style.setProperty('--ui-accent', theme.ui.accent)
  }, [theme])

  // El proceso principal fusiona el parche con la config existente y devuelve
  // el estado completo resultante, que es el que queda como fuente de verdad.
  const patchConfig = useCallback((patch: ConfigPatch): void => {
    window.terminalAPI.saveConfig(patch).then(setConfig)
  }, [])

  const setThemeById = useCallback(
    (id: string): void => {
      if (!themes.some((t) => t.id === id)) return
      patchConfig({ themeId: id })
    },
    [patchConfig]
  )

  const setDefaultProfile = useCallback(
    (id: string): void => {
      patchConfig({ defaultProfile: id })
    },
    [patchConfig]
  )

  const updateFont = useCallback(
    (patch: Partial<AppConfig['font']>): void => {
      patchConfig({ font: patch })
    },
    [patchConfig]
  )

  return (
    <ConfigContext.Provider
      value={{ config, loaded, theme, allThemes: themes, setThemeById, setDefaultProfile, updateFont }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig debe usarse dentro de un ConfigProvider')
  return ctx
}