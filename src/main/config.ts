import { app } from 'electron'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { AppConfig, ConfigPatch } from '../shared/app-config'

export const DEFAULT_CONFIG: AppConfig = {
  themeId: 'one-dark-pro',
  defaultProfile: 'default',
  font: {
    family: 'Cascadia Code, Menlo, Consolas, "SF Mono", monospace',
    size: 14,
    weight: 400,
    weightBold: 700,
    cursorBlink: true
  },
  keymaps: {}
}

function configPath(): string {
  return join(app.getPath('userData'), 'config.json')
}

export function loadConfig(): AppConfig {
  try {
    const raw = readFileSync(configPath(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppConfig>
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      font: { ...DEFAULT_CONFIG.font, ...(parsed.font ?? {}) },
      keymaps: { ...DEFAULT_CONFIG.keymaps, ...(parsed.keymaps ?? {}) }
    }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(patch: ConfigPatch): AppConfig {
  const current = loadConfig()
  const next: AppConfig = {
    ...current,
    ...patch,
    font: { ...current.font, ...(patch.font ?? {}) },
    keymaps: { ...current.keymaps, ...(patch.keymaps ?? {}) }
  }
  const file = configPath()
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(next, null, 2))
  return next
}