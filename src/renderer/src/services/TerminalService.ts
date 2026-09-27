/**
 * TerminalService actúa como una capa de abstracción sobre la terminalAPI
 * expuesta por el preload. Centraliza la comunicación IPC y proporciona
 * un tipado fuerte y manejo de errores consistente.
 */
export const TerminalService = {
  async spawnTerminal(id: string, cols: number, rows: number, cwd?: string, profileId?: string) {
    try {
      return await window.terminalAPI.spawn(id, cols, rows, cwd, profileId)
    } catch (error) {
      console.error(`[TerminalService] Failed to spawn terminal ${id}:`, error)
      throw error
    }
  },

  async listProfiles() {
    try {
      return await window.terminalAPI.listProfiles()
    } catch (error) {
      console.error('[TerminalService] Failed to list profiles:', error)
      return []
    }
  },

  async getConfig() {
    try {
      return await window.terminalAPI.loadConfig()
    } catch (error) {
      console.error('[TerminalService] Failed to load config:', error)
      throw error
    }
  },

  async saveConfig(patch: any) {
    try {
      return await window.terminalAPI.saveConfig(patch)
    } catch (error) {
      console.error('[TerminalService] Failed to save config:', error)
      throw error
    }
  },

  write(id: string, data: string) {
    window.terminalAPI.write(id, data)
  },

  resize(id: string, cols: number, rows: number) {
    window.terminalAPI.resize(id, cols, rows)
  },

  kill(id: string) {
    window.terminalAPI.kill(id)
  },

  onData(id: string, callback: (data: string) => void) {
    return window.terminalAPI.onData(id, callback)
  },

  onExit(id: string, callback: () => void) {
    return window.terminalAPI.onExit(id, callback)
  },

  onOpenFolder(callback: (paths: string[]) => void) {
    return window.terminalAPI.onOpenFolder(callback)
  },

  onNotify(callback: (notification: { type: 'error' | 'info'; message: string }) => void) {
    return window.terminalAPI.onNotify(callback)
  }
}
