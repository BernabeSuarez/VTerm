import type { AppConfig, ConfigPatch } from '../../shared/app-config'

declare global {
  interface Window {
    terminalAPI: {
      spawn: (id: string, cols: number, rows: number, cwd?: string, profileId?: string) => Promise<{ pid: number }>
      listProfiles: () => Promise<{ id: string; name: string; description: string }[]>
      loadConfig: () => Promise<AppConfig>
      saveConfig: (patch: ConfigPatch) => Promise<AppConfig>
      write: (id: string, data: string) => void
      resize: (id: string, cols: number, rows: number) => void
      kill: (id: string) => void
      onData: (id: string, callback: (data: string) => void) => () => void
      onExit: (id: string, callback: () => void) => () => void
      onOpenFolder: (callback: (paths: string[]) => void) => () => void
    }
  }
}

export {}